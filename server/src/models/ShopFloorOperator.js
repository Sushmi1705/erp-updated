const mongoose = require('mongoose');

const shopFloorOperatorSchema = new mongoose.Schema({
  operatorName: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  workOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder'
  },
  shift: {
    type: String,
    enum: ['Morning', 'Evening', 'Night'],
    required: true
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  productivityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  performanceNotes: String
}, { timestamps: true });

module.exports = mongoose.model('ShopFloorOperator', shopFloorOperatorSchema);
