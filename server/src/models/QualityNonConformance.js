const mongoose = require('mongoose');

const qualityNonConformanceSchema = new mongoose.Schema({
  ncrNumber: {
    type: String,
    required: true,
    unique: true
  },
  inspectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QualityInspection'
  },
  defectDescription: {
    type: String,
    required: true
  },
  rootCauseFindings: {
    type: String
  },
  correctiveAction: {
    type: String
  },
  correctiveActionStatus: {
    type: String,
    enum: ['Pending', 'In-Progress', 'Completed'],
    default: 'Pending'
  },
  preventiveAction: {
    type: String
  },
  preventiveActionStatus: {
    type: String,
    enum: ['Pending', 'In-Progress', 'Completed'],
    default: 'Pending'
  },
  dateRecorded: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('QualityNonConformance', qualityNonConformanceSchema);
