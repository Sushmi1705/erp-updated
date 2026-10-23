const { handleError } = require('../utils/errorHandler');
const User = require('../models/User');
const { LoginHistory } = require('../models/Audit');
const { generateToken, generateRefreshToken, requiredSecret } = require('../utils/generateToken');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const { extractToken, revokeToken, isTokenRevoked, clearRevocation } = require('../middlewares/auth.middleware');

const MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5');
const LOCK_DURATION_MS = parseInt(process.env.LOGIN_LOCK_DURATION_MS || String(30 * 60 * 1000));
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

// The live site is served over plain HTTP, and browsers refuse to STORE a
// `Secure` cookie over HTTP — which silently dropped the refresh-token cookie
// and killed every session once the 15-minute access token expired (a submit
// would then fail with a bare 401). Derive the flags from the actual request
// protocol rather than NODE_ENV, so cookies persist over HTTP now and tighten
// automatically the day the site moves to HTTPS. Client and API are same-origin
// behind nginx, so 'lax' is correct and 'none' (which forces Secure) is not.
const sessionCookieOptions = (req) => {
  const https = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return { httpOnly: true, secure: https, sameSite: https ? 'none' : 'lax' };
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password').populate('role');

    if (!user) {
      await LoginHistory.create({ email, status: 'Failed', ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Auto-unlock only a lock this app applied itself, which is the only kind that
    // carries an expiry. An admin lock via PUT /users/:id/status writes status
    // alone, so it has no lockUntil and must stay in force until an admin lifts it.
    if (user.status === 'Locked' && user.lockUntil && user.lockUntil <= Date.now()) {
      user.status = 'Active';
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
    }

    // status is the system's actual access gate (auth.middleware checks it on every
    // request), so every non-Active state has to be refused here, not just 'Locked'.
    if (user.status !== 'Active') {
      await LoginHistory.create({ userId: user._id, email, status: 'Failed', ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      const message = user.status === 'Locked'
        ? 'Account is locked. Please contact administrator.'
        : 'Account is not active. Please contact administrator.';
      return res.status(403).json({ success: false, message });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.status = 'Locked';
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await user.save();
      await LoginHistory.create({ userId: user._id, email, status: 'Failed', ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // status is deliberately not written here: we only reach this point when it is
    // already 'Active', and forcing it would erase an admin-applied restriction.
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = Date.now();
    await user.save();
    
    await LoginHistory.create({ userId: user._id, email, status: 'Success', ipAddress: req.ip, userAgent: req.headers['user-agent'] });

    const isPasswordExpired = user.passwordChangedAt && (Date.now() - new Date(user.passwordChangedAt).getTime() > NINETY_DAYS);

    if (isPasswordExpired) {
      const tempToken = jwt.sign({ tempId: user._id }, requiredSecret('JWT_SECRET'), { expiresIn: '15m' });
      return res.status(200).json({
        success: true,
        requirePasswordChange: true,
        tempToken,
        email: user.email
      });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    clearRevocation(token);
    clearRevocation(refreshToken);

    const cookieOpts = sessionCookieOptions(req);
    res.cookie('token', token, { ...cookieOpts, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(200).json({
      success: true,
      token,
      // Returned to the client so it can refresh from localStorage — the cookie
      // cannot be relied on over HTTP.
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role?.name,
        permissions: user.role?.permissions
      }
    });

  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
  try {
    // Body first: the SPA holds the refresh token in localStorage because the
    // Secure cookie does not persist over HTTP. Cookie is the fallback.
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    // Otherwise a refresh token replayed after logout would mint a fresh session.
    if (isTokenRevoked(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const refreshSecret = requiredSecret('JWT_REFRESH_SECRET');
    const decoded = jwt.verify(refreshToken, refreshSecret);
    
    const user = await User.findById(decoded.id).populate('role');
    if (!user || user.status !== 'Active') {
      return res.status(401).json({ success: false, message: 'Invalid refresh token or user not active' });
    }
    
    const newToken = generateToken(user._id);
    clearRevocation(newToken);

    res.cookie('token', newToken, { ...sessionCookieOptions(req), maxAge: 24 * 60 * 60 * 1000 });
    res.status(200).json({ success: true, token: newToken });
  } catch (error) {
    // An expired or tampered token is the expected way to land here. Anything
    // else — a missing import, a database outage — must not hide behind the
    // same 401: after the secrets clean-up every session silently ended at
    // fifteen minutes because a ReferenceError was being reported as a bad token.
    if (!['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(error.name)) {
      console.error('[AUTH] refresh failed for a reason other than the token:', error);
    }
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await LoginHistory.create({ userId: req.user._id, email: req.user.email, status: 'Logout', ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    }

    // Clearing the cookies alone does not end the session: the SPA sends the token
    // from localStorage as a Bearer header, and a stateless JWT stays valid until
    // exp. Denylist both tokens so protect() and refresh() reject them from here on.
    revokeToken(extractToken(req));
    revokeToken(req.cookies && req.cookies.refreshToken);

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    
    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // protect() already loaded this user with `role` populated — re-querying here
    // cost two extra DB round trips on the request that gates the whole app boot.
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({ success: false, message: 'Password is incorrect' });
    }

    user.password = req.body.newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // Generic response to prevent email enumeration
    const successMessage = 'If an account with that email exists, a reset link has been sent.';
    
    if (!user) {
      return res.status(200).json({ success: true, message: successMessage });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`;
    const emailSent = await emailService.sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({ success: true, message: successMessage });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    user.password = req.body.password;
    user.passwordChangedAt = Date.now();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Force update password for expired passwords
// @route   POST /api/auth/force-update-password
// @access  Public
exports.forceUpdatePassword = async (req, res) => {
  try {
    const { tempToken, currentPassword, newPassword } = req.body;

    if (!tempToken || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, requiredSecret('JWT_SECRET'));
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }

    const user = await User.findById(decoded.tempId).select('+password').populate('role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    clearRevocation(token);
    clearRevocation(refreshToken);

    const cookieOpts = sessionCookieOptions(req);
    res.cookie('token', token, { ...cookieOpts, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role?.name,
        permissions: user.role?.permissions
      }
    });

  } catch (error) {
    handleError(res, error);
  }
};
