const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. MACHINE STATE HEADER (Live Snapshot) ---
const machineStateHeaderSchema = new mongoose.Schema({
  Machine_State_ID: { type: String, required: true, unique: true },
  Machine_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Current_Status: { type: String, enum: ['Idle', 'Running', 'Offline', 'Maintenance', 'Setup'], default: 'Idle' },
  Current_WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader' }, // Nullable if Idle/Unassigned
  Current_Idle_Time_Mins: { type: Number, default: 0 },
  Live_Utilization_Percentage: { type: Number, default: 100, min: 0, max: 100 },
  Last_State_Change: { type: Date, default: Date.now }
}, { timestamps: true });
machineStateHeaderSchema.plugin(auditPlugin);

// --- B. MACHINE ALLOCATION (Hardware Assignment) ---
const machineAllocationSchema = new mongoose.Schema({
  Allocation_ID: { type: String, required: true },
  Machine_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true },
  WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader', required: true },
  Operation_Log_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ExecutionOperation' },
  Allocated_By_User_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Allocation_Status: { type: String, enum: ['Active', 'Released', 'Canceled'], default: 'Active' },
  Start_Timestamp: { type: Date, default: Date.now },
  End_Timestamp: { type: Date }
}, { timestamps: true });
machineAllocationSchema.plugin(auditPlugin);

// --- C. TIME & EVENT LOGGING (Utilization Ledger) ---
const machineEventLogSchema = new mongoose.Schema({
  Event_Log_ID: { type: String, required: true },
  Machine_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true },
  WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader' }, // Nullable if generic idle time
  Event_Type: { type: String, enum: ['Run', 'Idle', 'Setup', 'Breakdown'], required: true },
  Start_Time: { type: Date, required: true },
  End_Time: { type: Date },
  Duration_Minutes: { type: Number, default: 0 },
  Idle_Reason_Code_ID: { type: String }, // Reason Code or Description
  Logged_By_User_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
machineEventLogSchema.plugin(auditPlugin);

const MachineStateHeader = mongoose.model('MachineStateHeader', machineStateHeaderSchema);
const MachineAllocation = mongoose.model('MachineAllocation', machineAllocationSchema);
const MachineEventLog = mongoose.model('MachineEventLog', machineEventLogSchema);

module.exports = {
  MachineStateHeader,
  MachineAllocation,
  MachineEventLog
};
