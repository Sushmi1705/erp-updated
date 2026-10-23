const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. SPARE PART LEDGER (Current Stock Header) ---
const sparePartLedgerSchema = new mongoose.Schema({
  Part_ID: { type: String, required: true, unique: true },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Part_Name: { type: String, required: true },
  Stock_On_Hand: { type: Number, default: 0, min: 0 },
  Unit_Cost: { type: Number, default: 0, min: 0 },
  Total_Value: { type: Number, default: 0, min: 0 },
  Minimum_Stock_Level: { type: Number, default: 5, min: 0 },
  Is_Reorder_Warning: { type: Boolean, default: false },
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true });
sparePartLedgerSchema.plugin(auditPlugin);

// --- B. PART ACTIVITY LOG (Transaction History) ---
const partActivityLogSchema = new mongoose.Schema({
  Activity_ID: { type: String, required: true, unique: true },
  Part_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePartLedger', required: true },
  Activity_Type: { type: String, enum: ['Receipt', 'Issue', 'Adjustment', 'Return'], required: true },
  Transaction_Quantity: { type: Number, required: true },
  Unit_Cost_At_Transaction: { type: Number, required: true },
  Transaction_Date: { type: Date, default: Date.now },
  Performed_By_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
partActivityLogSchema.plugin(auditPlugin);

// --- C. MAINTENANCE LINKAGE (Traceability) ---
const maintenanceLinkageSchema = new mongoose.Schema({
  Activity_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'PartActivityLog', required: true },
  Maintenance_Type: { type: String, enum: ['Preventive', 'Breakdown', 'General'], default: 'General' },
  Reference_Ticket_ID: { type: String }, // Links to PM_ID or Incident_ID
  Target_Machine_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine' },
  Remarks: { type: String }
}, { timestamps: true });
maintenanceLinkageSchema.plugin(auditPlugin);

const SparePartLedger = mongoose.model('SparePartLedger', sparePartLedgerSchema);
const PartActivityLog = mongoose.model('PartActivityLog', partActivityLogSchema);
const MaintenanceLinkage = mongoose.model('MaintenanceLinkage', maintenanceLinkageSchema);

module.exports = {
  SparePartLedger,
  PartActivityLog,
  MaintenanceLinkage
};
