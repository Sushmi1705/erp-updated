const express = require('express');
const { getAuditLogs, getLoginHistory } = require('../controllers/audit.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/logs', requirePermission('Audit', 'read'), getAuditLogs);
router.get('/login-history', requirePermission('Audit', 'read'), getLoginHistory);

module.exports = router;
