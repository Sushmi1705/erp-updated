const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. FINAL INSPECTION HEADER (Parent Level) ---
const finalInspectionHeaderSchema = new mongoose.Schema({
  Insp_ID: { type: String, required: true, unique: true },
  FG_Batch_Ref: { type: String, required: true }, // Batch number or Goods Receipt Ref
  Product_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Work_Order_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader' },
  Inspector_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Inspection_Date: { type: Date, default: Date.now },
  Inspection_Status: { type: String, enum: ['Pass', 'Fail', 'Hold', 'Pending'], default: 'Pending' },
  Release_Status: { type: String, enum: ['Pending Approval', 'Released', 'Rejected', 'Quarantined'], default: 'Pending Approval' },
  Batch_Quantity: { type: Number, default: 100, min: 0 },
  Sample_Size_Inspected: { type: Number, default: 10, min: 1 },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true });
finalInspectionHeaderSchema.plugin(auditPlugin);

// --- B. FINAL QUALITY PARAMETERS (Line Items) ---
const finalQualityParameterSchema = new mongoose.Schema({
  Insp_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'FinalInspectionHeader', required: true },
  Parameter_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'QualityParameter' },
  Test_Method: { type: String, default: 'Visual & Vernier Measurement' },
  Expected_Standard: { type: String, default: 'Per Engineering Spec' },
  LSL: { type: Number },
  USL: { type: Number },
  Actual_Result: { type: String },
  Parameter_Status: { type: String, enum: ['Pass', 'Fail'], default: 'Pass' },
  Remarks: { type: String }
}, { timestamps: true });
finalQualityParameterSchema.plugin(auditPlugin);

// --- C. PRODUCT RELEASE APPROVAL LOG (Workflow) ---
const productReleaseApprovalLogSchema = new mongoose.Schema({
  Insp_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'FinalInspectionHeader', required: true },
  Approver_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Action_Taken: { type: String, enum: ['Approve Release', 'Reject Release', 'Request Re-test'], required: true },
  Action_Date: { type: Date, default: Date.now },
  Approver_Comments: { type: String }
}, { timestamps: true });
productReleaseApprovalLogSchema.plugin(auditPlugin);

// --- D. NON-CONFORMANCE / QUARANTINE LINKAGE (If Failed) ---
const finalNonConformanceQuarantineSchema = new mongoose.Schema({
  Insp_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'FinalInspectionHeader', required: true },
  CAPA_Ref: { type: String },
  Quarantine_Location_ID: { type: String, default: 'HOLD-BIN-01' },
  Disposition_Decision: { type: String, enum: ['Rework', 'Scrap', 'Return to Vendor', 'Downgrade', 'Quarantine'], default: 'Quarantine' }
}, { timestamps: true });
finalNonConformanceQuarantineSchema.plugin(auditPlugin);

const FinalInspectionHeader = mongoose.model('FinalInspectionHeader', finalInspectionHeaderSchema);
const FinalQualityParameter = mongoose.model('FinalQualityParameter', finalQualityParameterSchema);
const ProductReleaseApprovalLog = mongoose.model('ProductReleaseApprovalLog', productReleaseApprovalLogSchema);
const FinalNonConformanceQuarantine = mongoose.model('FinalNonConformanceQuarantine', finalNonConformanceQuarantineSchema);

module.exports = {
  FinalInspectionHeader,
  FinalQualityParameter,
  ProductReleaseApprovalLog,
  FinalNonConformanceQuarantine
};
