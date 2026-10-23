const { handleError } = require('../utils/errorHandler');
const mongoose = require('mongoose');
const { Customer, CustomerCategory } = require('../models/MasterCustomer');
const { Vendor, VendorCategory } = require('../models/MasterVendor');
const { Product, ProductCategory } = require('../models/MasterProduct');
const { Material, MaterialCategory } = require('../models/MasterMaterial');
const { UOM, UOMConversion } = require('../models/MasterUOM');
const { Currency } = require('../models/MasterCurrency');
const { Tax } = require('../models/MasterTax');
const { PaymentTerms } = require('../models/MasterPaymentTerms');
const { DocumentSeries } = require('../models/MasterDocumentSeries');
const { Warehouse, StorageLocation, StorageZone, Rack, Bin } = require('../models/MasterWarehouse');
const { Machine } = require('../models/MasterMachine');
const { WorkCenter } = require('../models/MasterWorkCenter');

const getModelMap = () => ({
  'customer': Customer,
  'customercategory': CustomerCategory,
  'vendor': Vendor,
  'vendorcategory': VendorCategory,
  'product': Product,
  'productcategory': ProductCategory,
  'material': Material,
  'materialcategory': MaterialCategory,
  'uom': UOM,
  'uomconversion': UOMConversion,
  'currency': Currency,
  'tax': Tax,
  'paymentterms': PaymentTerms,
  'documentseries': DocumentSeries,
  'warehouse': Warehouse,
  'storagelocation': StorageLocation,
  'storagezone': StorageZone,
  'rack': Rack,
  'bin': Bin,
  'machine': Machine,
  'workcenter': WorkCenter
});

// plantId is declared `required: true` on these schemas, but the audit plugin
// re-declares the path via schema.add() and drops the validator with it, so the
// requirement has to be enforced here instead.
const PLANT_SCOPED_MODELS = ['warehouse', 'machine', 'workcenter'];

// `status` and the audit plugin's `isActive` flag are two representations of the
// same state. Keep them in lock-step on every write so a record deactivated
// through either one disappears from the lists and dropdowns that read the other.
const syncActiveFlags = (payload) => {
  const hasStatus = 'status' in payload;
  const hasIsActive = 'isActive' in payload;
  if (hasStatus && !hasIsActive && (payload.status === 'Active' || payload.status === 'Inactive')) {
    payload.isActive = payload.status === 'Active';
  } else if (hasIsActive && !hasStatus) {
    payload.status = payload.isActive ? 'Active' : 'Inactive';
  }
  return payload;
};

// @desc    Get all records for a generic master model
// @route   GET /api/master/:model
exports.getAll = async (req, res) => {
  try {
    const Model = getModelMap()[req.params.model.toLowerCase()];
    if (!Model) return res.status(404).json({ success: false, message: 'Invalid module' });

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Deactivation is reversible, so deactivated records must stay reachable:
    // ?includeInactive=true (or ?status=all) returns them, ?status=Inactive lists
    // only them. The default stays active-only so reference dropdowns are unaffected.
    const includeInactive = ['true', '1', 'yes'].includes(String(req.query.includeInactive).toLowerCase());
    const statusFilter = req.query.status;
    let filter;
    if (includeInactive || statusFilter === 'all') filter = {};
    else if (statusFilter) filter = { status: statusFilter };
    else filter = { status: { $ne: 'Inactive' }, isActive: { $ne: false } };

    let query = Model.find(filter);

    // Auto-populate logic based on common relationships
    if (Model === Customer) {
      query = query.populate('categoryId paymentTermsId currencyId salesPersonId');
    } else if (Model === Vendor) {
      query = query.populate('categoryId paymentTermsId currencyId');
    } else if (Model === Product) {
      query = query.populate('categoryId uomId defaultWarehouseId');
    } else if (Model === Material) {
      query = query.populate('categoryId uomId preferredVendorId defaultBinId');
    }
    if (Model === UOMConversion) query = query.populate('fromUOM toUOM');
    if (Model === Warehouse) query = query.populate('plantId');
    if (Model === StorageLocation) query = query.populate({ path: 'warehouseId', populate: { path: 'plantId' } });
    if (Model === StorageZone) query = query.populate({ path: 'storageLocationId', populate: { path: 'warehouseId' } });
    if (Model === Rack) query = query.populate({ path: 'zoneId', populate: { path: 'storageLocationId', populate: { path: 'warehouseId' } } });
    if (Model === Bin) query = query.populate({ path: 'rackId', populate: { path: 'zoneId', populate: { path: 'storageLocationId', populate: { path: 'warehouseId' } } } });

    if (Model === WorkCenter) query = query.populate('plantId departmentId machines');
    if (Model === Machine) query = query.populate('plantId departmentId workCenterId uomId');

    const total = await Model.countDocuments(filter);
    const data = await query.sort({ createdAt: -1 }).skip(skip).limit(limit);
    
    res.status(200).json({ 
      success: true, 
      count: data.length, 
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data 
    });
  } catch (error) {
    handleError(res, error);
  }
};

const sanitizeReferenceIds = async (Model, body) => {
  if (!body || typeof body !== 'object') return { payload: body, unset: {} };
  const payload = { ...body };
  const unset = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === '' || value === null || value === undefined) {
      // A blank value cannot be stored (an ObjectId path would fail to cast), but
      // it is an explicit "clear this field" instruction: hand it to the caller as
      // an $unset rather than dropping it, so optional fields can be blanked out.
      delete payload[key];
      if (value !== undefined && key !== '_id') unset[key] = '';
      continue;
    }

    if (typeof value === 'string' && (key.endsWith('Id') || key.endsWith('ID'))) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        try {
          let refModel = null;
          if (key === 'currencyId') refModel = Currency;
          else if (key === 'paymentTermsId') refModel = PaymentTerms;
          else if (key === 'taxId') refModel = Tax;
          else if (key === 'uomId') refModel = UOM;
          else if (key === 'categoryId' && Model === Customer) refModel = CustomerCategory;
          else if (key === 'categoryId' && Model === Vendor) refModel = VendorCategory;
          else if (key === 'categoryId' && Model === Product) refModel = ProductCategory;
          else if (key === 'categoryId' && Model === Material) refModel = MaterialCategory;

          if (refModel) {
            let found = await refModel.findOne({
              $or: [{ code: value }, { name: value }]
            });
            if (!found) {
              if (refModel === Currency) {
                const sym = value === 'INR' ? '₹' : value === 'USD' ? '$' : value === 'EUR' ? '€' : value;
                found = await refModel.create({ name: value, code: value, symbol: sym, status: 'Active' });
              } else if (refModel === PaymentTerms) {
                const days = parseInt(value.replace(/\D/g, '')) || 0;
                found = await refModel.create({ name: value, code: value, days, status: 'Active' });
              } else {
                found = await refModel.create({ name: value, code: value, status: 'Active' });
              }
            }
            payload[key] = found._id;
          } else {
            delete payload[key];
          }
        } catch (err) {
          delete payload[key];
        }
      }
    }
  }

  return { payload, unset };
};

// @desc    Create record
// @route   POST /api/master/:model
exports.create = async (req, res) => {
  try {
    const modelKey = req.params.model.toLowerCase();
    const Model = getModelMap()[modelKey];
    if (!Model) return res.status(404).json({ success: false, message: 'Invalid module' });

    if (PLANT_SCOPED_MODELS.includes(modelKey) && !req.body.plantId) {
      return res.status(400).json({ success: false, message: 'Path `plantId` is required.' });
    }

    req.body.createdBy = req.user._id;
    const { payload } = await sanitizeReferenceIds(Model, req.body);
    const doc = await Model.create(syncActiveFlags(payload));
    
    // Create Audit Log (simplified for master data)
    const { AuditLog } = require('../models/Audit');
    await AuditLog.create({
      changedBy: req.user._id,
      action: 'Create',
      module: 'MasterData',
      recordId: doc._id,
      newValue: { message: `Created new ${req.params.model} record: ${req.body.name || req.body.code || 'Item'}` }
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update record
// @route   PUT /api/master/:model/:id
exports.update = async (req, res) => {
  try {
    const modelKey = req.params.model.toLowerCase();
    const Model = getModelMap()[modelKey];
    if (!Model) return res.status(404).json({ success: false, message: 'Invalid module' });

    if (PLANT_SCOPED_MODELS.includes(modelKey) && 'plantId' in req.body && !req.body.plantId) {
      return res.status(400).json({ success: false, message: 'Path `plantId` is required.' });
    }

    const { payload, unset } = await sanitizeReferenceIds(Model, req.body);
    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;
    syncActiveFlags(payload);
    const updateDoc = {};
    if (Object.keys(payload).length) updateDoc.$set = payload;
    if (Object.keys(unset).length) updateDoc.$unset = unset;
    const doc = await Model.findByIdAndUpdate(req.params.id, updateDoc, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Record not found' });

    // Create Audit Log
    const { AuditLog } = require('../models/Audit');
    await AuditLog.create({
      changedBy: req.user._id,
      action: 'Update',
      module: 'MasterData',
      recordId: doc._id,
      newValue: { message: `Updated ${req.params.model} record: ${doc.name || doc.code || 'Item'}` }
    });

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete record
// @route   DELETE /api/master/:model/:id
exports.remove = async (req, res) => {
  try {
    const Model = getModelMap()[req.params.model.toLowerCase()];
    if (!Model) return res.status(404).json({ success: false, message: 'Invalid module' });

    // Soft deactivation only — both flags are written so the record cannot end up
    // half-active, and it stays retrievable via ?includeInactive=true for reactivation.
    const doc = await Model.findByIdAndUpdate(req.params.id, { status: 'Inactive', isActive: false }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Record not found' });

    // Create Audit Log
    const { AuditLog } = require('../models/Audit');
    await AuditLog.create({
      changedBy: req.user._id,
      action: 'Delete',
      module: 'MasterData',
      recordId: doc._id,
      newValue: { message: `Deleted ${req.params.model} record: ${doc.name || doc.code || 'Item'}` }
    });

    res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (error) {
    handleError(res, error);
  }
};
