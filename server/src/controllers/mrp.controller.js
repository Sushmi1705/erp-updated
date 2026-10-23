const mongoose = require('mongoose');
const { handleError } = require('../utils/errorHandler');
const { internalId } = require('../utils/internalId');
const { MrpRunHeader, ExplodedRequirement, InventorySupplySnapshot } = require('../models/MrpExecution');
const { ShortageRecord, ConstraintDetails, ResolutionLog } = require('../models/MrpShortage');
const { RecommendationRecord, ConversionAuditLog } = require('../models/MrpRecommendation');
const { BOMHeader, BOMRevision, BOMComponent } = require('../models/EngineeringBOM');
const { PurchaseOrder, POHeader, POLineItem } = require('../models/PurchaseOrder');
const { WOHeader, WODetail } = require('../models/WorkOrder');
const { PlanHeader, PlanDetail } = require('../models/ProductionPlan');
const { generateDocNumber } = require('../utils/docNumbering');
const InventoryStock = require('../models/InventoryStock');
const { InventoryOptimization } = require('../models/InventoryOptimization');
const { DemandConsolidation } = require('../models/DemandConsolidation');
const { SalesOrder, SOHeader, SOLineItem } = require('../models/SalesOrder');
const { Material } = require('../models/MasterMaterial');
const { AuditLog } = require('../models/Audit');

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

// Helpers
async function getAvailableStock(itemId) {
  const stocks = await InventoryStock.find({ materialId: itemId, status: 'Active' });
  return stocks.reduce((acc, s) => acc + s.quantityAvailable, 0);
}

async function getAllocatedStock(itemId) {
  const stocks = await InventoryStock.find({ materialId: itemId, status: 'Active' });
  return stocks.reduce((acc, s) => acc + (s.allocatedQuantity || 0), 0);
}

async function getSafetyStock(itemId) {
  const opt = await InventoryOptimization.findOne({ materialId: itemId });
  return opt ? (opt.safetyStock || 0) : 0;
}

// M-11: Lead time from MasterMaterial master data (not hardcoded)
async function getLeadTimeDays(itemId, itemModel) {
  if (itemModel === 'Material') {
    try {
      const mat = await Material.findById(itemId).select('leadTimeDays').lean();
      if (mat && mat.leadTimeDays > 0) return mat.leadTimeDays;
    } catch (e) { /* fall through to default */ }
    return 14; // Default procurement lead time for materials not yet configured
  }
  return 7; // Default production lead time for finished goods
}

// M-11: Lot Sizing using MOQ from MasterMaterial (not hardcoded)
async function calculateLotSizedQty(netQty, itemModel, itemId) {
  if (netQty <= 0) return 0;
  
  let moq = 1;
  let lotSize = 1;

  if (itemModel === 'Material') {
    try {
      // Check InventoryOptimization first, then Material master
      const opt = await InventoryOptimization.findOne({ materialId: itemId }).lean();
      const mat = await Material.findById(itemId).select('moq minimumOrderQuantity').lean();
      moq = opt?.moq || mat?.minimumOrderQuantity || mat?.moq || 1;
      lotSize = opt?.lotSize || 1;
    } catch (e) { moq = 100; lotSize = 50; } // Fallback if DB read fails
  }
  
  if (moq < 1) moq = 1;
  if (lotSize < 1) lotSize = 1;
  return Math.max(moq, Math.ceil(netQty / lotSize) * lotSize);
}


// ================= MRP Execution Engine =================

exports.getAllMrpRuns = async (req, res) => {
  try {
    const runs = await MrpRunHeader.find().sort({ createdAt: -1 }).populate('executedBy', 'name');
    res.json({ success: true, data: runs });
  } catch (error) { handleError(res, error); }
};

exports.getRequirements = async (req, res) => {
  try {
    const { runId } = req.query;
    const reqs = await ExplodedRequirement.find(runId ? { runId } : {}).populate('itemId', 'name code').sort({ bomLevel: 1, requirementDate: 1 });
    res.json({ success: true, data: reqs });
  } catch (error) { handleError(res, error); }
};

exports.getSnapshots = async (req, res) => {
  try {
    const { runId } = req.query;
    const snaps = await InventorySupplySnapshot.find(runId ? { runId } : {}).populate('itemId', 'name code');
    res.json({ success: true, data: snaps });
  } catch (error) { handleError(res, error); }
};

exports.executeMrpRun = async (req, res) => {
  let mrpRun = null;
  try {
    const { period } = req.body;
    if (!period) return res.status(400).json({ success: false, message: 'Period is required' });

    const runNo = internalId(`MRP-${period}`);
    mrpRun = await MrpRunHeader.create({ 
      runNo, 
      targetPeriod: period, 
      status: 'Draft',
      executedBy: req.user._id,
      runParameters: { executionType: 'Full Regeneration' }
    });

    const topLevelRequiredDate = new Date();
    topLevelRequiredDate.setDate(topLevelRequiredDate.getDate() + 30); 


    const createdRequirements = [];
    const snapshotMap = {}; 
    const shortagesList = [];
    const constraintsList = [];
    const recommendationsList = [];

    const getSnapshot = async (itemModel, itemId) => {
      const key = `${itemModel}_${itemId.toString()}`;
      if (snapshotMap[key]) return snapshotMap[key];

      const onHandQty = await getAvailableStock(itemId);
      const allocatedQty = await getAllocatedStock(itemId);
      
      let scheduledReceiptsQty = 0;
      if (itemModel === 'Material') {
        const openPOs = await PurchaseOrder.find({ status: { $in: ['Approved', 'Dispatched'] } });
        openPOs.forEach(po => {
          const item = po.items.find(i => i.materialId && i.materialId.toString() === itemId.toString());
          if (item) scheduledReceiptsQty += item.quantity;
        });
      }

      const snap = await InventorySupplySnapshot.create({ runId: mrpRun._id, itemModel, itemId, onHandQty, scheduledReceiptsQty, allocatedQty });
      snapshotMap[key] = snap;
      return snap;
    };

    const explodeBOM = async (itemModel, itemId, grossQty, requiredDate, bomLevel, parentReqId) => {
      if (grossQty <= 0) return;

      const snap = await getSnapshot(itemModel, itemId);
      const safetyStock = await getSafetyStock(itemId);
      const availableToPromise = (snap.onHandQty + snap.scheduledReceiptsQty) - snap.allocatedQty;
      const netQty = Math.max(0, grossQty - availableToPromise + safetyStock);

      const leadTimeDays = await getLeadTimeDays(itemId, itemModel);
      const requirementDate = new Date(requiredDate);
      requirementDate.setDate(requirementDate.getDate() - leadTimeDays);

      if (netQty > 0) {
        // --- SHORTAGE RECORD GENERATION ---
        let category = itemModel === 'Material' ? 'Raw Material' : 'Component';
        let severity = requirementDate < new Date() ? 'Critical' : 'Low';
        if (severity === 'Critical') category = 'Production Constraint';

        const shortage = new ShortageRecord({
          runId: mrpRun._id, itemModel, itemId, shortageCategory: category, requiredQty: grossQty,
          availableQty: availableToPromise, shortageQty: netQty, impactDate: requiredDate, severity, status: 'Open'
        });
        await shortage.save();
        shortagesList.push(shortage);

        if (severity === 'Critical') {
          constraintsList.push({ shortageId: shortage._id, constraintType: 'Lead Time Violation', description: 'Date falls in the past.' });
        }

        // --- RECOMMENDATION GENERATION (Rules 1-3) ---
        // Rule 1: MOQ/Lot Sizing
        const suggestedQty = await calculateLotSizedQty(netQty, itemModel, itemId);
        const suggestionCategory = itemModel === 'Material' ? 'Purchase' : 'Production';

        // Rule 2: Intelligent Rescheduling First
        let actionType = 'Create New';
        let referenceOrderId = null;

        if (itemModel === 'Material') {
          const openPOs = await PurchaseOrder.find({ status: 'Approved' });
          for (let po of openPOs) {
            const item = po.items.find(i => i.materialId && i.materialId.toString() === itemId.toString());
            // If the PO is scheduled to arrive AFTER the required date, suggest rescheduling it IN
            if (item && po.expectedDeliveryDate && po.expectedDeliveryDate > requirementDate) {
              actionType = 'Reschedule In';
              referenceOrderId = po._id;
              break;
            }
          }
        }

        recommendationsList.push({
          runId: mrpRun._id,
          itemModel,
          itemId,
          suggestionCategory,
          actionType,
          suggestedQty,
          suggestedReleaseDate: requirementDate, // Rule 3: Lead time offsetting
          suggestedDueDate: requiredDate,
          referenceOrderId,
          status: 'Pending'
        });
      }

      if (netQty <= 0) return; 

      const reqType = itemModel === 'Material' ? 'Procurement' : 'Production';
      const requirement = await ExplodedRequirement.create({
        runId: mrpRun._id, requirementType: reqType, itemModel, itemId, requiredQty: netQty,
        requirementDate, bomLevel, parentRequirementId: parentReqId, isExpedited: requirementDate < new Date()
      });
      createdRequirements.push(requirement);

      if (itemModel === 'Material') return;

      const bomHeader = await BOMHeader.findOne({ productId: itemId, status: { $ne: 'Obsolete' } });
      if (!bomHeader) return;

      // bomRevisionSchema names this field approvalStatus; 'Active' is a bomHeader status
      // and is not part of the approvalStatus enum, so it can never match here.
      const activeRevision = await BOMRevision.findOne({ bomId: bomHeader._id, approvalStatus: { $in: ['Approved', 'Draft'] } }).sort({ updatedAt: -1 });
      if (!activeRevision) return;

      const components = await BOMComponent.find({ revisionId: activeRevision._id });
      for (const comp of components) {
        const scrapFactor = 1 + ((comp.scrapYieldPercentage || 0) / 100);
        const qtyPer = comp.quantityPerAssembly || 1;
        const compGrossQty = netQty * qtyPer * scrapFactor;
        const compModel = comp.materialId ? 'Material' : 'Product';
        const compId = comp.materialId || comp.productId;
        if (compId) await explodeBOM(compModel, compId, compGrossQty, requirementDate, bomLevel + 1, requirement._id);
      }
    };

    // M-12: Build demand from DemandConsolidation AND open Sales Orders
    const demands = await DemandConsolidation.find({ periodName: period });

    // M-12: Pull open Sales Orders (V1 + V2) as additional demand source
    const openSOs = await SalesOrder.find({
      status: { $in: ['Draft', 'Pending Approval', 'Approved', 'Processing', 'Partially Shipped'] }
    }).lean();

    // Convert open SO line items into demand entries (supplement DemandConsolidation)
    const soDemandMap = {};
    for (const so of openSOs) {
      const soItems = so.items || [];
      for (const item of soItems) {
        const prodId = item.productId || item.materialId;
        if (!prodId) continue;
        const key = prodId.toString();
        const qty = item.quantity || item.orderedQuantity || 0;
        soDemandMap[key] = (soDemandMap[key] || 0) + qty;
      }
    }

    // Also pull V2 open Sales Orders (SOHeader + SOLineItem)
    const openV2Headers = await SOHeader.find({
      status: { $in: ['Draft', 'Pending Approval', 'Approved', 'Processing', 'Partially Shipped', 'In-Progress'] }
    }).select('_id').lean();

    if (openV2Headers.length > 0) {
      const v2HeaderIds = openV2Headers.map(h => h._id);
      const openV2Lines = await SOLineItem.find({ orderId: { $in: v2HeaderIds } }).lean();
      for (const line of openV2Lines) {
        const prodId = line.productId || line.materialId;
        if (!prodId) continue;
        const key = prodId.toString();
        const qty = line.orderedQuantity || line.shippedQuantity || line.quantity || 0;
        soDemandMap[key] = (soDemandMap[key] || 0) + qty;
      }
    }

    // Explode BOM for SO-derived demand (products not already in DemandConsolidation)
    const consolidatedProductIds = new Set(demands.map(d => d.productId?.toString()));
    for (const [prodIdStr, qty] of Object.entries(soDemandMap)) {
      if (!consolidatedProductIds.has(prodIdStr) && qty > 0) {
        const mongoose = require('mongoose');
        const prodId = mongoose.Types.ObjectId.isValid(prodIdStr)
          ? new mongoose.Types.ObjectId(prodIdStr)
          : prodIdStr;
        await explodeBOM('Product', prodId, qty, topLevelRequiredDate, 0, null);
      }
    }

    for (const demand of demands) {
      if (demand.finalNetDemand > 0) {
        await explodeBOM('Product', demand.productId, demand.finalNetDemand, topLevelRequiredDate, 0, null);
      }
    }

    if (constraintsList.length > 0) await ConstraintDetails.insertMany(constraintsList);
    if (recommendationsList.length > 0) await RecommendationRecord.insertMany(recommendationsList);

    mrpRun.status = 'Completed';
    await mrpRun.save();
    
    res.json({ success: true, data: mrpRun });
  } catch (error) { 
    if (mrpRun && mrpRun._id) await MrpRunHeader.findByIdAndUpdate(mrpRun._id, { status: 'Failed' }).catch(() => {});
    handleError(res, error); 
  }
};

// ================= SHORTAGE ANALYSIS =================
exports.getShortages = async (req, res) => {
  try {
    const { runId } = req.query;
    const filter = runId ? { runId } : {};
    const shortages = await ShortageRecord.find(filter).populate('itemId', 'name code').sort({ severity: 1, impactDate: 1 });
    const constraints = await ConstraintDetails.find({ shortageId: { $in: shortages.map(s => s._id) } });
    const data = shortages.map(s => {
      const sObj = s.toObject();
      sObj.constraintDetails = constraints.find(c => c.shortageId.toString() === s._id.toString());
      return sObj;
    });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.resolveShortage = async (req, res) => {
  try {
    const { shortageId } = req.params;
    const { actionType, referenceDocNo } = req.body;
    const shortage = await ShortageRecord.findById(shortageId);
    if (!shortage) return res.status(404).json({ success: false, message: 'Shortage not found' });
    shortage.status = 'Action Taken';
    await shortage.save();
    await ResolutionLog.create({ shortageId, actionType, referenceDocNo, actionedBy: req.user._id });
    res.json({ success: true });
  } catch (error) { handleError(res, error); }
};

exports.refreshLiveShortages = async (req, res) => {
  try {
    const { runId } = req.body;
    const existingShortages = await ShortageRecord.find({ runId }).populate('itemId');
    const liveResults = [];
    for (const s of existingShortages) {
      const onHandQty = await getAvailableStock(s.itemId._id);
      const allocatedQty = await getAllocatedStock(s.itemId._id);
      let scheduledReceiptsQty = 0;
      if (s.itemModel === 'Material') {
        const openPOs = await PurchaseOrder.find({ status: { $in: ['Approved', 'Dispatched'] } });
        openPOs.forEach(po => {
          const item = po.items.find(i => i.materialId && i.materialId.toString() === s.itemId._id.toString());
          if (item) scheduledReceiptsQty += item.quantity;
        });
      }
      const availableToPromise = (onHandQty + scheduledReceiptsQty) - allocatedQty;
      const liveShortageQty = Math.max(0, s.requiredQty - availableToPromise);
      liveResults.push({
        _id: s._id, itemId: s.itemId, shortageCategory: s.shortageCategory, requiredQty: s.requiredQty,
        liveAvailableQty: availableToPromise, liveShortageQty: liveShortageQty, severity: s.severity,
        status: liveShortageQty <= 0 ? 'Resolved (Math Cleared)' : s.status
      });
    }
    res.json({ success: true, data: liveResults });
  } catch (error) { handleError(res, error); }
};

// ================= MRP RECOMMENDATION ENGINE =================

exports.getRecommendations = async (req, res) => {
  try {
    const { runId } = req.query;
    const filter = runId ? { runId } : {};
    const recs = await RecommendationRecord.find(filter)
      .populate('itemId', 'name code')
      .populate('referenceOrderId', 'poNumber workOrderNumber')
      .sort({ suggestedReleaseDate: 1 });
    res.json({ success: true, data: recs });
  } catch (error) { handleError(res, error); }
};

// Rule 4: One-Way Conversion Integrity
exports.convertRecommendation = async (req, res) => {
  /* This used to be a stub. It flipped the recommendation to "Converted",
   * minted a random ObjectId and filed that as the "generated document" — so
   * planning produced nothing downstream, and the audit trail pointed at a
   * document that had never existed. (It also threw outright on Mongoose 7,
   * which requires `new` before Types.ObjectId.)
   *
   * A recommendation now becomes a real purchase order or a real work order,
   * and the audit log records that document's actual id.
   */
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;

    const rec = await RecommendationRecord.findById(id);
    if (!rec) return res.status(404).json({ success: false, message: 'Recommendation not found' });
    if (rec.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Recommendation has already been converted or dismissed' });
    }

    const qty = Number(rec.suggestedQty) || 0;
    if (qty <= 0) {
      return res.status(400).json({ success: false, message: 'Recommendation has no quantity to convert.' });
    }

    let generatedDocType = '';
    let generatedDocId = null;
    let generatedDocNumber = '';

    await session.withTransaction(async () => {
      if (rec.suggestionCategory === 'Purchase') {
        const material = await Material.findById(rec.itemId).session(session);

        // Without a vendor there is nobody to buy from, and inventing one would
        // put a real order against a made-up supplier.
        const vendorId = rec.targetSupplierId || material?.preferredVendorId;
        if (!vendorId) {
          const err = new Error('No supplier on the recommendation and no preferred vendor on the material — set one before converting.');
          err.statusCode = 400;
          throw err;
        }

        const unitPrice = Number(material?.standardCost) || 0;
        const total = Number((qty * unitPrice).toFixed(2));

        generatedDocNumber = await generateDocNumber('PO', 'PO', session);
        const [po] = await POHeader.create([{
          poNumber: generatedDocNumber,
          date: new Date(),
          vendorId,
          totalAmount: total,
          approvalStatus: 'Pending',
          deliveryStatus: 'Not Scheduled',
          companyId: rec.companyId
        }], { session });

        await POLineItem.create([{
          poId: po._id,
          materialId: rec.itemId,
          orderQty: qty,
          unitPrice,
          total,
          promisedDeliveryDate: rec.suggestedDueDate || rec.suggestedReleaseDate || new Date(),
          lineStatus: 'Open'
        }], { session });

        generatedDocType = 'Purchase Order';
        generatedDocId = po._id;
      } else {
        // Work orders hang off a production plan, so each MRP run gets one plan
        // that its converted recommendations share rather than a loose plan per
        // line.
        const planNumber = `MRP-PLAN-${String(rec.runId).slice(-6)}`;
        let plan = await PlanHeader.findOne({ Plan_Number: planNumber }).session(session);
        if (!plan) {
          [plan] = await PlanHeader.create([{
            Plan_Number: planNumber,
            Plan_Type: 'Make-to-Stock',
            Status: 'Released',
            Priority: 'Normal',
            Notes: `Created automatically from MRP run ${rec.runId}`
          }], { session });
        }

        const lineCount = await PlanDetail.countDocuments({ Plan_ID: plan._id }).session(session);
        const [planDetail] = await PlanDetail.create([{
          Plan_ID: plan._id,
          Line_Sequence_Number: lineCount + 1,
          Material_ID: rec.itemId,
          Target_Quantity: qty,
          Planned_Start_Date: rec.suggestedReleaseDate || new Date(),
          Planned_End_Date: rec.suggestedDueDate || rec.suggestedReleaseDate || new Date()
        }], { session });

        generatedDocNumber = await generateDocNumber('WO', 'WO', session);
        const [wo] = await WOHeader.create([{
          WO_Number: generatedDocNumber,
          Source_Plan_ID: plan._id,
          Status: 'Draft',
          Material_Status: 'Pending'
        }], { session });

        await WODetail.create([{
          WO_ID: wo._id,
          Material_ID: rec.itemId,
          Target_Quantity: qty,
          Produced_Quantity: 0,
          Scrapped_Quantity: 0,
          companyId: rec.companyId
        }], { session });

        generatedDocType = 'Work Order';
        generatedDocId = wo._id;
        rec.referenceOrderId = wo._id;
        void planDetail;
      }

      rec.status = 'Converted';
      rec.referenceOrderId = generatedDocId;
      await rec.save({ session });

      await ConversionAuditLog.create([{
        recommendationId: rec._id,
        generatedDocType,
        generatedDocId,
        convertedBy: req.user._id
      }], { session });
    });

    await logAudit('CONVERT_RECOMMENDATION', 'RecommendationRecord', rec._id, req.user._id,
      { generatedDocType, generatedDocId, generatedDocNumber });

    res.json({
      success: true,
      message: `Converted to ${generatedDocType} ${generatedDocNumber}`,
      data: { generatedDocType, generatedDocId, generatedDocNumber }
    });
  } catch (error) {
    if (error.statusCode === 400) return res.status(400).json({ success: false, message: error.message });
    handleError(res, error);
  } finally {
    session.endSession();
  }
};


// Rule 5: Real-Time Invalidation (Webhook Mock)
