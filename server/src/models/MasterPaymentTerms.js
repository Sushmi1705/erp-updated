const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const paymentTermsSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true }, // e.g., NET30, Advance
  days: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true },
  discountPercent: { type: Number, default: 0 }, // Cash discount e.g. 2% for early payment
  discountDays: { type: Number, default: 0 }, // Early payment window in days
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
paymentTermsSchema.plugin(auditPlugin);

const PaymentTerms = mongoose.model('PaymentTerms', paymentTermsSchema);

module.exports = { PaymentTerms };
