const { handleError } = require('../utils/errorHandler');
const { editable } = require('../utils/safeBody');
const { internalId } = require('../utils/internalId');
const { postStockMovement } = require('../services/stockPosting.service');
const DispatchPlan = require('../models/DispatchPlan');
const { DeliveryTracking, ShipmentTracking, DeliveryConfirmationHandover } = require('../models/DeliveryTracking');
const { SalesOrder, SOHeader, SOLineItem } = require('../models/SalesOrder');
const { DeliveryPlan, ShipmentSchedule, VehicleAssignment } = require('../models/DispatchPlanning');
const { DispatchExecution, PackingManagement, LoadingManagement, DispatchConfirmation } = require('../models/DispatchExecution');
const InventoryStock = require('../models/InventoryStock');
const { InventoryTransaction } = require('../models/InventoryTransaction');
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

// The dispatchexecutions collection still carries unique, NON-sparse indexes from an
// earlier schema generation (executionNumber_1, dispatchPlanId_1) alongside the current
// Exec_ID_1 / Exec_Number_1. A document that omits a legacy field counts as null against
// its index, and a seeded row already holds the null slot — so every execution we insert
// must carry the legacy names too, with a number proven unused (Date.now().slice(-6)
// repeats every ~16 minutes). The header schema is strict:false, so the legacy keys persist.
const newExecutionIdentity = async (planId) => {
  let execNum = internalId('DE');
  for (let attempt = 0; attempt < 10; attempt++) {
    const clash = await DispatchExecution.findOne({
      $or: [{ Exec_Number: execNum }, { Exec_ID: execNum }, { executionNumber: execNum }]
    }).select('_id').lean();
    if (!clash) break;
    execNum = `DE-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  return {
    Exec_ID: execNum,
    Exec_Number: execNum,
    executionNumber: execNum,
    Plan_ID: planId,
    dispatchPlanId: planId
  };
};

// A plan's Sales_Order_ID may point at either order book — createV2DeliveryPlan accepts
// both — but the schema ref names SalesOrder alone, so populate() silently resolves a V2
// SOHeader id to null and the row renders the "SO-Ref" placeholder. Resolve both books
// here and return a map keyed by id string, shaped like the old populate() projection.
const resolveSalesOrders = async (ids) => {
  const soIds = (ids || []).filter(Boolean);
  const byId = new Map();
  if (soIds.length === 0) return byId;

  const [legacyOrders, v2Orders] = await Promise.all([
    SalesOrder.find({ _id: { $in: soIds } }).select('orderNumber customerName status totalAmount').lean(),
    SOHeader.find({ _id: { $in: soIds } }).select('orderNumber status grandTotal customerId')
      .populate('customerId', 'name').lean()
  ]);
  legacyOrders.forEach(o => byId.set(o._id.toString(), o));
  v2Orders.forEach(o => byId.set(o._id.toString(), {
    _id:          o._id,
    orderNumber:  o.orderNumber,
    customerName: o.customerId?.name || '',
    status:       o.status,
    totalAmount:  o.grandTotal || 0
  }));
  return byId;
};

// ================= Dispatch Planning =================

exports.getAllPlans = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    
    const plans = await DispatchPlan.find()
      .populate('salesOrderId', 'orderNumber customerName expectedDeliveryDate')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await DispatchPlan.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: plans });
  } catch (error) { handleError(res, error); }
};

exports.createPlan = async (req, res) => {
  try {
    req.body.planNumber = internalId('DP');
    const plan = await DispatchPlan.create(req.body);
    await logAudit('CREATE', 'DispatchPlan', plan._id, req.user._id);
    res.status(201).json({ success: true, data: plan });
  } catch (error) { handleError(res, error); }
};

exports.updatePlan = async (req, res) => {
  try {
    // If scheduling is provided, update status
    if (req.body.shipmentSchedule && req.body.shipmentSchedule.isScheduled) {
      req.body.status = 'Scheduled';
    }
    // If vehicle is assigned, update status
    if (req.body.vehicleAssignment && req.body.vehicleAssignment.isAssigned) {
      req.body.status = 'Assigned';
    }

    const plan = await DispatchPlan.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    
    await logAudit('UPDATE', 'DispatchPlan', plan._id, req.user._id);
    res.json({ success: true, data: plan });
  } catch (error) { handleError(res, error); }
};

// ================= Dispatch Execution =================

exports.getAllExecutions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const executions = await DispatchExecution.find()
      .populate({
        path: 'dispatchPlanId',
        populate: { path: 'salesOrderId', select: 'orderNumber customerName' }
      })
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await DispatchExecution.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: executions });
  } catch (error) { handleError(res, error); }
};

exports.recordExecution = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Check if execution exists for this plan
    let execution = await DispatchExecution.findOne({ dispatchPlanId: req.body.dispatchPlanId }).session(session);

    if (!execution) {
      // Create new execution
      req.body.executionNumber = internalId('DE');
      const executions = await DispatchExecution.create([req.body], { session });
      execution = executions[0];
      await logAudit('CREATE', 'DispatchExecution', execution._id, req.user._id);
    } else {
      // Update existing
      execution = await DispatchExecution.findByIdAndUpdate(execution._id, req.body, { new: true, session });
      await logAudit('UPDATE', 'DispatchExecution', execution._id, req.user._id);
    }

    const wasDispatched = execution.overallStatus === 'Dispatched';

    // Auto update overallStatus based on inner statuses
    if (execution.dispatch && execution.dispatch.isConfirmed) execution.overallStatus = 'Dispatched';
    else if (execution.loading && execution.loading.status === 'Completed') execution.overallStatus = 'Loading';
    else if (execution.packing && execution.packing.status === 'Completed') execution.overallStatus = 'Packing';
    
    await execution.save({ session });

    // Deduct stock for each dispatched line only when newly dispatched
    if (execution.overallStatus === 'Dispatched' && !wasDispatched) {
      const { generateDocNumber } = require('../utils/docNumbering');
      const dispatch = execution.dispatch || req.body.dispatch || {};
      
      for (const dispatchLine of dispatch.lineItems || []) {
        if (!dispatchLine.materialId || !dispatchLine.dispatchedQuantity) continue;
        
        // Atomic FIFO deduction
        const stockBatches = await InventoryStock.find(
          { materialId: dispatchLine.materialId, warehouseId: dispatch.warehouseId, status: 'Active', quantityAvailable: { $gt: 0 } },
          null, { session }
        ).sort({ postingDate: 1 });
        
        let remaining = dispatchLine.dispatchedQuantity;
        for (const batch of stockBatches) {
          if (remaining <= 0) break;
          const deductFrom = Math.min(batch.quantityAvailable, remaining);
          remaining -= deductFrom;
          await InventoryStock.findOneAndUpdate(
            { _id: batch._id, quantityAvailable: { $gte: deductFrom } },
            { $inc: { quantityAvailable: -deductFrom } },
            { session }
          );
        }
        
        if (remaining > 0) {
          throw new Error(`Insufficient stock for dispatch: ${remaining} units short for material ${dispatchLine.materialId}`);
        }
        
        // Log inventory transaction
        let dispNumber = dispatch.dispatchNumber || execution.executionNumber || execution._id;
        let txnNum = internalId('DISP');
        try { txnNum = await generateDocNumber('DISP', 'DISP', session); } catch(e){}

        await InventoryTransaction.create([{
          transactionNumber: txnNum,
          transactionType: 'Material Issue',
          materialId: dispatchLine.materialId,
          quantity: dispatchLine.dispatchedQuantity,
          sourceWarehouseId: dispatch.warehouseId,
          referenceDocument: dispNumber,
          status: 'Posted',
          createdBy: req.user._id
        }], { session });
      }

      // auto-create a DeliveryTracking record if it doesn't exist
      const existingTrack = await DeliveryTracking.findOne({ dispatchExecutionId: execution._id }).session(session);
      if (!existingTrack) {
        await DeliveryTracking.create([{
          trackingNumber: internalId('TRK'),
          dispatchExecutionId: execution._id,
          currentLocation: 'Origin Facility',
          statusUpdates: [{ location: 'Origin Facility', status: 'Dispatched', remarks: 'Shipment has left the facility' }]
        }], { session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, data: execution });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    handleError(res, error);
  }
};

// ================= Delivery Tracking =================

exports.getAllTrackings = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const trackings = await DeliveryTracking.find()
      .populate({
        path: 'dispatchExecutionId',
        populate: { 
          path: 'dispatchPlanId', 
          populate: { path: 'salesOrderId', select: 'orderNumber customerName' } 
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await DeliveryTracking.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: trackings });
  } catch (error) { handleError(res, error); }
};

exports.updateTracking = async (req, res) => {
  try {
    const tracking = await DeliveryTracking.findById(req.params.id);
    if (!tracking) return res.status(404).json({ success: false, message: 'Tracking record not found' });

    // Push new status update
    if (req.body.newStatusUpdate) {
      tracking.statusUpdates.push(req.body.newStatusUpdate);
      tracking.currentLocation = req.body.newStatusUpdate.location;
      tracking.overallStatus = req.body.newStatusUpdate.status;
    }

    await tracking.save();
    await logAudit('UPDATE', 'DeliveryTracking', tracking._id, req.user._id);
    res.json({ success: true, data: tracking });
  } catch (error) { handleError(res, error); }
};

exports.confirmDelivery = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tracking = await DeliveryTracking.findById(req.params.id)
      .populate({
        path: 'dispatchExecutionId',
        populate: { path: 'dispatchPlanId', select: 'salesOrderId' }
      }).session(session);
    if (!tracking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Tracking record not found' });
    }

    tracking.deliveryConfirmation = {
      isDelivered: true,
      deliveredDate: new Date(),
      receiverName: req.body.receiverName,
      receiverContact: req.body.receiverContact,
      proofNotes: req.body.proofNotes
    };
    tracking.overallStatus = 'Delivered';
    tracking.currentLocation = 'Destination';
    
    tracking.statusUpdates.push({
      location: 'Destination',
      status: 'Delivered',
      remarks: 'Delivery Confirmed'
    });

    await tracking.save({ session });

    // Update Sales Order status to Dispatched on delivery confirmation
    const salesOrderId = tracking?.dispatchExecutionId?.dispatchPlanId?.salesOrderId;
    if (salesOrderId) {
      const so = await SalesOrder.findByIdAndUpdate(salesOrderId, {
        status: 'Dispatched',
        'trackingStatus.dispatchStatus': 'Delivered'
      }, { new: true, session });
      
      if (so && so.items && so.items.length > 0) {
        for (const item of so.items) {
          let remainingQty = item.quantity;
          const stocks = await InventoryStock.find({ materialId: item.productId, quantityAvailable: { $gt: 0 } })
            .sort({ postingDate: 1 }).session(session);
            
          for (let stock of stocks) {
            if (remainingQty <= 0) break;
            const deduct = Math.min(stock.quantityAvailable, remainingQty);
            stock.quantityAvailable -= deduct;
            remainingQty -= deduct;
            await stock.save({ session });
            
            await InventoryTransaction.create([{
              materialId: item.productId,
              transactionType: 'Material Issue',
              quantity: deduct,
              referenceId: so._id,
              referenceType: 'SalesOrder',
              notes: 'Finished Goods Dispatch',
              performedBy: req.user._id
            }], { session });
          }
          if (remainingQty > 0) {
            throw new Error(`Insufficient stock for dispatch of product ID ${item.productId}`);
          }
        }
      }
    }

    await logAudit('UPDATE', 'DeliveryTracking', tracking._id, req.user._id);
    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, data: tracking });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    handleError(res, error);
  }
};

// ================= Dispatch Planning (V2 Architecture) =================

exports.getV2DeliveryPlans = async (req, res) => {
  try {
    const plans = await DeliveryPlan.find().sort({ createdAt: -1 });

    const ordersById = await resolveSalesOrders(plans.map(p => p.Sales_Order_ID));

    const fullPlans = await Promise.all(plans.map(async (p) => {
      const schedule = await ShipmentSchedule.findOne({ Plan_ID: p._id });
      let assignment = null;
      if (schedule) {
        assignment = await VehicleAssignment.findOne({ Schedule_ID: schedule._id });
      }

      return {
        ...p.toObject(),
        Sales_Order_ID: (p.Sales_Order_ID && ordersById.get(p.Sales_Order_ID.toString())) || null,
        schedule: schedule ? schedule.toObject() : null,
        assignment: assignment ? assignment.toObject() : null
      };
    }));

    res.json({ success: true, data: fullPlans });
  } catch (error) { handleError(res, error); }
};

exports.createV2DeliveryPlan = async (req, res) => {
  try {
    const { Sales_Order_ID, Planned_Date } = req.body;

    if (!Sales_Order_ID || !Planned_Date) {
      return res.status(400).json({ success: false, message: 'Sales Order ID and Planned Date are required.' });
    }

    // Rule 3: Sales Order Constraint
    let so = null;
    if (SalesOrder && SalesOrder.findById) {
      so = await SalesOrder.findById(Sales_Order_ID);
    }
    if (!so && SOHeader && SOHeader.findById) {
      so = await SOHeader.findById(Sales_Order_ID);
    }

    if (!so || so.status === 'Cancelled' || so.status === 'Hold') {
      return res.status(400).json({
        success: false,
        message: 'Sales Order Constraint Error: Cannot create delivery plan for an inactive, on-hold, or cancelled Sales Order.'
      });
    }

    const count = await DeliveryPlan.countDocuments();
    const planNum = internalId('DP');

    const plan = await DeliveryPlan.create({
      Plan_ID: planNum,
      Plan_Number: planNum,
      Sales_Order_ID,
      Planned_Date: new Date(Planned_Date),
      Status: 'Planned'
    });

    await logAudit('CREATE', 'DeliveryPlan', plan._id, req.user?._id, `Created delivery plan ${planNum} for Sales Order ${so.orderNumber}`);
    res.status(201).json({ success: true, data: plan });
  } catch (error) { handleError(res, error); }
};

exports.scheduleV2DeliveryPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { Scheduled_Date, Carrier_ID, Shipping_Method, Estimated_Arrival_Date } = req.body;

    const plan = await DeliveryPlan.findById(id);
    if (!plan) return res.status(404).json({ success: false, message: 'Delivery Plan not found' });

    // Rule 1: Sequential State Machine Validation
    if (!Carrier_ID || !Scheduled_Date) {
      return res.status(400).json({
        success: false,
        message: 'Sequential State Machine Error: Carrier ID and Scheduled Date are required to move plan to Scheduled status.'
      });
    }

    // Rule 2: Date Integrity Check
    const schedDate = new Date(Scheduled_Date);
    const planDate = new Date(plan.Planned_Date);
    planDate.setHours(0, 0, 0, 0);

    if (schedDate < planDate) {
      return res.status(400).json({
        success: false,
        message: 'Date Integrity Error: Scheduled Date cannot be earlier than Planned Date.'
      });
    }

    const count = await ShipmentSchedule.countDocuments();
    const schedId = internalId('SCH');

    const schedule = await ShipmentSchedule.findOneAndUpdate(
      { Plan_ID: plan._id },
      {
        Schedule_ID: schedId,
        Plan_ID: plan._id,
        Scheduled_Date: schedDate,
        Carrier_ID,
        Shipping_Method: Shipping_Method || 'Road',
        Estimated_Arrival_Date: Estimated_Arrival_Date ? new Date(Estimated_Arrival_Date) : null
      },
      { upsert: true, new: true }
    );

    if (plan.Status === 'Planned' || plan.Status === 'Draft') {
      plan.Status = 'Scheduled';
      await plan.save();
    }

    await logAudit('CREATE', 'ShipmentSchedule', schedule._id, req.user?._id, `Scheduled shipment ${schedId} for Delivery Plan ${plan.Plan_Number}`);
    res.status(201).json({ success: true, data: schedule, plan });
  } catch (error) { handleError(res, error); }
};

exports.assignV2Vehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { Vehicle_ID, Driver_ID } = req.body;

    const plan = await DeliveryPlan.findById(id);
    if (!plan) return res.status(404).json({ success: false, message: 'Delivery Plan not found' });

    const schedule = await ShipmentSchedule.findOne({ Plan_ID: plan._id });
    if (!schedule) {
      return res.status(400).json({
        success: false,
        message: 'Sequential State Machine Error: Cannot assign vehicle before shipment logistics have been scheduled.'
      });
    }

    // Rule 1: Sequential State Machine Validation
    if (!Vehicle_ID || !Driver_ID) {
      return res.status(400).json({
        success: false,
        message: 'Sequential State Machine Error: Both Vehicle Registration Number and Driver ID are required to assign resources.'
      });
    }

    // Rule 4: Resource Availability Check
    const activeAssignments = await VehicleAssignment.find({ Dispatch_Status: { $in: ['Dispatched', 'Pending'] } });
    const vehicleConflict = activeAssignments.find(a => String(a.Plan_ID) !== String(plan._id) && a.Vehicle_ID.toLowerCase() === Vehicle_ID.toLowerCase() && a.Dispatch_Status === 'Dispatched');
    if (vehicleConflict) {
      return res.status(400).json({
        success: false,
        message: `Resource Availability Conflict: Vehicle ${Vehicle_ID} is currently active in another in-transit shipment.`
      });
    }

    const count = await VehicleAssignment.countDocuments();
    const assignId = internalId('ASG');

    const assignment = await VehicleAssignment.findOneAndUpdate(
      { Schedule_ID: schedule._id },
      {
        Assignment_ID: assignId,
        Schedule_ID: schedule._id,
        Plan_ID: plan._id,
        Vehicle_ID,
        Driver_ID,
        Assignment_Date: new Date(),
        Dispatch_Status: 'Pending'
      },
      { upsert: true, new: true }
    );

    await logAudit('CREATE', 'VehicleAssignment', assignment._id, req.user?._id, `Assigned vehicle ${Vehicle_ID} and driver ${Driver_ID} to Delivery Plan ${plan.Plan_Number}`);
    res.status(201).json({ success: true, data: assignment, plan });
  } catch (error) { handleError(res, error); }
};

// ================= Dispatch Execution (V2 Architecture) =================

exports.getV2DispatchExecutions = async (req, res) => {
  try {
    // Auto-seed execution headers for any DeliveryPlan that doesn't have an execution record yet
    const plans = await DeliveryPlan.find({ Status: { $in: ['Assigned', 'Scheduled', 'Planned'] } });
    for (const p of plans) {
      // Seeding is best-effort: a single unseedable plan must not blank the whole list.
      try {
        let existing = await DispatchExecution.findOne({ $or: [{ Plan_ID: p._id }, { dispatchPlanId: p._id }] });
        if (!existing) {
          existing = await DispatchExecution.create({
            ...(await newExecutionIdentity(p._id)),
            Sales_Order_ID: p.Sales_Order_ID,
            Overall_Status: 'Pending'
          });

          // Initialize sub-phase records
          await PackingManagement.create({ Packing_ID: internalId('PKG'), Exec_ID: existing._id, Packing_Status: 'Pending', Total_Boxes: 0 });
          await LoadingManagement.create({ Loading_ID: internalId('LDG'), Exec_ID: existing._id, Loading_Status: 'Pending', Loading_Bay: 'Bay-01' });
          await DispatchConfirmation.create({ Confirmation_ID: internalId('CNF'), Exec_ID: existing._id, Dispatch_Status: 'Pending' });
        } else {
          // Backfill legacy fields if missing
          let modified = false;
          if (!existing.Exec_ID) { existing.Exec_ID = internalId('DE'); modified = true; }
          if (!existing.Exec_Number) { existing.Exec_Number = existing.Exec_ID; modified = true; }
          if (!existing.Plan_ID && p._id) { existing.Plan_ID = p._id; modified = true; }
          // Frees the null slots on the legacy unique indexes for later inserts.
          if (!existing.get('executionNumber')) { existing.set('executionNumber', existing.Exec_Number || existing.Exec_ID); modified = true; }
          if (!existing.dispatchPlanId && p._id) { existing.dispatchPlanId = p._id; modified = true; }
          if (modified) await existing.save();
        }
      } catch (seedErr) {
        console.error('Dispatch execution auto-seed skipped for plan', p._id?.toString(), seedErr.message);
      }
    }

    const headers = await DispatchExecution.find()
      .populate('Plan_ID')
      .sort({ createdAt: -1 });
    const ordersById = await resolveSalesOrders(headers.map(h => h.Plan_ID?.Sales_Order_ID));

    const fullExecutions = await Promise.all(headers.map(async (h) => {
      const packing = await PackingManagement.findOne({ Exec_ID: h._id });
      const loading = await LoadingManagement.findOne({ Exec_ID: h._id });
      const confirmation = await DispatchConfirmation.findOne({ Exec_ID: h._id });

      const execNum = h.Exec_Number || h.Exec_ID || `DE-${h._id.toString().slice(-6)}`;

      const plan = h.Plan_ID
        ? { ...h.Plan_ID.toObject(), Sales_Order_ID: ordersById.get(h.Plan_ID.Sales_Order_ID?.toString()) || null }
        : null;

      return {
        ...h.toObject(),
        Plan_ID: plan,
        Exec_Number: execNum,
        Exec_ID: h.Exec_ID || execNum,
        packing: packing ? packing.toObject() : null,
        loading: loading ? loading.toObject() : null,
        confirmation: confirmation ? confirmation.toObject() : null
      };
    }));

    res.json({ success: true, data: fullExecutions });
  } catch (error) { handleError(res, error); }
};

exports.initiateV2DispatchExecution = async (req, res) => {
  try {
    const { Plan_ID } = req.body;
    const plan = await DeliveryPlan.findById(Plan_ID);
    if (!plan) return res.status(404).json({ success: false, message: 'Delivery Plan not found' });

    let exec = await DispatchExecution.findOne({ $or: [{ Plan_ID: plan._id }, { dispatchPlanId: plan._id }] });
    if (!exec) {
      exec = await DispatchExecution.create({
        ...(await newExecutionIdentity(plan._id)),
        Sales_Order_ID: plan.Sales_Order_ID,
        Overall_Status: 'Packing'
      });

      await PackingManagement.create({ Packing_ID: internalId('PKG'), Exec_ID: exec._id, Packing_Status: 'In Progress', Total_Boxes: 10 });
      await LoadingManagement.create({ Loading_ID: internalId('LDG'), Exec_ID: exec._id, Loading_Status: 'Pending', Loading_Bay: 'Bay-01' });
      await DispatchConfirmation.create({ Confirmation_ID: internalId('CNF'), Exec_ID: exec._id, Dispatch_Status: 'Pending' });
    }

    res.status(201).json({ success: true, data: exec });
  } catch (error) { handleError(res, error); }
};

exports.updateV2PackingPhase = async (req, res) => {
  try {
    const { id } = req.params;
    const { Packing_Status, Total_Boxes } = req.body;

    const exec = await DispatchExecution.findById(id);
    if (!exec) return res.status(404).json({ success: false, message: 'Dispatch Execution record not found' });

    // Backfill legacy fields if missing
    if (!exec.Exec_ID) exec.Exec_ID = internalId('DE');
    if (!exec.Exec_Number) exec.Exec_Number = exec.Exec_ID;
    if (!exec.Plan_ID && exec.dispatchPlanId) exec.Plan_ID = exec.dispatchPlanId;

    const boxes = Number(Total_Boxes);
    // Rule 2: Total Boxes Validation
    if (Packing_Status === 'Completed' && (isNaN(boxes) || boxes <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Total Boxes Validation Error: Total Boxes must be entered and be greater than zero before marking packing phase as Completed.'
      });
    }

    const packing = await PackingManagement.findOneAndUpdate(
      { Exec_ID: exec._id },
      {
        Packing_Status,
        Total_Boxes: boxes || 0,
        Packing_End_Time: Packing_Status === 'Completed' ? new Date() : null
      },
      { upsert: true, new: true }
    );

    if (exec.Overall_Status === 'Pending') {
      exec.Overall_Status = 'Packing';
    }
    await exec.save();

    await logAudit('UPDATE', 'PackingManagement', packing._id, req.user?._id, `Updated packing phase for ${exec.Exec_Number} to ${Packing_Status}`);
    res.json({ success: true, data: packing, exec });
  } catch (error) { handleError(res, error); }
};

exports.updateV2LoadingPhase = async (req, res) => {
  try {
    const { id } = req.params;
    const { Loading_Status, Loading_Bay } = req.body;

    const exec = await DispatchExecution.findById(id);
    if (!exec) return res.status(404).json({ success: false, message: 'Dispatch Execution record not found' });

    const packing = await PackingManagement.findOne({ Exec_ID: exec._id });
    // Rule 1: Sequential Execution Gate
    if (Loading_Status === 'Completed' && (!packing || packing.Packing_Status !== 'Completed')) {
      return res.status(400).json({
        success: false,
        message: 'Sequential Execution Gate Error: Cannot mark loading phase as Completed until Phase 1 Packing is Completed.'
      });
    }

    // Rule 3: Loading Bay Assignment
    if (!Loading_Bay || !Loading_Bay.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Loading Bay Assignment Error: A valid Loading Bay (e.g. Bay-01 or FDSF) must be assigned before loading.'
      });
    }

    const loading = await LoadingManagement.findOneAndUpdate(
      { Exec_ID: exec._id },
      {
        Loading_Status,
        Loading_Bay,
        Loader_ID: req.user?._id
      },
      { upsert: true, new: true }
    );

    if (exec.Overall_Status === 'Packing' || exec.Overall_Status === 'Pending') {
      exec.Overall_Status = 'Loading';
      await exec.save();
    }

    await logAudit('UPDATE', 'LoadingManagement', loading._id, req.user?._id, `Updated loading phase for ${exec.Exec_Number} to ${Loading_Status}`);
    res.json({ success: true, data: loading, exec });
  } catch (error) { handleError(res, error); }
};

exports.confirmV2Dispatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { Dispatch_Status, Dispatched_Date } = req.body;

    const exec = await DispatchExecution.findById(id).populate('Plan_ID').session(session);
    if (!exec) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ success: false, message: 'Dispatch Execution record not found' });
    }

    const loading = await LoadingManagement.findOne({ Exec_ID: exec._id }).session(session);
    // Rule 1: Sequential Execution Gate
    if (Dispatch_Status === 'Confirmed' && (!loading || loading.Loading_Status !== 'Completed')) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Sequential Execution Gate Error: Cannot confirm dispatch until Phase 2 Loading is Completed.'
      });
    }

    // Rule 5: Date Integrity Check
    const dispatchDate = Dispatched_Date ? new Date(Dispatched_Date) : new Date();
    if (exec.Plan_ID?.Planned_Date) {
      const planDate = new Date(exec.Plan_ID.Planned_Date);
      planDate.setHours(0, 0, 0, 0);
      if (dispatchDate < planDate) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Date Integrity Error: Dispatched Date cannot be earlier than the Planned Date established in Delivery Planning.'
        });
      }
    }

    // H-14 + H-15: Stock deduction with ATP check on dispatch confirmation
    if (Dispatch_Status === 'Confirmed' && exec.Sales_Order_ID) {
      let lineItems = [];
      let orderNum = '';

      // Try V1 SalesOrder first
      const v1So = await SalesOrder.findById(exec.Sales_Order_ID).lean();
      if (v1So && Array.isArray(v1So.items) && v1So.items.length > 0) {
        lineItems = v1So.items.map(i => ({
          materialId: i.productId || i.materialId,
          quantity: i.quantity || i.orderedQuantity || i.shippedQuantity || 0
        }));
        orderNum = v1So.orderNumber || String(v1So._id);
      } else {
        // Fallback to V2 SOHeader + SOLineItem
        const v2So = await SOHeader.findById(exec.Sales_Order_ID).lean();
        if (v2So) {
          orderNum = v2So.Order_Number || String(v2So._id);
          const v2Lines = await SOLineItem.find({ soId: exec.Sales_Order_ID }).lean();
          lineItems = v2Lines.map(i => ({
            materialId: i.productId || i.materialId,
            quantity: i.orderedQuantity || i.shippedQuantity || i.quantity || 0
          }));
        }
      }

      // H-15: ATP pre-check — verify stock for every line before deducting anything
      for (const item of lineItems) {
        const materialId = item.materialId;
        if (!materialId) continue;
        const stocks = await InventoryStock.aggregate([
          { $match: { materialId, status: 'Active' } },
          { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
        ]).session(session);
        const available = stocks[0]?.total || 0;
        const required = item.quantity || 0;
        if (available < required) {
          await session.abortTransaction(); session.endSession();
          return res.status(422).json({
            success: false,
            message: `ATP Failure: Insufficient stock for item ${materialId}. Required: ${required}, Available: ${available}.`,
            itemId: materialId, required, available
          });
        }
      }

      // H-14: FIFO stock deduction per line item
      const { generateDocNumber } = require('../utils/docNumbering');
      // What the despatched goods cost us. The stock was already leaving here;
      // it was leaving without a value, so a sale recorded revenue with no cost
      // against it and gross margin was the whole invoice.
      let costOfGoodsDespatched = 0;
      for (const item of lineItems) {
        const materialId = item.materialId;
        if (!materialId) continue;
        let remaining = item.quantity || 0;
        if (remaining <= 0) continue;

        const stockBatches = await InventoryStock.find({ materialId, status: 'Active' })
          .sort({ postingDate: 1 }).session(session);

        for (const batch of stockBatches) {
          if (remaining <= 0) break;
          const deduct = Math.min(batch.quantityAvailable, remaining);
          costOfGoodsDespatched += deduct * (Number(batch.unitCost) || 0);
          batch.quantityAvailable -= deduct;
          if (batch.quantityAvailable === 0) batch.status = 'Consumed';
          await batch.save({ session });
          remaining -= deduct;
        }

        // Create inventory transaction
        let txnNum;
        try { txnNum = await generateDocNumber('DISP', 'DISP', session); }
        catch (e) { txnNum = internalId('DISP'); }

        await InventoryTransaction.create([{
          transactionNumber: txnNum,
          transactionType: 'Material Issue',
          materialId,
          quantity: item.quantity,
          sourceWarehouseId: exec.Plan_ID?.Warehouse_ID || null,
          referenceDocument: `SO-${orderNum || exec.Sales_Order_ID}`,
          notes: `Stock dispatched against Sales Order ${orderNum || exec.Sales_Order_ID}`,
          status: 'Posted',
          createdBy: req.user?._id
        }], { session });
      }

      // One entry for the despatch as a whole: finished goods that left the
      // store become the cost of this sale.
      if (costOfGoodsDespatched > 0) {
        await postStockMovement({
          movementType: 'DISPATCH_COGS',
          amount: costOfGoodsDespatched,
          description: `Goods despatched against order ${orderNum || exec.Sales_Order_ID}`,
          referenceId: exec._id,
          session
        });
      }
    }

    const confirmation = await DispatchConfirmation.findOneAndUpdate(
      { Exec_ID: exec._id },
      { Dispatch_Status, Dispatched_Date: dispatchDate },
      { upsert: true, new: true, session }
    );

    // Rule 4: Status Synchronization
    if (Dispatch_Status === 'Confirmed') {
      exec.Overall_Status = 'Dispatched';
      await exec.save({ session });

      if (exec.Plan_ID) {
        exec.Plan_ID.Status = 'In-Transit';
        await exec.Plan_ID.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    await logAudit('UPDATE', 'DispatchConfirmation', confirmation._id, req.user?._id, `Confirmed dispatch for ${exec.Exec_Number}`);
    res.json({ success: true, data: confirmation, exec });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    handleError(res, error);
  }
};


// ================= Delivery Tracking (V2 Architecture) =================

exports.getV2DeliveryTrackings = async (req, res) => {
  try {
    // Rule 1: Prerequisite State Validation (auto-instantiate tracking headers for Dispatched executions)
    const dispatchedExecs = await DispatchExecution.find({ Overall_Status: 'Dispatched' });
    for (const exec of dispatchedExecs) {
      let existing = await DeliveryTracking.findOne({ Exec_ID: exec._id });
      if (!existing) {
        const trackNum = internalId('DT');
        existing = await DeliveryTracking.create({
          Tracking_ID: trackNum,
          Tracking_Number: trackNum,
          Exec_ID: exec._id,
          Plan_ID: exec.Plan_ID,
          Sales_Order_ID: exec.Sales_Order_ID,
          Overall_Delivery_Status: 'In-Transit'
        });

        // Initialize default initial milestone & confirmation handover record
        await ShipmentTracking.create({
          Event_ID: internalId('EVT'),
          Tracking_ID: existing._id,
          Tracking_Status: 'Departed',
          Current_Location: 'Origin Plant Facility',
          Event_Timestamp: new Date(),
          Remarks_Exceptions: 'Package departed facility'
        });

        await DeliveryConfirmationHandover.create({
          Confirmation_ID: internalId('POD'),
          Tracking_ID: existing._id,
          Final_Status: 'Pending'
        });
      }
    }

    const trackings = await DeliveryTracking.find()
      .populate({ path: 'Exec_ID', populate: { path: 'Plan_ID', populate: { path: 'Sales_Order_ID' } } })
      .sort({ createdAt: -1 });

    const fullTrackings = await Promise.all(trackings.map(async (t) => {
      const milestones = await ShipmentTracking.find({ Tracking_ID: t._id }).sort({ Event_Timestamp: -1 });
      const confirmation = await DeliveryConfirmationHandover.findOne({ Tracking_ID: t._id });

      return {
        ...t.toObject(),
        milestones: milestones.map(m => m.toObject()),
        confirmation: confirmation ? confirmation.toObject() : null
      };
    }));

    res.json({ success: true, data: fullTrackings });
  } catch (error) { handleError(res, error); }
};

exports.addV2TrackingMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { Tracking_Status, Current_Location, Remarks_Exceptions } = req.body;

    const tracking = await DeliveryTracking.findById(id);
    if (!tracking) return res.status(404).json({ success: false, message: 'Delivery Tracking record not found' });

    const confirmation = await DeliveryConfirmationHandover.findOne({ Tracking_ID: tracking._id });
    // Rule 3: Delivery Closure (lock additions if already Successfully Delivered)
    if (confirmation && confirmation.Final_Status === 'Successfully Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Delivery Closure Error: Cannot add shipment tracking milestones to a package that is already Successfully Delivered.'
      });
    }

    if (!Current_Location || !Current_Location.trim()) {
      return res.status(400).json({ success: false, message: 'Current Location (Checkpoint / GPS) is required.' });
    }

    const milestone = await ShipmentTracking.create({
      Event_ID: internalId('EVT'),
      Tracking_ID: tracking._id,
      Tracking_Status: Tracking_Status || 'Departed',
      Current_Location,
      Event_Timestamp: new Date(),
      Remarks_Exceptions: Remarks_Exceptions || ''
    });

    if (Tracking_Status === 'Delayed') {
      tracking.Overall_Delivery_Status = 'Delayed';
      await tracking.save();
    }

    await logAudit('CREATE', 'ShipmentTracking', milestone._id, req.user?._id, `Added milestone ${milestone.Event_ID} for ${tracking.Tracking_Number}`);
    res.status(201).json({ success: true, data: milestone, tracking });
  } catch (error) { handleError(res, error); }
};

exports.confirmV2DeliveryHandover = async (req, res) => {
  try {
    const { id } = req.params;
    const { Final_Status, Delivered_Date, Received_By, Proof_Of_Delivery_Ref, Customer_Feedback_Notes } = req.body;

    const tracking = await DeliveryTracking.findById(id).populate('Exec_ID');
    if (!tracking) return res.status(404).json({ success: false, message: 'Delivery Tracking record not found' });

    const OUTCOMES = ['Pending', 'Partially Delivered', 'Successfully Delivered', 'Rejected'];
    if (!OUTCOMES.includes(Final_Status)) {
      return res.status(400).json({ success: false, message: 'Say how the delivery ended: pending, partially delivered, successfully delivered or rejected.' });
    }
    if (Delivered_Date && isNaN(new Date(Delivered_Date).getTime())) {
      return res.status(400).json({ success: false, message: 'The delivered date is not a valid date.' });
    }

    // Rule 4: POD Requirement Check
    if (Final_Status === 'Successfully Delivered' && (!Received_By || !Received_By.trim())) {
      return res.status(400).json({
        success: false,
        message: 'POD Requirement Error: Received By (Receiver Name) is required when marking final status as Successfully Delivered.'
      });
    }

    // Rule 2: Chronological Constraint (Delivered_Date >= Dispatched_Date)
    const delivDate = Delivered_Date ? new Date(Delivered_Date) : new Date();
    if (tracking.Exec_ID) {
      const dispatchConf = await DispatchConfirmation.findOne({ Exec_ID: tracking.Exec_ID._id });
      if (dispatchConf && dispatchConf.Dispatched_Date) {
        const dispDate = new Date(dispatchConf.Dispatched_Date);
        dispDate.setHours(0, 0, 0, 0);
        if (delivDate < dispDate) {
          return res.status(400).json({
            success: false,
            message: 'Chronological Constraint Error: Delivered Date cannot be earlier than the preceding Dispatched Date.'
          });
        }
      }
    }

    const confirmation = await DeliveryConfirmationHandover.findOneAndUpdate(
      { Tracking_ID: tracking._id },
      {
        Final_Status,
        Delivered_Date: delivDate,
        Received_By,
        Proof_Of_Delivery_Ref: Proof_Of_Delivery_Ref || '',
        Customer_Feedback_Notes: Customer_Feedback_Notes || ''
      },
      { upsert: true, new: true }
    );

    // Rule 5: Upstream Synchronization
    if (Final_Status === 'Successfully Delivered') {
      tracking.Overall_Delivery_Status = 'Delivered';
      await tracking.save();

      if (tracking.Plan_ID) {
        await DeliveryPlan.findByIdAndUpdate(tracking.Plan_ID, { Status: 'Delivered' });
      }

      if (tracking.Sales_Order_ID) {
        if (SalesOrder && SalesOrder.findByIdAndUpdate) {
          await SalesOrder.findByIdAndUpdate(tracking.Sales_Order_ID, { status: 'Completed' });
        }
        if (SOHeader && SOHeader.findByIdAndUpdate) {
          await SOHeader.findByIdAndUpdate(tracking.Sales_Order_ID, { status: 'Completed' });
        }
      }
    }

    await logAudit('UPDATE', 'DeliveryConfirmationHandover', confirmation._id, req.user?._id, `Confirmed delivery handover for ${tracking.Tracking_Number}`);
    res.json({ success: true, data: confirmation, tracking });
  } catch (error) { handleError(res, error); }
};
