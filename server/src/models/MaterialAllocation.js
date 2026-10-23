const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. ALLOCATION HEADER ---
const allocationHeaderSchema = new mongoose.Schema({
  Allocation_ID: { type: String, required: true, unique: true },
  WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader', required: true },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Allocation_Status: { type: String, enum: ['Pending', 'Partially Reserved', 'Fully Reserved', 'Partially Issued', 'Fully Issued', 'Consumed', 'Shortage'], default: 'Pending' },
  Required_By_Date: { type: Date },
  Priority: { type: String, enum: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' }
}, { timestamps: true });
allocationHeaderSchema.plugin(auditPlugin);

// --- B. COMPONENT REQUIREMENTS ---
const componentRequirementSchema = new mongoose.Schema({
  Allocation_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'AllocationHeader', required: true },
  Component_Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Operation_Sequence: { type: Number },
  Required_Quantity: { type: Number, required: true },
  Reserved_Quantity: { type: Number, default: 0 },
  Issued_Quantity: { type: Number, default: 0 },
  Consumed_Quantity: { type: Number, default: 0 },
  Scrapped_Quantity: { type: Number, default: 0 },
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  Issue_Method: { type: String, enum: ['Manual Pick', 'Backflush', 'Floor Stock'], default: 'Manual Pick' },
  Shortage_Flag: { type: Boolean, default: false }
}, { timestamps: true });
componentRequirementSchema.plugin(auditPlugin);

// --- C. INVENTORY TRANSACTIONS ---
const inventoryTransactionSchema = new mongoose.Schema({
  Requirement_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ComponentRequirement', required: true },
  Inventory_Location_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterWarehouse' },
  Batch_Lot_Number: { type: mongoose.Schema.Types.ObjectId, ref: 'LotMaster' },
  Transaction_Type: { type: String, enum: ['Reserve', 'Un-reserve', 'Issue', 'Return_to_Stock', 'Consume'], required: true },
  Transacted_Quantity: { type: Number, required: true },
  Transaction_Date: { type: Date, default: Date.now },
  Reference_Document: { type: String }
}, { timestamps: true });
inventoryTransactionSchema.plugin(auditPlugin);

const AllocationHeader = mongoose.model('AllocationHeader', allocationHeaderSchema);
const ComponentRequirement = mongoose.model('ComponentRequirement', componentRequirementSchema);
const AllocationLedger = mongoose.model('AllocationLedger', inventoryTransactionSchema);

module.exports = { AllocationHeader, ComponentRequirement, InventoryTransaction: AllocationLedger };
