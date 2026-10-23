const mongoose = require('mongoose');

const inventoryStockSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: true,
    unique: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  quantityAvailable: {
    type: Number,
    required: true,
    min: 0
  },
  postingDate: {
    type: Date,
    default: Date.now
  },
  sourceGrnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoodsReceipt'
  },
  status: {
    type: String,
    enum: ['Active', 'Consumed', 'Quarantine', 'Hold', 'Returned', 'Quarantined'],
    default: 'Active'
  },
  unitCost: { type: Number, default: 0 },
  uomId: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  expiryDate: { type: Date },
  binId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  allocatedQuantity: { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 },
  supplierBatchNo: { type: String },
  notes: { type: String }
}, { timestamps: true });

inventoryStockSchema.index({ materialId: 1, warehouseId: 1, status: 1 });
inventoryStockSchema.index({ batchNumber: 1 });
inventoryStockSchema.index({ expiryDate: 1 }, { sparse: true });

module.exports = mongoose.model('InventoryStock', inventoryStockSchema);
