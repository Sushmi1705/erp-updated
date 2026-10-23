const mongoose = require('mongoose');
const { internalId } = require('../utils/internalId');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. CHART OF ACCOUNTS (COA Master) ---
const chartOfAccountsSchema = new mongoose.Schema({
  Account_ID: { type: String, required: true, unique: true },
  Account_Number: { type: String, required: true },
  Account_Name: { type: String, required: true },
  Account_Type: { type: String, enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'], required: true },
  Is_Control_Account: { type: Boolean, default: false },
  Status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true });
chartOfAccountsSchema.plugin(auditPlugin);

// --- B. JOURNAL ENTRY (Header Level) ---
const journalEntryHeaderSchema = new mongoose.Schema({
  Entry_ID: { type: String, default: () => internalId('JE') },
  Entry_Number: { type: String, default: () => internalId('JE') },
  Entry_Date: { type: Date, required: true, default: Date.now },
  Source_Module: { type: String, enum: ['Manual', 'AR', 'AP', 'Inventory', 'System'], default: 'Manual' },
  Description: { type: String, required: true },
  Financial_Period_ID: { type: String, default: () => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const quarter = Math.floor(((now.getMonth() - 3 + 12) % 12) / 3) + 1;
    return `FY${year}-Q${quarter}`;
  }},
  Status: { type: String, enum: ['Draft', 'Pending Approval', 'Posted', 'Voided', 'Reversed'], default: 'Draft' },
  Reversed_From_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' }
}, { timestamps: true });
journalEntryHeaderSchema.plugin(auditPlugin);

// --- C. JOURNAL ENTRY LINES (Detail Level) ---
const journalEntryLineSchema = new mongoose.Schema({
  Line_ID: { type: String, default: () => internalId('JLN') },
  Entry_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry', required: true },
  Line_Sequence: { type: Number, required: true, min: 1 },
  Account_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccounts', required: true },
  Type: { type: String, enum: ['Debit', 'Credit'], required: true },
  Amount: { type: Number, required: true, min: 0.01 },
  Base_Currency_Amount: { type: Number },
  Reference_Type: { type: String, enum: ['Invoice', 'Bill', 'Payment', 'Adjustment', 'General'], default: 'General' },
  Reference_ID: { type: String, default: '' }
}, { timestamps: true });
journalEntryLineSchema.plugin(auditPlugin);

// --- D. FINANCIAL TRANSACTIONS (Ledger Summary / Materialized View) ---
const financialTransactionSchema = new mongoose.Schema({
  Transaction_ID: { type: String, default: () => internalId('TRX') },
  Account_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccounts', required: true },
  Financial_Period_ID: { type: String, default: () => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const quarter = Math.floor(((now.getMonth() - 3 + 12) % 12) / 3) + 1;
    return `FY${year}-Q${quarter}`;
  }},
  Total_Debits: { type: Number, default: 0 },
  Total_Credits: { type: Number, default: 0 },
  Net_Change: { type: Number, default: 0 },
  Ending_Balance: { type: Number, default: 0 }
}, { timestamps: true });
financialTransactionSchema.plugin(auditPlugin);

const ChartOfAccounts = mongoose.model('ChartOfAccounts', chartOfAccountsSchema);
const JournalEntry = mongoose.model('JournalEntry', journalEntryHeaderSchema);
const JournalEntryLine = mongoose.model('JournalEntryLine', journalEntryLineSchema);
const FinancialTransaction = mongoose.model('FinancialTransaction', financialTransactionSchema);

module.exports = {
  ChartOfAccounts,
  JournalEntry,
  JournalEntryLine,
  FinancialTransaction
};
