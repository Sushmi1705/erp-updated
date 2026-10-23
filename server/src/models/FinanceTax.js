const mongoose = require('mongoose');

const financeTaxSchema = new mongoose.Schema({
  taxCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  ratePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  type: {
    type: String,
    enum: ['CGST', 'SGST', 'IGST', 'VAT', 'Custom'],
    default: 'CGST'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('FinanceTax', financeTaxSchema);
