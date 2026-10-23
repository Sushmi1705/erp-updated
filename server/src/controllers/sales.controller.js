const mongoose = require('mongoose');
const { editable } = require('../utils/safeBody');
const { handleError } = require('../utils/errorHandler');
const {
  InquiryHeader, InquiryLineItem, CrossReference, FeasibilityReview, FollowUp, SalesInquiry
} = require('../models/SalesInquiry');
const { SalesQuotation, QuotationHeader, QuotationRevision, QuotationLineItem, QuoteTaxDiscount, QuoteApproval } = require('../models/SalesQuotation');
const { SalesOrder, SOHeader, SOLineItem, SODeliverySchedule, SOAllocation } = require('../models/SalesOrder');
const InventoryStock  = require('../models/InventoryStock');
const { Customer }    = require('../models/MasterCustomer');
const { AuditLog }    = require('../models/Audit');
const FinanceAR       = require('../models/FinanceAR');
const { CustomerInvoice } = require('../models/AccountsReceivable');
const { generateDocNumber } = require('../utils/docNumbering');

const logAudit = async (action, entityType, entityId, userId, changes) => {
  try {
    await AuditLog.create({
      action, module: entityType, recordId: entityId,
      changedBy: userId, newValue: changes || null
    });
  } catch (err) { console.error('Audit Log Error:', err); }
};

// ── Helper: auto-generate line sequence ─────────────────────────────────────
const nextLineSequence = async (inquiryId) => {
  const last = await InquiryLineItem.findOne({ inquiryId }).sort({ lineSequence: -1 });
  return last ? last.lineSequence + 10 : 10;
};

// ─────────────────────────────────────────────────────────────────────────────
// A. INQUIRY HEADER
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllInquiries = async (req, res) => {
  try {
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip  = (page - 1) * limit;
    const data  = await InquiryHeader.find()
      .populate('customerId',  'name code status')
      .populate('salesRepId',  'firstName lastName email')
      .sort({ updatedAt: -1 }).skip(skip).limit(limit);
    const total = await InquiryHeader.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, data });
  } catch (error) { handleError(res, error); }
};

exports.getInquiryById = async (req, res) => {
  try {
    const data = await InquiryHeader.findById(req.params.id)
      .populate('customerId', 'name code status creditLimit')
      .populate('salesRepId', 'name email');
    if (!data) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.createInquiry = async (req, res) => {
  try {
    // Validation Rule 4: Block if customer is "Hold" or "Blacklisted" (maps to "Inactive" status)
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    if (customer.status === 'Inactive') {
      return res.status(400).json({
        success: false,
        message: `Customer Credit Check Failed: Customer "${customer.name}" is marked Inactive (Hold/Blacklisted). An inquiry cannot be created.`
      });
    }

    const data = await InquiryHeader.create(req.body);
    await logAudit('CREATE', 'InquiryHeader', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateInquiry = async (req, res) => {
  try {
    const inquiry = await InquiryHeader.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    const data = await InquiryHeader.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    await logAudit('UPDATE', 'InquiryHeader', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await InquiryHeader.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });

    // Validation Rule 3: Cannot go New → Active without at least 1 line item
    if (inquiry.status === 'New' && status === 'Active') {
      const lineCount = await InquiryLineItem.countDocuments({ inquiryId: inquiry._id });
      if (lineCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Active Status Mandate: Cannot activate an inquiry with 0 line items. Add at least one product line first.'
        });
      }
    }

    // Validation Rule 1: Cannot go to "Quoted" if unlinked lines don't have Approved feasibility
    if (status === 'Quoted') {
      const unlinkedLines = await InquiryLineItem.find({ inquiryId: inquiry._id, productId: null });
      for (const line of unlinkedLines) {
        const review = await FeasibilityReview.findOne({ inquiryLineId: line._id });
        if (!review || review.approvalStatus !== 'Approved') {
          return res.status(400).json({
            success: false,
            message: `Feasibility Gate: Line "${line.customerPartNumber || line._id}" is a new/unrecognized part and does not have an Approved Feasibility Review. Approve the review before quoting.`
          });
        }
      }
    }

    inquiry.status = status;
    await inquiry.save();
    await logAudit('STATUS_CHANGE', 'InquiryHeader', inquiry._id, req.user._id, { status });
    res.json({ success: true, data: inquiry });
  } catch (error) { handleError(res, error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// B. INQUIRY LINE ITEMS
// ─────────────────────────────────────────────────────────────────────────────
exports.getLineItemsByInquiry = async (req, res) => {
  try {
    const data = await InquiryLineItem.find({ inquiryId: req.params.inquiryId })
      .populate('productId', 'name code')
      .populate('uomId',     'name abbreviation')
      .sort({ lineSequence: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createLineItem = async (req, res) => {
  try {
    const { customerPartNumber } = req.body;
    // Parent id comes from the nested route; body value kept only as a fallback
    // for older callers that duplicated it in the payload.
    const inquiryId = req.params.inquiryId || req.body.inquiryId;
    const inquiry = await InquiryHeader.findById(inquiryId).populate('customerId', 'name status');
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });

    // Validation Rule 5: Lines are locked once Quotation is generated
    if (inquiry.quotationId) {
      return res.status(400).json({
        success: false,
        message: 'Quotation Lock: A Quotation has already been generated from this Inquiry. Line Items are locked (read-only). Create a new Inquiry or revision for further changes.'
      });
    }

    // Validation Rule 2: Duplicate Part Warning (same Customer + Part# within 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (customerPartNumber) {
      const existingInquiries = await InquiryHeader.find({
        customerId: inquiry.customerId._id,
        status:     { $nin: ['Closed-Won', 'Closed-Lost'] },
        createdAt:  { $gte: thirtyDaysAgo }
      }).select('_id inquiryNumber');

      const existingIds = existingInquiries.map(i => i._id).filter(id => id.toString() !== inquiryId);
      if (existingIds.length > 0) {
        const duplicate = await InquiryLineItem.findOne({
          inquiryId:          { $in: existingIds },
          customerPartNumber: customerPartNumber.trim()
        });
        if (duplicate) {
          // Soft warning — we still allow creation but warn
          req.duplicateWarning = `⚠️ Duplicate Warning: Customer Part# "${customerPartNumber}" was already added for this customer in the last 30 days. Proceeding, but please verify with the sales team.`;
        }
      }
    }

    const lineSequence = await nextLineSequence(inquiryId);
    const payload = { ...req.body, inquiryId, lineSequence: req.body.lineSequence || lineSequence };
    const data = await InquiryLineItem.create(payload);
    await logAudit('CREATE', 'InquiryLineItem', data._id, req.user._id);

    res.status(201).json({
      success: true,
      data,
      warning: req.duplicateWarning || null
    });
  } catch (error) { handleError(res, error); }
};

exports.updateLineItem = async (req, res) => {
  try {
    const line = await InquiryLineItem.findById(req.params.lineId);
    if (!line) return res.status(404).json({ success: false, message: 'Line item not found' });

    // Validation Rule 5: Read-only once quoted
    if (line.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Quotation Lock: This line item is locked because a Quotation has been generated. No further edits allowed.'
      });
    }

    const data = await InquiryLineItem.findByIdAndUpdate(req.params.lineId, req.body, { new: true, runValidators: true });
    await logAudit('UPDATE', 'InquiryLineItem', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteLineItem = async (req, res) => {
  try {
    const line = await InquiryLineItem.findById(req.params.lineId);
    if (!line) return res.status(404).json({ success: false, message: 'Line item not found' });
    if (line.isLocked) {
      return res.status(400).json({ success: false, message: 'Cannot delete a locked line item.' });
    }
    await InquiryLineItem.findByIdAndUpdate(req.params.lineId, { isDeleted: true });
    res.json({ success: true, message: 'Line item removed.' });
  } catch (error) { handleError(res, error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// C. CROSS-REFERENCE & FITMENT
// ─────────────────────────────────────────────────────────────────────────────
exports.getCrossRefsByLine = async (req, res) => {
  try {
    const data = await CrossReference.find({ inquiryLineId: req.params.lineId })
      .populate('internalProductId', 'name code');
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createCrossRef = async (req, res) => {
  try {
    // If setting as primary, clear existing primary for this line
    if (req.body.isPrimaryMatch) {
      await CrossReference.updateMany({ inquiryLineId: req.body.inquiryLineId }, { isPrimaryMatch: false });
    }
    const data = await CrossReference.create(req.body);
    await logAudit('CREATE', 'CrossReference', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateCrossRef = async (req, res) => {
  try {
    if (req.body.isPrimaryMatch) {
      const existing = await CrossReference.findById(req.params.crossRefId);
      if (existing) {
        await CrossReference.updateMany({ inquiryLineId: existing.inquiryLineId, _id: { $ne: existing._id } }, { isPrimaryMatch: false });
      }
    }
    const data = await CrossReference.findByIdAndUpdate(req.params.crossRefId, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Cross reference not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteCrossRef = async (req, res) => {
  try {
    await CrossReference.findByIdAndUpdate(req.params.crossRefId, { isDeleted: true });
    res.json({ success: true, message: 'Cross reference removed.' });
  } catch (error) { handleError(res, error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// D. ENGINEERING FEASIBILITY REVIEW
// ─────────────────────────────────────────────────────────────────────────────
exports.getFeasibilityByLine = async (req, res) => {
  try {
    const data = await FeasibilityReview.findOne({ inquiryLineId: req.params.lineId });
    res.json({ success: true, data: data || null });
  } catch (error) { handleError(res, error); }
};

exports.upsertFeasibility = async (req, res) => {
  try {
    const data = await FeasibilityReview.findOneAndUpdate(
      { inquiryLineId: req.params.lineId },
      { ...req.body, inquiryLineId: req.params.lineId },
      { new: true, upsert: true, runValidators: true }
    );
    await logAudit('UPSERT', 'FeasibilityReview', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// E. FOLLOW-UPS & COMMUNICATIONS
// ─────────────────────────────────────────────────────────────────────────────
exports.getFollowUpsByInquiry = async (req, res) => {
  try {
    const data = await FollowUp.find({ inquiryId: req.params.inquiryId }).sort({ activityDate: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createFollowUp = async (req, res) => {
  try {
    const data = await FollowUp.create({ ...req.body, inquiryId: req.params.inquiryId });
    await logAudit('CREATE', 'FollowUp', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateFollowUp = async (req, res) => {
  try {
    const data = await FollowUp.findByIdAndUpdate(req.params.followUpId, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteFollowUp = async (req, res) => {
  try {
    await FollowUp.findByIdAndUpdate(req.params.followUpId, { isDeleted: true });
    res.json({ success: true, message: 'Follow-up removed.' });
  } catch (error) { handleError(res, error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY STUBS — keep old routes working for Quotation / Order modules
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllInquiriesLegacy = exports.getAllInquiries;
exports.createInquiry_legacy  = exports.createInquiry;
exports.updateInquiry_legacy  = exports.updateInquiry;

// ─────────────────────────────────────────────────────────────────────────────
// QUOTATION Management (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllQuotations = async (req, res) => {
  try {
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip  = (page - 1) * limit;
    const quotations = await SalesQuotation.find()
      .populate('customerId', 'name code')
      .populate('inquiryId',  'inquiryNumber')
      .sort({ updatedAt: -1 }).skip(skip).limit(limit);
    const total = await SalesQuotation.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, data: quotations });
  } catch (error) { handleError(res, error); }
};

exports.createQuotation = async (req, res) => {
  try {
    const { quotationNumber, inquiryId, customerId, items, summary, validUntil } = req.body;

    const initialVersion = {
      revisionNumber: '1.0',
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'Draft',
      items: items || [],
      summary: summary || { subTotal: 0, totalTax: 0, totalDiscount: 0, grandTotal: 0 },
      changeHistory: [{ action: 'Initial Creation', user: req.user._id, notes: 'Draft Quotation created' }]
    };

    const newQuotation = await SalesQuotation.create({ quotationNumber, inquiryId, customerId, versions: [initialVersion] });
    newQuotation.activeVersionId = newQuotation.versions[0]._id;
    await newQuotation.save();

    // Validation Rule 5: Lock all Inquiry Line Items once Quotation is generated
    if (inquiryId) {
      await InquiryLineItem.updateMany({ inquiryId }, { isLocked: true, lineStatus: 'Quoted' });
      await InquiryHeader.findByIdAndUpdate(inquiryId, { quotationId: newQuotation._id, status: 'Quoted' });
    }

    await logAudit('CREATE', 'SalesQuotation', newQuotation._id, req.user._id);
    res.status(201).json({ success: true, data: newQuotation });
  } catch (error) { handleError(res, error); }
};

exports.changeQuotationStatus = async (req, res) => {
  try {
    const { versionId, status, notes } = req.body;
    const quotation = await SalesQuotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    const version = quotation.versions.id(versionId);
    if (!version) return res.status(404).json({ success: false, message: 'Version not found' });
    version.status = status;
    version.changeHistory.push({ action: `Status changed to ${status}`, user: req.user._id, notes: notes || '' });
    if (status === 'Approved') {
      quotation.versions.forEach(v => {
        if (v._id.toString() !== versionId.toString() && v.status === 'Approved') v.status = 'Obsolete';
      });
      quotation.activeVersionId = version._id;
    }
    await quotation.save();
    await logAudit('STATUS_CHANGE', 'SalesQuotation', quotation._id, req.user._id, { versionId, status });
    res.json({ success: true, data: quotation });
  } catch (error) { handleError(res, error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// SALES ORDER Management (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip  = (page - 1) * limit;
    // Orders live in two books: the legacy SalesOrder collection and the V2
    // SOHeader collection that the Sales Order Master page writes to. Dispatch
    // planning picks its order from this endpoint, so both have to be listed
    // here or a V2 order can never be selected for delivery.
    const legacyOrders = await SalesOrder.find()
      .populate('customerId',  'name code')
      .populate('quotationId', 'quotationNumber')
      .sort({ updatedAt: -1 }).limit(skip + limit).lean();
    const v2Orders = await SOHeader.find()
      .populate('customerId', 'name code')
      .sort({ updatedAt: -1 }).limit(skip + limit).lean();

    const orders = [...legacyOrders, ...v2Orders]
      .map(o => ({
        ...o,
        // Flat labels the order dropdowns render; SOHeader stores the value as grandTotal.
        customerName: o.customerName || o.customerId?.name || '',
        totalAmount:  o.totalAmount ?? o.grandTotal ?? 0
      }))
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .slice(skip, skip + limit);

    const total = (await SalesOrder.countDocuments()) + (await SOHeader.countDocuments());
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, data: orders });
  } catch (error) { handleError(res, error); }
};


/* Would this order put the customer past the credit we have agreed to carry?
 *
 * This lived inline in createOrder — the legacy endpoint, writing to a table
 * the application stopped using. The screen raises orders through
 * createSOHeader, which had no check at all, so ₹26 crore could be booked
 * against a ₹50 lakh limit. One definition, called from both, is what stops
 * the two drifting apart again.
 *
 * Returns null when the order is fine, or a ready-to-send error payload.
 */
const creditLimitBreach = async (customerId, orderValue, { excludeOrderId = null } = {}) => {
  if (!customerId) return null;

  const customer = await Customer.findById(customerId).select('creditLimit name').lean();
  if (!customer || !(customer.creditLimit > 0)) return null;   // no limit set = no limit

  // Exposure is everything the customer could end up owing: invoices not yet
  // paid (both AR tables; the V2 figure is the invoice less what has been
  // applied to it), plus orders booked and not yet invoiced, plus this one.
  // The approval path used to measure only V1 invoices and the booking path
  // only invoices — two different answers to "are they over the limit".
  // An order that has already been invoiced is in the receivable figure; if
  // its status is still Processing or Partially Shipped it was being counted a
  // second time under "booked, not yet invoiced". The V1 invoice carries its
  // order id, so those orders drop out of the booked total. (V2 invoices are
  // raised against a customer, not an order, so they cannot be matched.)
  const invoicedOrderIds = await FinanceAR.distinct('salesOrderId', {
    customerId: customer._id, salesOrderId: { $ne: null }, status: { $ne: 'Cancelled' }
  }).catch(() => []);
  const [v1AR, v2AR, openOrders] = await Promise.all([
    FinanceAR.aggregate([
      { $match: { customerId: customer._id, status: { $nin: ['Paid', 'Cancelled', 'Written Off'] } } },
      { $group: { _id: null, total: { $sum: '$outstandingAmount' } } }
    ]).catch(() => []),
    CustomerInvoice.aggregate([
      { $match: { Customer_ID: customer._id, Status: { $nin: ['Paid', 'Cancelled/Void', 'Draft'] } } },
      { $lookup: { from: 'paymentapplications', let: { id: '$_id' }, pipeline: [{ $match: { $expr: { $eq: ['$Invoice_ID', '$$id'] }, isDeleted: { $ne: true } } }, { $group: { _id: null, a: { $sum: '$Applied_Amount' } } }], as: 'ap' } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$Total_Amount', { $ifNull: [{ $arrayElemAt: ['$ap.a', 0] }, 0] }] } } } }
    ]).catch(() => []),
    SOHeader.aggregate([
      { $match: {
          customerId: customer._id,
          status: { $in: ['Pending Approval', 'Approved', 'Processing', 'Partially Shipped'] },
          _id: {
            $nin: [
              ...invoicedOrderIds,
              ...(excludeOrderId ? [new mongoose.Types.ObjectId(String(excludeOrderId))] : [])
            ]
          }
      } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$grandTotal', { $ifNull: ['$subTotal', 0] }] } } } }
    ]).catch(() => [])
  ]);

  const outstanding = (v1AR[0]?.total || 0) + (v2AR[0]?.total || 0);
  const booked = openOrders[0]?.total || 0;
  const newOrderValue = Number(orderValue) || 0;
  if (outstanding + booked + newOrderValue <= customer.creditLimit) return null;

  const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN');
  return {
    success: false,
    message:
      `Credit limit exceeded for ${customer.name || customerId}. ` +
      `Limit ${rupees(customer.creditLimit)}, unpaid invoices ${rupees(outstanding)}, ` +
      `other open orders ${rupees(booked)}, this order ${rupees(newOrderValue)}. ` +
      `Collect against the outstanding invoices or raise the limit before booking this.`,
    creditLimit: customer.creditLimit,
    outstanding,
    openOrders: booked,
    newOrderValue
  };
};

exports.createOrder = async (req, res) => {
  try {
    const breach = await creditLimitBreach(
      req.body.customerId,
      req.body.grandTotal || req.body.subTotal
    );
    if (breach) return res.status(422).json(breach);

    const newOrder = await SalesOrder.create({
      ...req.body,
      approvalHistory: [{ user: req.user._id, action: 'Created', notes: 'Initial Order Creation' }]
    });
    await logAudit('CREATE', 'SalesOrder', newOrder._id, req.user._id);
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) { handleError(res, error); }
};


exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (status === 'Approved' && order.status !== 'Approved') {
      return res.status(403).json({ success: false, message: 'Status cannot be manually set to Approved. It must go through the Approval Center.' });
    }
    order.status = status;
    order.trackingStatus.orderStatus = status;
    order.approvalHistory.push({ user: req.user._id, action: `Status changed to ${status}`, notes: notes || '' });
    await order.save();
    await logAudit('STATUS_UPDATE', 'SalesOrder', order._id, req.user._id, { status });
    res.json({ success: true, data: order });
  } catch (error) { handleError(res, error); }
};

exports.performATPCheck = async (req, res) => {
  try {
    const { deliveryCommitment, notes } = req.body;
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    let allAvailable = true;
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const stocks = await InventoryStock.aggregate([
          { $match: { materialId: item.productId } },
          { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
        ]);
        const available = stocks.length > 0 ? stocks[0].total : 0;
        if (available < item.quantity) { allAvailable = false; break; }
      }
    }
    order.atpCheck = {
      inventoryAvailable: allAvailable, capacityAvailable: true,
      deliveryFeasible: allAvailable, notes: notes || 'Auto-checked via system against InventoryStock'
    };
    if (deliveryCommitment) order.deliveryCommitment = deliveryCommitment;
    await order.save();
    await logAudit('ATP_CHECK', 'SalesOrder', order._id, req.user._id, order.atpCheck);
    res.json({ success: true, data: order });
  } catch (error) { handleError(res, error); }
};

exports.updateTracking = async (req, res) => {
  try {
    const { trackingStatus } = req.body;
    const order = await SalesOrder.findByIdAndUpdate(req.params.id, { $set: { trackingStatus } }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Sales order not found' });
    await logAudit('TRACKING_UPDATE', 'SalesOrder', order._id, req.user._id, trackingStatus);
    res.json({ success: true, data: order });
  } catch (error) { handleError(res, error); }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findByIdAndUpdate(req.params.id, editable(req.body), { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Sales order not found' });
    await logAudit('UPDATE', 'SalesOrder', order._id, req.user._id);
    res.json({ success: true, data: order });
  } catch (error) { handleError(res, error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUOTATION 5-ENTITY CRUD (new architecture)
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ────────────────────────────────────────────────────────────────
const MARGIN_THRESHOLD = 15; // Validation Rule 2: 15% gross margin minimum
const LOCKED_STATUSES  = ['Approved', 'Sent to Customer', 'Accepted'];

// ── Helpers ──────────────────────────────────────────────────────────────────
const computeLineTotal = (qty, price, discPct) =>
  parseFloat((qty * price * (1 - (discPct || 0) / 100)).toFixed(4));

const computeMargin = (price, cost) =>
  price > 0 ? parseFloat((((price - cost) / price) * 100).toFixed(2)) : null;

// Recompute revision totals from its lines + header-level tax/discount entries
const recomputeRevisionTotals = async (revisionId) => {
  const lines   = await QuotationLineItem.find({ revisionId, isDeleted: { $ne: true } });
  const entries = await QuoteTaxDiscount.find({ revisionId, isDeleted: { $ne: true } });

  const subTotal = lines.reduce((s, l) => s + (l.lineTotal || 0), 0);

  // Header-level discounts
  const headerDiscounts = entries.filter(e => !e.quoteLineId && e.entryType === 'Discount');
  const totalDiscountAmount = headerDiscounts.reduce((s, e) => s + (e.calculatedAmount || 0), 0);

  // Header-level taxes + surcharges + shipping
  const headerTaxes = entries.filter(e => !e.quoteLineId && ['Tax', 'Surcharge', 'Shipping'].includes(e.entryType));
  const totalTaxAmount = headerTaxes.reduce((s, e) => s + (e.calculatedAmount || 0), 0);

  const grandTotal = parseFloat((subTotal - totalDiscountAmount + totalTaxAmount).toFixed(4));

  await QuotationRevision.findByIdAndUpdate(revisionId, { subTotal, totalDiscountAmount, totalTaxAmount, grandTotal });
  return { subTotal, totalDiscountAmount, totalTaxAmount, grandTotal };
};

// ──────────────────────────────────────────────────────────────────────────────
// A. QUOTATION HEADER
// ──────────────────────────────────────────────────────────────────────────────
exports.getAllQuotationHeaders = async (req, res) => {
  try {
    const data = await QuotationHeader.find()
      .populate('customerId', 'name code')
      .populate('inquiryId',  'inquiryNumber')
      .populate('salesRepId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.getQuotationHeaderById = async (req, res) => {
  try {
    const data = await QuotationHeader.findById(req.params.id)
      .populate('customerId', 'name code')
      .populate('inquiryId',  'inquiryNumber')
      .populate('salesRepId', 'firstName lastName email');
    if (!data) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.createQuotationHeader = async (req, res) => {
  try {
    const data = await QuotationHeader.create(req.body);
    await logAudit('CREATE', 'QuotationHeader', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateQuotationHeader = async (req, res) => {
  try {
    const data = await QuotationHeader.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Quotation not found' });
    await logAudit('UPDATE', 'QuotationHeader', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// B. QUOTATION REVISIONS
// ──────────────────────────────────────────────────────────────────────────────
exports.getRevisionsByQuotation = async (req, res) => {
  try {
    const data = await QuotationRevision.find({ quotationId: req.params.quotationId })
      .sort({ revisionNumber: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createRevision = async (req, res) => {
  try {
    // Parent id comes from the nested route; body value kept only as a fallback
    // for older callers that duplicated it in the payload.
    const quotationId = req.params.quotationId || req.body.quotationId;
    // Auto-increment revision number
    const lastRev = await QuotationRevision.findOne({ quotationId }).sort({ revisionNumber: -1 });
    const revisionNumber = lastRev ? lastRev.revisionNumber + 1 : 1;

    const data = await QuotationRevision.create({ ...req.body, quotationId, revisionNumber });
    await logAudit('CREATE', 'QuotationRevision', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateRevisionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const revision = await QuotationRevision.findById(req.params.revisionId);
    if (!revision) return res.status(404).json({ success: false, message: 'Revision not found' });

    // Validation Rule 3: Expiry check — auto-expire if validToDate is past
    if (new Date(revision.validToDate) < new Date() && status !== 'Expired') {
      await QuotationRevision.findByIdAndUpdate(revision._id, { status: 'Expired' });
      return res.status(400).json({
        success: false,
        message: 'Expiry Lock: This revision\'s Valid To Date is in the past. It has been auto-marked as Expired. Please create a new revision.'
      });
    }

    // Validation Rule 1: Locked revisions cannot change status except to Accepted
    if (revision.isLocked && !['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Immutability: This revision is locked (Approved/Sent). Status changes require a new revision.'
      });
    }

    // Validation Rule 5: Accepting one revision rejects all others under same quotation
    if (status === 'Accepted') {
      await QuotationRevision.updateMany(
        { quotationId: revision.quotationId, _id: { $ne: revision._id } },
        { status: 'Rejected' }
      );
    }

    revision.status = status;
    // Validation Rule 1: Lock on Approved or Sent to Customer
    if (LOCKED_STATUSES.includes(status)) revision.isLocked = true;
    await revision.save();
    await logAudit('STATUS_CHANGE', 'QuotationRevision', revision._id, req.user._id, { status });
    res.json({ success: true, data: revision });
  } catch (error) { handleError(res, error); }
};

exports.cloneRevision = async (req, res) => {
  try {
    const source = await QuotationRevision.findById(req.params.revisionId);
    if (!source) return res.status(404).json({ success: false, message: 'Source revision not found' });

    const lastRev = await QuotationRevision.findOne({ quotationId: source.quotationId }).sort({ revisionNumber: -1 });
    const newRevNumber = lastRev ? lastRev.revisionNumber + 1 : 1;

    const newRev = await QuotationRevision.create({
      quotationId:    source.quotationId,
      revisionNumber: newRevNumber,
      validFromDate:  req.body.validFromDate || new Date(),
      validToDate:    req.body.validToDate   || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status:         'Draft',
      isLocked:       false
    });

    // Clone all line items
    const srcLines = await QuotationLineItem.find({ revisionId: source._id, isDeleted: { $ne: true } });
    for (const line of srcLines) {
      const { _id, __v, createdAt, updatedAt, ...rest } = line.toObject();
      await QuotationLineItem.create({ ...rest, revisionId: newRev._id });
    }

    await recomputeRevisionTotals(newRev._id);
    await logAudit('CLONE', 'QuotationRevision', newRev._id, req.user._id);
    res.status(201).json({ success: true, data: newRev });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// C. QUOTATION LINE ITEMS
// ──────────────────────────────────────────────────────────────────────────────
exports.getLinesByRevision = async (req, res) => {
  try {
    const data = await QuotationLineItem.find({ revisionId: req.params.revisionId })
      .populate('productId', 'name code')
      .populate('uomId',     'name abbreviation')
      .sort({ createdAt: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createQuoteLine = async (req, res) => {
  try {
    const revision = await QuotationRevision.findById(req.body.revisionId);
    if (!revision) return res.status(404).json({ success: false, message: 'Revision not found' });

    // Validation Rule 1: Locked revision cannot add lines
    if (revision.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Immutability: This revision is locked. Create a new revision to make changes.'
      });
    }

    const { quantity, unitPrice, unitCost, lineDiscountPercentage, inquiryLineId } = req.body;

    // Validation Rule 4: If linked to InquiryLine, add tooling cost to unit price
    let finalUnitPrice = unitPrice;
    if (inquiryLineId) {
      const { FeasibilityReview } = require('../models/SalesInquiry');
      const feasibility = await FeasibilityReview.findOne({ inquiryLineId });
      if (feasibility && feasibility.estimatedToolingCost > 0 && feasibility.isToolingRequired) {
        finalUnitPrice = parseFloat((unitPrice + feasibility.estimatedToolingCost).toFixed(4));
      }
    }

    const lineTotal   = computeLineTotal(quantity, finalUnitPrice, lineDiscountPercentage);
    const marginPct   = computeMargin(finalUnitPrice, unitCost || 0);
    const belowMargin = marginPct !== null && marginPct < MARGIN_THRESHOLD;

    const data = await QuotationLineItem.create({
      ...req.body,
      unitPrice:              finalUnitPrice,
      lineTotal,
      grossMarginPct:         marginPct,
      isBelowMarginThreshold: belowMargin
    });

    // Validation Rule 2: If any line is below margin threshold, force Pending Approval
    if (belowMargin) {
      await QuotationRevision.findByIdAndUpdate(revision._id, {
        status:          'Pending Approval',
        marginTriggered: true
      });
    }

    await recomputeRevisionTotals(revision._id);
    await logAudit('CREATE', 'QuotationLineItem', data._id, req.user._id);
    res.status(201).json({
      success: true,
      data,
      warning: belowMargin
        ? `⚠️ Margin Alert: Gross margin of ${marginPct}% is below the ${MARGIN_THRESHOLD}% threshold. Revision moved to Pending Approval.`
        : null,
      toolingApplied: req.body.inquiryLineId && finalUnitPrice !== unitPrice
        ? `ℹ️ Tooling Cost Applied: Unit price adjusted to ₹${finalUnitPrice} from feasibility review.`
        : null
    });
  } catch (error) { handleError(res, error); }
};

exports.updateQuoteLine = async (req, res) => {
  try {
    const line = await QuotationLineItem.findById(req.params.lineId);
    if (!line) return res.status(404).json({ success: false, message: 'Line not found' });

    const revision = await QuotationRevision.findById(line.revisionId);

    // Validation Rule 1: Locked revision = read-only lines
    if (revision?.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Immutability: This revision is locked. Create a new revision to make changes.'
      });
    }

    const { quantity, unitPrice, unitCost, lineDiscountPercentage } = req.body;
    const lineTotal = computeLineTotal(
      quantity || line.quantity,
      unitPrice || line.unitPrice,
      lineDiscountPercentage ?? line.lineDiscountPercentage
    );
    const marginPct   = computeMargin(unitPrice || line.unitPrice, unitCost ?? line.unitCost);
    const belowMargin = marginPct !== null && marginPct < MARGIN_THRESHOLD;

    const data = await QuotationLineItem.findByIdAndUpdate(
      req.params.lineId,
      { ...req.body, lineTotal, grossMarginPct: marginPct, isBelowMarginThreshold: belowMargin },
      { new: true, runValidators: true }
    );

    if (belowMargin) {
      await QuotationRevision.findByIdAndUpdate(line.revisionId, { status: 'Pending Approval', marginTriggered: true });
    }

    await recomputeRevisionTotals(line.revisionId);
    await logAudit('UPDATE', 'QuotationLineItem', data._id, req.user._id);
    res.json({
      success: true,
      data,
      warning: belowMargin ? `⚠️ Margin Alert: ${marginPct}% is below ${MARGIN_THRESHOLD}% threshold.` : null
    });
  } catch (error) { handleError(res, error); }
};

exports.deleteQuoteLine = async (req, res) => {
  try {
    const line = await QuotationLineItem.findById(req.params.lineId);
    if (!line) return res.status(404).json({ success: false, message: 'Line not found' });
    const revision = await QuotationRevision.findById(line.revisionId);
    if (revision?.isLocked) {
      return res.status(400).json({ success: false, message: 'Revision is locked. Cannot delete line.' });
    }
    await QuotationLineItem.findByIdAndUpdate(req.params.lineId, { isDeleted: true });
    await recomputeRevisionTotals(line.revisionId);
    res.json({ success: true, message: 'Line removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// D. TAXES & DISCOUNTS
// ──────────────────────────────────────────────────────────────────────────────
exports.getTaxDiscountsByRevision = async (req, res) => {
  try {
    const data = await QuoteTaxDiscount.find({ revisionId: req.params.revisionId })
      .populate('taxCodeId', 'name rate');
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createTaxDiscount = async (req, res) => {
  try {
    const revision = await QuotationRevision.findById(req.body.revisionId);
    if (revision?.isLocked) {
      return res.status(400).json({ success: false, message: 'Revision is locked. Cannot add tax/discount.' });
    }
    const data = await QuoteTaxDiscount.create(req.body);
    await recomputeRevisionTotals(req.body.revisionId);
    await logAudit('CREATE', 'QuoteTaxDiscount', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateTaxDiscount = async (req, res) => {
  try {
    const entry = await QuoteTaxDiscount.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    const revision = await QuotationRevision.findById(entry.revisionId);
    if (revision?.isLocked) {
      return res.status(400).json({ success: false, message: 'Revision is locked.' });
    }
    const data = await QuoteTaxDiscount.findByIdAndUpdate(req.params.entryId, req.body, { new: true });
    await recomputeRevisionTotals(entry.revisionId);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteTaxDiscount = async (req, res) => {
  try {
    const entry = await QuoteTaxDiscount.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    await QuoteTaxDiscount.findByIdAndUpdate(req.params.entryId, { isDeleted: true });
    await recomputeRevisionTotals(entry.revisionId);
    res.json({ success: true, message: 'Entry removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// E. APPROVAL ROUTING
// ──────────────────────────────────────────────────────────────────────────────
exports.getApprovalsByRevision = async (req, res) => {
  try {
    const data = await QuoteApproval.find({ revisionId: req.params.revisionId })
      .populate('approverRoleId', 'name')
      .populate('approverUserId', 'name email')
      .sort({ requestedAt: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createQuoteApproval = async (req, res) => {
  try {
    const data = await QuoteApproval.create({ ...req.body, requestedAt: new Date() });
    await logAudit('CREATE', 'QuoteApproval', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.actionQuoteApproval = async (req, res) => {
  try {
    const { actionTaken, approvalNotes } = req.body;
    const approval = await QuoteApproval.findById(req.params.approvalId);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });
    approval.actionTaken  = actionTaken;
    approval.approvalNotes = approvalNotes || '';
    approval.actionAt     = new Date();
    if (!approval.approverUserId) approval.approverUserId = req.user._id;
    await approval.save();
    await logAudit('APPROVAL_ACTION', 'QuoteApproval', approval._id, req.user._id, { actionTaken });
    res.json({ success: true, data: approval });
  } catch (error) { handleError(res, error); }
};

exports.deleteQuoteApproval = async (req, res) => {
  try {
    await QuoteApproval.findByIdAndUpdate(req.params.approvalId, { isDeleted: true });
    res.json({ success: true, message: 'Approval step removed.' });
  } catch (error) { handleError(res, error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// SALES ORDER 4-ENTITY CRUD (new architecture)
// ─────────────────────────────────────────────────────────────────────────────
const { MrpRecommendation } = require('../models/MrpRecommendation');

// ── Next line sequence helper ────────────────────────────────────────────────
const nextSOLineSeq = async (orderId) => {
  const last = await SOLineItem.findOne({ orderId }).sort({ lineSequence: -1 });
  return last ? last.lineSequence + 10 : 10;
};

// ── Recompute SO header totals from lines ────────────────────────────────────
const recomputeSOTotals = async (orderId) => {
  const lines = await SOLineItem.find({ orderId, isDeleted: { $ne: true } });
  const subTotal    = lines.reduce((s, l) => s + (l.lineTotal || 0), 0);
  const grandTotal  = parseFloat(subTotal.toFixed(4));
  await SOHeader.findByIdAndUpdate(orderId, { subTotal, grandTotal });
  return { subTotal, grandTotal };
};

// ── Locked dispatch statuses (Rule 5) ────────────────────────────────────────
const DISPATCH_LOCKED = ['Picked', 'In Transit', 'Delivered'];

// ──────────────────────────────────────────────────────────────────────────────
// A. SALES ORDER HEADER
// ──────────────────────────────────────────────────────────────────────────────
exports.getAllSOHeaders = async (req, res) => {
  try {
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip  = (page - 1) * limit;
    const data  = await SOHeader.find()
      .populate('customerId',          'name code creditLimit')
      .populate('quotationRevisionId', 'revisionNumber status')
      .sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await SOHeader.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, data });
  } catch (error) { handleError(res, error); }
};

exports.getSOHeaderById = async (req, res) => {
  try {
    const data = await SOHeader.findById(req.params.id)
      .populate('customerId', 'name code creditLimit')
      .populate('quotationRevisionId', 'revisionNumber grandTotal');
    if (!data) return res.status(404).json({ success: false, message: 'Sales Order not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.createSOHeader = async (req, res) => {
  try {
    // Same guard as the legacy path — this is the endpoint the Sales Order
    // screen actually posts to, and it was booking any amount at all.
    const breach = await creditLimitBreach(
      req.body.customerId,
      req.body.grandTotal || req.body.subTotal
    );
    if (breach) return res.status(422).json(breach);

    // The number is the system's to give. The screen used to invent one from
    // Math.random() — six characters, no sequence, no year, and a real chance
    // of two people getting the same one — and the API refused an order
    // without it. Sequential and fiscal-year based now, like every other
    // document, unless a caller supplies one deliberately (a migration).
    const body = { ...req.body };
    if (!body.orderNumber || /^SO-[A-Z0-9]{6}$/.test(body.orderNumber)) {
      body.orderNumber = await generateDocNumber('SO', 'SO');
    }

    // Rule 2: If linked to a Quotation Revision, lock line prices later on line creation
    const data = await SOHeader.create(body);
    await logAudit('CREATE', 'SOHeader', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateSOHeader = async (req, res) => {
  try {
    const data = await SOHeader.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Sales Order not found' });
    await logAudit('UPDATE', 'SOHeader', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateSOStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await SOHeader.findById(req.params.id).populate('customerId', 'name creditLimit');
    if (!order) return res.status(404).json({ success: false, message: 'Sales Order not found' });

    // Validation Rule 1: Real-Time Credit Check on Approval — the same guard
    // that runs at booking, so both answer the question the same way.
    if (status === 'Approved') {
      const breach = await creditLimitBreach(order.customerId?._id, order.grandTotal || order.subTotal, { excludeOrderId: order._id });
      if (breach) {
        // Auto-move to Credit Hold
        await SOHeader.findByIdAndUpdate(order._id, { holdStatus: 'Credit Hold', status: 'Pending Approval' });
        return res.status(400).json({
          ...breach,
          message: `Credit Hold: ${breach.message}`,
          holdApplied: true
        });
      }

      // Validation Rule 4: Production Triggering for Make-to-Order lines
      const mtoLines = await SOLineItem.find({ orderId: order._id, atpStatus: 'Make-to-Order', isDeleted: { $ne: true } });
      for (const line of mtoLines) {
        const dueDate = order.deliveryCommitmentDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const mrpOrder = await MrpRecommendation.create({
          runId: new mongoose.Types.ObjectId(),
          itemModel: 'Product',
          itemId: line.productId,
          suggestionCategory: 'Production',
          actionType: 'Create New',
          suggestedQty: line.orderedQuantity || 1,
          suggestedReleaseDate: new Date(),
          suggestedDueDate: dueDate,
          status: 'Pending'
        });
        await SOLineItem.findByIdAndUpdate(line._id, { mrpOrderId: mrpOrder._id });
      }
      if (mtoLines.length > 0) {
        req.mrpTriggered = mtoLines.length;
      }
    }

    order.status = status;
    if (status !== 'Pending Approval') order.holdStatus = 'None';
    await order.save();
    await logAudit('STATUS_CHANGE', 'SOHeader', order._id, req.user._id, { status });

    res.json({
      success: true,
      data: order,
      mrpOrdersCreated: req.mrpTriggered || 0
    });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// B. SALES ORDER LINE ITEMS
// ──────────────────────────────────────────────────────────────────────────────
exports.getSOLines = async (req, res) => {
  try {
    const data = await SOLineItem.find({ orderId: req.params.orderId })
      .populate('productId', 'name code')
      .populate('uomId',     'name abbreviation')
      .sort({ lineSequence: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createSOLine = async (req, res) => {
  try {
    const order = await SOHeader.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Sales Order not found' });

    let payload = { ...req.body, orderId: req.params.orderId };

    // Validation Rule 2: If linked to Quotation, lock price
    if (order.quotationRevisionId) {
      payload.isPriceLocked = true;
    }

    // Compute line total
    const qty        = payload.orderedQuantity || 0;
    const price      = payload.unitPrice || 0;
    const discount   = payload.lineDiscountAmount || 0;
    payload.lineTotal = parseFloat(((qty * price) - discount).toFixed(4));

    const lineSeq    = await nextSOLineSeq(req.params.orderId);
    payload.lineSequence = payload.lineSequence || lineSeq;

    const data = await SOLineItem.create(payload);
    await recomputeSOTotals(req.params.orderId);
    await logAudit('CREATE', 'SOLineItem', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateSOLine = async (req, res) => {
  try {
    const line = await SOLineItem.findById(req.params.lineId);
    if (!line) return res.status(404).json({ success: false, message: 'Line not found' });

    // Validation Rule 2: Price/discount locked if from Quotation
    if (line.isPriceLocked && (req.body.unitPrice !== undefined || req.body.lineDiscountAmount !== undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Quotation Integrity Lock: Unit Price and Discounts are locked because this order was generated from a Quotation. Revert to the Quotation module to change pricing.'
      });
    }

    const qty      = req.body.orderedQuantity  || line.orderedQuantity;
    const price    = req.body.unitPrice        || line.unitPrice;
    const discount = req.body.lineDiscountAmount ?? line.lineDiscountAmount;
    req.body.lineTotal = parseFloat(((qty * price) - discount).toFixed(4));

    const data = await SOLineItem.findByIdAndUpdate(req.params.lineId, req.body, { new: true, runValidators: true });
    await recomputeSOTotals(line.orderId);
    await logAudit('UPDATE', 'SOLineItem', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteSOLine = async (req, res) => {
  try {
    const line = await SOLineItem.findById(req.params.lineId);
    if (!line) return res.status(404).json({ success: false, message: 'Line not found' });
    await SOLineItem.findByIdAndUpdate(req.params.lineId, { isDeleted: true });
    await recomputeSOTotals(line.orderId);
    res.json({ success: true, message: 'Line removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// C. DELIVERY SCHEDULES / RELEASES
// ──────────────────────────────────────────────────────────────────────────────
exports.getSchedulesByLine = async (req, res) => {
  try {
    const data = await SODeliverySchedule.find({ soLineId: req.params.lineId })
      .sort({ requestedDeliveryDate: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createSchedule = async (req, res) => {
  try {
    const line = await SOLineItem.findById(req.params.lineId);
    if (!line) return res.status(404).json({ success: false, message: 'Line not found' });

    // Validation Rule 3: ATP Gate — From Stock cannot confirm delivery before stock is available
    if (line.fulfillmentType === 'From Stock' && req.body.confirmedDeliveryDate) {
      // We compare against earliest available stock date from InventoryStock
      const availableStock = await InventoryStock.aggregate([
        { $match: { materialId: line.productId, status: 'Active' } },
        { $sort:  { postingDate: 1 } },
        { $limit: 1 }
      ]);
      if (availableStock.length > 0) {
        const earliestAvail = new Date(availableStock[0].postingDate);
        const confirmedDate = new Date(req.body.confirmedDeliveryDate);
        if (confirmedDate < earliestAvail) {
          return res.status(400).json({
            success: false,
            message: `ATP Gate: Confirmed delivery date (${confirmedDate.toLocaleDateString()}) is before the earliest available stock date (${earliestAvail.toLocaleDateString()}). Please adjust delivery date or check inventory.`
          });
        }
      }
    }

    const data = await SODeliverySchedule.create({ ...req.body, soLineId: req.params.lineId });
    await logAudit('CREATE', 'SODeliverySchedule', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await SODeliverySchedule.findById(req.params.scheduleId);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    // Validation Rule 5: Once Picked or beyond, quantity cannot be reduced
    if (DISPATCH_LOCKED.includes(schedule.dispatchStatus)) {
      if (req.body.scheduledQuantity !== undefined && req.body.scheduledQuantity < schedule.scheduledQuantity) {
        return res.status(400).json({
          success: false,
          message: `Irreversible Fulfillment: This release is already "${schedule.dispatchStatus}". The scheduled quantity (${schedule.scheduledQuantity}) cannot be reduced. A formal RMA or administrative override is required.`
        });
      }
    }

    // Lock quantity when status moves to Picked or beyond
    if (req.body.dispatchStatus && DISPATCH_LOCKED.includes(req.body.dispatchStatus)) {
      req.body.isQuantityLocked = true;
    }

    const data = await SODeliverySchedule.findByIdAndUpdate(
      req.params.scheduleId, req.body, { new: true, runValidators: true }
    );
    await logAudit('UPDATE', 'SODeliverySchedule', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await SODeliverySchedule.findById(req.params.scheduleId);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    if (DISPATCH_LOCKED.includes(schedule.dispatchStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot delete a dispatch that is already Picked or beyond.' });
    }
    await SODeliverySchedule.findByIdAndUpdate(req.params.scheduleId, { isDeleted: true });
    res.json({ success: true, message: 'Schedule removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// D. ATP ALLOCATIONS
// ──────────────────────────────────────────────────────────────────────────────
exports.getAllocationsBySchedule = async (req, res) => {
  try {
    const data = await SOAllocation.find({ scheduleId: req.params.scheduleId })
      .populate('inventoryBatchId', 'batchNumber quantityAvailable materialId');
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createAllocation = async (req, res) => {
  try {
    const { scheduleId, inventoryBatchId, allocatedQuantity, isHardReserved } = req.body;

    // Verify batch exists and has sufficient stock
    const batch = await InventoryStock.findById(inventoryBatchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Inventory batch not found' });

    // Sum already allocated from this batch by other hard reservations
    const existingAlloc = await SOAllocation.aggregate([
      { $match: { inventoryBatchId: new mongoose.Types.ObjectId(inventoryBatchId), isHardReserved: true } },
      { $group: { _id: null, total: { $sum: '$allocatedQuantity' } } }
    ]);
    const alreadyAllocated = existingAlloc.length > 0 ? existingAlloc[0].total : 0;
    const available = (batch.quantityAvailable || 0) - alreadyAllocated;

    if (allocatedQuantity > available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock: Batch ${batch.batchNumber} has ${available} units available (${batch.quantityAvailable} total - ${alreadyAllocated} hard-reserved). Requested: ${allocatedQuantity}.`
      });
    }

    // Server-side ATP enforcement across all open orders for this material at this warehouse
    const materialId = batch.materialId;
    const warehouseId = batch.warehouseId;
    if (materialId && warehouseId) {
      // Get total on-hand
      const stockAgg = await InventoryStock.aggregate([
        { $match: { materialId: new mongoose.Types.ObjectId(materialId), warehouseId: new mongoose.Types.ObjectId(warehouseId), status: 'Active' } },
        { $group: { _id: null, totalAvailable: { $sum: '$quantityAvailable' } } }
      ]);
      const totalOnHand = stockAgg[0]?.totalAvailable || 0;

      // Get already allocated (across all open orders) - approximate by sum of all active allocations
      // Note: checking isHardReserved to mean active allocation in this schema design.
      const allocAgg = await SOAllocation.aggregate([
        { $match: { inventoryBatchId: { $in: await InventoryStock.find({ materialId, warehouseId }).distinct('_id') }, isHardReserved: true } },
        { $group: { _id: null, totalAllocated: { $sum: '$allocatedQuantity' } } }
      ]);
      const totalAllocatedAcross = allocAgg[0]?.totalAllocated || 0;

      const atp = totalOnHand - totalAllocatedAcross;
      if (allocatedQuantity > atp) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient Available-to-Promise. ATP: ${atp}, Requested: ${allocatedQuantity}. Total on hand: ${totalOnHand}, Already allocated: ${totalAllocatedAcross}` 
        });
      }
    }

    const data = await SOAllocation.create(req.body);

    // Update ATP status on the related SOLine
    const schedule = await SODeliverySchedule.findById(scheduleId);
    if (schedule) {
      const allAlloc = await SOAllocation.aggregate([
        { $match: { scheduleId: new mongoose.Types.ObjectId(scheduleId) } },
        { $group: { _id: null, total: { $sum: '$allocatedQuantity' } } }
      ]);
      const totalAllocated = allAlloc.length > 0 ? allAlloc[0].total : 0;
      const soLine = await SOLineItem.findById(schedule.soLineId);
      if (soLine) {
        let atpStatus = 'Backordered';
        if (totalAllocated >= soLine.orderedQuantity)      atpStatus = 'Fully Allocated';
        else if (totalAllocated > 0)                       atpStatus = 'Partially Allocated';
        await SOLineItem.findByIdAndUpdate(soLine._id, { atpStatus });
      }
    }

    await logAudit('CREATE', 'SOAllocation', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteAllocation = async (req, res) => {
  try {
    await SOAllocation.findByIdAndUpdate(req.params.allocationId, { isDeleted: true });
    res.json({ success: true, message: 'Allocation removed.' });
  } catch (error) { handleError(res, error); }
};
