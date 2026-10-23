const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- LEGACY SCHEMA (DO NOT REMOVE) ---
const legacyInventoryTransactionSchema = new mongoose.Schema({
  transactionNumber: { type: String, unique: true, sparse: true },
  transactionDate: { type: Date, default: Date.now },
  transactionType: { type: String, enum: ['Goods Receipt', 'Material Issue', 'Stock Transfer', 'Stock Adjustment', 'Stock Return'] },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  batchNumber: { type: String },
  sourceWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  destinationWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  quantity: { type: Number },
  referenceDocument: String,
  notes: String
}, { timestamps: true });
legacyInventoryTransactionSchema.plugin(auditPlugin);

// --- V2 ARCHITECTURE ---

// A. TRANSACTION HEADER
const invTxnHeaderSchema = new mongoose.Schema({
  Txn_Number: { type: String, required: true, unique: true },
  Txn_Date: { type: Date, default: Date.now },
  Txn_Type: { type: String, enum: ['Material Issue', 'Transfer', 'Return', 'Adjustment'], required: true },
  Ref_Doc_Number: { type: String },
  Ref_Doc_Type: { type: String, enum: ['Purchase Order', 'Sales Order', 'Work Order', 'None'], default: 'None' },
  Status: { type: String, enum: ['Draft', 'Pending Approval', 'Executed', 'Reversed'], default: 'Draft' },
  Total_Lines: { type: Number, default: 0 }
}, { timestamps: true });
invTxnHeaderSchema.plugin(auditPlugin);

// B. TRANSACTION LINES
const invTxnLineSchema = new mongoose.Schema({
  Txn_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'InvTxnHeader', required: true },
  Line_Sequence: { type: Number, required: true },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Quantity: { type: Number, required: true }, // Precision 4 logically enforced
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  Source_WH_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  Dest_WH_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  Reason_Code_ID: { type: mongoose.Schema.Types.ObjectId }, // Future expansion
  Unit_Cost: { type: Number }
}, { timestamps: true });
invTxnLineSchema.plugin(auditPlugin);

// C. SERIAL / BATCH TRACKING
const invTxnBatchSchema = new mongoose.Schema({
  Txn_Line_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'InvTxnLine', required: true },
  Batch_Lot_Number: { type: String, required: true },
  Serial_Number: { type: String },
  Quantity: { type: Number, required: true },
  Expiration_Date: { type: Date }
}, { timestamps: true });
invTxnBatchSchema.plugin(auditPlugin);

// D. INVENTORY LEDGER
const invLedgerSchema = new mongoose.Schema({
  Txn_Line_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'InvTxnLine', required: true },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Warehouse_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  Movement_Type: { type: String, enum: ['IN', 'OUT'], required: true },
  Qty_Change: { type: Number, required: true },
  Running_Balance: { type: Number },
  Posting_Date: { type: Date, default: Date.now }
}, { timestamps: true });
invLedgerSchema.plugin(auditPlugin);

// Models
const InvTxnHeader = mongoose.model('InvTxnHeader', invTxnHeaderSchema);
const InvTxnLine = mongoose.model('InvTxnLine', invTxnLineSchema);
const InvTxnBatch = mongoose.model('InvTxnBatch', invTxnBatchSchema);
const InvLedger = mongoose.model('InvLedger', invLedgerSchema);

// Legacy fallback (If someone accesses InventoryTransaction model directly)
const InventoryTransaction = mongoose.models['InventoryTransaction'] || mongoose.model('InventoryTransaction', legacyInventoryTransactionSchema);

module.exports = {
  InvTxnHeader,
  InvTxnLine,
  InvTxnBatch,
  InvLedger,
  InventoryTransaction
};
