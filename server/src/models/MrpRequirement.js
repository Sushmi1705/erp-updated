const mongoose = require('mongoose');

const mrpRequirementSchema = new mongoose.Schema({
  mrpRunId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MrpRun',
    required: true
  },
  requirementType: {
    type: String,
    enum: ['Material', 'Component', 'Production'],
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
  requiredQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  parameters: {
    leadTimeDays: { type: Number, default: 0 },
    scrapPercentage: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('MrpRequirement', mrpRequirementSchema);
