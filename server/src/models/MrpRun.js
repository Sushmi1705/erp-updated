const mongoose = require('mongoose');

const mrpRunSchema = new mongoose.Schema({
  runNumber: {
    type: String,
    required: true,
    unique: true
  },
  runDate: {
    type: Date,
    default: Date.now
  },
  period: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Completed', 'Failed'],
    default: 'Draft'
  },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('MrpRun', mrpRunSchema);
