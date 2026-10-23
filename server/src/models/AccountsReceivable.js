const mongoose = require('mongoose');
const { internalId } = require('../utils/internalId');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. CUSTOMER INVOICES (Header Level) ---
const customerInvoiceSchema = new mongoose.Schema({
  Invoice_ID: { type: String, default: () => internalId('INV') },
  Invoice_Number: { type: String, default: () => internalId('INV') },
  Customer_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  Issue_Date: { type: Date, required: true, default: Date.now },
  Due_Date: { type: Date, required: true },
  Total_Amount: { type: Number, required: true, min: 0 },
  Currency_ID: { type: String, default: 'INR' },
  Terms_ID: { type: String, default: 'Net 30' },
  Status: { type: String, enum: ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled/Void'], default: 'Sent' },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true });
customerInvoiceSchema.plugin(auditPlugin);

customerInvoiceSchema.index({ Customer_ID: 1, Status: 1 });
customerInvoiceSchema.index({ Due_Date: 1, Status: 1 });

// --- B. INVOICE LINE ITEMS (Detail Level) ---
const invoiceLineItemSchema = new mongoose.Schema({
  Line_Item_ID: { type: String, default: () => internalId('LNE') },
  Invoice_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerInvoice', required: true },
  Line_Sequence: { type: Number, required: true, min: 1 },
  Item_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  Description: { type: String, required: true },
  Quantity: { type: Number, required: true, min: 0.0001 },
  Unit_Price: { type: Number, required: true, min: 0 },
  Line_Total: { type: Number, required: true, min: 0 },
  Tax_Code_ID: { type: String, default: 'STANDARD_TAX' }
}, { timestamps: true, strict: false });
invoiceLineItemSchema.plugin(auditPlugin);

// --- C. PAYMENT RECEIPTS (Payment Tracking) ---
const paymentReceiptSchema = new mongoose.Schema({
  Receipt_ID: { type: String, default: () => internalId('REC') },
  Receipt_Number: { type: String, default: () => internalId('REC') },
  Customer_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  Payment_Date: { type: Date, required: true, default: Date.now },
  Total_Received: { type: Number, required: true, min: 0 },
  Payment_Method: { type: String, enum: ['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Cash', 'Demand Draft', 'Credit Card', 'Wire', 'Check', 'ACH', 'Bank Transfer'], default: 'NEFT' },
  Reference_Number: { type: String, default: '' },
  Unapplied_Amount: { type: Number, required: true, min: 0 },
  Status: { type: String, enum: ['Pending', 'Cleared', 'Bounced', 'Applied'], default: 'Cleared' }
}, { timestamps: true, strict: false });
paymentReceiptSchema.plugin(auditPlugin);

// --- D. PAYMENT APPLICATIONS (Mapping Payment to Invoice) ---
const paymentApplicationSchema = new mongoose.Schema({
  Application_ID: { type: String, default: () => internalId('APP') },
  Receipt_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentReceipt', required: true },
  Invoice_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerInvoice', required: true },
  Applied_Amount: { type: Number, required: true, min: 0.01 },
  Application_Date: { type: Date, required: true, default: Date.now }
}, { timestamps: true, strict: false });
paymentApplicationSchema.plugin(auditPlugin);

const CustomerInvoice = mongoose.model('CustomerInvoice', customerInvoiceSchema);
const InvoiceLineItem = mongoose.model('InvoiceLineItem', invoiceLineItemSchema);
const PaymentReceipt = mongoose.model('PaymentReceipt', paymentReceiptSchema);
const PaymentApplication = mongoose.model('PaymentApplication', paymentApplicationSchema);

module.exports = {
  CustomerInvoice,
  InvoiceLineItem,
  PaymentReceipt,
  PaymentApplication
};
