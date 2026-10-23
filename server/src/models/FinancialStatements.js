const mongoose = require('mongoose');
const { internalId } = require('../utils/internalId');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. REPORT TEMPLATE HEADER (Parent Level) ---
const reportTemplateHeaderSchema = new mongoose.Schema({
  Template_ID: { type: String, default: () => internalId('RPT') },
  Template_Code: { type: String, required: true, unique: true },
  Template_Name: { type: String, required: true },
  Report_Type: { type: String, enum: ['Profit_Loss', 'Balance_Sheet', 'Cash_Flow'], required: true },
  Default_Period_Type: { type: String, enum: ['Current_Fiscal_Year', 'As_Of_Today', 'YTD'], default: 'Current_Fiscal_Year' },
  Is_Active: { type: Boolean, default: true }
}, { timestamps: true, strict: false });
reportTemplateHeaderSchema.plugin(auditPlugin);

// --- B. REPORT LAYOUT LINES (Statement Rows) ---
const reportLayoutLineSchema = new mongoose.Schema({
  Line_ID: { type: String, default: () => internalId('LINE') },
  Template_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportTemplateHeader', required: true },
  Parent_Line_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportLayoutLine', default: null },
  Line_Sequence: { type: Number, required: true },
  Line_Name: { type: String, required: true },
  Line_Type: { type: String, enum: ['Header', 'Data_Row', 'Calculated_Total'], default: 'Data_Row' },
  Math_Operator: { type: String, enum: ['Add', 'Subtract'], default: 'Add' },
  Formatting_Style: { type: String, enum: ['Standard', 'Bold', 'Highlight_Green', 'Highlight_Red'], default: 'Standard' }
}, { timestamps: true, strict: false });
reportLayoutLineSchema.plugin(auditPlugin);

// --- C. ACCOUNT MAPPINGS (GL Integration) ---
const reportAccountMappingSchema = new mongoose.Schema({
  Mapping_ID: { type: String, default: () => internalId('MAP') },
  Line_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportLayoutLine', required: true },
  Account_Type_Filter: { type: String, enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'COGS'] },
  Specific_Account_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccounts', default: null },
  Account_Range_Start: { type: String, default: null },
  Account_Range_End: { type: String, default: null }
}, { timestamps: true, strict: false });
reportAccountMappingSchema.plugin(auditPlugin);

const ReportTemplateHeader = mongoose.model('ReportTemplateHeader', reportTemplateHeaderSchema);
const ReportLayoutLine = mongoose.model('ReportLayoutLine', reportLayoutLineSchema);
const ReportAccountMapping = mongoose.model('ReportAccountMapping', reportAccountMappingSchema);

module.exports = {
  ReportTemplateHeader,
  ReportLayoutLine,
  ReportAccountMapping
};
