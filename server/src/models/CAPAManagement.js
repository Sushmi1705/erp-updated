const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. NON-CONFORMANCE HEADER (Parent Level) ---
const nonConformanceHeaderSchema = new mongoose.Schema({
  NCR_ID: { type: String, required: true, unique: true },
  Source_Inspection_Ref: { type: String }, // Links to Incoming, In-Process, Final Insp_IDs
  Defect_Description: { type: String, required: true },
  Reported_By_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Date_Logged: { type: Date, default: Date.now },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  NCR_Status: { type: String, enum: ['Open', 'Under Investigation', 'Pending Actions', 'Closed'], default: 'Open' },
  CA_Overall_Status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  PA_Overall_Status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' }
}, { timestamps: true });
nonConformanceHeaderSchema.plugin(auditPlugin);

// --- B. ROOT CAUSE ANALYSIS (RCA) ---
const rootCauseAnalysisSchema = new mongoose.Schema({
  NCR_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'NonConformanceHeader', required: true },
  RCA_Findings: { type: String, required: true },
  Analysis_Method: { type: String, enum: ['5 Whys', 'Fishbone', 'Fault Tree', 'General'], default: '5 Whys' },
  Investigator_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Date_Completed: { type: Date, default: Date.now }
}, { timestamps: true });
rootCauseAnalysisSchema.plugin(auditPlugin);

// --- C. CORRECTIVE ACTIONS (CA) ---
const correctiveActionSchema = new mongoose.Schema({
  NCR_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'NonConformanceHeader', required: true },
  Action_Description: { type: String, required: true },
  Assigned_To_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Target_Completion_Date: { type: Date },
  Actual_Completion_Date: { type: Date },
  Task_Status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  Verification_Notes: { type: String }
}, { timestamps: true });
correctiveActionSchema.plugin(auditPlugin);

// --- D. PREVENTIVE ACTIONS (PA) ---
const preventiveActionSchema = new mongoose.Schema({
  NCR_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'NonConformanceHeader', required: true },
  Action_Description: { type: String, required: true },
  Assigned_To_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Target_Completion_Date: { type: Date },
  Actual_Completion_Date: { type: Date },
  Task_Status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  Verification_Notes: { type: String }
}, { timestamps: true });
preventiveActionSchema.plugin(auditPlugin);

const NonConformanceHeader = mongoose.model('NonConformanceHeader', nonConformanceHeaderSchema);
const RootCauseAnalysis = mongoose.model('RootCauseAnalysis', rootCauseAnalysisSchema);
const CorrectiveAction = mongoose.model('CorrectiveAction', correctiveActionSchema);
const PreventiveAction = mongoose.model('PreventiveAction', preventiveActionSchema);

module.exports = {
  NonConformanceHeader,
  RootCauseAnalysis,
  CorrectiveAction,
  PreventiveAction
};
