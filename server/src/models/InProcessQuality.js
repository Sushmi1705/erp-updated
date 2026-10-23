const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. IN-PROCESS INSPECTION HEADER (Parent Level) ---
const inProcessInspectionHeaderSchema = new mongoose.Schema({
  Insp_ID: { type: String, required: true, unique: true },
  Work_Order_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader', required: true },
  Operation_ID: { type: String }, // Routing / Operation code
  Inspector_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Inspection_Date: { type: Date, default: Date.now },
  Overall_Status: { type: String, enum: ['Pass', 'Fail', 'Rework', 'Pending', 'Conditional Accept'], default: 'Pending' },
  Observations: { type: String },
  Sample_Size_Checked: { type: Number, default: 1, min: 1 },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true });
inProcessInspectionHeaderSchema.plugin(auditPlugin);

// --- B. INSPECTION PARAMETERS (Line Items) ---
const inProcessInspectionParameterSchema = new mongoose.Schema({
  Insp_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'InProcessInspectionHeader', required: true },
  Parameter_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'QualityParameter' },
  Parameter_Name: { type: String, required: true },
  Standard_Value: { type: String },
  LSL: { type: Number },
  USL: { type: Number },
  Actual_Measured_Value: { type: Number },
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  Parameter_Status: { type: String, enum: ['Pass', 'Fail'], default: 'Pass' }
}, { timestamps: true });
inProcessInspectionParameterSchema.plugin(auditPlugin);

// --- C. DEFECTS LOG (For Failed/Reworked Items) ---
const inProcessDefectLogSchema = new mongoose.Schema({
  Insp_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'InProcessInspectionHeader', required: true },
  Defect_Code_ID: { type: String, required: true },
  Affected_Quantity: { type: Number, required: true, min: 0 },
  Severity: { type: String, enum: ['Minor', 'Major', 'Critical'], default: 'Major' },
  Action_Taken: { type: String, enum: ['Scrap', 'Send to Rework', 'Use As Is'], default: 'Send to Rework' }
}, { timestamps: true });
inProcessDefectLogSchema.plugin(auditPlugin);

// --- D. CAPA LINKAGE (Non-Conformance Trigger) ---
const inProcessCAPALinkageSchema = new mongoose.Schema({
  Insp_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'InProcessInspectionHeader', required: true },
  CAPA_Ref_Number: { type: String },
  Root_Cause_Identified: { type: String },
  Resolution_Status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' }
}, { timestamps: true });
inProcessCAPALinkageSchema.plugin(auditPlugin);

const InProcessInspectionHeader = mongoose.model('InProcessInspectionHeader', inProcessInspectionHeaderSchema);
const InProcessInspectionParameter = mongoose.model('InProcessInspectionParameter', inProcessInspectionParameterSchema);
const InProcessDefectLog = mongoose.model('InProcessDefectLog', inProcessDefectLogSchema);
const InProcessCAPALinkage = mongoose.model('InProcessCAPALinkage', inProcessCAPALinkageSchema);

module.exports = {
  InProcessInspectionHeader,
  InProcessInspectionParameter,
  InProcessDefectLog,
  InProcessCAPALinkage
};
