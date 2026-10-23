const mongoose = require('mongoose');

const docSequenceSchema = new mongoose.Schema({
  docType: { type: String, required: true, unique: true }, // e.g. 'INV', 'BILL', 'JE', 'GRN', 'PO'
  prefix: { type: String, required: true },                // e.g. 'INV'
  currentNumber: { type: Number, default: 0 },
  fiscalYear: { type: String, default: () => {
    const now = new Date();
    // Indian fiscal year: Apr-Mar
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-${String(year + 1).slice(-2)}`;
  }},
  padding: { type: Number, default: 5 }  // zero-pad to this many digits
}, { timestamps: true });

module.exports = mongoose.model('DocSequence', docSequenceSchema);
