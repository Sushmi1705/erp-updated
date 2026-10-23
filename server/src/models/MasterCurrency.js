const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const currencySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true }, // e.g., USD, INR
  symbol: { type: String, required: true }, // e.g., $, ₹
  exchangeRate: { type: Number, default: 1.0 }, // Conversion factor to base currency (INR = 1.0)
  isBaseCurrency: { type: Boolean, default: false },
  decimalPlaces: { type: Number, default: 2 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
currencySchema.plugin(auditPlugin);

const Currency = mongoose.model('Currency', currencySchema);

module.exports = { Currency };
