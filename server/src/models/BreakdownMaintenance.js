const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. BREAKDOWN INCIDENT HEADER (Parent Level) ---
const breakdownIncidentHeaderSchema = new mongoose.Schema({
  Incident_ID: { type: String, required: true, unique: true },
  Machine_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true },
  Reported_Issue: { type: String, required: true },
  Reported_By_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Reported_Datetime: { type: Date, default: Date.now },
  Resolution_Datetime: { type: Date },
  Total_Downtime_Hours: { type: Number, default: 0, min: 0 },
  Status: { type: String, enum: ['Open', 'In Progress', 'Waiting on Spares', 'Resolved'], default: 'Open' },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true });
breakdownIncidentHeaderSchema.plugin(auditPlugin);

// --- B. REPAIR ACTION LOGS (Progression Tracking) ---
const repairActionLogSchema = new mongoose.Schema({
  Incident_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'BreakdownIncidentHeader', required: true },
  Technician_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Action_Taken: { type: String, required: true },
  Log_Datetime: { type: Date, default: Date.now },
  Labor_Hours_Spent: { type: Number, default: 1, min: 0 }
}, { timestamps: true });
repairActionLogSchema.plugin(auditPlugin);

// --- C. SPARE PARTS CONSUMPTION (Materials Used) ---
const breakdownSparePartsConsumptionSchema = new mongoose.Schema({
  Incident_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'BreakdownIncidentHeader', required: true },
  Spare_Part_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Quantity_Consumed: { type: Number, required: true, min: 1 },
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  Unit_Cost: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
breakdownSparePartsConsumptionSchema.plugin(auditPlugin);

// --- D. BREAKDOWN COST ANALYSIS (Calculated Totals) ---
const breakdownCostAnalysisSchema = new mongoose.Schema({
  Incident_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'BreakdownIncidentHeader', required: true },
  Spares_Cost: { type: Number, default: 0, min: 0 },
  Labor_Cost: { type: Number, default: 0, min: 0 },
  Downtime_Cost: { type: Number, default: 0, min: 0 },
  Total_Incident_Cost: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
breakdownCostAnalysisSchema.plugin(auditPlugin);

const BreakdownIncidentHeader = mongoose.model('BreakdownIncidentHeader', breakdownIncidentHeaderSchema);
const RepairActionLog = mongoose.model('RepairActionLog', repairActionLogSchema);
const BreakdownSparePartsConsumption = mongoose.model('BreakdownSparePartsConsumption', breakdownSparePartsConsumptionSchema);
const BreakdownCostAnalysis = mongoose.model('BreakdownCostAnalysis', breakdownCostAnalysisSchema);

module.exports = {
  BreakdownIncidentHeader,
  RepairActionLog,
  BreakdownSparePartsConsumption,
  BreakdownCostAnalysis
};
