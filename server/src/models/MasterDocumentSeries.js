const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const documentSeriesSchema = new mongoose.Schema({
  documentType: { type: String, required: true, unique: true, trim: true }, // e.g., 'PurchaseOrder', 'SalesOrder'
  prefix: { type: String, required: true, trim: true }, // e.g., 'PO-'
  suffix: { type: String, trim: true }, // e.g., '-2026'
  currentNumber: { type: Number, default: 0 },
  paddingLength: { type: Number, default: 6 }, // e.g., 6 for PO-000001
  description: { type: String, trim: true },
  resetFrequency: { type: String, default: 'Fiscal Year' }, // 'Fiscal Year', 'Calendar Year', 'Never'
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
documentSeriesSchema.plugin(auditPlugin);

const DocumentSeries = mongoose.model('DocumentSeries', documentSeriesSchema);

module.exports = { DocumentSeries };
