const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. OPERATOR PROFILE (Parent Level) ---
const operatorProfileSchema = new mongoose.Schema({
  Operator_ID: { type: String, required: true, unique: true },
  User_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Emp_ID: { type: String, required: true },
  Operator_Name: { type: String, required: true },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  Skill_Level: { type: String, enum: ['Trainee', 'Standard', 'Expert'], default: 'Standard' }
}, { timestamps: true });
operatorProfileSchema.plugin(auditPlugin);

// --- B. SHIFT ASSIGNMENT (Scheduling) ---
const shiftAssignmentSchema = new mongoose.Schema({
  Operator_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'OperatorProfile', required: true },
  Shift_ID: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
  Assigned_Date: { type: Date, required: true },
  Attendance_Status: { type: String, enum: ['Scheduled', 'Present', 'Absent'], default: 'Scheduled' },
  Clock_In_Time: { type: Date },
  Clock_Out_Time: { type: Date }
}, { timestamps: true });
shiftAssignmentSchema.plugin(auditPlugin);

// --- C. TASK / WO ALLOCATION (Active Tracking) ---
const taskAllocationSchema = new mongoose.Schema({
  Operator_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'OperatorProfile', required: true },
  WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader' }, // Nullable if "Unassigned"
  Operation_Log_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ExecutionOperation' },
  Allocation_Status: { type: String, enum: ['Active', 'Paused', 'Completed', 'Reassigned'], default: 'Active' },
  Start_Time: { type: Date, default: Date.now },
  End_Time: { type: Date }
}, { timestamps: true });
taskAllocationSchema.plugin(auditPlugin);

// --- D. PERFORMANCE METRICS (Productivity Ledger) ---
const performanceMetricSchema = new mongoose.Schema({
  Operator_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'OperatorProfile', required: true },
  Calculation_Date: { type: Date, default: Date.now },
  Standard_Hours_Earned: { type: Number, default: 0 },
  Actual_Hours_Worked: { type: Number, default: 0 },
  Productivity_Score: { type: Number, default: 100, min: 0, max: 100 },
  Defect_Rate_Percentage: { type: Number, default: 0 }
}, { timestamps: true });
performanceMetricSchema.plugin(auditPlugin);

const OperatorProfile = mongoose.model('OperatorProfile', operatorProfileSchema);
const ShiftAssignment = mongoose.model('ShiftAssignment', shiftAssignmentSchema);
const TaskAllocation = mongoose.model('TaskAllocation', taskAllocationSchema);
const PerformanceMetric = mongoose.model('PerformanceMetric', performanceMetricSchema);

module.exports = {
  OperatorProfile,
  ShiftAssignment,
  TaskAllocation,
  PerformanceMetric
};
