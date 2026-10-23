const mongoose = require('mongoose');

const capacityMachineSchema = new mongoose.Schema({
  workCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkCenter',
    required: true
  },
  period: {
    type: String, // e.g., 'Week 42 - 2026'
    required: true
  },
  availableHours: {
    type: Number,
    required: true,
    min: 0
  },
  utilizedHours: {
    type: Number,
    default: 0,
    min: 0
  },
  utilizationPercentage: {
    type: Number,
    default: 0
  },
  isBottleneck: {
    type: Boolean,
    default: false
  },
  bottleneckDetails: String
}, { timestamps: true });

// Pre-save hook to calculate utilization and flag bottleneck
capacityMachineSchema.pre('save', function() {
  if (this.availableHours > 0) {
    this.utilizationPercentage = (this.utilizedHours / this.availableHours) * 100;
  } else {
    this.utilizationPercentage = this.utilizedHours > 0 ? 100 : 0;
  }
  
  this.isBottleneck = this.utilizationPercentage > 95;
});

module.exports = mongoose.model('CapacityMachine', capacityMachineSchema);
