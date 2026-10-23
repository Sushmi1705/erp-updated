const mongoose = require('mongoose');

const dispatchPlanSchema = new mongoose.Schema({
  planNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  salesOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true
  },
  plannedDate: {
    type: Date,
    required: true
  },
  shipmentSchedule: {
    scheduledDate: { type: Date },
    carrierName: { type: String, trim: true },
    isScheduled: { type: Boolean, default: false }
  },
  vehicleAssignment: {
    vehicleNumber: { type: String, trim: true },
    driverName: { type: String, trim: true },
    driverContact: { type: String, trim: true },
    isAssigned: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Assigned'],
    default: 'Draft'
  }
}, { timestamps: true });

module.exports = mongoose.model('DispatchPlan', dispatchPlanSchema);
