const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'CREATE', 'UPDATE', 'DELETE'
  module: { type: String, required: true }, // e.g., 'Plant', 'User'
  recordId: { type: mongoose.Schema.Types.ObjectId },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress: { type: String },
}, { timestamps: true });

const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String },
  status: { type: String, enum: ['Success', 'Failed', 'Logout'] },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

module.exports = {
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  LoginHistory: mongoose.model('LoginHistory', loginHistorySchema),
};
