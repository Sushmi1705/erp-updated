const mongoose = require('mongoose');

const capacityLaborSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true
  },
  period: {
    type: String, // e.g., 'Oct-2026' or 'Week 42 - 2026'
    required: true
  },
  totalOperators: {
    type: Number,
    required: true,
    min: 0
  },
  shiftType: {
    type: String,
    enum: ['Morning', 'Evening', 'Night', 'General'],
    required: true
  },
  availableShiftHours: {
    type: Number,
    required: true,
    min: 0
  },
  plannedWorkforceHours: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('CapacityLabor', capacityLaborSchema);
