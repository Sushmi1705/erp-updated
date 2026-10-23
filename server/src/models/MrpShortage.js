const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. SHORTAGE RECORD (The Core Exception Log) ---
const shortageRecordSchema = new mongoose.Schema({
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MrpRunHeader', // Nullable if generated via live refresh
  },
  itemModel: {
    type: String,
    required: true,
    enum: ['Material', 'Product']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemModel'
  },
  shortageCategory: {
    type: String,
    enum: ['Production Constraint', 'Raw Material', 'Component'],
    required: true
  },
  requiredQty: {
    type: Number,
    required: true,
    min: 0
  },
  availableQty: {
    type: Number,
    required: true,
    min: 0
  },
  shortageQty: {
    type: Number,
    required: true,
    min: 0
  },
  impactDate: {
    type: Date,
    required: true
  },
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'Action Taken', 'Resolved'],
    default: 'Open'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
shortageRecordSchema.plugin(auditPlugin);

// --- B. PRODUCTION CONSTRAINT DETAILS ---
const constraintDetailsSchema = new mongoose.Schema({
  shortageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShortageRecord',
    required: true
  },
  constraintType: {
    type: String,
    enum: ['Capacity Deficit', 'Missing BOM', 'Unapproved Routing', 'Lead Time Violation'],
    required: true
  },
  impactedWorkOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder' // Optional if tied to a specific work order
  },
  description: {
    type: String,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
constraintDetailsSchema.plugin(auditPlugin);

// --- C. SHORTAGE RESOLUTION LOG (Audit & Action Tracking) ---
const resolutionLogSchema = new mongoose.Schema({
  shortageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShortageRecord',
    required: true
  },
  actionType: {
    type: String,
    enum: ['Expedite PO', 'Substitute Item', 'Delay Work Order', 'Create Transfer'],
    required: true
  },
  referenceDocNo: {
    type: String
  },
  actionedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionDate: {
    type: Date,
    default: Date.now
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
resolutionLogSchema.plugin(auditPlugin);

const ShortageRecord = mongoose.model('ShortageRecord', shortageRecordSchema);
const ConstraintDetails = mongoose.model('ConstraintDetails', constraintDetailsSchema);
const ResolutionLog = mongoose.model('ResolutionLog', resolutionLogSchema);

module.exports = {
  ShortageRecord,
  ConstraintDetails,
  ResolutionLog,
  MrpShortage: ShortageRecord // Alias for legacy code if needed anywhere else
};
