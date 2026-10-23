const mongoose = require('mongoose');

// --- A. VENDOR SCORECARD (The Live Dashboard) ---
const vendorScorecardSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    unique: true
  },
  currentOverallScore: {
    type: Number,
    default: 100 // Starts at 100
  },
  rollingOtifPct: {
    type: Number, // On Time In Full percentage
    default: 100
  },
  rollingDefectPpm: {
    type: Number, // Parts Per Million defective
    default: 0
  },
  rollingPpvPct: {
    type: Number, // Average price variance
    default: 0
  },
  riskStatus: {
    type: String,
    enum: ['Approved', 'Probation', 'Blocked'],
    default: 'Approved'
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// --- B. KPI EVENT LOG (The Raw Transactional Data) ---
const kpiEventLogSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  sourceModule: {
    type: String,
    enum: ['Goods_Receipt', 'QA_Inspection', 'Invoice_Processing', 'Compliance_Monitor'],
    required: true
  },
  referenceDocId: {
    type: String, // e.g., GR-9942, QA-1102
    required: true
  },
  kpiCategory: {
    type: String,
    enum: ['Delivery', 'Quality', 'Cost', 'Compliance'],
    required: true
  },
  impactValue: {
    type: Number, // e.g., -5 points for a late delivery
    required: true
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// --- C. SCORECARD WEIGHTING CONFIGURATION ---
const scorecardWeightingSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Delivery', 'Quality', 'Cost', 'Compliance'],
    required: true,
    unique: true
  },
  weightPercentage: {
    type: Number,
    required: true
  },
  targetThreshold: {
    type: Number
  }
});

module.exports = {
  VendorScorecard: mongoose.model('VendorScorecard', vendorScorecardSchema),
  KPIEventLog: mongoose.model('KPIEventLog', kpiEventLogSchema),
  ScorecardWeighting: mongoose.model('ScorecardWeighting', scorecardWeightingSchema)
};
