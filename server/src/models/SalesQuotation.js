const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// ─── E. APPROVAL ROUTING ─────────────────────────────────────────────────────
const quoteApprovalSchema = new mongoose.Schema({
  revisionId:      { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision', required: true },
  approverRoleId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Role',              required: true },
  approverUserId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',              default: null },
  requestedAt:     { type: Date, default: Date.now },
  actionTaken:     { type: String, enum: ['Approved', 'Rejected', 'Requested Changes'], default: null },
  actionAt:        { type: Date, default: null },
  approvalNotes:   { type: String, default: '' }
}, { timestamps: true });
quoteApprovalSchema.plugin(auditPlugin);

// ─── D. TAXES & DISCOUNTS ────────────────────────────────────────────────────
const quoteTaxDiscountSchema = new mongoose.Schema({
  revisionId:         { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision', required: true },
  quoteLineId:        { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationLineItem', default: null }, // null = header-level
  entryType:          { type: String, enum: ['Tax', 'Discount', 'Surcharge', 'Shipping'], required: true },
  taxCodeId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Tax', default: null },
  ratePercentage:     { type: Number, default: 0 },
  calculatedAmount:   { type: Number, default: 0 }
}, { timestamps: true });
quoteTaxDiscountSchema.plugin(auditPlugin);

// ─── C. QUOTATION LINE ITEMS ─────────────────────────────────────────────────
const quotationLineSchema = new mongoose.Schema({
  revisionId:              { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision', required: true },
  inquiryLineId:           { type: mongoose.Schema.Types.ObjectId, ref: 'InquiryLineItem',   default: null },
  lineType:                { type: String, enum: ['Standard Part', 'Custom Part', 'Tooling Cost', 'NRE/Engineering'], required: true, default: 'Standard Part' },
  productId:               { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  description:             { type: String, default: '' },
  quantity:                { type: Number, required: true, min: 0.0001 },
  uomId:                   { type: mongoose.Schema.Types.ObjectId, ref: 'UOM', default: null },
  unitCost:                { type: Number, default: 0 },   // Hidden — for margin calc only
  unitPrice:               { type: Number, required: true, default: 0 },
  lineDiscountPercentage:  { type: Number, default: 0 },
  lineTotal:               { type: Number, default: 0 },   // Auto-computed: qty * price * (1 - disc%)
  grossMarginPct:          { type: Number, default: null }, // Auto-computed: (price-cost)/price * 100
  isBelowMarginThreshold:  { type: Boolean, default: false }
}, { timestamps: true });
quotationLineSchema.plugin(auditPlugin);

// ─── B. QUOTATION REVISIONS ───────────────────────────────────────────────────
const quotationRevisionSchema = new mongoose.Schema({
  quotationId:         { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationHeader', required: true },
  revisionNumber:      { type: Number, required: true, min: 1 },   // 1, 2, 3…
  validFromDate:       { type: Date, required: true },
  validToDate:         { type: Date, required: true },
  subTotal:            { type: Number, default: 0, precision: 4 },
  totalDiscountAmount: { type: Number, default: 0 },
  totalTaxAmount:      { type: Number, default: 0 },
  grandTotal:          { type: Number, default: 0 },
  status:              { type: String, enum: ['Draft', 'Pending Approval', 'Approved', 'Sent to Customer', 'Accepted', 'Rejected', 'Expired'], default: 'Draft' },
  isLocked:            { type: Boolean, default: false },  // Rule 1: set true on Approved/Sent
  marginTriggered:     { type: Boolean, default: false }   // Rule 2: true if margin check fired
}, { timestamps: true });
quotationRevisionSchema.plugin(auditPlugin);

// ─── A. QUOTATION HEADER ─────────────────────────────────────────────────────
const quotationHeaderSchema = new mongoose.Schema({
  quotationNumber: { type: String, required: true, unique: true, trim: true },
  customerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer',  required: true },
  inquiryId:       { type: mongoose.Schema.Types.ObjectId, ref: 'InquiryHeader', default: null },
  currencyId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Currency',  default: null },
  salesRepId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',      default: null },
  createdDate:     { type: Date, default: Date.now },
  isActive:        { type: Boolean, default: true }
}, { timestamps: true });
quotationHeaderSchema.plugin(auditPlugin);

// ─── LEGACY ALIAS — keeps existing sales.controller references intact ─────────
const legacySalesQuotationSchema = new mongoose.Schema({
  quotationNumber:  { type: String, unique: true, sparse: true },
  inquiryId:        { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInquiry' },
  customerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  isActive:         { type: Boolean, default: true },
  versions:         [mongoose.Schema.Types.Mixed],
  activeVersionId:  { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

const QuotationHeader    = mongoose.model('QuotationHeader',    quotationHeaderSchema);
const QuotationRevision  = mongoose.model('QuotationRevision',  quotationRevisionSchema);
const QuotationLineItem  = mongoose.model('QuotationLineItem',  quotationLineSchema);
const QuoteTaxDiscount   = mongoose.model('QuoteTaxDiscount',   quoteTaxDiscountSchema);
const QuoteApproval      = mongoose.model('QuoteApproval',      quoteApprovalSchema);

// Legacy alias — consumed by sales.controller getAllQuotations / createQuotation
const SalesQuotation = mongoose.models['SalesQuotation'] ||
  mongoose.model('SalesQuotation', legacySalesQuotationSchema);

module.exports = {
  QuotationHeader,
  QuotationRevision,
  QuotationLineItem,
  QuoteTaxDiscount,
  QuoteApproval,
  SalesQuotation   // legacy
};
