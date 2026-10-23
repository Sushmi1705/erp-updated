const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. FORECAST HEADER ---
const forecastHeaderSchema = new mongoose.Schema({
  forecastNumber: { type: String, required: true, unique: true },
  forecastType: { type: String, enum: ['Customer', 'Product', 'Product Family', 'Region'], required: true },
  targetEntityId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Polymorphic based on forecastType
  forecastPeriod: { type: String, required: true },
  algorithmUsed: { type: String, enum: ['Moving Average', 'Exponential Smoothing', 'ML-Prophet', 'Manual Entry'], required: true },
  status: { type: String, enum: ['Draft', 'Calculating', 'Pending Review', 'Finalized', 'Obsolete'], default: 'Draft' },
  totalAdjustedQty: { type: Number, default: 0 },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
}, { timestamps: true });
forecastHeaderSchema.plugin(auditPlugin);

// --- B. FORECAST LINE ITEMS ---
const forecastLineItemSchema = new mongoose.Schema({
  forecastId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForecastHeader', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  timeBucketDate: { type: Date, required: true },
  systemCalculatedQty: { type: Number, default: 0 },
  manualAdjustedQty: { type: Number, default: 0 },
  finalForecastQty: { type: Number, default: 0 },
  uomId: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  confidenceScorePercentage: { type: Number, min: 0, max: 100 }
}, { timestamps: true });
forecastLineItemSchema.plugin(auditPlugin);

// --- C. HISTORICAL DATA REFERENCES ---
const forecastHistoryRefSchema = new mongoose.Schema({
  forecastId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForecastHeader', required: true },
  sourceModule: { type: String, enum: ['Sales Orders', 'Shipments', 'Point of Sale', 'Manual Upload'], required: true },
  sourceRecordId: { type: String, required: true },
  historicalPeriodDate: { type: Date, required: true },
  quantityConsumed: { type: Number, default: 0 }
}, { timestamps: true });
forecastHistoryRefSchema.plugin(auditPlugin);

// --- D. ADJUSTMENTS & OVERRIDES ---
const forecastAdjustmentSchema = new mongoose.Schema({
  lineId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForecastLineItem', required: true },
  adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adjustmentDate: { type: Date, default: Date.now },
  previousQty: { type: Number, required: true },
  newQty: { type: Number, required: true },
  reasonCode: { type: String, enum: ['Market Trend', 'Promotion', 'Customer Insight', 'Outlier Correction'], required: true },
  notes: { type: String }
}, { timestamps: true });
forecastAdjustmentSchema.plugin(auditPlugin);

const ForecastHeader = mongoose.model('ForecastHeader', forecastHeaderSchema);
const ForecastLineItem = mongoose.model('ForecastLineItem', forecastLineItemSchema);
const ForecastHistoryRef = mongoose.model('ForecastHistoryRef', forecastHistoryRefSchema);
const ForecastAdjustment = mongoose.model('ForecastAdjustment', forecastAdjustmentSchema);

// Exporting aliases for backward compatibility with DemandConsolidation logic
module.exports = {
  ForecastHeader,
  DemandForecast: ForecastHeader,
  ForecastLineItem,
  ForecastHistoryRef,
  ForecastAdjustment
};
