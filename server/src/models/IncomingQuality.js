const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. INSPECTION HEADER (Event Core) ---
const incomingInspectionHeaderSchema = new mongoose.Schema({
  Insp_ID: { type: String, required: true, unique: true },
  GRN_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'GoodsReceipt' },
  Vendor_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Overall_Status: { type: String, enum: ['Pending', 'Pass', 'Fail', 'Conditional Accept'], default: 'Pending' },
  Inspector_User_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Inspection_Date: { type: Date, default: Date.now }
}, { timestamps: true });
incomingInspectionHeaderSchema.plugin(auditPlugin);

// --- B. MATERIAL SAMPLING & PARAMETERS (Testing Details) ---
const incomingMaterialSamplingSchema = new mongoose.Schema({
  Insp_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'IncomingInspectionHeader', required: true },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Quality_Parameter_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'QualityParameter' },
  Received_Quantity: { type: Number, required: true, min: 0 },
  Sample_Size: { type: Number, default: 1, min: 1 },
  Accepted_Quantity: { type: Number, default: 0, min: 0 },
  Rejected_Quantity: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
incomingMaterialSamplingSchema.plugin(auditPlugin);

// --- C. VENDOR EVALUATION (Dynamic Scoring) ---
const incomingVendorEvaluationSchema = new mongoose.Schema({
  Insp_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'IncomingInspectionHeader', required: true },
  Vendor_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  Score_Awarded: { type: Number, default: 100, min: 0, max: 100 },
  Max_Possible_Score: { type: Number, default: 100 },
  Penalty_Points: { type: Number, default: 0, min: 0 },
  Evaluation_Notes: { type: String }
}, { timestamps: true });
incomingVendorEvaluationSchema.plugin(auditPlugin);

// --- D. DEFECT LOGGING (Non-Conformance Link) ---
const incomingDefectLogSchema = new mongoose.Schema({
  Insp_Detail_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'IncomingMaterialSampling', required: true },
  Defect_Code_ID: { type: String }, // Defect Code or Description
  Affected_Quantity: { type: Number, required: true, min: 0 },
  Action_Required: { type: String, enum: ['Return to Vendor', 'Scrap', 'Rework', 'Accept on Deviation'], default: 'Return to Vendor' }
}, { timestamps: true });
incomingDefectLogSchema.plugin(auditPlugin);

const IncomingInspectionHeader = mongoose.model('IncomingInspectionHeader', incomingInspectionHeaderSchema);
const IncomingMaterialSampling = mongoose.model('IncomingMaterialSampling', incomingMaterialSamplingSchema);
const IncomingVendorEvaluation = mongoose.model('IncomingVendorEvaluation', incomingVendorEvaluationSchema);
const IncomingDefectLog = mongoose.model('IncomingDefectLog', incomingDefectLogSchema);

module.exports = {
  IncomingInspectionHeader,
  IncomingMaterialSampling,
  IncomingVendorEvaluation,
  IncomingDefectLog
};
