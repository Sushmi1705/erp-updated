const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// ─── E. SUBCONTRACTING DETAILS ───────────────────────────────────────────────
const subcontractingSchema = new mongoose.Schema({
  operationId:   { type: mongoose.Schema.Types.ObjectId, ref: 'RoutingOperation', required: true },
  vendorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  serviceItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }, // dummy PO item
  leadTimeDays:  { type: Number, required: true, min: 0, default: 0 },
  standardCost:  { type: Number, required: true, min: 0, default: 0 }
}, { timestamps: true });
subcontractingSchema.plugin(auditPlugin);

// ─── D. OPERATION RESOURCES ──────────────────────────────────────────────────
const operationResourceSchema = new mongoose.Schema({
  operationId:       { type: mongoose.Schema.Types.ObjectId, ref: 'RoutingOperation', required: true },
  resourceType:      { type: String, enum: ['Labor Skill', 'Tool', 'Jig/Fixture', 'Mold'], required: true },
  resourceCode:      { type: String, required: true, trim: true }, // Skill code or Tool code
  quantityRequired:  { type: Number, required: true, min: 1, default: 1 }
}, { timestamps: true });
operationResourceSchema.plugin(auditPlugin);

// ─── C. ROUTING OPERATIONS ───────────────────────────────────────────────────
const routingOperationSchema = new mongoose.Schema({
  revisionId:           { type: mongoose.Schema.Types.ObjectId, ref: 'RoutingRevision', required: true },
  operationSequence:    { type: Number, required: true },             // 10, 20, 30 …
  operationDescription: { type: String, required: true, trim: true }, // "CNC Milling", "Welding"
  workCenterId:         { type: mongoose.Schema.Types.ObjectId, ref: 'WorkCenter', required: true },
  machineId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', default: null },
  setupTime:            { type: Number, default: 0, min: 0 },
  runTime:              { type: Number, default: 0, min: 0 },
  moveTime:             { type: Number, default: 0, min: 0 },
  timeUOM:              { type: String, enum: ['Minutes', 'Hours'], default: 'Minutes' },
  controlKey:           { type: String, enum: ['Milestone', 'Backflush', 'Standard'], default: 'Standard' },
  isSubcontracted:      { type: Boolean, default: false },
  // Validation Rule 2: Stored computed total (Setup + Run + Move)
  totalOperationTime:   { type: Number, default: 0 }
}, { timestamps: true });

// Auto-calculate totalOperationTime before every save
routingOperationSchema.pre('save', function () {
  this.totalOperationTime = (this.setupTime || 0) + (this.runTime || 0) + (this.moveTime || 0);
});

routingOperationSchema.plugin(auditPlugin);

// ─── B. ROUTING REVISION ─────────────────────────────────────────────────────
const routingRevisionSchema = new mongoose.Schema({
  routingId:      { type: mongoose.Schema.Types.ObjectId, ref: 'RoutingHeader', required: true },
  revisionCode:   { type: String, required: true, trim: true },  // v1.0, v1.1
  ecoNumber:      { type: mongoose.Schema.Types.ObjectId, ref: 'EngineeringChange', default: null },
  validFromDate:  { type: Date, required: true },
  validToDate:    { type: Date, default: null },
  approvalStatus: { type: String, enum: ['Draft', 'Pending', 'Approved', 'Obsolete'], default: 'Draft' }
}, { timestamps: true });
routingRevisionSchema.plugin(auditPlugin);

// ─── A. ROUTING HEADER ───────────────────────────────────────────────────────
const routingHeaderSchema = new mongoose.Schema({
  routingCode:       { type: String, required: true, unique: true, trim: true }, // ROUT-7J8IPF
  routingName:       { type: String, required: true, trim: true },
  productId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  plantId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  baseQuantity:      { type: Number, required: true, default: 1, min: 0.0001 },
  isDefaultRouting:  { type: Boolean, default: false },
  status:            { type: String, enum: ['Active', 'Inactive', 'Obsolete'], default: 'Active' }
}, { timestamps: true });
routingHeaderSchema.plugin(auditPlugin);

// Keep old flat model alias so EngineeringChange.jsx (which references routingNumber) doesn't break
const legacyRoutingSchema = new mongoose.Schema({
  productId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  routingNumber: { type: String, unique: true, sparse: true },
  description:   String,
  isActive:      { type: Boolean, default: true },
  operations:    [{ type: mongoose.Schema.Types.Mixed }]
}, { timestamps: true });

const RoutingHeader        = mongoose.model('RoutingHeader',       routingHeaderSchema);
const RoutingRevision      = mongoose.model('RoutingRevision',     routingRevisionSchema);
const RoutingOperation     = mongoose.model('RoutingOperation',    routingOperationSchema);
const OperationResource    = mongoose.model('OperationResource',   operationResourceSchema);
const SubcontractingDetail = mongoose.model('SubcontractingDetail',subcontractingSchema);

// Legacy alias — used by EngineeringChange for targetRoutingId population
const EngineeringRouting = mongoose.models['EngineeringRouting'] ||
  mongoose.model('EngineeringRouting', legacyRoutingSchema);

module.exports = {
  RoutingHeader,
  RoutingRevision,
  RoutingOperation,
  OperationResource,
  SubcontractingDetail,
  EngineeringRouting  // legacy alias kept for ECM compatibility
};
