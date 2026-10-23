const { handleError } = require('../utils/errorHandler');
const { AuditLog, LoginHistory } = require('../models/Audit');

// @desc    Get all audit logs
// @route   GET /api/audit/logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('changedBy', 'firstName lastName email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get login history
// @route   GET /api/audit/login-history
// @access  Private/Admin
exports.getLoginHistory = async (req, res) => {
  try {
    const history = await LoginHistory.find().populate('userId', 'firstName lastName email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    handleError(res, error);
  }
};
