const express = require('express');
const router = express.Router();
const capacityController = require('../controllers/capacity.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// ================= CAPACITY PLANNING ENGINE (CRP) =================
router.get('/periods', requirePermission('Capacity', 'read'), capacityController.getAllCapacityPeriods);
router.post('/periods', requirePermission('Capacity', 'create'), capacityController.createCapacityPeriod);

router.get('/periods/:periodId/loads', requirePermission('Capacity', 'read'), capacityController.getLoadDetails);
router.post('/loads', requirePermission('Capacity', 'create'), capacityController.createLoadDetail);

router.post('/periods/:periodId/overtime', requirePermission('Capacity', 'update'), capacityController.recordOvertime);
router.post('/simulate-reschedule', requirePermission('Capacity', 'update'), capacityController.simulateReschedule);
router.get('/validate-scheduling', requirePermission('Capacity', 'read'), capacityController.validateScheduling);


// ================= LABOR CAPACITY ENGINE (Workforce Planning) =================
router.get('/labor-periods', requirePermission('Capacity', 'read'), capacityController.getAllLaborPeriods);
router.post('/labor-periods', requirePermission('Capacity', 'create'), capacityController.createLaborPeriod);

router.get('/labor-periods/:periodId/loads', requirePermission('Capacity', 'read'), capacityController.getLaborLoadDetails);
router.post('/labor-loads', requirePermission('Capacity', 'create'), capacityController.createLaborLoadDetail);

router.post('/labor-periods/:periodId/workforce-plan', requirePermission('Capacity', 'update'), capacityController.planWorkforce);
router.post('/simulate-labor-reschedule', requirePermission('Capacity', 'update'), capacityController.simulateLaborReschedule);

// ================= Production Scheduling & Dispatch =================
router.get('/schedules', requirePermission('Capacity', 'read'), capacityController.getAllSchedules);
router.post('/schedules', requirePermission('Capacity', 'create'), capacityController.createSchedule);
router.put('/schedules/:id', requirePermission('Capacity', 'update'), capacityController.updateSchedule);
router.delete('/schedules/:id', requirePermission('Capacity', 'delete'), capacityController.deleteSchedule);
router.post('/schedules/:id/convert-to-wo', requirePermission('Capacity', 'update'), capacityController.convertToWorkOrder);
router.post('/schedules/auto-sequence', requirePermission('Capacity', 'update'), capacityController.autoSequenceSchedule);
router.get('/dispatch-list', requirePermission('Capacity', 'read'), capacityController.getDispatchList);

module.exports = router;
