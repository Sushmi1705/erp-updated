const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. MRP RECOMMENDATION RECORD (Planned Orders) ---
const recommendationRecordSchema = new mongoose.Schema({
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MrpRunHeader',
    required: true
  },
  itemModel: {
    type: String,
    enum: ['Material', 'Product'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'itemModel',
    required: true
  },
  suggestionCategory: {
    type: String,
    enum: ['Purchase', 'Production', 'Reschedule'],
    required: true
  },
  actionType: {
    type: String,
    enum: ['Create New', 'Reschedule In', 'Reschedule Out', 'Cancel'],
    required: true
  },
  suggestedQty: {
    type: Number,
    required: true,
    min: 0
  },
  suggestedReleaseDate: {
    type: Date,
    required: true
  },
  suggestedDueDate: {
    type: Date,
    required: true
  },
  targetSupplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  referenceOrderId: {
    type: mongoose.Schema.Types.ObjectId, // Ref to PO or WO
  },
  status: {
    type: String,
    enum: ['Pending', 'Selected', 'Converted', 'Rejected', 'Dismissed'], // Dismissed used for invalidation
    default: 'Pending'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
recommendationRecordSchema.plugin(auditPlugin);

// --- B. CONVERSION AUDIT LOG ---
const conversionAuditLogSchema = new mongoose.Schema({
  recommendationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecommendationRecord',
    required: true
  },
  generatedDocType: {
    type: String,
    enum: ['Purchase Order', 'Work Order', 'Transfer Order'],
    required: true
  },
  generatedDocId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true // Refers to the newly created PO or WO
  },
  convertedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversionTimestamp: {
    type: Date,
    default: Date.now
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
conversionAuditLogSchema.plugin(auditPlugin);

const RecommendationRecord = mongoose.model('RecommendationRecord', recommendationRecordSchema);
const ConversionAuditLog = mongoose.model('ConversionAuditLog', conversionAuditLogSchema);

module.exports = {
  RecommendationRecord,
  ConversionAuditLog,
  MrpRecommendation: RecommendationRecord // Alias for legacy controller if needed anywhere
};
