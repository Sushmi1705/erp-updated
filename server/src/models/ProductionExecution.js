const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. EXECUTION RUN (Parent Level) ---
const executionRunSchema = new mongoose.Schema({
  Run_ID: { type: String, required: true, unique: true },
  WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader', required: true },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Run_Number: { type: String, required: true },
  Run_Status: { type: String, enum: ['Not Started', 'Running', 'Paused', 'Completed', 'Aborted'], default: 'Not Started' },
  Shift_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' }, // Assuming Shift Master exists or null
  Run_Start_Time: { type: Date },
  Run_End_Time: { type: Date }
}, { timestamps: true });
executionRunSchema.plugin(auditPlugin);

// --- B. ROUTING OPERATIONS (Shop Floor Steps) ---
const routingOperationSchema = new mongoose.Schema({
  Run_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ExecutionRun', required: true },
  Operation_Sequence: { type: Number, required: true }, // e.g. 10, 20, 30
  Work_Center_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkCenter' },
  Operation_Status: { type: String, enum: ['Pending', 'Setup', 'Active', 'Paused', 'Completed'], default: 'Pending' },
  Target_Quantity: { type: Number, required: true },
  Completed_Good_Quantity: { type: Number, default: 0 },
  Scrapped_Quantity: { type: Number, default: 0 },
  Rework_Quantity: { type: Number, default: 0 }
}, { timestamps: true });
routingOperationSchema.plugin(auditPlugin);

// --- C. LABOR & TIME LOGGING (Operator Tracking) ---
const laborLogSchema = new mongoose.Schema({
  Operation_Log_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ExecutionOperation', required: true },
  Operator_User_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Activity_Type: { type: String, enum: ['Setup', 'Run', 'Teardown', 'Rework', 'Idle'], required: true },
  Start_Time: { type: Date, required: true },
  End_Time: { type: Date, required: true },
  Logged_Hours: { type: Number },
  Billable_Rate: { type: Number }
}, { timestamps: true });
laborLogSchema.plugin(auditPlugin);

// --- D. MACHINE UTILIZATION (Resource Tracking) ---
const machineLogSchema = new mongoose.Schema({
  Operation_Log_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ExecutionOperation', required: true },
  Machine_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }, // Equipment Master
  Status: { type: String, enum: ['Running', 'Setup', 'Maintenance', 'Breakdown', 'Starved/Idle'], required: true },
  Start_Time: { type: Date, required: true },
  End_Time: { type: Date, required: true },
  Total_Hours: { type: Number },
  Downtime_Reason_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ReasonCode' }
}, { timestamps: true });
machineLogSchema.plugin(auditPlugin);

// --- E. IN-PROCESS QUALITY (Scrap Logging) ---
const qualityLogSchema = new mongoose.Schema({
  Operation_Log_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ExecutionOperation', required: true },
  Defect_Reason_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DefectCode' }, // Defect Code Master
  Rejected_Quantity: { type: Number, required: true },
  Inspector_User_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Action_Taken: { type: String, enum: ['Scrapped', 'Sent to Rework', 'Accepted on Concession'], required: true }
}, { timestamps: true });
qualityLogSchema.plugin(auditPlugin);

const ExecutionRun = mongoose.model('ExecutionRun', executionRunSchema);
const ExecutionOperation = mongoose.model('ExecutionOperation', routingOperationSchema);
const LaborLog = mongoose.model('LaborLog', laborLogSchema);
const MachineLog = mongoose.model('MachineLog', machineLogSchema);
const QualityLog = mongoose.model('QualityLog', qualityLogSchema);

module.exports = { ExecutionRun, ExecutionOperation, LaborLog, MachineLog, QualityLog };
