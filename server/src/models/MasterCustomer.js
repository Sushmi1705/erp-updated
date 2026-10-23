const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const customerCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
customerCategorySchema.plugin(auditPlugin);

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerCategory', required: true },
  gst: { type: String, unique: true, sparse: true },
  pan: { type: String },
  email: { type: String },
  phone: { type: String },
  currencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  paymentTermsId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTerms' },
  creditLimit: { type: Number, default: 0, min: 0 },
  billingAddress: { type: String },
  shippingAddress: { type: String },
  salesPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
customerSchema.plugin(auditPlugin);

const CustomerCategory = mongoose.model('CustomerCategory', customerCategorySchema);
const Customer = mongoose.model('Customer', customerSchema);

module.exports = { CustomerCategory, Customer };
