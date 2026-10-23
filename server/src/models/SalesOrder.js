const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// ─── D. ATP & ALLOCATIONS (Real-Time Inventory Engine) ───────────────────────
const soAllocationSchema = new mongoose.Schema({
  scheduleId:         { type: mongoose.Schema.Types.ObjectId, ref: 'SODeliverySchedule', required: true },
  inventoryBatchId:   { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryStock', required: true },
  allocatedQuantity:  { type: Number, required: true, min: 0.0001 },
  allocationDate:     { type: Date, default: Date.now },
  isHardReserved:     { type: Boolean, default: false }  // Prevents other orders taking this stock
}, { timestamps: true });
soAllocationSchema.plugin(auditPlugin);

// ─── C. DELIVERY SCHEDULES / RELEASES ────────────────────────────────────────
const soDeliveryScheduleSchema = new mongoose.Schema({
  soLineId:               { type: mongoose.Schema.Types.ObjectId, ref: 'SOLineItem', required: true },
  requestedDeliveryDate:  { type: Date, required: true },
  confirmedDeliveryDate:  { type: Date, default: null },
  scheduledQuantity:      { type: Number, required: true, min: 0.0001 },
  shippedQuantity:        { type: Number, default: 0 },
  shipToAddress:          { type: String, default: '' },
  dispatchStatus:         { type: String, enum: ['Pending', 'Picked', 'In Transit', 'Delivered'], default: 'Pending' },
  isQuantityLocked:       { type: Boolean, default: false }  // Rule 5: locked once Picked or beyond
}, { timestamps: true });
soDeliveryScheduleSchema.plugin(auditPlugin);

// ─── B. SALES ORDER LINE ITEMS ────────────────────────────────────────────────
const soLineItemSchema = new mongoose.Schema({
  orderId:              { type: mongoose.Schema.Types.ObjectId, ref: 'SOHeader', required: true },
  lineSequence:         { type: Number, required: true, min: 10 },
  productId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderedQuantity:      { type: Number, required: true, min: 0.0001 },
  uomId:                { type: mongoose.Schema.Types.ObjectId, ref: 'UOM', default: null },
  unitPrice:            { type: Number, required: true, default: 0 },
  lineDiscountAmount:   { type: Number, default: 0 },
  lineTotal:            { type: Number, default: 0 },
  atpStatus:            { type: String, enum: ['Fully Allocated', 'Partially Allocated', 'Backordered', 'Make-to-Order'], default: 'Backordered' },
  fulfillmentType:      { type: String, enum: ['From Stock', 'Production Required', 'Dropship'], default: 'From Stock' },
  isPriceLocked:        { type: Boolean, default: false },   // Rule 2: true if linked from Quotation
  mrpOrderId:           { type: mongoose.Schema.Types.ObjectId, ref: 'MrpRecommendation', default: null }  // Rule 4: linked planned order
}, { timestamps: true });
soLineItemSchema.plugin(auditPlugin);

// ─── A. SALES ORDER HEADER ────────────────────────────────────────────────────
const soHeaderSchema = new mongoose.Schema({
  orderNumber:             { type: String, required: true, unique: true, trim: true },
  customerId:              { type: mongoose.Schema.Types.ObjectId, ref: 'Customer',           required: true },
  quotationRevisionId:     { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision',  default: null },
  customerPONumber:        { type: String, default: '' },
  orderDate:               { type: Date, required: true, default: Date.now },
  deliveryCommitmentDate:  { type: Date, default: null },
  currencyId:              { type: mongoose.Schema.Types.ObjectId, ref: 'Currency', default: null },
  subTotal:                { type: Number, default: 0 },
  totalTaxAmount:          { type: Number, default: 0 },
  grandTotal:              { type: Number, default: 0 },
  status:                  { type: String, enum: ['Draft', 'Pending Approval', 'Approved', 'Processing', 'Partially Shipped', 'Completed', 'Cancelled'], default: 'Draft' },
  holdStatus:              { type: String, enum: ['None', 'Credit Hold', 'Admin Hold'], default: 'None' }
}, { timestamps: true });
soHeaderSchema.plugin(auditPlugin);

// ─── LEGACY ALIAS — keeps existing controller references intact ───────────────
const legacySalesOrderSchema = new mongoose.Schema({
  orderNumber:      { type: String, unique: true, sparse: true },
  quotationId:      { type: mongoose.Schema.Types.ObjectId, ref: 'SalesQuotation' },
  customerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  status:           { type: String, default: 'Draft' },
  items:            [mongoose.Schema.Types.Mixed],
  summary:          mongoose.Schema.Types.Mixed,
  atpCheck:         mongoose.Schema.Types.Mixed,
  deliveryCommitment: Date,
  trackingStatus:   mongoose.Schema.Types.Mixed,
  approvalHistory:  [mongoose.Schema.Types.Mixed]
}, { timestamps: true });
legacySalesOrderSchema.plugin(auditPlugin);

const SOHeader           = mongoose.model('SOHeader',           soHeaderSchema);
const SOLineItem         = mongoose.model('SOLineItem',         soLineItemSchema);
const SODeliverySchedule = mongoose.model('SODeliverySchedule', soDeliveryScheduleSchema);
const SOAllocation       = mongoose.model('SOAllocation',       soAllocationSchema);

// Legacy alias — consumed by existing sales controller getAllOrders / createOrder / updateOrder
const SalesOrder = mongoose.models['SalesOrder'] ||
  mongoose.model('SalesOrder', legacySalesOrderSchema);

module.exports = {
  SOHeader,
  SOLineItem,
  SODeliverySchedule,
  SOAllocation,
  SalesOrder   // legacy
};
