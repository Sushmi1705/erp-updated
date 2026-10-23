const mongoose = require('mongoose');

const maintenanceBreakdownSchema = new mongoose.Schema({
  breakdownNumber: {
    type: String,
    required: true,
    unique: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  reportedDate: {
    type: Date,
    default: Date.now
  },
  issueDescription: {
    type: String,
    required: true
  },
  repairStatus: {
    type: String,
    enum: ['Reported', 'In-Repair', 'Resolved'],
    default: 'Reported'
  },
  repairNotes: {
    type: String
  },
  resolutionDate: {
    type: Date
  },
  resolutionDetails: {
    type: String
  },
  downtimeDurationHours: {
    type: Number,
    default: 0
  },
  downtimeCostPerHour: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceBreakdown', maintenanceBreakdownSchema);
