const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const { protect, requirePermission, authorize } = require('../middlewares/auth.middleware');

router.use(protect);

// AR V1
router.route('/ar')
  .get(financeController.getARInvoices)
  .post(requirePermission('Finance', 'create'), financeController.createARInvoice);
router.route('/ar/:id/payment')
  .post(requirePermission('Finance', 'create'), financeController.addARPayment);

// Accounts Receivable V2 Architecture
router.get('/v2/ar/invoices', requirePermission('Finance', 'read'), financeController.getV2Invoices);
router.post('/v2/ar/invoices', requirePermission('Finance', 'create'), financeController.createV2Invoice);
router.put('/v2/ar/invoices/:id/void', requirePermission('Finance', 'update'), financeController.voidV2Invoice);
router.get('/v2/ar/receipts', requirePermission('Finance', 'read'), financeController.getV2Receipts);
router.post('/v2/ar/receipts', requirePermission('Finance', 'create'), financeController.recordV2Receipt);
router.post('/v2/ar/receipts/:id/apply', requirePermission('Finance', 'create'), financeController.applyV2Payment);
router.get('/v2/ar/aging', requirePermission('Finance', 'read'), financeController.getV2OutstandingAging);

// AP V1
router.route('/ap')
  .get(financeController.getAPBills)
  .post(requirePermission('Finance', 'create'), financeController.createAPBill);
router.route('/ap/:id/payment')
  .post(requirePermission('Finance', 'create'), financeController.addAPPayment);

// Accounts Payable V2 Architecture
router.get('/v2/ap/bills', requirePermission('Finance', 'read'), financeController.getV2VendorBills);
router.post('/v2/ap/bills', requirePermission('Finance', 'create'), financeController.createV2VendorBill);
router.get('/v2/ap/payments', requirePermission('Finance', 'read'), financeController.getV2VendorPayments);
router.post('/v2/ap/payments', requirePermission('Finance', 'create'), financeController.recordV2VendorPayment);
router.post('/v2/ap/payments/:id/apply', requirePermission('Finance', 'create'), financeController.applyV2VendorPayment);
router.get('/v2/ap/aging', requirePermission('Finance', 'read'), financeController.getV2APOutstandingAging);

// Ledger V1
router.route('/ledger')
  .get(financeController.getLedgers)
  .post(requirePermission('Finance', 'create'), financeController.createLedgerEntry);
router.route('/ledger/:id/post')
  .put(requirePermission('Finance', 'update'), financeController.postLedgerEntry);

// General Ledger V2 Architecture
router.get('/v2/gl/coa', requirePermission('Finance', 'read'), financeController.getV2COA);
router.get('/v2/gl/entries', requirePermission('Finance', 'read'), financeController.getV2JournalEntries);
router.post('/v2/gl/entries', requirePermission('Finance', 'create'), financeController.createV2JournalEntry);
router.put('/v2/gl/entries/:id/post', requirePermission('Finance', 'update'), financeController.postV2JournalEntry);
router.delete('/v2/gl/entries/:id', requirePermission('Finance', 'delete'), financeController.deleteV2JournalEntry);
router.post('/v2/gl/entries/:id/reverse', requirePermission('Finance', 'create'), financeController.reverseV2JournalEntry);
router.get('/v2/gl/transactions', requirePermission('Finance', 'read'), financeController.getV2FinancialTransactions);

// Tax V1
router.route('/tax/report')
  .get(financeController.generateTaxReport);
router.route('/tax')
  .get(financeController.getTaxes)
  .post(requirePermission('Finance', 'create'), financeController.createTax);
router.route('/tax/:id')
  .put(requirePermission('Finance', 'update'), financeController.updateTax);

// Tax Management V2 Architecture
router.get('/v2/tax/configs', requirePermission('Finance', 'read'), financeController.getV2TaxConfigs);
router.post('/v2/tax/configs', requirePermission('Finance', 'create'), financeController.createV2TaxConfig);
router.put('/v2/tax/configs/:id', requirePermission('Finance', 'update'), financeController.updateV2TaxConfig);
router.get('/v2/tax/reports', requirePermission('Finance', 'read'), financeController.getV2TaxReports);
router.post('/v2/tax/reports/generate', requirePermission('Finance', 'create'), financeController.generateV2TaxReport);
router.put('/v2/tax/reports/:id/file', requirePermission('Finance', 'update'), financeController.fileV2TaxReport);

// Statements V1 & Costing
router.route('/statements')
  .get(financeController.getStatements);
router.route('/costing')
  .get(financeController.getCosting);

// Financial Statements V2 Architecture
router.get('/v2/statements', requirePermission('Finance', 'read'), financeController.getV2FinancialStatements);
router.get('/v2/statements/templates', requirePermission('Finance', 'read'), financeController.getV2ReportTemplates);
router.post('/v2/statements/export', financeController.exportV2FinancialStatement);

// Cost Accounting V2 Architecture
router.get('/v2/costing', requirePermission('Finance', 'read'), financeController.getV2CostingData);
router.post('/v2/costing/period', requirePermission('Finance', 'create'), financeController.createV2CostingPeriod);

// Accounting periods. Anyone who can read Finance can see which months are
// closed; closing takes Finance:update; reopening a closed month is the
// sensitive direction and is left to administrators.
router.get('/v2/periods', requirePermission('Finance', 'read'), financeController.getAccountingPeriods);
router.put('/v2/periods/:key/close', requirePermission('Finance', 'update'), financeController.closeAccountingPeriod);
router.put('/v2/periods/:key/reopen', authorize('Super Admin', 'Admin'), financeController.reopenAccountingPeriod);

module.exports = router;
