const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. PR HEADER (The Shopping Cart) ---
const prHeaderSchema = new mongoose.Schema({
  prNumber: {
    type: String,
    required: true,
    unique: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  costCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department' // Assuming Department handles Cost Centers here
  },
  totalValue: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Draft', 'In_Approval', 'Approved', 'PO_Created', 'Rejected', 'Cancelled', 'Needs_CFO_Approval'],
    default: 'Draft'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
prHeaderSchema.plugin(auditPlugin);

// --- B. PR LINE ITEMS (The Cart Contents) ---
const prLineItemSchema = new mongoose.Schema({
  prHeaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PRHeader',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material' // If from internal catalog
  },
  freeTextDesc: {
    type: String // If off-catalog
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor' // Pre-selected if PunchOut or catalog
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  requiredDate: {
    type: Date,
    required: true
  },
  lineStatus: {
    type: String,
    enum: ['Pending', 'Sourced', 'Received', 'Consolidated'],
    default: 'Pending'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
prLineItemSchema.plugin(auditPlugin);

// --- C. APPROVAL ROUTING LOG (The Real-Time Workflow) ---
const approvalRoutingLogSchema = new mongoose.Schema({
  prHeaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PRHeader',
    required: true
  },
  approverRoleId: {
    type: mongoose.Schema.Types.ObjectId, // Could be a Role or specific User
    ref: 'Role'
  },
  approverUserId: {
    type: mongoose.Schema.Types.ObjectId, // Specific User ID
    ref: 'User'
  },
  sequence: {
    type: Number,
    required: true // Step 1, Step 2, etc.
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Delegated'],
    default: 'Pending'
  },
  actionTimestamp: {
    type: Date
  },
  comments: {
    type: String
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
approvalRoutingLogSchema.plugin(auditPlugin);

const PRHeader = mongoose.model('PRHeader', prHeaderSchema);
const PRLineItem = mongoose.model('PRLineItem', prLineItemSchema);
const ApprovalRoutingLog = mongoose.model('ApprovalRoutingLog', approvalRoutingLogSchema);

// Export old alias for backward compatibility briefly if needed, but mainly new models
module.exports = {
  PRHeader,
  PRLineItem,
  ApprovalRoutingLog,
  PurchaseRequisition: PRHeader // For existing routes if they rely on it initially
};
