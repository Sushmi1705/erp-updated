const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// Goods Receipt Note (GRN)
router.get('/grn', requirePermission('GoodsReceipt', 'read'), receiptController.getAllGRNs);
router.post('/grn', requirePermission('GoodsReceipt', 'create'), receiptController.createGRN);
router.put('/grn/:id', requirePermission('GoodsReceipt', 'update'), receiptController.updateGRN);
router.delete('/grn/:id', requirePermission('GoodsReceipt', 'delete'), receiptController.deleteGRN);

// Quality Inspection
router.get('/inspection', requirePermission('GoodsReceipt', 'read'), receiptController.getAllInspections);
router.put('/inspection/:id', requirePermission('GoodsReceipt', 'update'), receiptController.updateInspection);

// Inventory Posting
router.get('/inventory', requirePermission('GoodsReceipt', 'read'), receiptController.getAllInventoryStocks);
router.post('/inventory/post', requirePermission('GoodsReceipt', 'create'), receiptController.postToInventory);

// Purchase Return
router.post('/purchase-return', requirePermission('GoodsReceipt', 'create'), receiptController.createPurchaseReturn);

module.exports = router;
