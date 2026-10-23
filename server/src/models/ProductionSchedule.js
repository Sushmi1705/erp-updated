const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. PRODUCTION SCHEDULE RECORD ---
const productionScheduleSchema = new mongoose.Schema({
  scheduleType: {
    type: String, // Equivalent to Timeline_Type
    enum: ['Daily', 'Weekly', 'Monthly'],
    required: true
  },
  targetDate: {
    type: Date,
    required: true
  },
  mrpRecommendationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecommendationRecord' // Ref to MRP Recommendation
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  scheduledQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  assignedWorkCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkCenter'
  },
  status: {
    type: String,
    enum: ['Draft', 'Firm/Released', 'In-Progress', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  shift: {
    type: String,
    enum: ['Shift 1', 'Shift 2', 'Shift 3', 'General'],
    default: 'Shift 1'
  },
  priority: {
    type: String,
    enum: ['Critical', 'Expedite', 'Normal', 'Buffer'],
    default: 'Normal'
  },
  sequence: {
    type: Number,
    default: 10
  },
  dieToolId: {
    type: String,
    trim: true
  },
  setupTimeHours: {
    type: Number,
    default: 0.5
  },
  runTimeHours: {
    type: Number,
    default: 2.0
  },
  plannedOperators: {
    type: Number,
    default: 2
  },
  workOrderNumber: {
    type: String
  },
  producedQuantity: {
    type: Number,
    default: 0
  },
  scrappedQuantity: {
    type: Number,
    default: 0
  },
  batchNumber: {
    type: String
  },
  customerReference: {
    type: String
  },
  notes: String,
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
productionScheduleSchema.plugin(auditPlugin);

// --- B. DISPATCH LIST (The Shop Floor View) ---
const dispatchListSchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionSchedule',
    required: true
  },
  sequenceNumber: {
    type: Number,
    required: true
  },
  expectedStartTime: {
    type: Date
  },
  expectedEndTime: {
    type: Date
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
dispatchListSchema.plugin(auditPlugin);

const ProductionSchedule = mongoose.model('ProductionSchedule', productionScheduleSchema);
const DispatchList = mongoose.model('DispatchList', dispatchListSchema);

module.exports = {
  ProductionSchedule,
  DispatchList
};
