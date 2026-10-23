const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- CAPACITY PERIOD / LEDGER (The UI Table Row) ---
const capacityPeriodSchema = new mongoose.Schema({
  workCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkCenter',
    required: true
  },
  periodLabel: {
    type: String, // e.g., 'WEEK 3'
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  availableHrs: {
    type: Number,
    required: true,
    min: 0
  },
  utilizedHrs: {
    type: Number,
    default: 0,
    min: 0
  },
  utilizationPct: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Underutilized', 'Optimal', 'Bottleneck'],
    default: 'Optimal'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
capacityPeriodSchema.plugin(auditPlugin);

// --- LOAD DETAIL (The Underlying Demand) ---
const loadDetailSchema = new mongoose.Schema({
  capacityPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CapacityPeriod',
    required: true
  },
  workOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: 'WorkOrder', // Mocking reference to a shop floor work order
    required: true
  },
  routingStepNo: {
    type: Number,
    required: true
  },
  setupHours: {
    type: Number,
    default: 0
  },
  runHours: {
    type: Number,
    default: 0
  },
  totalRequiredHours: {
    type: Number,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
loadDetailSchema.plugin(auditPlugin);

const CapacityPeriod = mongoose.model('CapacityPeriod', capacityPeriodSchema);
const LoadDetail = mongoose.model('LoadDetail', loadDetailSchema);

// --- LABOR CAPACITY PERIOD / LEDGER ---
const laborCapacityPeriodSchema = new mongoose.Schema({
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  shiftName: {
    type: String,
    enum: ['Morning', 'Evening', 'Night'],
    required: true
  },
  standardShiftHours: {
    type: Number,
    default: 8.0
  },
  periodLabel: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  headcount: {
    type: Number,
    default: 0,
    min: 0
  },
  availableHrs: {
    type: Number,
    default: 0
  },
  plannedHrs: {
    type: Number,
    default: 0
  },
  varianceHrs: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Understaffed', 'Optimal', 'Overstaffed', 'Skill Constraint'],
    default: 'Optimal'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
laborCapacityPeriodSchema.plugin(auditPlugin);

// --- LABOR LOAD DETAIL (The Underlying Demand) ---
const laborLoadDetailSchema = new mongoose.Schema({
  laborPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LaborCapacityPeriod',
    required: true
  },
  workOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: 'WorkOrder', // Mock reference
    required: true
  },
  routingStepNo: {
    type: Number,
    required: true
  },
  requiredLaborHours: {
    type: Number,
    required: true,
    min: 0
  },
  skillLevelRequired: {
    type: String,
    enum: ['Basic', 'Intermediate', 'Expert'],
    default: 'Basic'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
laborLoadDetailSchema.plugin(auditPlugin);

const LaborCapacityPeriod = mongoose.model('LaborCapacityPeriod', laborCapacityPeriodSchema);
const LaborLoadDetail = mongoose.model('LaborLoadDetail', laborLoadDetailSchema);

module.exports = {
  CapacityPeriod,
  LoadDetail,
  LaborCapacityPeriod,
  LaborLoadDetail
};
