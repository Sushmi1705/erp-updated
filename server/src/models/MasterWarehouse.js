const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  type: { type: String, default: 'General' }, // Raw Material, Finished Goods, WIP, Scrap, General
  capacitySqFt: { type: Number },
  inCharge: { type: String },
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
warehouseSchema.index({ code: 1, plantId: 1 }, { unique: true });
warehouseSchema.plugin(auditPlugin);

const storageLocationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  areaType: { type: String, default: 'Storage Bay' }, // Receiving Bay, Dispatch Staging, Production Buffer, Quarantine
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
storageLocationSchema.plugin(auditPlugin);

const storageZoneSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  storageLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageLocation', required: true },
  zoneType: { type: String, default: 'Standard' }, // Heavy Coils, Sheet Packs, Finished Assemblies, Flammable/Chemical
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
storageZoneSchema.plugin(auditPlugin);

const rackSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageZone', required: true },
  rackType: { type: String, default: 'Pallet Rack' }, // Cantilever, Heavy Pallet, Flow Rack, Floor Staging
  levels: { type: Number, default: 3 },
  capacityTons: { type: Number },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
rackSchema.plugin(auditPlugin);

const binSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  rackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rack', required: true },
  barcode: { type: String },
  maxWeightKg: { type: Number },
  isOccupied: { type: Boolean, default: false },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });
binSchema.plugin(auditPlugin);

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
const StorageLocation = mongoose.model('StorageLocation', storageLocationSchema);
const StorageZone = mongoose.model('StorageZone', storageZoneSchema);
const Rack = mongoose.model('Rack', rackSchema);
const Bin = mongoose.model('Bin', binSchema);

module.exports = { Warehouse, StorageLocation, StorageZone, Rack, Bin };

