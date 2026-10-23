const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- LEGACY SCHEMA (DO NOT REMOVE) ---
const legacyAllocatedMaterialSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  requiredQty: { type: Number, required: true },
  reservedQty: { type: Number, default: 0 },
  issuedQty: { type: Number, default: 0 },
  consumedQty: { type: Number, default: 0 }
});

const legacyWorkOrderSchema = new mongoose.Schema({
  workOrderNumber: { type: String, required: true, unique: true },
  issueDate: { type: Date, default: Date.now },
  productionPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionPlan', required: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  targetQuantity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['Created', 'Released', 'In-Progress', 'Completed', 'Closed'], default: 'Created' },
  materialStatus: { type: String, enum: ['Pending', 'Reserved', 'Issued', 'Consumed'], default: 'Pending' },
  allocatedMaterials: [legacyAllocatedMaterialSchema],
  progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  actualStartDate: Date,
  actualEndDate: Date,
  ecmFlag: { type: Boolean, default: false },
  ecmReference: { type: mongoose.Schema.Types.ObjectId, ref: 'ECMHeader' },
  ecmFlagDate: Date,
  ecmFlagNote: String
}, { timestamps: true });

// --- V2 ARCHITECTURE ---

// A. WORK ORDER HEADER
const woHeaderSchema = new mongoose.Schema({
  WO_Number: { type: String, required: true, unique: true },
  Source_Plan_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanHeader', required: true },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Status: { type: String, enum: ['Draft', 'Released', 'In Progress', 'Completed', 'Closed', 'Canceled'], default: 'Draft' },
  Material_Status: { type: String, enum: ['Pending', 'Allocated', 'Partially Consumed', 'Consumed'], default: 'Pending' },
  Overall_Progress_Percentage: { type: Number, default: 0, min: 0, max: 100 },
  Actual_Start_Date: { type: Date },
  Actual_End_Date: { type: Date },
  ecmFlag: { type: Boolean, default: false },
  ecmReference: { type: mongoose.Schema.Types.ObjectId, ref: 'ECMHeader' },
  ecmFlagDate: Date,
  ecmFlagNote: String
}, { timestamps: true });
woHeaderSchema.plugin(auditPlugin);

// B. WORK ORDER DETAILS
const woDetailSchema = new mongoose.Schema({
  WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader', required: true },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Target_Quantity: { type: Number, required: true },
  Produced_Quantity: { type: Number, default: 0 },
  Scrapped_Quantity: { type: Number, default: 0 },
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  BOM_Revision_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'BOM' }
}, { timestamps: true });
woDetailSchema.plugin(auditPlugin);

// C. MATERIAL TRACKING
const materialTrackingSchema = new mongoose.Schema({
  WO_Detail_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WODetail', required: true },
  Component_Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Required_Quantity: { type: Number, required: true },
  Issued_Quantity: { type: Number, default: 0 },
  Consumed_Quantity: { type: Number, default: 0 },
  Warehouse_Location_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' }
}, { timestamps: true });
materialTrackingSchema.plugin(auditPlugin);

// D. EXECUTION PROGRESS
const executionProgressSchema = new mongoose.Schema({
  WO_Detail_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WODetail', required: true },
  Operation_Sequence: { type: Number, required: true },
  Work_Center_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkCenter' },
  Step_Status: { type: String, enum: ['Pending', 'Active', 'Completed', 'Paused'], default: 'Pending' },
  Completed_Qty_At_Step: { type: Number, default: 0 }
}, { timestamps: true });
executionProgressSchema.plugin(auditPlugin);


const WOHeader = mongoose.model('WOHeader', woHeaderSchema);
const WODetail = mongoose.model('WODetail', woDetailSchema);
const MaterialTracking = mongoose.model('MaterialTracking', materialTrackingSchema);
const ExecutionProgress = mongoose.model('ExecutionProgress', executionProgressSchema);

// Legacy fallback
const WorkOrder = mongoose.models['WorkOrder'] || mongoose.model('WorkOrder', legacyWorkOrderSchema);

module.exports = {
  WOHeader,
  WODetail,
  MaterialTracking,
  ExecutionProgress,
  WorkOrder
};
