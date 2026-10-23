const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const materialCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
materialCategorySchema.plugin(auditPlugin);

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialCategory', required: true },
  uomId: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM', required: true },
  Material_Type: { type: String, enum: ['RAW_MATERIAL', 'WIP', 'FINISHED_GOOD', 'SPARE_PART'], default: 'RAW_MATERIAL' },
  Safety_Stock_Level: { type: Number, default: 0 },
  Reorder_Point: { type: Number, default: 0 },
  grade: { type: String },
  standardCost: { type: Number, default: 0 },
  preferredVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  leadTimeDays: { type: Number, default: 0 },
  shelfLifeDays: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  defaultBinId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
  skuCode: { type: String, trim: true, index: true },
  oemPartNumber: { type: String, trim: true },
  barcode: { type: String, trim: true },
  vehicleCompatibility: [{
    make: { type: String },
    model: { type: String },
    yearFrom: { type: Number },
    yearTo: { type: Number },
    variant: { type: String }
  }],
  drawingNumber: { type: String },
  drawingRevision: { type: String },
  hsnCode: { type: String, trim: true },
  pricingTiers: [{
    tierName: { type: String },
    price: { type: Number },
    currency: { type: String, default: 'INR' }
  }],
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
materialSchema.plugin(auditPlugin);

const MaterialCategory = mongoose.model('MaterialCategory', materialCategorySchema);
const Material = mongoose.model('Material', materialSchema);

module.exports = { MaterialCategory, Material };
