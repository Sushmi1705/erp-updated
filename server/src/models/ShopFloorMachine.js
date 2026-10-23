const mongoose = require('mongoose');

const shopFloorMachineSchema = new mongoose.Schema({
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  workOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder'
  },
  allocatedDate: {
    type: Date,
    default: Date.now
  },
  utilizationPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  idleTimeMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Running', 'Idle', 'Maintenance'],
    default: 'Idle'
  }
}, { timestamps: true });

module.exports = mongoose.model('ShopFloorMachine', shopFloorMachineSchema);
