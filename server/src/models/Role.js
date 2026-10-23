const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
  },
  permissions: {
    type: [
      {
        module: {
          type: String, // e.g., 'CompanySetup', 'UserManagement'
          required: true,
        },
        screens: [{ type: String }],
        actions: [{ type: String }],
        buttons: [{ type: String }],
        reports: [{ type: String }]
      }
    ]
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isSystem: {
    type: Boolean,
    default: false, // System roles cannot be deleted
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
