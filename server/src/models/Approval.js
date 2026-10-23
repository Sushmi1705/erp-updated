const mongoose = require('mongoose');

const approvalConfigSchema = new mongoose.Schema({
  module: { type: String, required: true }, // e.g. 'Warehouse', 'Plant'
  action: { type: String, required: true }, // e.g. 'create', 'update'
  name: { type: String },
  description: { type: String },
  minAmount: { type: Number, default: 0 },
  priority: { type: String, default: 'ALL' },
  levels: [{
    level: { type: Number, required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    slaHours: { type: Number, default: 24 },
    thresholdAmount: { type: Number, default: 0 },
    notifyEscalation: { type: Boolean, default: true }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const approvalRequestSchema = new mongoose.Schema({
  module: { type: String, required: true },
  action: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed }, // The JSON payload of the requested action
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Current state of approval
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  currentLevel: { type: Number, default: 1 },
  
  // The original config levels copied over so we know exactly who needs to approve this specific request
  requiredLevels: [{
    level: { type: Number },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    actionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actionedAt: { type: Date },
    comments: { type: String }
  }]
}, { timestamps: true });

module.exports = {
  ApprovalConfig: mongoose.model('ApprovalConfig', approvalConfigSchema),
  ApprovalRequest: mongoose.model('ApprovalRequest', approvalRequestSchema)
};
