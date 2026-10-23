const mongoose = require('mongoose');

module.exports = function auditPlugin(schema, options) {
  schema.add({
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }
  });

  // Automatically filter out soft-deleted documents
  const excludeDeleted = function() {
    if (this.getQuery().isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
  };

  schema.pre('find', excludeDeleted);
  schema.pre('findOne', excludeDeleted);
  schema.pre('findOneAndUpdate', excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);
  schema.pre('aggregate', function() {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  });
};
