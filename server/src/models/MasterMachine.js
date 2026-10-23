const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const machineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  workCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkCenter' },
  hourlyCost: { type: Number, default: 0, min: 0 },
  capacity: { type: Number, default: 0 },
  uomId: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' }, // For capacity
  tonnage: { type: String, trim: true }, // e.g. 250T, 160T, 63T
  bedSize: { type: String, trim: true }, // e.g. 1200 x 800 mm
  strokeLength: { type: String, trim: true }, // e.g. 200 mm
  strokesPerMinute: { type: String, trim: true }, // e.g. 45 - 80 SPM
  powerRatingKW: { type: Number, default: 0 },
  criticality: { type: String, enum: ['A - Super Critical', 'B - Critical', 'C - Standard'], default: 'B - Critical' },
  operationalState: { type: String, enum: ['Operational', 'Idle', 'Maintenance', 'Breakdown'], default: 'Operational' },
  manufacturer: { type: String, trim: true },
  serialNumber: { type: String, trim: true },
  purchaseDate: { type: Date },
  preventiveCycleDays: { type: Number, default: 30 },
  lastMaintenanceDate: { type: Date },
  nextMaintenanceDate: { type: Date },
  description: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
machineSchema.plugin(auditPlugin);

const Machine = mongoose.model('Machine', machineSchema);

module.exports = { Machine };

