const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const workCenterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  machines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Machine' }],
  efficiencyRate: { type: Number, default: 0.85 }, // Decimal - e.g., 0.85 for 85%
  baseDailyHours: { type: Number, default: 8.0 }, // Decimal - standard shift hours
  shiftsPerDay: { type: Number, default: 2 },
  category: { type: String, default: 'Production Line' },
  laborRatePerHour: { type: Number, default: 220 },
  overheadRatePerHour: { type: Number, default: 350 },
  manningLevel: { type: Number, default: 3 },
  supervisor: { type: String },
  floorLocation: { type: String },
  criticality: { type: String, default: 'B - High Priority' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
workCenterSchema.plugin(auditPlugin);

const WorkCenter = mongoose.model('WorkCenter', workCenterSchema);

module.exports = { WorkCenter };
