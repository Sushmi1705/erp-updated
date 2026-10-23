const express = require('express');
const { 
  getPendingApprovals, 
  getApprovalStats,
  getApprovalHistory,
  getApprovalById,
  approveRequest, 
  rejectRequest,
  bulkApprove,
  bulkReject,
  getConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
  toggleConfigStatus,
  seedDefaultConfigs
} = require('../controllers/approval.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

const router = express.Router();

// ── Personal Approval Inbox & Operational Endpoints ───────────────────────────
// Accessible to authenticated users; personal filtering & role authorization
// are strictly enforced within controllers and the approval matrix.
router.get('/pending', protect, getPendingApprovals);
router.get('/stats', protect, getApprovalStats);
router.get('/history', protect, getApprovalHistory);
router.post('/bulk-approve', protect, bulkApprove);
router.post('/bulk-reject', protect, bulkReject);

// ── Routing Configuration Behind "Who Can Approve What" ───────────────────────
router.get('/config', protect, requirePermission('Approvals', 'read'), getConfigs);
router.post('/config/seed-defaults', protect, requirePermission('Approvals', 'create'), seedDefaultConfigs);
router.post('/config', protect, requirePermission('Approvals', 'create'), createConfig);
router.patch('/config/:id/toggle', protect, requirePermission('Approvals', 'update'), toggleConfigStatus);
router.put('/config/:id', protect, requirePermission('Approvals', 'update'), updateConfig);
router.delete('/config/:id', protect, requirePermission('Approvals', 'delete'), deleteConfig);

// ── Single Request Endpoints (Must be registered after fixed-path routes) ──────
router.get('/:id', protect, getApprovalById);
router.post('/:id/approve', protect, approveRequest);
router.post('/:id/reject', protect, rejectRequest);

module.exports = router;
