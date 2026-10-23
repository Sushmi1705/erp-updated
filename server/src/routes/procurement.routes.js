const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurement.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// Purchase Requisition
router.get('/requisition', requirePermission('Procurement', 'read'), procurementController.getAllRequisitions);
router.post('/requisition', requirePermission('Procurement', 'create'), procurementController.createRequisition);
router.put('/requisition/:id/status', requirePermission('Procurement', 'update'), procurementController.updateRequisitionStatus);
router.delete('/requisition/:id', requirePermission('Procurement', 'delete'), procurementController.deleteRequisition);
router.post('/requisition/:id/create-po', requirePermission('Procurement', 'update'), procurementController.convertPRtoPO);
router.post('/requisition/:id/create-rfq', requirePermission('Procurement', 'update'), procurementController.convertPRtoRFQ);

// RFQ
router.get('/rfq', requirePermission('Procurement', 'read'), procurementController.getAllRFQs);
router.post('/rfq', requirePermission('Procurement', 'create'), procurementController.createRFQ);
router.delete('/rfq/:id', requirePermission('Procurement', 'delete'), procurementController.deleteRFQ);
router.post('/rfq/:id/quotation', requirePermission('Procurement', 'create'), procurementController.addQuotation);
router.put('/rfq/:id/quotation/:quoteId/select', requirePermission('Procurement', 'update'), procurementController.selectQuotation);

// Purchase Order
router.get('/po', requirePermission('Procurement', 'read'), procurementController.getAllPurchaseOrders);
router.post('/po', requirePermission('Procurement', 'create'), procurementController.createPurchaseOrder);
router.put('/po/:id/status', requirePermission('Procurement', 'update'), procurementController.updatePOStatus);
router.delete('/po/:id', requirePermission('Procurement', 'delete'), procurementController.deletePurchaseOrder);

// Advanced PO Engine Routes
router.put('/po/:id/acknowledge', requirePermission('Procurement', 'update'), procurementController.acknowledgePO);
router.put('/po/:id/asn', requirePermission('Procurement', 'update'), procurementController.submitASN);
router.post('/po/:id/change-order', requirePermission('Procurement', 'update'), procurementController.createChangeOrder);
router.put('/po/:id/receive', requirePermission('Procurement', 'update'), procurementController.mockGoodsReceipt);
router.post('/po/:id/invoice', requirePermission('Procurement', 'update'), procurementController.processInvoice);

// Vendor Scorecard Engine
router.get('/performance', requirePermission('Procurement', 'read'), procurementController.getLiveScorecards);
router.get('/performance/events/:vendorId', requirePermission('Procurement', 'read'), procurementController.getVendorEventLogs);
router.put('/performance/:vendorId/status', requirePermission('Procurement', 'update'), procurementController.updateVendorRiskStatus);
router.post('/performance/mock-goods-receipt', requirePermission('Procurement', 'create'), procurementController.mockWarehouseReceipt);
router.post('/performance/mock-qa-inspection', requirePermission('Procurement', 'create'), procurementController.mockQAInspection);
router.post('/performance/mock-cert-expiration', requirePermission('Procurement', 'create'), procurementController.mockCertificateExpiration);

module.exports = router;
