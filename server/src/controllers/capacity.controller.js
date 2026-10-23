const { handleError } = require('../utils/errorHandler');
const { CapacityPeriod, LoadDetail, LaborCapacityPeriod, LaborLoadDetail } = require('../models/CapacityPlanning');
const { WorkCenter } = require('../models/MasterWorkCenter');
const { Department } = require('../models/CompanyStructure');
const CapacityLabor = require('../models/CapacityLabor');
const { ProductionSchedule, DispatchList } = require('../models/ProductionSchedule');
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

// ================= CAPACITY PLANNING ENGINE (CRP) =================

// Rule 1 & Rule 3: Dynamic Load Calculation & Bottleneck Enforcement
async function calculatePeriodLoad(periodId) {
  const period = await CapacityPeriod.findById(periodId);
  if (!period) return;

  const loads = await LoadDetail.find({ capacityPeriodId: periodId });
  const totalUtilized = loads.reduce((acc, load) => acc + load.totalRequiredHours, 0);

  period.utilizedHrs = totalUtilized;
  period.utilizationPct = period.availableHrs > 0 ? (totalUtilized / period.availableHrs) * 100 : (totalUtilized > 0 ? 100 : 0);

  // Rule 3: Bottleneck Enforcement (Strict lock at > 100%)
  if (period.utilizationPct > 100) {
    period.status = 'Bottleneck';
  } else if (period.utilizationPct >= 80) {
    period.status = 'Optimal';
  } else {
    period.status = 'Underutilized';
  }

  await period.save();
  return period;
}

exports.getAllCapacityPeriods = async (req, res) => {
  try {
    const periods = await CapacityPeriod.find()
      .populate('workCenterId', 'name code efficiencyRate baseDailyHours')
      .sort({ startDate: 1 });
    res.json({ success: true, data: periods });
  } catch (error) { handleError(res, error); }
};

exports.getLoadDetails = async (req, res) => {
  try {
    const { periodId } = req.params;
    const loads = await LoadDetail.find({ capacityPeriodId: periodId });
    res.json({ success: true, data: loads });
  } catch (error) { handleError(res, error); }
};

// Helper to seed initial Capacity Period (for demonstration)
exports.createCapacityPeriod = async (req, res) => {
  try {
    const { workCenterId, periodLabel, startDate, endDate, availableHrs } = req.body;
    
    let hours = availableHrs;
    if (!hours) {
      const wc = await WorkCenter.findById(workCenterId);
      // Mock calculation: 5 days * base hours * efficiency
      hours = 5 * (wc.baseDailyHours || 8) * (wc.efficiencyRate || 1.0); 
    }

    const newPeriod = await CapacityPeriod.create({
      workCenterId, periodLabel, startDate, endDate, availableHrs: hours
    });

    await logAudit('CREATE', 'CapacityPeriod', newPeriod._id, req.user._id);
    res.status(201).json({ success: true, data: newPeriod });
  } catch (error) { handleError(res, error); }
};

// Seed Load Detail (Mocking the creation of demand from MRP/Shop Floor)
exports.createLoadDetail = async (req, res) => {
  try {
    const { capacityPeriodId, setupHours, runHours } = req.body;
    const totalRequiredHours = Number(setupHours) + Number(runHours);
    
    const load = await LoadDetail.create({
      capacityPeriodId,
      workOrderId: new mongoose.Types.ObjectId(), // Mock WO ID
      routingStepNo: 10,
      setupHours,
      runHours,
      totalRequiredHours
    });

    await calculatePeriodLoad(capacityPeriodId); // Trigger dynamic calc

    await logAudit('CREATE', 'LoadDetail', load._id, req.user._id);
    res.status(201).json({ success: true, data: load });
  } catch (error) { handleError(res, error); }
};

// Rule 4: Manual Capacity Injections (+ Record Capacity)
exports.recordOvertime = async (req, res) => {
  try {
    const { periodId } = req.params;
    const { additionalHours, reason } = req.body;

    const period = await CapacityPeriod.findById(periodId);
    if (!period) return res.status(404).json({ success: false, message: 'Period not found' });

    period.availableHrs += Number(additionalHours);
    await period.save(); // Save first

    const updatedPeriod = await calculatePeriodLoad(periodId); // Recalculate utilization and status

    await logAudit('ADD_CAPACITY', 'CapacityPeriod', periodId, req.user._id, { additionalHours, reason });
    res.json({ success: true, message: 'Capacity injected successfully', data: updatedPeriod });
  } catch (error) { handleError(res, error); }
};

// Rule 2: Real-Time Event Bus Mock (WebSockets equivalent)
exports.simulateReschedule = async (req, res) => {
  try {
    const { loadId, newPeriodId } = req.body;

    const load = await LoadDetail.findById(loadId);
    if (!load) return res.status(404).json({ success: false, message: 'Load Detail not found' });

    const oldPeriodId = load.capacityPeriodId;
    load.capacityPeriodId = newPeriodId;
    await load.save();

    // Trigger instant recalculation on BOTH periods
    await calculatePeriodLoad(oldPeriodId);
    await calculatePeriodLoad(newPeriodId);

    await logAudit('RESCHEDULE', 'LoadDetail', loadId, req.user._id, { from: oldPeriodId, to: newPeriodId });
    res.json({ success: true, message: 'Load successfully moved and capacities dynamically recalculated.' });
  } catch (error) { handleError(res, error); }
};

// Rule 5: Finite Scheduling Feedback Loop
exports.validateScheduling = async (req, res) => {
  try {
    const { workCenterId, periodLabel } = req.query;
    
    const period = await CapacityPeriod.findOne({ workCenterId, periodLabel });
    if (!period) return res.json({ success: true, isValid: true, message: 'No capacity record exists yet. Assume valid.' });

    if (period.status === 'Bottleneck') {
      return res.json({ 
        success: true, 
        isValid: false, 
        message: `Work Center is severely bottlenecked (${period.utilizationPct.toFixed(1)}%). Scheduling blocked unless authorized.` 
      });
    }

    res.json({ success: true, isValid: true, message: 'Capacity available.' });
  } catch (error) { handleError(res, error); }
};


// ================= LABOR CAPACITY ENGINE =================

// Rule 1, 2, 3 & 5: Dynamic Math, Aggregation, Variance & Skill Constraint
async function calculateLaborPeriodLoad(periodId) {
  const period = await LaborCapacityPeriod.findById(periodId);
  if (!period) return;

  // Rule 1: Dynamic Headcount vs. Time Math
  // (Base Headcount * Standard Shift Hours * 5 Working Days)
  period.availableHrs = period.headcount * period.standardShiftHours * 5;

  const loads = await LaborLoadDetail.find({ laborPeriodId: periodId });
  
  // Rule 2: Real-Time Demand Aggregation
  let totalPlanned = 0;
  let hasExpertDeficit = false; // Mocking Rule 5

  loads.forEach(load => {
    totalPlanned += load.requiredLaborHours;
    // Rule 5: Skill Matrix Constraint Mock
    // If the load requires 'Expert' but we mock that we only have 'Basic'/'Intermediate'
    if (load.skillLevelRequired === 'Expert' && period.headcount > 0) {
      hasExpertDeficit = true; 
    }
  });

  period.plannedHrs = totalPlanned;
  period.varianceHrs = period.availableHrs - period.plannedHrs;

  // Rule 3: Shortfall Alerts
  if (hasExpertDeficit) {
    period.status = 'Skill Constraint';
  } else if (period.varianceHrs < 0) {
    period.status = 'Understaffed';
  } else if (period.varianceHrs > period.availableHrs * 0.2) { 
    // e.g., > 20% unused buffer
    period.status = 'Overstaffed';
  } else {
    period.status = 'Optimal';
  }

  await period.save();
  return period;
}

exports.getAllLaborPeriods = async (req, res) => {
  try {
    const periods = await LaborCapacityPeriod.find()
      .populate('departmentId', 'name code')
      .sort({ startDate: 1 });
    res.json({ success: true, data: periods });
  } catch (error) { handleError(res, error); }
};

exports.getLaborLoadDetails = async (req, res) => {
  try {
    const { periodId } = req.params;
    const loads = await LaborLoadDetail.find({ laborPeriodId: periodId });
    res.json({ success: true, data: loads });
  } catch (error) { handleError(res, error); }
};

// Seed Labor Period
exports.createLaborPeriod = async (req, res) => {
  try {
    const { departmentId, shiftName, standardShiftHours, periodLabel, startDate, endDate, headcount } = req.body;
    
    const newPeriod = await LaborCapacityPeriod.create({
      departmentId, shiftName, standardShiftHours, periodLabel, startDate, endDate, headcount
    });

    await calculateLaborPeriodLoad(newPeriod._id);

    await logAudit('CREATE', 'LaborCapacityPeriod', newPeriod._id, req.user._id);
    res.status(201).json({ success: true, data: newPeriod });
  } catch (error) { handleError(res, error); }
};

// Seed Labor Load Detail
exports.createLaborLoadDetail = async (req, res) => {
  try {
    const { laborPeriodId, requiredLaborHours, skillLevelRequired } = req.body;
    
    const load = await LaborLoadDetail.create({
      laborPeriodId,
      workOrderId: new mongoose.Types.ObjectId(), // Mock WO ID
      routingStepNo: 20,
      requiredLaborHours,
      skillLevelRequired
    });

    await calculateLaborPeriodLoad(laborPeriodId);

    await logAudit('CREATE', 'LaborLoadDetail', load._id, req.user._id);
    res.status(201).json({ success: true, data: load });
  } catch (error) { handleError(res, error); }
};

// Rule 4: Workforce Planning Injections
exports.planWorkforce = async (req, res) => {
  try {
    const { periodId } = req.params;
    const { newHeadcount, manualHoursAdjustment, reason } = req.body;

    const period = await LaborCapacityPeriod.findById(periodId);
    if (!period) return res.status(404).json({ success: false, message: 'Period not found' });

    if (newHeadcount !== undefined) period.headcount = Number(newHeadcount);
    
    // Add manual hours if provided (e.g. weekend overtime not changing headcount)
    let extraHours = 0;
    if (manualHoursAdjustment) {
      extraHours = Number(manualHoursAdjustment);
    }

    await period.save(); 

    // Calculate dynamically first based on headcount
    const updatedPeriod = await calculateLaborPeriodLoad(periodId);

    // Apply manual hour adjustments and re-check variance if provided
    if (extraHours !== 0) {
      updatedPeriod.availableHrs += extraHours;
      updatedPeriod.varianceHrs = updatedPeriod.availableHrs - updatedPeriod.plannedHrs;
      
      if (updatedPeriod.status !== 'Skill Constraint') {
        if (updatedPeriod.varianceHrs < 0) {
          updatedPeriod.status = 'Understaffed';
        } else if (updatedPeriod.varianceHrs > updatedPeriod.availableHrs * 0.2) {
          updatedPeriod.status = 'Overstaffed';
        } else {
          updatedPeriod.status = 'Optimal';
        }
      }
      await updatedPeriod.save();
    }

    await logAudit('PLAN_WORKFORCE', 'LaborCapacityPeriod', periodId, req.user._id, { newHeadcount, extraHours, reason });
    res.json({ success: true, message: 'Workforce updated successfully', data: updatedPeriod });
  } catch (error) { handleError(res, error); }
};

// Rule 2: Real-Time Event Bus Mock (Reschedule Simulation)
exports.simulateLaborReschedule = async (req, res) => {
  try {
    const { loadId, newPeriodId } = req.body;

    const load = await LaborLoadDetail.findById(loadId);
    if (!load) return res.status(404).json({ success: false, message: 'Load Detail not found' });

    const oldPeriodId = load.laborPeriodId;
    load.laborPeriodId = newPeriodId;
    await load.save();

    await calculateLaborPeriodLoad(oldPeriodId);
    await calculateLaborPeriodLoad(newPeriodId);

    await logAudit('RESCHEDULE', 'LaborLoadDetail', loadId, req.user._id, { from: oldPeriodId, to: newPeriodId });
    res.json({ success: true, message: 'Labor load successfully moved.' });
  } catch (error) { handleError(res, error); }
};


// ================= PRODUCTION SCHEDULING ENGINE =================

exports.getAllSchedules = async (req, res) => {
  try {
    const { type, workCenterId, status, date } = req.query;
    const filter = {};
    if (type && type !== 'All') filter.scheduleType = type;
    if (workCenterId) filter.assignedWorkCenterId = workCenterId;
    if (status && status !== 'All') filter.status = status;
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      filter.targetDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const schedules = await ProductionSchedule.find(filter)
      .populate('productId', 'name code partNumber category')
      .populate('assignedWorkCenterId', 'name code plantId efficiencyRate baseDailyHours category shiftsPerDay')
      .sort({ sequence: 1, targetDate: 1 });
    res.json({ success: true, data: schedules });
  } catch (error) { handleError(res, error); }
};

exports.createSchedule = async (req, res) => {
  try {
    const { 
      scheduleType, targetDate, mrpRecommendationId, 
      productId, scheduledQuantity, assignedWorkCenterId, status, notes,
      shift, priority, sequence, dieToolId, setupTimeHours, runTimeHours,
      plannedOperators, workOrderNumber, customerReference, batchNumber
    } = req.body;

    // Rule 1: MRP Suggestion Depletion
    if (mrpRecommendationId) {
      const mrpRec = await RecommendationRecord.findById(mrpRecommendationId);
      if (mrpRec) {
        mrpRec.suggestedQty -= scheduledQuantity;
        if (mrpRec.suggestedQty <= 0) {
          mrpRec.suggestedQty = 0;
          mrpRec.status = 'Converted';
        }
        await mrpRec.save();
        await logAudit('DEPLETE', 'MrpRecommendation', mrpRec._id, req.user._id, { deducted: scheduledQuantity });
      }
    }

    const newSched = await ProductionSchedule.create({
      scheduleType, 
      targetDate, 
      mrpRecommendationId, 
      productId, 
      scheduledQuantity, 
      assignedWorkCenterId, 
      status: status || 'Draft', 
      notes,
      shift: shift || 'Shift 1',
      priority: priority || 'Normal',
      sequence: sequence || 10,
      dieToolId,
      setupTimeHours: setupTimeHours !== undefined ? setupTimeHours : 0.5,
      runTimeHours: runTimeHours !== undefined ? runTimeHours : 2.0,
      plannedOperators: plannedOperators !== undefined ? plannedOperators : 2,
      workOrderNumber,
      customerReference,
      batchNumber,
      companyId: req.user?.companyId
    });

    // If created directly in Firm/Released status, generate dispatch
    if (newSched.status === 'Firm/Released') {
      const lastDispatch = await DispatchList.findOne({ scheduleId: newSched._id }).sort({ sequenceNumber: -1 });
      const nextSeq = lastDispatch ? lastDispatch.sequenceNumber + 10 : 10;
      
      const dispatch = await DispatchList.create({
        scheduleId: newSched._id,
        sequenceNumber: nextSeq,
        expectedStartTime: newSched.targetDate
      });
      await logAudit('GENERATE_DISPATCH', 'DispatchList', dispatch._id, req.user._id);
    }

    await logAudit('CREATE', 'ProductionSchedule', newSched._id, req.user._id);
    res.status(201).json({ success: true, data: newSched });
  } catch (error) { handleError(res, error); }
};

exports.updateSchedule = async (req, res) => {
  try {
    const sched = await ProductionSchedule.findById(req.params.id);
    if (!sched) return res.status(404).json({ success: false, message: 'Schedule not found' });

    const previousStatus = sched.status;
    const newStatus = req.body.status;

    // Rule 3: Waterfall Resolution (Monthly -> Daily)
    if (newStatus === 'Firm/Released' && (sched.scheduleType === 'Monthly' || sched.scheduleType === 'Weekly')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Waterfall Resolution Enforced: Cannot release a Monthly or Weekly rough-cut plan to the shop floor. Please break this down into specific Daily schedules.' 
      });
    }

    Object.assign(sched, req.body);
    await sched.save();

    // Rule 4: Status-Driven Material Allocation & Dispatch Generation
    if (previousStatus !== 'Firm/Released' && newStatus === 'Firm/Released') {
      // Create Dispatch List
      const lastDispatch = await DispatchList.findOne({ scheduleId: sched._id }).sort({ sequenceNumber: -1 });
      const nextSeq = lastDispatch ? lastDispatch.sequenceNumber + 10 : (sched.sequence || 10);
      
      const dispatch = await DispatchList.create({
        scheduleId: sched._id,
        sequenceNumber: nextSeq,
        expectedStartTime: sched.targetDate
      });

      // Mock Inventory Allocation
      await logAudit('ALLOCATE_MATERIALS', 'ProductionSchedule', sched._id, req.user._id, {
        message: `Inventory explicitly locked/reserved for ${sched.scheduledQuantity} units of Product ${sched.productId}`
      });
      await logAudit('GENERATE_DISPATCH', 'DispatchList', dispatch._id, req.user._id);
    }

    res.json({ success: true, data: sched });
  } catch (error) { handleError(res, error); }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const sched = await ProductionSchedule.findById(req.params.id);
    if (!sched) return res.status(404).json({ success: false, message: 'Schedule not found' });

    if (sched.status === 'In-Progress') {
      return res.status(400).json({ success: false, message: 'Cannot delete a schedule currently In-Progress on the shop floor.' });
    }

    await ProductionSchedule.findByIdAndDelete(req.params.id);
    await DispatchList.deleteMany({ scheduleId: req.params.id });

    await logAudit('DELETE', 'ProductionSchedule', req.params.id, req.user._id);
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) { handleError(res, error); }
};

exports.convertToWorkOrder = async (req, res) => {
  try {
    const sched = await ProductionSchedule.findById(req.params.id).populate('productId');
    if (!sched) return res.status(404).json({ success: false, message: 'Schedule not found' });

    const generatedWONum = sched.workOrderNumber || `WO-PAC-${Date.now().toString().slice(-6)}`;
    sched.workOrderNumber = generatedWONum;
    sched.status = 'Firm/Released';
    await sched.save();

    // Ensure Dispatch record exists
    const existingDispatch = await DispatchList.findOne({ scheduleId: sched._id });
    if (!existingDispatch) {
      await DispatchList.create({
        scheduleId: sched._id,
        sequenceNumber: sched.sequence || 10,
        expectedStartTime: sched.targetDate
      });
    }

    await logAudit('RELEASE_TO_WORK_ORDER', 'ProductionSchedule', sched._id, req.user._id, {
      workOrderNumber: generatedWONum,
      product: sched.productId?.name,
      quantity: sched.scheduledQuantity
    });

    res.json({
      success: true,
      message: `Work Order ${generatedWONum} successfully generated & released to Shop Floor`,
      workOrderNumber: generatedWONum,
      data: sched
    });
  } catch (error) { handleError(res, error); }
};

exports.autoSequenceSchedule = async (req, res) => {
  try {
    const { workCenterId, date } = req.body;
    const filter = { scheduleType: 'Daily' };
    if (workCenterId) filter.assignedWorkCenterId = workCenterId;
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      filter.targetDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const items = await ProductionSchedule.find(filter).sort({ dieToolId: 1, priority: -1 });
    let seq = 10;
    for (const item of items) {
      item.sequence = seq;
      seq += 10;
      await item.save();
    }

    await logAudit('AUTO_SEQUENCE_SMED', 'ProductionSchedule', null, req.user._id, {
      optimizedCount: items.length,
      rule: 'Group by Die / Tooling to minimize changeover downtime'
    });

    res.json({
      success: true,
      message: `Successfully re-sequenced ${items.length} jobs using SMED changeover optimization`,
      data: items
    });
  } catch (error) { handleError(res, error); }
};

exports.getDispatchList = async (req, res) => {
  try {
    const dispatchItems = await DispatchList.find()
      .populate({
        path: 'scheduleId',
        populate: [
          { path: 'productId', select: 'name code' },
          { path: 'assignedWorkCenterId', select: 'name code' }
        ]
      })
      .sort({ sequenceNumber: 1 });
    res.json({ success: true, data: dispatchItems });
  } catch (error) { handleError(res, error); }
};
