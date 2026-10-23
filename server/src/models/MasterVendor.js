const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const vendorCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
vendorCategorySchema.plugin(auditPlugin);

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorCategory', required: true },
  gst: { type: String, unique: true, sparse: true },
  pan: { type: String },
  rating: { type: String, enum: ['A', 'B', 'C', 'D'], default: 'C' },
  leadTimeDays: { type: Number, default: 0 },
  currencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  paymentTermsId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTerms' },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
vendorSchema.plugin(auditPlugin);

const VendorCategory = mongoose.model('VendorCategory', vendorCategorySchema);
const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = { VendorCategory, Vendor };
