const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// ─── D. ECM APPROVAL ROUTING ──────────────────────────────────────────────────
const ecmApprovalSchema = new mongoose.Schema({
  ecrId:          { type: mongoose.Schema.Types.ObjectId, ref: 'ECMHeader', required: true },
  approvalStep:   { type: Number, required: true, min: 1 },  // 1, 2, 3 …
  requiredRole:   { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  assignedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvalDate:   { type: Date, default: null },
  comments:       { type: String, default: '' }
}, { timestamps: true });
ecmApprovalSchema.plugin(auditPlugin);

// ─── C. ECM IMPACT ANALYSIS ───────────────────────────────────────────────────
const ecmImpactSchema = new mongoose.Schema({
  ecrId:                 { type: mongoose.Schema.Types.ObjectId, ref: 'ECMHeader', required: true, unique: true },
  productImpactNotes:    { type: String, default: '' },
  bomImpactNotes:        { type: String, default: '' },
  routingImpactNotes:    { type: String, default: '' },
  costImpactEstimated:   { type: Number, default: 0 },
  inventoryDisposition:  { type: String, enum: ['Use Existing', 'Scrap', 'Rework'], default: 'Use Existing' }
}, { timestamps: true });
ecmImpactSchema.plugin(auditPlugin);

// ─── B. ECM AFFECTED ITEMS ────────────────────────────────────────────────────
const ecmAffectedItemSchema = new mongoose.Schema({
  ecrId:               { type: mongoose.Schema.Types.ObjectId, ref: 'ECMHeader', required: true },
  itemType:            { type: String, enum: ['BOM', 'Routing', 'Product Master', 'Document'], required: true },
  bomId:               { type: mongoose.Schema.Types.ObjectId, ref: 'BOMHeader',     default: null },
  routingId:           { type: mongoose.Schema.Types.ObjectId, ref: 'RoutingHeader', default: null },
  productId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Product',       default: null },
  currentRevisionCode: { type: String, default: '' },  // e.g. "v1.0"
  newRevisionCode:     { type: String, default: '' }   // e.g. "v1.1" — set on approval
}, { timestamps: true });
ecmAffectedItemSchema.plugin(auditPlugin);

// ─── A. ECM HEADER ────────────────────────────────────────────────────────────
const ecmHeaderSchema = new mongoose.Schema({
  ecrNumber:                { type: String, required: true, unique: true, trim: true }, // ECR-XXXXXX
  title:                    { type: String, required: true, trim: true },
  reasonForChange:          { type: String, required: true },
  changeType:               { type: String, enum: ['Design', 'Process', 'Material Replacement', 'Cost Reduction'], required: true, default: 'Design' },
  priority:                 { type: String, enum: ['Low', 'Medium', 'High', 'Urgent/Line-Down'], default: 'Medium' },
  status:                   { type: String, enum: ['Draft', 'Submitted', 'In Review', 'Approved', 'Implemented', 'Rejected', 'Closed'], default: 'Draft' },
  targetImplementationDate: { type: Date, default: null },
  isLocked:                 { type: Boolean, default: false }  // Validation Rule 1: locked on Approve
}, { timestamps: true });
ecmHeaderSchema.plugin(auditPlugin);

// Legacy alias — keeps old EngineeringChange references in other modules intact
const legacyChangeSchema = new mongoose.Schema({
  ecrNumber:       { type: String, unique: true, sparse: true },
  changeNumber:    String,
  title:           String,
  description:     String,
  status:          { type: String, default: 'Draft' },
  targetBomId:     { type: mongoose.Schema.Types.ObjectId, ref: 'BOMHeader' },
  targetRoutingId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoutingHeader' },
  impactAnalysis:  { bomImpact: String, routingImpact: String, productImpact: String },
  approvalHistory: [{ user: mongoose.Schema.Types.ObjectId, action: String, date: { type: Date, default: Date.now }, comments: String }]
}, { timestamps: true });

const ECMHeader       = mongoose.model('ECMHeader',       ecmHeaderSchema);
const ECMAffectedItem = mongoose.model('ECMAffectedItem', ecmAffectedItemSchema);
const ECMImpactAnalysis = mongoose.model('ECMImpactAnalysis', ecmImpactSchema);
const ECMApprovalRouting = mongoose.model('ECMApprovalRouting', ecmApprovalSchema);

// Legacy alias used by BOM / Routing ecoNumber field population
const EngineeringChange = mongoose.models['EngineeringChange'] ||
  mongoose.model('EngineeringChange', legacyChangeSchema);

module.exports = {
  ECMHeader,
  ECMAffectedItem,
  ECMImpactAnalysis,
  ECMApprovalRouting,
  EngineeringChange  // legacy alias
};
