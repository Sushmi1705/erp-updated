const { handleError } = require('../utils/errorHandler');
const { editable } = require('../utils/safeBody');
const { ForecastHeader, ForecastLineItem, ForecastHistoryRef, ForecastAdjustment } = require('../models/DemandForecasting');
const DemandConsolidation = require('../models/DemandConsolidation');
const { SalesOrder } = require('../models/SalesOrder');
const { Customer } = require('../models/MasterCustomer');
const { Product } = require('../models/MasterProduct');
const { AuditLog } = require('../models/Audit');

const logAudit = async (action, entityType, entityId, userId, changes) => {
  try {
    await AuditLog.create({
      action,
      module: entityType,
      recordId: entityId,
      changedBy: userId,
      newValue: changes || null
    });
  } catch (err) { console.error('Audit Log Error:', err); }
};

// ================= Demand Forecasting (4-Entity) =================

// --- A. FORECAST HEADERS ---
exports.getAllForecasts = async (req, res) => {
  try {
    const forecasts = await ForecastHeader.find().sort({ updatedAt: -1 });
    res.json({ success: true, data: forecasts });
  } catch (error) { handleError(res, error); }
};

exports.getForecastById = async (req, res) => {
  try {
    const forecast = await ForecastHeader.findById(req.params.id);
    if (!forecast) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: forecast });
  } catch (error) { handleError(res, error); }
};

exports.createForecast = async (req, res) => {
  try {
    const { forecastType, targetEntityId, algorithmUsed } = req.body;

    // Rule 1: Target Polymorphism Validation
    if (forecastType === 'Customer') {
      const exists = await Customer.findOne({ _id: targetEntityId, status: 'Active' });
      if (!exists) return res.status(400).json({ success: false, message: 'Invalid or inactive Customer' });
    } else if (forecastType === 'Product') {
      const exists = await Product.findOne({ _id: targetEntityId, status: 'Active' });
      if (!exists) return res.status(400).json({ success: false, message: 'Invalid or inactive Product' });
    }

    const newForecast = await ForecastHeader.create(req.body);
    await logAudit('CREATE', 'ForecastHeader', newForecast._id, req.user._id);
    res.status(201).json({ success: true, data: newForecast });
  } catch (error) { handleError(res, error); }
};

exports.updateForecast = async (req, res) => {
  try {
    const { forecastType, targetEntityId, algorithmUsed, status } = req.body;
    const existing = await ForecastHeader.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    // Rule 1: Target Polymorphism Validation (if changed)
    if (forecastType || targetEntityId) {
      const typeToCheck = forecastType || existing.forecastType;
      const targetToCheck = targetEntityId || existing.targetEntityId;
      if (typeToCheck === 'Customer') {
        const exists = await Customer.findOne({ _id: targetToCheck, status: 'Active' });
        if (!exists) return res.status(400).json({ success: false, message: 'Invalid or inactive Customer' });
      } else if (typeToCheck === 'Product') {
        const exists = await Product.findOne({ _id: targetToCheck, status: 'Active' });
        if (!exists) return res.status(400).json({ success: false, message: 'Invalid or inactive Product' });
      }
    }

    // Rule 4: Historical Baseline Minimums
    if (algorithmUsed && ['Moving Average', 'Exponential Smoothing', 'ML-Prophet'].includes(algorithmUsed)) {
      const historyCount = await ForecastHistoryRef.countDocuments({ forecastId: req.params.id });
      if (historyCount < 12) {
        return res.status(400).json({ 
          success: false, 
          message: `Statistical algorithm requires at least 12 historical data references. Found ${historyCount}. Please use 'Manual Entry' or add history.` 
        });
      }
    }

    const updated = await ForecastHeader.findByIdAndUpdate(req.params.id, editable(req.body), { new: true });
    await logAudit('UPDATE', 'ForecastHeader', updated._id, req.user._id);
    res.json({ success: true, data: updated });
  } catch (error) { handleError(res, error); }
};

// --- B. FORECAST LINE ITEMS ---
exports.getLinesByForecast = async (req, res) => {
  try {
    const lines = await ForecastLineItem.find({ forecastId: req.params.id }).populate('productId', 'name code').sort({ timeBucketDate: 1 });
    res.json({ success: true, data: lines });
  } catch (error) { handleError(res, error); }
};

exports.createForecastLine = async (req, res) => {
  try {
    const header = await ForecastHeader.findById(req.params.id);
    if (header.status === 'Finalized') return res.status(400).json({ success: false, message: 'Cannot add lines to a finalized forecast' });
    
    const line = await ForecastLineItem.create({ ...req.body, forecastId: req.params.id });
    res.status(201).json({ success: true, data: line });
  } catch (error) { handleError(res, error); }
};

exports.updateForecastLine = async (req, res) => {
  try {
    const line = await ForecastLineItem.findById(req.params.lineId);
    if (!line) return res.status(404).json({ success: false, message: 'Line not found' });

    const header = await ForecastHeader.findById(line.forecastId);
    
    // Rule 2: Finalization Lock Constraint
    if (header.status === 'Finalized' && req.body.manualAdjustedQty !== undefined) {
      return res.status(400).json({ success: false, message: 'Forecast is Finalized. Manual adjusted quantity cannot be modified.' });
    }

    // Rule 5: Override Tracking Mandate
    if (req.body.manualAdjustedQty !== undefined || req.body.finalForecastQty !== undefined) {
      const newManual = req.body.manualAdjustedQty !== undefined ? req.body.manualAdjustedQty : line.manualAdjustedQty;
      const newFinal = req.body.finalForecastQty !== undefined ? req.body.finalForecastQty : line.finalForecastQty;
      
      if (newFinal !== line.systemCalculatedQty || newManual !== line.manualAdjustedQty) {
        if (!req.body.reasonCode) {
          return res.status(400).json({ success: false, message: 'Reason_Code is mandatory when overriding system quantities.' });
        }
        await ForecastAdjustment.create({
          lineId: line._id,
          adjustedBy: req.user._id,
          previousQty: line.finalForecastQty, // tracking final qty change
          newQty: newFinal,
          reasonCode: req.body.reasonCode,
          notes: req.body.notes || 'Manual Override'
        });
      }
    }

    Object.assign(line, req.body);
    await line.save();

    // Rollup to Header
    const allLines = await ForecastLineItem.find({ forecastId: header._id });
    header.totalAdjustedQty = allLines.reduce((sum, l) => sum + (l.finalForecastQty || 0), 0);
    await header.save();

    res.json({ success: true, data: line });
  } catch (error) { handleError(res, error); }
};

exports.deleteForecastLine = async (req, res) => {
  try {
    const line = await ForecastLineItem.findById(req.params.lineId);
    if (!line) return res.status(404).json({ success: false, message: 'Line not found' });
    const header = await ForecastHeader.findById(line.forecastId);
    if (header.status === 'Finalized') return res.status(400).json({ success: false, message: 'Cannot delete lines from a finalized forecast' });

    await ForecastLineItem.findByIdAndDelete(req.params.lineId);
    res.json({ success: true, message: 'Line deleted' });
  } catch (error) { handleError(res, error); }
};

// --- C. HISTORY REFS ---
exports.getHistoryByForecast = async (req, res) => {
  try {
    const history = await ForecastHistoryRef.find({ forecastId: req.params.id }).sort({ historicalPeriodDate: -1 });
    res.json({ success: true, data: history });
  } catch (error) { handleError(res, error); }
};

exports.createHistoryRef = async (req, res) => {
  try {
    const ref = await ForecastHistoryRef.create({ ...req.body, forecastId: req.params.id });
    res.status(201).json({ success: true, data: ref });
  } catch (error) { handleError(res, error); }
};

exports.deleteHistoryRef = async (req, res) => {
  try {
    await ForecastHistoryRef.findByIdAndDelete(req.params.refId);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { handleError(res, error); }
};

// --- D. ADJUSTMENTS ---
exports.getAdjustmentsByLine = async (req, res) => {
  try {
    const adjustments = await ForecastAdjustment.find({ lineId: req.params.lineId }).sort({ adjustmentDate: -1 });
    res.json({ success: true, data: adjustments });
  } catch (error) { handleError(res, error); }
};


// ================= Historical Sales Analysis =================

exports.getHistoricalAnalysis = async (req, res) => {
  try {
    const validStatuses = ['Approved', 'In Production', 'Dispatched', 'Invoiced'];
    
    // Check if SalesOrder has aggregate
    if (typeof SalesOrder.aggregate !== 'function') {
      return res.json({ success: true, data: [] });
    }

    const historicalData = await SalesOrder.aggregate([
      { $match: { status: { $in: validStatuses } } },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.productId",
        totalHistoricalQuantity: { $sum: "$items.quantity" },
        totalHistoricalValue: { $sum: "$items.total" },
        orderCount: { $sum: 1 }
      }},
      { $lookup: {
        from: 'masterproducts',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: "$product" },
      { $project: {
        productId: "$_id",
        productName: "$product.name",
        productCode: "$product.code",
        totalHistoricalQuantity: 1,
        totalHistoricalValue: 1,
        orderCount: 1
      }}
    ]);

    res.json({ success: true, data: historicalData });
  } catch (error) { handleError(res, error); }
};

// ================= Demand Consolidation (3-Tier) =================

const { ConsolidationRunHeader, ConsolidationLineItem, SourceTraceabilityLink } = require('../models/DemandConsolidation');

exports.getAllConsolidations = async (req, res) => {
  try {
    const runs = await ConsolidationRunHeader.find().sort({ runDate: -1 });
    res.json({ success: true, data: runs });
  } catch (error) { handleError(res, error); }
};

exports.getConsolidationLinesByRun = async (req, res) => {
  try {
    const lines = await ConsolidationLineItem.find({ runId: req.params.runId }).populate('productId', 'name code');
    res.json({ success: true, data: lines });
  } catch (error) { handleError(res, error); }
};

exports.getTraceabilityLinksByLine = async (req, res) => {
  try {
    const links = await SourceTraceabilityLink.find({ consolidationLineId: req.params.lineId });
    res.json({ success: true, data: links });
  } catch (error) { handleError(res, error); }
};

exports.generateConsolidation = async (req, res) => {
  let runHeader = null;
  try {
    const { period, targetHorizonStart, targetHorizonEnd } = req.body;
    if (!period || !targetHorizonStart || !targetHorizonEnd) {
      return res.status(400).json({ success: false, message: 'period, targetHorizonStart, and targetHorizonEnd are required' });
    }

    // Create Run Header
    // Opened as 'Processing' and only flipped to 'Completed' once the lines are written —
    // a run that crashes mid-way must not be left showing green with zero lines.
    const runNumber = `DC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    runHeader = await ConsolidationRunHeader.create({
      runNumber,
      targetHorizonStart,
      targetHorizonEnd,
      status: 'Processing',
      runType: 'Full Regeneration',
      executedBy: req.user._id
    });

    // Rule 3: MRP Consolidation Gate (Finalized forecasts only)
    const finalizedHeaders = await ForecastHeader.find({ forecastPeriod: period, status: 'Finalized' });
    const headerIds = finalizedHeaders.map(h => h._id);

    const forecastLines = await ForecastLineItem.find({ forecastId: { $in: headerIds }, productId: { $exists: true, $ne: null } });

    // Rule 3: Sales Orders Gate (Approved or Processing)
    const validStatuses = ['Approved', 'In Processing', 'In Production'];
    
    // Convert to Date objects to compare with SalesOrder.orderDate or deliveryDate
    const start = new Date(targetHorizonStart);
    const end = new Date(targetHorizonEnd);
    
    // We fetch sales orders matching the horizon
    let salesOrders = [];
    if (typeof SalesOrder.aggregate === 'function') {
      salesOrders = await SalesOrder.aggregate([
        { $match: { 
            status: { $in: validStatuses },
            orderDate: { $gte: start, $lte: end }
        }},
        { $unwind: "$items" }
      ]);
    }

    // Merge by Product ID
    const productMap = {}; // { productId: { f_qty, so_qty, f_lines: [], so_lines: [] } }

    forecastLines.forEach(f => {
      const pId = f.productId.toString();
      if (!productMap[pId]) productMap[pId] = { f_qty: 0, so_qty: 0, f_lines: [], so_lines: [] };
      productMap[pId].f_qty += (f.finalForecastQty || 0);
      productMap[pId].f_lines.push(f);
    });

    salesOrders.forEach(s => {
      const pId = s.items.productId.toString();
      if (!productMap[pId]) productMap[pId] = { f_qty: 0, so_qty: 0, f_lines: [], so_lines: [] };
      productMap[pId].so_qty += (s.items.quantity || 0);
      productMap[pId].so_lines.push(s);
    });

    // Create Lines and Traceability Links
    const createdLines = [];
    
    for (const [pId, data] of Object.entries(productMap)) {
      // Rule 2: Forecast Consumption Logic (prevent double counting)
      // We reduce forecast demand by sales order demand
      const netForecastDemand = Math.max(0, data.f_qty - data.so_qty);
      
      // Rule 4: Real-Time Safety Stock Fetch
      // Fetching from MasterProduct or defaulting to 0 as it's not present currently.
      const safetyStockQty = 0; 
      
      // Rule 1 (Calculation Integrity) is applied here rather than relying on the model's
      // pre('save') hook: that hook is callback-style and throws under mongoose 9, which
      // took the whole run down. insertMany() does not run save middleware.
      const totalGrossDemand = netForecastDemand + data.so_qty + safetyStockQty;
      const [lineItem] = await ConsolidationLineItem.insertMany([{
        runId: runHeader._id,
        periodName: period,
        productId: pId,
        forecastDemandQty: netForecastDemand,
        salesOrderQty: data.so_qty,
        safetyStockQty,
        manualAdjustmentQty: 0,
        totalGrossDemand,
        finalNetDemand: totalGrossDemand // no manual adjustment exists at generation time
      }]);
      createdLines.push(lineItem);

      // Create Traceability Links
      for (const fl of data.f_lines) {
        await SourceTraceabilityLink.create({
          consolidationLineId: lineItem._id,
          sourceType: 'Forecast',
          sourceRecordId: fl._id.toString(),
          contributedQty: fl.finalForecastQty,
          isConsumed: data.so_qty > 0 // Simplistic mapping
        });
      }

      for (const sl of data.so_lines) {
        await SourceTraceabilityLink.create({
          consolidationLineId: lineItem._id,
          sourceType: 'Sales_Order',
          sourceRecordId: sl._id.toString(),
          contributedQty: sl.items.quantity,
          isConsumed: false
        });
      }
    }

    runHeader.status = 'Completed';
    await runHeader.save();

    res.status(201).json({ success: true, message: `Consolidation generated for ${period}`, data: runHeader });
  } catch (error) {
    if (runHeader) {
      await ConsolidationRunHeader.findByIdAndUpdate(runHeader._id, { status: 'Failed' }).catch(() => {});
    }
    handleError(res, error);
  }
};

exports.updateConsolidationLine = async (req, res) => {
  try {
    const line = await ConsolidationLineItem.findById(req.params.lineId).populate('runId');
    if (!line) return res.status(404).json({ success: false, message: 'Line not found' });
    
    // Rule 5: MRP Lock Constraint
    if (line.runId && line.runId.status === 'Consumed_By_MRP') {
      return res.status(400).json({ success: false, message: 'Run has been consumed by MRP. No adjustments allowed.' });
    }

    if (req.body.manualAdjustmentQty !== undefined) {
      line.manualAdjustmentQty = req.body.manualAdjustmentQty;
      // Rule 1 re-applied here for the same reason as generateConsolidation — the model's
      // pre('save') hook is callback-style and throws under mongoose 9, so avoid save().
      line.totalGrossDemand = (line.forecastDemandQty || 0) + (line.salesOrderQty || 0) + (line.safetyStockQty || 0);
      line.finalNetDemand = line.totalGrossDemand + (line.manualAdjustmentQty || 0);
      await ConsolidationLineItem.updateOne({ _id: line._id }, {
        manualAdjustmentQty: line.manualAdjustmentQty,
        totalGrossDemand: line.totalGrossDemand,
        finalNetDemand: line.finalNetDemand
      });
      await logAudit('UPDATE', 'ConsolidationLineItem', line._id, req.user._id, { message: `Updated manual adjustment to ${line.manualAdjustmentQty}` });
    }

    res.json({ success: true, data: line });
  } catch (error) { handleError(res, error); }
};

exports.updateConsolidationRunStatus = async (req, res) => {
  try {
    const run = await ConsolidationRunHeader.findById(req.params.runId);
    if (!run) return res.status(404).json({ success: false, message: 'Run not found' });
    
    if (req.body.status) {
      run.status = req.body.status;
      await run.save();
      await logAudit('UPDATE', 'ConsolidationRunHeader', run._id, req.user._id, { message: `Updated status to ${run.status}` });
    }
    res.json({ success: true, data: run });
  } catch (error) { handleError(res, error); }
};
