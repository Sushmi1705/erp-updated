const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. SCRAP HEADER (Event Core) ---
const scrapHeaderSchema = new mongoose.Schema({
  Scrap_Log_ID: { type: String, required: true, unique: true },
  Scrap_Log_Number: { type: String, required: true },
  WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader', required: true },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Logged_Date: { type: Date, default: Date.now },
  Logged_By_User_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Status: { type: String, enum: ['Draft', 'Posted', 'Reversed'], default: 'Draft' }
}, { timestamps: true });
scrapHeaderSchema.plugin(auditPlugin);

// --- B. MATERIAL & COSTING (Financial Impact) ---
const scrapDetailSchema = new mongoose.Schema({
  Scrap_Log_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapHeader', required: true },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Material_Type: { type: String, enum: ['Component', 'Finished Good'], default: 'Component' },
  Quantity: { type: Number, required: true, min: 0.0001 },
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  Unit_Cost: { type: Number, required: true, min: 0 },
  Total_Value_Lost: { type: Number, required: true, min: 0 }
}, { timestamps: true });
scrapDetailSchema.plugin(auditPlugin);

// --- C. ROOT CAUSE ANALYSIS (Investigation) ---
const scrapRootCauseSchema = new mongoose.Schema({
  Scrap_Log_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapHeader', required: true },
  Root_Cause_Description: { type: String, required: true },
  Defect_Code_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DefectCode' }
}, { timestamps: true });
scrapRootCauseSchema.plugin(auditPlugin);

// --- D. DASHBOARD METRICS (KPI Rollups Cache) ---
const scrapDashboardMetricsSchema = new mongoose.Schema({
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Total_Financial_Impact: { type: Number, default: 0 },
  Total_Items_Scrapped: { type: Number, default: 0 },
  Total_Scrap_Incidents: { type: Number, default: 0 },
  Last_Updated: { type: Date, default: Date.now }
}, { timestamps: true });
scrapDashboardMetricsSchema.plugin(auditPlugin);

const ScrapHeader = mongoose.model('ScrapHeader', scrapHeaderSchema);
const ScrapDetail = mongoose.model('ScrapDetail', scrapDetailSchema);
const ScrapRootCause = mongoose.model('ScrapRootCause', scrapRootCauseSchema);
const ScrapDashboardMetrics = mongoose.model('ScrapDashboardMetrics', scrapDashboardMetricsSchema);

module.exports = {
  ScrapHeader,
  ScrapDetail,
  ScrapRootCause,
  ScrapDashboardMetrics
};
