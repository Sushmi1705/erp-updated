const express = require('express');
const router = express.Router();
const shopfloorController = require('../controllers/shopfloor.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// Operator Management V1
router.get('/operator', requirePermission('ShopFloor', 'read'), shopfloorController.getAllOperators);
router.post('/operator', requirePermission('ShopFloor', 'create'), shopfloorController.assignOperator);
router.put('/operator/:id', requirePermission('ShopFloor', 'update'), shopfloorController.updateOperator);

// Operator Management V2 Architecture
router.get('/v2/operator', requirePermission('ShopFloor', 'read'), shopfloorController.getV2Operators);
router.post('/v2/operator', requirePermission('ShopFloor', 'create'), shopfloorController.createV2Operator);
router.post('/v2/operator/:id/shift', requirePermission('ShopFloor', 'update'), shopfloorController.assignV2Shift);
router.post('/v2/operator/:id/allocate', requirePermission('ShopFloor', 'update'), shopfloorController.allocateV2Task);
router.put('/v2/operator/:id/productivity', requirePermission('ShopFloor', 'update'), shopfloorController.calculateV2Productivity);

// Machine Utilization V1
router.get('/machine', requirePermission('ShopFloor', 'read'), shopfloorController.getAllMachines);
router.post('/machine', requirePermission('ShopFloor', 'create'), shopfloorController.allocateMachine);
router.put('/machine/:id', requirePermission('ShopFloor', 'update'), shopfloorController.updateMachine);

// Machine Utilization V2 Architecture
router.get('/v2/machine', requirePermission('ShopFloor', 'read'), shopfloorController.getV2MachineStates);
router.post('/v2/machine/allocate', requirePermission('ShopFloor', 'create'), shopfloorController.allocateV2Machine);
router.put('/v2/machine/:id/running', requirePermission('ShopFloor', 'update'), shopfloorController.setV2MachineRunning);
router.put('/v2/machine/:id/idle', requirePermission('ShopFloor', 'update'), shopfloorController.logV2MachineIdle);
router.put('/v2/machine/:id/release', requirePermission('ShopFloor', 'update'), shopfloorController.releaseV2MachineAllocation);

// Downtime Management V1
router.get('/downtime', requirePermission('ShopFloor', 'read'), shopfloorController.getAllDowntimes);
router.post('/downtime', requirePermission('ShopFloor', 'create'), shopfloorController.recordDowntime);
router.put('/downtime/:id', requirePermission('ShopFloor', 'update'), shopfloorController.updateDowntime);

// Downtime Management V2 Architecture
router.get('/v2/downtime', requirePermission('ShopFloor', 'read'), shopfloorController.getV2Downtimes);
router.post('/v2/downtime', requirePermission('ShopFloor', 'create'), shopfloorController.createV2Downtime);
router.put('/v2/downtime/:id/resolve', requirePermission('ShopFloor', 'update'), shopfloorController.resolveV2Downtime);
router.put('/v2/downtime/:id/close', requirePermission('ShopFloor', 'update'), shopfloorController.closeV2Downtime);

// Scrap Management V1
router.get('/scrap', requirePermission('ShopFloor', 'read'), shopfloorController.getAllScrap);
router.post('/scrap', requirePermission('ShopFloor', 'create'), shopfloorController.recordScrap);

// Scrap Management V2 Architecture
router.get('/v2/scrap', requirePermission('ShopFloor', 'read'), shopfloorController.getV2ScrapLogs);
router.post('/v2/scrap', requirePermission('ShopFloor', 'create'), shopfloorController.createV2ScrapLog);
router.put('/v2/scrap/:id/post', requirePermission('ShopFloor', 'update'), shopfloorController.postV2ScrapLog);

module.exports = router;
