const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. DELIVERY PLAN (Header Level) ---
const deliveryPlanSchema = new mongoose.Schema({
  Plan_ID: { type: String, required: true, unique: true },
  Plan_Number: { type: String, required: true, unique: true },
  Sales_Order_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  Planned_Date: { type: Date, required: true },
  Status: { type: String, enum: ['Draft', 'Planned', 'Scheduled', 'Assigned', 'In-Transit', 'Delivered', 'Cancelled'], default: 'Planned' },
  Total_Weight: { type: Number, default: 0 },
  Total_Volume: { type: Number, default: 0 },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true });
deliveryPlanSchema.plugin(auditPlugin);

// --- B. SHIPMENT SCHEDULE (Logistics Level) ---
const shipmentScheduleSchema = new mongoose.Schema({
  Schedule_ID: { type: String, required: true, unique: true },
  Plan_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPlan', required: true },
  Scheduled_Date: { type: Date, required: true },
  Carrier_ID: { type: String, required: true }, // e.g., 'das' or carrier name
  Estimated_Arrival_Date: { type: Date },
  Shipping_Method: { type: String, enum: ['Road', 'Rail', 'Air', 'Sea'], default: 'Road' }
}, { timestamps: true });
shipmentScheduleSchema.plugin(auditPlugin);

// --- C. VEHICLE ASSIGNMENT (Resource Level) ---
const vehicleAssignmentSchema = new mongoose.Schema({
  Assignment_ID: { type: String, required: true, unique: true },
  Schedule_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ShipmentSchedule', required: true },
  Plan_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPlan', required: true },
  Vehicle_ID: { type: String, required: true }, // Vehicle reg number e.g., tn69hy6574
  Driver_ID: { type: String, required: true }, // Driver name/code e.g., saS
  Assignment_Date: { type: Date, default: Date.now },
  Dispatch_Status: { type: String, enum: ['Pending', 'Dispatched', 'Arrived'], default: 'Pending' }
}, { timestamps: true });
vehicleAssignmentSchema.plugin(auditPlugin);

const DeliveryPlan = mongoose.model('DeliveryPlan', deliveryPlanSchema);
const ShipmentSchedule = mongoose.model('ShipmentSchedule', shipmentScheduleSchema);
const VehicleAssignment = mongoose.model('VehicleAssignment', vehicleAssignmentSchema);

module.exports = {
  DeliveryPlan,
  ShipmentSchedule,
  VehicleAssignment
};
