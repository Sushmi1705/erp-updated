const mongoose = require('mongoose');
const { internalId } = require('../utils/internalId');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. TAX CONFIGURATION MASTER (GST Engine) ---
const taxConfigurationMasterSchema = new mongoose.Schema({
  Tax_ID: { type: String, default: () => internalId('TAX') },
  Tax_Code: { type: String, required: true, unique: true },
  Description: { type: String, required: true },
  Tax_Type: { type: String, enum: ['CGST', 'SGST', 'IGST', 'UTGST', 'CESS'], required: true },
  Rate_Percentage: { type: Number, required: true, min: 0, max: 100 },
  Effective_From_Date: { type: Date, default: Date.now },
  Effective_To_Date: { type: Date },
  GL_Account_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccounts' },
  Status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  Plant_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
}, { timestamps: true, strict: false });
taxConfigurationMasterSchema.plugin(auditPlugin);

// --- B. TAX LEDGER (Transaction Accumulator) ---
const taxLedgerSchema = new mongoose.Schema({
  Tax_Transaction_ID: { type: String, default: () => internalId('TXTRX') },
  Source_Document_ID: { type: String, required: true }, // Invoice_ID or Bill_ID
  Source_Module: { type: String, enum: ['Accounts Receivable', 'Accounts Payable'], required: true },
  Transaction_Date: { type: Date, required: true, default: Date.now },
  Tax_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxConfigurationMaster', required: true },
  Base_Amount: { type: Number, required: true, min: 0 },
  Tax_Amount: { type: Number, required: true, min: 0 },
  Tax_Nature: { type: String, enum: ['Output', 'Input'], required: true }
}, { timestamps: true, strict: false });
taxLedgerSchema.plugin(auditPlugin);

// --- C. TAX REPORTS (Generated Summaries) ---
const taxReportSchema = new mongoose.Schema({
  Report_ID: { type: String, default: () => internalId('TXR') },
  Report_Number: { type: String, default: () => `TXR-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}` },
  Period_Start_Date: { type: Date, required: true },
  Period_End_Date: { type: Date, required: true },
  Generated_Date: { type: Date, default: Date.now },
  Total_Sales_Value: { type: Number, default: 0 },
  Total_Purchase_Value: { type: Number, default: 0 },
  Total_Output_Tax: { type: Number, default: 0 },
  Total_Input_Tax: { type: Number, default: 0 },
  Net_Tax_Payable: { type: Number, default: 0 },
  Status: { type: String, enum: ['Draft', 'Finalized', 'Filed'], default: 'Draft' }
}, { timestamps: true, strict: false });
taxReportSchema.plugin(auditPlugin);

const TaxConfigurationMaster = mongoose.model('TaxConfigurationMaster', taxConfigurationMasterSchema);
const TaxLedger = mongoose.model('TaxLedger', taxLedgerSchema);
const TaxReport = mongoose.model('TaxReport', taxReportSchema);

module.exports = {
  TaxConfigurationMaster,
  TaxLedger,
  TaxReport
};
