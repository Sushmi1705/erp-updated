const mongoose = require('mongoose');

// Helper to inject Global Audit Fields
const addAuditFields = (schema) => {
  schema.add({
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deleted_at: { type: Date },
    is_deleted: { type: Boolean, default: false },
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
  });
  schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });
};

// --- B. INVENTORY SUMMARY / AGGREGATION ---
const inventorySummarySchema = new mongoose.Schema({
  Product_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Warehouse_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  Total_On_Hand: { type: Number, default: 0 },
  Total_Allocated: { type: Number, default: 0 },
  Available_to_Promise: { type: Number, default: 0 },
  On_Order_Quantity: { type: Number, default: 0 },
  Last_Updated_Timestamp: { type: Date, default: Date.now }
});
addAuditFields(inventorySummarySchema);

// Middleware to calculate ATP on save
inventorySummarySchema.pre('save', function(next) {
  this.Available_to_Promise = this.Total_On_Hand - this.Total_Allocated;
  this.Last_Updated_Timestamp = new Date();
  next();
});

// --- C. GRANULAR BIN/BATCH INVENTORY ---
const granularBinInventorySchema = new mongoose.Schema({
  Inventory_Summary_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'InventorySummary', required: true },
  Product_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Batch_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'BatchMaster' },
  Bin_ID: { type: String, required: true },
  Stock_Quantity: { type: Number, default: 0 },
  Hold_Status: { type: String, enum: ['Unrestricted', 'QC_Hold', 'Blocked'], default: 'Unrestricted' }
});
addAuditFields(granularBinInventorySchema);

// --- D. WIP TRACKING ---
const wipTrackingSchema = new mongoose.Schema({
  Work_Order_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder', required: true },
  Routing_Operation_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'RoutingOperation' }, // Assuming a routing master
  Product_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  Current_Quantity: { type: Number, default: 0 },
  Scrap_Quantity: { type: Number, default: 0 }
});
addAuditFields(wipTrackingSchema);

module.exports = {
  InventorySummary: mongoose.model('InventorySummary', inventorySummarySchema),
  GranularBinInventory: mongoose.model('GranularBinInventory', granularBinInventorySchema),
  WIPTracking: mongoose.model('WIPTracking', wipTrackingSchema)
};
