const express = require('express');
const { login, logout, getMe, updatePassword, forgotPassword, resetPassword, forceUpdatePassword, refresh } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

router.post('/login', authLimiter, login);
router.post('/refresh', refresh);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.post('/force-update-password', forceUpdatePassword);
router.post('/forgotpassword', authLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
