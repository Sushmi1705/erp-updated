const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const productCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
productCategorySchema.plugin(auditPlugin);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
  uomId: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM', required: true },
  hsnCode: { type: String },
  weight: { type: Number },
  currentRevision: { type: String, default: '1.0' },
  lifecycleStatus: { 
    type: String, 
    enum: ['Draft', 'Active', 'Inactive', 'Obsolete'], 
    default: 'Draft' 
  },
  standardCost: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  defaultWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  
  revisionHistory: [{
    revision: String,
    changes: String,
    date: { type: Date, default: Date.now },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
productSchema.plugin(auditPlugin);

const ProductCategory = mongoose.model('ProductCategory', productCategorySchema);
const Product = mongoose.model('Product', productSchema);

module.exports = { ProductCategory, Product };
