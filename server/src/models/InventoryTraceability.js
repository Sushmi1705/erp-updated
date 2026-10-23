const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- LEGACY SCHEMA (DO NOT REMOVE) ---
const legacyTraceabilitySchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true },
  trackingType: { type: String, enum: ['Batch', 'Lot', 'Serial Number'], required: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  referenceNumber: { type: String, required: true },
  manufacturingDate: { type: Date, required: true },
  expiryDate: { type: Date },
  originTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryTransaction' }
}, { timestamps: true });

// --- V2 ARCHITECTURE ---

// A. TRACKING ENTITY (Core Registry)
const trackingEntitySchema = new mongoose.Schema({
  Tracking_Number: { type: String, required: true },
  Tracking_Type: { type: String, enum: ['Serial Number', 'Batch', 'Lot'], required: true },
  Reference_Code: { type: String },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Origin_Txn_ID: { type: mongoose.Schema.Types.ObjectId }, // Flexible to point to legacy or V2
  Current_WH_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  Mfg_Date: { type: Date, required: true },
  Expiry_Date: { type: Date },
  Current_Status: { type: String, enum: ['Active', 'Consumed', 'Scrapped', 'Expired', 'Quarantined', 'Pending', 'Draft'], default: 'Active' },
  Current_Quantity: { type: Number, required: true, default: 0 }
}, { timestamps: true });
trackingEntitySchema.plugin(auditPlugin);

// Enforce compound uniqueness for Batch/Lot via application logic, and global uniqueness for Serial Number.
// We will do this in the controller as requested to handle conditional unique constraints dynamically.

// B. ENTITY GENEALOGY (Lifecycle History Log)
const entityGenealogySchema = new mongoose.Schema({
  Entity_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'TrackingEntity', required: true },
  Txn_ID: { type: mongoose.Schema.Types.ObjectId },
  Action_Type: { type: String, enum: ['Creation', 'Transfer', 'Consumption', 'Adjustment', 'Quality Hold'], required: true },
  Source_WH_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  Dest_WH_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  Transaction_Date: { type: Date, default: Date.now }
}, { timestamps: true });
entityGenealogySchema.plugin(auditPlugin);

// Models
const TrackingEntity = mongoose.model('TrackingEntity', trackingEntitySchema);
const EntityGenealogy = mongoose.model('EntityGenealogy', entityGenealogySchema);

// Legacy fallback
const InventoryTraceability = mongoose.models['InventoryTraceability'] || mongoose.model('InventoryTraceability', legacyTraceabilitySchema);

module.exports = {
  TrackingEntity,
  EntityGenealogy,
  InventoryTraceability
};
