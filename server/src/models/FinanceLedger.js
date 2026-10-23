const mongoose = require('mongoose');

const financeLedgerSchema = new mongoose.Schema({
  entryNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Debit', 'Credit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  referenceType: {
    type: String,
    enum: ['Invoice', 'Bill', 'Manual', 'Payment'],
    default: 'Manual'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // Could point to AR or AP
    default: null
  },
  status: {
    type: String,
    enum: ['Draft', 'Posted'],
    default: 'Draft'
  }
}, { timestamps: true });

module.exports = mongoose.model('FinanceLedger', financeLedgerSchema);
