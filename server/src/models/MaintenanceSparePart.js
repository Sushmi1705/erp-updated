const mongoose = require('mongoose');

const maintenanceSparePartSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['Receipt', 'Consumption'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitCost: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  referenceType: {
    type: String,
    enum: ['Preventive', 'Breakdown', 'Initial Stock']
  },
  referenceId: {
    type: String
  },
  dateRecorded: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceSparePart', maintenanceSparePartSchema);
