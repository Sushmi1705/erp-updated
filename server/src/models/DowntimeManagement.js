const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. DOWNTIME HEADER (Event Core) ---
const downtimeHeaderSchema = new mongoose.Schema({
  DT_Log_ID: { type: String, required: true, unique: true },
  DT_Log_Number: { type: String, required: true },
  Hardware_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Status: { type: String, enum: ['Active', 'Investigating', 'Resolved', 'Closed'], default: 'Active' },
  Start_Time: { type: Date, default: Date.now },
  End_Time: { type: Date },
  Duration_Minutes: { type: Number, default: 0 },
  Logged_Date: { type: Date, default: Date.now }
}, { timestamps: true });
downtimeHeaderSchema.plugin(auditPlugin);

// --- B. CAUSE & CLASSIFICATION (Type & Reason) ---
const downtimeCauseSchema = new mongoose.Schema({
  DT_Log_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DowntimeHeader', required: true },
  DT_Type: { type: String, enum: ['Planned', 'Unplanned', 'Preventative'], default: 'Unplanned' },
  Reason_Code_ID: { type: String }, // Code or Reason Master
  Reason_Description: { type: String, required: true },
  Component_Failed: { type: String }
}, { timestamps: true });
downtimeCauseSchema.plugin(auditPlugin);

// --- C. IMPACT ANALYSIS (Production Effect) ---
const downtimeImpactSchema = new mongoose.Schema({
  DT_Log_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DowntimeHeader', required: true },
  Impact_Analysis_Notes: { type: String },
  Affected_WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader' },
  Estimated_Production_Loss_Qty: { type: Number, default: 0 }
}, { timestamps: true });
downtimeImpactSchema.plugin(auditPlugin);

// --- D. RESOLUTION TRACKING (Maintenance Link) ---
const downtimeResolutionSchema = new mongoose.Schema({
  DT_Log_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DowntimeHeader', required: true },
  Maintenance_WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader' },
  Resolved_By_User_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Corrective_Action_Taken: { type: String },
  Resolution_Timestamp: { type: Date, default: Date.now }
}, { timestamps: true });
downtimeResolutionSchema.plugin(auditPlugin);

const DowntimeHeader = mongoose.model('DowntimeHeader', downtimeHeaderSchema);
const DowntimeCause = mongoose.model('DowntimeCause', downtimeCauseSchema);
const DowntimeImpact = mongoose.model('DowntimeImpact', downtimeImpactSchema);
const DowntimeResolution = mongoose.model('DowntimeResolution', downtimeResolutionSchema);

module.exports = {
  DowntimeHeader,
  DowntimeCause,
  DowntimeImpact,
  DowntimeResolution
};
