const mongoose = require('mongoose');

const shopFloorDowntimeSchema = new mongoose.Schema({
  downtimeNumber: {
    type: String,
    required: true,
    unique: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  type: {
    type: String,
    enum: ['Planned', 'Unplanned'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  impactAnalysis: String,
  dateRecorded: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ShopFloorDowntime', shopFloorDowntimeSchema);
