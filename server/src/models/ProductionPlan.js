const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- LEGACY SCHEMA (DO NOT REMOVE) ---
const legacyProductionPlanSchema = new mongoose.Schema({
  planNumber: { type: String, required: true, unique: true },
  planDate: { type: Date, default: Date.now },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  plannedQuantity: { type: Number, required: true, min: 1 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected'], default: 'Draft' },
  capacityValidated: { type: Boolean, default: false },
  notes: String,
  approvedBy: { type: String }
}, { timestamps: true });

// --- V2 ARCHITECTURE ---

// A. PLAN HEADER
const planHeaderSchema = new mongoose.Schema({
  Plan_Number: { type: String, required: true, unique: true },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Plan_Type: { type: String, enum: ['Make-to-Stock', 'Make-to-Order', 'Experimental'], default: 'Make-to-Stock' },
  Status: { type: String, enum: ['Draft', 'Pending Approval', 'Approved', 'Released', 'Closed', 'Canceled'], default: 'Draft' },
  Capacity_Status: { type: String, enum: ['Unchecked', 'Validated', 'Overloaded', 'Partially Validated'], default: 'Unchecked' },
  Priority: { type: String, enum: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
  Notes: { type: String }
}, { timestamps: true });
planHeaderSchema.plugin(auditPlugin);

// B. PLAN DETAILS
const planDetailSchema = new mongoose.Schema({
  Plan_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanHeader', required: true },
  Line_Sequence_Number: { type: Number, required: true },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Target_Quantity: { type: Number, required: true },
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  Planned_Start_Date: { type: Date, required: true },
  Planned_End_Date: { type: Date, required: true },
  BOM_Revision_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'BOM' },
  Routing_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Routing' }
}, { timestamps: true });
planDetailSchema.plugin(auditPlugin);

// C. CAPACITY VALIDATION
const capacityValidationSchema = new mongoose.Schema({
  Plan_Detail_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanDetail', required: true },
  Work_Center_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkCenter' },
  Required_Machine_Hours: { type: Number, default: 0 },
  Required_Labor_Hours: { type: Number, default: 0 },
  Available_Capacity: { type: Number, default: 0 },
  Validation_Date: { type: Date, default: Date.now },
  Is_Bottleneck: { type: Boolean, default: false },
  Capacity_Status: { type: String, enum: ['Validated', 'Overloaded'], default: 'Validated' }
}, { timestamps: true });
capacityValidationSchema.plugin(auditPlugin);

// D. APPROVAL ROUTING
const approvalRoutingSchema = new mongoose.Schema({
  Plan_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanHeader', required: true },
  Approver_Role_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  Assigned_User_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Step_Sequence: { type: Number, required: true },
  Action_Taken: { type: String, enum: ['Approved', 'Rejected', 'Clarification Requested', 'Pending'], default: 'Pending' },
  Action_Date: { type: Date },
  Approver_Comments: { type: String }
}, { timestamps: true });
approvalRoutingSchema.plugin(auditPlugin);


const PlanHeader = mongoose.model('PlanHeader', planHeaderSchema);
const PlanDetail = mongoose.model('PlanDetail', planDetailSchema);
const CapacityValidation = mongoose.model('CapacityValidation', capacityValidationSchema);
const ApprovalRouting = mongoose.model('ApprovalRouting', approvalRoutingSchema);

// Legacy fallback
const ProductionPlan = mongoose.models['ProductionPlan'] || mongoose.model('ProductionPlan', legacyProductionPlanSchema);

module.exports = {
  PlanHeader,
  PlanDetail,
  CapacityValidation,
  ApprovalRouting,
  ProductionPlan
};
