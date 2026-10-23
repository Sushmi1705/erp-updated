const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  gst: { type: String, unique: true, sparse: true },
  pan: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  country: { type: String },
  state: { type: String },
  currency: { type: String },
  timeZone: { type: String },
  fiscalYear: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });
companySchema.plugin(auditPlugin);

const businessUnitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });
businessUnitSchema.plugin(auditPlugin);

const plantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  businessUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit', required: true },
  address: { type: String },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  currency: { type: String },
  timeZone: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });
plantSchema.plugin(auditPlugin);

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });
departmentSchema.plugin(auditPlugin);

// Deprecated or removed from this file based on new architecture:
// Branch, CostCenter, CompanyProfile. 
// Note: We rename CompanyProfile -> Company.
const Company = mongoose.model('Company', companySchema);
const BusinessUnit = mongoose.model('BusinessUnit', businessUnitSchema);
const Plant = mongoose.model('Plant', plantSchema);
const Department = mongoose.model('Department', departmentSchema);

// Leaving CostCenter to avoid completely crashing existing refs if any, though it should be updated
const costCenterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });
costCenterSchema.plugin(auditPlugin);
const CostCenter = mongoose.model('CostCenter', costCenterSchema);

// Backward compatibility exports during transition
module.exports = {
  Company,
  CompanyProfile: Company,
  BusinessUnit,
  Plant,
  Department,
  CostCenter
};
