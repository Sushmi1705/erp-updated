const mongoose = require('mongoose');

const qualityInspectionSchema = new mongoose.Schema({
  inspectionNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Legacy Goods Receipt Fields
  inspectionDate: { type: Date, default: Date.now },
  grnId: { type: mongoose.Schema.Types.ObjectId, ref: 'GoodsReceipt' },
  inspectedQuantity: { type: Number, min: 0 },
  acceptedQuantity: { type: Number, default: 0, min: 0 },
  rejectedQuantity: { type: Number, default: 0, min: 0 },
  holdQuantity: { type: Number, default: 0, min: 0 },
  inspectionStatus: { type: String, enum: ['Pending', 'In-Progress', 'Completed', 'Hold-Review'], default: 'Pending' },
  defectCategory: { type: String, default: 'None' },
  aqlStandard: { type: String, default: 'MIL-STD-105E Level II (AQL 0.65)' },
  sampleSize: { type: Number, default: 0 },
  remarks: String,

  // New Generalized Quality Management Fields
  type: {
    type: String,
    enum: ['Incoming', 'In-Process', 'Final', 'Legacy-GRN'],
    default: 'Legacy-GRN'
  },
  referenceId: {
    type: String // General ref for WO, Batch, etc.
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  inspectorName: {
    type: String,
    required: true
  },
  inspectionResults: {
    type: String
  },
  status: { // Generalized status
    type: String,
    enum: ['Pending', 'Pass', 'Fail', 'Hold'],
    default: 'Pending'
  },
  vendorQualityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  productReleaseStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  dateRecorded: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('QualityInspection', qualityInspectionSchema);
