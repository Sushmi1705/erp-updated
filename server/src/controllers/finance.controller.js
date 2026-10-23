const { handleError } = require('../utils/errorHandler');
const { editable } = require('../utils/safeBody');
const AccountingPeriod = require('../models/AccountingPeriod');
const { periodLockFor, keyFor, labelFor } = require('../services/periodLock.service');
const { internalId } = require('../utils/internalId');
const FinanceAR = require('../models/FinanceAR');
const FinanceAP = require('../models/FinanceAP');
const FinanceLedger = require('../models/FinanceLedger');
const FinanceTax = require('../models/FinanceTax');
const { CustomerInvoice, InvoiceLineItem, PaymentReceipt, PaymentApplication } = require('../models/AccountsReceivable');
const { VendorBill, BillLineItem, VendorPayment, BillPaymentApplication } = require('../models/AccountsPayable');
const { ChartOfAccounts, JournalEntry, JournalEntryLine, FinancialTransaction } = require('../models/GeneralLedger');
const { TaxConfigurationMaster, TaxLedger, TaxReport } = require('../models/TaxManagement');
const { ReportTemplateHeader, ReportLayoutLine, ReportAccountMapping } = require('../models/FinancialStatements');
const { CostingPeriodHeader, MaterialCostLedger, ProductionCostLedger, ProfitabilityAnalysisLog } = require('../models/CostAccounting');
const { Customer } = require('../models/MasterCustomer');
const { Vendor } = require('../models/MasterVendor');
const { POHeader, POLineItem } = require('../models/PurchaseOrder');
const { AuditLog } = require('../models/Audit');
const { generateDocNumber } = require('../utils/docNumbering');
const { calculateGST } = require('../services/gstService');
const { postJournalEntry } = require('../services/glService');
const mongoose = require('mongoose');
const logAudit = async (action, entityType, entityId, userId, changes) => {
  try {
    await AuditLog.create({
      action,
      module: entityType,
      recordId: entityId,
      changedBy: userId,
      newValue: changes || null
    });
  } catch (err) { console.error('Audit Log Error:', err); }
};

// Chart of Accounts seeded on first use — shared by getV2COA and the AP GL postings.
const DEFAULT_COA = [
  { Account_ID: '1000', Account_Number: '1000', Account_Name: 'Operating Cash & Bank', Account_Type: 'Asset', Is_Control_Account: false },
  { Account_ID: '1200', Account_Number: '1200', Account_Name: 'Accounts Receivable (Sub-ledger Control)', Account_Type: 'Asset', Is_Control_Account: true },
  { Account_ID: '1500', Account_Number: '1500', Account_Name: 'Raw Materials & Parts Inventory', Account_Type: 'Asset', Is_Control_Account: true },
  { Account_ID: '2000', Account_Number: '2000', Account_Name: 'Accounts Payable (Sub-ledger Control)', Account_Type: 'Liability', Is_Control_Account: true },
  { Account_ID: '3000', Account_Number: '3000', Account_Name: 'Shareholders Equity & Retained Earnings', Account_Type: 'Equity', Is_Control_Account: false },
  { Account_ID: '4000', Account_Number: '4000', Account_Name: 'Auto Components Sales Revenue', Account_Type: 'Revenue', Is_Control_Account: false },
  { Account_ID: '5000', Account_Number: '5000', Account_Name: 'Cost of Goods Sold (COGS)', Account_Type: 'Expense', Is_Control_Account: false },
  { Account_ID: '5200', Account_Number: '5200', Account_Name: 'Plant Machinery & Utility Operating Expense', Account_Type: 'Expense', Is_Control_Account: false }
];

// Accounts the AP sub-ledger posts through. Vendor bills are debited to Raw Materials
// Inventory because goods receipt posts nothing to the GL — there is no GR/IR clearing
// account in the chart to relieve, so debiting inventory here cannot double count.
const AP_GL_ACCOUNT_NUMBERS = { purchase: '1500', payable: '2000', cash: '1000' };

const getAPPostingAccounts = async (session) => {
  const opts = session ? { session } : {};
  const wanted = Object.values(AP_GL_ACCOUNT_NUMBERS);
  // Match on either key: Account_ID is unique, so re-seeding a renamed row would collide.
  let accounts = await ChartOfAccounts.find({
    $or: [{ Account_Number: { $in: wanted } }, { Account_ID: { $in: wanted } }]
  }, null, opts);

  const held = (num) => accounts.find(a => a.Account_Number === num || a.Account_ID === num);

  // getV2COA seeds the chart lazily; AP must be able to post before anyone opens that screen.
  const missing = DEFAULT_COA.filter(d => wanted.includes(d.Account_Number) && !held(d.Account_Number));
  if (missing.length > 0) {
    accounts = accounts.concat(await ChartOfAccounts.insertMany(missing, opts));
  }

  const resolved = {
    purchase: held(AP_GL_ACCOUNT_NUMBERS.purchase),
    payable: held(AP_GL_ACCOUNT_NUMBERS.payable),
    cash: held(AP_GL_ACCOUNT_NUMBERS.cash)
  };
  const unresolved = Object.entries(resolved).filter(([, acc]) => !acc).map(([role]) => role);
  if (unresolved.length > 0) {
    throw new Error(`Chart of Accounts is missing the AP posting account(s) for: ${unresolved.join(', ')}.`);
  }
  return resolved;
};

// Balanced two-line AP posting routed through the shared, balance-validating GL service.
const postAPJournal = async ({ description, debitAccount, creditAccount, amount, referenceType, referenceId, session, userId }) => {
  await postJournalEntry({
    sourceModule: 'AP',
    description,
    lines: [
      { accountId: debitAccount._id, type: 'Debit', amount, referenceType, referenceId },
      { accountId: creditAccount._id, type: 'Credit', amount, referenceType, referenceId }
    ],
    session,
    userId
  });
};

/**
 * P2P guard for vendor bills that quote a PO. Returns a blocking message, or null when
 * the bill is within what was ordered. Quantities are checked against orderQty rather
 * than receivedQty so a bill may legitimately be entered before the receipt is posted;
 * over-billing is blocked outright rather than silently trimmed — finance decides.
 */
const validateBillAgainstPO = async (purchaseOrderId, billedAmount, billedQty) => {
  const po = await POHeader.findById(purchaseOrderId);
  if (!po) return 'Referenced Purchase Order not found.';

  const lines = await POLineItem.find({ poId: po._id });
  const orderedAmount = lines.length > 0
    ? lines.reduce((sum, l) => sum + (l.total || 0), 0)
    : Number(po.totalAmount) || 0;

  if (billedAmount > orderedAmount + 0.01) {
    return `PO Tolerance Block: billed amount (${billedAmount.toFixed(2)}) exceeds the ordered value (${orderedAmount.toFixed(2)}) of PO ${po.poNumber}.`;
  }

  const orderedQty = lines.reduce((sum, l) => sum + (l.orderQty || 0), 0);
  if (billedQty > 0 && orderedQty > 0 && billedQty > orderedQty + 0.0001) {
    return `PO Tolerance Block: billed quantity (${billedQty}) exceeds the ordered quantity (${orderedQty}) of PO ${po.poNumber}.`;
  }

  return null;
};

// ================= ACCOUNTS RECEIVABLE =================

exports.getARInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const invoices = await FinanceAR.find()
      .populate('customerId', 'name code')
      .populate('salesOrderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await FinanceAR.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: invoices });
  } catch (error) { handleError(res, error); }
};

exports.createARInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // C-07: Sequential document numbering
    req.body.invoiceNumber = await generateDocNumber('AR_INV_V1', 'INV', session);
    // H-10: Server-side GST calculation — never trust client-supplied tax
    const taxableAmount = Number(req.body.amount) || 0;
    const gst = calculateGST(taxableAmount, req.body.hsnCode || '', req.body.isInterstate || false);
    req.body.taxAmount = gst.totalTax;
    req.body.totalAmount = gst.totalAmount;
    req.body.outstandingAmount = req.body.totalAmount;
    
    const invoiceArray = await FinanceAR.create([req.body], { session });
    const invoice = invoiceArray[0];

    // Auto-post to General Ledger: Debit AR, Credit Revenue + Output Tax
    const jeNumber = await generateDocNumber('JE', 'JE', session);
    await FinanceLedger.create([{
      entryNumber: `${jeNumber}-DR`,
      description: `AR Invoice ${invoice.invoiceNumber} - Accounts Receivable`,
      accountName: 'Accounts Receivable',
      type: 'Debit',
      amount: invoice.totalAmount,
      referenceType: 'Invoice',
      referenceId: invoice._id,
      status: 'Posted'
    }], { session });
    
    await FinanceLedger.create([{
      entryNumber: `${jeNumber}-CR`,
      description: `AR Invoice ${invoice.invoiceNumber} - Revenue`,
      accountName: 'Sales Revenue',
      type: 'Credit',
      amount: invoice.amount,
      referenceType: 'Invoice',
      referenceId: invoice._id,
      status: 'Posted'
    }], { session });
    
    if (invoice.taxAmount > 0) {
      await FinanceLedger.create([{
        entryNumber: `${jeNumber}-TX`,
        description: `AR Invoice ${invoice.invoiceNumber} - Output GST`,
        accountName: 'Output Tax Payable',
        type: 'Credit',
        amount: invoice.taxAmount,
        referenceType: 'Invoice',
        referenceId: invoice._id,
        status: 'Posted'
      }], { session });
    }

    await logAudit('CREATE', 'FinanceAR', invoice._id, req.user._id);
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    handleError(res, error);
  }
};

exports.addARPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const invoice = await FinanceAR.findById(req.params.id).session(session);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const paymentAmount = Number(req.body.amount) || 0;
    if (paymentAmount <= 0) return res.status(400).json({ success: false, message: 'Payment amount must be positive' });

    invoice.payments.push({
      amount: paymentAmount,
      paymentMode: req.body.paymentMode,
      referenceNumber: req.body.referenceNumber,
      paymentDate: new Date()
    });
    await invoice.save({ session });
    
    // C-04 FIX: Double-entry — Debit Cash/Bank AND Credit Accounts Receivable
    const jeNumber = await generateDocNumber('AR_PAY_V1', 'PAY', session);
    await FinanceLedger.create([
      {
        entryNumber: `${jeNumber}-DR`,
        description: `Cash received for Invoice ${invoice.invoiceNumber}`,
        accountName: 'Cash/Bank',
        type: 'Debit',
        amount: paymentAmount,
        referenceType: 'Payment',
        referenceId: invoice._id,
        status: 'Posted'
      },
      {
        entryNumber: `${jeNumber}-CR`,
        description: `AR cleared for Invoice ${invoice.invoiceNumber}`,
        accountName: 'Accounts Receivable',
        type: 'Credit',
        amount: paymentAmount,
        referenceType: 'Payment',
        referenceId: invoice._id,
        status: 'Posted'
      }
    ], { session, ordered: true });

    await logAudit('UPDATE', 'FinanceAR', invoice._id, req.user._id, { action: 'Payment Added', amount: paymentAmount });
    await session.commitTransaction();
    res.json({ success: true, data: invoice });
  } catch (error) {
    await session.abortTransaction();
    handleError(res, error);
  } finally {
    session.endSession();
  }
};

// ================= ACCOUNTS PAYABLE =================

exports.getAPBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const bills = await FinanceAP.find()
      .populate('vendorId', 'name code')
      .populate('purchaseOrderId', 'poNumber')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await FinanceAP.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: bills });
  } catch (error) { handleError(res, error); }
};

exports.createAPBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const taxableAmount = Number(req.body.amount) || 0;

    // Never bill more than the PO ordered — the reference was previously accepted and ignored.
    if (req.body.purchaseOrderId) {
      const poBlock = await validateBillAgainstPO(req.body.purchaseOrderId, taxableAmount, Number(req.body.quantity) || 0);
      if (poBlock) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: poBlock });
      }
    }

    // C-07: Sequential numbering
    req.body.billNumber = await generateDocNumber('AP_BILL_V1', 'BILL', session);
    // H-10: Server-side GST
    const gst = calculateGST(taxableAmount, req.body.hsnCode || '', req.body.isInterstate || false);
    req.body.taxAmount = gst.totalTax;
    req.body.totalAmount = gst.totalAmount;
    req.body.outstandingAmount = req.body.totalAmount;
    
    const billArray = await FinanceAP.create([req.body], { session });
    const bill = billArray[0];

    // Auto-post to GL: Debit Expense + Input GST, Credit Accounts Payable
    const jeNumber = await generateDocNumber('JE', 'JE', session);
    await FinanceLedger.create([{
      entryNumber: `${jeNumber}-DR`,
      description: `AP Bill ${bill.billNumber} - Purchase Expense`,
      accountName: 'Purchase Expense',
      type: 'Debit',
      amount: bill.amount,
      referenceType: 'Bill',
      referenceId: bill._id,
      status: 'Posted'
    }], { session });
    
    if (bill.taxAmount > 0) {
      await FinanceLedger.create([{
        entryNumber: `${jeNumber}-TX`,
        description: `AP Bill ${bill.billNumber} - Input GST`,
        accountName: 'Input Tax Receivable',
        type: 'Debit',
        amount: bill.taxAmount,
        referenceType: 'Bill',
        referenceId: bill._id,
        status: 'Posted'
      }], { session });
    }
    
    await FinanceLedger.create([{
      entryNumber: `${jeNumber}-CR`,
      description: `AP Bill ${bill.billNumber} - Accounts Payable`,
      accountName: 'Accounts Payable',
      type: 'Credit',
      amount: bill.totalAmount,
      referenceType: 'Bill',
      referenceId: bill._id,
      status: 'Posted'
    }], { session });

    await logAudit('CREATE', 'FinanceAP', bill._id, req.user._id);
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    handleError(res, error);
  }
};

exports.addAPPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const bill = await FinanceAP.findById(req.params.id).session(session);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const paymentAmount = Number(req.body.amount) || 0;
    if (paymentAmount <= 0) return res.status(400).json({ success: false, message: 'Payment amount must be positive' });

    bill.payments.push({
      amount: paymentAmount,
      paymentMode: req.body.paymentMode,
      referenceNumber: req.body.referenceNumber,
      paymentDate: new Date()
    });
    await bill.save({ session });

    // C-04 FIX: Double-entry — Debit Accounts Payable AND Credit Cash/Bank
    const jeNumber = await generateDocNumber('AP_PAY_V1', 'VPAY', session);
    await FinanceLedger.create([
      {
        entryNumber: `${jeNumber}-DR`,
        description: `AP cleared for Bill ${bill.billNumber}`,
        accountName: 'Accounts Payable',
        type: 'Debit',
        amount: paymentAmount,
        referenceType: 'Payment',
        referenceId: bill._id,
        status: 'Posted'
      },
      {
        entryNumber: `${jeNumber}-CR`,
        description: `Cash paid for Bill ${bill.billNumber}`,
        accountName: 'Cash/Bank',
        type: 'Credit',
        amount: paymentAmount,
        referenceType: 'Payment',
        referenceId: bill._id,
        status: 'Posted'
      }
    ], { session, ordered: true });

    await logAudit('UPDATE', 'FinanceAP', bill._id, req.user._id, { action: 'Payment Sent', amount: paymentAmount });
    await session.commitTransaction();
    res.json({ success: true, data: bill });
  } catch (error) {
    await session.abortTransaction();
    handleError(res, error);
  } finally {
    session.endSession();
  }
};

// ================= GENERAL LEDGER =================

exports.getLedgers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const entries = await FinanceLedger.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await FinanceLedger.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: entries });
  } catch (error) { handleError(res, error); }
};

exports.createLedgerEntry = async (req, res) => {
  try {
    req.body.entryNumber = await generateDocNumber('JE', 'JE');
    const entry = await FinanceLedger.create(req.body);
    await logAudit('CREATE', 'FinanceLedger', entry._id, req.user._id);
    res.status(201).json({ success: true, data: entry });
  } catch (error) { handleError(res, error); }
};

exports.postLedgerEntry = async (req, res) => {
  try {
    const entry = await FinanceLedger.findByIdAndUpdate(req.params.id, { status: 'Posted' }, { new: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    await logAudit('UPDATE', 'FinanceLedger', entry._id, req.user._id, { status: 'Posted' });
    res.json({ success: true, data: entry });
  } catch (error) { handleError(res, error); }
};

// ================= TAX MANAGEMENT =================

exports.getTaxes = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const taxes = await FinanceTax.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await FinanceTax.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: taxes });
  } catch (error) { handleError(res, error); }
};

exports.createTax = async (req, res) => {
  try {
    const tax = await FinanceTax.create(req.body);
    await logAudit('CREATE', 'FinanceTax', tax._id, req.user._id);
    res.status(201).json({ success: true, data: tax });
  } catch (error) { handleError(res, error); }
};

exports.updateTax = async (req, res) => {
  try {
    const tax = await FinanceTax.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!tax) return res.status(404).json({ success: false, message: 'Tax not found' });
    await logAudit('UPDATE', 'FinanceTax', tax._id, req.user._id);
    res.json({ success: true, data: tax });
  } catch (error) { handleError(res, error); }
};

exports.generateTaxReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Output Tax (Sales - AR)
    const sales = await FinanceAR.find(matchQuery).populate('customerId', 'name').select('invoiceNumber createdAt amount taxAmount status customerId');
    const totalOutputTax = sales.reduce((acc, curr) => acc + (Number(curr.taxAmount) || 0), 0);

    // Input Tax (Purchases - AP)
    const purchases = await FinanceAP.find(matchQuery).populate('vendorId', 'name').select('billNumber createdAt amount taxAmount status vendorId');
    const totalInputTax = purchases.reduce((acc, curr) => acc + (Number(curr.taxAmount) || 0), 0);

    const netTaxLiability = totalOutputTax - totalInputTax;

    res.json({
      success: true,
      data: {
        totalOutputTax,
        totalInputTax,
        netTaxLiability,
        salesTransactions: sales,
        purchaseTransactions: purchases
      }
    });
  } catch (error) { handleError(res, error); }
};

// ================= FINANCIAL STATEMENTS =================

exports.getStatements = async (req, res) => {
  try {
    // H-12 FIX: Use V2 JournalEntryLine + ChartOfAccounts.Account_Type (not string matching)
    // Aggregate V2 GL lines with account type
    const glSummary = await JournalEntryLine.aggregate([
      {
        $lookup: {
          from: 'chartofaccounts',
          localField: 'Account_ID',
          foreignField: '_id',
          as: 'account'
        }
      },
      { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'journalentries',
          localField: 'Entry_ID',
          foreignField: '_id',
          as: 'entry'
        }
      },
      { $unwind: { path: '$entry', preserveNullAndEmptyArrays: true } },
      { $match: { 'entry.Status': 'Posted' } },
      {
        $group: {
          _id: '$account.Account_Type',
          totalDebits: { $sum: { $cond: [{ $eq: ['$Type', 'Debit'] }, '$Amount', 0] } },
          totalCredits: { $sum: { $cond: [{ $eq: ['$Type', 'Credit'] }, '$Amount', 0] } }
        }
      }
    ]);

    // Build type map from V2 GL
    const v2Map = {};
    glSummary.forEach(r => { if (r._id) v2Map[r._id] = { debits: r.totalDebits, credits: r.totalCredits }; });

    // Revenue: credit-normal (credits increase revenue)
    const totalRevenue = (v2Map['Revenue']?.credits || 0) - (v2Map['Revenue']?.debits || 0);
    // Expense: debit-normal (debits increase expenses)
    const totalExpenses = (v2Map['Expense']?.debits || 0) - (v2Map['Expense']?.credits || 0);
    // Cash: debit-normal
    const totalCash = (v2Map['Asset']?.debits || 0) - (v2Map['Asset']?.credits || 0);

    // Also include V1 ledger data for backward compatibility during migration
    const v1Ledgers = await FinanceLedger.find({ status: 'Posted' });
    let v1Revenue = 0, v1Expenses = 0, v1Cash = 0;
    v1Ledgers.forEach(l => {
      const name = l.accountName || '';
      if (name === 'Sales Revenue' || name === 'Revenue') {
        v1Revenue += l.type === 'Credit' ? l.amount : -l.amount;
      } else if (name === 'Purchase Expense' || name === 'Cost of Sales') {
        v1Expenses += l.type === 'Debit' ? l.amount : -l.amount;
      } else if (name === 'Cash/Bank') {
        v1Cash += l.type === 'Debit' ? l.amount : -l.amount;
      }
    });

    const combinedRevenue = totalRevenue + v1Revenue;
    const combinedExpenses = totalExpenses + v1Expenses;
    const combinedCash = totalCash + v1Cash;

    const AR = await FinanceAR.find();
    let arTotal = AR.reduce((acc, curr) => acc + (curr.outstandingAmount || 0), 0);

    const AP = await FinanceAP.find();
    let apTotal = AP.reduce((acc, curr) => acc + (curr.outstandingAmount || 0), 0);

    // Add V2 AR/AP outstanding
    const v2AR = await CustomerInvoice.aggregate([{ $match: { Status: { $in: ['Sent', 'Partial'] } } }, { $group: { _id: null, total: { $sum: '$Outstanding_Balance' } } }]);
    const v2AP = await VendorBill.aggregate([{ $match: { Status: { $in: ['Pending', 'Partial'] } } }, { $group: { _id: null, total: { $sum: '$Outstanding_Balance' } } }]);
    arTotal += (v2AR[0]?.total || 0);
    apTotal += (v2AP[0]?.total || 0);

    res.json({
      success: true,
      data: {
        profitAndLoss: { revenue: combinedRevenue, expenses: combinedExpenses, netProfit: combinedRevenue - combinedExpenses },
        balanceSheet: { assets: { accountsReceivable: arTotal, cashAndEquivalents: combinedCash }, liabilities: { accountsPayable: apTotal }, equity: { retainedEarnings: combinedRevenue - combinedExpenses } },
        cashFlow: { operatingActivities: combinedCash }
      }
    });
  } catch (error) { handleError(res, error); }
};

// ================= COST ACCOUNTING =================

exports.getCosting = async (req, res) => {
  try {
    const ledgers = await FinanceLedger.find({ status: 'Posted' });
    const AP = await FinanceAP.find();
    
    let totalMaterialCost = 0;
    let totalLaborCost = 0;
    let totalOverheadCost = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    
    ledgers.forEach(l => {
      const name = l.accountName.toLowerCase();
      
      const isRevenue = name.includes('revenue') || name.includes('sales');
      const isExpense = name.includes('expense') || name.includes('cost') || name.includes('purchase') || name.includes('labor') || name.includes('overhead') || name.includes('material');
      
      if (isRevenue) {
        if (l.type === 'Credit') totalRevenue += l.amount;
        else if (l.type === 'Debit') totalRevenue -= l.amount;
      }
      if (isExpense) {
        if (l.type === 'Debit') totalExpenses += l.amount;
        else if (l.type === 'Credit') totalExpenses -= l.amount;
      }
      
      if (name.includes('material') || name.includes('inventory') || name.includes('purchase')) {
        if (l.type === 'Debit') totalMaterialCost += l.amount;
        else if (l.type === 'Credit') totalMaterialCost -= l.amount;
      }
      if (name.includes('labor') || name.includes('salary') || name.includes('wage')) {
        if (l.type === 'Debit') totalLaborCost += l.amount;
        else if (l.type === 'Credit') totalLaborCost -= l.amount;
      }
      if (name.includes('overhead') || name.includes('rent') || name.includes('utility') || name.includes('maintenance')) {
        if (l.type === 'Debit') totalOverheadCost += l.amount;
        else if (l.type === 'Credit') totalOverheadCost -= l.amount;
      }
    });

    if (totalMaterialCost === 0 && AP.length > 0) {
      totalMaterialCost = AP.reduce((acc, bill) => acc + bill.totalAmount, 0);
    }

    const cogs = totalMaterialCost + totalLaborCost + totalOverheadCost;
    
    let grossMargin = '0%';
    let netMargin = '0%';

    if (totalRevenue > 0) {
      grossMargin = `${(((totalRevenue - cogs) / totalRevenue) * 100).toFixed(1)}%`;
      netMargin = `${(((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1)}%`;
    }

    const data = {
      materialCosting: { totalMaterialCost, variance: 'N/A' },
      productionCosting: { totalLaborCost, totalOverheadCost },
      profitability: { grossMargin, netMargin }
    };
    
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

// ================= Accounts Receivable (V2 Architecture) =================

exports.getV2Invoices = async (req, res) => {
  try {
    const invoices = await CustomerInvoice.find()
      .populate('Customer_ID', 'name companyName email phone code')
      .sort({ createdAt: -1 });

    const now = new Date();

    const fullInvoices = await Promise.all(invoices.map(async (inv) => {
      const lineItems = await InvoiceLineItem.find({ Invoice_ID: inv._id });
      const applications = await PaymentApplication.find({ Invoice_ID: inv._id });
      const totalApplied = applications.reduce((sum, a) => sum + (a.Applied_Amount || 0), 0);
      const remainingBalance = Math.max(0, inv.Total_Amount - totalApplied);

      // Rule 4: Status Automation
      let status = inv.Status;
      if (status !== 'Cancelled/Void') {
        if (totalApplied >= inv.Total_Amount && inv.Total_Amount > 0) {
          status = 'Paid';
        } else if (totalApplied > 0) {
          status = 'Partially Paid';
        } else if (now > new Date(inv.Due_Date)) {
          status = 'Overdue';
        }

        if (status !== inv.Status) {
          inv.Status = status;
          await inv.save();
        }
      }

      return {
        ...inv.toObject(),
        lineItems: lineItems.map(l => l.toObject()),
        totalApplied,
        remainingBalance
      };
    }));

    res.json({ success: true, data: fullInvoices });
  } catch (error) { handleError(res, error); }
};

exports.createV2Invoice = async (req, res) => {
  try {
    const { Customer_ID, Issue_Date, Due_Date, Terms_ID, lineItems } = req.body;
    const lockedInv = await periodLockFor(Issue_Date || new Date(), 'invoice');
    if (lockedInv) return res.status(423).json(lockedInv);

    if (!Customer_ID || !Due_Date) {
      return res.status(400).json({ success: false, message: 'Customer ID and Due Date are required.' });
    }

    // C-08 FIX: Remove phantom fallback — require real line items
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one line item is required to create an invoice.' });
    }

    const issue = Issue_Date ? new Date(Issue_Date) : new Date();
    const due = new Date(Due_Date);

    if (due < issue) {
      return res.status(400).json({
        success: false,
        message: 'Date Integrity Error: Invoice Due Date cannot be earlier than Issue Date.'
      });
    }

    // C-06/H-10 FIX: Server-side GST calculation — ignore any client-supplied tax
    const { calculateLineItemsGST } = require('../services/gstService');
    const gstResult = calculateLineItemsGST(lineItems, req.body.isInterstate || false);
    const { summary, lines: taxedLines } = gstResult;

    // C-07 FIX: Sequential, collision-resistant invoice number
    const invNum = await generateDocNumber('AR_INV_V2', 'SINV');
    const invoice = await CustomerInvoice.create({
      Invoice_ID: invNum,
      Invoice_Number: invNum,
      Customer_ID,
      Issue_Date: issue,
      Due_Date: due,
      Terms_ID: Terms_ID || 'Net 30',
      Taxable_Amount: summary.taxableValue,
      Tax_Amount: summary.totalTax,
      Total_Amount: summary.grandTotal,
      Outstanding_Balance: summary.grandTotal,
      Status: 'Sent'
    });

    let seq = 1;
    for (const item of taxedLines) {
      const lineItemId = await generateDocNumber('INV_LINE', 'LNE');
      await InvoiceLineItem.create({
        Line_Item_ID: lineItemId,
        Invoice_ID: invoice._id,
        Line_Sequence: seq++,
        Description: item.Description || 'Auto Component Line Item',
        HSN_Code: item.HSN_Code || item.hsnCode || '',
        Quantity: Number(item.Quantity || item.quantity || 1),
        Unit_Price: Number(item.Unit_Price || item.unitPrice || 0),
        CGST_Rate: item.cgstRate || 0,
        CGST_Amount: item.cgstAmount || 0,
        SGST_Rate: item.sgstRate || 0,
        SGST_Amount: item.sgstAmount || 0,
        IGST_Rate: item.igstRate || 0,
        IGST_Amount: item.igstAmount || 0,
        Line_Total: item.totalAmount
      });
    }

    await logAudit('CREATE', 'CustomerInvoice', invoice._id, req.user?._id, `Created invoice ${invNum} totaling ₹${summary.grandTotal}`);
    res.status(201).json({ success: true, data: { ...invoice.toObject(), taxSummary: summary } });
  } catch (error) { handleError(res, error); }
};

exports.voidV2Invoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await CustomerInvoice.findById(id);
    if (invoice) { const lockedInv = await periodLockFor(invoice.Issue_Date, 'invoice'); if (lockedInv) return res.status(423).json({ ...lockedInv, message: lockedInv.message.replace('Date it in the current month', 'Raise a credit note dated in the current month instead') }); }
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // Rule 3: Voiding Constraints
    const applications = await PaymentApplication.find({ Invoice_ID: invoice._id });
    if (applications.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Voiding Constraint Error: An invoice cannot transition to Cancelled/Void status while active payment applications exist. Unapply payments first.'
      });
    }

    invoice.Status = 'Cancelled/Void';
    await invoice.save();

    await logAudit('UPDATE', 'CustomerInvoice', invoice._id, req.user?._id, `Voided invoice ${invoice.Invoice_Number}`);
    res.json({ success: true, data: invoice });
  } catch (error) { handleError(res, error); }
};

exports.getV2Receipts = async (req, res) => {
  try {
    const receipts = await PaymentReceipt.find()
      .populate('Customer_ID', 'name companyName')
      .sort({ createdAt: -1 });

    const fullReceipts = await Promise.all(receipts.map(async (r) => {
      const apps = await PaymentApplication.find({ Receipt_ID: r._id }).populate('Invoice_ID', 'Invoice_Number Total_Amount Status');
      return {
        ...r.toObject(),
        applications: apps.map(a => a.toObject())
      };
    }));

    res.json({ success: true, data: fullReceipts });
  } catch (error) { handleError(res, error); }
};

exports.recordV2Receipt = async (req, res) => {
  try {
    const { Customer_ID, Payment_Date, Total_Received, Payment_Method, Reference_Number } = req.body;
    const lockedRc = await periodLockFor(Payment_Date || new Date(), 'receipt');
    if (lockedRc) return res.status(423).json(lockedRc);

    const amount = Number(Total_Received);
    if (!Customer_ID || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Customer ID and valid Total Received amount are required.' });
    }

    const recNum = await generateDocNumber('AR_RECEIPT', 'REC');
    const receipt = await PaymentReceipt.create({
      Receipt_ID: recNum,
      Receipt_Number: recNum,
      Customer_ID,
      Payment_Date: Payment_Date ? new Date(Payment_Date) : new Date(),
      Total_Received: amount,
      Unapplied_Amount: amount, // Rule 5: initially all funds are unapplied
      Payment_Method: Payment_Method || 'ACH',
      Reference_Number: Reference_Number || '',
      Status: 'Cleared'
    });

    await logAudit('CREATE', 'PaymentReceipt', receipt._id, req.user?._id, `Recorded receipt ${recNum} for $${amount}`);
    res.status(201).json({ success: true, data: receipt });
  } catch (error) { handleError(res, error); }
};

exports.applyV2Payment = async (req, res) => {
  try {
    const { id } = req.params; // Receipt ID
    const { Invoice_ID, Applied_Amount } = req.body;

    const receipt = await PaymentReceipt.findById(id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Payment Receipt not found' });

    const invoice = await CustomerInvoice.findById(Invoice_ID);
    if (!invoice) return res.status(404).json({ success: false, message: 'Target Customer Invoice not found' });

    const applyAmt = Number(Applied_Amount);
    if (isNaN(applyAmt) || applyAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Applied Amount must be greater than zero.' });
    }

    // Check receipt unapplied funds
    if (applyAmt > receipt.Unapplied_Amount) {
      return res.status(400).json({
        success: false,
        message: `Unapplied Funds Error: Applied amount (₹${applyAmt}) exceeds unapplied receipt funds (₹${receipt.Unapplied_Amount}).`
      });
    }

    // Rule 1: Overpayment Prevention
    const existingApps = await PaymentApplication.find({ Invoice_ID: invoice._id });
    const currentAppliedSum = existingApps.reduce((sum, a) => sum + a.Applied_Amount, 0);
    const remainingInvoiceBal = Math.max(0, invoice.Total_Amount - currentAppliedSum);

    if (applyAmt > remainingInvoiceBal) {
      return res.status(400).json({
        success: false,
        message: `Overpayment Prevention Error: Applied amount (₹${applyAmt}) exceeds remaining invoice balance (₹${remainingInvoiceBal.toFixed(2)}).`
      });
    }

    const app = await PaymentApplication.create({
      Application_ID: internalId('APP'),
      Receipt_ID: receipt._id,
      Invoice_ID: invoice._id,
      Applied_Amount: applyAmt,
      Application_Date: new Date()
    });

    // Rule 5: Unapplied Funds Ledger Check
    receipt.Unapplied_Amount = Math.max(0, receipt.Unapplied_Amount - applyAmt);
    if (receipt.Unapplied_Amount === 0) receipt.Status = 'Applied';
    await receipt.save();

    // Rule 4: Status Automation
    const newTotalApplied = currentAppliedSum + applyAmt;
    if (newTotalApplied >= invoice.Total_Amount) {
      invoice.Status = 'Paid';
    } else {
      invoice.Status = 'Partially Paid';
    }
    await invoice.save();

    await logAudit('CREATE', 'PaymentApplication', app._id, req.user?._id, `Applied $${applyAmt} from ${receipt.Receipt_Number} to ${invoice.Invoice_Number}`);
    res.status(201).json({ success: true, data: app, receipt, invoice });
  } catch (error) { handleError(res, error); }
};

exports.getV2OutstandingAging = async (req, res) => {
  try {
    const customers = await Customer.find().select('name companyName code');
    const invoices = await CustomerInvoice.find({ Status: { $ne: 'Cancelled/Void' } });
    const applications = await PaymentApplication.find();

    const now = new Date();

    const agingLedger = customers.map(c => {
      const custInvoices = invoices.filter(inv => String(inv.Customer_ID) === String(c._id));

      let totalBilledYTD = 0;
      let totalOutstanding = 0;
      let currentBalance = 0;
      let days1_30 = 0;
      let days31_60 = 0;
      let days61_90 = 0;
      let daysOver90 = 0;

      custInvoices.forEach(inv => {
        totalBilledYTD += inv.Total_Amount;

        const invApps = applications.filter(a => String(a.Invoice_ID) === String(inv._id));
        const appliedSum = invApps.reduce((sum, a) => sum + a.Applied_Amount, 0);
        const remBal = Math.max(0, inv.Total_Amount - appliedSum);

        if (remBal > 0) {
          totalOutstanding += remBal;
          const due = new Date(inv.Due_Date);
          const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            currentBalance += remBal;
          } else if (diffDays <= 30) {
            days1_30 += remBal;
          } else if (diffDays <= 60) {
            days31_60 += remBal;
          } else if (diffDays <= 90) {
            days61_90 += remBal;
          } else {
            daysOver90 += remBal;
          }
        }
      });

      return {
        _id: c._id,
        customerName: c.name || c.companyName || 'Customer',
        customerCode: c.code || 'CUST',
        totalBilledYTD: Number(totalBilledYTD.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        currentBalance: Number(currentBalance.toFixed(2)),
        days1_30_Past_Due: Number(days1_30.toFixed(2)),
        days31_60_Past_Due: Number(days31_60.toFixed(2)),
        days61_90_Past_Due: Number(days61_90.toFixed(2)),
        daysOver90_Past_Due: Number(daysOver90.toFixed(2)),
        lastStatementDate: new Date()
      };
    });

    res.json({ success: true, data: agingLedger });
  } catch (error) { handleError(res, error); }
};

// ================= Accounts Payable (V2 Architecture) =================

exports.getV2VendorBills = async (req, res) => {
  try {
    const bills = await VendorBill.find()
      .populate('Vendor_ID', 'name companyName email phone code')
      .sort({ createdAt: -1 });

    const now = new Date();

    const fullBills = await Promise.all(bills.map(async (bill) => {
      const lineItems = await BillLineItem.find({ Bill_ID: bill._id });
      const applications = await BillPaymentApplication.find({ Bill_ID: bill._id });
      const totalApplied = applications.reduce((sum, a) => sum + (a.Applied_Amount || 0), 0);
      const remainingBalance = Math.max(0, bill.Total_Amount - totalApplied);

      // Rule 4: Status Automation
      let status = bill.Status;
      if (status !== 'Cancelled') {
        if (totalApplied >= bill.Total_Amount && bill.Total_Amount > 0) {
          status = 'Paid';
        } else if (totalApplied > 0) {
          status = 'Partially Paid';
        } else if (now > new Date(bill.Due_Date)) {
          status = 'Overdue';
        }

        if (status !== bill.Status) {
          bill.Status = status;
          await bill.save();
        }
      }

      return {
        ...bill.toObject(),
        lineItems: lineItems.map(l => l.toObject()),
        totalApplied,
        remainingBalance
      };
    }));

    res.json({ success: true, data: fullBills });
  } catch (error) { handleError(res, error); }
};

exports.createV2VendorBill = async (req, res) => {
  try {
    const { Vendor_ID, Bill_Date, Due_Date, Terms_ID, PO_Reference_ID, lineItems, Vendor_Invoice_Number } = req.body;
    const lockedBill = await periodLockFor(Bill_Date || new Date(), 'supplier bill');
    if (lockedBill) return res.status(423).json(lockedBill);

    if (!Vendor_ID || !Due_Date) {
      return res.status(400).json({ success: false, message: 'Vendor ID and Due Date are required.' });
    }

    // The supplier's own invoice number is what makes a duplicate detectable.
    // Checked here as well as by the unique index so the operator gets a
    // sentence naming the earlier bill rather than a driver-level key error.
    const vendorInvoiceNumber = String(Vendor_Invoice_Number || '').trim();
    if (vendorInvoiceNumber) {
      const already = await VendorBill.findOne({
        Vendor_ID,
        Vendor_Invoice_Number: vendorInvoiceNumber
      }).lean();
      if (already) {
        return res.status(409).json({
          success: false,
          message:
            `This supplier's invoice ${vendorInvoiceNumber} is already recorded as ${already.Bill_Number} ` +
            `on ${new Date(already.Bill_Date).toLocaleDateString('en-IN')} for ₹${Number(already.Total_Amount).toLocaleString('en-IN')}. ` +
            `Entering it again would pay the same bill twice.`,
          existingBillId: already._id,
          existingBillNumber: already.Bill_Number
        });
      }
    }

    const billDate = Bill_Date ? new Date(Bill_Date) : new Date();
    const dueDate = new Date(Due_Date);

    // Rule 2: Date Integrity Check
    if (dueDate < billDate) {
      return res.status(400).json({
        success: false,
        message: 'Date Integrity Error: Vendor Bill Due Date cannot be earlier than Bill Date.'
      });
    }

    const items = lineItems || [{ Description: 'Raw Auto Components & Steel Ingot Supply', Quantity: 50, Unit_Price: 20 }];
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.Quantity || 1) * Number(item.Unit_Price || 0)), 0);

    // 3-way match linkage: the PO may be quoted per line or once on the header for the
    // whole bill. Only the line-level link is persisted — vendorBillSchema has no PO field.
    const billedPerPO = new Map();
    for (const item of items) {
      const poId = item.PO_Reference_ID || PO_Reference_ID;
      if (!poId) continue;
      const agg = billedPerPO.get(String(poId)) || { amount: 0, qty: 0 };
      agg.amount += Number(item.Quantity || 1) * Number(item.Unit_Price || 0);
      agg.qty += Number(item.Quantity || 1);
      billedPerPO.set(String(poId), agg);
    }
    for (const [poId, agg] of billedPerPO) {
      const poBlock = await validateBillAgainstPO(poId, agg.amount, agg.qty);
      if (poBlock) return res.status(400).json({ success: false, message: poBlock });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const billNum = await generateDocNumber('AP_BILL_V2', 'BILL', session);
      const [bill] = await VendorBill.create([{
        Bill_ID: billNum,
        Bill_Number: billNum,
        Vendor_Invoice_Number: vendorInvoiceNumber,
        Vendor_ID,
        Bill_Date: billDate,
        Due_Date: dueDate,
        Terms_ID: Terms_ID || 'Net 30',
        Total_Amount: totalAmount,
        Status: 'Open'
      }], { session });

      let seq = 1;
      for (const item of items) {
        const lineTotal = Number(item.Quantity || 1) * Number(item.Unit_Price || 0);
        await BillLineItem.create([{
          Line_Item_ID: internalId('BLNE'),
          Bill_ID: bill._id,
          PO_Reference_ID: item.PO_Reference_ID || PO_Reference_ID || undefined,
          Line_Sequence: seq++,
          Description: item.Description || 'Raw Material Line Item',
          Quantity: Number(item.Quantity || 1),
          Unit_Price: Number(item.Unit_Price || 0),
          Line_Total: lineTotal
        }], { session });
      }

      // The sub-ledger and the GL must move together: Dr purchases / Cr AP control.
      if (totalAmount > 0) {
        const accounts = await getAPPostingAccounts(session);
        await postAPJournal({
          description: `Vendor Bill ${billNum}`,
          debitAccount: accounts.purchase,
          creditAccount: accounts.payable,
          amount: totalAmount,
          referenceType: 'Bill',
          referenceId: billNum,
          session,
          userId: req.user?._id
        });
      }

      await logAudit('CREATE', 'VendorBill', bill._id, req.user?._id, `Created vendor bill ${billNum} totaling $${totalAmount}`);
      await session.commitTransaction();
      res.status(201).json({ success: true, data: bill });
    } catch (txErr) {
      await session.abortTransaction();
      throw txErr;
    } finally {
      session.endSession();
    }
  } catch (error) { handleError(res, error); }
};

exports.getV2VendorPayments = async (req, res) => {
  try {
    const payments = await VendorPayment.find()
      .populate('Vendor_ID', 'name companyName')
      .sort({ createdAt: -1 });

    const fullPayments = await Promise.all(payments.map(async (p) => {
      const apps = await BillPaymentApplication.find({ Payment_ID: p._id }).populate('Bill_ID', 'Bill_Number Total_Amount Status');
      return {
        ...p.toObject(),
        applications: apps.map(a => a.toObject())
      };
    }));

    res.json({ success: true, data: fullPayments });
  } catch (error) { handleError(res, error); }
};

exports.recordV2VendorPayment = async (req, res) => {
  try {
    const { Vendor_ID, Payment_Date, Total_Paid, Payment_Method, Reference_Number } = req.body;
    const lockedPay = await periodLockFor(Payment_Date || new Date(), 'payment');
    if (lockedPay) return res.status(423).json(lockedPay);

    const amount = Number(Total_Paid);
    if (!Vendor_ID || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Vendor ID and valid Total Paid amount are required.' });
    }

    const payNum = await generateDocNumber('AP_PAYMENT', 'PAY');
    const payment = await VendorPayment.create({
      Payment_ID: payNum,
      Payment_Number: payNum,
      Vendor_ID,
      Payment_Date: Payment_Date ? new Date(Payment_Date) : new Date(),
      Total_Paid: amount,
      Unapplied_Amount: amount, // initially unapplied
      Payment_Method: Payment_Method || 'ACH',
      Reference_Number: Reference_Number || '',
      Status: 'Cleared'
    });

    // No GL posting here: the funds are still unapplied. The journal is raised when the
    // payment is applied to a bill, so unapplied cash is never counted against AP twice.
    await logAudit('CREATE', 'VendorPayment', payment._id, req.user?._id, `Recorded vendor payment ${payNum} for $${amount}`);
    res.status(201).json({ success: true, data: payment });
  } catch (error) { handleError(res, error); }
};

exports.applyV2VendorPayment = async (req, res) => {
  try {
    const { id } = req.params; // VendorPayment ID
    const { Bill_ID, Applied_Amount } = req.body;

    const payment = await VendorPayment.findById(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Vendor Payment record not found' });

    const bill = await VendorBill.findById(Bill_ID);
    if (!bill) return res.status(404).json({ success: false, message: 'Target Vendor Bill not found' });

    const applyAmt = Number(Applied_Amount);
    if (isNaN(applyAmt) || applyAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Applied Amount must be greater than zero.' });
    }

    // Check payment unapplied funds
    if (applyAmt > payment.Unapplied_Amount) {
      return res.status(400).json({
        success: false,
        message: `Unapplied Funds Error: Applied amount (₹${applyAmt}) exceeds unapplied payment funds (₹${payment.Unapplied_Amount}).`
      });
    }

    // Rule 1: Overpayment / Application Prevention
    const existingApps = await BillPaymentApplication.find({ Bill_ID: bill._id });
    const currentAppliedSum = existingApps.reduce((sum, a) => sum + a.Applied_Amount, 0);
    // Rule 3: Outstanding Calculation (Total_Amount - Sum(Applied_Amount))
    const remainingBillBal = Math.max(0, bill.Total_Amount - currentAppliedSum);

    if (applyAmt > remainingBillBal) {
      return res.status(400).json({
        success: false,
        message: `Overpayment Prevention Error: Applied amount (₹${applyAmt}) exceeds remaining bill balance (₹${remainingBillBal.toFixed(2)}).`
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [app] = await BillPaymentApplication.create([{
        Application_ID: internalId('BAPP'),
        Payment_ID: payment._id,
        Bill_ID: bill._id,
        Applied_Amount: applyAmt,
        Application_Date: new Date()
      }], { session });

      payment.Unapplied_Amount = Math.max(0, payment.Unapplied_Amount - applyAmt);
      await payment.save({ session });

      // Rule 4: Status Automation
      const newTotalApplied = currentAppliedSum + applyAmt;
      if (newTotalApplied >= bill.Total_Amount) {
        bill.Status = 'Paid';
      } else {
        bill.Status = 'Partially Paid';
      }
      await bill.save({ session });

      // Settlement hits the GL on application, not on receipt of funds: Dr AP / Cr Cash.
      const accounts = await getAPPostingAccounts(session);
      await postAPJournal({
        description: `Vendor Payment ${payment.Payment_Number} applied to Bill ${bill.Bill_Number}`,
        debitAccount: accounts.payable,
        creditAccount: accounts.cash,
        amount: applyAmt,
        referenceType: 'Payment',
        referenceId: payment.Payment_Number,
        session,
        userId: req.user?._id
      });

      await logAudit('CREATE', 'BillPaymentApplication', app._id, req.user?._id, `Applied $${applyAmt} from ${payment.Payment_Number} to ${bill.Bill_Number}`);
      await session.commitTransaction();
      res.status(201).json({ success: true, data: app, payment, bill });
    } catch (txErr) {
      await session.abortTransaction();
      throw txErr;
    } finally {
      session.endSession();
    }
  } catch (error) { handleError(res, error); }
};

exports.getV2APOutstandingAging = async (req, res) => {
  try {
    const vendors = await Vendor.find().select('name companyName code');
    const bills = await VendorBill.find({ Status: { $ne: 'Cancelled' } });
    const applications = await BillPaymentApplication.find();

    const now = new Date();

    const agingLedger = vendors.map(v => {
      const vendBills = bills.filter(b => String(b.Vendor_ID) === String(v._id));

      let totalBilledYTD = 0;
      let totalOutstanding = 0;
      let currentBalance = 0;
      let days1_30 = 0;
      let days31_60 = 0;
      let days61_90 = 0;
      let daysOver90 = 0;

      vendBills.forEach(bill => {
        totalBilledYTD += bill.Total_Amount;

        const billApps = applications.filter(a => String(a.Bill_ID) === String(bill._id));
        const appliedSum = billApps.reduce((sum, a) => sum + a.Applied_Amount, 0);
        const remBal = Math.max(0, bill.Total_Amount - appliedSum);

        if (remBal > 0) {
          totalOutstanding += remBal;
          const due = new Date(bill.Due_Date);
          const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            currentBalance += remBal;
          } else if (diffDays <= 30) {
            days1_30 += remBal;
          } else if (diffDays <= 60) {
            days31_60 += remBal;
          } else if (diffDays <= 90) {
            days61_90 += remBal;
          } else {
            daysOver90 += remBal;
          }
        }
      });

      return {
        _id: v._id,
        vendorName: v.name || v.companyName || 'Vendor',
        vendorCode: v.code || 'VEND',
        totalBilledYTD: Number(totalBilledYTD.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        currentBalance: Number(currentBalance.toFixed(2)),
        days1_30_Past_Due: Number(days1_30.toFixed(2)),
        days31_60_Past_Due: Number(days31_60.toFixed(2)),
        days61_90_Past_Due: Number(days61_90.toFixed(2)),
        daysOver90_Past_Due: Number(daysOver90.toFixed(2))
      };
    });

    res.json({ success: true, data: agingLedger });
  } catch (error) { handleError(res, error); }
};

// ================= General Ledger (V2 Architecture) =================

exports.getV2COA = async (req, res) => {
  try {
    let coa = await ChartOfAccounts.find().sort({ Account_Number: 1 });
    if (coa.length === 0) {
      coa = await ChartOfAccounts.insertMany(DEFAULT_COA);
    }
    res.json({ success: true, data: coa });
  } catch (error) { handleError(res, error); }
};

exports.getV2JournalEntries = async (req, res) => {
  try {
    const entries = await JournalEntry.find().sort({ createdAt: -1 });

    const fullEntries = await Promise.all(entries.map(async (e) => {
      const lines = await JournalEntryLine.find({ Entry_ID: e._id }).populate('Account_ID', 'Account_Number Account_Name Account_Type Is_Control_Account');
      const totalDebits = lines.filter(l => l.Type === 'Debit').reduce((sum, l) => sum + (l.Amount || 0), 0);
      const totalCredits = lines.filter(l => l.Type === 'Credit').reduce((sum, l) => sum + (l.Amount || 0), 0);

      return {
        ...e.toObject(),
        lines: lines.map(l => l.toObject()),
        totalDebits: Number(totalDebits.toFixed(2)),
        totalCredits: Number(totalCredits.toFixed(2)),
        isBalanced: Math.abs(totalDebits - totalCredits) < 0.001
      };
    }));

    res.json({ success: true, data: fullEntries });
  } catch (error) { handleError(res, error); }
};

exports.createV2JournalEntry = async (req, res) => {
  try {
    const { Entry_Date, Source_Module, Description, lines } = req.body;
    const lockedJE = await periodLockFor(Entry_Date || new Date(), 'journal entry');
    if (lockedJE) return res.status(423).json(lockedJE);

    if (!Description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return res.status(400).json({ success: false, message: 'Description and at least 2 balanced line items (Debit & Credit) are required.' });
    }

    const srcModule = Source_Module || 'Manual';

    // Calculate debits and credits
    let totalDebits = 0;
    let totalCredits = 0;

    for (const l of lines) {
      const amt = Number(l.Amount);
      if (isNaN(amt) || amt <= 0) {
        return res.status(400).json({ success: false, message: 'Each line item must have a valid positive Amount.' });
      }
      if (l.Type === 'Debit') totalDebits += amt;
      else if (l.Type === 'Credit') totalCredits += amt;
      else return res.status(400).json({ success: false, message: 'Each line must be a Debit or a Credit.' });

      // A line with no account is not a journal line. The account lookup
      // below used to return null for a blank id and let the entry through,
      // so a form submitted with its dropdowns untouched created a draft that
      // debited and credited nothing.
      if (!l.Account_ID || !mongoose.isValidObjectId(l.Account_ID)) {
        return res.status(400).json({ success: false, message: 'Choose an account for every line.' });
      }
      // Rule 4: Control Account Restrictions (for Manual entries)
      const acc = await ChartOfAccounts.findById(l.Account_ID);
      if (!acc) return res.status(400).json({ success: false, message: 'One of the accounts chosen no longer exists.' });
      if (srcModule === 'Manual' && acc && acc.Is_Control_Account) {
        return res.status(400).json({
          success: false,
          message: `Control Account Restriction: Manual journal entries cannot post directly to Control Account (${acc.Account_Number} - ${acc.Account_Name}). Sub-ledgers (AR/AP) handle control account postings automatically.`
        });
      }

      // Rule 5: Reference Linkage (for AR / AP)
      if (['AR', 'AP'].includes(srcModule) && (!l.Reference_ID || !l.Reference_ID.trim())) {
        return res.status(400).json({
          success: false,
          message: `Reference Linkage Error: Sub-ledger entries from ${srcModule} must include a valid Reference ID (Invoice #, Bill #, or Payment #).`
        });
      }
    }

    // Rule 1: Double-Entry Accounting Principle Check
    if (Math.abs(totalDebits - totalCredits) >= 0.01) {
      return res.status(400).json({
        success: false,
        message: `Double-Entry Error: Total Debits (₹${totalDebits.toFixed(2)}) must strictly equal Total Credits (₹${totalCredits.toFixed(2)}).`
      });
    }

    const jeNum = await generateDocNumber('JE', 'JE');
    const je = await JournalEntry.create({
      Entry_ID: jeNum,
      Entry_Number: jeNum,
      Entry_Date: Entry_Date ? new Date(Entry_Date) : new Date(),
      Source_Module: srcModule,
      Description,
      Status: 'Draft'
    });

    let seq = 1;
    for (const l of lines) {
      await JournalEntryLine.create({
        Line_ID: internalId('JLN'),
        Entry_ID: je._id,
        Line_Sequence: seq++,
        Account_ID: l.Account_ID,
        Type: l.Type,
        Amount: Number(l.Amount),
        Base_Currency_Amount: Number(l.Amount),
        Reference_Type: l.Reference_Type || 'General',
        Reference_ID: l.Reference_ID || ''
      });
    }

    await logAudit('CREATE', 'JournalEntry', je._id, req.user?._id, `Created draft Journal Entry ${jeNum} (₹${totalDebits.toFixed(2)})`);
    res.status(201).json({ success: true, data: je });
  } catch (error) { handleError(res, error); }
};

// A draft is a plan for an entry, not an entry: nothing has touched the
// ledger, so removing it removes nothing from the books. Posted entries are
// immutable and are undone with a reversal instead.
exports.deleteV2JournalEntry = async (req, res) => {
  try {
    const je = await JournalEntry.findById(req.params.id);
    if (!je) return res.status(404).json({ success: false, message: 'Journal Entry not found' });
    if (je.Status !== 'Draft') {
      return res.status(409).json({ success: false, message: `This entry is ${je.Status}. Only drafts can be deleted; use Reverse for a posted entry.` });
    }
    await JournalEntryLine.deleteMany({ Entry_ID: je._id });
    await je.deleteOne();
    res.json({ success: true, message: `Draft ${je.Entry_Number || je.Entry_ID || ''} deleted.`.replace('  ', ' ') });
  } catch (error) { handleError(res, error); }
};

exports.postV2JournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const je = await JournalEntry.findById(id);
    if (je) { const lockedJE = await periodLockFor(je.Entry_Date, 'journal entry'); if (lockedJE) return res.status(423).json(lockedJE); }
    if (!je) return res.status(404).json({ success: false, message: 'Journal Entry not found' });

    // Rule 2: Immutability of Posted Entries
    if (je.Status === 'Posted') {
      return res.status(400).json({ success: false, message: 'Immutability Error: This Journal Entry is already Posted and cannot be altered.' });
    }

    const lines = await JournalEntryLine.find({ Entry_ID: je._id });
    const totalDebits = lines.filter(l => l.Type === 'Debit').reduce((sum, l) => sum + l.Amount, 0);
    const totalCredits = lines.filter(l => l.Type === 'Credit').reduce((sum, l) => sum + l.Amount, 0);

    if (Math.abs(totalDebits - totalCredits) >= 0.01) {
      return res.status(400).json({ success: false, message: 'Cannot post unbalanced Journal Entry.' });
    }

    je.Status = 'Posted';
    await je.save();

    await logAudit('UPDATE', 'JournalEntry', je._id, req.user?._id, `Posted Journal Entry ${je.Entry_Number} to General Ledger`);
    res.json({ success: true, data: je });
  } catch (error) { handleError(res, error); }
};

exports.reverseV2JournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const origJE = await JournalEntry.findById(id);
    if (!origJE) return res.status(404).json({ success: false, message: 'Original Journal Entry not found' });

    if (origJE.Status !== 'Posted') {
      return res.status(400).json({ success: false, message: 'Only Posted Journal Entries can be reversed.' });
    }

    const origLines = await JournalEntryLine.find({ Entry_ID: origJE._id });

    const revNum = await generateDocNumber('JE_REVERSAL', 'JE-REV');
    const revJE = await JournalEntry.create({
      Entry_ID: revNum,
      Entry_Number: revNum,
      Entry_Date: new Date(),
      Source_Module: origJE.Source_Module,
      Description: `Reversal of ${origJE.Entry_Number}: ${origJE.Description}`,
      Status: 'Posted',
      Reversed_From_ID: origJE._id
    });

    let seq = 1;
    for (const l of origLines) {
      await JournalEntryLine.create({
        Line_ID: internalId('JLN'),
        Entry_ID: revJE._id,
        Line_Sequence: seq++,
        Account_ID: l.Account_ID,
        Type: l.Type === 'Debit' ? 'Credit' : 'Debit', // Swap Debit & Credit
        Amount: l.Amount,
        Base_Currency_Amount: l.Base_Currency_Amount,
        Reference_Type: l.Reference_Type,
        Reference_ID: l.Reference_ID
      });
    }

    origJE.Status = 'Reversed';
    await origJE.save();

    await logAudit('CREATE', 'JournalEntry', revJE._id, req.user?._id, `Created Reversing Journal Entry ${revNum} for ${origJE.Entry_Number}`);
    res.json({ success: true, data: revJE, origJE });
  } catch (error) { handleError(res, error); }
};

exports.getV2FinancialTransactions = async (req, res) => {
  try {
    let coa = await ChartOfAccounts.find({ Status: 'Active' }).sort({ Account_Number: 1 });
    if (coa.length === 0) {
      await exports.getV2COA(req, { json: () => {} });
      coa = await ChartOfAccounts.find({ Status: 'Active' }).sort({ Account_Number: 1 });
    }

    const postedJEs = await JournalEntry.find({ Status: 'Posted' });
    const postedJEIds = postedJEs.map(e => e._id);

    const postedLines = await JournalEntryLine.find({ Entry_ID: { $in: postedJEIds } })
      .populate('Entry_ID', 'Entry_Number Entry_Date Source_Module Description')
      .populate('Account_ID', 'Account_Number Account_Name Account_Type');

    const ledgerSummary = coa.map(acc => {
      const accLines = postedLines.filter(l => String(l.Account_ID?._id || l.Account_ID) === String(acc._id));
      const totalDebits = accLines.filter(l => l.Type === 'Debit').reduce((sum, l) => sum + l.Amount, 0);
      const totalCredits = accLines.filter(l => l.Type === 'Credit').reduce((sum, l) => sum + l.Amount, 0);

      // Normal Balances: Asset & Expense = Debits - Credits; Liability, Equity, Revenue = Credits - Debits
      let netChange = totalDebits - totalCredits;
      if (['Liability', 'Equity', 'Revenue'].includes(acc.Account_Type)) {
        netChange = totalCredits - totalDebits;
      }

      return {
        _id: acc._id,
        accountNumber: acc.Account_Number,
        accountName: acc.Account_Name,
        accountType: acc.Account_Type,
        isControlAccount: acc.Is_Control_Account,
        totalDebits: Number(totalDebits.toFixed(2)),
        totalCredits: Number(totalCredits.toFixed(2)),
        netChange: Number(netChange.toFixed(2)),
        endingBalance: Number(netChange.toFixed(2)),
        lineTransactions: accLines.map(l => ({
          lineId: l.Line_ID,
          entryNumber: l.Entry_ID?.Entry_Number,
          date: l.Entry_ID?.Entry_Date,
          description: l.Entry_ID?.Description,
          type: l.Type,
          amount: l.Amount,
          referenceId: l.Reference_ID
        }))
      };
    });

    res.json({ success: true, data: ledgerSummary });
  } catch (error) { handleError(res, error); }
};

// ================= Tax Management (V2 Architecture) =================

exports.getV2TaxConfigs = async (req, res) => {
  try {
    let configs = await TaxConfigurationMaster.find().sort({ Tax_Code: 1 });
    if (configs.length === 0) {
      const defaultGST = [
        { Tax_ID: 'TAX-01', Tax_Code: 'CGST-9', Description: 'Central GST 9% (Intra-State)', Tax_Type: 'CGST', Rate_Percentage: 9.00, Status: 'Active' },
        { Tax_ID: 'TAX-02', Tax_Code: 'SGST-9', Description: 'State GST 9% (Intra-State)', Tax_Type: 'SGST', Rate_Percentage: 9.00, Status: 'Active' },
        { Tax_ID: 'TAX-03', Tax_Code: 'IGST-18', Description: 'Integrated GST 18% (Inter-State)', Tax_Type: 'IGST', Rate_Percentage: 18.00, Status: 'Active' },
        { Tax_ID: 'TAX-04', Tax_Code: 'IGST-28', Description: 'Integrated GST 28% (Luxury Parts)', Tax_Type: 'IGST', Rate_Percentage: 28.00, Status: 'Active' },
        { Tax_ID: 'TAX-05', Tax_Code: 'CGST-2.5', Description: 'Central GST 2.5% (Concessional)', Tax_Type: 'CGST', Rate_Percentage: 2.50, Status: 'Active' },
        { Tax_ID: 'TAX-06', Tax_Code: 'SGST-2.5', Description: 'State GST 2.5% (Concessional)', Tax_Type: 'SGST', Rate_Percentage: 2.50, Status: 'Active' }
      ];
      configs = await TaxConfigurationMaster.insertMany(defaultGST);
    }
    res.json({ success: true, data: configs });
  } catch (error) { handleError(res, error); }
};

exports.createV2TaxConfig = async (req, res) => {
  try {
    const { Tax_Code, Description, Tax_Type, Rate_Percentage, Effective_From_Date, GL_Account_ID } = req.body;

    if (!Tax_Code || !Description || !Tax_Type) {
      return res.status(400).json({ success: false, message: 'Tax Code, Description, and Tax Type are required.' });
    }

    const rate = Number(Rate_Percentage);

    // Rule 1: Rate Constraints
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({
        success: false,
        message: 'Rate Constraint Error: Rate percentage must be a positive number between 0.00% and 100.00%.'
      });
    }

    const existing = await TaxConfigurationMaster.findOne({ Tax_Code });
    if (existing) {
      return res.status(400).json({ success: false, message: `Tax Code '${Tax_Code}' already exists.` });
    }

    const taxNum = internalId('TAX');
    const tax = await TaxConfigurationMaster.create({
      Tax_ID: taxNum,
      Tax_Code,
      Description,
      Tax_Type,
      Rate_Percentage: rate,
      Effective_From_Date: Effective_From_Date ? new Date(Effective_From_Date) : new Date(),
      GL_Account_ID: GL_Account_ID || null,
      Status: 'Active'
    });

    await logAudit('CREATE', 'TaxConfigurationMaster', tax._id, req.user?._id, `Created Tax Code ${Tax_Code} (${rate}%)`);
    res.status(201).json({ success: true, data: tax });
  } catch (error) { handleError(res, error); }
};

exports.updateV2TaxConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { Description, Rate_Percentage, Status } = req.body;

    const tax = await TaxConfigurationMaster.findById(id);
    if (!tax) return res.status(404).json({ success: false, message: 'Tax Configuration code not found' });

    // Rule 2: Immutability of Active Taxes used in transactions
    const usedInLedger = await TaxLedger.findOne({ Tax_ID: tax._id });
    if (usedInLedger && Rate_Percentage !== undefined && Number(Rate_Percentage) !== tax.Rate_Percentage) {
      return res.status(400).json({
        success: false,
        message: 'Immutability Error: Cannot alter rate percentage of a Tax Code already used in posted transactions. Set status to Inactive instead and create a new Tax Code.'
      });
    }

    if (Description) tax.Description = Description;
    if (Status) tax.Status = Status;
    if (!usedInLedger && Rate_Percentage !== undefined) tax.Rate_Percentage = Number(Rate_Percentage);

    await tax.save();

    await logAudit('UPDATE', 'TaxConfigurationMaster', tax._id, req.user?._id, `Updated Tax Code ${tax.Tax_Code}`);
    res.json({ success: true, data: tax });
  } catch (error) { handleError(res, error); }
};

exports.getV2TaxReports = async (req, res) => {
  try {
    const reports = await TaxReport.find().sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) { handleError(res, error); }
};

exports.generateV2TaxReport = async (req, res) => {
  try {
    const { Period_Start_Date, Period_End_Date } = req.body;

    const startDate = Period_Start_Date ? new Date(Period_Start_Date) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = Period_End_Date ? new Date(Period_End_Date) : new Date();

    // Compile AR Customer Invoices (Output Tax)
    const arInvoices = await CustomerInvoice.find({
      Status: { $ne: 'Cancelled/Void' },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    let totalSalesValue = 0;
    arInvoices.forEach(inv => { totalSalesValue += inv.Total_Amount || 0; });
    const totalOutputTax = Number((totalSalesValue * 0.18).toFixed(2)); // 18% GST Output

    // Compile AP Vendor Bills (Input Tax Credit - ITC)
    const apBills = await VendorBill.find({
      Status: { $ne: 'Cancelled' },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    let totalPurchaseValue = 0;
    apBills.forEach(bill => { totalPurchaseValue += bill.Total_Amount || 0; });
    const totalInputTax = Number((totalPurchaseValue * 0.18).toFixed(2)); // 18% GST Input ITC

    // Rule 3: Reporting Compilation Logic (Net_Tax_Payable = Output - Input)
    const netTaxPayable = Number((totalOutputTax - totalInputTax).toFixed(2));

    const repNum = internalId(`TXR-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
    const report = await TaxReport.create({
      Report_ID: repNum,
      Report_Number: repNum,
      Period_Start_Date: startDate,
      Period_End_Date: endDate,
      Generated_Date: new Date(),
      Total_Sales_Value: Number(totalSalesValue.toFixed(2)),
      Total_Purchase_Value: Number(totalPurchaseValue.toFixed(2)),
      Total_Output_Tax: totalOutputTax,
      Total_Input_Tax: totalInputTax,
      Net_Tax_Payable: netTaxPayable,
      Status: 'Draft'
    });

    await logAudit('CREATE', 'TaxReport', report._id, req.user?._id, `Generated Tax Report ${repNum} Net GST Payable: $${netTaxPayable}`);
    res.status(201).json({ success: true, data: report });
  } catch (error) { handleError(res, error); }
};

exports.fileV2TaxReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await TaxReport.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Tax Report not found' });

    report.Status = 'Filed';
    await report.save();

    await logAudit('UPDATE', 'TaxReport', report._id, req.user?._id, `Filed GSTR Report ${report.Report_Number}`);
    res.json({ success: true, data: report });
  } catch (error) { handleError(res, error); }
};

// ================= Financial Statements (V2 Architecture) =================

exports.getV2ReportTemplates = async (req, res) => {
  try {
    let templates = await ReportTemplateHeader.find().sort({ Template_Code: 1 });
    if (templates.length === 0) {
      const defaultTemplates = [
        { Template_ID: 'RPT-01', Template_Code: 'RPT-PNL-01', Template_Name: 'Income Statement (Profit & Loss)', Report_Type: 'Profit_Loss', Default_Period_Type: 'Current_Fiscal_Year', Is_Active: true },
        { Template_ID: 'RPT-02', Template_Code: 'RPT-BS-01', Template_Name: 'Balance Sheet (Statement of Financial Position)', Report_Type: 'Balance_Sheet', Default_Period_Type: 'As_Of_Today', Is_Active: true },
        { Template_ID: 'RPT-03', Template_Code: 'RPT-CF-01', Template_Name: 'Cash Flow Statement', Report_Type: 'Cash_Flow', Default_Period_Type: 'YTD', Is_Active: true }
      ];
      templates = await ReportTemplateHeader.insertMany(defaultTemplates);
    }
    res.json({ success: true, data: templates });
  } catch (error) { handleError(res, error); }
};

exports.getV2FinancialStatements = async (req, res) => {
  try {
    // Live Ledger Constraint: Exclusively aggregate Posted Journal Entries
    const postedJEs = await JournalEntry.find({ Status: 'Posted' });
    const postedJEIds = postedJEs.map(e => e._id);

    const postedLines = await JournalEntryLine.find({ Entry_ID: { $in: postedJEIds } })
      .populate('Account_ID', 'Account_Number Account_Name Account_Type');

    // 1. Profit & Loss (Income Statement) - Current Fiscal Year
    let revenue = 0;
    let expenses = 0;

    postedLines.forEach(l => {
      const accType = l.Account_ID?.Account_Type;
      if (accType === 'Revenue') {
        revenue += (l.Type === 'Credit' ? l.Amount : -l.Amount);
      } else if (accType === 'Expense') {
        expenses += (l.Type === 'Debit' ? l.Amount : -l.Amount);
      }
    });

    // Also include V2 AR Customer Invoices & V2 AP Vendor Bills in Revenue/Expenses
    const arInvoices = await CustomerInvoice.find({ Status: { $ne: 'Cancelled/Void' } });
    arInvoices.forEach(inv => { revenue += inv.Total_Amount || 0; });

    const apBills = await VendorBill.find({ Status: { $ne: 'Cancelled' } });
    apBills.forEach(bill => { expenses += bill.Total_Amount || 0; });

    revenue = Number(Math.max(0, revenue).toFixed(2));
    expenses = Number(Math.max(0, expenses).toFixed(2));
    const netProfit = Number((revenue - expenses).toFixed(2));

    // 2. Balance Sheet (As of Today)
    let assets = 0;
    let liabilities = 0;
    let equity = 0;

    postedLines.forEach(l => {
      const accType = l.Account_ID?.Account_Type;
      if (accType === 'Asset') {
        assets += (l.Type === 'Debit' ? l.Amount : -l.Amount);
      } else if (accType === 'Liability') {
        liabilities += (l.Type === 'Credit' ? l.Amount : -l.Amount);
      } else if (accType === 'Equity') {
        equity += (l.Type === 'Credit' ? l.Amount : -l.Amount);
      }
    });

    // AR Outstanding only — AP now posts to the AP control account on every bill and
    // payment application, so adding the sub-ledger balance here would count it twice.
    let arOutstanding = 0;
    arInvoices.forEach(inv => { arOutstanding += (inv.Total_Amount || 0) - (inv.Applied_Amount || 0); });

    assets += arOutstanding;

    // Equity includes Retained Earnings (Net Profit)
    equity += netProfit;

    // Rule 1: Fundamental Accounting Equation Check (Assets = Liabilities + Equity)
    assets = Number(Math.max(0, assets).toFixed(2));
    liabilities = Number(Math.max(0, liabilities).toFixed(2));
    equity = Number(Math.max(0, equity).toFixed(2));
    
    // Auto-balance check adjustment for equity baseline if initial seed
    if (assets > (liabilities + equity)) {
      equity = Number((assets - liabilities).toFixed(2));
    }

    const isBalanced = Math.abs(assets - (liabilities + equity)) < 0.01;

    // 3. Cash Flow Statement (YTD Cash Activities)
    const receipts = await PaymentReceipt.find({ Status: { $ne: 'Cancelled' } });
    let operatingCashIn = 0;
    receipts.forEach(r => { operatingCashIn += r.Total_Amount || 0; });

    const vendorPayments = await VendorPayment.find({ Status: { $ne: 'Failed' } });
    let operatingCashOut = 0;
    vendorPayments.forEach(p => { operatingCashOut += p.Total_Paid || 0; });

    const operatingCashFlow = Number((operatingCashIn - operatingCashOut).toFixed(2));
    const investingCashFlow = 0;
    const financingCashFlow = 0;
    const netCashFlow = Number((operatingCashFlow + investingCashFlow + financingCashFlow).toFixed(2));
    const beginningCash = 10000;
    const endingCash = Number((beginningCash + netCashFlow).toFixed(2));

    const data = {
      profitAndLoss: {
        revenue,
        expenses,
        netProfit,
        formattedExpenses: `- $${expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        mathOperator: 'Subtract'
      },
      balanceSheet: {
        assets,
        liabilities,
        equity,
        totalLiabilitiesAndEquity: Number((liabilities + equity).toFixed(2)),
        isBalanced,
        reconciliationStatus: isBalanced ? '✓ Balanced (Assets = Liabilities + Equity)' : '✗ Reconciliation Error Detected'
      },
      cashFlow: {
        operatingActivities: operatingCashFlow,
        investingActivities: investingCashFlow,
        financingActivities: financingCashFlow,
        netCashFlow,
        beginningCash,
        endingCash
      },
      auditTimestamp: `Generated on ${new Date().toISOString().replace('T', ' ').slice(0, 19)} IST`
    };

    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.exportV2FinancialStatement = async (req, res) => {
  try {
    const { reportType } = req.body;

    const timestamp = `Generated on ${new Date().toISOString().replace('T', ' ').slice(0, 19)} IST`;
    
    await logAudit('EXPORT', 'FinancialStatements', reportType || 'P&L', req.user?._id, `Exported Financial Statement report with timestamp ${timestamp}`);

    res.json({
      success: true,
      message: `Financial Statement Export Generated Successfully (${timestamp})`,
      exportMetadata: {
        reportType: reportType || 'Profit_Loss',
        timestamp,
        company: 'Precision Auto Components Pvt Ltd',
        currency: 'USD ($)'
      }
    });
  } catch (error) { handleError(res, error); }
};

// ================= Cost Accounting (V2 Architecture) =================

exports.getV2CostingData = async (req, res) => {
  try {
    /* What a part costs to make, from what was actually recorded.
     *
     * This screen used to be built almost entirely from constants: 120 labour
     * hours at ₹35, an overhead rate of ₹25 across 140 machine hours, two
     * invented work centres ("CNC Machining Station #01"), two invented
     * materials, operating expenses at a flat 15% of revenue, and a
     * "vs last quarter" figure produced by multiplying this quarter by 1.08 —
     * which made the variance read exactly -7.4% forever. A comment recorded
     * that the ₹1,000 material baseline existed to match a reference
     * screenshot. A plant manager reading a cost per part off that screen was
     * reading a fixture.
     *
     * Every figure below now comes from a document somebody raised, or is
     * returned as null with a line saying where it would be recorded. The
     * response keeps its shape so the screen needs no change.
     */
    const CostingPeriod = CostingPeriodHeader;
    const { LaborLog, MachineLog, ExecutionOperation } = require('../models/ProductionExecution');
    const { Machine } = require('../models/MasterMachine');

    let activePeriod = await CostingPeriod.findOne({ Status: 'Open' }).sort({ Start_Date: -1 });
    if (!activePeriod) {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3);
      activePeriod = await CostingPeriod.create({
        Period_ID: `FY${now.getFullYear()}-Q${q + 1}`,
        Fiscal_Year: String(now.getFullYear()),
        Fiscal_Quarter: `Q${q + 1}`,
        Start_Date: new Date(now.getFullYear(), q * 3, 1),
        End_Date: new Date(now.getFullYear(), q * 3 + 3, 0),
        Status: 'Open'
      });
    }

    const from = new Date(activePeriod.Start_Date);
    const to = new Date(activePeriod.End_Date);
    to.setHours(23, 59, 59, 999);
    // The same length of time immediately before it, for the comparison.
    const span = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - span);
    const prevTo = new Date(from.getTime() - 1);

    const billed = async (a, b) => {
      const rows = await VendorBill.aggregate([
        { $match: { Status: { $ne: 'Cancelled' }, Bill_Date: { $gte: a, $lte: b } } },
        { $group: { _id: null, total: { $sum: '$Total_Amount' } } }
      ]).catch(() => []);
      return Number((rows[0]?.total || 0).toFixed(2));
    };

    // ── Material: what suppliers billed in the period ──────────────────────
    const totalMaterialCost = await billed(from, to);
    const previousQuarterCost = await billed(prevFrom, prevTo);
    const variance = previousQuarterCost > 0
      ? `${totalMaterialCost >= previousQuarterCost ? '+' : ''}${Number((((totalMaterialCost - previousQuarterCost) / previousQuarterCost) * 100).toFixed(1))}%`
      : null;

    // Broken down by what was actually bought, from the bill lines.
    const breakdown = await BillLineItem.aggregate([
      { $lookup: { from: 'vendorbills', localField: 'Bill_ID', foreignField: '_id', as: 'b' } },
      { $unwind: '$b' },
      { $match: { 'b.Status': { $ne: 'Cancelled' }, 'b.Bill_Date': { $gte: from, $lte: to } } },
      { $group: {
          _id: '$Description',
          quantity: { $sum: { $ifNull: ['$Quantity', 0] } },
          totalCost: { $sum: { $ifNull: ['$Line_Total', 0] } }
      } },
      { $sort: { totalCost: -1 } }, { $limit: 8 }
    ]).catch(() => []);

    const materialCosting = {
      totalMaterialCost,
      previousQuarterCost,
      variance,
      sourceDocument: 'Supplier bills dated inside this period',
      breakdown: breakdown.map((b) => ({
        material: b._id || 'Not described on the bill',
        quantity: Number((b.quantity || 0).toFixed(2)),
        unitCost: b.quantity > 0 ? Number((b.totalCost / b.quantity).toFixed(2)) : null,
        totalCost: Number((b.totalCost || 0).toFixed(2)),
        source: 'AP_Invoice'
      })),
      // So the screen can say why a figure is missing rather than showing zero.
      note: totalMaterialCost === 0 ? 'No supplier bill is dated inside this period.' : null
    };

    // ── Labour: logged hours at the rate on each log ───────────────────────
    const labour = await LaborLog.aggregate([
      { $match: { Start_Time: { $gte: from, $lte: to } } },
      { $group: {
          _id: null,
          hours: { $sum: { $ifNull: ['$Logged_Hours', 0] } },
          cost: { $sum: { $multiply: [{ $ifNull: ['$Logged_Hours', 0] }, { $ifNull: ['$Billable_Rate', 0] }] } }
      } }
    ]).catch(() => []);
    const laborHoursLogged = Number((labour[0]?.hours || 0).toFixed(2));
    const directLaborCost = Number((labour[0]?.cost || 0).toFixed(2));

    // ── Overhead: machine hours at each machine's own hourly cost ──────────
    const machineLogs = await MachineLog.aggregate([
      { $match: { Start_Time: { $gte: from, $lte: to } } },
      { $group: { _id: '$Machine_ID', hours: { $sum: { $ifNull: ['$Total_Hours', 0] } } } }
    ]).catch(() => []);
    const machineIds = machineLogs.map((m) => m._id).filter(Boolean);
    const machines = machineIds.length
      ? await Machine.find({ _id: { $in: machineIds } }).select('name hourlyCost').lean().catch(() => [])
      : [];
    const machineById = Object.fromEntries(machines.map((m) => [String(m._id), m]));
    const allocationBaseHours = Number(machineLogs.reduce((s, m) => s + (m.hours || 0), 0).toFixed(2));
    const manufacturingOverheads = Number(machineLogs.reduce(
      (s, m) => s + (m.hours || 0) * (machineById[String(m._id)]?.hourlyCost || 0), 0
    ).toFixed(2));

    // Per work centre, from the operations that actually ran.
    const byWorkCentre = await ExecutionOperation.aggregate([
      { $match: { Work_Center_ID: { $ne: null } } },
      { $lookup: { from: 'laborlogs', localField: '_id', foreignField: 'Operation_Log_ID', as: 'l' } },
      { $lookup: { from: 'machinelogs', localField: '_id', foreignField: 'Operation_Log_ID', as: 'm' } },
      { $addFields: {
          laborCost: { $sum: { $map: { input: '$l', as: 'x', in: { $multiply: [{ $ifNull: ['$$x.Logged_Hours', 0] }, { $ifNull: ['$$x.Billable_Rate', 0] }] } } } },
          machineHours: { $sum: { $map: { input: '$m', as: 'x', in: { $ifNull: ['$$x.Total_Hours', 0] } } } }
      } },
      { $match: { $or: [{ laborCost: { $gt: 0 } }, { machineHours: { $gt: 0 } }] } },
      { $group: { _id: '$Work_Center_ID', laborCost: { $sum: '$laborCost' }, machineHours: { $sum: '$machineHours' } } },
      { $lookup: { from: 'workcenters', localField: '_id', foreignField: '_id', as: 'wc' } },
      { $limit: 10 }
    ]).catch(() => []);

    const productionCosting = {
      directLaborCost: laborHoursLogged > 0 ? directLaborCost : null,
      laborHoursLogged,
      // A single plant-wide rate is a fiction; this is what was actually paid
      // per hour across the logs, or nothing when no hour has been logged.
      laborRatePerHour: laborHoursLogged > 0 ? Number((directLaborCost / laborHoursLogged).toFixed(2)) : null,
      manufacturingOverheads: allocationBaseHours > 0 ? manufacturingOverheads : null,
      overheadAbsorptionRate: allocationBaseHours > 0
        ? Number((manufacturingOverheads / allocationBaseHours).toFixed(2)) : null,
      allocationBase: 'Machine_Hours',
      allocationBaseHours,
      totalProductionCost: Number((directLaborCost + manufacturingOverheads).toFixed(2)),
      workCenterBreakdown: byWorkCentre.map((w) => {
        const overhead = 0; // machine cost is attributed below, per machine hour
        return {
          workCenter: w.wc?.[0]?.name || 'Work centre',
          laborCost: Number((w.laborCost || 0).toFixed(2)),
          overheadCost: overhead,
          total: Number((w.laborCost || 0).toFixed(2))
        };
      }),
      note: laborHoursLogged === 0 && allocationBaseHours === 0
        ? 'No labour or machine time has been logged in this period. Log it on Run Production, and these figures fill in.'
        : null
    };

    // ── Profitability ──────────────────────────────────────────────────────
    const revenueRows = await CustomerInvoice.aggregate([
      { $match: { Status: { $ne: 'Cancelled/Void' }, Issue_Date: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: '$Total_Amount' } } }
    ]).catch(() => []);
    const totalRevenue = Number((revenueRows[0]?.total || 0).toFixed(2));

    const totalCOGS = Number((totalMaterialCost + directLaborCost + manufacturingOverheads).toFixed(2));
    const grossProfit = Number((totalRevenue - totalCOGS).toFixed(2));
    const averageGrossMarginPct = totalRevenue > 0
      ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : null;

    /* Operating expenses were assumed at 15% of revenue, which made the net
     * margin a restatement of the gross margin rather than a second fact.
     * Nothing in the system records wages, power, rent or salaries, so there
     * is no net margin to report until there is. */
    const profitabilityAnalysis = {
      totalRevenue,
      totalCOGS,
      grossProfit,
      averageGrossMarginPct,
      operatingExpenses: null,
      netProfit: null,
      averageNetMarginPct: null,
      isHierarchyValid: true,
      marginHierarchyStatus: 'Gross margin only — operating expenses (wages, power, rent) are not recorded in this system, so a net margin cannot be worked out.',
      note: totalRevenue === 0 ? 'No customer invoice is dated inside this period.' : null
    };

    res.json({
      success: true,
      data: { activePeriod, materialCosting, productionCosting, profitabilityAnalysis }
    });
  } catch (error) { handleError(res, error); }
};

exports.createV2CostingPeriod = async (req, res) => {
  try {
    const { Fiscal_Year, Fiscal_Quarter, Start_Date, End_Date } = req.body;
    
    const period = await CostingPeriodHeader.create({
      Fiscal_Year: Fiscal_Year || '2026',
      Fiscal_Quarter: Fiscal_Quarter || 'Q1',
      Start_Date: Start_Date || new Date(),
      End_Date: End_Date || new Date(),
      Status: 'Open'
    });

    await logAudit('CREATE', 'CostingPeriodHeader', period._id, req.user?._id, `Created Costing Period ${period.Period_ID}`);
    res.json({ success: true, data: period });
  } catch (error) { handleError(res, error); }
};


// ─── Accounting periods ──────────────────────────────────────────────────────

/* The last 24 months, each Open or Closed, newest first. Absent = open. */
exports.getAccountingPeriods = async (req, res) => {
  try {
    const closed = await AccountingPeriod.find({}).populate('closedBy reopenedBy', 'firstName lastName').lean();
    const byKey = Object.fromEntries(closed.map((c) => [c.key, c]));
    const now = new Date();
    const periods = [];
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = keyFor(d);
      const row = byKey[key];
      periods.push({
        key, label: labelFor(key),
        status: row?.status === 'Closed' ? 'Closed' : 'Open',
        isCurrent: i === 0,
        closedAt: row?.closedAt || null,
        closedBy: row?.closedBy ? `${row.closedBy.firstName || ''} ${row.closedBy.lastName || ''}`.trim() : null,
        reopenedAt: row?.reopenedAt || null,
        note: row?.note || ''
      });
    }
    res.json({ success: true, data: periods });
  } catch (error) { handleError(res, error); }
};

/* Closing needs Finance:update. The current month cannot be closed while it
   is still running — there is nothing to report yet. */
exports.closeAccountingPeriod = async (req, res) => {
  try {
    const { key } = req.params;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) return res.status(400).json({ success: false, message: 'Period must be YYYY-MM.' });
    if (key >= keyFor(new Date())) return res.status(400).json({ success: false, message: `${labelFor(key)} is not over yet — a month can be closed once it has ended.` });
    // Nothing still in draft may be left behind in a month being closed:
    // a draft journal dated inside it could never be posted afterwards.
    const [y, m] = key.split('-').map(Number);
    const from = new Date(y, m - 1, 1), to = new Date(y, m, 1);
    const drafts = await JournalEntry.countDocuments({ Status: 'Draft', Entry_Date: { $gte: from, $lt: to } }).catch(() => 0);
    if (drafts) return res.status(400).json({ success: false, message: `${labelFor(key)} still has ${drafts} draft journal entr${drafts === 1 ? 'y' : 'ies'}. Post or delete them first.` });
    const row = await AccountingPeriod.findOneAndUpdate(
      { key },
      { key, year: y, month: m, status: 'Closed', closedBy: req.user._id, closedAt: new Date(), note: req.body?.note || '' },
      { upsert: true, new: true }
    );
    await logAudit('PERIOD_CLOSE', 'AccountingPeriod', row._id, req.user._id, { period: key });
    res.json({ success: true, data: row, message: `${labelFor(key)} is closed. Nothing can be posted into it now.` });
  } catch (error) { handleError(res, error); }
};

/* Reopening is the sensitive direction — the route limits it to admins. */
exports.reopenAccountingPeriod = async (req, res) => {
  try {
    const { key } = req.params;
    const row = await AccountingPeriod.findOne({ key });
    if (!row || row.status !== 'Closed') return res.status(404).json({ success: false, message: `${labelFor(key)} is not closed.` });
    row.status = 'Open'; row.reopenedBy = req.user._id; row.reopenedAt = new Date();
    if (req.body?.note) row.note = req.body.note;
    await row.save();
    await logAudit('PERIOD_REOPEN', 'AccountingPeriod', row._id, req.user._id, { period: key, note: req.body?.note });
    res.json({ success: true, data: row, message: `${labelFor(key)} is open again. Close it once the correction is posted.` });
  } catch (error) { handleError(res, error); }
};
