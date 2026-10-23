const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// Inventory Control
router.get('/control', requirePermission('Inventory', 'read'), inventoryController.getInventoryControl);
// Batch-level stock for allocating an order line. See getStockBatches.
router.get('/batches', requirePermission('Inventory', 'read'), inventoryController.getStockBatches);

// Inventory Transactions
router.get('/transactions', requirePermission('Inventory', 'read'), inventoryController.getAllTransactions);
router.post('/transactions', requirePermission('Inventory', 'create'), inventoryController.createTransaction);

// Inventory Transactions V2 Architecture
router.get('/v2/transactions', requirePermission('Inventory', 'read'), inventoryController.getAllV2Transactions);
router.post('/v2/transactions', requirePermission('Inventory', 'create'), inventoryController.createV2Transaction);

// Inventory Optimization
router.get('/optimization', requirePermission('Inventory', 'read'), inventoryController.getOptimization);
router.post('/optimization/update', requirePermission('Inventory', 'create'), inventoryController.updateOptimization);
router.post('/optimization/analyze', requirePermission('Inventory', 'create'), inventoryController.runAnalysis);

// Inventory Optimization V2 Architecture
router.get('/v2/optimization', requirePermission('Inventory', 'read'), inventoryController.getV2Optimization);
router.post('/v2/optimization/parameters', requirePermission('Inventory', 'create'), inventoryController.updateV2Parameters);
router.post('/v2/optimization/profile', requirePermission('Inventory', 'create'), inventoryController.updateV2Profile);
router.post('/v2/optimization/analyze', requirePermission('Inventory', 'create'), inventoryController.runV2Analysis);

// Inventory Valuation
router.get('/valuation', requirePermission('Inventory', 'read'), inventoryController.getValuation);
router.post('/valuation/calculate', requirePermission('Inventory', 'create'), inventoryController.calculateValuation);

// Inventory Valuation V2 Architecture
router.get('/v2/valuation', requirePermission('Inventory', 'read'), inventoryController.getV2Valuation);
router.post('/v2/valuation/calculate', requirePermission('Inventory', 'create'), inventoryController.calculateV2Valuation);
router.get('/v2/valuation/layers/:materialId', requirePermission('Inventory', 'read'), inventoryController.getV2ValuationLayers);
router.post('/v2/valuation/method', requirePermission('Inventory', 'create'), inventoryController.updateV2ValuationMethod);

// Traceability
router.get('/traceability', requirePermission('Inventory', 'read'), inventoryController.getAllTraceability);
router.post('/traceability', requirePermission('Inventory', 'create'), inventoryController.createTraceability);

// Traceability Management V2 Architecture
router.get('/v2/traceability', requirePermission('Inventory', 'read'), inventoryController.getV2Traceability);
router.get('/v2/traceability/genealogy', requirePermission('Inventory', 'read'), inventoryController.getV2Genealogy);
router.post('/v2/traceability/register', requirePermission('Inventory', 'create'), inventoryController.registerV2Entity);
router.post('/v2/traceability/status', requirePermission('Inventory', 'create'), inventoryController.updateV2EntityStatus);
router.get('/v2/traceability/tree/:id', requirePermission('Inventory', 'read'), inventoryController.getV2TraceabilityTree);

module.exports = router;
