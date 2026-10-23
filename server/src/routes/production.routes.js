const express = require('express');
const router = express.Router();
const productionController = require('../controllers/production.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// Production Planning
router.get('/plan', requirePermission('Production', 'read'), productionController.getAllPlans);
router.post('/plan', requirePermission('Production', 'create'), productionController.createPlan);
router.put('/plan/:id', requirePermission('Production', 'update'), productionController.updatePlan);
router.post('/plan/:id/validate', requirePermission('Production', 'create'), productionController.validateCapacity);

// Work Order Management & Execution
router.get('/wo', requirePermission('Production', 'read'), productionController.getAllWorkOrders);
router.post('/wo', requirePermission('Production', 'create'), productionController.createWorkOrder);
router.put('/wo/:id', requirePermission('Production', 'update'), productionController.updateWorkOrder);

// Material Allocation
router.post('/wo/allocation', requirePermission('Production', 'create'), productionController.updateMaterialAllocation);

// Production Output
router.get('/output', requirePermission('Production', 'read'), productionController.getAllOutputs);
router.post('/output', requirePermission('Production', 'create'), productionController.recordOutput);

// Production Planning V2 Architecture
router.get('/v2/production-plan', requirePermission('Production', 'read'), productionController.getV2Plans);
router.post('/v2/production-plan', requirePermission('Production', 'create'), productionController.createV2Plan);
router.post('/v2/production-plan/seed-dummy', requirePermission('Production', 'create'), productionController.seedV2DemoPlans);
router.put('/v2/production-plan/:id/validate', requirePermission('Production', 'update'), productionController.validateV2PlanCapacity);
router.put('/v2/production-plan/:id/approve', requirePermission('Production', 'update'), productionController.approveV2Plan);
router.put('/v2/production-plan/:id/release', requirePermission('Production', 'update'), productionController.releaseV2Plan);
router.post('/v2/production-plan/:id/generate-wos', requirePermission('Production', 'create'), productionController.generateV2WorkOrdersFromPlan);
router.get('/v2/production-plan/:id/capacity', requirePermission('Production', 'read'), productionController.getV2PlanCapacityBreakdown);

// Work Order Management V2 Architecture
router.get('/v2/work-orders', requirePermission('Production', 'read'), productionController.getV2WorkOrders);
router.post('/v2/work-orders/generate', requirePermission('Production', 'create'), productionController.createV2WorkOrder);
router.put('/v2/work-orders/:id/progress', requirePermission('Production', 'update'), productionController.updateV2WorkOrderProgress);
router.put('/v2/work-orders/:id/release', requirePermission('Production', 'update'), productionController.releaseV2WorkOrder);
router.put('/v2/work-orders/:id/close', requirePermission('Production', 'update'), productionController.closeV2WorkOrder);

// Material Allocation V2 Architecture
router.get('/v2/material-allocation', requirePermission('Production', 'read'), productionController.getV2MaterialAllocations);
router.put('/v2/material-allocation/:id/process', requirePermission('Production', 'update'), productionController.processV2MaterialAllocation);

// Production Execution V2 Architecture (Shop Floor)
router.get('/v2/execution-run', requirePermission('Production', 'read'), productionController.getV2ExecutionRuns);
router.post('/v2/execution-run/start', requirePermission('Production', 'create'), productionController.startV2ExecutionRun);
router.put('/v2/execution-run/:id/complete', requirePermission('Production', 'update'), productionController.completeV2ExecutionRun);
router.put('/v2/execution-run/operation/:id', requirePermission('Production', 'update'), productionController.updateV2RoutingOperation);
router.post('/v2/execution-run/operation/:id/labor', requirePermission('Production', 'update'), productionController.logV2LaborTime);
router.post('/v2/execution-run/operation/:id/machine', requirePermission('Production', 'update'), productionController.logV2MachineTime);
router.post('/v2/execution-run/operation/:id/quality', requirePermission('Production', 'update'), productionController.logV2Quality);

// Production Output V2 Architecture
router.get('/v2/output', requirePermission('Production', 'read'), productionController.getV2ProductionOutputs);
router.post('/v2/output', requirePermission('Production', 'create'), productionController.createV2ProductionOutput);
router.put('/v2/output/:id/post', requirePermission('Production', 'update'), productionController.postV2ProductionOutput);

module.exports = router;
