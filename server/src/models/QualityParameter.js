const mongoose = require('mongoose');

const qualityParameterSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  parameterType: {
    type: String,
    enum: ['Thickness', 'Hardness', 'Weight', 'Dimensions'],
    required: true
  },
  standardValue: {
    type: Number,
    required: true
  },
  tolerancePlus: {
    type: Number,
    required: true
  },
  toleranceMinus: {
    type: Number,
    required: true
  },
  recordedMeasurements: [{
    value: Number,
    date: { type: Date, default: Date.now },
    pass: Boolean,
    inspector: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('QualityParameter', qualityParameterSchema);
