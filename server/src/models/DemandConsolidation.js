const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. CONSOLIDATION RUN HEADER (Execution Level) ---
const consolidationRunHeaderSchema = new mongoose.Schema({
  runNumber: {
    type: String,
    required: true,
    unique: true
  },
  runDate: {
    type: Date,
    default: Date.now
  },
  targetHorizonStart: {
    type: Date,
    required: true
  },
  targetHorizonEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Processing', 'Completed', 'Failed', 'Consumed_By_MRP'],
    default: 'Completed' // typically runs to completion instantly
  },
  runType: {
    type: String,
    enum: ['Net Change', 'Full Regeneration'],
    default: 'Net Change'
  },
  executedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
consolidationRunHeaderSchema.plugin(auditPlugin);

// --- B. CONSOLIDATION LINE ITEMS (The Aggregated View) ---
const consolidationLineItemSchema = new mongoose.Schema({
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConsolidationRunHeader',
    required: true
  },
  periodName: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  forecastDemandQty: {
    type: Number,
    default: 0
  },
  salesOrderQty: {
    type: Number,
    default: 0
  },
  safetyStockQty: {
    type: Number,
    default: 0
  },
  totalGrossDemand: {
    type: Number,
    default: 0
  },
  manualAdjustmentQty: {
    type: Number,
    default: 0
  },
  finalNetDemand: {
    type: Number,
    default: 0
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });

// Rule 1: Calculation Integrity Lock
consolidationLineItemSchema.pre('save', function(next) {
  // Math sum
  this.totalGrossDemand = (this.forecastDemandQty || 0) + (this.salesOrderQty || 0) + (this.safetyStockQty || 0);
  this.finalNetDemand = this.totalGrossDemand + (this.manualAdjustmentQty || 0);
  next();
});

consolidationLineItemSchema.plugin(auditPlugin);

// --- C. SOURCE TRACEABILITY LINKS (Audit & Consumption Mapping) ---
const sourceTraceabilityLinkSchema = new mongoose.Schema({
  consolidationLineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConsolidationLineItem',
    required: true
  },
  sourceType: {
    type: String,
    enum: ['Forecast', 'Sales_Order', 'Safety_Stock_Policy'],
    required: true
  },
  sourceRecordId: {
    type: String // ObjectId or identifier
  },
  contributedQty: {
    type: Number,
    required: true
  },
  isConsumed: {
    type: Boolean,
    default: false // e.g. true if an SO consumed a Forecast quantity
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
sourceTraceabilityLinkSchema.plugin(auditPlugin);

const ConsolidationRunHeader = mongoose.model('ConsolidationRunHeader', consolidationRunHeaderSchema);
const ConsolidationLineItem = mongoose.model('ConsolidationLineItem', consolidationLineItemSchema);
const SourceTraceabilityLink = mongoose.model('SourceTraceabilityLink', sourceTraceabilityLinkSchema);

module.exports = {
  ConsolidationRunHeader,
  ConsolidationLineItem,
  SourceTraceabilityLink,
  DemandConsolidation: ConsolidationLineItem // Alias for legacy code if needed
};
