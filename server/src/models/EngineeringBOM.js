const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// ─── E. OPERATION LINKS ─────────────────────────────────────────────────────
const operationLinkSchema = new mongoose.Schema({
  componentId:       { type: mongoose.Schema.Types.ObjectId, ref: 'BOMComponent', required: true },
  routingId:         { type: mongoose.Schema.Types.ObjectId, ref: 'EngineeringRouting', required: true },
  operationSequence: { type: Number, required: true },           // e.g. 10, 20, 30
  workCenterId:      { type: mongoose.Schema.Types.ObjectId, ref: 'WorkCenter', required: true }
}, { timestamps: true });
operationLinkSchema.plugin(auditPlugin);

// ─── D. SUBSTITUTE COMPONENTS ───────────────────────────────────────────────
const substituteComponentSchema = new mongoose.Schema({
  primaryComponentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'BOMComponent', required: true },
  substituteMaterialId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  conversionFactor:      { type: Number, required: true, default: 1 }, // 1 Primary = X Substitute
  priorityRank:          { type: Number, required: true, min: 1 },
  validFromDate:         { type: Date, required: true },
  validToDate:           { type: Date, default: null },
  isActive:              { type: Boolean, default: true }
}, { timestamps: true });
substituteComponentSchema.plugin(auditPlugin);

// ─── C. BOM COMPONENTS ──────────────────────────────────────────────────────
const bomComponentSchema = new mongoose.Schema({
  revisionId:            { type: mongoose.Schema.Types.ObjectId, ref: 'BOMRevision', required: true },
  lineSequenceNumber:    { type: Number, required: true },        // 10, 20, 30 …
  materialId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },   // Material OR Product
  productId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  componentType:         { type: String, enum: ['Standard', 'Phantom', 'Bulk/Floor Stock'], required: true, default: 'Standard' },
  quantityPerAssembly:   { type: Number, required: true, min: 0 },
  uomId:                 { type: mongoose.Schema.Types.ObjectId, ref: 'UOM', required: true },
  scrapYieldPercentage:  { type: Number, default: 0, min: 0, max: 100 },
  issueMethod:           { type: String, enum: ['Backflush', 'Manual Pick', 'Floor Stock'], required: true, default: 'Manual Pick' },
  costingRelevancy:      { type: Boolean, default: true },
  leadTimeOffsetDays:    { type: Number, default: 0 }
}, { timestamps: true });

// Validation Rule 3: Phantom components cannot use Manual Pick
bomComponentSchema.pre('save', function () {
  if (this.componentType === 'Phantom' && this.issueMethod === 'Manual Pick') {
    throw new Error('Phantom components cannot have Issue Method as Manual Pick.');
  }
});

bomComponentSchema.plugin(auditPlugin);

// ─── B. BOM REVISION ────────────────────────────────────────────────────────
const bomRevisionSchema = new mongoose.Schema({
  bomId:               { type: mongoose.Schema.Types.ObjectId, ref: 'BOMHeader', required: true },
  revisionCode:        { type: String, required: true },          // v1.0, v1.1
  ecoNumber:           { type: mongoose.Schema.Types.ObjectId, ref: 'EngineeringChange', default: null },
  validFromDate:       { type: Date, required: true },
  validToDate:         { type: Date, default: null },
  totalStandardCost:   { type: Number, default: 0 },
  approvalStatus:      { type: String, enum: ['Draft', 'Pending', 'Approved', 'Obsolete'], default: 'Draft' }
}, { timestamps: true });
bomRevisionSchema.plugin(auditPlugin);

// ─── A. BOM HEADER ──────────────────────────────────────────────────────────
const bomHeaderSchema = new mongoose.Schema({
  bomCode:            { type: String, required: true, unique: true, trim: true }, // BOM-ENG-001
  bomName:            { type: String, required: true, trim: true },
  productId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  plantId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  bomType:            { type: String, enum: ['Manufacturing', 'Engineering', 'Costing'], required: true, default: 'Manufacturing' },
  baseQuantity:       { type: Number, required: true, default: 1 },
  uomId:              { type: mongoose.Schema.Types.ObjectId, ref: 'UOM', required: true },
  defaultRoutingId:   { type: mongoose.Schema.Types.ObjectId, ref: 'EngineeringRouting', default: null },
  isDefaultBOM:       { type: Boolean, default: false },
  status:             { type: String, enum: ['Active', 'Inactive', 'Obsolete'], default: 'Active' }
}, { timestamps: true });
bomHeaderSchema.plugin(auditPlugin);

const BOMHeader           = mongoose.model('BOMHeader',           bomHeaderSchema);
const BOMRevision         = mongoose.model('BOMRevision',         bomRevisionSchema);
const BOMComponent        = mongoose.model('BOMComponent',        bomComponentSchema);
const SubstituteComponent = mongoose.model('SubstituteComponent', substituteComponentSchema);
const OperationLink       = mongoose.model('OperationLink',       operationLinkSchema);

module.exports = { BOMHeader, BOMRevision, BOMComponent, SubstituteComponent, OperationLink };
