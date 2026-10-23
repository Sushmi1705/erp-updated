const mongoose = require('mongoose');
const { internalId } = require('../utils/internalId');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. DELIVERY TRACKING (Header Level) ---
const deliveryTrackingHeaderSchema = new mongoose.Schema({
  Tracking_ID: { type: String, default: () => internalId('DT') },
  Tracking_Number: { type: String, default: () => internalId('DT') },
  Exec_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchExecution', required: true },
  Plan_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPlan' },
  Sales_Order_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  Overall_Delivery_Status: { type: String, enum: ['In-Transit', 'Delayed', 'Exception', 'Delivered', 'Returned'], default: 'In-Transit' },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true, strict: false });
deliveryTrackingHeaderSchema.plugin(auditPlugin);

// --- B. SHIPMENT TRACKING (Logistics Milestones) ---
const shipmentTrackingMilestoneSchema = new mongoose.Schema({
  Event_ID: { type: String, default: () => internalId('EVT') },
  Tracking_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryTracking', required: true },
  Tracking_Status: { type: String, enum: ['Departed', 'Arrived at Hub', 'Out for Delivery', 'Delayed'], default: 'Departed' },
  Current_Location: { type: String, required: true }, // GPS Coordinates or Checkpoint Name
  Event_Timestamp: { type: Date, default: Date.now },
  Remarks_Exceptions: { type: String }
}, { timestamps: true, strict: false });
shipmentTrackingMilestoneSchema.plugin(auditPlugin);

// --- C. DELIVERY CONFIRMATION (Final Handover) ---
const deliveryConfirmationHandoverSchema = new mongoose.Schema({
  Confirmation_ID: { type: String, default: () => internalId('POD') },
  Tracking_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryTracking', required: true },
  Final_Status: { type: String, enum: ['Pending', 'Partially Delivered', 'Successfully Delivered', 'Rejected'], default: 'Pending' },
  Delivered_Date: { type: Date },
  Received_By: { type: String }, // Name of the person who accepted the goods
  Proof_Of_Delivery_Ref: { type: String }, // Link or POD ref
  Customer_Feedback_Notes: { type: String }
}, { timestamps: true, strict: false });
deliveryConfirmationHandoverSchema.plugin(auditPlugin);

const DeliveryTracking = mongoose.model('DeliveryTracking', deliveryTrackingHeaderSchema);
const ShipmentTracking = mongoose.model('ShipmentTracking', shipmentTrackingMilestoneSchema);
const DeliveryConfirmationHandover = mongoose.model('DeliveryConfirmationHandover', deliveryConfirmationHandoverSchema);

module.exports = {
  DeliveryTracking,
  ShipmentTracking,
  DeliveryConfirmationHandover
};
