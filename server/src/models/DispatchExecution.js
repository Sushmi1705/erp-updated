const mongoose = require('mongoose');
const { internalId } = require('../utils/internalId');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. DISPATCH EXECUTION (Header Level) ---
const dispatchExecutionHeaderSchema = new mongoose.Schema({
  Exec_ID: { type: String, default: () => internalId('DE') },
  Exec_Number: { type: String, default: () => internalId('DE') },
  Plan_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPlan' },
  dispatchPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPlan' },
  Sales_Order_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  Overall_Status: { type: String, enum: ['Pending', 'Packing', 'Loading', 'Dispatched', 'Cancelled'], default: 'Pending' },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true, strict: false });
dispatchExecutionHeaderSchema.plugin(auditPlugin);

// --- B. PACKING MANAGEMENT (Phase 1) ---
const packingManagementSchema = new mongoose.Schema({
  Packing_ID: { type: String, default: () => internalId('PKG') },
  Exec_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchExecution', required: true },
  Packing_Status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  Total_Boxes: { type: Number, default: 0, min: 0 },
  Packing_Start_Time: { type: Date },
  Packing_End_Time: { type: Date }
}, { timestamps: true, strict: false });
packingManagementSchema.plugin(auditPlugin);

// --- C. LOADING MANAGEMENT (Phase 2) ---
const loadingManagementSchema = new mongoose.Schema({
  Loading_ID: { type: String, default: () => internalId('LDG') },
  Exec_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchExecution', required: true },
  Loading_Status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  Loading_Bay: { type: String, required: true, default: 'Bay-01' },
  Loader_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, strict: false });
loadingManagementSchema.plugin(auditPlugin);

// --- D. DISPATCH CONFIRMATION (Phase 3) ---
const dispatchConfirmationSchema = new mongoose.Schema({
  Confirmation_ID: { type: String, default: () => internalId('CNF') },
  Exec_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchExecution', required: true },
  Dispatch_Status: { type: String, enum: ['Pending', 'Confirmed', 'Failed'], default: 'Pending' },
  Dispatched_Date: { type: Date },
  Proof_Of_Dispatch_Ref: { type: String }
}, { timestamps: true, strict: false });
dispatchConfirmationSchema.plugin(auditPlugin);

const DispatchExecution = mongoose.model('DispatchExecution', dispatchExecutionHeaderSchema);
const PackingManagement = mongoose.model('PackingManagement', packingManagementSchema);
const LoadingManagement = mongoose.model('LoadingManagement', loadingManagementSchema);
const DispatchConfirmation = mongoose.model('DispatchConfirmation', dispatchConfirmationSchema);

module.exports = {
  DispatchExecution,
  PackingManagement,
  LoadingManagement,
  DispatchConfirmation
};
