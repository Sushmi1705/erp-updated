const mongoose = require('mongoose');
const { handleError } = require('../utils/errorHandler');
const { editable } = require('../utils/safeBody');
const { internalId } = require('../utils/internalId');
const ShopFloorOperator = require('../models/ShopFloorOperator');
const ShopFloorMachine = require('../models/ShopFloorMachine');
const ShopFloorDowntime = require('../models/ShopFloorDowntime');
const ShopFloorScrap = require('../models/ShopFloorScrap');
const { OperatorProfile, ShiftAssignment, TaskAllocation, PerformanceMetric } = require('../models/OperatorManagement');
const { MachineStateHeader, MachineAllocation, MachineEventLog } = require('../models/MachineUtilization');
const { DowntimeHeader, DowntimeCause, DowntimeImpact, DowntimeResolution } = require('../models/DowntimeManagement');
const { ScrapHeader, ScrapDetail, ScrapRootCause, ScrapDashboardMetrics } = require('../models/ScrapManagement');
const { Machine: MasterMachine } = require('../models/MasterMachine');
const { Material: MasterMaterial } = require('../models/MasterMaterial');
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

// ================= Operator Management =================

exports.getAllOperators = async (req, res) => {
  try {
    const ops = await ShopFloorOperator.find()
      .populate('workOrderId', 'workOrderNumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: ops });
  } catch (error) { handleError(res, error); }
};

exports.assignOperator = async (req, res) => {
  try {
    const op = await ShopFloorOperator.create(req.body);
    await logAudit('CREATE', 'ShopFloorOperator', op._id, req.user._id);
    res.status(201).json({ success: true, data: op });
  } catch (error) { handleError(res, error); }
};

exports.updateOperator = async (req, res) => {
  try {
    const { workOrderId, shift, assignedDate, performanceNotes, calculateProductivity } = req.body;
    const update = { workOrderId, shift, assignedDate, performanceNotes };
    if (calculateProductivity) {
       update.productivityScore = Math.floor(Math.random() * (100 - 70 + 1) + 70); // Mock 70-100%
    }
    const op = await ShopFloorOperator.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!op) return res.status(404).json({ success: false, message: 'Not found' });
    await logAudit('UPDATE', 'ShopFloorOperator', op._id, req.user._id);
    res.json({ success: true, data: op });
  } catch (error) { handleError(res, error); }
};

// ================= Machine Utilization =================

exports.getAllMachines = async (req, res) => {
  try {
    const machines = await ShopFloorMachine.find()
      .populate('machineId', 'name code')
      .populate('workOrderId', 'workOrderNumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: machines });
  } catch (error) { handleError(res, error); }
};

exports.allocateMachine = async (req, res) => {
  try {
    // Check if machine is already allocated to another active WO
    const existing = await ShopFloorMachine.findOne({ machineId: req.body.machineId, status: 'Running' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Machine is already running on another Work Order' });
    }
    const machine = await ShopFloorMachine.create(req.body);
    await logAudit('CREATE', 'ShopFloorMachine', machine._id, req.user._id);
    res.status(201).json({ success: true, data: machine });
  } catch (error) { handleError(res, error); }
};

exports.updateMachine = async (req, res) => {
  try {
    // Basic simulation for utilization calculation based on idle time
    if (req.body.idleTimeMinutes !== undefined) {
       // Assume a standard 480 minute (8 hr) shift
       const totalShiftMinutes = 480;
       const utilized = totalShiftMinutes - req.body.idleTimeMinutes;
       req.body.utilizationPercentage = Math.max(0, Math.round((utilized / totalShiftMinutes) * 100));
    }
    const machine = await ShopFloorMachine.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!machine) return res.status(404).json({ success: false, message: 'Not found' });
    await logAudit('UPDATE', 'ShopFloorMachine', machine._id, req.user._id);
    res.json({ success: true, data: machine });
  } catch (error) { handleError(res, error); }
};

// ================= Downtime Management =================

exports.getAllDowntimes = async (req, res) => {
  try {
    const dt = await ShopFloorDowntime.find()
      .populate('machineId', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: dt });
  } catch (error) { handleError(res, error); }
};

exports.recordDowntime = async (req, res) => {
  try {
    req.body.downtimeNumber = internalId('DT');

    // If unplanned downtime on a running machine, update active machine first
    if (req.body.type === 'Unplanned') {
       const activeMachine = await ShopFloorMachine.findOne({ machineId: req.body.machineId, status: 'Running' });
       if (activeMachine) {
         activeMachine.idleTimeMinutes += req.body.durationMinutes;
         const totalShiftMinutes = 480;
         const utilized = totalShiftMinutes - activeMachine.idleTimeMinutes;
         activeMachine.utilizationPercentage = Math.max(0, Math.round((utilized / totalShiftMinutes) * 100));
         await activeMachine.save();
       }
    }

    const dt = await ShopFloorDowntime.create(req.body);
    await logAudit('CREATE', 'ShopFloorDowntime', dt._id, req.user._id);
    res.status(201).json({ success: true, data: dt });
  } catch (error) { handleError(res, error); }
};

exports.updateDowntime = async (req, res) => {
  try {
    const dt = await ShopFloorDowntime.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!dt) return res.status(404).json({ success: false, message: 'Not found' });
    await logAudit('UPDATE', 'ShopFloorDowntime', dt._id, req.user._id);
    res.json({ success: true, data: dt });
  } catch (error) { handleError(res, error); }
};

// ================= Scrap Management =================

exports.getAllScrap = async (req, res) => {
  try {
    const scrap = await ShopFloorScrap.find()
      .populate('workOrderId', 'workOrderNumber')
      .populate('materialId', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: scrap });
  } catch (error) { handleError(res, error); }
};

exports.recordScrap = async (req, res) => {
  try {
    const material = await MasterMaterial.findById(req.body.materialId);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    req.body.scrapNumber = internalId('SCR');
    req.body.unitCost = material.standardCost;
    req.body.totalScrapCost = material.standardCost * req.body.scrapQuantity;

    const scrap = await ShopFloorScrap.create(req.body);

    // Post scrap loss to GL
    const scrapValue = (scrap.scrapQuantity || 0) * (scrap.unitCost || material?.standardCost || 0);
    if (scrapValue > 0) {
      try {
        const { JournalEntry, JournalEntryLine } = require('../models/GeneralLedger');
        const { generateDocNumber } = require('../utils/docNumbering');
        const jeNumber = await generateDocNumber('JE', 'JE', null);
        const je = await JournalEntry.create({
          Entry_Number: jeNumber,
          Entry_Date: new Date(),
          Source_Module: 'System',
          Description: `Scrap loss: ${scrap.scrapQuantity} units of ${scrap.materialId} from Work Order ${scrap.workOrderId}`,
          Status: 'Posted',
          createdBy: req.user?._id
        });
        // Debit: Scrap/Loss Account; Credit: Inventory/WIP Account
        await JournalEntryLine.insertMany([
          { Entry_ID: je._id, Line_Sequence: 1, Type: 'Debit', Amount: scrapValue, Reference_Type: 'Scrap', Reference_ID: String(scrap._id) },
          { Entry_ID: je._id, Line_Sequence: 2, Type: 'Credit', Amount: scrapValue, Reference_Type: 'Scrap', Reference_ID: String(scrap._id) }
        ]);
      } catch (glErr) {
        console.warn('[SCRAP-GL] Failed to post scrap GL entry:', glErr.message);
      }
    }

    await logAudit('CREATE', 'ShopFloorScrap', scrap._id, req.user._id);
    res.status(201).json({ success: true, data: scrap });
  } catch (error) { handleError(res, error); }
};

// ================= Operator Management (V2 Architecture) =================

exports.getV2Operators = async (req, res) => {
  try {
    const profiles = await OperatorProfile.find().sort({ createdAt: -1 });
    
    const fullProfiles = await Promise.all(profiles.map(async (op) => {
      // Find latest Shift Assignment
      const shift = await ShiftAssignment.findOne({ Operator_ID: op._id }).sort({ Assigned_Date: -1, createdAt: -1 });
      // Find active Task Allocation
      const activeTask = await TaskAllocation.findOne({ Operator_ID: op._id, Allocation_Status: 'Active' })
        .populate('WO_ID', 'WO_Number Status workOrderNumber status');
      // Find latest Performance Metric
      const metric = await PerformanceMetric.findOne({ Operator_ID: op._id }).sort({ Calculation_Date: -1, createdAt: -1 });

      return {
        ...op.toObject(),
        shift: shift ? shift.toObject() : null,
        activeTask: activeTask ? activeTask.toObject() : null,
        metric: metric ? metric.toObject() : null
      };
    }));

    res.json({ success: true, data: fullProfiles });
  } catch (error) { handleError(res, error); }
};

exports.createV2Operator = async (req, res) => {
  try {
    const { Emp_ID, Operator_Name, Skill_Level, Status } = req.body;
    const count = await OperatorProfile.countDocuments();
    const operator = await OperatorProfile.create({
      Operator_ID: `OP-${(count + 1).toString().padStart(3, '0')}`,
      User_ID: req.user?._id,
      Emp_ID: Emp_ID || internalId('EMP'),
      Operator_Name,
      Skill_Level: Skill_Level || 'Standard',
      Status: Status || 'Active'
    });
    await logAudit('CREATE', 'OperatorProfile', operator._id, req.user?._id);
    res.status(201).json({ success: true, data: operator });
  } catch (error) { handleError(res, error); }
};

exports.assignV2Shift = async (req, res) => {
  try {
    const { id } = req.params;
    const { Shift_ID, Assigned_Date, Attendance_Status, Clock_In_Time, Clock_Out_Time } = req.body;
    
    const op = await OperatorProfile.findById(id);
    if (!op) return res.status(404).json({ success: false, message: 'Operator profile not found' });

    const assignedDate = Assigned_Date ? new Date(Assigned_Date) : new Date();

    // Rule 4: Shift Conflict Prevention
    const existing = await ShiftAssignment.findOne({
      Operator_ID: op._id,
      Shift_ID,
      Assigned_Date: {
        $gte: new Date(assignedDate.setHours(0, 0, 0, 0)),
        $lte: new Date(assignedDate.setHours(23, 59, 59, 999))
      }
    });

    let shift;
    if (existing) {
      if (Attendance_Status) existing.Attendance_Status = Attendance_Status;
      if (Clock_In_Time) existing.Clock_In_Time = new Date(Clock_In_Time);
      if (Clock_Out_Time) existing.Clock_Out_Time = new Date(Clock_Out_Time);
      shift = await existing.save();
    } else {
      shift = await ShiftAssignment.create({
        Operator_ID: op._id,
        Shift_ID,
        Assigned_Date: assignedDate,
        Attendance_Status: Attendance_Status || 'Scheduled',
        Clock_In_Time: Clock_In_Time ? new Date(Clock_In_Time) : null,
        Clock_Out_Time: Clock_Out_Time ? new Date(Clock_Out_Time) : null
      });
    }

    await logAudit('UPDATE', 'ShiftAssignment', shift._id, req.user?._id);
    res.json({ success: true, data: shift });
  } catch (error) { handleError(res, error); }
};

exports.allocateV2Task = async (req, res) => {
  try {
    const { id } = req.params; // Operator_ID
    const { WO_ID } = req.body;

    const op = await OperatorProfile.findById(id);
    if (!op) return res.status(404).json({ success: false, message: 'Operator profile not found' });

    // Rule 5: Reassignment Constraints - Operator must be Present
    const activeShift = await ShiftAssignment.findOne({ Operator_ID: op._id }).sort({ Assigned_Date: -1, createdAt: -1 });
    if (!activeShift || activeShift.Attendance_Status !== 'Present') {
      return res.status(400).json({
        success: false,
        message: 'Operator must be marked "Present" in shift attendance before allocating or reassigning Work Orders.'
      });
    }

    // Rule 1: Single Active Task Limit - Close/Pause any existing active allocation
    await TaskAllocation.updateMany(
      { Operator_ID: op._id, Allocation_Status: 'Active' },
      { Allocation_Status: 'Reassigned', End_Time: new Date() }
    );

    const allocation = await TaskAllocation.create({
      Operator_ID: op._id,
      WO_ID: WO_ID || null,
      Allocation_Status: 'Active',
      Start_Time: new Date()
    });

    await logAudit('CREATE', 'TaskAllocation', allocation._id, req.user?._id, `Allocated WO: ${WO_ID}`);
    res.json({ success: true, data: allocation });
  } catch (error) { handleError(res, error); }
};

exports.calculateV2Productivity = async (req, res) => {
  try {
    const { id } = req.params; // Operator_ID
    const { Standard_Hours_Earned, Actual_Hours_Worked } = req.body;

    const op = await OperatorProfile.findById(id);
    if (!op) return res.status(404).json({ success: false, message: 'Operator profile not found' });

    const stdHours = Number(Standard_Hours_Earned) || (Math.floor(Math.random() * 4) + 6); // Mock 6-9 hrs if missing
    const actHours = Number(Actual_Hours_Worked) || 8;

    // Rule 2: Productivity Calculation Logic: (Standard_Hours_Earned / Actual_Hours_Worked) * 100
    let score = actHours > 0 ? (stdHours / actHours) * 100 : 100;
    if (score > 100) score = 100;
    if (score < 0) score = 0;
    score = Math.round(score * 100) / 100;

    const metric = await PerformanceMetric.create({
      Operator_ID: op._id,
      Calculation_Date: new Date(),
      Standard_Hours_Earned: stdHours,
      Actual_Hours_Worked: actHours,
      Productivity_Score: score,
      Defect_Rate_Percentage: Math.round(Math.random() * 3 * 100) / 100
    });

    await logAudit('CREATE', 'PerformanceMetric', metric._id, req.user?._id, `Score: ${score}%`);
    res.json({ success: true, data: metric });
  } catch (error) { handleError(res, error); }
};

// ================= Machine Utilization (V2 Architecture) =================

exports.getV2MachineStates = async (req, res) => {
  try {
    // Ensure all factory machines have a MachineStateHeader
    const allMachines = await MasterMachine.find({ status: 'Active' });
    for (const m of allMachines) {
      const existing = await MachineStateHeader.findOne({ Machine_ID: m._id });
      if (!existing) {
        const count = await MachineStateHeader.countDocuments();
        await MachineStateHeader.create({
          Machine_State_ID: `MSH-${(count + 1).toString().padStart(3, '0')}`,
          Machine_ID: m._id,
          Current_Status: 'Idle',
          Live_Utilization_Percentage: 100
        });
      }
    }

    const states = await MachineStateHeader.find()
      .populate('Machine_ID')
      .populate('Current_WO_ID', 'WO_Number Status workOrderNumber status')
      .sort({ createdAt: -1 });
    
    // Also fetch active allocations
    const fullStates = await Promise.all(states.map(async (st) => {
      const activeAlloc = await MachineAllocation.findOne({ Machine_ID: st.Machine_ID?._id, Allocation_Status: 'Active' })
        .populate('WO_ID', 'WO_Number Status workOrderNumber status');
      const recentLogs = await MachineEventLog.find({ Machine_ID: st.Machine_ID?._id }).sort({ Start_Time: -1 }).limit(5);

      return {
        ...st.toObject(),
        activeAllocation: activeAlloc ? activeAlloc.toObject() : null,
        recentLogs: recentLogs.map(l => l.toObject())
      };
    }));

    res.json({ success: true, data: fullStates });
  } catch (error) { handleError(res, error); }
};

exports.allocateV2Machine = async (req, res) => {
  try {
    const { Machine_ID, WO_ID } = req.body;
    
    if (!Machine_ID || !WO_ID) {
      return res.status(400).json({ success: false, message: 'Machine and Work Order are required' });
    }

    const { WOHeader, WorkOrder } = require('../models/WorkOrder');
    let targetWoId = WO_ID;
    let woHeader = await WOHeader.findById(WO_ID);

    if (!woHeader) {
      const v1Wo = await WorkOrder.findById(WO_ID);
      if (v1Wo) {
        const Plant = mongoose.model('Plant');
        const defaultPlant = await Plant.findOne({});
        woHeader = await WOHeader.create({
          WO_Number: v1Wo.workOrderNumber,
          Plant_ID: v1Wo.plantId || defaultPlant?._id,
          Status: 'Released'
        });
        targetWoId = woHeader._id;
      }
    }

    let state = await MachineStateHeader.findOne({ Machine_ID });
    if (!state) {
      const count = await MachineStateHeader.countDocuments();
      state = await MachineStateHeader.create({
        Machine_State_ID: `MSH-${(count + 1).toString().padStart(3, '0')}`,
        Machine_ID,
        Current_Status: 'Idle'
      });
    }

    // Rule 5: Allocation Exclusivity
    if (state.Current_Status === 'Running' && state.Current_WO_ID && state.Current_WO_ID.toString() !== targetWoId.toString()) {
      // Force pause previous state
      state.Current_Status = 'Idle';
      await state.save();
    }

    // Close previous active allocations
    await MachineAllocation.updateMany(
      { Machine_ID, Allocation_Status: 'Active' },
      { Allocation_Status: 'Released', End_Timestamp: new Date() }
    );

    const countAlloc = await MachineAllocation.countDocuments();
    const allocation = await MachineAllocation.create({
      Allocation_ID: `MAL-${(countAlloc + 1).toString().padStart(3, '0')}`,
      Machine_ID,
      WO_ID: targetWoId,
      Allocated_By_User_ID: req.user?._id || null,
      Allocation_Status: 'Active',
      Start_Timestamp: new Date()
    });

    state.Current_WO_ID = targetWoId;
    await state.save();

    await logAudit('CREATE', 'MachineAllocation', allocation._id, req.user?._id, `Allocated to WO ${targetWoId}`);
    res.json({ success: true, data: allocation });
  } catch (error) { handleError(res, error); }
};

exports.setV2MachineRunning = async (req, res) => {
  try {
    const { id } = req.params; // MachineStateHeader _id or Machine_ID
    let state = await MachineStateHeader.findById(id);
    if (!state) state = await MachineStateHeader.findOne({ Machine_ID: id });
    if (!state) return res.status(404).json({ success: false, message: 'Machine state record not found' });

    // Rule 1: "Set Running" Prerequisite - Must have an allocated WO
    if (!state.Current_WO_ID) {
      const activeAlloc = await MachineAllocation.findOne({ Machine_ID: state.Machine_ID, Allocation_Status: 'Active' });
      if (!activeAlloc) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set machine to Running without an allocated Work Order. Please allocate a Work Order first.'
        });
      }
      state.Current_WO_ID = activeAlloc.WO_ID;
    }

    const now = new Date();

    // Rule 2: State Mutability - Close previous active event log
    const openLog = await MachineEventLog.findOne({ Machine_ID: state.Machine_ID, End_Time: null });
    if (openLog) {
      openLog.End_Time = now;
      openLog.Duration_Minutes = Math.max(0, Math.round((now - new Date(openLog.Start_Time)) / (1000 * 60)));
      await openLog.save();
    }

    // Create new Run log
    const logCount = await MachineEventLog.countDocuments();
    await MachineEventLog.create({
      Event_Log_ID: `MEL-${(logCount + 1).toString().padStart(3, '0')}`,
      Machine_ID: state.Machine_ID,
      WO_ID: state.Current_WO_ID,
      Event_Type: 'Run',
      Start_Time: now,
      Logged_By_User_ID: req.user?._id
    });

    state.Current_Status = 'Running';
    state.Last_State_Change = now;
    state.Current_Idle_Time_Mins = 0;

    // Rule 3: Utilization Engine Calculation
    const allLogs = await MachineEventLog.find({ Machine_ID: state.Machine_ID });
    let totalRun = 0, totalIdle = 0, totalSetup = 0;
    allLogs.forEach(l => {
      const dur = l.Duration_Minutes || 0;
      if (l.Event_Type === 'Run') totalRun += dur;
      if (l.Event_Type === 'Idle') totalIdle += dur;
      if (l.Event_Type === 'Setup') totalSetup += dur;
    });
    const denom = totalRun + totalIdle + totalSetup;
    state.Live_Utilization_Percentage = denom > 0 ? Math.round((totalRun / denom) * 100 * 100) / 100 : 100;

    await state.save();
    await logAudit('UPDATE', 'MachineStateHeader', state._id, req.user?._id, 'Set status to Running');
    res.json({ success: true, data: state });
  } catch (error) { handleError(res, error); }
};

exports.logV2MachineIdle = async (req, res) => {
  try {
    const { id } = req.params;
    const { Idle_Reason_Code_ID, Notes } = req.body;

    let state = await MachineStateHeader.findById(id);
    if (!state) state = await MachineStateHeader.findOne({ Machine_ID: id });
    if (!state) return res.status(404).json({ success: false, message: 'Machine state record not found' });

    const now = new Date();

    // Rule 4: "Log Idle Time" Constraint
    const openLog = await MachineEventLog.findOne({ Machine_ID: state.Machine_ID, End_Time: null });
    if (openLog) {
      openLog.End_Time = now;
      openLog.Duration_Minutes = Math.max(0, Math.round((now - new Date(openLog.Start_Time)) / (1000 * 60)));
      await openLog.save();
    }

    const logCount = await MachineEventLog.countDocuments();
    await MachineEventLog.create({
      Event_Log_ID: `MEL-${(logCount + 1).toString().padStart(3, '0')}`,
      Machine_ID: state.Machine_ID,
      WO_ID: state.Current_WO_ID || null,
      Event_Type: 'Idle',
      Start_Time: now,
      Idle_Reason_Code_ID: Idle_Reason_Code_ID || Notes || 'Material Shortage',
      Logged_By_User_ID: req.user?._id
    });

    state.Current_Status = 'Idle';
    state.Last_State_Change = now;
    state.Current_Idle_Time_Mins = (state.Current_Idle_Time_Mins || 0) + 15; // Incremental estimate

    // Recalculate Utilization
    const allLogs = await MachineEventLog.find({ Machine_ID: state.Machine_ID });
    let totalRun = 0, totalIdle = 0, totalSetup = 0;
    allLogs.forEach(l => {
      const dur = l.Duration_Minutes || 0;
      if (l.Event_Type === 'Run') totalRun += dur;
      if (l.Event_Type === 'Idle') totalIdle += dur;
      if (l.Event_Type === 'Setup') totalSetup += dur;
    });
    const denom = totalRun + totalIdle + totalSetup;
    state.Live_Utilization_Percentage = denom > 0 ? Math.round((totalRun / denom) * 100 * 100) / 100 : 90;

    await state.save();
    await logAudit('UPDATE', 'MachineStateHeader', state._id, req.user?._id, 'Set status to Idle');
    res.json({ success: true, data: state });
  } catch (error) { handleError(res, error); }
};

exports.releaseV2MachineAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    let state = await MachineStateHeader.findById(id);
    if (!state) state = await MachineStateHeader.findOne({ Machine_ID: id });
    if (!state) return res.status(404).json({ success: false, message: 'Machine state record not found' });

    await MachineAllocation.updateMany(
      { Machine_ID: state.Machine_ID, Allocation_Status: 'Active' },
      { Allocation_Status: 'Released', End_Timestamp: new Date() }
    );

    state.Current_WO_ID = null;
    state.Current_Status = 'Idle';
    await state.save();

    res.json({ success: true, message: 'Machine allocation released successfully' });
  } catch (error) { handleError(res, error); }
};

// ================= Downtime Management (V2 Architecture) =================

exports.getV2Downtimes = async (req, res) => {
  try {
    const headers = await DowntimeHeader.find().populate('Hardware_ID').sort({ createdAt: -1 });
    
    const fullDowntimes = await Promise.all(headers.map(async (h) => {
      const cause = await DowntimeCause.findOne({ DT_Log_ID: h._id });
      const impact = await DowntimeImpact.findOne({ DT_Log_ID: h._id }).populate('Affected_WO_ID', 'WO_Number workOrderNumber');
      const resolution = await DowntimeResolution.findOne({ DT_Log_ID: h._id }).populate('Resolved_By_User_ID', 'name username');

      return {
        ...h.toObject(),
        cause: cause ? cause.toObject() : null,
        impact: impact ? impact.toObject() : null,
        resolution: resolution ? resolution.toObject() : null
      };
    }));

    res.json({ success: true, data: fullDowntimes });
  } catch (error) { handleError(res, error); }
};

exports.createV2Downtime = async (req, res) => {
  try {
    const { Hardware_ID, DT_Type, Reason_Description, Component_Failed, Impact_Analysis_Notes, Affected_WO_ID } = req.body;
    
    const count = await DowntimeHeader.countDocuments();
    const dtLogNum = internalId('DT');
    
    const header = await DowntimeHeader.create({
      DT_Log_ID: `DTL-${(count + 1).toString().padStart(3, '0')}`,
      DT_Log_Number: dtLogNum,
      Hardware_ID,
      Status: 'Active',
      Start_Time: new Date(),
      Logged_Date: new Date()
    });

    await DowntimeCause.create({
      DT_Log_ID: header._id,
      DT_Type: DT_Type || 'Unplanned',
      Reason_Description: Reason_Description || 'Unspecified Hardware Stoppage',
      Component_Failed: Component_Failed || 'N/A'
    });

    await DowntimeImpact.create({
      DT_Log_ID: header._id,
      Impact_Analysis_Notes: Impact_Analysis_Notes || '',
      Affected_WO_ID: Affected_WO_ID || null
    });

    // Rule 1: Machine Utilization Sync - Immediately set Machine state to Offline
    let machineState = await MachineStateHeader.findOne({ Machine_ID: Hardware_ID });
    if (!machineState) {
      const mcount = await MachineStateHeader.countDocuments();
      machineState = await MachineStateHeader.create({
        Machine_State_ID: `MSH-${(mcount + 1).toString().padStart(3, '0')}`,
        Machine_ID: Hardware_ID,
        Current_Status: 'Offline'
      });
    } else {
      machineState.Current_Status = 'Offline';
      machineState.Last_State_Change = new Date();
      await machineState.save();
    }

    await logAudit('CREATE', 'DowntimeHeader', header._id, req.user?._id, `Recorded Downtime for Hardware ${Hardware_ID}`);
    res.status(201).json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

exports.resolveV2Downtime = async (req, res) => {
  try {
    const { id } = req.params;
    const { Reason_Description, Impact_Analysis_Notes, Corrective_Action_Taken } = req.body;

    const header = await DowntimeHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Downtime record not found' });

    // Rule 5: Edit Immutability
    if (header.Status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Closed Downtime records are immutable and cannot be modified.' });
    }

    // Rule 4: Mandatory Reason Codes & Impact Notes
    if (!Reason_Description || !Impact_Analysis_Notes) {
      return res.status(400).json({
        success: false,
        message: 'Reason Description and Impact Analysis Notes are mandatory to resolve a downtime event.'
      });
    }

    const now = new Date();
    header.Status = 'Resolved';
    header.End_Time = now;
    
    // Rule 2: Duration Calculation Logic
    const durationMs = now - new Date(header.Start_Time);
    header.Duration_Minutes = Math.max(1, Math.round(durationMs / (1000 * 60)));
    await header.save();

    // Update Cause & Impact
    let cause = await DowntimeCause.findOne({ DT_Log_ID: header._id });
    if (cause) {
      cause.Reason_Description = Reason_Description;
      await cause.save();
    }

    let impact = await DowntimeImpact.findOne({ DT_Log_ID: header._id });
    if (impact) {
      impact.Impact_Analysis_Notes = Impact_Analysis_Notes;
      await impact.save();
    }

    await DowntimeResolution.create({
      DT_Log_ID: header._id,
      Resolved_By_User_ID: req.user?._id,
      Corrective_Action_Taken: Corrective_Action_Taken || 'Resolved stoppage issue',
      Resolution_Timestamp: now
    });

    // Reset machine state to Idle when resolved
    const machineState = await MachineStateHeader.findOne({ Machine_ID: header.Hardware_ID });
    if (machineState) {
      machineState.Current_Status = 'Idle';
      machineState.Last_State_Change = now;
      await machineState.save();
    }

    await logAudit('UPDATE', 'DowntimeHeader', header._id, req.user?._id, `Resolved event. Duration: ${header.Duration_Minutes} mins`);
    res.json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

exports.closeV2Downtime = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await DowntimeHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Downtime record not found' });

    header.Status = 'Closed';
    await header.save();

    await logAudit('UPDATE', 'DowntimeHeader', header._id, req.user?._id, 'Closed Downtime Log (Locked)');
    res.json({ success: true, message: 'Downtime record closed and locked successfully.' });
  } catch (error) { handleError(res, error); }
};

// ================= Scrap Management (V2 Architecture) =================

exports.getV2ScrapLogs = async (req, res) => {
  try {
    const headers = await ScrapHeader.find().populate('WO_ID', 'WO_Number Status workOrderNumber status').sort({ createdAt: -1 });
    
    const fullLogs = await Promise.all(headers.map(async (h) => {
      const detail = await ScrapDetail.findOne({ Scrap_Log_ID: h._id }).populate('Material_ID', 'name code standardCost');
      const rootCause = await ScrapRootCause.findOne({ Scrap_Log_ID: h._id });
      return {
        ...h.toObject(),
        detail: detail ? detail.toObject() : null,
        rootCause: rootCause ? rootCause.toObject() : null
      };
    }));

    // Fetch dashboard KPI metrics
    let metrics = await ScrapDashboardMetrics.findOne();
    if (!metrics) {
      metrics = { Total_Financial_Impact: 0, Total_Items_Scrapped: 0, Total_Scrap_Incidents: 0 };
    }

    res.json({ success: true, data: fullLogs, metrics });
  } catch (error) { handleError(res, error); }
};

exports.createV2ScrapLog = async (req, res) => {
  try {
    const { WO_ID, Material_ID, Material_Type, Quantity, Root_Cause_Description } = req.body;

    // Rule 3: Mandatory Root Cause Analysis
    if (!Root_Cause_Description || !Root_Cause_Description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Root Cause Analysis description is strictly required to log manufacturing scrap.'
      });
    }

    // Rule 1: Dynamic Cost Calculation from Master Material
    const material = await MasterMaterial.findById(Material_ID);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found in Master registry' });

    /* Scrap is valued at what the part costs. It used to fall back to ₹50,
       which put an invented rupee figure on every scrap record for a material
       with no standard cost — and the Production Report totals those. */
    const unitCost = Number(material.standardCost) || Number(material.price) || 0;
    const qty = Number(Quantity) || 1;
    const totalValueLost = Math.round(unitCost * qty * 100) / 100;

    const count = await ScrapHeader.countDocuments();
    const scrapLogNum = internalId('SCR');

    const header = await ScrapHeader.create({
      Scrap_Log_ID: `SCL-${(count + 1).toString().padStart(3, '0')}`,
      Scrap_Log_Number: scrapLogNum,
      WO_ID,
      Logged_By_User_ID: req.user?._id,
      Status: 'Posted', // Post immediately to lock financial impact
      Logged_Date: new Date()
    });

    const detail = await ScrapDetail.create({
      Scrap_Log_ID: header._id,
      Material_ID,
      Material_Type: Material_Type || 'Component',
      Quantity: qty,
      Unit_Cost: unitCost,
      Total_Value_Lost: totalValueLost
    });

    await ScrapRootCause.create({
      Scrap_Log_ID: header._id,
      Root_Cause_Description
    });

    // Rule 5: Update KPI Dashboard Metrics Cache
    let metrics = await ScrapDashboardMetrics.findOne();
    if (!metrics) {
      metrics = await ScrapDashboardMetrics.create({
        Total_Financial_Impact: totalValueLost,
        Total_Items_Scrapped: qty,
        Total_Scrap_Incidents: 1,
        Last_Updated: new Date()
      });
    } else {
      metrics.Total_Financial_Impact = (metrics.Total_Financial_Impact || 0) + totalValueLost;
      metrics.Total_Items_Scrapped = (metrics.Total_Items_Scrapped || 0) + qty;
      metrics.Total_Scrap_Incidents = (metrics.Total_Scrap_Incidents || 0) + 1;
      metrics.Last_Updated = new Date();
      await metrics.save();
    }

    // Post scrap loss to GL
    if (totalValueLost > 0) {
      try {
        const { JournalEntry, JournalEntryLine } = require('../models/GeneralLedger');
        const { generateDocNumber } = require('../utils/docNumbering');
        const jeNumber = await generateDocNumber('JE', 'JE', null);
        const je = await JournalEntry.create({
          Entry_Number: jeNumber,
          Entry_Date: new Date(),
          Source_Module: 'System',
          Description: `Scrap loss: ${qty} units of ${Material_ID} from Work Order ${WO_ID}`,
          Status: 'Posted',
          createdBy: req.user?._id
        });
        // Debit: Scrap/Loss Account; Credit: Inventory/WIP Account
        await JournalEntryLine.insertMany([
          { Entry_ID: je._id, Line_Sequence: 1, Type: 'Debit', Amount: totalValueLost, Reference_Type: 'Scrap', Reference_ID: String(header._id) },
          { Entry_ID: je._id, Line_Sequence: 2, Type: 'Credit', Amount: totalValueLost, Reference_Type: 'Scrap', Reference_ID: String(header._id) }
        ]);
      } catch (glErr) {
        console.warn('[SCRAP-GL] Failed to post scrap GL entry:', glErr.message);
      }
    }

    await logAudit('CREATE', 'ScrapHeader', header._id, req.user?._id, `Scrapped Qty: ${qty}, Value Lost: $${totalValueLost}`);
    res.status(201).json({ success: true, data: { ...header.toObject(), detail, rootCause: { Root_Cause_Description } } });
  } catch (error) { handleError(res, error); }
};

exports.postV2ScrapLog = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await ScrapHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Scrap record not found' });

    // Rule 2: Financial Immutability
    if (header.Status === 'Posted') {
      return res.status(400).json({ success: false, message: 'Posted Scrap records are permanently locked and financial impact is immutable.' });
    }

    header.Status = 'Posted';
    await header.save();

    await logAudit('UPDATE', 'ScrapHeader', header._id, req.user?._id, 'Posted Scrap Log (Locked)');
    res.json({ success: true, message: 'Scrap log successfully posted and financial impact locked.' });
  } catch (error) { handleError(res, error); }
};
