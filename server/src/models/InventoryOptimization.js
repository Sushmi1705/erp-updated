const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- LEGACY SCHEMA (DO NOT REMOVE) ---
const legacyOptimizationSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true, unique: true },
  reorderLevel: { type: Number, default: 0 },
  safetyStock: { type: Number, default: 0 },
  abcClassification: { type: String, enum: ['A', 'B', 'C', 'Unclassified'], default: 'Unclassified' },
  isDeadStock: { type: Boolean, default: false },
  lastAnalysisDate: { type: Date, default: Date.now }
}, { timestamps: true });

// --- V2 ARCHITECTURE ---

// A. OPTIMIZATION PARAMETERS
const optParameterSchema = new mongoose.Schema({
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  ABC_Class_A_Percentage: { type: Number, required: true, default: 70 },
  ABC_Class_B_Percentage: { type: Number, required: true, default: 20 },
  ABC_Class_C_Percentage: { type: Number, required: true, default: 10 },
  Dead_Stock_Threshold_Days: { type: Number, required: true, default: 180 },
  Default_Service_Level_Percent: { type: Number, default: 95 },
  Lead_Time_Demand_Variability: { type: Boolean, default: false }
}, { timestamps: true });
optParameterSchema.plugin(auditPlugin);

// B. MATERIAL OPTIMIZATION PROFILE
const matOptProfileSchema = new mongoose.Schema({
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true, unique: true },
  Category_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialCategory' },
  Reorder_Level: { type: Number, required: true, default: 0 },
  Safety_Stock: { type: Number, required: true, default: 0 },
  ABC_Class: { type: String, enum: ['A', 'B', 'C', 'Unclassified'], default: 'Unclassified' },
  Dead_Stock_Risk: { type: String, enum: ['Low Risk', 'Medium Risk', 'High Risk', 'Dead'], default: 'Low Risk' },
  Last_Analysis_Date: { type: Date, default: Date.now },
  Is_Manual_Override: { type: Boolean, default: false }
}, { timestamps: true });
matOptProfileSchema.plugin(auditPlugin);

// C. ANALYSIS RUN HISTORY
const optRunHistorySchema = new mongoose.Schema({
  Run_Start_Time: { type: Date, default: Date.now },
  Run_End_Time: { type: Date },
  Triggered_By: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Run_Type: { type: String, enum: ['Full Global Analysis', 'Category Specific', 'Scheduled Job'], required: true },
  Status: { type: String, enum: ['In Progress', 'Completed', 'Failed'], default: 'In Progress' },
  Total_Materials_Analyzed: { type: Number, default: 0 }
}, { timestamps: true });
optRunHistorySchema.plugin(auditPlugin);

// D. DEAD STOCK LOG
const deadStockLogSchema = new mongoose.Schema({
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Last_Movement_Date: { type: Date },
  Days_Inactive: { type: Number, default: 0 },
  Current_Stock_Value: { type: Number, default: 0 }
}, { timestamps: true });
deadStockLogSchema.plugin(auditPlugin);

// Models
const OptParameter = mongoose.model('OptParameter', optParameterSchema);
const MatOptProfile = mongoose.model('MatOptProfile', matOptProfileSchema);
const OptRunHistory = mongoose.model('OptRunHistory', optRunHistorySchema);
const DeadStockLog = mongoose.model('DeadStockLog', deadStockLogSchema);

// Legacy fallback
const InventoryOptimization = mongoose.models['InventoryOptimization'] || mongoose.model('InventoryOptimization', legacyOptimizationSchema);

module.exports = {
  OptParameter,
  MatOptProfile,
  OptRunHistory,
  DeadStockLog,
  InventoryOptimization
};
