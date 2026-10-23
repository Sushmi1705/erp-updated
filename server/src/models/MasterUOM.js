const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const uomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  symbol: { type: String, required: true, unique: true, trim: true },
  code: { type: String, trim: true },
  type: { type: String }, // Weight, Volume, Length, Quantity, Area, Time, Packaging
  category: { type: String }, // Dimension group alias
  decimalPrecision: { type: Number, default: 2 },
  isBaseUnit: { type: Boolean, default: false },
  systemStandard: { type: String, default: 'Metric (SI)' }, // Metric (SI), Imperial, Customary, ISO
  description: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
uomSchema.plugin(auditPlugin);

const uomConversionSchema = new mongoose.Schema({
  fromUOM: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM', required: true },
  toUOM: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM', required: true },
  factor: { type: Number, required: true }, // e.g., 1 fromUOM = factor * toUOM
  formula: { type: String, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
uomConversionSchema.plugin(auditPlugin);

const UOM = mongoose.model('UOM', uomSchema);
const UOMConversion = mongoose.model('UOMConversion', uomConversionSchema);

module.exports = { UOM, UOMConversion };

