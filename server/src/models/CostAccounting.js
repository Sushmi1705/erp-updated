const mongoose = require('mongoose');
const { internalId } = require('../utils/internalId');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. COSTING RUN / PERIOD HEADER (Parent Level) ---
const costingPeriodHeaderSchema = new mongoose.Schema({
  Period_ID: { type: String, default: () => internalId('PRD') },
  Fiscal_Year: { type: String, required: true },
  Fiscal_Quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },
  Start_Date: { type: Date, required: true },
  End_Date: { type: Date, required: true },
  Status: { type: String, enum: ['Open', 'Closed', 'Reconciling'], default: 'Open' }
}, { timestamps: true, strict: false });
costingPeriodHeaderSchema.plugin(auditPlugin);

// --- B. MATERIAL COST LEDGER (Material Costing) ---
const materialCostLedgerSchema = new mongoose.Schema({
  Mat_Cost_ID: { type: String, default: () => internalId('MCOST') },
  Period_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'CostingPeriodHeader', required: true },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  Total_Procurement_Cost: { type: Number, required: true, default: 0 },
  Quantity_Received: { type: Number, default: 0 },
  Unit_Cost: { type: Number, default: 0 },
  Previous_Quarter_Cost: { type: Number, default: 0 },
  Source_Document_Type: { type: String, enum: ['PO_Receipt', 'AP_Invoice'], default: 'PO_Receipt' }
}, { timestamps: true, strict: false });
materialCostLedgerSchema.plugin(auditPlugin);

// --- C. PRODUCTION COST LEDGER (Labor & Overheads) ---
const productionCostLedgerSchema = new mongoose.Schema({
  Prod_Cost_ID: { type: String, default: () => internalId('PCOST') },
  Period_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'CostingPeriodHeader', required: true },
  Work_Order_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
  Work_Center_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkCenter' },
  Direct_Labor_Cost: { type: Number, required: true, default: 0 },
  Labor_Hours_Logged: { type: Number, default: 0 },
  Manufacturing_Overheads: { type: Number, default: 0 },
  Overhead_Absorption_Rate: { type: Number, default: 25.0 }, // Rate per hour
  Allocation_Base: { type: String, enum: ['Direct_Labor_Hours', 'Machine_Hours'], default: 'Machine_Hours' }
}, { timestamps: true, strict: false });
productionCostLedgerSchema.plugin(auditPlugin);

// --- D. PROFITABILITY ANALYSIS LOG (Margin Engine) ---
const profitabilityAnalysisLogSchema = new mongoose.Schema({
  Profitability_ID: { type: String, default: () => internalId('PROF') },
  Period_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'CostingPeriodHeader', required: true },
  Product_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  Total_Revenue: { type: Number, required: true, default: 0 },
  Total_COGS: { type: Number, required: true, default: 0 },
  Total_Operating_Expenses: { type: Number, default: 0 },
  Average_Gross_Margin_Pct: { type: Number, default: 0 },
  Average_Net_Margin_Pct: { type: Number, default: 0 }
}, { timestamps: true, strict: false });
profitabilityAnalysisLogSchema.plugin(auditPlugin);

const CostingPeriodHeader = mongoose.model('CostingPeriodHeader', costingPeriodHeaderSchema);
const MaterialCostLedger = mongoose.model('MaterialCostLedger', materialCostLedgerSchema);
const ProductionCostLedger = mongoose.model('ProductionCostLedger', productionCostLedgerSchema);
const ProfitabilityAnalysisLog = mongoose.model('ProfitabilityAnalysisLog', profitabilityAnalysisLogSchema);

module.exports = {
  CostingPeriodHeader,
  MaterialCostLedger,
  ProductionCostLedger,
  ProfitabilityAnalysisLog
};
