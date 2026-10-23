const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- LEGACY SCHEMA (DO NOT REMOVE) ---
const legacyValuationSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true, unique: true },
  fifoValuation: { type: Number, default: 0 },
  weightedAverageCost: { type: Number, default: 0 },
  lastCalculatedDate: { type: Date, default: Date.now }
}, { timestamps: true });

// --- V2 ARCHITECTURE ---

// A. VALUATION SUMMARY (Dashboard Metrics)
const valuationSummarySchema = new mongoose.Schema({
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Total_FIFO_Valuation: { type: Number, default: 0 },
  Total_WAC_Tracked_Items: { type: Number, default: 0 },
  Last_Global_Calculation: { type: Date, default: Date.now }
}, { timestamps: true });
valuationSummarySchema.plugin(auditPlugin);

// B. MATERIAL VALUATION PROFILE (Core UI Table)
const matValProfileSchema = new mongoose.Schema({
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true, unique: true },
  Standard_Cost_Ref: { type: Number, default: 0 },
  Calculated_FIFO_Value: { type: Number, default: 0 },
  Weighted_Avg_Cost_Per_Unit: { type: Number, default: 0 },
  Primary_Valuation_Method: { type: String, enum: ['FIFO', 'WAC', 'Standard'], default: 'FIFO' },
  Last_Calculated: { type: Date, default: Date.now }
}, { timestamps: true });
matValProfileSchema.plugin(auditPlugin);

// C. FIFO COST LAYERS (Sub-table for FIFO Calculation)
const fifoCostLayerSchema = new mongoose.Schema({
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Receipt_Transaction_ID: { type: mongoose.Schema.Types.ObjectId }, // Can map to legacy InvTxn or new V2 lines
  Receipt_Date: { type: Date, required: true },
  Original_Quantity: { type: Number, required: true },
  Remaining_Quantity: { type: Number, required: true },
  Unit_Cost: { type: Number, required: true }
}, { timestamps: true });
fifoCostLayerSchema.plugin(auditPlugin);

// D. VALUATION RUN HISTORY (Audit Log)
const valRunHistorySchema = new mongoose.Schema({
  Triggered_By: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Run_Start_Time: { type: Date, default: Date.now },
  Run_End_Time: { type: Date },
  Run_Type: { type: String, enum: ['System-Wide', 'Single Item', 'Manual Override'], required: true },
  Status: { type: String, enum: ['Success', 'Failed', 'In Progress'], default: 'In Progress' }
}, { timestamps: true });
valRunHistorySchema.plugin(auditPlugin);

// Models
const ValuationSummary = mongoose.model('ValuationSummary', valuationSummarySchema);
const MatValProfile = mongoose.model('MatValProfile', matValProfileSchema);
const FIFOCostLayer = mongoose.model('FIFOCostLayer', fifoCostLayerSchema);
const ValRunHistory = mongoose.model('ValRunHistory', valRunHistorySchema);

// Legacy fallback
const InventoryValuation = mongoose.models['InventoryValuation'] || mongoose.model('InventoryValuation', legacyValuationSchema);

module.exports = {
  ValuationSummary,
  MatValProfile,
  FIFOCostLayer,
  ValRunHistory,
  InventoryValuation
};
