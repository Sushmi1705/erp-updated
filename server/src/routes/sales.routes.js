const express = require('express');
const router  = express.Router();
const c       = require('../controllers/sales.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// ── A. INQUIRY HEADER ─────────────────────────────────────────────────────────
router.get('/inquiry',               requirePermission('Sales', 'read'), c.getAllInquiries);
router.get('/inquiry/:id',           requirePermission('Sales', 'read'), c.getInquiryById);
router.post('/inquiry',              requirePermission('Sales', 'create'), c.createInquiry);
router.put('/inquiry/:id',           requirePermission('Sales', 'update'), c.updateInquiry);
router.put('/inquiry/:id/status',    requirePermission('Sales', 'update'), c.updateInquiryStatus);

// ── B. INQUIRY LINE ITEMS ─────────────────────────────────────────────────────
router.get('/inquiry/:inquiryId/lines',              requirePermission('Sales', 'read'), c.getLineItemsByInquiry);
router.post('/inquiry/:inquiryId/lines',             requirePermission('Sales', 'create'), c.createLineItem);
router.put('/inquiry-lines/:lineId',                 requirePermission('Sales', 'update'), c.updateLineItem);
router.delete('/inquiry-lines/:lineId',              requirePermission('Sales', 'delete'), c.deleteLineItem);

// ── C. CROSS-REFERENCE & FITMENT ──────────────────────────────────────────────
router.get('/inquiry-lines/:lineId/cross-refs',      requirePermission('Sales', 'read'), c.getCrossRefsByLine);
router.post('/inquiry-lines/:lineId/cross-refs',     requirePermission('Sales', 'create'), c.createCrossRef);
router.put('/cross-refs/:crossRefId',                requirePermission('Sales', 'update'), c.updateCrossRef);
router.delete('/cross-refs/:crossRefId',             requirePermission('Sales', 'delete'), c.deleteCrossRef);

// ── D. ENGINEERING FEASIBILITY REVIEW ─────────────────────────────────────────
router.get('/inquiry-lines/:lineId/feasibility',     requirePermission('Sales', 'read'), c.getFeasibilityByLine);
router.put('/inquiry-lines/:lineId/feasibility',     requirePermission('Sales', 'update'), c.upsertFeasibility);

// ── E. FOLLOW-UPS & COMMUNICATIONS ───────────────────────────────────────────
router.get('/inquiry/:inquiryId/follow-ups',         requirePermission('Sales', 'read'), c.getFollowUpsByInquiry);
router.post('/inquiry/:inquiryId/follow-ups',        requirePermission('Sales', 'create'), c.createFollowUp);
router.put('/follow-ups/:followUpId',                requirePermission('Sales', 'update'), c.updateFollowUp);
router.delete('/follow-ups/:followUpId',             requirePermission('Sales', 'delete'), c.deleteFollowUp);

// ── A. QUOTATION HEADER (new architecture) ────────────────────────────────────
router.get('/quotation-headers',            requirePermission('Sales', 'read'), c.getAllQuotationHeaders);
router.get('/quotation-headers/:id',        requirePermission('Sales', 'read'), c.getQuotationHeaderById);
router.post('/quotation-headers',           requirePermission('Sales', 'create'), c.createQuotationHeader);
router.put('/quotation-headers/:id',        requirePermission('Sales', 'update'), c.updateQuotationHeader);

// ── B. QUOTATION REVISIONS ────────────────────────────────────────────────────
router.get('/quotation-headers/:quotationId/revisions',         requirePermission('Sales', 'read'), c.getRevisionsByQuotation);
router.post('/quotation-headers/:quotationId/revisions',        requirePermission('Sales', 'create'), c.createRevision);
router.put('/quotation-revisions/:revisionId/status',           requirePermission('Sales', 'update'), c.updateRevisionStatus);
router.post('/quotation-revisions/:revisionId/clone',           requirePermission('Sales', 'create'), c.cloneRevision);

// ── C. QUOTATION LINE ITEMS ───────────────────────────────────────────────────
router.get('/quotation-revisions/:revisionId/lines',            requirePermission('Sales', 'read'), c.getLinesByRevision);
router.post('/quotation-revisions/:revisionId/lines',           requirePermission('Sales', 'create'), c.createQuoteLine);
router.put('/quotation-lines/:lineId',                          requirePermission('Sales', 'update'), c.updateQuoteLine);
router.delete('/quotation-lines/:lineId',                       requirePermission('Sales', 'delete'), c.deleteQuoteLine);

// ── D. TAXES & DISCOUNTS ──────────────────────────────────────────────────────
router.get('/quotation-revisions/:revisionId/financials',       requirePermission('Sales', 'read'), c.getTaxDiscountsByRevision);
router.post('/quotation-revisions/:revisionId/financials',      requirePermission('Sales', 'create'), c.createTaxDiscount);
router.put('/quotation-financials/:entryId',                    requirePermission('Sales', 'update'), c.updateTaxDiscount);
router.delete('/quotation-financials/:entryId',                 requirePermission('Sales', 'delete'), c.deleteTaxDiscount);

// ── E. APPROVAL ROUTING ───────────────────────────────────────────────────────
router.get('/quotation-revisions/:revisionId/approvals',        requirePermission('Sales', 'read'), c.getApprovalsByRevision);
router.post('/quotation-revisions/:revisionId/approvals',       requirePermission('Sales', 'create'), c.createQuoteApproval);
router.put('/quotation-approvals/:approvalId/action',           requirePermission('Sales', 'update'), c.actionQuoteApproval);
router.delete('/quotation-approvals/:approvalId',               requirePermission('Sales', 'delete'), c.deleteQuoteApproval);

// ── LEGACY QUOTATION (unchanged) ─────────────────────────────────────────────
router.get('/quotation',              requirePermission('Sales', 'read'), c.getAllQuotations);
router.post('/quotation',             requirePermission('Sales', 'create'), c.createQuotation);
router.put('/quotation/:id/status',   requirePermission('Sales', 'update'), c.changeQuotationStatus);

// ── LEGACY SALES ORDER (unchanged) ───────────────────────────────────────────
router.get('/order',                  requirePermission('Sales', 'read'), c.getAllOrders);
router.post('/order',                 requirePermission('Sales', 'create'), c.createOrder);
router.put('/order/:id',              requirePermission('Sales', 'update'), c.updateOrder);
router.put('/order/:id/status',       requirePermission('Sales', 'update'), c.updateOrderStatus);
router.put('/order/:id/atp',          requirePermission('Sales', 'update'), c.performATPCheck);
router.put('/order/:id/tracking',     requirePermission('Sales', 'update'), c.updateTracking);

// ── A. SALES ORDER HEADER (new architecture) ──────────────────────────────────
router.get('/so-headers',                                   requirePermission('Sales', 'read'), c.getAllSOHeaders);
router.get('/so-headers/:id',                               requirePermission('Sales', 'read'), c.getSOHeaderById);
router.post('/so-headers',              requirePermission('Sales', 'create'), c.createSOHeader);
router.put('/so-headers/:id',           requirePermission('Sales', 'update'), c.updateSOHeader);
router.put('/so-headers/:id/status',    requirePermission('Sales', 'update'), c.updateSOStatus);

// ── B. SALES ORDER LINE ITEMS ─────────────────────────────────────────────────
router.get('/so-headers/:orderId/lines',                    requirePermission('Sales', 'read'), c.getSOLines);
router.post('/so-headers/:orderId/lines',   requirePermission('Sales', 'create'), c.createSOLine);
router.put('/so-lines/:lineId',             requirePermission('Sales', 'update'), c.updateSOLine);
router.delete('/so-lines/:lineId',          requirePermission('Sales', 'delete'), c.deleteSOLine);

// ── C. DELIVERY SCHEDULES / RELEASES ─────────────────────────────────────────
router.get('/so-lines/:lineId/schedules',                    requirePermission('Sales', 'read'), c.getSchedulesByLine);
router.post('/so-lines/:lineId/schedules',  requirePermission('Sales', 'create'), c.createSchedule);
router.put('/so-schedules/:scheduleId',     requirePermission('Sales', 'update'), c.updateSchedule);
router.delete('/so-schedules/:scheduleId',  requirePermission('Sales', 'delete'), c.deleteSchedule);

// ── D. ATP ALLOCATIONS ────────────────────────────────────────────────────────
router.get('/so-schedules/:scheduleId/allocations',          requirePermission('Sales', 'read'), c.getAllocationsBySchedule);
router.post('/so-schedules/:scheduleId/allocations', requirePermission('Sales', 'create'), c.createAllocation);
router.delete('/so-allocations/:allocationId',       requirePermission('Sales', 'delete'), c.deleteAllocation);

module.exports = router;
