const mongoose = require('mongoose');

const shopFloorScrapSchema = new mongoose.Schema({
  scrapNumber: {
    type: String,
    required: true,
    unique: true
  },
  workOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  scrapQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitCost: {
    type: Number,
    required: true
  },
  totalScrapCost: {
    type: Number,
    required: true
  },
  rootCauseAnalysis: String,
  dateRecorded: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ShopFloorScrap', shopFloorScrapSchema);
