const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. MRP RUN HEADER (Execution Level) ---
const mrpRunHeaderSchema = new mongoose.Schema({
  runNo: {
    type: String,
    required: true,
    unique: true
  },
  targetPeriod: {
    type: String,
    required: true
  },
  runDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Draft', 'Processing', 'Completed', 'Failed', 'Superseded'],
    default: 'Completed'
  },
  runParameters: {
    type: Object, // JSON - Stores variables configured via the settings icon
    default: {}
  },
  executedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
mrpRunHeaderSchema.plugin(auditPlugin);

// --- B. EXPLODED REQUIREMENTS (The Calculation Output) ---
const explodedRequirementSchema = new mongoose.Schema({
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MrpRunHeader',
    required: true
  },
  requirementType: {
    type: String,
    enum: ['Production', 'Procurement', 'Transfer'],
    required: true
  },
  itemModel: {
    type: String,
    required: true,
    enum: ['Material', 'Product', 'MasterMaterial', 'MasterProduct']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemModel'
  },
  requiredQty: {
    type: Number,
    required: true
  },
  requirementDate: {
    type: Date,
    required: true
  },
  bomLevel: {
    type: Number,
    required: true,
    default: 0
  },
  parentRequirementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExplodedRequirement'
  },
  isExpedited: {
    type: Boolean,
    default: false
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
explodedRequirementSchema.plugin(auditPlugin);

// --- C. INVENTORY & SUPPLY SNAPSHOT (Calculation Baseline) ---
const inventorySupplySnapshotSchema = new mongoose.Schema({
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MrpRunHeader',
    required: true
  },
  itemModel: {
    type: String,
    required: true,
    enum: ['Material', 'Product']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemModel'
  },
  onHandQty: {
    type: Number,
    required: true,
    default: 0
  },
  scheduledReceiptsQty: {
    type: Number,
    required: true,
    default: 0
  },
  allocatedQty: {
    type: Number,
    required: true,
    default: 0
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, { timestamps: true });
inventorySupplySnapshotSchema.plugin(auditPlugin);

const MrpRunHeader = mongoose.model('MrpRunHeader', mrpRunHeaderSchema);
const ExplodedRequirement = mongoose.model('ExplodedRequirement', explodedRequirementSchema);
const InventorySupplySnapshot = mongoose.model('InventorySupplySnapshot', inventorySupplySnapshotSchema);

module.exports = {
  MrpRunHeader,
  ExplodedRequirement,
  InventorySupplySnapshot,
  MrpRun: MrpRunHeader // Alias for legacy code if needed
};
