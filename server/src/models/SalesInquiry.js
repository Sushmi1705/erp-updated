const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// ─── E. FOLLOW-UPS & COMMUNICATIONS ──────────────────────────────────────────
const followUpSchema = new mongoose.Schema({
  inquiryId:      { type: mongoose.Schema.Types.ObjectId, ref: 'InquiryHeader', required: true },
  activityDate:   { type: Date, required: true, default: Date.now },
  method:         { type: String, enum: ['Email', 'Phone', 'Meeting', 'Customer Portal'], required: true },
  notes:          { type: String, required: true },
  nextActionDate: { type: Date, default: null }
}, { timestamps: true });
followUpSchema.plugin(auditPlugin);

// ─── D. ENGINEERING FEASIBILITY REVIEW ───────────────────────────────────────
const feasibilitySchema = new mongoose.Schema({
  inquiryLineId:          { type: mongoose.Schema.Types.ObjectId, ref: 'InquiryLineItem', required: true, unique: true },
  engineeringTaskId:      { type: mongoose.Schema.Types.ObjectId, ref: 'EngineeringChange', default: null },
  isToolingRequired:      { type: Boolean, default: false },
  estimatedToolingCost:   { type: Number, default: 0 },
  estimatedLeadTimeDays:  { type: Number, default: 0 },
  approvalStatus:         { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Conditional'], default: 'Pending' },
  engineeringNotes:       { type: String, default: '' }
}, { timestamps: true });
feasibilitySchema.plugin(auditPlugin);

// ─── C. CROSS-REFERENCE & FITMENT ────────────────────────────────────────────
const crossRefSchema = new mongoose.Schema({
  inquiryLineId:     { type: mongoose.Schema.Types.ObjectId, ref: 'InquiryLineItem', required: true },
  internalProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  matchType:         { type: String, enum: ['Exact Match', 'Form-Fit-Function', 'Modification Required'], required: true },
  fitmentNotes:      { type: String, default: '' },
  isPrimaryMatch:    { type: Boolean, default: false }
}, { timestamps: true });
crossRefSchema.plugin(auditPlugin);

// ─── B. INQUIRY LINE ITEMS ────────────────────────────────────────────────────
const inquiryLineSchema = new mongoose.Schema({
  inquiryId:          { type: mongoose.Schema.Types.ObjectId, ref: 'InquiryHeader', required: true },
  lineSequence:       { type: Number, required: true, min: 10 },           // 10, 20, 30…
  customerPartNumber: { type: String, default: '' },                        // How customer refers to it
  oemPartNumber:      { type: String, default: '' },                        // OEM reference
  productId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }, // null = new part
  requestedQuantity:  { type: Number, required: true, min: 0.0001 },
  uomId:              { type: mongoose.Schema.Types.ObjectId, ref: 'UOM', default: null },
  targetUnitPrice:    { type: Number, default: 0 },
  lineStatus:         { type: String, enum: ['Open', 'Evaluating', 'Quoted', 'Rejected'], default: 'Open' },
  isLocked:           { type: Boolean, default: false }                     // Rule 5: locked once quoted
}, { timestamps: true });
inquiryLineSchema.plugin(auditPlugin);

// ─── A. INQUIRY HEADER ────────────────────────────────────────────────────────
const inquiryHeaderSchema = new mongoose.Schema({
  inquiryNumber:          { type: String, required: true, unique: true, trim: true },  // INQ-FVEV82
  customerId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  contactPersonId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dateReceived:           { type: Date, required: true, default: Date.now },
  targetQuotationDate:    { type: Date, default: null },
  inquiryType:            { type: String, enum: ['Standard', 'RFQ', 'Sample Request', 'Blanket Contract'], default: 'Standard' },
  status:                 { type: String, enum: ['New', 'Active', 'Feasibility Check', 'Quoted', 'Closed-Won', 'Closed-Lost'], default: 'New' },
  salesRepId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  probabilityOfWin:       { type: Number, default: 0, min: 0, max: 100 },
  quotationId:            { type: mongoose.Schema.Types.ObjectId, ref: 'SalesQuotation', default: null }
}, { timestamps: true });
inquiryHeaderSchema.plugin(auditPlugin);

// ─── LEGACY ALIAS — keeps existing SalesQuotation/SalesOrder refs intact ─────
const legacySalesInquirySchema = new mongoose.Schema({
  inquiryNumber: { type: String, unique: true, sparse: true },
  customerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  status:        { type: String, default: 'Draft' },
  requirements:  String,
  products:      [{ productId: mongoose.Schema.Types.ObjectId, quantity: Number, notes: String }],
  isActive:      { type: Boolean, default: true }
}, { timestamps: true });

const InquiryHeader  = mongoose.model('InquiryHeader',   inquiryHeaderSchema);
const InquiryLineItem = mongoose.model('InquiryLineItem', inquiryLineSchema);
const CrossReference  = mongoose.model('CrossReference',  crossRefSchema);
const FeasibilityReview = mongoose.model('FeasibilityReview', feasibilitySchema);
const FollowUp        = mongoose.model('FollowUp',        followUpSchema);

// Legacy alias — prevents SalesInquiry ref errors elsewhere
const SalesInquiry = mongoose.models['SalesInquiry'] ||
  mongoose.model('SalesInquiry', legacySalesInquirySchema);

module.exports = {
  InquiryHeader,
  InquiryLineItem,
  CrossReference,
  FeasibilityReview,
  FollowUp,
  SalesInquiry   // legacy
};
