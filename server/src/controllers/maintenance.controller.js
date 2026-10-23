const { handleError } = require('../utils/errorHandler');
const { editable } = require('../utils/safeBody');
const { internalId } = require('../utils/internalId');
const MaintenancePreventive = require('../models/MaintenancePreventive');
const MaintenanceBreakdown = require('../models/MaintenanceBreakdown');
const MaintenanceSparePart = require('../models/MaintenanceSparePart');
const { Material: MasterMaterial } = require('../models/MasterMaterial');
const { Machine: MasterMachine } = require('../models/MasterMachine');
const { PreventiveMaintenanceHeader, MaintenanceTaskChecklist, SparePartsConsumption } = require('../models/PreventiveMaintenance');
const { BreakdownIncidentHeader, RepairActionLog, BreakdownSparePartsConsumption, BreakdownCostAnalysis } = require('../models/BreakdownMaintenance');
const { SparePartLedger, PartActivityLog, MaintenanceLinkage } = require('../models/SparePartsManagement');
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

// ================= Preventive Maintenance =================

exports.getAllPreventive = async (req, res) => {
  try {
    const pm = await MaintenancePreventive.find()
      .populate('machineId', 'name code')
      .sort({ scheduledDate: 1 });
    res.json({ success: true, data: pm });
  } catch (error) { handleError(res, error); }
};

exports.createPreventive = async (req, res) => {
  try {
    req.body.scheduleNumber = internalId('PM');
    const pm = await MaintenancePreventive.create(req.body);
    await logAudit('CREATE', 'MaintenancePreventive', pm._id, req.user._id);
    res.status(201).json({ success: true, data: pm });
  } catch (error) { handleError(res, error); }
};

exports.updatePreventive = async (req, res) => {
  try {
    if (req.body.status === 'Completed' && !req.body.executionDate) {
      req.body.executionDate = new Date();
    }
    const pm = await MaintenancePreventive.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!pm) return res.status(404).json({ success: false, message: 'Not found' });
    await logAudit('UPDATE', 'MaintenancePreventive', pm._id, req.user._id);
    res.json({ success: true, data: pm });
  } catch (error) { handleError(res, error); }
};

// ================= Breakdown Maintenance =================

exports.getAllBreakdowns = async (req, res) => {
  try {
    const bd = await MaintenanceBreakdown.find()
      .populate('machineId', 'name code')
      .sort({ reportedDate: -1 });
    res.json({ success: true, data: bd });
  } catch (error) { handleError(res, error); }
};

exports.reportBreakdown = async (req, res) => {
  try {
    req.body.breakdownNumber = internalId('BD');
    const bd = await MaintenanceBreakdown.create(req.body);
    await logAudit('CREATE', 'MaintenanceBreakdown', bd._id, req.user._id);
    res.status(201).json({ success: true, data: bd });
  } catch (error) { handleError(res, error); }
};

exports.updateBreakdown = async (req, res) => {
  try {
    if (req.body.repairStatus === 'Resolved' && !req.body.resolutionDate) {
      req.body.resolutionDate = new Date();
      // Auto-calculate downtime if not provided
      const existing = await MaintenanceBreakdown.findById(req.params.id);
      if (existing && existing.reportedDate && !req.body.downtimeDurationHours) {
        const diffMs = new Date(req.body.resolutionDate) - new Date(existing.reportedDate);
        req.body.downtimeDurationHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60))); // convert to hours
      }
    }
    const bd = await MaintenanceBreakdown.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!bd) return res.status(404).json({ success: false, message: 'Not found' });
    await logAudit('UPDATE', 'MaintenanceBreakdown', bd._id, req.user._id);
    res.json({ success: true, data: bd });
  } catch (error) { handleError(res, error); }
};


// ================= Spare Parts Management =================

exports.getAllSpareParts = async (req, res) => {
  try {
    const parts = await MaintenanceSparePart.find()
      .populate('materialId', 'name code standardCost')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: parts });
  } catch (error) { handleError(res, error); }
};

exports.recordSparePartTransaction = async (req, res) => {
  try {
    const material = await MasterMaterial.findById(req.body.materialId);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const quantity = Number(req.body.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    req.body.transactionId = internalId('SPT');
    req.body.unitCost = material.standardCost;
    req.body.totalCost = material.standardCost * quantity;

    const spt = await MaintenanceSparePart.create(req.body);
    await logAudit('CREATE', 'MaintenanceSparePart', spt._id, req.user._id);
    res.status(201).json({ success: true, data: spt });
  } catch (error) { handleError(res, error); }
};

exports.getSparePartInventory = async (req, res) => {
  try {
    const transactions = await MaintenanceSparePart.find().populate('materialId', 'name code standardCost');
    const inventory = {};

    transactions.forEach(tx => {
      if (!tx.materialId) return;
      const matId = tx.materialId._id.toString();
      if (!inventory[matId]) {
        inventory[matId] = {
          material: tx.materialId,
          quantityOnHand: 0,
          totalValue: 0
        };
      }
      if (tx.transactionType === 'Receipt') {
        inventory[matId].quantityOnHand += tx.quantity;
        inventory[matId].totalValue += tx.totalCost;
      } else if (tx.transactionType === 'Consumption') {
        inventory[matId].quantityOnHand -= tx.quantity;
        inventory[matId].totalValue -= tx.totalCost;
      }
    });

    res.json({ success: true, data: Object.values(inventory) });
  } catch (error) { handleError(res, error); }
};


// ================= Maintenance Analytics =================

exports.getAnalytics = async (req, res) => {
  try {
    const breakdowns = await MaintenanceBreakdown.find({ repairStatus: 'Resolved' }).populate('machineId', 'name code');
    const spareParts = await MaintenanceSparePart.find({ transactionType: 'Consumption' });

    // 1. MTTR (Mean Time To Repair) & Downtime Cost
    let totalDowntimeHours = 0;
    let totalDowntimeCost = 0;
    let totalBreakdowns = breakdowns.length;

    const machineStats = {};

    breakdowns.forEach(bd => {
      if (!bd.machineId) return;
      totalDowntimeHours += bd.downtimeDurationHours;
      totalDowntimeCost += (bd.downtimeDurationHours * bd.downtimeCostPerHour);
      
      const mId = bd.machineId._id.toString();
      if (!machineStats[mId]) {
        machineStats[mId] = { machine: bd.machineId, breakdownCount: 0, totalDowntimeHours: 0 };
      }
      machineStats[mId].breakdownCount++;
      machineStats[mId].totalDowntimeHours += bd.downtimeDurationHours;
    });

    const mttr = totalBreakdowns > 0 ? (totalDowntimeHours / totalBreakdowns).toFixed(2) : 0;

    // 2. MTBF (Mean Time Between Failures)
    // Assume a factory runs 24/7. So running hours = (Now - 30 days ago) = 720 hours per machine
    // Simplified calculation for demonstration. Real MTBF requires exact uptime tracking.
    const assumedRunningHoursPerMachine = 720; 
    const mtbfData = Object.values(machineStats).map(stat => {
      const runningHours = Math.max(0, assumedRunningHoursPerMachine - stat.totalDowntimeHours);
      const mtbf = (runningHours / stat.breakdownCount).toFixed(2);
      return {
        machine: stat.machine,
        mtbf: parseFloat(mtbf),
        breakdownCount: stat.breakdownCount
      };
    });

    // Average MTBF across all impacted machines
    const overallMtbf = mtbfData.length > 0 
      ? (mtbfData.reduce((acc, curr) => acc + curr.mtbf, 0) / mtbfData.length).toFixed(2) 
      : 0;

    // 3. Maintenance Cost Analysis
    let totalSparePartCost = 0;
    spareParts.forEach(sp => {
      totalSparePartCost += sp.totalCost;
    });

    const totalMaintenanceCost = totalDowntimeCost + totalSparePartCost;

    res.json({
      success: true,
      data: {
        mttr: parseFloat(mttr),
        mtbf: parseFloat(overallMtbf),
        machineMtbf: mtbfData,
        totalBreakdowns,
        totalDowntimeHours,
        totalDowntimeCost,
        totalSparePartCost,
        totalMaintenanceCost
      }
    });
  } catch (error) { handleError(res, error); }
};

// ================= Preventive Maintenance (V2 Architecture) =================

exports.getV2PMSchedules = async (req, res) => {
  try {
    const headers = await PreventiveMaintenanceHeader.find()
      .populate('Machine_ID', 'name code status location')
      .populate('Technician_ID', 'name username')
      .sort({ Scheduled_Date: 1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fullSchedules = await Promise.all(headers.map(async (h) => {
      // Rule 3: Dynamic Overdue Flagging
      if (h.Status === 'Scheduled' && new Date(h.Scheduled_Date) < today) {
        h.Status = 'Overdue';
        await h.save();
      }

      const tasks = await MaintenanceTaskChecklist.find({ PM_ID: h._id }).sort({ Sequence_Number: 1 });
      const spares = await SparePartsConsumption.find({ PM_ID: h._id }).populate('Spare_Part_ID', 'name code quantityOnHand');

      return {
        ...h.toObject(),
        tasks: tasks.map(t => t.toObject()),
        spares: spares.map(s => s.toObject())
      };
    }));

    res.json({ success: true, data: fullSchedules });
  } catch (error) { handleError(res, error); }
};

exports.createV2PMSchedule = async (req, res) => {
  try {
    const { Machine_ID, Task_Summary, Scheduled_Date, Maintenance_Type, Technician_ID, Tasks } = req.body;

    if (!Machine_ID || !Task_Summary || !Scheduled_Date) {
      return res.status(400).json({ success: false, message: 'Machine, Task Summary, and Scheduled Date are required.' });
    }

    const count = await PreventiveMaintenanceHeader.countDocuments();
    const pmId = internalId('PM');

    const header = await PreventiveMaintenanceHeader.create({
      PM_ID: pmId,
      Machine_ID,
      Task_Summary,
      Status: 'Scheduled',
      Technician_ID: Technician_ID || req.user?._id,
      Scheduled_Date: new Date(Scheduled_Date),
      Maintenance_Type: Maintenance_Type || 'Time-Based'
    });

    // Seed tasks checklist if provided
    if (Array.isArray(Tasks) && Tasks.length > 0) {
      for (let i = 0; i < Tasks.length; i++) {
        await MaintenanceTaskChecklist.create({
          PM_ID: header._id,
          Sequence_Number: i + 1,
          Task_Description: Tasks[i],
          Is_Completed: false
        });
      }
    } else {
      // Seed default checklist tasks
      const defaultTasks = [
        'Inspect mechanical drives and lubricate bearings',
        'Clean air filters and check pneumatic line pressures',
        'Verify electrical wiring connections and safety sensors'
      ];
      for (let i = 0; i < defaultTasks.length; i++) {
        await MaintenanceTaskChecklist.create({
          PM_ID: header._id,
          Sequence_Number: i + 1,
          Task_Description: defaultTasks[i],
          Is_Completed: false
        });
      }
    }

    await logAudit('CREATE', 'PreventiveMaintenanceHeader', header._id, req.user?._id, `Scheduled PM ${pmId} for Machine ${Machine_ID}`);
    res.status(201).json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

exports.updateV2PMStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { Status, Executed_Date, Tasks_Completed } = req.body;

    const header = await PreventiveMaintenanceHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'PM Record not found' });

    // Rule 4: Technician Assignment Validation
    if (!header.Technician_ID && req.user?._id) {
      header.Technician_ID = req.user._id;
    }

    if (Status === 'In Progress') {
      header.Status = 'In Progress';
      // Rule 2: Machine Availability Sync (Set machine to 'Under Maintenance')
      if (header.Machine_ID) {
        await MasterMachine.findByIdAndUpdate(header.Machine_ID, { status: 'Under Maintenance' });
      }
    } else if (Status === 'Completed') {
      // Rule 1: Execution Date Constraint
      const execDate = Executed_Date ? new Date(Executed_Date) : new Date();
      const today = new Date();
      if (execDate > today) {
        return res.status(400).json({
          success: false,
          message: 'Execution Date Constraint Error: Executed Date cannot be set in the future.'
        });
      }

      header.Status = 'Completed';
      header.Executed_Date = execDate;

      // Update checklist items to completed
      await MaintenanceTaskChecklist.updateMany({ PM_ID: header._id }, { Is_Completed: true });

      // Rule 2: Machine Availability Sync (Restore machine to 'Active')
      if (header.Machine_ID) {
        await MasterMachine.findByIdAndUpdate(header.Machine_ID, { status: 'Active' });
      }

      // Rule 5: Inventory Deduction for Consumed Spares
      const spares = await SparePartsConsumption.find({ PM_ID: header._id });
      for (const sp of spares) {
        if (sp.Spare_Part_ID) {
          await MasterMaterial.findByIdAndUpdate(sp.Spare_Part_ID, { $inc: { quantityOnHand: -sp.Actual_Quantity_Consumed } });
        }
      }
    } else if (Status === 'Cancelled') {
      header.Status = 'Cancelled';
      if (header.Machine_ID) {
        await MasterMachine.findByIdAndUpdate(header.Machine_ID, { status: 'Active' });
      }
    }

    await header.save();

    await logAudit('UPDATE', 'PreventiveMaintenanceHeader', header._id, req.user?._id, `Updated PM ${header.PM_ID} Status to ${header.Status}`);
    res.json({ success: true, message: `PM status updated to ${header.Status}`, data: header });
  } catch (error) { handleError(res, error); }
};

exports.logV2PMSpares = async (req, res) => {
  try {
    const { id } = req.params;
    const { Spare_Part_ID, Actual_Quantity_Consumed } = req.body;

    const header = await PreventiveMaintenanceHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'PM Record not found' });

    const qty = Number(Actual_Quantity_Consumed) || 1;
    const part = await SparePartsConsumption.create({
      PM_ID: header._id,
      Spare_Part_ID,
      Planned_Quantity: qty,
      Actual_Quantity_Consumed: qty
    });

    await logAudit('CREATE', 'SparePartsConsumption', part._id, req.user?._id, `Logged spare part consumption for PM ${header.PM_ID}`);
    res.status(201).json({ success: true, data: part });
  } catch (error) { handleError(res, error); }
};

// ================= Breakdown Maintenance (V2 Architecture) =================

exports.getV2Breakdowns = async (req, res) => {
  try {
    const headers = await BreakdownIncidentHeader.find()
      .populate('Machine_ID', 'name code status hourlyDowntimeCost')
      .populate('Reported_By_ID', 'name username')
      .sort({ Reported_Datetime: -1 });

    const fullIncidents = await Promise.all(headers.map(async (h) => {
      const repairLogs = await RepairActionLog.find({ Incident_ID: h._id }).populate('Technician_ID', 'name username');
      const spares = await BreakdownSparePartsConsumption.find({ Incident_ID: h._id }).populate('Spare_Part_ID', 'name code standardCost');
      const costAnalysis = await BreakdownCostAnalysis.findOne({ Incident_ID: h._id });

      return {
        ...h.toObject(),
        repairLogs: repairLogs.map(r => r.toObject()),
        spares: spares.map(s => s.toObject()),
        costAnalysis: costAnalysis ? costAnalysis.toObject() : null
      };
    }));

    res.json({ success: true, data: fullIncidents });
  } catch (error) { handleError(res, error); }
};

exports.reportV2Breakdown = async (req, res) => {
  try {
    const { Machine_ID, Reported_Issue } = req.body;

    if (!Machine_ID || !Reported_Issue) {
      return res.status(400).json({ success: false, message: 'Machine and Reported Issue description are required.' });
    }

    const count = await BreakdownIncidentHeader.countDocuments();
    const bdId = internalId('BD');

    const header = await BreakdownIncidentHeader.create({
      Incident_ID: bdId,
      Machine_ID,
      Reported_Issue,
      Reported_By_ID: req.user?._id,
      Reported_Datetime: new Date(),
      Status: 'Open'
    });

    // Rule 1: Immediate Equipment Lock (Set Machine to 'Down/Unavailable')
    await MasterMachine.findByIdAndUpdate(Machine_ID, { status: 'Down/Unavailable' });

    await logAudit('CREATE', 'BreakdownIncidentHeader', header._id, req.user?._id, `Reported breakdown ${bdId} for Machine ${Machine_ID}`);
    res.status(201).json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

exports.addV2RepairLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { Action_Taken, Labor_Hours_Spent } = req.body;

    const header = await BreakdownIncidentHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Breakdown incident not found' });

    if (!Action_Taken || !Action_Taken.trim()) {
      return res.status(400).json({ success: false, message: 'Action Taken description is required.' });
    }

    const log = await RepairActionLog.create({
      Incident_ID: header._id,
      Technician_ID: req.user?._id,
      Action_Taken,
      Log_Datetime: new Date(),
      Labor_Hours_Spent: Number(Labor_Hours_Spent) || 1
    });

    if (header.Status === 'Open') {
      header.Status = 'In Progress';
      await header.save();
    }

    await logAudit('CREATE', 'RepairActionLog', log._id, req.user?._id, `Logged repair action for incident ${header.Incident_ID}`);
    res.status(201).json({ success: true, data: log });
  } catch (error) { handleError(res, error); }
};

exports.logV2BDSpares = async (req, res) => {
  try {
    const { id } = req.params;
    const { Spare_Part_ID, Quantity_Consumed } = req.body;

    const header = await BreakdownIncidentHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Breakdown incident not found' });

    /* What the spare actually costs, or nothing.
     *
     * This fell back to ₹50 a piece, so a spare with no standard cost quietly
     * priced every breakdown at a number nobody set — and the Maintenance
     * Report added those up into "cost lost". Zero is the honest figure: the
     * report shows the cost it can see and the spare master is where the rest
     * is fixed. */
    const mat = await MasterMaterial.findById(Spare_Part_ID);
    const unitCost = Number(mat?.standardCost) || 0;

    const qty = Number(Quantity_Consumed) || 1;
    const part = await BreakdownSparePartsConsumption.create({
      Incident_ID: header._id,
      Spare_Part_ID,
      Quantity_Consumed: qty,
      Unit_Cost: unitCost
    });

    // Deduct stock safely without triggering document-level required field validations on legacy records
    if (Spare_Part_ID) {
      await MasterMaterial.findByIdAndUpdate(Spare_Part_ID, { $inc: { quantityOnHand: -qty } });
    }

    await logAudit('CREATE', 'BreakdownSparePartsConsumption', part._id, req.user?._id, `Logged spare part for incident ${header.Incident_ID}`);
    res.status(201).json({ success: true, data: part });
  } catch (error) { handleError(res, error); }
};

exports.updateV2BreakdownStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { Status, Resolution_Datetime } = req.body;

    const header = await BreakdownIncidentHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Breakdown incident not found' });

    // Rule 5: Status Workflow Restriction (Cannot jump Open -> Resolved)
    if (header.Status === 'Open' && Status === 'Resolved') {
      return res.status(400).json({
        success: false,
        message: "Status Workflow Restriction: An incident cannot jump directly from 'Open' to 'Resolved'. It must enter 'In Progress' or 'Waiting on Spares' first."
      });
    }

    if (Status === 'Resolved') {
      // Rule 3: Mandatory Repair Log Check
      const repairLogs = await RepairActionLog.find({ Incident_ID: header._id });
      if (repairLogs.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Mandatory Repair Log Failure: Cannot resolve breakdown incident without at least one repair action log entry.'
        });
      }

      // Rule 2: Downtime Auto-Calculation
      const resolutionDate = Resolution_Datetime ? new Date(Resolution_Datetime) : new Date();
      const reportedDate = new Date(header.Reported_Datetime);
      const diffMs = resolutionDate - reportedDate;
      const downtimeHours = Number(Math.max(0.1, (diffMs / (1000 * 60 * 60))).toFixed(2));

      header.Status = 'Resolved';
      header.Resolution_Datetime = resolutionDate;
      header.Total_Downtime_Hours = downtimeHours;
      await header.save();

      // Restore Machine Status to Active
      await MasterMachine.findByIdAndUpdate(header.Machine_ID, { status: 'Active' });

      // Rule 4: Breakdown Cost Analysis Calculation
      const spares = await BreakdownSparePartsConsumption.find({ Incident_ID: header._id });
      const sparesCost = spares.reduce((sum, s) => sum + (s.Quantity_Consumed * s.Unit_Cost), 0);

      // An unrecorded repair took an unknown time, not one hour.
    const totalLaborHours = repairLogs.reduce((sum, r) => sum + (Number(r.Labor_Hours_Spent) || 0), 0);
      const laborRate = 50; // $50/hr default
      const laborCost = totalLaborHours * laborRate;

      const idleRate = 100; // $100/hr machine idle cost
      const downtimeCost = Number((downtimeHours * idleRate).toFixed(2));
      const totalCost = Number((sparesCost + laborCost + downtimeCost).toFixed(2));

      await BreakdownCostAnalysis.findOneAndUpdate(
        { Incident_ID: header._id },
        {
          Incident_ID: header._id,
          Spares_Cost: sparesCost,
          Labor_Cost: laborCost,
          Downtime_Cost: downtimeCost,
          Total_Incident_Cost: totalCost
        },
        { upsert: true, new: true }
      );
    } else {
      header.Status = Status;
      await header.save();
    }

    await logAudit('UPDATE', 'BreakdownIncidentHeader', header._id, req.user?._id, `Updated incident ${header.Incident_ID} status to ${header.Status}`);
    res.json({ success: true, message: `Breakdown status updated to ${header.Status}`, data: header });
  } catch (error) { handleError(res, error); }
};

// ================= Spare Parts Management (V2 Architecture) =================

exports.getV2SparePartLedger = async (req, res) => {
  try {
    let ledgers = await SparePartLedger.find()
      .populate('Material_ID', 'name code standardCost quantityOnHand')
      .sort({ createdAt: -1 });

    // Seed default ledgers if none exist
    if (ledgers.length === 0) {
      const materials = await MasterMaterial.find().limit(10);
      for (const mat of materials) {
        const count = await SparePartLedger.countDocuments();
        const partId = internalId('PART');
        const stock = mat.quantityOnHand || 50;
        const unitCost = mat.standardCost || 50;
        await SparePartLedger.create({
          Part_ID: partId,
          Material_ID: mat._id,
          Part_Name: mat.name,
          Stock_On_Hand: stock,
          Unit_Cost: unitCost,
          Total_Value: Number((stock * unitCost).toFixed(2)),
          Minimum_Stock_Level: 10,
          Is_Reorder_Warning: stock <= 10
        });
      }
      ledgers = await SparePartLedger.find().populate('Material_ID', 'name code standardCost quantityOnHand').sort({ createdAt: -1 });
    }

    res.json({ success: true, data: ledgers });
  } catch (error) { handleError(res, error); }
};

exports.getV2SparePartActivities = async (req, res) => {
  try {
    const activities = await PartActivityLog.find()
      .populate({ path: 'Part_ID', populate: { path: 'Material_ID', select: 'name code' } })
      .populate('Performed_By_ID', 'name username')
      .sort({ Transaction_Date: -1, createdAt: -1 });

    const fullActivities = await Promise.all(activities.map(async (a) => {
      const linkage = await MaintenanceLinkage.findOne({ Activity_ID: a._id }).populate('Target_Machine_ID', 'name code');
      return {
        ...a.toObject(),
        linkage: linkage ? linkage.toObject() : null
      };
    }));

    res.json({ success: true, data: fullActivities });
  } catch (error) { handleError(res, error); }
};

exports.recordV2PartActivity = async (req, res) => {
  try {
    const { Part_ID, Activity_Type, Transaction_Quantity, Unit_Cost, Reference_Ticket_ID, Maintenance_Type, Target_Machine_ID, Remarks } = req.body;

    const ledger = await SparePartLedger.findById(Part_ID);
    if (!ledger) return res.status(404).json({ success: false, message: 'Spare Part Ledger record not found' });

    const qty = Number(Transaction_Quantity);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ success: false, message: 'Transaction Quantity must be greater than zero.' });

    // Rule 1: Strict Stock Depletion (Issue cannot exceed Stock On Hand)
    if (Activity_Type === 'Issue' && qty > ledger.Stock_On_Hand) {
      return res.status(400).json({
        success: false,
        message: `Strict Stock Depletion Error: Insufficient stock. Requested ${qty} units, but only ${ledger.Stock_On_Hand} units are available.`
      });
    }

    // Rule 2: Mandatory Ticket Reference for Issue / Consumption
    if (Activity_Type === 'Issue' && (!Reference_Ticket_ID || !Reference_Ticket_ID.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory Ticket Reference Error: A valid Reference Ticket ID (e.g., PM-564346 or BD-582620) is strictly required for stock issue/consumption.'
      });
    }

    // Rule 5: Historical Cost Lock
    const transUnitCost = Unit_Cost ? Number(Unit_Cost) : ledger.Unit_Cost;

    // Rule 3: Dynamic Valuation & Moving Average Costing
    if (Activity_Type === 'Receipt') {
      const totalCurrentCost = ledger.Stock_On_Hand * ledger.Unit_Cost;
      const totalNewCost = qty * transUnitCost;
      const newStock = ledger.Stock_On_Hand + qty;
      ledger.Unit_Cost = Number(((totalCurrentCost + totalNewCost) / newStock).toFixed(2));
      ledger.Stock_On_Hand = newStock;
    } else if (Activity_Type === 'Issue') {
      ledger.Stock_On_Hand = Math.max(0, ledger.Stock_On_Hand - qty);
    } else if (Activity_Type === 'Return') {
      ledger.Stock_On_Hand = ledger.Stock_On_Hand + qty;
    } else if (Activity_Type === 'Adjustment') {
      ledger.Stock_On_Hand = qty;
    }

    ledger.Total_Value = Number((ledger.Stock_On_Hand * ledger.Unit_Cost).toFixed(2));

    // Rule 4: Reorder Alert Trigger
    ledger.Is_Reorder_Warning = ledger.Stock_On_Hand <= ledger.Minimum_Stock_Level;
    await ledger.save();

    // Deduct/sync stock on MasterMaterial safely
    if (ledger.Material_ID) {
      await MasterMaterial.findByIdAndUpdate(ledger.Material_ID, { quantityOnHand: ledger.Stock_On_Hand });
    }

    const count = await PartActivityLog.countDocuments();
    const actId = internalId('ACT');

    const activityLog = await PartActivityLog.create({
      Activity_ID: actId,
      Part_ID: ledger._id,
      Activity_Type,
      Transaction_Quantity: Activity_Type === 'Issue' ? -qty : qty,
      Unit_Cost_At_Transaction: transUnitCost,
      Transaction_Date: new Date(),
      Performed_By_ID: req.user?._id
    });

    if (Reference_Ticket_ID || Target_Machine_ID || Maintenance_Type) {
      await MaintenanceLinkage.create({
        Activity_ID: activityLog._id,
        Maintenance_Type: Maintenance_Type || 'General',
        Reference_Ticket_ID: Reference_Ticket_ID || '',
        Target_Machine_ID: Target_Machine_ID || null,
        Remarks: Remarks || ''
      });
    }

    await logAudit('CREATE', 'PartActivityLog', activityLog._id, req.user?._id, `Recorded ${Activity_Type} of ${qty} units for Part ${ledger.Part_ID}`);
    res.status(201).json({ success: true, data: activityLog, ledger });
  } catch (error) { handleError(res, error); }
};

// ================= Maintenance Analytics Dashboard (V2 Architecture) =================

exports.getV2MaintenanceAnalytics = async (req, res) => {
  try {
    // Rule 4: Incident Inclusion Status (Filter ONLY Resolved breakdowns)
    const resolvedIncidents = await BreakdownIncidentHeader.find({ Status: 'Resolved' });
    const resolvedCount = resolvedIncidents.length;

    // Aggregate total downtime
    const totalDowntimeHours = resolvedIncidents.reduce((sum, b) => sum + (b.Total_Downtime_Hours || 0), 0);

    // Rule 2: MTTR Calculation Engine
    const factoryMttr = resolvedCount > 0 ? (totalDowntimeHours / resolvedCount).toFixed(1) : '0.0';

    // Fetch machines to calculate factory MTBF & machine scorecards
    const machines = await MasterMachine.find();
    const totalMachines = Math.max(1, machines.length);

    const monthlyAvailableHoursPerMachine = 720;
    const totalFactoryAvailableHours = totalMachines * monthlyAvailableHoursPerMachine;
    const totalFactoryUptimeHours = Math.max(0, totalFactoryAvailableHours - totalDowntimeHours);

    // Rule 1: MTBF Calculation Engine (Factory Avg)
    const factoryMtbf = resolvedCount > 0
      ? (totalFactoryUptimeHours / resolvedCount).toFixed(1)
      : (totalFactoryAvailableHours).toFixed(1);

    // Rule 3 & 5: Financial Aggregation Lock & Dynamic Dependencies
    const idleRate = 100; // $100/hr downtime cost
    const lostProductionCost = Number((totalDowntimeHours * idleRate).toFixed(2));

    // Sum spares cost from BreakdownSparePartsConsumption & SparePartsConsumption
    const bdSpares = await BreakdownSparePartsConsumption.find();
    const pmSpares = await SparePartsConsumption.find().populate('Spare_Part_ID', 'standardCost');

    const bdSparesCost = bdSpares.reduce((sum, s) => sum + (s.Quantity_Consumed * s.Unit_Cost), 0);
    // A spare with no standard cost contributes nothing rather than ₹50.
    const pmSparesCost = pmSpares.reduce((sum, s) => sum + ((s.Actual_Quantity_Consumed || 0) * (Number(s.Spare_Part_ID?.standardCost) || 0)), 0);
    const totalSparesCost = Number((bdSparesCost + pmSparesCost).toFixed(2));

    // Sum labor cost from RepairActionLog
    const repairLogs = await RepairActionLog.find();
    // An unrecorded repair took an unknown time, not one hour.
    const totalLaborHours = repairLogs.reduce((sum, r) => sum + (Number(r.Labor_Hours_Spent) || 0), 0);
    const laborRate = 50; // $50/hr
    const totalLaborCost = Number((totalLaborHours * laborRate).toFixed(2));

    const totalMaintenanceCost = Number((lostProductionCost + totalSparesCost + totalLaborCost).toFixed(2));

    // Machine Reliability Scorecards (vw_Machine_MTBF)
    const machineScorecards = await Promise.all(machines.map(async (m) => {
      const machineIncidents = resolvedIncidents.filter(i => String(i.Machine_ID) === String(m._id));
      const failuresCount = machineIncidents.length;
      const machineDowntime = machineIncidents.reduce((sum, i) => sum + (i.Total_Downtime_Hours || 0), 0);
      const machineUptime = Math.max(0, monthlyAvailableHoursPerMachine - machineDowntime);

      const machineMtbf = failuresCount > 0
        ? Number((machineUptime / failuresCount).toFixed(1))
        : monthlyAvailableHoursPerMachine;

      let reliabilityStatus = 'High';
      if (failuresCount >= 3 || machineMtbf < 200) reliabilityStatus = 'Critical';
      else if (failuresCount >= 1 || machineMtbf < 500) reliabilityStatus = 'Moderate';

      return {
        _id: m._id,
        name: m.name,
        code: m.code,
        status: m.status || 'Active',
        totalUptimeHours: machineUptime,
        failuresCount,
        machineMtbf,
        reliabilityStatus
      };
    }));

    res.json({
      success: true,
      data: {
        kpiSummary: {
          factoryMtbf: parseFloat(factoryMtbf),
          factoryMttr: parseFloat(factoryMttr),
          totalResolvedBreakdowns: resolvedCount,
          totalMaintenanceCost
        },
        financials: {
          totalDowntimeHours: parseFloat(totalDowntimeHours.toFixed(1)),
          lostProductionCost,
          totalSparesCost,
          totalLaborCost,
          totalMaintenanceCost
        },
        machineScorecards
      }
    });
  } catch (error) { handleError(res, error); }
};
