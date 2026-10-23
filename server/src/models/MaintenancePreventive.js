const mongoose = require('mongoose');

const maintenancePreventiveSchema = new mongoose.Schema({
  scheduleNumber: {
    type: String,
    required: true,
    unique: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  maintenanceTask: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  executionDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In-Progress', 'Completed', 'Overdue'],
    default: 'Scheduled'
  },
  assignedTechnician: {
    type: String
  },
  executionNotes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('MaintenancePreventive', maintenancePreventiveSchema);
