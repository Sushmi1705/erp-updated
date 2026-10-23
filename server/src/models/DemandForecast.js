const mongoose = require('mongoose');

const demandForecastSchema = new mongoose.Schema({
  forecastNumber: {
    type: String,
    required: true,
    unique: true
  },
  forecastType: {
    type: String,
    enum: ['Product', 'Seasonal', 'Customer'],
    required: true
  },
  period: {
    type: String, // e.g., 'Q3-2026', 'Oct-2026'
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: function() { return ['Product', 'Seasonal'].includes(this.forecastType); }
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: function() { return this.forecastType === 'Customer'; }
  },
  seasonalFactor: {
    type: Number,
    default: 1.0, // 1.0 = No change, 1.2 = 20% increase
    min: 0
  },
  projectedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Finalized'],
    default: 'Draft'
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DemandForecast', demandForecastSchema);
