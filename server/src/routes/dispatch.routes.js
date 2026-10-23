const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatch.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// Dispatch Planning V1
router.route('/planning')
  .get(dispatchController.getAllPlans)
  .post(requirePermission('Dispatch', 'create'), dispatchController.createPlan);
router.route('/planning/:id')
  .put(requirePermission('Dispatch', 'update'), dispatchController.updatePlan);

// Dispatch Planning V2 Architecture
router.get('/v2/planning', requirePermission('Dispatch', 'read'), dispatchController.getV2DeliveryPlans);
router.post('/v2/planning', requirePermission('Dispatch', 'create'), dispatchController.createV2DeliveryPlan);
router.post('/v2/planning/:id/schedule', requirePermission('Dispatch', 'update'), dispatchController.scheduleV2DeliveryPlan);
router.post('/v2/planning/:id/assign', requirePermission('Dispatch', 'update'), dispatchController.assignV2Vehicle);

// Dispatch Execution V1
router.route('/execution')
  .get(dispatchController.getAllExecutions)
  .post(requirePermission('Dispatch', 'create'), dispatchController.recordExecution); // acts as upsert

// Dispatch Execution V2 Architecture
router.get('/v2/execution', requirePermission('Dispatch', 'read'), dispatchController.getV2DispatchExecutions);
router.post('/v2/execution', requirePermission('Dispatch', 'create'), dispatchController.initiateV2DispatchExecution);
router.post('/v2/execution/:id/packing', requirePermission('Dispatch', 'update'), dispatchController.updateV2PackingPhase);
router.post('/v2/execution/:id/loading', requirePermission('Dispatch', 'update'), dispatchController.updateV2LoadingPhase);
router.post('/v2/execution/:id/confirm', requirePermission('Dispatch', 'update'), dispatchController.confirmV2Dispatch);

// Delivery Tracking V1
router.route('/tracking')
  .get(dispatchController.getAllTrackings);
router.route('/tracking/:id')
  .put(requirePermission('Dispatch', 'update'), dispatchController.updateTracking);
router.route('/tracking/:id/confirm')
  .put(requirePermission('Dispatch', 'update'), dispatchController.confirmDelivery);

// Delivery Tracking V2 Architecture
router.get('/v2/tracking', requirePermission('Dispatch', 'read'), dispatchController.getV2DeliveryTrackings);
router.post('/v2/tracking/:id/milestone', requirePermission('Dispatch', 'update'), dispatchController.addV2TrackingMilestone);
router.post('/v2/tracking/:id/handover', requirePermission('Dispatch', 'update'), dispatchController.confirmV2DeliveryHandover);

module.exports = router;
