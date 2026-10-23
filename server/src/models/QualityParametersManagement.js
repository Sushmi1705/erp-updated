const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

// --- A. QUALITY PARAMETER DEFINITION (Standard Master) ---
const qualityParameterDefinitionSchema = new mongoose.Schema({
  Param_Standard_ID: { type: String, required: true, unique: true },
  Material_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Parameter_Name: { type: String, required: true },
  Standard_Target: { type: Number, required: true },
  Tolerance_Upper: { type: Number, required: true, min: 0 },
  Tolerance_Lower: { type: Number, required: true, min: 0 },
  UOM_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'UOM' },
  Total_Readings_Count: { type: Number, default: 0 },
  Is_Active: { type: Boolean, default: true }
}, { timestamps: true });

// Rule 2: Uniqueness Constraint (Material_ID + Parameter_Name)
qualityParameterDefinitionSchema.index({ Material_ID: 1, Parameter_Name: 1 }, { unique: true });
qualityParameterDefinitionSchema.plugin(auditPlugin);

// --- B. MEASUREMENT LOG (Readings) ---
const qualityMeasurementLogSchema = new mongoose.Schema({
  Measurement_Log_ID: { type: String, required: true, unique: true },
  Param_Standard_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'QualityParameterDefinition', required: true },
  Measured_Value: { type: Number, required: true },
  Calculated_Status: { type: String, enum: ['Pass', 'Fail'], required: true },
  Inspector_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Measurement_Date: { type: Date, default: Date.now },
  Source_Context: { type: String, enum: ['Standalone', 'Incoming QC', 'In-Process QC', 'Final QC'], default: 'Standalone' },
  Source_Ref_ID: { type: String }
}, { timestamps: true });
qualityMeasurementLogSchema.plugin(auditPlugin);

const QualityParameterDefinition = mongoose.model('QualityParameterDefinition', qualityParameterDefinitionSchema);
const QualityMeasurementLog = mongoose.model('QualityMeasurementLog', qualityMeasurementLogSchema);

module.exports = {
  QualityParameterDefinition,
  QualityMeasurementLog
};
