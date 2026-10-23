const { handleError } = require('../utils/errorHandler');
const User = require('../models/User');
const Role = require('../models/Role');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
/* Names for a dropdown — nothing more. Open to any signed-in user, unlike the
 * full list above, which carries emails, statuses and plant assignments and
 * stays Super Admin only. `name` is composed here because the model stores
 * first and last separately and every dropdown was reading a field that did
 * not exist, showing blank options to admins too. */
exports.getUserDirectory = async (req, res) => {
  try {
    const users = await User.find({ status: 'Active' })
      .select('firstName lastName email')
      .sort({ firstName: 1, lastName: 1 })
      .lean();
    const data = users.map(u => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      email: u.email
    }));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    handleError(res, error);
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('role', 'name')
      .populate('plantId branchId businessUnitId');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    handleError(res, error);
  }
};

// Helper to sanitize ObjectId fields
const cleanObjectId = (val) => (val && val !== '' && val !== 'null' ? val : undefined);

// @desc    Create a user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, roleId, plantId, branchId, businessUnitId, phone } = req.body;

    if (!email || !password || !firstName || !lastName || !roleId) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(400).json({ success: false, message: 'Invalid role selected' });
    }

    const userData = {
      firstName,
      lastName,
      email: normalizedEmail,
      phone: phone || '',
      password,
      role: roleId,
      createdBy: req.user?._id || req.user?.id
    };

    const cPlant = cleanObjectId(plantId);
    const cBranch = cleanObjectId(branchId);
    const cBu = cleanObjectId(businessUnitId);

    if (cPlant) userData.plantId = cPlant;
    if (cBranch) userData.branchId = cBranch;
    if (cBu) userData.businessUnitId = cBu;

    const user = await User.create(userData);

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, roleId, plantId, branchId, businessUnitId, password, phone } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase().trim();
    if (roleId) user.role = roleId;
    if (password) user.password = password;
    if (phone !== undefined) user.phone = phone;

    user.plantId = cleanObjectId(plantId) || undefined;
    user.branchId = cleanObjectId(branchId) || undefined;
    user.businessUnitId = cleanObjectId(businessUnitId) || undefined;

    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Reset user password by admin
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    if (user.status === 'Locked') user.status = 'Active';
    await user.save();
    res.status(200).json({ success: true, message: `Password reset successfully for ${user.firstName} ${user.lastName}` });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Active', 'Inactive', 'Suspended', 'Locked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { status },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleError(res, error);
  }
};
