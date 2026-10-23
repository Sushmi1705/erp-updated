const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');
const goodsReceiptSchema = new mongoose.Schema({
  grnNumber: {
    type: String,
    required: true,
    unique: true
  },
  receiptDate: {
    type: Date,
    default: Date.now
  },
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'POHeader',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  poQuantity: {
    type: Number,
    required: true
  },
  receivedQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['Received', 'Inspecting', 'Posted', 'Cancelled'],
    default: 'Received'
  },
  challanNumber: String,
  vehicleNumber: String,
  transporterName: String,
  gatePassNo: String,
  storageLocation: String,
  packagingCondition: {
    type: String,
    enum: ['Good / Intact', 'Damaged Packaging', 'Seal Broken', 'Moisture Suspected'],
    default: 'Good / Intact'
  },
  notes: String,
  lineItems: [{
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    poLineItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'POLineItem' },
    quantity: Number,
    acceptedQuantity: Number,
    returnedQty: { type: Number, default: 0 }
  }]
}, { timestamps: true });

goodsReceiptSchema.plugin(auditPlugin);

module.exports = mongoose.model('GoodsReceipt', goodsReceiptSchema);
