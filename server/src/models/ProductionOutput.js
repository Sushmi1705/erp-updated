const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- LEGACY SCHEMA (DO NOT REMOVE) ---
const productionOutputSchema = new mongoose.Schema({
  outputNumber: { type: String, required: true, unique: true },
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  recordedDate: { type: Date, default: Date.now },
  goodQuantity: { type: Number, required: true, min: 0 },
  rejectedQuantity: { type: Number, required: true, min: 0 },
  scrapQuantity: { type: Number, required: true, min: 0 },
  recordedBy: { type: String, required: true }
}, { timestamps: true });
const ProductionOutput = mongoose.model('ProductionOutput', productionOutputSchema);

// --- V2 ARCHITECTURE ---

// --- A. OUTPUT HEADER (Parent Level) ---
const outputHeaderSchema = new mongoose.Schema({
  Output_ID: { type: String, required: true, unique: true },
  Output_No: { type: String, required: true },
  WO_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'WOHeader', required: true },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  Recorded_By_User_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Recording_Date: { type: Date, default: Date.now },
  Status: { type: String, enum: ['Draft', 'Posted', 'Canceled'], default: 'Draft' }
}, { timestamps: true });
outputHeaderSchema.plugin(auditPlugin);

// --- B. YIELD DETAILS (Quantities & Material Link) ---
const yieldDetailSchema = new mongoose.Schema({
  Output_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'OutputHeader', required: true },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Target_Quantity: { type: Number, required: true },
  Good_Quantity: { type: Number, default: 0 },
  Rejected_Quantity: { type: Number, default: 0 },
  Scrap_Quantity: { type: Number, default: 0 },
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' }
}, { timestamps: true });
yieldDetailSchema.plugin(auditPlugin);

// --- C. INVENTORY PUTAWAY (Stock Receipt) ---
const inventoryPutawaySchema = new mongoose.Schema({
  Yield_Detail_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'YieldDetail', required: true },
  Target_Warehouse_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' }, // Warehouse Master
  Target_Bin_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' }, // Bin Master
  Received_Quantity: { type: Number, required: true },
  Batch_Lot_Number: { type: String },
  Expiry_Date: { type: Date }
}, { timestamps: true });
inventoryPutawaySchema.plugin(auditPlugin);

// --- D. QUALITY REASON CODES (Reject/Scrap Ledger) ---
const qualityReasonCodeSchema = new mongoose.Schema({
  Yield_Detail_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'YieldDetail', required: true },
  Defect_Code_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DefectCode' }, // Defect Code Master
  Defect_Type: { type: String, enum: ['Rejected', 'Scrapped'], required: true },
  Affected_Quantity: { type: Number, required: true },
  Notes: { type: String }
}, { timestamps: true });
qualityReasonCodeSchema.plugin(auditPlugin);

const OutputHeader = mongoose.model('OutputHeader', outputHeaderSchema);
const YieldDetail = mongoose.model('YieldDetail', yieldDetailSchema);
const InventoryPutaway = mongoose.model('InventoryPutaway', inventoryPutawaySchema);
const QualityReasonCode = mongoose.model('QualityReasonCode', qualityReasonCodeSchema);

module.exports = { 
  ProductionOutput, 
  OutputHeader, 
  YieldDetail, 
  InventoryPutaway, 
  QualityReasonCode 
};
