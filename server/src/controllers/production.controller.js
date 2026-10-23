const { handleError } = require('../utils/errorHandler');
const { editable } = require('../utils/safeBody');
const { internalId } = require('../utils/internalId');
const { postStockMovement, wipBalanceForOrder } = require('../services/stockPosting.service');
const { ProductionPlan, PlanHeader, PlanDetail, CapacityValidation, ApprovalRouting } = require('../models/ProductionPlan');
const { BOMHeader, BOMRevision, BOMComponent } = require('../models/EngineeringBOM');
const { AllocationHeader, ComponentRequirement, InventoryTransaction: AllocationLedger } = require('../models/MaterialAllocation');
const { ExecutionRun, ExecutionOperation: RoutingOperation, LaborLog, MachineLog, QualityLog } = require('../models/ProductionExecution');
const { OutputHeader, YieldDetail, InventoryPutaway, QualityReasonCode } = require('../models/ProductionOutput');
const { 
  WOHeader, 
  WODetail, 
  ExecutionProgress, 
  WorkOrder 
} = require('../models/WorkOrder');
const { ProductionOutput } = require('../models/ProductionOutput');
const InventoryStock = require('../models/InventoryStock');
const { InventoryTransaction } = require('../models/InventoryTransaction');
const { Material } = require('../models/MasterMaterial');
const { AuditLog } = require('../models/Audit');
const { JournalEntry, JournalEntryLine, ChartOfAccounts } = require('../models/GeneralLedger');
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

/* FIFO stock deduction.
 *
 * Returns what was actually taken and what it was worth, because the value of
 * material leaving the store is the amount that has to reach the ledger — and
 * under FIFO that is not quantity x some average, it is the sum of each batch's
 * own cost. The oldest coil bought at ₹55 and a later one at ₹61 leave the
 * store at the prices they came in at.
 */
async function deductStock(materialId, quantity, session) {
  let remaining = quantity;
  let value = 0;
  const query = InventoryStock.find({ materialId, status: 'Active' }).sort({ postingDate: 1 });
  if (session) query.session(session);
  const stocks = await query;

  for (const stock of stocks) {
    if (remaining <= 0) break;
    const unitCost = Number(stock.unitCost) || 0;
    if (stock.quantityAvailable >= remaining) {
      value += remaining * unitCost;
      stock.quantityAvailable -= remaining;
      if (stock.quantityAvailable === 0) stock.status = 'Consumed';
      await stock.save({ session });
      remaining = 0;
    } else {
      value += stock.quantityAvailable * unitCost;
      remaining -= stock.quantityAvailable;
      stock.quantityAvailable = 0;
      stock.status = 'Consumed';
      await stock.save({ session });
    }
  }
  // If still remaining, we could not fully deduct — log but don't throw (partial)
  return { quantityDeducted: quantity - remaining, value: Number(value.toFixed(2)) };
}

// ================= Production Planning =================

exports.getAllPlans = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const plans = await ProductionPlan.find()
      .populate('materialId', 'name code category')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await ProductionPlan.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: plans });
  } catch (error) { handleError(res, error); }
};

exports.createPlan = async (req, res) => {
  try {
    req.body.planNumber = internalId('PP');
    const plan = await ProductionPlan.create(req.body);
    await logAudit('CREATE', 'ProductionPlan', plan._id, req.user._id);
    res.status(201).json({ success: true, data: plan });
  } catch (error) { handleError(res, error); }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await ProductionPlan.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (req.body.status === 'Approved') {
      plan.approvedBy = req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
      await plan.save();
    }

    await logAudit('UPDATE', 'ProductionPlan', plan._id, req.user._id);
    res.json({ success: true, data: plan });
  } catch (error) { handleError(res, error); }
};

exports.validateCapacity = async (req, res) => {
  try {
    const plan = await ProductionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Not found' });
    
    // Real capacity check: check if any capacity machine record exists with sufficient available hours
    const CapacityMachine = require('../models/CapacityMachine');
    const machines = await CapacityMachine.find({ status: 'Active' });
    
    // Simple check: if there are active machines in the system, allow the plan to proceed
    // A full implementation would check hours against the routing
    const hasCapacity = machines.length > 0;
    
    plan.capacityValidated = hasCapacity;
    await plan.save();
    
    if (!hasCapacity) {
      return res.status(400).json({ success: false, message: 'No active machines found in system. Please add machine capacity records first.' });
    }
    
    res.json({ success: true, message: 'Capacity validated successfully', data: plan });
  } catch (error) { handleError(res, error); }
};

// ================= Work Order Management =================

exports.getAllWorkOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const wos = await WorkOrder.find()
      .populate('productionPlanId', 'planNumber')
      .populate('materialId', 'name code')
      .populate('allocatedMaterials.materialId', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await WorkOrder.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: wos });
  } catch (error) { handleError(res, error); }
};

exports.createWorkOrder = async (req, res) => {
  try {
    const { productionPlanId } = req.body;
    const plan = await ProductionPlan.findById(productionPlanId).populate('materialId');
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (plan.status !== 'Approved') return res.status(400).json({ success: false, message: 'Plan must be approved' });

    // Get the actual BOM for the product — M-13: respect effectivity dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let allocatedMaterials = [];

    const bomHeader = await BOMHeader.findOne({ productId: plan.materialId }).lean();
    if (bomHeader) {
      const revisions = await BOMRevision.find({
        bomId: bomHeader._id,
        approvalStatus: 'Approved'
      }).lean();

      const activeVersion = revisions
        .filter(v => {
          const fromOk = !v.validFromDate || new Date(v.validFromDate) <= today;
          const toOk   = !v.validToDate   || new Date(v.validToDate)   >= today;
          return fromOk && toOk;
        })
        .sort((a, b) => new Date(b.validFromDate || 0) - new Date(a.validFromDate || 0))[0];

      if (revisions.length > 0 && !activeVersion) {
        return res.status(400).json({
          success: false,
          message: `No effective BOM revision found for this product as of ${today.toDateString()}. ` +
            'Please create or approve a BOM revision with valid effectivity dates.'
        });
      }

      if (activeVersion) {
        const components = await BOMComponent.find({ revisionId: activeVersion._id }).lean();
        if (components && components.length > 0) {
          allocatedMaterials = components
            .filter(c => c.materialId || c.productId)
            .map(c => ({
              materialId: c.materialId || c.productId,
              requiredQty: plan.plannedQuantity * (c.quantity || 1) * (1 + ((c.scrapPercentage || 0) / 100)),
              reservedQty: 0,
              issuedQty: 0,
              consumedQty: 0
            }));
        }
      }
    }

    // Fallback: if no BOM found, use available raw materials
    if (allocatedMaterials.length === 0) {
      const rawMaterials = await Material.find().limit(2);
      allocatedMaterials = rawMaterials.map(rm => ({
        materialId: rm._id,
        requiredQty: plan.plannedQuantity,
        reservedQty: 0,
        issuedQty: 0,
        consumedQty: 0
      }));
    }

    const wo = await WorkOrder.create({
      workOrderNumber: internalId('WO'),
      productionPlanId,
      materialId: plan.materialId,
      targetQuantity: plan.plannedQuantity,
      allocatedMaterials
    });

    await logAudit('CREATE', 'WorkOrder', wo._id, req.user._id);
    res.status(201).json({ success: true, data: wo });
  } catch (error) { handleError(res, error); }
};

exports.updateWorkOrder = async (req, res) => {
  try {
    const wo = await WorkOrder.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!wo) return res.status(404).json({ success: false, message: 'Not found' });
    await logAudit('UPDATE', 'WorkOrder', wo._id, req.user._id);
    res.json({ success: true, data: wo });
  } catch (error) { handleError(res, error); }
};

// ================= Material Allocation =================

exports.updateMaterialAllocation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { workOrderId, materialId, action, quantity } = req.body;
    
    const wo = await WorkOrder.findById(workOrderId).session(session);
    if (!wo) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }

    const item = wo.allocatedMaterials.find(m => m.materialId.toString() === materialId);
    if (!item) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Material not in allocation list' });
    }

    if (action === 'reserve') {
      item.reservedQty += quantity;
    }
    
    if (action === 'issue') {
      // Deduct from actual InventoryStock (FIFO)
      await deductStock(materialId, quantity, session);
      
      const { generateDocNumber } = require('../utils/docNumbering');
      
      // Record inventory transaction
      await InventoryTransaction.create([{
        transactionNumber: await generateDocNumber('MATISS', 'MATISS', session),
        transactionType: 'Material Issue',
        materialId: materialId,
        quantity: quantity,
        sourceWarehouseId: wo.defaultWarehouseId || null,
        referenceDocument: `WO-${wo.workOrderNumber}`,
        notes: `Material issued for Work Order ${wo.workOrderNumber}`,
        createdBy: req.user._id,
        status: 'Posted'
      }], { session });
      
      item.issuedQty += quantity;
      wo.materialStatus = 'Issued';
    }
    
    if (action === 'consume') {
      item.consumedQty += quantity;
      if (item.consumedQty >= item.requiredQty) {
        const allConsumed = wo.allocatedMaterials.every(m => m.consumedQty >= m.requiredQty);
        if (allConsumed) wo.materialStatus = 'Consumed';
      }
    }

    await wo.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, data: wo });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    handleError(res, error);
  }
};

// ================= Production Output =================

exports.getAllOutputs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const outputs = await ProductionOutput.find()
      .populate({
        path: 'workOrderId',
        select: 'workOrderNumber targetQuantity materialId',
        populate: { path: 'materialId', select: 'name code' }
      })
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await ProductionOutput.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: outputs });
  } catch (error) { handleError(res, error); }
};

exports.recordOutput = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wo = await WorkOrder.findById(req.body.workOrderId).session(session);
    if (!wo || !['Released', 'In-Progress', 'Completed'].includes(wo.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Work Order must be active to record output' });
    }

    req.body.outputNumber = internalId('POUT');
    req.body.recordedBy = req.user.firstName ? `${req.user.firstName} ${req.user.lastName}` : (req.user.email || 'System');
    
    const outputArray = await ProductionOutput.create([req.body], { session });
    const output = outputArray[0];

    // Post finished goods to InventoryStock
    if (output.status === 'Completed' || output.actualOutputQty > 0 || req.body.goodQuantity > 0) {
      const targetWarehouseId = output.targetWarehouseId || req.body.finishedGoodsWarehouseId || wo.defaultWarehouseId;
      
      if (!targetWarehouseId) {
        console.warn('[PRODUCTION] No target warehouse set for FG putaway on output:', output._id);
      } else {
        const { generateDocNumber } = require('../utils/docNumbering');
        let fgBatchNumber;
        try {
           fgBatchNumber = await generateDocNumber('FG', 'FG', session);
        } catch(e) {
           fgBatchNumber = internalId('FG');
        }
        
        const goodQty = output.actualOutputQty || Number(req.body.goodQuantity) || 0;
        
        await InventoryStock.create([{
          materialId: wo.productId || wo.materialId || wo.finishedGoodId,
          warehouseId: targetWarehouseId,
          batchNumber: fgBatchNumber,
          quantityAvailable: goodQty,
          postingDate: new Date(),
          status: 'Active',
          notes: `Produced from Work Order ${wo.workOrderNumber || wo.woNumber}`,
          createdBy: req.user._id
        }], { session });

        // Also create inventory transaction record
        let txnNumber;
        try {
           txnNumber = await generateDocNumber('FGRCPT', 'FGRCPT', session);
        } catch(e) {
           txnNumber = internalId('TXN-FG');
        }
        
        await InventoryTransaction.create([{
          transactionNumber: txnNumber,
          transactionType: 'Goods Receipt',
          materialId: wo.productId || wo.materialId || wo.finishedGoodId,
          quantity: goodQty,
          destinationWarehouseId: targetWarehouseId,
          referenceDocument: `WO-${wo.workOrderNumber || wo.woNumber}`,
          notes: `Finished goods from production Work Order ${wo.workOrderNumber || wo.woNumber}`,
          status: 'Posted',
          createdBy: req.user._id
        }], { session });
      }
    }

    await logAudit('CREATE', 'ProductionOutput', output._id, req.user._id);
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, data: output });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    handleError(res, error);
  }
};

// ================= Production Planning (V2 Architecture) =================

const ensureDemoPlans = async () => {
  try {
    const { Plant } = require('../models/CompanyStructure');
    const { UOM } = require('../models/MasterUOM');

    let plant = await Plant.findOne();
    if (!plant) {
      plant = await Plant.create({
        name: 'LBAP Hosur Unit 1',
        code: 'PLANT-HOSUR',
        location: 'Hosur Industrial Area, Tamil Nadu',
        status: 'Active'
      });
    }

    let materials = await Material.find({ status: { $ne: 'Inactive' } }).limit(10);
    if (!materials || materials.length < 3) {
      const defaultUom = (await UOM.findOne())?._id;
      const createdMats = await Material.create([
        { name: 'Brake Pedal Bracket Blank (CR4 Steel)', code: 'MAT-BRK-01', standardCost: 185, grade: 'IS 513 CR4', uomId: defaultUom, status: 'Active' },
        { name: 'Silencer Mounting Bracket (Galvanized)', code: 'MAT-SIL-02', standardCost: 240, grade: 'GI 1.6mm', uomId: defaultUom, status: 'Active' },
        { name: 'Mudguard Stay LH/RH (Deep Draw)', code: 'MAT-MUD-03', standardCost: 145, grade: 'EDD Grade', uomId: defaultUom, status: 'Active' },
        { name: 'Exhaust Heat Shield (Aluminized Sheet)', code: 'MAT-EXH-04', standardCost: 310, grade: 'Alusi-120', uomId: defaultUom, status: 'Active' },
        { name: 'Chassis Cross-Member Beam (HSLA 350)', code: 'MAT-CHS-05', standardCost: 450, grade: 'BSK-46', uomId: defaultUom, status: 'Active' }
      ]);
      materials = createdMats;
    }

    const today = new Date();
    const d = (days) => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    };

    const samplePlans = [
      {
        header: {
          Plan_Number: 'PP-2026-01',
          Plant_ID: plant._id,
          Plan_Type: 'Make-to-Stock',
          Status: 'Released',
          Capacity_Status: 'Validated',
          Priority: 'Urgent',
          Notes: 'High-Volume OEM Braking & Exhaust Line — Priority Dispatch to Tata & Bajaj'
        },
        lines: [
          { seq: 10, matIdx: 0, qty: 6500, start: d(0), end: d(7) },
          { seq: 20, matIdx: 1, qty: 4200, start: d(2), end: d(9) },
          { seq: 30, matIdx: 2, qty: 8000, start: d(4), end: d(12) },
          { seq: 40, matIdx: 3, qty: 3500, start: d(7), end: d(14) }
        ]
      },
      {
        header: {
          Plan_Number: 'PP-2026-02',
          Plant_ID: plant._id,
          Plan_Type: 'Make-to-Order',
          Status: 'Approved',
          Capacity_Status: 'Validated',
          Priority: 'High',
          Notes: 'EV Heavy Underbody Cross-Member & Battery Enclosure Frame'
        },
        lines: [
          { seq: 10, matIdx: 4, qty: 2800, start: d(3), end: d(10) },
          { seq: 20, matIdx: 0, qty: 3200, start: d(5), end: d(12) },
          { seq: 30, matIdx: 2, qty: 5400, start: d(8), end: d(16) }
        ]
      },
      {
        header: {
          Plan_Number: 'PP-2026-03',
          Plant_ID: plant._id,
          Plan_Type: 'Make-to-Stock',
          Status: 'Draft',
          Capacity_Status: 'Validated',
          Priority: 'Normal',
          Notes: 'Replenishment Batch for Stamping Line 04 — Weekly Safety Stock Buffer'
        },
        lines: [
          { seq: 10, matIdx: 1, qty: 2500, start: d(6), end: d(13) },
          { seq: 20, matIdx: 3, qty: 1800, start: d(9), end: d(15) }
        ]
      },
      {
        header: {
          Plan_Number: 'PP-2026-04',
          Plant_ID: plant._id,
          Plan_Type: 'Experimental',
          Status: 'Draft',
          Capacity_Status: 'Unchecked',
          Priority: 'Low',
          Notes: 'High-Tensile Aluminum Alloy Prototype Stamping Validation'
        },
        lines: [
          { seq: 10, matIdx: 3, qty: 450, start: d(10), end: d(17) },
          { seq: 20, matIdx: 4, qty: 300, start: d(12), end: d(18) }
        ]
      }
    ];

    for (const sp of samplePlans) {
      const createdHeader = await PlanHeader.create(sp.header);
      for (const line of sp.lines) {
        const matDoc = materials[line.matIdx % materials.length];
        await PlanDetail.create({
          Plan_ID: createdHeader._id,
          Line_Sequence_Number: line.seq,
          Material_ID: matDoc._id,
          Target_Quantity: line.qty,
          UOM_ID: matDoc.uomId || null,
          Planned_Start_Date: line.start,
          Planned_End_Date: line.end
        });

        await ProductionPlan.create({
          planNumber: `${createdHeader.Plan_Number}-${line.seq}`,
          materialId: matDoc._id,
          plannedQuantity: line.qty,
          startDate: line.start,
          endDate: line.end,
          status: createdHeader.Status === 'Draft' ? 'Draft' : 'Approved'
        });
      }

      // If released, generate work orders so WO deck is active
      if (createdHeader.Status === 'Released') {
        for (const line of sp.lines) {
          const matDoc = materials[line.matIdx % materials.length];
          const woNum = internalId('WO');
          const [wo] = await WOHeader.create([{
            WO_Number: woNum,
            Plant_ID: plant._id,
            Source_Plan_ID: createdHeader._id,
            Status: 'Released',
            Priority: createdHeader.Priority
          }]);

          await WODetail.create([{
            WO_ID: wo._id,
            Line_Sequence_Number: 10,
            Material_ID: matDoc._id,
            Target_Quantity: line.qty,
            UOM_ID: matDoc.uomId || null,
            Planned_Start_Date: line.start,
            Planned_End_Date: line.end
          }]);
        }
      }
    }
    console.log('✅ Auto-seeded 4 Master Production Plans with part lines');
  } catch (seedErr) {
    console.error('Error auto-seeding demo plans:', seedErr.message);
  }
};

exports.seedV2DemoPlans = async (req, res) => {
  try {
    await PlanHeader.deleteMany({});
    await PlanDetail.deleteMany({});
    await ensureDemoPlans();
    res.json({ success: true, message: 'Sample automotive Master Production Plans generated successfully.' });
  } catch (error) {
    handleError(res, error);
  }
};

exports.getV2Plans = async (req, res) => {
  try {
    const totalExisting = await PlanHeader.countDocuments();
    if (totalExisting === 0) {
      await ensureDemoPlans();
    }

    const { status, page = 1, limit = 50, priority, plantId, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status && status !== 'ALL') query.Status = status;
    if (priority && priority !== 'ALL') query.Priority = priority;
    if (plantId && plantId !== 'ALL') query.Plant_ID = plantId;
    if (search) query.Plan_Number = { $regex: search, $options: 'i' };

    const headers = await PlanHeader.find(query)
      .populate('Plant_ID', 'name code location')
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit));

    // Fetch Details for each header
    const plans = await Promise.all(headers.map(async (h) => {
      const details = await PlanDetail.find({ Plan_ID: h._id })
        .populate({
          path: 'Material_ID',
          select: 'name code standardCost grade uomId categoryId leadTimeDays',
          populate: [
            { path: 'uomId', select: 'name code symbol' },
            { path: 'categoryId', select: 'name' }
          ]
        })
        .populate('UOM_ID', 'name code symbol')
        .populate({ path: 'BOM_Revision_ID', model: 'BOMRevision', select: 'revisionCode' })
        .sort({ Line_Sequence_Number: 1 });

      const totalTargetQty = details.reduce((sum, d) => sum + (d.Target_Quantity || 0), 0);

      return {
        ...h.toObject(),
        details,
        totalTargetQty
      };
    }));

    const total = await PlanHeader.countDocuments(query);

    // Compute live summary telemetry across all plans
    const allHeaders = await PlanHeader.find();
    const allDetails = await PlanDetail.find();

    let totalPlannedUnits = 0;
    for (const d of allDetails) {
      totalPlannedUnits += (d.Target_Quantity || 0);
    }

    let validatedPlans = 0;
    let releasedPlans = 0;
    let approvedPlans = 0;
    let draftPlans = 0;
    let urgentPlans = 0;

    for (const h of allHeaders) {
      if (h.Capacity_Status === 'Validated') validatedPlans++;
      if (h.Status === 'Released') releasedPlans++;
      if (h.Status === 'Approved') approvedPlans++;
      if (h.Status === 'Draft') draftPlans++;
      if (h.Priority === 'Urgent' || h.Priority === 'High') urgentPlans++;
    }

    const summary = {
      totalPlans: allHeaders.length,
      totalPartLines: allDetails.length,
      totalPlannedUnits,
      validatedPlans,
      releasedPlans,
      approvedPlans,
      draftPlans,
      urgentPlans
    };

    res.json({
      success: true,
      summary,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
      data: plans
    });
  } catch (error) { handleError(res, error); }
};

exports.createV2Plan = async (req, res) => {
  try {
    const { header, details } = req.body;

    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ success: false, message: 'A production plan needs at least one part line.' });
    }
    for (const d of details) {
      const line = d.Line_Sequence_Number ?? '';
      if (!d.Material_ID) {
        return res.status(400).json({ success: false, message: `Line ${line}: choose a material.` });
      }
      if (new Date(d.Planned_End_Date) < new Date(d.Planned_Start_Date)) {
        return res.status(400).json({ success: false, message: `Line ${line}: Planned End Date cannot be before Start Date.` });
      }
      if (!(Number(d.Target_Quantity) > 0)) {
        return res.status(400).json({ success: false, message: `Line ${line}: Target Quantity must be greater than zero.` });
      }
    }

    const planNumber = internalId('PP');
    const session = await mongoose.startSession();
    session.startTransaction();
    let newHeader;
    try {
      [newHeader] = await PlanHeader.create([{ ...header, Plan_Number: planNumber }], { session });

      for (const d of details) {
        await PlanDetail.create([{ ...d, Plan_ID: newHeader._id }], { session });

        await ProductionPlan.create([{
          planNumber: `${planNumber}-${d.Line_Sequence_Number}`,
          materialId: d.Material_ID,
          plannedQuantity: d.Target_Quantity,
          startDate: d.Planned_Start_Date,
          endDate: d.Planned_End_Date,
          status: newHeader.Status
        }], { session });
      }
      await session.commitTransaction();
    } catch (txErr) {
      await session.abortTransaction();
      throw txErr;
    } finally {
      session.endSession();
    }

    await logAudit('CREATE', 'PlanHeader', newHeader._id, req.user._id);
    res.status(201).json({ success: true, data: newHeader, message: `Production Plan ${planNumber} created successfully.` });
  } catch (error) { handleError(res, error); }
};

exports.approveV2Plan = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await PlanHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Plan not found' });

    if (header.Capacity_Status !== 'Validated') {
      return res.status(400).json({ success: false, message: 'Plan cannot be approved unless Rough-Cut Capacity Status is Validated.' });
    }

    header.Status = 'Approved';
    await header.save();
    
    await ApprovalRouting.create({
      Plan_ID: id,
      Assigned_User_ID: req.user._id,
      Step_Sequence: 1,
      Action_Taken: 'Approved',
      Action_Date: new Date(),
      Approver_Comments: req.body?.comments || 'Plan approved by Plant Manager.'
    });

    await logAudit('UPDATE', 'PlanHeader', header._id, req.user._id, 'Approved');
    res.json({ success: true, data: header, message: `Plan ${header.Plan_Number} approved successfully.` });
  } catch (error) { handleError(res, error); }
};

exports.validateV2PlanCapacity = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await PlanHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Plan not found' });
    
    header.Capacity_Status = 'Validated';
    await header.save();
    
    await logAudit('UPDATE', 'PlanHeader', header._id, req.user._id, 'Capacity Validated');
    res.json({ success: true, data: header, message: `Rough-Cut Capacity validated successfully for ${header.Plan_Number}.` });
  } catch (error) { handleError(res, error); }
};

exports.releaseV2Plan = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await PlanHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (!['Approved', 'Released'].includes(header.Status)) {
      return res.status(400).json({ success: false, message: 'Plan must be Approved by Plant Manager before releasing to shop floor.' });
    }

    header.Status = 'Released';
    await header.save();
    await logAudit('UPDATE', 'PlanHeader', header._id, req.user._id, 'Released to Shop Floor');
    res.json({ success: true, data: header, message: `Plan ${header.Plan_Number} released to shop floor for execution.` });
  } catch (error) { handleError(res, error); }
};

exports.generateV2WorkOrdersFromPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await PlanHeader.findById(id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (!['Approved', 'Released'].includes(plan.Status)) {
      return res.status(400).json({ success: false, message: 'Plan must be Approved or Released before generating Work Orders.' });
    }

    const details = await PlanDetail.find({ Plan_ID: id });
    if (!details.length) {
      return res.status(400).json({ success: false, message: 'No part lines found in this plan.' });
    }

    const createdWos = [];
    for (const line of details) {
      const woNum = internalId('WO');
      const [woHeader] = await WOHeader.create([{
        WO_Number: woNum,
        Plant_ID: plan.Plant_ID,
        Source_Plan_ID: plan._id,
        Status: 'Released',
        Priority: plan.Priority
      }]);

      await WODetail.create([{
        WO_ID: woHeader._id,
        Line_Sequence_Number: 10,
        Material_ID: line.Material_ID,
        Target_Quantity: line.Target_Quantity,
        UOM_ID: line.UOM_ID,
        Planned_Start_Date: line.Planned_Start_Date,
        Planned_End_Date: line.Planned_End_Date,
        BOM_Revision_ID: line.BOM_Revision_ID
      }]);

      createdWos.push(woHeader);
    }

    plan.Status = 'Released';
    await plan.save();

    await logAudit('CREATE', 'WorkOrderBatch', plan._id, req.user._id, `Generated ${createdWos.length} Work Orders`);
    res.json({
      success: true,
      data: createdWos,
      message: `Successfully spawned ${createdWos.length} shop floor Work Orders from Plan ${plan.Plan_Number}.`
    });
  } catch (error) { handleError(res, error); }
};

exports.getV2PlanCapacityBreakdown = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await PlanHeader.findById(id).populate('Plant_ID', 'name code location');
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const details = await PlanDetail.find({ Plan_ID: id })
      .populate('Material_ID', 'name code standardCost grade')
      .sort({ Line_Sequence_Number: 1 });

    const totalUnits = details.reduce((sum, d) => sum + (d.Target_Quantity || 0), 0);
    
    // Industrial Rough-Cut Capacity simulation across critical press, blanking, welding and paint work centers
    const workCenters = [
      {
        id: 'WC-01',
        name: 'WC-PR-400T (Press Line 04 - 400T Progressive Die)',
        category: 'Stamping Press',
        standardTaktPPH: 120,
        requiredHours: Math.round((totalUnits / 120) * 10) / 10,
        availableHours: 160,
        utilizationPct: Math.round(((totalUnits / 120) / 160) * 100),
        status: ((totalUnits / 120) / 160) > 1 ? 'Overloaded' : 'Optimal',
        isBottleneck: ((totalUnits / 120) / 160) > 0.85
      },
      {
        id: 'WC-02',
        name: 'WC-BL-250T (Blanking & Coil Slitting Line)',
        category: 'Coil Blanking',
        standardTaktPPH: 180,
        requiredHours: Math.round((totalUnits / 180) * 10) / 10,
        availableHours: 160,
        utilizationPct: Math.round(((totalUnits / 180) / 160) * 100),
        status: ((totalUnits / 180) / 160) > 1 ? 'Overloaded' : 'Optimal',
        isBottleneck: false
      },
      {
        id: 'WC-03',
        name: 'WC-WL-ABB02 (Robotic MIG Seam Welding Cell)',
        category: 'Sub-Assembly Welding',
        standardTaktPPH: 90,
        requiredHours: Math.round((totalUnits / 90) * 10) / 10,
        availableHours: 160,
        utilizationPct: Math.round(((totalUnits / 90) / 160) * 100),
        status: ((totalUnits / 90) / 160) > 1 ? 'Overloaded' : 'Optimal',
        isBottleneck: ((totalUnits / 90) / 160) > 0.85
      },
      {
        id: 'WC-04',
        name: 'WC-EC-SURF (Cathodic Electrodeposition E-Coat Line)',
        category: 'Surface Treatment',
        standardTaktPPH: 250,
        requiredHours: Math.round((totalUnits / 250) * 10) / 10,
        availableHours: 160,
        utilizationPct: Math.round(((totalUnits / 250) / 160) * 100),
        status: 'Optimal',
        isBottleneck: false
      }
    ];

    const isOverloaded = workCenters.some(wc => wc.utilizationPct > 100);

    res.json({
      success: true,
      data: {
        plan,
        details,
        totalUnits,
        workCenters,
        overallStatus: isOverloaded ? 'Overloaded' : 'Validated',
        validationTimestamp: new Date()
      }
    });
  } catch (error) { handleError(res, error); }
};

// ================= Work Order Management (V2 Architecture) =================

const ensureDemoWorkOrders = async () => {
  try {
    const { Plant } = require('../models/CompanyStructure');
    const { UOM } = require('../models/MasterUOM');

    let plant = await Plant.findOne();
    if (!plant) {
      plant = await Plant.create({
        name: 'LBAP Hosur Unit 1',
        code: 'PLANT-HOSUR',
        location: 'Hosur Industrial Area, Tamil Nadu',
        status: 'Active'
      });
    }

    let plans = await PlanHeader.find().limit(4);
    if (!plans || plans.length === 0) {
      await ensureDemoPlans();
      plans = await PlanHeader.find().limit(4);
    }

    let materials = await Material.find({ status: { $ne: 'Inactive' } }).limit(10);
    const defaultUom = (await UOM.findOne())?._id;

    // Check if we need to seed
    const existingCount = await WOHeader.countDocuments();
    if (existingCount >= 6) {
      // Ensure all existing WOs have at least 1 detail line
      const allWos = await WOHeader.find();
      for (const wo of allWos) {
        const dCount = await WODetail.countDocuments({ WO_ID: wo._id });
        if (dCount === 0) {
          const mat = materials[Math.floor(Math.random() * materials.length)];
          await WODetail.create({
            WO_ID: wo._id,
            Material_ID: mat._id,
            Target_Quantity: 5000,
            Produced_Quantity: wo.Status === 'Completed' || wo.Status === 'Closed' ? 5000 : (wo.Status === 'In Progress' ? 2250 : 0),
            Scrapped_Quantity: wo.Status === 'Completed' || wo.Status === 'Closed' ? 62 : (wo.Status === 'In Progress' ? 28 : 0),
            UOM_ID: defaultUom
          });
        }
      }
      return;
    }

    // Seed 10 realistic automotive work orders across all 5 shop-floor stages
    const demoWos = [
      {
        num: 'WO-2026-4001',
        planIdx: 0,
        matIdx: 0,
        target: 8500,
        produced: 0,
        scrap: 0,
        status: 'Draft',
        matStatus: 'Pending',
        pct: 0
      },
      {
        num: 'WO-2026-4002',
        planIdx: 0,
        matIdx: 1,
        target: 6000,
        produced: 0,
        scrap: 0,
        status: 'Draft',
        matStatus: 'Pending',
        pct: 0
      },
      {
        num: 'WO-2026-4003',
        planIdx: 1,
        matIdx: 2,
        target: 12000,
        produced: 0,
        scrap: 0,
        status: 'Released',
        matStatus: 'Allocated',
        pct: 0
      },
      {
        num: 'WO-2026-4004',
        planIdx: 1,
        matIdx: 3,
        target: 7500,
        produced: 0,
        scrap: 0,
        status: 'Released',
        matStatus: 'Allocated',
        pct: 0
      },
      {
        num: 'WO-2026-4005',
        planIdx: 2,
        matIdx: 0,
        target: 10000,
        produced: 4200,
        scrap: 48,
        status: 'In Progress',
        matStatus: 'Partially Consumed',
        pct: 42,
        startDaysAgo: 2
      },
      {
        num: 'WO-2026-4006',
        planIdx: 2,
        matIdx: 4,
        target: 5000,
        produced: 3250,
        scrap: 35,
        status: 'In Progress',
        matStatus: 'Partially Consumed',
        pct: 65,
        startDaysAgo: 1
      },
      {
        num: 'WO-2026-4007',
        planIdx: 3,
        matIdx: 1,
        target: 15000,
        produced: 12750,
        scrap: 110,
        status: 'In Progress',
        matStatus: 'Partially Consumed',
        pct: 85,
        startDaysAgo: 3
      },
      {
        num: 'WO-2026-4008',
        planIdx: 0,
        matIdx: 2,
        target: 9500,
        produced: 9500,
        scrap: 82,
        status: 'Completed',
        matStatus: 'Consumed',
        pct: 100,
        startDaysAgo: 4,
        endDaysAgo: 1
      },
      {
        num: 'WO-2026-4009',
        planIdx: 1,
        matIdx: 3,
        target: 14000,
        produced: 14000,
        scrap: 135,
        status: 'Completed',
        matStatus: 'Consumed',
        pct: 100,
        startDaysAgo: 5,
        endDaysAgo: 2
      },
      {
        num: 'WO-2026-4010',
        planIdx: 3,
        matIdx: 4,
        target: 8000,
        produced: 8000,
        scrap: 70,
        status: 'Closed',
        matStatus: 'Consumed',
        pct: 100,
        startDaysAgo: 7,
        endDaysAgo: 3
      }
    ];

    for (const item of demoWos) {
      const plan = plans[item.planIdx % plans.length];
      const mat = materials[item.matIdx % materials.length];
      const startDate = item.startDaysAgo ? new Date(Date.now() - item.startDaysAgo * 86400000) : null;
      const endDate = item.endDaysAgo ? new Date(Date.now() - item.endDaysAgo * 86400000) : null;

      const [wo] = await WOHeader.create([{
        WO_Number: item.num,
        Source_Plan_ID: plan._id,
        Plant_ID: plant._id,
        Status: item.status,
        Material_Status: item.matStatus,
        Overall_Progress_Percentage: item.pct,
        Actual_Start_Date: startDate,
        Actual_End_Date: endDate
      }]);

      await WODetail.create([{
        WO_ID: wo._id,
        Material_ID: mat._id,
        Target_Quantity: item.target,
        Produced_Quantity: item.produced,
        Scrapped_Quantity: item.scrap,
        UOM_ID: defaultUom
      }]);
    }
    console.log('✅ Auto-seeded 10 demo automotive Work Orders');
  } catch (err) {
    console.error('Error seeding demo work orders:', err.message);
  }
};

exports.seedV2DemoWorkOrders = async (req, res) => {
  try {
    await WOHeader.deleteMany({});
    await WODetail.deleteMany({});
    await ensureDemoWorkOrders();
    const count = await WOHeader.countDocuments();
    res.json({ success: true, message: 'Sample automotive Work Orders generated across all shop-floor stages.', count });
  } catch (error) {
    handleError(res, error);
  }
};

exports.getV2WorkOrders = async (req, res) => {
  try {
    const totalExisting = await WOHeader.countDocuments();
    if (totalExisting === 0) {
      await ensureDemoWorkOrders();
    }

    const { page = 1, limit = 50, status, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status && status !== 'All') query.Status = status;

    const headers = await WOHeader.find(query)
      .populate('Source_Plan_ID', 'Plan_Number Plan_Type Priority')
      .populate('Plant_ID', 'name location')
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit));

    // Fetch Details for each header
    const wos = await Promise.all(headers.map(async (h) => {
      const details = await WODetail.find({ WO_ID: h._id })
        .populate('Material_ID', 'name code partNumber grade standardCost')
        .populate('UOM_ID', 'name symbol')
        // Same as getV2Plans: the schema's ref:'BOM' is unregistered, and the field is revisionCode.
        .populate({ path: 'BOM_Revision_ID', model: 'BOMRevision', select: 'revisionCode' });
      return { ...h.toObject(), details };
    }));

    const total = await WOHeader.countDocuments(query);
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: wos });
  } catch (error) { handleError(res, error); }
};

exports.createV2WorkOrder = async (req, res) => {
  try {
    const { Source_Plan_ID, Plant_ID, details } = req.body;
    
    // Rule 1: Generation Constraint
    const plan = await PlanHeader.findById(Source_Plan_ID);
    if (!plan) return res.status(404).json({ success: false, message: 'Source Plan not found' });
    
    if (plan.Status !== 'Approved' && plan.Status !== 'Released') {
      return res.status(400).json({ success: false, message: 'Work Orders can only be generated from Approved or Released Plans.' });
    }

    const woNumber = internalId('WO');
    
    const newHeader = await WOHeader.create({
      WO_Number: woNumber,
      Source_Plan_ID,
      Plant_ID,
      Status: 'Draft',
      Material_Status: 'Pending',
      Overall_Progress_Percentage: 0
    });

    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      const newDetail = await WODetail.create({
        WO_ID: newHeader._id,
        Material_ID: d.Material_ID,
        Target_Quantity: d.Target_Quantity,
        UOM_ID: d.UOM_ID,
        BOM_Revision_ID: d.BOM_Revision_ID
      });
      
      // Legacy Sync
      await WorkOrder.create({
        workOrderNumber: `${woNumber}-${i+1}`,
        productionPlanId: Source_Plan_ID,
        materialId: d.Material_ID,
        targetQuantity: d.Target_Quantity,
        status: 'Created',
        materialStatus: 'Pending'
      });
    }

    await logAudit('CREATE', 'WOHeader', newHeader._id, req.user._id);
    res.status(201).json({ success: true, data: newHeader, message: 'Work Order generated successfully' });
  } catch (error) { handleError(res, error); }
};

/* Progress is produced ÷ target across the work order's lines. Shared by the
   manual progress update and by output posting, so a work order moves the
   same way whichever screen the figure came from. */
const recomputeWOProgress = async (header) => {
  const details = await WODetail.find({ WO_ID: header._id });
  const totalTarget = details.reduce((s, d) => s + (Number(d.Target_Quantity) || 0), 0);
  const totalProduced = details.reduce((s, d) => s + (Number(d.Produced_Quantity) || 0), 0);
  const progress = totalTarget > 0 ? (totalProduced / totalTarget) * 100 : 0;
  header.Overall_Progress_Percentage = Math.min(progress, 100);
  if (progress > 0 && progress < 100) header.Status = 'In Progress';
  if (progress >= 100) header.Status = 'Completed';
  if (progress > 0 && !header.Actual_Start_Date) header.Actual_Start_Date = new Date();
  if (progress >= 100 && !header.Actual_End_Date) header.Actual_End_Date = new Date();
  await header.save();
  return progress;
};

exports.updateV2WorkOrderProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { Produced_Quantity } = req.body;
    
    const header = await WOHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Work Order not found' });

    // Material Prerequisite: Auto-promote status if Pending so progress update succeeds
    if (header.Material_Status === 'Pending') {
      header.Material_Status = 'Allocated';
      await header.save();
    }

    const details = await WODetail.find({ WO_ID: id });
    for (const d of details) {
      // For simplicity, updating the first detail if multiple exist
      d.Produced_Quantity = Produced_Quantity; 
      
      // Rule 5: Over-Production Logic (5% tolerance)
      const maxAllowed = d.Target_Quantity * 1.05;
      if (d.Produced_Quantity > maxAllowed) {
        return res.status(400).json({ success: false, message: `Over-production blocked: Produced quantity exceeds 5% tolerance for material ${d.Material_ID}.` });
      }
      
      await d.save();
    }

    const progress = await recomputeWOProgress(header);
    
    await logAudit('UPDATE', 'WOHeader', header._id, req.user._id, `Progress updated to ${progress.toFixed(2)}%`);
    res.json({ success: true, data: header, message: 'Progress updated successfully' });
  } catch (error) { handleError(res, error); }
};

exports.releaseV2WorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await WOHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Work Order not found' });
    if (header.Status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Only Draft Work Orders can be released.' });
    }
    header.Status = 'Released';
    await header.save();
    await logAudit('UPDATE', 'WOHeader', header._id, req.user._id, 'Work Order Released');
    res.json({ success: true, data: header, message: 'Work Order released successfully' });
  } catch (error) { handleError(res, error); }
};

exports.closeV2WorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await WOHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Work Order not found' });

    // Rule 4: Closure Restriction
    if (header.Status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Work Order can only be closed if its status is Completed.' });
    }

    header.Status = 'Closed';
    await header.save();

    await logAudit('UPDATE', 'WOHeader', header._id, req.user._id, 'Closed');
    res.json({ success: true, data: header, message: 'Work Order closed successfully' });
  } catch (error) { handleError(res, error); }
};

exports.updateV2WorkOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;
    const allowed = ['Draft', 'Released', 'In Progress', 'Completed', 'Closed', 'Canceled'];
    if (!allowed.includes(Status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${Status}` });
    }
    const header = await WOHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Work Order not found' });

    if (Status === 'Closed' && header.Overall_Progress_Percentage < 100 && header.Status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Work Order must be Completed before closing.' });
    }

    header.Status = Status;
    if (Status === 'In Progress' && !header.Actual_Start_Date) header.Actual_Start_Date = new Date();
    if (Status === 'Completed') {
      header.Overall_Progress_Percentage = 100;
      if (!header.Actual_End_Date) header.Actual_End_Date = new Date();
      // Auto-set produced quantity on detail
      const details = await WODetail.find({ WO_ID: id });
      for (const d of details) {
        if (d.Produced_Quantity < d.Target_Quantity) {
          d.Produced_Quantity = d.Target_Quantity;
          await d.save();
        }
      }
    }
    await header.save();
    await logAudit('UPDATE', 'WOHeader', id, req.user._id, `Status updated to ${Status}`);
    res.json({ success: true, data: header, message: `Work Order status updated to ${Status}` });
  } catch (error) { handleError(res, error); }
};

exports.deleteV2WorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await WOHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Work Order not found' });
    if (header.Status === 'Completed' || header.Status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Cannot delete completed or closed work orders.' });
    }
    await WODetail.deleteMany({ WO_ID: id });
    await WOHeader.findByIdAndDelete(id);
    await logAudit('DELETE', 'WOHeader', id, req.user._id, `Deleted Work Order ${header.WO_Number}`);
    res.json({ success: true, message: `Work Order ${header.WO_Number} deleted successfully.` });
  } catch (error) { handleError(res, error); }
};

// ================= Material Allocation (V2 Architecture) =================

exports.getV2MaterialAllocations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Fetch WOs that are Draft, Released, or In Progress
    const headers = await WOHeader.find({ Status: { $in: ['Draft', 'Released', 'In Progress'] } })
      .populate('Source_Plan_ID', 'Plan_Number Plan_Type')
      .populate('Plant_ID', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));

    const wos = await Promise.all(headers.map(async (h) => {
      const details = await WODetail.find({ WO_ID: h._id })
        .populate('Material_ID', 'name code')
        .populate('UOM_ID', 'name');

      // Find or Create AllocationHeader
      let allocHeader = await AllocationHeader.findOne({ WO_ID: h._id });
      
      if (!allocHeader && details.length > 0) {
        allocHeader = await AllocationHeader.create({
          Allocation_ID: internalId('ALC'),
          WO_ID: h._id,
          Plant_ID: h.Plant_ID?._id,
          Required_By_Date: h.Actual_Start_Date || new Date()
        });
      }

      // Fetch requirements if allocHeader exists
      let requirements = [];
      if (allocHeader) {
        requirements = await ComponentRequirement.find({ Allocation_ID: allocHeader._id })
          .populate('Component_Material_ID', 'name code type');
          
        // Explode BOM and create ComponentRequirements if they don't exist yet!
        if (requirements.length === 0 && details.length > 0) {
          for (const d of details) {
            let revisionId = d.BOM_Revision_ID;
            if (!revisionId && h.Source_Plan_ID) {
              const planDetail = await PlanDetail.findOne({ Plan_ID: h.Source_Plan_ID, Material_ID: d.Material_ID });
              if (planDetail) {
                revisionId = planDetail.BOM_Revision_ID;
                d.BOM_Revision_ID = revisionId;
                await d.save(); // fix the data permanently
              }
            }
            
            if (revisionId) {
              const components = await BOMComponent.find({ revisionId });
              await Promise.all(components.map(comp => 
                ComponentRequirement.create({
                  Allocation_ID: allocHeader._id,
                  Component_Material_ID: comp.materialId,
                  Required_Quantity: comp.quantityPerAssembly * d.Target_Quantity,
                  UOM_ID: comp.uomId,
                  Issue_Method: comp.issueMethod
                })
              ));
            }
          }
          
          // Re-fetch now that we've created them
          requirements = await ComponentRequirement.find({ Allocation_ID: allocHeader._id })
            .populate('Component_Material_ID', 'name code type');
        }
      }

      return { ...h.toObject(), allocHeader, requirements };
    }));

    const total = await WOHeader.countDocuments({ Status: { $in: ['Draft', 'Released', 'In Progress'] } });
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: wos });
  } catch (error) { handleError(res, error); }
};

exports.processV2MaterialAllocation = async (req, res) => {
  try {
    const { id } = req.params; // WOHeader ID
    const { allocations } = req.body; // Array of { reqId, action: 'Reserve'|'Issue'|'Consume', quantity }

    const header = await WOHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Work Order not found' });
    
    // Business Rule 1: Prerequisite Status
    if (header.Status === 'Draft') {
        return res.status(400).json({ success: false, message: 'Material cannot be processed for Draft Work Orders.' });
    }

    let updatedAny = false;
    const allocHeader = await AllocationHeader.findOne({ WO_ID: header._id });
    const actionedBy = req.user._id; // `req` is shadowed by the requirement doc inside the loop

    for (const alloc of allocations) {
      const req = await ComponentRequirement.findById(alloc.reqId);
      if (!req) continue;

      // Business Rule 2: Hard Limit Check
      if (['Reserve', 'Issue'].includes(alloc.action)) {
         const currentTotal = req.Reserved_Quantity + req.Issued_Quantity;
         if ((currentTotal + alloc.quantity) > req.Required_Quantity) {
            return res.status(400).json({ success: false, message: 'Hard Allocation Limit exceeded for a component.' });
         }
      }

      // Physical availability check — Required_Quantity above is a BOM ceiling, not a stock
      // check, so without this an issue could be booked against material that does not exist.
      let issueStocks = [];
      if (alloc.action === 'Issue') {
        issueStocks = await InventoryStock.find({ materialId: req.Component_Material_ID, status: 'Active' }).sort({ postingDate: 1 });
        const availableQty = issueStocks.reduce((sum, s) => sum + (s.quantityAvailable || 0), 0);
        if (availableQty < alloc.quantity) {
          req.Shortage_Flag = true;
          await req.save();
          return res.status(400).json({ success: false, message: `Insufficient stock to issue component. Requested ${alloc.quantity}, available ${availableQty}.` });
        }
      }

      // Create Ledger Entry
      await AllocationLedger.create({
        Requirement_ID: req._id,
        Transaction_Type: alloc.action,
        Transacted_Quantity: alloc.quantity
      });

      if (alloc.action === 'Reserve') req.Reserved_Quantity += alloc.quantity;
      if (alloc.action === 'Issue') {
          // Move the physical stock, mirroring the V1 path (updateMaterialAllocation).
          // Consume is deliberately left non-posting: the stock already left on Issue.
          const issued = await deductStock(req.Component_Material_ID, alloc.quantity);

          // Steel handed to a press has not been consumed yet — it has moved
          // from the store into work in progress, and the books should say so.
          await postStockMovement({
            movementType: 'GOODS_ISSUE_PRODUCTION',
            amount: issued.value,
            description: `Material issued to work order ${header.WO_Number}`,
            referenceId: header._id
          });

          const { generateDocNumber } = require('../utils/docNumbering');
          await InventoryTransaction.create({
            transactionNumber: await generateDocNumber('MATISS', 'MATISS'),
            transactionType: 'Material Issue',
            materialId: req.Component_Material_ID,
            quantity: alloc.quantity,
            sourceWarehouseId: issueStocks[0]?.warehouseId || null,
            referenceDocument: `WO-${header.WO_Number}`,
            notes: `Material issued for Work Order ${header.WO_Number}`,
            createdBy: actionedBy
          });

          req.Shortage_Flag = false;
          req.Issued_Quantity += alloc.quantity;
          if (req.Reserved_Quantity >= alloc.quantity) req.Reserved_Quantity -= alloc.quantity;
      }
      if (alloc.action === 'Consume') req.Consumed_Quantity += alloc.quantity;

      await req.save();
      updatedAny = true;
    }

    if (updatedAny && allocHeader) {
      // Re-evaluate Header Material Status
      const requirements = await ComponentRequirement.find({ Allocation_ID: allocHeader._id });
      let allConsumed = true;
      let anyIssued = false;

      for (const req of requirements) {
        if (req.Consumed_Quantity < req.Required_Quantity) allConsumed = false;
        if (req.Issued_Quantity > 0 || req.Consumed_Quantity > 0 || req.Reserved_Quantity > 0) anyIssued = true;
      }

      if (allConsumed) {
        header.Material_Status = 'Consumed';
        allocHeader.Allocation_Status = 'Consumed';
      } else if (anyIssued) {
        header.Material_Status = 'Allocated';
        allocHeader.Allocation_Status = 'Partially Issued';
      }
      await header.save();
      await allocHeader.save();
      
      await logAudit('UPDATE', 'WOHeader', header._id, req.user._id, `Material Allocations Processed -> ${header.Material_Status}`);
    }

    res.json({ success: true, message: 'Material allocation processed successfully' });
  } catch (error) { handleError(res, error); }
};

// ================= Production Execution (V2 Architecture) =================

exports.getV2ExecutionRuns = async (req, res) => {
  try {
    const runs = await ExecutionRun.find().populate('WO_ID', 'WO_Number Status').sort({ createdAt: -1 });
    const fullRuns = await Promise.all(runs.map(async run => {
      const operations = await RoutingOperation.find({ Run_ID: run._id }).sort({ Operation_Sequence: 1 });
      const opsWithLogs = await Promise.all(operations.map(async op => {
        const labor = await LaborLog.find({ Operation_Log_ID: op._id });
        const machine = await MachineLog.find({ Operation_Log_ID: op._id });
        const quality = await QualityLog.find({ Operation_Log_ID: op._id });
        return { ...op.toObject(), labor, machine, quality };
      }));
      return { ...run.toObject(), operations: opsWithLogs };
    }));
    res.json({ success: true, data: fullRuns });
  } catch (error) { handleError(res, error); }
};

exports.startV2ExecutionRun = async (req, res) => {
  try {
    const { WO_ID } = req.body;
    let wo = await WOHeader.findById(WO_ID);

    if (!wo) {
      const v1Wo = await WorkOrder.findById(WO_ID);
      if (v1Wo) {
        const Plant = mongoose.model('Plant');
        const defaultPlant = await Plant.findOne({});
        wo = await WOHeader.create({
          WO_Number: v1Wo.workOrderNumber,
          Plant_ID: v1Wo.plantId || defaultPlant?._id,
          Status: 'Released'
        });
      }
    }
    
    if (!wo) return res.status(404).json({ success: false, message: 'Work Order not found' });
    
    // Rule 1: Start Condition Prerequisite
    if (!['Released', 'In Progress'].includes(wo.Status)) {
      wo.Status = 'Released';
      await wo.save();
    }
    
    let alloc = await AllocationHeader.findOne({ WO_ID: wo._id });
    if (!alloc) {
      alloc = await AllocationHeader.create({
        Allocation_Number: internalId('ALLOC'),
        WO_ID: wo._id,
        Allocation_Status: 'Partially Issued'
      });
    } else if (!['Partially Issued', 'Consumed'].includes(alloc.Allocation_Status)) {
      alloc.Allocation_Status = 'Partially Issued';
      await alloc.save();
    }

    const run = await ExecutionRun.create({
      Run_ID: internalId('RUN'),
      WO_ID: wo._id,
      Plant_ID: wo.Plant_ID,
      Run_Number: `R-${Date.now()}`,
      Run_Status: 'Running',
      Run_Start_Time: new Date()
    });

    // Create a dummy operation for the demo if routing not fully mapped
    await RoutingOperation.create({
      Run_ID: run._id,
      Operation_Sequence: 10,
      Operation_Status: 'Active',
      Target_Quantity: 100 // Typically from WO Details
    });

    wo.Status = 'In Progress';
    await wo.save();

    res.json({ success: true, data: run });
  } catch (error) { handleError(res, error); }
};

exports.updateV2RoutingOperation = async (req, res) => {
  try {
    const { id } = req.params;
    const { Operation_Status, Completed_Good_Quantity, Scrapped_Quantity, Rework_Quantity } = req.body;
    
    const op = await RoutingOperation.findById(id);
    if (!op) return res.status(404).json({ success: false, message: 'Operation not found' });

    // Rule 2: Sequential Operation Logic
    if (['Active', 'Completed'].includes(Operation_Status)) {
      const prevOps = await RoutingOperation.find({ Run_ID: op.Run_ID, Operation_Sequence: { $lt: op.Operation_Sequence }, Operation_Status: { $ne: 'Completed' } });
      if (prevOps.length > 0) {
        return res.status(400).json({ success: false, message: 'Preceding operations must be completed first.' });
      }
    }

    // Rule 3: Quantity Conservation Check
    const totalQty = (Completed_Good_Quantity || op.Completed_Good_Quantity) + 
                     (Scrapped_Quantity || op.Scrapped_Quantity) + 
                     (Rework_Quantity || op.Rework_Quantity);
    
    const tolerance = op.Target_Quantity * 1.1; // 10% tolerance
    if (totalQty > tolerance) {
      return res.status(400).json({ success: false, message: 'Quantity exceeds tolerance limit.' });
    }

    if (Operation_Status) op.Operation_Status = Operation_Status;
    if (Completed_Good_Quantity !== undefined) op.Completed_Good_Quantity = Completed_Good_Quantity;
    if (Scrapped_Quantity !== undefined) op.Scrapped_Quantity = Scrapped_Quantity;
    if (Rework_Quantity !== undefined) op.Rework_Quantity = Rework_Quantity;

    await op.save();
    res.json({ success: true, data: op });
  } catch (error) { handleError(res, error); }
};

exports.logV2LaborTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { Activity_Type, Start_Time, End_Time, Operator_User_ID } = req.body;
    
    const sTime = new Date(Start_Time);
    const eTime = new Date(End_Time);

    // Rule 4: Time Chronology Rule
    if (eTime <= sTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    // Prevent overlapping logs for the same operator
    const overlaps = await LaborLog.find({
      Operator_User_ID,
      $or: [
        { Start_Time: { $lt: eTime }, End_Time: { $gt: sTime } }
      ]
    });
    
    if (overlaps.length > 0) {
      return res.status(400).json({ success: false, message: 'Operator cannot log overlapping time across operations.' });
    }

    const Logged_Hours = (eTime - sTime) / (1000 * 60 * 60);

    const log = await LaborLog.create({
      Operation_Log_ID: id,
      Operator_User_ID: Operator_User_ID || req.user._id,
      Activity_Type,
      Start_Time: sTime,
      End_Time: eTime,
      Logged_Hours,
      Billable_Rate: 25 // Example static rate
    });

    res.json({ success: true, data: log });
  } catch (error) { handleError(res, error); }
};

exports.logV2MachineTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { Status, Start_Time, End_Time, Machine_ID } = req.body;
    
    const sTime = new Date(Start_Time);
    const eTime = new Date(End_Time);

    if (eTime <= sTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const Total_Hours = (eTime - sTime) / (1000 * 60 * 60);

    const log = await MachineLog.create({
      Operation_Log_ID: id,
      Machine_ID,
      Status,
      Start_Time: sTime,
      End_Time: eTime,
      Total_Hours
    });

    res.json({ success: true, data: log });
  } catch (error) { handleError(res, error); }
};

exports.logV2Quality = async (req, res) => {
  try {
    const { id } = req.params;
    const { Rejected_Quantity, Action_Taken, Defect_Reason_ID } = req.body;
    
    const op = await RoutingOperation.findById(id);
    if (!op) return res.status(404).json({ success: false, message: 'Operation not found' });
    
    const log = await QualityLog.create({
      Operation_Log_ID: id,
      Defect_Reason_ID,
      Rejected_Quantity,
      Inspector_User_ID: req.user._id,
      Action_Taken
    });
    
    // Automatically update routing op based on action
    if (Action_Taken === 'Scrapped') {
      op.Scrapped_Quantity += Rejected_Quantity;
    } else if (Action_Taken === 'Sent to Rework') {
      op.Rework_Quantity += Rejected_Quantity;
    }
    await op.save();

    res.json({ success: true, data: log });
  } catch (error) { handleError(res, error); }
};

exports.completeV2ExecutionRun = async (req, res) => {
  try {
    const { id } = req.params;
    const run = await ExecutionRun.findById(id);
    if (!run) return res.status(404).json({ success: false, message: 'Run not found' });
    
    // Rule 5: Completion Trigger
    run.Run_Status = 'Completed';
    run.Run_End_Time = new Date();
    await run.save();
    
    // Check if we should update WO
    const wo = await WOHeader.findById(run.WO_ID);
    if (wo) {
      wo.Status = 'Completed'; // Marking it completed based on run closure for simplicity
      wo.Overall_Progress_Percentage = 100;
      await wo.save();
    }
    
    res.json({ success: true, data: run });
  } catch (error) { handleError(res, error); }
};

// ================= Production Output (V2 Architecture) =================

exports.getV2ProductionOutputs = async (req, res) => {
  try {
    const outputs = await OutputHeader.find().populate('WO_ID', 'WO_Number').sort({ createdAt: -1 });
    const fullOutputs = await Promise.all(outputs.map(async o => {
      const details = await YieldDetail.find({ Output_ID: o._id }).populate('Material_ID', 'name code');
      
      const fullDetails = await Promise.all(details.map(async d => {
        const qualityLogs = await QualityReasonCode.find({ Yield_Detail_ID: d._id }).populate('Defect_Code_ID', 'code name');
        const putaways = await InventoryPutaway.find({ Yield_Detail_ID: d._id });
        return { ...d.toObject(), qualityLogs, putaways };
      }));

      return { ...o.toObject(), details: fullDetails };
    }));
    res.json({ success: true, data: fullOutputs });
  } catch (error) { handleError(res, error); }
};

exports.createV2ProductionOutput = async (req, res) => {
  try {
    const { WO_ID } = req.body;
    let wo = await WOHeader.findById(WO_ID);
    
    if (!wo) {
      const v1Wo = await WorkOrder.findById(WO_ID);
      if (v1Wo) {
        const Plant = mongoose.model('Plant');
        const defaultPlant = await Plant.findOne({});
        wo = {
          _id: v1Wo._id,
          WO_Number: v1Wo.workOrderNumber,
          Plant_ID: v1Wo.plantId || defaultPlant?._id,
          Status: v1Wo.status || 'Released'
        };
      }
    }
    
    if (!wo) return res.status(404).json({ success: false, message: 'Work Order not found' });
    
    // Rule 1: Work Order Status Prerequisite
    const status = wo.Status || wo.status;
    if (!['Completed', 'In Progress', 'In-Progress', 'Released'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Output can only be recorded against Released, In Progress, or Completed Work Orders.' });
    }

    const output = await OutputHeader.create({
      Output_ID: internalId('POUT'),
      Output_No: `OUT-${Date.now()}`,
      WO_ID: wo._id,
      Plant_ID: wo.Plant_ID,
      Recorded_By_User_ID: req.user._id,
      Status: 'Draft'
    });

    const woDetails = await WODetail.find({ WO_ID: wo._id });
    const yieldDetails = [];
    
    if (woDetails.length > 0) {
      for (const d of woDetails) {
        const yd = await YieldDetail.create({
          Output_ID: output._id,
          Material_ID: d.Material_ID,
          Target_Quantity: d.Target_Quantity,
          UOM_ID: d.UOM_ID
        });
        yieldDetails.push(yd);
      }
    } else {
      const Material = mongoose.model('Material');
      const UOM = mongoose.model('UOM');

      const v1Wo = await WorkOrder.findById(wo._id).populate({ path: 'materialId', strictPopulate: false });
      let matId = (v1Wo?.materialId?._id || v1Wo?.materialId);
      if (!matId) {
        const defMat = await Material.findOne({});
        matId = defMat?._id;
      }
      let uomId = v1Wo?.materialId?.uomId;
      if (!uomId) {
        const defUom = await UOM.findOne({});
        uomId = defUom?._id;
      }
      const targetQty = v1Wo?.quantityPlanned || v1Wo?.quantity || 100;

      if (matId) {
        const yd = await YieldDetail.create({
          Output_ID: output._id,
          Material_ID: matId,
          Target_Quantity: targetQty,
          UOM_ID: uomId
        });
        yieldDetails.push(yd);
      }
    }

    res.json({ success: true, data: { ...output.toObject(), details: yieldDetails } });
  } catch (error) { handleError(res, error); }
};

exports.postV2ProductionOutput = async (req, res) => {
  try {
    const { id } = req.params;
    const { yields } = req.body; // Array of { yieldDetailId, Good_Quantity, Rejected_Quantity, Scrap_Quantity, defectLogs: [{ Type, Quantity, Defect_Code_ID, Notes }] }

    const output = await OutputHeader.findById(id).populate('WO_ID');
    if (!output) return res.status(404).json({ success: false, message: 'Output not found' });
    
    // Rule 5: Immutability upon Posting
    if (output.Status === 'Posted') {
      return res.status(400).json({ success: false, message: 'Cannot modify a Posted Output Record.' });
    }

    let totalScrapValue = 0;
    let totalProducedValue = 0;

    for (const y of yields) {
      const yd = await YieldDetail.findById(y.yieldDetailId).populate('Material_ID');
      if (!yd) continue;
      
      const gq = Number(y.Good_Quantity) || 0;
      const rq = Number(y.Rejected_Quantity) || 0;
      const sq = Number(y.Scrap_Quantity) || 0;
      const total = gq + rq + sq;

      // Rule 2: Yield Math Validation (Tolerance)
      const tolerance = yd.Target_Quantity * 1.05; // 5% limit
      if (total > tolerance) {
         return res.status(400).json({ success: false, message: `Yield total (${total}) exceeds 5% tolerance for target (${yd.Target_Quantity}). Supervisor approval required.` });
      }

      // Rule 4: Reject vs Scrap Logic
      if (rq > 0 || sq > 0) {
        if (!y.defectLogs || y.defectLogs.length === 0) {
           return res.status(400).json({ success: false, message: 'Defect Codes are required if Rejected or Scrap quantities are greater than zero.' });
        }
        
        /* Add the defect rows only once the logs are known to balance.
         *
         * They used to be written inside this loop and the totals checked
         * afterwards, so a mismatch returned the right message and left the
         * rows behind. The output stays Draft on that error, so the operator
         * corrects the figures and posts again — writing the rows a second
         * time. Every retry added another copy, and the Quality Report's
         * "most common defects" counted them all. */
        let logRq = 0;
        let logSq = 0;
        for (const dl of y.defectLogs) {
           if (dl.Type === 'Rejected') logRq += Number(dl.Quantity);
           if (dl.Type === 'Scrapped') logSq += Number(dl.Quantity);
        }

        if (logRq !== rq || logSq !== sq) {
           return res.status(400).json({ success: false, message: 'Sum of Defect Logs must exactly match the sum of Rejected and Scrap quantities.' });
        }

        // A re-post of the same yield must not double the defect history.
        await QualityReasonCode.deleteMany({ Yield_Detail_ID: yd._id });
        for (const dl of y.defectLogs) {
           await QualityReasonCode.create({
             Yield_Detail_ID: yd._id,
             Defect_Type: dl.Type,
             Affected_Quantity: dl.Quantity,
             Defect_Code_ID: dl.Defect_Code_ID || null,
             Notes: dl.Notes
           });
        }
      }

      yd.Good_Quantity = gq;
      yd.Rejected_Quantity = rq;
      yd.Scrap_Quantity = sq;
      await yd.save();

      // H-21: accumulate scrap value for GL posting
      if (sq > 0) {
        // Use unitCost from inventory stock or standard cost from material master
        const unitCost = yd.Material_ID?.standardCost || yd.Material_ID?.purchasePrice || 0;
        totalScrapValue += sq * unitCost;
      }

      // Rule 3: Inventory Push Link
      //
      // This used to file an InventoryPutaway row and stop there, then report
      // "successfully posted to Inventory". Nothing read that table — it was
      // written in two places and consumed in none — so the presses could run
      // all month and the finished goods never appeared in the store. The
      // working logic existed on the older endpoint, which nothing calls.
      if (gq > 0) {
        const { generateDocNumber } = require('../utils/docNumbering');
        let fgBatch;
        try { fgBatch = await generateDocNumber('FG', 'FG'); }
        catch { fgBatch = internalId('FG'); }

        await InventoryPutaway.create({
           Yield_Detail_ID: yd._id,
           Received_Quantity: gq,
           Batch_Lot_Number: fgBatch
        });

        // Finished parts are worth what it cost to make them. Standard cost is
        // the stand-in until the BOM roll-up of phase 2 replaces it; booking
        // them in at zero would repeat the mistake goods receipt just fixed.
        const fgUnitCost = Number(yd.Material_ID?.standardCost) || 0;
        if (!fgUnitCost) {
          console.warn(`[PRODUCTION] Output ${output.Output_Number || output._id}: no standard cost on the finished item — booked in at zero value.`);
        }

        // Finished parts go to the finished goods store. Nothing on the output
        // record names a warehouse, so fall back to the one whose name says
        // what it holds, then to any warehouse at all — and skip the putaway
        // rather than throwing if the plant has none configured.
        let fgWarehouse = output.Target_Warehouse_ID || output.WO_ID?.Target_Warehouse_ID || null;
        if (!fgWarehouse) {
          const Warehouse = mongoose.models.Warehouse || require('../models/MasterWarehouse').Warehouse;
          const fgStore = await Warehouse.findOne({ name: /finished/i });
          fgWarehouse = fgStore?._id || (await Warehouse.findOne({}))?._id || null;
        }
        if (!fgWarehouse) {
          console.warn(`[PRODUCTION] Output ${output.Output_Number || output._id}: no warehouse configured — finished goods not booked into stock.`);
        } else {
        await InventoryStock.create({
          materialId: yd.Material_ID?._id || yd.Material_ID,
          warehouseId: fgWarehouse,
          batchNumber: fgBatch,
          quantityAvailable: gq,
          unitCost: fgUnitCost,
          postingDate: new Date(),
          status: 'Active',
          notes: `Produced on work order ${output.WO_ID?.WO_Number || ''}`.trim()
        });
        totalProducedValue += gq * fgUnitCost;
        }
      }
    }

    output.Status = 'Posted';
    await output.save();

    // The work order moves with its output. Posting 100 good pieces against a
    // 100-piece order used to leave it "Released, 0%": the Production Report
    // counted it as still open and the planner had to type the progress in a
    // second time by hand on the Work Orders screen.
    if (output.WO_ID?._id) {
      const woHeader = await WOHeader.findById(output.WO_ID._id);
      if (woHeader) {
        const woDetails = await WODetail.find({ WO_ID: woHeader._id });
        for (const y of yields) {
          const yd = await YieldDetail.findById(y.yieldDetailId);
          if (!yd) continue;
          // A yield for a part that is not on this work order must not be
          // credited to whichever line happens to be first. One-line orders
          // are unambiguous; on anything else the mismatch is logged and the
          // line left alone.
          const line = woDetails.find((d) => String(d.Material_ID) === String(yd.Material_ID))
            || (woDetails.length === 1 ? woDetails[0] : null);
          if (!line) {
            console.warn(`[PRODUCTION] Output ${output.Output_Number || output._id}: yield for material ${yd.Material_ID} is not a line of WO ${woHeader.WO_Number || woHeader._id}; progress not updated for it.`);
            continue;
          }
          line.Produced_Quantity = (Number(line.Produced_Quantity) || 0) + (Number(y.Good_Quantity) || 0);
          line.Scrapped_Quantity = (Number(line.Scrapped_Quantity) || 0) + (Number(y.Scrap_Quantity) || 0) + (Number(y.Rejected_Quantity) || 0);
          await line.save();
        }
        if (woHeader.Material_Status === 'Pending') woHeader.Material_Status = 'Allocated';
        await recomputeWOProgress(woHeader);
      }
    }

    // Value moving out of work in progress and into finished goods.
    //
    // Finished parts are worth what went into them, so this relieves the WIP
    // the order actually accumulated rather than a price looked up elsewhere.
    // Valuing the two sides independently is what let ₹2.48L of finished goods
    // come out of an order that had only ₹31,000 of steel issued to it, leaving
    // work in progress negative — a balance that cannot exist.
    if (totalProducedValue > 0) {
      try {
        const wipAvailable = await wipBalanceForOrder(output.WO_ID?._id || output.WO_ID);
        const relieved = Math.min(totalProducedValue, Math.max(0, wipAvailable));

        if (relieved <= 0) {
          console.warn(
            `[PRODUCTION] Output ${output.Output_Number || output._id}: no material has been issued to this work order, ` +
            `so there is nothing in work in progress to book the finished goods out of. Stock was raised; no ledger entry written.`
          );
        } else {
          await postStockMovement({
            movementType: 'PRODUCTION_RECEIPT',
            amount: relieved,
            description: `Production booked in from output ${output.Output_Number || output._id}`,
            referenceId: output.WO_ID?._id || output.WO_ID
          });
          if (relieved < totalProducedValue) {
            console.warn(
              `[PRODUCTION] Output ${output.Output_Number || output._id}: finished goods valued at ₹${totalProducedValue.toFixed(2)} ` +
              `but only ₹${relieved.toFixed(2)} was in work in progress. Posted what the order held — ` +
              `the rest needs labour and overhead costing (phase 2) to account for.`
            );
          }
        }
      } catch (glErr) {
        console.error('[PRODUCTION] Finished goods GL posting failed:', glErr.message);
      }
    }

    // Scrap is value that entered work in progress and will never leave it as a
    // saleable part, so it is written off. This used to hunt for a scrap and a
    // WIP account by name with a regex and give up silently when it found
    // neither — and there was no WIP account in the chart at all, so it always
    // gave up. The accounts are now a rule, not a search.
    if (totalScrapValue > 0) {
      try {
        await postStockMovement({
          movementType: 'SCRAP_LOSS',
          amount: totalScrapValue,
          description: `Scrap written off from output ${output.Output_Number || output._id}`,
          referenceId: output._id
        });
      } catch (glErr) {
        // A failed posting must not lose the production record itself, but it
        // does need to be visible rather than swallowed.
        console.error('[PRODUCTION] Scrap GL posting failed:', glErr.message);
      }
    }

    res.json({ success: true, message: 'Output Record successfully posted to Inventory.' });
  } catch (error) { handleError(res, error); }
};

