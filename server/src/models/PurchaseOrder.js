const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. PO HEADER (The Contract) ---
const poHeaderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true
  },
  version: {
    type: Number,
    default: 1
  },
  date: {
    type: Date,
    default: Date.now
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  paymentTerms: {
    type: String,
    enum: ['Net30', 'Net60', 'Due on Receipt'],
    default: 'Net30'
  },
  incoterms: {
    type: String,
    enum: ['FOB', 'EXW', 'DDP'],
    default: 'DDP'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  transmissionStatus: {
    type: String,
    enum: ['Not_Sent', 'EDI_Sent', 'Acknowledged', 'Rejected_by_Vendor'],
    default: 'Not_Sent'
  },
  // Logistics delivery status for ASN tracking
  deliveryStatus: {
    type: String,
    enum: ['Not Scheduled', 'In-Transit', 'Delivered'],
    default: 'Not Scheduled'
  },
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFQHeader' // Updated for consistency with eSourcing
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
poHeaderSchema.plugin(auditPlugin);

// --- B. PO LINE ITEM (The Deliverables) ---
const poLineItemSchema = new mongoose.Schema({
  poId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'POHeader',
    required: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  orderQty: {
    type: Number,
    required: true
  },
  receivedQty: {
    type: Number,
    default: 0
  },
  invoicedQty: {
    type: Number,
    default: 0
  },
  unitPrice: {
    type: Number,
    required: true
  },
  total: {
    type: Number, // OrderQty * UnitPrice
    required: true
  },
  promisedDeliveryDate: {
    type: Date,
    required: true
  },
  lineStatus: {
    type: String,
    enum: ['Open', 'Partially_Received', 'Closed', 'Cancelled'],
    default: 'Open'
  }
});
poLineItemSchema.plugin(auditPlugin);

// --- C. PO CHANGE HISTORY (Audit & Versioning) ---
const poChangeHistorySchema = new mongoose.Schema({
  poId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'POHeader',
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changeTimestamp: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    required: true
  },
  fieldChanged: {
    type: String, // e.g., 'totalAmount', 'orderQty'
    required: true
  },
  oldValue: {
    type: String
  },
  newValue: {
    type: String
  },
  requiresReapproval: {
    type: Boolean,
    default: true
  }
});

const POHeader = mongoose.models.POHeader || mongoose.model('POHeader', poHeaderSchema);
const POLineItem = mongoose.models.POLineItem || mongoose.model('POLineItem', poLineItemSchema);
const POChangeHistory = mongoose.models.POChangeHistory || mongoose.model('POChangeHistory', poChangeHistorySchema);
const PurchaseOrder = POHeader; // Alias — same model, same collection

module.exports = {
  POHeader,
  POLineItem,
  POChangeHistory,
  PurchaseOrder
};
