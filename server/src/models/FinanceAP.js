const mongoose = require('mongoose');

const financeAPSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'POHeader'
  },
  billDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  amount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  outstandingAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Unpaid', 'Partial', 'Paid'],
    default: 'Unpaid'
  },
  payments: [{
    paymentDate: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    paymentMode: { type: String, enum: ['Bank Transfer', 'Cash', 'Cheque', 'Credit Card'], required: true },
    referenceNumber: { type: String }
  }]
}, { timestamps: true });

// Pre-save to auto-calculate outstanding
financeAPSchema.pre('save', function() {
  this.totalAmount = this.amount + this.taxAmount;
  let paid = 0;
  if (this.payments && this.payments.length > 0) {
    paid = this.payments.reduce((acc, curr) => acc + curr.amount, 0);
  }
  this.amountPaid = paid;
  this.outstandingAmount = this.totalAmount - this.amountPaid;
  
  if (this.outstandingAmount <= 0) {
    this.status = 'Paid';
  } else if (this.amountPaid > 0) {
    this.status = 'Partial';
  } else {
    this.status = 'Unpaid';
  }
});

module.exports = mongoose.model('FinanceAP', financeAPSchema);
