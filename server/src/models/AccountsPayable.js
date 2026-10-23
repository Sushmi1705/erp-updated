const mongoose = require('mongoose');
const { internalId } = require('../utils/internalId');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. VENDOR BILLS (Header Level) ---
const vendorBillSchema = new mongoose.Schema({
  Bill_ID: { type: String, default: () => internalId('BILL') },
  Bill_Number: { type: String, default: () => internalId('BILL') },
  // The number printed on the supplier's own invoice — theirs, not ours.
  // Without it the same physical bill can be keyed twice with nothing able to
  // notice, and the purchase register cannot be reconciled against GSTR-2B for
  // input tax credit, because that match is made on the supplier's number.
  Vendor_Invoice_Number: { type: String, trim: true, default: '' },
  Vendor_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  Bill_Date: { type: Date, required: true, default: Date.now },
  Due_Date: { type: Date, required: true },
  Total_Amount: { type: Number, required: true, min: 0 },
  Currency_ID: { type: String, default: 'INR' },
  Terms_ID: { type: String, default: 'Net 30' },
  Status: { type: String, enum: ['Draft', 'Pending Approval', 'Open', 'Partially Paid', 'Paid', 'Cancelled', 'Overdue'], default: 'Open' },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true });
// A supplier does not issue the same invoice number twice, so neither should
// we accept it. Partial rather than plain-unique: bills already on file carry
// no vendor number, and every one of those empty strings would collide.
vendorBillSchema.index(
  { Vendor_ID: 1, Vendor_Invoice_Number: 1 },
  { unique: true, partialFilterExpression: { Vendor_Invoice_Number: { $type: 'string', $gt: '' } } }
);
vendorBillSchema.plugin(auditPlugin);

// --- B. BILL LINE ITEMS (Detail Level) ---
const billLineItemSchema = new mongoose.Schema({
  Line_Item_ID: { type: String, default: () => internalId('BLNE') },
  Bill_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorBill', required: true },
  PO_Reference_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'POHeader' },
  Line_Sequence: { type: Number, required: true, min: 1 },
  Item_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  Description: { type: String, required: true },
  Quantity: { type: Number, required: true, min: 0.0001 },
  Unit_Price: { type: Number, required: true, min: 0 },
  Line_Total: { type: Number, required: true, min: 0 },
  Tax_Code_ID: { type: String, default: 'STANDARD_TAX' }
}, { timestamps: true });
billLineItemSchema.plugin(auditPlugin);

// --- C. VENDOR PAYMENTS (Outgoing Funds) ---
const vendorPaymentSchema = new mongoose.Schema({
  Payment_ID: { type: String, default: () => internalId('PAY') },
  Payment_Number: { type: String, default: () => internalId('PAY') },
  Vendor_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  Payment_Date: { type: Date, required: true, default: Date.now },
  Total_Paid: { type: Number, required: true, min: 0 },
  Payment_Method: { type: String, enum: ['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Cash', 'Demand Draft', 'Credit Card', 'Wire', 'ACH', 'Bank Transfer'], default: 'NEFT' },
  Bank_Account_ID: { type: String, default: 'BANK-MAIN-01' }, // TODO: This should reference a BankAccount master in future
  Reference_Number: { type: String, default: '' },
  Unapplied_Amount: { type: Number, required: true, min: 0 },
  Status: { type: String, enum: ['Draft', 'Pending Clearing', 'Cleared', 'Failed'], default: 'Cleared' }
}, { timestamps: true });
vendorPaymentSchema.plugin(auditPlugin);

// --- D. PAYMENT APPLICATIONS (Connecting Payments to Bills) ---
const billPaymentApplicationSchema = new mongoose.Schema({
  Application_ID: { type: String, default: () => internalId('BAPP') },
  Payment_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorPayment', required: true },
  Bill_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorBill', required: true },
  Applied_Amount: { type: Number, required: true, min: 0.01 },
  Application_Date: { type: Date, required: true, default: Date.now }
}, { timestamps: true });
billPaymentApplicationSchema.plugin(auditPlugin);

const VendorBill = mongoose.model('VendorBill', vendorBillSchema);
const BillLineItem = mongoose.model('BillLineItem', billLineItemSchema);
const VendorPayment = mongoose.model('VendorPayment', vendorPaymentSchema);
const BillPaymentApplication = mongoose.model('BillPaymentApplication', billPaymentApplicationSchema);

module.exports = {
  VendorBill,
  BillLineItem,
  VendorPayment,
  BillPaymentApplication
};
