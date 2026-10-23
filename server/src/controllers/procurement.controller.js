const { handleError } = require('../utils/errorHandler');
const { internalId } = require('../utils/internalId');
const { PRHeader, PRLineItem, ApprovalRoutingLog } = require('../models/PurchaseRequisition');
const { RFQHeader, RFQLineItem, VendorBid, BidScoringMatrix } = require('../models/PurchaseRFQ');
const { POHeader, POLineItem, POChangeHistory, PurchaseOrder } = require('../models/PurchaseOrder');
const { VendorScorecard, KPIEventLog } = require('../models/VendorPerformance');
const { RecommendationRecord } = require('../models/MrpRecommendation');
const { AuditLog } = require('../models/Audit');
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

// ================= eProcurement & PR Engine =================

exports.getAllRequisitions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const headers = await PRHeader.find()
      .populate('requesterId', 'firstName lastName email')
      .populate('costCenterId', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    // Fetch line items and approval logs for these headers
    const headerIds = headers.map(h => h._id);
    const lineItems = await PRLineItem.find({ prHeaderId: { $in: headerIds } }).populate('itemId', 'name code unit standardCost category').populate('supplierId', 'name code');
    const approvalLogs = await ApprovalRoutingLog.find({ prHeaderId: { $in: headerIds } }).sort({ sequence: 1 });

    const total = await PRHeader.countDocuments();
    
    // Combine into a cohesive structure
    const data = headers.map(h => {
      const hObj = h.toObject();
      hObj.items = lineItems.filter(li => li.prHeaderId.toString() === h._id.toString());
      hObj.approvals = approvalLogs.filter(al => al.prHeaderId.toString() === h._id.toString());
      return hObj;
    });

    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data });
  } catch (error) { handleError(res, error); }
};

exports.createRequisition = async (req, res) => {
  try {
    const { items, costCenterId } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });

    // Calculate total value
    const totalValue = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);

    // Rule 2: Real-Time Budget Checking (Mock logic)
    let status = 'In_Approval';
    let requiresCFO = false;
    const MOCK_DEPARTMENT_BUDGET = 10000;
    if (totalValue > MOCK_DEPARTMENT_BUDGET) {
      status = 'Needs_CFO_Approval';
      requiresCFO = true;
    } else if (totalValue < 500) {
      status = 'Approved'; // Auto-approve small amounts
    }

    // Create Header
    const prNumber = internalId('PR');
    const header = await PRHeader.create({
      prNumber,
      requesterId: req.user._id,
      costCenterId,
      totalValue,
      status
    });

    // Create Line Items
    const lineItemsToInsert = items.map(item => ({
      prHeaderId: header._id,
      itemId: item.itemId || null,
      freeTextDesc: item.freeTextDesc || '',
      supplierId: item.supplierId || null,
      qty: item.qty,
      unitPrice: item.unitPrice,
      requiredDate: item.requiredDate || new Date(Date.now() + 7*24*60*60*1000)
    }));
    await PRLineItem.insertMany(lineItemsToInsert);

    // Rule 3: Dynamic Multi-Tier Approvals setup
    if (status !== 'Approved') {
      const logs = [];
      logs.push({ prHeaderId: header._id, sequence: 1, status: 'Pending', comments: 'Manager Approval Required' });
      if (totalValue >= 5000) {
        logs.push({ prHeaderId: header._id, sequence: 2, status: 'Pending', comments: 'Director Approval Required' });
      }
      if (requiresCFO) {
        logs.push({ prHeaderId: header._id, sequence: 3, status: 'Pending', comments: 'CFO Approval Required (Budget Exceeded)' });
      }
      await ApprovalRoutingLog.insertMany(logs);
    }

    // Touchless PO if auto-approved
    if (status === 'Approved') {
       await triggerSourcingAutomation(header._id, req.user._id);
    }

    await logAudit('CREATE', 'PRHeader', header._id, req.user._id, { totalValue, requiresCFO });
    res.status(201).json({ success: true, data: header, message: requiresCFO ? 'Budget Exceeded - Routed to CFO' : 'Submitted successfully' });
  } catch (error) { handleError(res, error); }
};

exports.updateRequisitionStatus = async (req, res) => {
  try {
    const { status, approvalNotes, stepId } = req.body; // Expecting stepId if approving a specific tier
    
    // ROLE CHECK: Only Manager or Super Admin can approve/reject
    if (stepId && (status === 'Approved' || status === 'Rejected')) {
      const userRole = req.user?.role?.name;
      if (userRole !== 'Manager' && userRole !== 'System Admin' && userRole !== 'Super Admin') {
        return res.status(403).json({ success: false, message: 'Access Denied: Only a Manager can approve Purchase Requisitions.' });
      }
    }

    const header = await PRHeader.findById(req.params.id);
    if (!header) return res.status(404).json({ success: false, message: 'PR not found' });

    if (stepId && (status === 'Approved' || status === 'Rejected')) {
      // Update specific approval log
      await ApprovalRoutingLog.findByIdAndUpdate(stepId, { 
        status, 
        actionTimestamp: new Date(), 
        comments: approvalNotes,
        approverUserId: req.user._id
      });

      // Check if all steps are approved
      const remainingPending = await ApprovalRoutingLog.countDocuments({ prHeaderId: header._id, status: 'Pending' });
      const anyRejected = await ApprovalRoutingLog.countDocuments({ prHeaderId: header._id, status: 'Rejected' });

      if (anyRejected > 0) {
        header.status = 'Rejected';
      } else if (remainingPending === 0) {
        header.status = 'Approved';
      }
      await header.save();
    } else {
      // Direct override (e.g. Admin)
      header.status = status;
      await header.save();
    }

    // Rule 4: Sourcing Automation
    if (header.status === 'Approved') {
      await triggerSourcingAutomation(header._id, req.user._id);
    }

    await logAudit('UPDATE_STATUS', 'PRHeader', header._id, req.user._id, { status });
    res.json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

// Internal Helper for Sourcing & Consolidation (Rules 4 & 5)
async function triggerSourcingAutomation(headerId, userId) {
  const header = await PRHeader.findById(headerId);
  const items = await PRLineItem.find({ prHeaderId: headerId, lineStatus: 'Pending' });

  let poGenerated = false;

  for (const item of items) {
    if (item.supplierId) { // Has catalog/contract supplier
      // Rule 5: AI Consolidation (Heuristic)
      // Check if there are other Approved, Pending PR lines for the SAME item and supplier
      const consolidatableLines = await PRLineItem.find({
        _id: { $ne: item._id },
        itemId: item.itemId,
        supplierId: item.supplierId,
        lineStatus: 'Pending'
      }).populate('prHeaderId');

      const approvedConsolidatable = consolidatableLines.filter(line => line.prHeaderId && line.prHeaderId.status === 'Approved');

      const linesToConsolidate = [item, ...approvedConsolidatable];
      
      const totalConsolidatedQty = linesToConsolidate.reduce((sum, li) => sum + li.qty, 0);

      // Rule 4: Generate PO
      const totalCost = totalConsolidatedQty * item.unitPrice;
      const newPo = await POHeader.create({
        poNumber: internalId('PO-AUTO'),
        vendorId: item.supplierId,
        approvalStatus: 'Pending', // Auto-generated PO starts as Pending
        totalAmount: totalCost
      });

      await POLineItem.create({
        poId: newPo._id,
        materialId: item.itemId,
        orderQty: totalConsolidatedQty,
        unitPrice: item.unitPrice,
        total: totalCost,
        promisedDeliveryDate: item.requiredDate
      });

      // Update line statuses
      for (const li of linesToConsolidate) {
        li.lineStatus = 'Sourced';
        await li.save();
      }

      await logAudit('AUTO_PO_CONSOLIDATION', 'PurchaseOrder', newPo._id, userId, { consolidatedLines: linesToConsolidate.map(l => l._id) });
      poGenerated = true;
    }
  }

  // Update PR Status if everything was sourced
  const remainingPending = await PRLineItem.countDocuments({ prHeaderId: headerId, lineStatus: 'Pending' });
  if (remainingPending === 0 && poGenerated) {
    header.status = 'PO_Created';
    await header.save();
  }
}

exports.deleteRequisition = async (req, res) => {
  try {
    const header = await PRHeader.findById(req.params.id);
    if (!header) return res.status(404).json({ success: false, message: 'PR not found' });

    if (header.status === 'PO_Created') {
      return res.status(400).json({ success: false, message: 'Cannot delete a PR that already has a Purchase Order created.' });
    }

    await PRHeader.findByIdAndDelete(req.params.id);
    await PRLineItem.deleteMany({ prHeaderId: req.params.id });
    await ApprovalRoutingLog.deleteMany({ prHeaderId: req.params.id });

    await logAudit('DELETE', 'PRHeader', req.params.id, req.user._id);
    res.json({ success: true, message: 'Purchase request deleted successfully' });
  } catch (error) { handleError(res, error); }
};

exports.convertPRtoPO = async (req, res) => {
  try {
    const prHeader = await PRHeader.findById(req.params.id);
    if (!prHeader) return res.status(404).json({ success: false, message: 'PR not found' });

    const items = await PRLineItem.find({ prHeaderId: prHeader._id });
    if (!items.length) return res.status(400).json({ success: false, message: 'No line items found for this PR.' });

    // Pick supplier from items or fallback to first active vendor
    let targetVendorId = items.find(i => i.supplierId)?.supplierId || req.body.vendorId;
    if (!targetVendorId) {
      const { Vendor } = require('../models/MasterVendor');
      const fallbackVendor = await Vendor.findOne({ status: 'Active' }) || await Vendor.findOne();
      if (!fallbackVendor) return res.status(400).json({ success: false, message: 'No active vendor found to create Purchase Order.' });
      targetVendorId = fallbackVendor._id;
    }

    const poNumber = internalId('PO');
    const newPo = await POHeader.create({
      poNumber,
      vendorId: targetVendorId,
      approvalStatus: 'Pending',
      totalAmount: prHeader.totalValue,
      companyId: prHeader.companyId
    });

    for (const item of items) {
      await POLineItem.create({
        poId: newPo._id,
        materialId: item.itemId,
        orderQty: item.qty,
        unitPrice: item.unitPrice,
        total: item.qty * item.unitPrice,
        promisedDeliveryDate: item.requiredDate,
        companyId: prHeader.companyId
      });
      item.lineStatus = 'Sourced';
      await item.save();
    }

    prHeader.status = 'PO_Created';
    await prHeader.save();

    await logAudit('CONVERT_PR_TO_PO', 'PurchaseOrder', newPo._id, req.user._id, { prId: prHeader._id, poNumber });

    res.json({
      success: true,
      message: `Purchase Order ${poNumber} generated successfully and linked to requisition`,
      poNumber,
      data: newPo
    });
  } catch (error) { handleError(res, error); }
};

exports.convertPRtoRFQ = async (req, res) => {
  try {
    const prHeader = await PRHeader.findById(req.params.id);
    if (!prHeader) return res.status(404).json({ success: false, message: 'PR not found' });

    const items = await PRLineItem.find({ prHeaderId: prHeader._id });
    if (!items.length) return res.status(400).json({ success: false, message: 'No line items found for this PR.' });

    const rfqNumber = internalId('RFQ');
    const newRfq = await RFQHeader.create({
      rfqNumber,
      title: `RFQ for Material Requisition ${prHeader.prNumber}`,
      submissionDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'Published',
      companyId: prHeader.companyId
    });

    for (const item of items) {
      if (item.itemId) {
        await RFQLineItem.create({
          rfqId: newRfq._id,
          materialId: item.itemId,
          targetQty: item.qty,
          targetPrice: item.unitPrice,
          companyId: prHeader.companyId
        });
      }
    }

    await logAudit('CONVERT_PR_TO_RFQ', 'PurchaseRFQ', newRfq._id, req.user._id, { prId: prHeader._id, rfqNumber });

    res.json({
      success: true,
      message: `RFQ ${rfqNumber} successfully generated and published for supplier quotation`,
      rfqNumber,
      data: newRfq
    });
  } catch (error) { handleError(res, error); }
};


// ================= eSourcing & Advanced RFQ Engine =================

exports.getAllRFQs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const headers = await RFQHeader.find()
      .populate('invitedVendors', 'name code')
      .populate('qaThreads.senderId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);

    const headerIds = headers.map(h => h._id);
    const lineItems = await RFQLineItem.find({ rfqId: { $in: headerIds } }).populate('materialId', 'name code');
    const bids = await VendorBid.find({ rfqLineId: { $in: lineItems.map(l => l._id) } }).populate('vendorId', 'name');
    const scores = await BidScoringMatrix.find({ bidId: { $in: bids.map(b => b._id) } });

    const total = await RFQHeader.countDocuments();
    const now = new Date();

    // Combine logic and enforce Sealed Bidding
    const data = headers.map(h => {
      const hObj = h.toObject();
      hObj.items = lineItems.filter(li => li.rfqId.toString() === h._id.toString());
      
      const headerBids = bids.filter(b => {
        const line = hObj.items.find(i => i._id.toString() === b.rfqLineId.toString());
        return line !== undefined;
      });

      // SEALED BID ENFORCEMENT
      const isSealedAndNotExpired = h.sourcingType === 'Sealed Bid' && new Date(h.submissionDeadline) > now;

      hObj.bids = headerBids.map(b => {
        const bObj = b.toObject();
        bObj.score = scores.find(s => s.bidId.toString() === b._id.toString()) || null;
        
        // Hide price if sealed
        if (isSealedAndNotExpired) {
          bObj.offeredUnitPrice = '*** (Sealed)';
          bObj.totalValue = '*** (Sealed)';
          bObj.offeredLeadTimeDays = '*** (Sealed)';
          bObj.score = null; // hide score until unsealed
        }
        return bObj;
      });

      return hObj;
    });

    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data });
  } catch (error) { handleError(res, error); }
};

exports.createRFQ = async (req, res) => {
  try {
    const { materialId, quantity, targetDeliveryDate, ...headerData } = req.body;
    
    headerData.rfqNumber = internalId('RFQ');
    headerData.status = 'Published'; // Auto-publish for demo

    const newRfq = await RFQHeader.create(headerData);
    
    // Create Line Item (Single item per RFQ supported in this simplified demo)
    await RFQLineItem.create({
      rfqId: newRfq._id,
      materialId,
      requestedQty: quantity,
      targetDeliveryDate
    });

    await logAudit('CREATE', 'RFQHeader', newRfq._id, req.user._id);
    res.status(201).json({ success: true, data: newRfq });
  } catch (error) { handleError(res, error); }
};

exports.addQuotation = async (req, res) => {
  try {
    const rfq = await RFQHeader.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'Not found' });
    
    // Check if deadline passed
    if (new Date(rfq.submissionDeadline) < new Date()) {
      return res.status(403).json({ success: false, message: 'Submission deadline has passed.' });
    }

    const lineItem = await RFQLineItem.findOne({ rfqId: rfq._id });
    if (!lineItem) return res.status(404).json({ success: false, message: 'RFQ Line Item not found' });

    // Calculate total value
    const totalValue = req.body.offeredUnitPrice * lineItem.requestedQty;

    // Check if vendor already bid
    let bid = await VendorBid.findOne({ rfqLineId: lineItem._id, vendorId: req.body.vendorId });
    if (bid) {
      // Update bid
      bid.offeredUnitPrice = req.body.offeredUnitPrice;
      bid.offeredLeadTimeDays = req.body.offeredLeadTimeDays;
      bid.totalValue = totalValue;
      await bid.save();
    } else {
      // Create bid
      bid = await VendorBid.create({
        rfqLineId: lineItem._id,
        vendorId: req.body.vendorId,
        offeredUnitPrice: req.body.offeredUnitPrice,
        offeredLeadTimeDays: req.body.offeredLeadTimeDays,
        totalValue,
        status: 'Submitted'
      });
    }

    // Heuristic Auto-Scoring Engine
    // Simple math: We compare to all other bids and update scores for everyone on this line
    await runAutoScoring(lineItem._id);

    rfq.status = 'Scoring';
    await rfq.save();
    
    await logAudit('SUBMIT_BID', 'RFQHeader', rfq._id, req.user._id);
    res.json({ success: true, data: bid });
  } catch (error) { handleError(res, error); }
};

async function runAutoScoring(rfqLineId) {
  const bids = await VendorBid.find({ rfqLineId });
  if (bids.length === 0) return;

  const minPrice = Math.min(...bids.map(b => b.offeredUnitPrice));
  const minLeadTime = Math.min(...bids.map(b => b.offeredLeadTimeDays));

  for (const bid of bids) {
    // Math: If you are the cheapest, you get 100 on price. If you are double the cheapest, you get 50.
    const priceScore = (minPrice / bid.offeredUnitPrice) * 100;
    const leadTimeScore = (minLeadTime / bid.offeredLeadTimeDays) * 100;
    
    // Sourcing Feedback Loop (Auto-Penalty)
    // Fetch live vendor scorecard
    const scorecard = await VendorScorecard.findOne({ vendorId: bid.vendorId });
    // Default multiplier is 1.0 (100%). If overall score is 80, multiplier is 0.8
    const vendorRatingMultiplier = scorecard ? Math.max(0.1, scorecard.currentOverallScore / 100) : 1.0; 

    // Final = 70% Price + 30% Lead Time, then penalized by the vendor's reliability multiplier
    const finalWeightedScore = ((priceScore * 0.7) + (leadTimeScore * 0.3)) * vendorRatingMultiplier;

    let scoreRec = await BidScoringMatrix.findOne({ bidId: bid._id });
    if (!scoreRec) {
      await BidScoringMatrix.create({ bidId: bid._id, priceScore, leadTimeScore, vendorRatingMultiplier, finalWeightedScore });
    } else {
      scoreRec.priceScore = priceScore;
      scoreRec.leadTimeScore = leadTimeScore;
      scoreRec.vendorRatingMultiplier = vendorRatingMultiplier;
      scoreRec.finalWeightedScore = finalWeightedScore;
      await scoreRec.save();
    }
  }
}

exports.selectQuotation = async (req, res) => {
  try {
    const rfq = await RFQHeader.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    
    const winningBidId = req.params.quoteId;
    const winningBid = await VendorBid.findById(winningBidId).populate('rfqLineId');
    if (!winningBid) return res.status(404).json({ success: false, message: 'Bid not found' });

    // Update Bids (Winner + Losers)
    await VendorBid.updateMany({ rfqLineId: winningBid.rfqLineId._id }, { status: 'Disqualified' });
    winningBid.status = 'Awarded';
    await winningBid.save();

    // Auto-PO Creation
    const poNumber = internalId('PO-AWARD');
    const newPo = await POHeader.create({
      poNumber: poNumber,
      vendorId: winningBid.vendorId,
      approvalStatus: 'Pending',
      totalAmount: winningBid.totalValue,
      rfqId: rfq._id
    });

    await POLineItem.create({
      poId: newPo._id,
      materialId: winningBid.rfqLineId.materialId,
      orderQty: winningBid.rfqLineId.requestedQty,
      unitPrice: winningBid.offeredUnitPrice,
      total: winningBid.totalValue,
      promisedDeliveryDate: new Date(Date.now() + (winningBid.offeredLeadTimeDays * 24 * 60 * 60 * 1000))
    });

    // Update RFQ Status
    rfq.status = 'Awarded';
    await rfq.save();
    
    await logAudit('AWARD_RFQ', 'RFQHeader', rfq._id, req.user._id, { winningBid: winningBid._id, generatedPO: newPo.poNumber });
    res.json({ success: true, message: 'Awarded successfully and PO Generated.' });
  } catch (error) { handleError(res, error); }
};

exports.deleteRFQ = async (req, res) => {
  try {
    const rfq = await RFQHeader.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });

    if (rfq.status === 'Awarded') {
      return res.status(400).json({ success: false, message: 'Cannot delete an awarded RFQ where a Purchase Order has already been generated.' });
    }

    const lineItems = await RFQLineItem.find({ rfqId: rfq._id });
    const lineIds = lineItems.map(l => l._id);
    const bids = await VendorBid.find({ rfqLineId: { $in: lineIds } });
    const bidIds = bids.map(b => b._id);

    await BidScoringMatrix.deleteMany({ bidId: { $in: bidIds } });
    await VendorBid.deleteMany({ rfqLineId: { $in: lineIds } });
    await RFQLineItem.deleteMany({ rfqId: rfq._id });
    await RFQHeader.findByIdAndDelete(req.params.id);

    await logAudit('DELETE', 'RFQHeader', req.params.id, req.user._id);
    res.json({ success: true, message: 'Price Request (RFQ) deleted successfully' });
  } catch (error) { handleError(res, error); }
};

// ================= Advanced Purchase Order Engine =================

exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const headers = await POHeader.find()
      .populate('vendorId', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const headerIds = headers.map(h => h._id);
    const lineItems = await POLineItem.find({ poId: { $in: headerIds } }).populate('materialId', 'name code');
    
    const data = headers.map(h => {
      const obj = h.toObject();
      obj.items = lineItems.filter(li => li.poId.toString() === h._id.toString());
      return obj;
    });

    const total = await POHeader.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data });
  } catch (error) { handleError(res, error); }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const { items, ...headerData } = req.body;
    
    // Auto-generate PO Number if not provided
    if (!headerData.poNumber) {
      headerData.poNumber = internalId('PO');
    }
    
    // Every line needs a material, a positive quantity and a price. Without
    // this a line missing any of them produced a NaN total that Mongoose
    // refused with a cast error — a message that told the buyer nothing.
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'A purchase order needs at least one line.' });
    }
    let totalAmount = 0;
    const processedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const qty = Number(item.quantity ?? item.orderQty);
      const price = Number(item.unitPrice);
      if (!item.materialId) return res.status(400).json({ success: false, message: `Line ${i + 1}: choose a material.` });
      if (!(qty > 0)) return res.status(400).json({ success: false, message: `Line ${i + 1}: quantity must be greater than zero.` });
      if (!(price >= 0)) return res.status(400).json({ success: false, message: `Line ${i + 1}: enter a unit price.` });
      const promised = item.scheduledDeliveryDate || item.promisedDeliveryDate;
      if (!promised || Number.isNaN(new Date(promised).getTime())) return res.status(400).json({ success: false, message: `Line ${i + 1}: enter the date the supplier has promised delivery — the late-delivery check depends on it.` });
      item.scheduledDeliveryDate = promised;
      const lineTotal = qty * price;
      totalAmount += lineTotal;
      processedItems.push({ ...item, orderQty: qty, unitPrice: price, total: lineTotal });
    }
    
    headerData.totalAmount = totalAmount;

    /* Header and lines are one document, so they are written as one thing.
     * A line that failed to save used to leave the header behind — an order
     * for nothing, with a total, that the buyer could neither use nor explain
     * and no screen could delete. */
    const session = await mongoose.startSession();
    session.startTransaction();
    let newPo;
    try {
      [newPo] = await POHeader.create([headerData], { session });
      for (const item of processedItems) {
        await POLineItem.create([{
          poId: newPo._id,
          materialId: item.materialId,
          orderQty: item.orderQty,
          unitPrice: item.unitPrice,
          total: item.total,
          promisedDeliveryDate: item.scheduledDeliveryDate
        }], { session });
      }
      await session.commitTransaction();
    } catch (txErr) {
      await session.abortTransaction();
      throw txErr;
    } finally {
      session.endSession();
    }

    await logAudit('CREATE', 'POHeader', newPo._id, req.user._id);
    res.status(201).json({ success: true, data: newPo });
  } catch (error) { handleError(res, error); }
};

exports.updatePOStatus = async (req, res) => {
  try {
    const { status, deliveryStatus, transmissionStatus } = req.body;
    const po = await POHeader.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    
    // Prevent cancellation if GRN has been received
    if (status === 'Cancelled') {
      const GoodsReceipt = require('../models/GoodsReceipt');
      const grnCount = await GoodsReceipt.countDocuments({ purchaseOrderId: po._id, status: { $in: ['Received', 'Inspecting', 'Posted'] } });
      if (grnCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot cancel PO ${po.poNumber}: ${grnCount} GRN(s) already received against this PO. Raise a Purchase Return instead.`
        });
      }
    }
    
    // If approving, simulate EDI transmission instantly
    if (status === 'Approved' && po.approvalStatus !== 'Approved') {
      po.approvalStatus = 'Approved';
      po.transmissionStatus = 'EDI_Sent'; // Simulated B2B
    } else if (status) {
      po.approvalStatus = status;
    }

    if (deliveryStatus) po.deliveryStatus = deliveryStatus;
    if (transmissionStatus) po.transmissionStatus = transmissionStatus;
    
    await po.save();
    
    await logAudit('UPDATE_PO', 'POHeader', po._id, req.user._id, { status, deliveryStatus, transmissionStatus });
    res.json({ success: true, data: po });
  } catch (error) { handleError(res, error); }
};

exports.deletePurchaseOrder = async (req, res) => {
  try {
    const po = await POHeader.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });

    if (po.deliveryStatus === 'Delivered') {
      return res.status(400).json({ success: false, message: 'Cannot delete a delivered purchase order with received goods.' });
    }

    await POLineItem.deleteMany({ poId: po._id });
    await POChangeHistory.deleteMany({ poId: po._id });
    await POHeader.findByIdAndDelete(req.params.id);

    await logAudit('DELETE', 'POHeader', req.params.id, req.user._id);
    res.json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (error) { handleError(res, error); }
};

// Vendor Portal Simulation: Acknowledge PO
exports.acknowledgePO = async (req, res) => {
  try {
    const po = await POHeader.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    
    po.transmissionStatus = 'Acknowledged';
    await po.save();

    // Vendor might propose a new delivery date in the portal
    if (req.body.newDeliveryDate) {
      const line = await POLineItem.findOne({ poId: po._id });
      if (line) {
        line.promisedDeliveryDate = req.body.newDeliveryDate;
        await line.save();
      }
    }

    await logAudit('VENDOR_ACKNOWLEDGE', 'POHeader', po._id, req.user._id);
    res.json({ success: true, message: 'PO Acknowledged by Vendor' });
  } catch (error) { handleError(res, error); }
};

// Vendor Portal Simulation: Submit ASN
exports.submitASN = async (req, res) => {
  try {
    const po = await POHeader.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    
    po.deliveryStatus = 'In-Transit';
    await po.save();

    await logAudit('VENDOR_ASN', 'POHeader', po._id, req.user._id);
    res.json({ success: true, message: 'ASN Submitted. Status changed to In-Transit.' });
  } catch (error) { handleError(res, error); }
};

// Change Order Engine
exports.createChangeOrder = async (req, res) => {
  try {
    const { newQty, newPrice } = req.body;
    const po = await POHeader.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    
    const line = await POLineItem.findOne({ poId: po._id });
    if (!line) return res.status(404).json({ success: false, message: 'PO Line not found' });

    const oldTotal = po.totalAmount;
    
    // Log changes
    if (newQty && newQty !== line.orderQty) {
      await POChangeHistory.create({
        poId: po._id, changedBy: req.user._id, version: po.version + 1,
        fieldChanged: 'orderQty', oldValue: line.orderQty, newValue: newQty
      });
      line.orderQty = newQty;
    }
    
    if (newPrice && newPrice !== line.unitPrice) {
      await POChangeHistory.create({
        poId: po._id, changedBy: req.user._id, version: po.version + 1,
        fieldChanged: 'unitPrice', oldValue: line.unitPrice, newValue: newPrice
      });
      line.unitPrice = newPrice;
    }

    // Recalculate totals
    line.total = line.orderQty * line.unitPrice;
    await line.save();

    po.totalAmount = line.total;
    po.version += 1;
    
    // Strict control: If value increased, reset approval
    if (po.totalAmount > oldTotal) {
      po.approvalStatus = 'Pending';
      po.transmissionStatus = 'Not_Sent';
    } else {
      po.transmissionStatus = 'EDI_Sent'; // Resend change order
    }
    
    await po.save();
    
    await logAudit('CHANGE_ORDER', 'POHeader', po._id, req.user._id, { newVersion: po.version });
    res.json({ success: true, message: 'Change Order processed successfully', data: po });
  } catch (error) { handleError(res, error); }
};

// Mock Warehouse Goods Receipt
exports.mockGoodsReceipt = async (req, res) => {
  try {
    const po = await POHeader.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    
    const line = await POLineItem.findOne({ poId: po._id });
    if (line) {
      line.receivedQty = line.orderQty; // Receive in full
      line.lineStatus = 'Closed';
      await line.save();
    }
    
    po.deliveryStatus = 'Delivered';
    await po.save();
    
    res.json({ success: true, message: 'Goods Receipt simulated.' });
  } catch (error) { handleError(res, error); }
};

// 3-Way Match Simulation
exports.processInvoice = async (req, res) => {
  try {
    const { invoicedQty, invoiceUnitPrice } = req.body;
    const po = await POHeader.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    
    const line = await POLineItem.findOne({ poId: po._id });
    if (!line) return res.status(404).json({ success: false, message: 'PO Line not found' });
    
    let matchResult = 'Matched';
    let blockReason = null;
    
    // TOLERANCE CHECKS
    if (invoicedQty > line.receivedQty) {
      matchResult = 'Tolerance_Block';
      blockReason = `Invoiced Qty (${invoicedQty}) exceeds Received Qty (${line.receivedQty})`;
    } else if (invoiceUnitPrice > line.unitPrice) {
      matchResult = 'Tolerance_Block';
      blockReason = `Invoice Price (₹${invoiceUnitPrice}) exceeds PO Price (₹${line.unitPrice})`;
    }

    if (matchResult === 'Matched') {
      line.invoicedQty = invoicedQty;
      await line.save();
      await logAudit('3_WAY_MATCH', 'POHeader', po._id, req.user._id, { status: 'Success' });
      res.json({ success: true, message: '3-Way Match Successful. Invoice Auto-Approved.' });
    } else {
      await logAudit('TOLERANCE_BLOCK', 'POHeader', po._id, req.user._id, { reason: blockReason });
      res.status(400).json({ success: false, message: `3-Way Match Failed: ${blockReason}` });
    }
  } catch (error) { handleError(res, error); }
};

// ================= Vendor Performance & Scorecard Engine =================

// Helper: Recalculate and update the vendor's scorecard based on recent logs
const recalculateScorecard = async (vendorId) => {
  let scorecard = await VendorScorecard.findOne({ vendorId });
  if (!scorecard) {
    scorecard = new VendorScorecard({ vendorId });
  }

  // Fetch all logs for this vendor
  const logs = await KPIEventLog.find({ vendorId });
  
  let deliveryImpacts = 0;
  let qualityImpacts = 0;
  let complianceImpacts = 0;

  logs.forEach(log => {
    if (log.kpiCategory === 'Delivery') deliveryImpacts += log.impactValue;
    if (log.kpiCategory === 'Quality') qualityImpacts += log.impactValue;
    if (log.kpiCategory === 'Compliance') complianceImpacts += log.impactValue;
  });

  // Calculate new values based on impacts
  scorecard.rollingOtifPct = Math.max(0, 100 + deliveryImpacts); // e.g. -5 means 95%
  scorecard.rollingDefectPpm = Math.max(0, 0 + (qualityImpacts * -100)); // e.g. -1 means 100 PPM
  
  // Calculate overall score (Delivery 40%, Quality 40%, Compliance 20%)
  const deliveryScore = scorecard.rollingOtifPct * 0.4;
  const qualityScore = Math.max(0, 100 - (scorecard.rollingDefectPpm / 100)) * 0.4;
  const complianceScore = scorecard.riskStatus === 'Blocked' ? 0 : 100 * 0.2;
  
  scorecard.currentOverallScore = Math.min(100, Math.max(0, deliveryScore + qualityScore + complianceScore));

  if (scorecard.currentOverallScore < 50 && scorecard.riskStatus === 'Approved') {
    scorecard.riskStatus = 'Probation'; // Auto-trigger probation
  }

  scorecard.lastCalculated = new Date();
  await scorecard.save();
  return scorecard;
};

exports.getLiveScorecards = async (req, res) => {
  try {
    const scorecards = await VendorScorecard.find().populate('vendorId', 'name code');
    res.json({ success: true, data: scorecards });
  } catch (error) { handleError(res, error); }
};

exports.mockWarehouseReceipt = async (req, res) => {
  try {
    const { vendorId, isLate, daysLate } = req.body;
    
    // Simulate Goods Receipt
    if (isLate) {
      const impact = -(daysLate * 5); // Lose 5 points per day late
      await KPIEventLog.create({
        vendorId,
        sourceModule: 'Goods_Receipt',
        referenceDocId: internalId('GR-MOCK'),
        kpiCategory: 'Delivery',
        impactValue: impact,
        notes: `Delivery arrived ${daysLate} days late.`
      });
      await recalculateScorecard(vendorId);
      res.json({ success: true, message: `Mock Goods Receipt: Late delivery logged. Score penalized by ${impact} points.` });
    } else {
      res.json({ success: true, message: 'Mock Goods Receipt: Delivery was On-Time. No penalty.' });
    }
  } catch (error) { handleError(res, error); }
};

exports.mockQAInspection = async (req, res) => {
  try {
    const { vendorId, defectCount, totalChecked } = req.body;
    
    if (defectCount > 0) {
      // Impact is proportional to defect rate
      const defectRate = defectCount / totalChecked;
      const impact = -(defectRate * 100); 
      await KPIEventLog.create({
        vendorId,
        sourceModule: 'QA_Inspection',
        referenceDocId: internalId('QA-MOCK'),
        kpiCategory: 'Quality',
        impactValue: impact,
        notes: `QA Failed ${defectCount} out of ${totalChecked} items.`
      });
      await recalculateScorecard(vendorId);
      res.json({ success: true, message: `Mock QA: Defects found. Quality score penalized by ${impact.toFixed(1)} points.` });
    } else {
      res.json({ success: true, message: 'Mock QA: All items passed inspection. No penalty.' });
    }
  } catch (error) { handleError(res, error); }
};

exports.mockCertificateExpiration = async (req, res) => {
  try {
    const { vendorId } = req.body;
    
    await KPIEventLog.create({
      vendorId,
      sourceModule: 'Compliance_Monitor',
      referenceDocId: internalId('CERT-EXP'),
      kpiCategory: 'Compliance',
      impactValue: -100, // Massive penalty for compliance
      notes: `ISO 9001 Certificate Expired. Auto-generating CAPA.`
    });
    
    // Auto-Block the vendor
    let scorecard = await VendorScorecard.findOne({ vendorId });
    if (!scorecard) {
      scorecard = new VendorScorecard({ vendorId });
    }
    scorecard.riskStatus = 'Blocked';
    await scorecard.save();
    
    await recalculateScorecard(vendorId);
    
    res.json({ success: true, message: `Mock Compliance: Certificate expired. Vendor status set to BLOCKED and CAPA triggered.` });
  } catch (error) { handleError(res, error); }
};

exports.getVendorEventLogs = async (req, res) => {
  try {
    const logs = await KPIEventLog.find({ vendorId: req.params.vendorId }).sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, data: logs });
  } catch (error) { handleError(res, error); }
};

exports.updateVendorRiskStatus = async (req, res) => {
  try {
    const { riskStatus, notes } = req.body;
    let scorecard = await VendorScorecard.findOne({ vendorId: req.params.vendorId });
    if (!scorecard) return res.status(404).json({ success: false, message: 'Scorecard not found' });
    
    scorecard.riskStatus = riskStatus;
    if (riskStatus === 'Approved') {
      scorecard.currentOverallScore = Math.max(scorecard.currentOverallScore, 75);
    }
    await scorecard.save();

    if (notes) {
      await KPIEventLog.create({
        vendorId: req.params.vendorId,
        sourceModule: 'Compliance_Monitor',
        referenceDocId: internalId('STATUS-AUDIT'),
        kpiCategory: 'Compliance',
        impactValue: riskStatus === 'Approved' ? 20 : -20,
        notes: `Management Override: Vendor status updated to ${riskStatus}. Reason: ${notes}`
      });
    }

    res.json({ success: true, message: `Vendor status updated to ${riskStatus}`, data: scorecard });
  } catch (error) { handleError(res, error); }
};
