const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// Preventive Maintenance V1
router.get('/preventive', requirePermission('Maintenance', 'read'), maintenanceController.getAllPreventive);
router.post('/preventive', requirePermission('Maintenance', 'create'), maintenanceController.createPreventive);
router.put('/preventive/:id', requirePermission('Maintenance', 'update'), maintenanceController.updatePreventive);

// Preventive Maintenance V2 Architecture
router.get('/v2/preventive', requirePermission('Maintenance', 'read'), maintenanceController.getV2PMSchedules);
router.post('/v2/preventive', requirePermission('Maintenance', 'create'), maintenanceController.createV2PMSchedule);
router.put('/v2/preventive/:id/status', requirePermission('Maintenance', 'update'), maintenanceController.updateV2PMStatus);
router.post('/v2/preventive/:id/spares', requirePermission('Maintenance', 'update'), maintenanceController.logV2PMSpares);

// Breakdown Maintenance V1
router.get('/breakdown', requirePermission('Maintenance', 'read'), maintenanceController.getAllBreakdowns);
router.post('/breakdown', requirePermission('Maintenance', 'create'), maintenanceController.reportBreakdown);
router.put('/breakdown/:id', requirePermission('Maintenance', 'update'), maintenanceController.updateBreakdown);

// Breakdown Maintenance V2 Architecture
router.get('/v2/breakdown', requirePermission('Maintenance', 'read'), maintenanceController.getV2Breakdowns);
router.post('/v2/breakdown', requirePermission('Maintenance', 'create'), maintenanceController.reportV2Breakdown);
router.post('/v2/breakdown/:id/repair-log', requirePermission('Maintenance', 'update'), maintenanceController.addV2RepairLog);
router.post('/v2/breakdown/:id/spares', requirePermission('Maintenance', 'update'), maintenanceController.logV2BDSpares);
router.put('/v2/breakdown/:id/status', requirePermission('Maintenance', 'update'), maintenanceController.updateV2BreakdownStatus);

// Spare Parts Management V1
router.get('/sparepart', requirePermission('Maintenance', 'read'), maintenanceController.getAllSpareParts);
router.get('/sparepart/inventory', requirePermission('Maintenance', 'read'), maintenanceController.getSparePartInventory);
router.post('/sparepart', requirePermission('Maintenance', 'create'), maintenanceController.recordSparePartTransaction);

// Spare Parts Management V2 Architecture
router.get('/v2/sparepart/ledger', requirePermission('Maintenance', 'read'), maintenanceController.getV2SparePartLedger);
router.get('/v2/sparepart/activity', requirePermission('Maintenance', 'read'), maintenanceController.getV2SparePartActivities);
router.post('/v2/sparepart/activity', requirePermission('Maintenance', 'create'), maintenanceController.recordV2PartActivity);

// Analytics V1 & V2
router.get('/analytics', requirePermission('Maintenance', 'read'), maintenanceController.getAnalytics);
router.get('/v2/analytics', requirePermission('Maintenance', 'read'), maintenanceController.getV2MaintenanceAnalytics);

module.exports = router;
