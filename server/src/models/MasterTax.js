const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const taxSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true }, // e.g., GST, VAT, CGST
  rate: { type: Number, required: true, min: 0 },
  type: { type: String, default: 'GST' }, // GST, IGST, Exempt, Nil
  cgstRate: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  description: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
taxSchema.plugin(auditPlugin);

const Tax = mongoose.model('Tax', taxSchema);

module.exports = { Tax };
