const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. PREVENTIVE MAINTENANCE HEADER (Parent Level) ---
const preventiveMaintenanceHeaderSchema = new mongoose.Schema({
  PM_ID: { type: String, required: true, unique: true },
  Machine_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true },
  Task_Summary: { type: String, required: true },
  Status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'], default: 'Scheduled' },
  Technician_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Scheduled_Date: { type: Date, required: true },
  Executed_Date: { type: Date },
  Maintenance_Type: { type: String, enum: ['Time-Based', 'Usage-Based', 'Condition-Based'], default: 'Time-Based' },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true });
preventiveMaintenanceHeaderSchema.plugin(auditPlugin);

// --- B. MAINTENANCE TASKS / CHECKLIST (Line Items) ---
const maintenanceTaskChecklistSchema = new mongoose.Schema({
  PM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'PreventiveMaintenanceHeader', required: true },
  Sequence_Number: { type: Number, default: 1 },
  Task_Description: { type: String, required: true },
  Is_Completed: { type: Boolean, default: false },
  Task_Notes: { type: String }
}, { timestamps: true });
maintenanceTaskChecklistSchema.plugin(auditPlugin);

// --- C. SPARE PARTS CONSUMPTION (Materials Used) ---
const sparePartsConsumptionSchema = new mongoose.Schema({
  PM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'PreventiveMaintenanceHeader', required: true },
  Spare_Part_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Planned_Quantity: { type: Number, default: 1, min: 0 },
  Actual_Quantity_Consumed: { type: Number, default: 1, min: 0 },
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' }
}, { timestamps: true });
sparePartsConsumptionSchema.plugin(auditPlugin);

const PreventiveMaintenanceHeader = mongoose.model('PreventiveMaintenanceHeader', preventiveMaintenanceHeaderSchema);
const MaintenanceTaskChecklist = mongoose.model('MaintenanceTaskChecklist', maintenanceTaskChecklistSchema);
const SparePartsConsumption = mongoose.model('SparePartsConsumption', sparePartsConsumptionSchema);

module.exports = {
  PreventiveMaintenanceHeader,
  MaintenanceTaskChecklist,
  SparePartsConsumption
};
