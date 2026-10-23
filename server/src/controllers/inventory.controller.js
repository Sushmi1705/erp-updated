const mongoose = require('mongoose');
const { handleError } = require('../utils/errorHandler');
const { internalId } = require('../utils/internalId');
const { InventoryTransaction, InvTxnHeader, InvTxnLine, InvTxnBatch, InvLedger } = require('../models/InventoryTransaction');
const InventoryStock = require('../models/InventoryStock');
const { AuditLog } = require('../models/Audit');
const { Material: MasterMaterial } = require('../models/MasterMaterial');
const { Product: MasterProduct } = require('../models/MasterProduct');
const { InventoryControl } = require('../models/InventoryControl');
const { InventoryOptimization, OptParameter, MatOptProfile, OptRunHistory, DeadStockLog } = require('../models/InventoryOptimization');
const { InventoryValuation, ValuationSummary, MatValProfile, FIFOCostLayer, ValRunHistory } = require('../models/InventoryValuation');
const { InventoryTraceability, TrackingEntity, EntityGenealogy } = require('../models/InventoryTraceability');

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

// ================= Inventory Control (Control Tower) =================
const { InventorySummary, GranularBinInventory, WIPTracking } = require('../models/InventoryControl');

/* Every batch still holding stock, for anyone allowed to look at inventory.
 * getInventoryControl below rolls stock up per material; an order line needs
 * the individual batches to allocate from, which until now was only served
 * from the goods-receipt module — behind a permission a sales executive
 * should never hold. */
exports.getStockBatches = async (req, res) => {
  try {
    const batches = await InventoryStock.find({
      status: { $nin: ['Consumed', 'Returned'] },
      quantityAvailable: { $gt: 0 }
    })
      .populate('materialId', 'name code')
      .populate('warehouseId', 'name code')
      .sort({ postingDate: 1 })
      .lean();
    res.json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    handleError(res, error);
  }
};

exports.getInventoryControl = async (req, res) => {
  try {
    const { type } = req.query; // 'RAW_MATERIAL', 'WIP', 'FINISHED_GOOD', 'SPARE_PART'
    
    // Load all active inventory stock batches for rich physical drill-down
    const allStockBatches = await InventoryStock.find({ status: { $nin: ['Consumed', 'Returned'] } })
      .populate('warehouseId', 'name code')
      .populate('binId', 'code name')
      .populate('uomId', 'name code symbol')
      .sort({ postingDate: -1 })
      .lean();

    const batchesByEntity = {};
    for (const b of allStockBatches) {
      const key = b.materialId ? b.materialId.toString() : (b.productId ? b.productId.toString() : null);
      if (!key) continue;
      if (!batchesByEntity[key]) batchesByEntity[key] = [];
      batchesByEntity[key].push({
        _id: b._id,
        batchNumber: b.batchNumber,
        warehouse: b.warehouseId?.name || 'Main Warehouse',
        warehouseCode: b.warehouseId?.code || 'WH-MAIN',
        bin: b.binId?.code || b.binId?.name || b.notes || 'Bay-01',
        quantityAvailable: b.quantityAvailable || 0,
        allocatedQuantity: b.allocatedQuantity || b.reservedQuantity || 0,
        atp: Math.max(0, (b.quantityAvailable || 0) - (b.allocatedQuantity || b.reservedQuantity || 0)),
        status: b.status || 'Active',
        postingDate: b.postingDate,
        expiryDate: b.expiryDate,
        unitCost: b.unitCost || 0,
        supplierBatchNo: b.supplierBatchNo || 'N/A'
      });
    }

    // First query InventorySummary
    const summaries = await InventorySummary.find()
      .populate({
        path: 'Product_ID',
        match: type ? { Material_Type: type } : {},
        populate: { path: 'uomId', select: 'name code symbol' }
      })
      .populate('Warehouse_ID', 'name code');

    const validSummaries = summaries.filter(s => s.Product_ID != null);

    if (validSummaries.length > 0) {
      const formattedData = validSummaries.map(s => {
        const mat = s.Product_ID;
        const atp = s.Total_On_Hand - s.Total_Allocated;
        const safetyLevel = mat.Safety_Stock_Level || mat.minStock || 0;
        const reorderLevel = mat.Reorder_Point || mat.reorderLevel || safetyLevel;
        const isBreached = atp < safetyLevel;
        const unitCost = mat.standardCost || 0;
        const valuation = Math.round((s.Total_On_Hand || 0) * unitCost);
        const uom = mat.uomId?.symbol || mat.uomId?.code || 'KG';
        const matIdStr = mat._id.toString();

        let stockHealth = 'OPTIMAL';
        if (atp <= 0) stockHealth = 'CRITICAL_OUT';
        else if (isBreached) stockHealth = 'SAFETY_BREACH';
        else if (atp < reorderLevel) stockHealth = 'REORDER_WARNING';

        const shortageQuantity = Math.max(0, safetyLevel - atp);
        const atpRatio = safetyLevel > 0 ? Math.min(100, Math.round((atp / (safetyLevel * 2)) * 100)) : 100;

        return {
          _id: s._id,
          materialId: mat._id,
          Product_Name: mat.name,
          Product_Code: mat.code,
          Material_Type: mat.Material_Type || type || 'RAW_MATERIAL',
          Warehouse: s.Warehouse_ID?.name || 'Central Raw Materials Warehouse',
          Warehouse_Code: s.Warehouse_ID?.code || 'WH-RM',
          warehouseId: s.Warehouse_ID?._id,
          Total_On_Hand: s.Total_On_Hand,
          Total_Allocated: s.Total_Allocated,
          Available_to_Promise: atp,
          On_Order_Quantity: s.On_Order_Quantity || 0,
          Safety_Stock_Level: safetyLevel,
          Reorder_Point: reorderLevel,
          minStock: mat.minStock || 0,
          maxStock: mat.maxStock || 0,
          leadTimeDays: mat.leadTimeDays || 7,
          grade: mat.grade || '',
          hsnCode: mat.hsnCode || '',
          uom,
          standardCost: unitCost,
          valuation,
          shortageQuantity,
          stockHealth,
          atpRatio,
          Exception_Flag: isBreached,
          Last_Updated: s.Last_Updated_Timestamp || s.updatedAt,
          batches: batchesByEntity[matIdStr] || []
        };
      });
      return res.json({ success: true, data: formattedData });
    }

    // Fallback: Real-time calculation directly from MasterMaterial, MasterProduct & InventoryStock
    const typeMap = {
      'RAW_MATERIAL': ['RAW_MATERIAL', 'Raw Material', 'RAW'],
      'WIP': ['WIP', 'Work In Progress'],
      'FINISHED_GOOD': ['FINISHED_GOOD', 'Finished Goods', 'FG'],
      'SPARE_PART': ['SPARE_PART', 'Spare Part', 'Consumable', 'SPARE']
    };
    const allowedTypes = typeMap[type] || [type];

    let materials = await MasterMaterial.find({ Material_Type: { $in: allowedTypes } }).populate('uomId', 'name code symbol');
    let products = [];

    if (type === 'FINISHED_GOOD' || type === 'WIP') {
      products = await MasterProduct.find({ status: { $ne: 'Inactive' } }).populate('uomId', 'name code symbol');
    }

    // If specific filter yielded 0 materials & products, load all active materials/products as fallback
    if (materials.length === 0 && products.length === 0) {
      if (type === 'FINISHED_GOOD') {
        products = await MasterProduct.find({ status: { $ne: 'Inactive' } }).populate('uomId', 'name code symbol');
      } else {
        materials = await MasterMaterial.find({ status: { $ne: 'Inactive' } }).populate('uomId', 'name code symbol');
      }
    }

    const stocks = await InventoryStock.find({ status: { $nin: ['Consumed', 'Returned'] } }).populate('warehouseId', 'name code');

    const stockMap = {};
    for (const st of stocks) {
      const idKey = st.materialId ? st.materialId.toString() : (st.productId ? st.productId.toString() : null);
      if (!idKey) continue;
      if (!stockMap[idKey]) {
        stockMap[idKey] = {
          onHand: 0,
          allocated: 0,
          warehouses: new Set(),
          warehouseIds: new Set()
        };
      }
      stockMap[idKey].onHand += (st.quantityAvailable || 0);
      stockMap[idKey].allocated += (st.allocatedQuantity || st.reservedQuantity || 0);
      if (st.warehouseId?.name) stockMap[idKey].warehouses.add(st.warehouseId.name);
      if (st.warehouseId?._id) stockMap[idKey].warehouseIds.add(st.warehouseId._id.toString());
    }

    const materialRows = materials.map(m => {
      const matIdStr = m._id.toString();
      const st = stockMap[matIdStr] || { onHand: 0, allocated: 0, warehouses: new Set(), warehouseIds: new Set() };
      const atp = st.onHand - st.allocated;
      const safetyLevel = m.Safety_Stock_Level || m.minStock || 0;
      const reorderLevel = m.Reorder_Point || m.reorderLevel || safetyLevel;
      const isBreached = atp < safetyLevel;
      const whName = Array.from(st.warehouses).join(', ') || 'Main Warehouse';
      const uom = m.uomId?.symbol || m.uomId?.code || 'KG';
      const unitCost = m.standardCost || 0;
      const valuation = Math.round((st.onHand || 0) * unitCost);

      let stockHealth = 'OPTIMAL';
      if (atp <= 0) stockHealth = 'CRITICAL_OUT';
      else if (isBreached) stockHealth = 'SAFETY_BREACH';
      else if (atp < reorderLevel) stockHealth = 'REORDER_WARNING';

      const shortageQuantity = Math.max(0, safetyLevel - atp);
      const atpRatio = safetyLevel > 0 ? Math.min(100, Math.round((atp / (safetyLevel * 2)) * 100)) : 100;

      return {
        _id: m._id,
        materialId: m._id,
        Product_Name: m.name,
        Product_Code: m.code,
        Material_Type: m.Material_Type || type || 'RAW_MATERIAL',
        Warehouse: whName,
        warehouseId: Array.from(st.warehouseIds)[0] || null,
        Total_On_Hand: st.onHand,
        Total_Allocated: st.allocated,
        Available_to_Promise: atp,
        On_Order_Quantity: 0,
        Safety_Stock_Level: safetyLevel,
        Reorder_Point: reorderLevel,
        minStock: m.minStock || 0,
        maxStock: m.maxStock || 0,
        leadTimeDays: m.leadTimeDays || 7,
        grade: m.grade || '',
        hsnCode: m.hsnCode || '',
        uom,
        standardCost: unitCost,
        valuation,
        shortageQuantity,
        stockHealth,
        atpRatio,
        Exception_Flag: isBreached,
        Last_Updated: m.updatedAt,
        batches: batchesByEntity[matIdStr] || []
      };
    });

    const productRows = products.map(p => {
      const prodIdStr = p._id.toString();
      const st = stockMap[prodIdStr] || { onHand: 0, allocated: 0, warehouses: new Set(), warehouseIds: new Set() };
      const atp = st.onHand - st.allocated;
      const safetyLevel = 10;
      const reorderLevel = 25;
      const isBreached = atp < safetyLevel;
      const whName = Array.from(st.warehouses).join(', ') || 'Finished Goods Store';
      const uom = p.uomId?.symbol || p.uomId?.code || 'NOS';
      const unitCost = p.standardCost || p.sellingPrice || 0;
      const valuation = Math.round((st.onHand || 0) * unitCost);

      let stockHealth = 'OPTIMAL';
      if (atp <= 0) stockHealth = 'CRITICAL_OUT';
      else if (isBreached) stockHealth = 'SAFETY_BREACH';
      else if (atp < reorderLevel) stockHealth = 'REORDER_WARNING';

      const shortageQuantity = Math.max(0, safetyLevel - atp);
      const atpRatio = safetyLevel > 0 ? Math.min(100, Math.round((atp / (safetyLevel * 2)) * 100)) : 100;

      return {
        _id: p._id,
        materialId: p._id,
        Product_Name: p.name,
        Product_Code: p.code,
        Material_Type: type || 'FINISHED_GOOD',
        Warehouse: whName,
        warehouseId: Array.from(st.warehouseIds)[0] || null,
        Total_On_Hand: st.onHand,
        Total_Allocated: st.allocated,
        Available_to_Promise: atp,
        On_Order_Quantity: 0,
        Safety_Stock_Level: safetyLevel,
        Reorder_Point: reorderLevel,
        minStock: 5,
        maxStock: 500,
        leadTimeDays: 5,
        grade: 'Auto Assembly',
        hsnCode: p.hsnCode || '8708',
        uom,
        standardCost: unitCost,
        valuation,
        shortageQuantity,
        stockHealth,
        atpRatio,
        Exception_Flag: isBreached,
        Last_Updated: p.updatedAt,
        batches: batchesByEntity[prodIdStr] || []
      };
    });

    const formattedData = [...productRows, ...materialRows];

    res.json({ success: true, data: formattedData });
  } catch (error) { handleError(res, error); }
};

// ================= Inventory Transactions =================

exports.getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const transactions = await InventoryTransaction.find()
      .populate('materialId', 'name code')
      .populate('sourceWarehouseId', 'name')
      .populate('destinationWarehouseId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await InventoryTransaction.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: transactions });
  } catch (error) { handleError(res, error); }
};

exports.createTransaction = async (req, res) => {
  try {
    const { transactionType, materialId, quantity, sourceWarehouseId, destinationWarehouseId, referenceDocument, notes } = req.body;
    
    // Transaction logic based on type
    const batchNumber = internalId('BATCH-TX');
    
    // Create ledger entry
    const transaction = await InventoryTransaction.create({
      transactionNumber: internalId('TXN'),
      transactionType,
      materialId,
      batchNumber,
      sourceWarehouseId,
      destinationWarehouseId,
      quantity,
      referenceDocument,
      notes
    });

    // Update actual InventoryStock dynamically
    if (transactionType === 'Material Issue' || transactionType === 'Stock Transfer') {
      // Deduct from source
      if (sourceWarehouseId) {
        await deductStockAtomic(materialId, sourceWarehouseId, quantity, null);
      }
    }
    
    if (transactionType === 'Goods Receipt' || transactionType === 'Stock Return' || transactionType === 'Stock Transfer') {
      // Add to destination
      if (destinationWarehouseId) {
        await addStockAtomic(materialId, destinationWarehouseId, quantity, batchNumber, null, null);
      }
    }

    if (transactionType === 'Stock Adjustment') {
      // Adjust in source warehouse (quantity can be negative or positive)
      const numQty = Number(quantity);
      if (numQty > 0) {
        await addStockAtomic(materialId, sourceWarehouseId, numQty, batchNumber, null, null);
      } else if (numQty < 0) {
        await deductStockAtomic(materialId, sourceWarehouseId, Math.abs(numQty), null);
      }

      // Also update InventorySummary if one exists for this material and warehouse
      if (sourceWarehouseId) {
        const summary = await InventorySummary.findOne({ Product_ID: materialId, Warehouse_ID: sourceWarehouseId });
        if (summary) {
          summary.Total_On_Hand = Math.max(0, summary.Total_On_Hand + numQty);
          summary.Available_to_Promise = summary.Total_On_Hand - (summary.Total_Allocated || 0);
          summary.Last_Updated_Timestamp = new Date();
          await summary.save();
        }
      }
    }

    await logAudit('CREATE', 'InventoryTransaction', transaction._id, req.user?._id);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) { handleError(res, error); }
};

// ================= Inventory Transactions (V2 Architecture) =================

exports.getAllV2Transactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type && req.query.type !== 'ALL') {
      filter.Txn_Type = req.query.type;
    }
    if (req.query.status && req.query.status !== 'ALL') {
      filter.Status = req.query.status;
    }
    if (req.query.search) {
      filter.$or = [
        { Txn_Number: { $regex: req.query.search, $options: 'i' } },
        { Ref_Doc_Number: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const headers = await InvTxnHeader.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const headerIds = headers.map(h => h._id);
    const lines = await InvTxnLine.find({ Txn_ID: { $in: headerIds } })
      .populate({
        path: 'Material_ID',
        select: 'name code standardCost grade uomId',
        populate: { path: 'uomId', select: 'name code symbol' }
      })
      .populate('Source_WH_ID', 'name code')
      .populate('Dest_WH_ID', 'name code')
      .lean();

    const lineIds = lines.map(l => l._id);
    const batches = await InvTxnBatch.find({ Txn_Line_ID: { $in: lineIds } }).lean();
    const batchMap = {};
    for (const b of batches) {
      const lineKey = b.Txn_Line_ID.toString();
      if (!batchMap[lineKey]) batchMap[lineKey] = [];
      batchMap[lineKey].push(b);
    }
      
    const data = headers.map(h => {
      const obj = h.toObject();
      const matchedLines = lines.filter(l => l.Txn_ID.toString() === h._id.toString()).map(l => {
        const uom = l.Material_ID?.uomId?.symbol || l.Material_ID?.uomId?.code || 'KG';
        const cost = l.Unit_Cost || l.Material_ID?.standardCost || 0;
        const lineVal = Math.round((l.Quantity || 0) * cost);
        return {
          ...l,
          uom,
          valuation: lineVal,
          batches: batchMap[l._id.toString()] || []
        };
      });

      const totalValuation = matchedLines.reduce((sum, l) => sum + (l.valuation || 0), 0);
      const totalQuantity = matchedLines.reduce((sum, l) => sum + (l.Quantity || 0), 0);

      obj.lines = matchedLines;
      obj.totalValuation = totalValuation;
      obj.totalQuantity = totalQuantity;
      return obj;
    });

    const total = await InvTxnHeader.countDocuments(filter);
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data });
  } catch (error) { handleError(res, error); }
};

exports.createV2Transaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { Txn_Type, Ref_Doc_Number, Ref_Doc_Type, lines } = req.body;
    
    if (!lines || lines.length === 0) return res.status(400).json({ success: false, message: 'Transaction must have at least one line.' });

    // Validation Rules
    for (const line of lines) {
      if (Txn_Type === 'Transfer') {
        if (!line.Source_WH_ID || !line.Dest_WH_ID) return res.status(400).json({ success: false, message: 'Source and Destination warehouses are required for transfers.' });
        if (line.Source_WH_ID === line.Dest_WH_ID) return res.status(400).json({ success: false, message: 'Source and Destination warehouses cannot be the same.' });
      }
      
      if (Txn_Type === 'Material Issue' && line.Dest_WH_ID) {
         return res.status(400).json({ success: false, message: 'Material Issue cannot have a Destination Warehouse.' });
      }

      if (Txn_Type === 'Material Issue' || Txn_Type === 'Transfer') {
        // Sufficient Stock Check
        const stocks = await InventoryStock.find({ 
          materialId: line.Material_ID, 
          status: { $nin: ['Consumed', 'Returned'] },
          ...(line.Source_WH_ID ? { warehouseId: line.Source_WH_ID } : {})
        });
        let totalAvailable = stocks.reduce((sum, s) => sum + (s.quantityAvailable || 0), 0);
        
        if (totalAvailable < line.Quantity) {
          const globalStocks = await InventoryStock.find({ materialId: line.Material_ID, status: { $nin: ['Consumed', 'Returned'] } });
          const globalAvailable = globalStocks.reduce((sum, s) => sum + (s.quantityAvailable || 0), 0);
          
          if (globalAvailable < line.Quantity) {
            // Reject rather than provision stock: an outbound line may never create inventory.
            // Nothing has been written yet at this point, so the transaction posts nothing.
            return res.status(400).json({ success: false, message: `Insufficient stock for this transaction. Available: ${globalAvailable}, Requested: ${line.Quantity}.` });
          }
        }
      }
    }

    const Txn_Number = internalId('TXN');
    
    // Create Header (Rule 3: Immutable Executed Status)
    const header = await InvTxnHeader.create([{
      Txn_Number, Txn_Type, Ref_Doc_Number, Ref_Doc_Type, Status: 'Executed', Total_Lines: lines.length
    }], { session });

    for (let i = 0; i < lines.length; i++) {
      const lineData = lines[i];
      const [line] = await InvTxnLine.create([{
        Txn_ID: header[0]._id,
        Line_Sequence: (i + 1) * 10,
        Material_ID: lineData.Material_ID,
        Quantity: lineData.Quantity,
        Source_WH_ID: lineData.Source_WH_ID,
        Dest_WH_ID: lineData.Dest_WH_ID,
        Unit_Cost: lineData.Unit_Cost || 0
      }], { session });

      // Simple Batch Tracking (Rule 4)
      const batchNumber = internalId('BATCH');
      await InvTxnBatch.create([{
        Txn_Line_ID: line._id,
        Batch_Lot_Number: batchNumber,
        Quantity: line.Quantity
      }], { session });

      // Update Legacy InventoryStock so system remains synced
      if (Txn_Type === 'Material Issue' || Txn_Type === 'Transfer') {
         await deductStockAtomic(line.Material_ID, line.Source_WH_ID, line.Quantity, session);
         await InvLedger.create([{ Txn_Line_ID: line._id, Material_ID: line.Material_ID, Warehouse_ID: line.Source_WH_ID, Movement_Type: 'OUT', Qty_Change: -line.Quantity }], { session });
      }
      if (Txn_Type === 'Return' || Txn_Type === 'Transfer') {
         const targetWh = Txn_Type === 'Transfer' ? line.Dest_WH_ID : line.Source_WH_ID;
         if (targetWh) {
           await addStockAtomic(line.Material_ID, targetWh, line.Quantity, batchNumber, null, session);
           await InvLedger.create([{ Txn_Line_ID: line._id, Material_ID: line.Material_ID, Warehouse_ID: targetWh, Movement_Type: 'IN', Qty_Change: line.Quantity }], { session });
         }
      }
      if (Txn_Type === 'Adjustment') {
         const targetWh = line.Source_WH_ID;
         if (targetWh) {
           if (line.Quantity > 0) {
             await addStockAtomic(line.Material_ID, targetWh, line.Quantity, batchNumber, null, session);
             await InvLedger.create([{ Txn_Line_ID: line._id, Material_ID: line.Material_ID, Warehouse_ID: targetWh, Movement_Type: 'IN', Qty_Change: line.Quantity }], { session });
           } else if (line.Quantity < 0) {
             await deductStockAtomic(line.Material_ID, targetWh, Math.abs(line.Quantity), session);
             // Ledger tracks raw negative for negative adjustments if desired, but Movement_Type='OUT' usually uses negative quantity change or just positive Qty_Change for OUT. Let's match original. Original didn't specify properly. Let's just use original style.
             await InvLedger.create([{ Txn_Line_ID: line._id, Material_ID: line.Material_ID, Warehouse_ID: targetWh, Movement_Type: 'OUT', Qty_Change: line.Quantity }], { session });
           }
         }
      }
    }

    await logAudit('CREATE', 'InvTxnHeader', header[0]._id, req.user._id);
    await session.commitTransaction();
    res.status(201).json({ success: true, data: header[0] });
  } catch (error) { 
    await session.abortTransaction();
    handleError(res, error); 
  } finally {
    session.endSession();
  }
};

const deductStockAtomic = async (materialId, warehouseId, quantityToDeduct, session) => {
  if (quantityToDeduct <= 0) throw new Error('Deduction quantity must be positive');
  
  const opts = session ? { session } : {};
  
  const filter = { materialId, status: { $nin: ['Consumed', 'Returned'] }, quantityAvailable: { $gt: 0 } };
  if (warehouseId) filter.warehouseId = warehouseId;

  let stocks = await InventoryStock.find(filter, null, opts).sort({ postingDate: 1, createdAt: 1 });
  let totalAvailable = stocks.reduce((sum, s) => sum + s.quantityAvailable, 0);

  if (totalAvailable < quantityToDeduct) {
    stocks = await InventoryStock.find({ materialId, status: { $nin: ['Consumed', 'Returned'] }, quantityAvailable: { $gt: 0 } }, null, opts).sort({ postingDate: 1, createdAt: 1 });
    totalAvailable = stocks.reduce((sum, s) => sum + s.quantityAvailable, 0);
  }

  if (totalAvailable < quantityToDeduct) {
    // A deduction can never invent the stock it is short of - fail so the caller's
    // transaction aborts and on-hand is left untouched.
    throw new Error(`Insufficient stock: ${totalAvailable} available, ${quantityToDeduct} requested.`);
  }
  
  let remaining = quantityToDeduct;
  const deductions = [];
  
  for (const stock of stocks) {
    if (remaining <= 0) break;
    const deductFrom = Math.min(stock.quantityAvailable, remaining);
    remaining -= deductFrom;
    
    // Atomic decrement
    const updated = await InventoryStock.findOneAndUpdate(
      { 
        _id: stock._id, 
        quantityAvailable: { $gte: deductFrom }
      },
      { 
        $inc: { quantityAvailable: -deductFrom },
        $set: { 
          status: stock.quantityAvailable - deductFrom <= 0 ? 'Consumed' : 'Active' 
        }
      },
      { new: true, ...opts }
    );
    
    if (!updated) {
      throw new Error(`Concurrent stock deduction conflict on batch ${stock.batchNumber}. Please retry.`);
    }
    deductions.push({ batchNumber: stock.batchNumber, quantity: deductFrom, stockId: stock._id });
  }
  
  return deductions;
};

const addStockAtomic = async (materialId, warehouseId, quantity, batchNumber, sourceGrnId, session) => {
  if (typeof quantity !== 'number' || isNaN(quantity)) throw new Error('Quantity must be a number');
  if (quantity < 0) throw new Error(`Cannot add negative stock. Use deductStockAtomic for removals. Received: ${quantity}`);
  if (quantity === 0) return null;
  
  const opts = session ? { session } : {};
  const [stock] = await InventoryStock.create([{
    materialId,
    warehouseId,
    batchNumber,
    quantityAvailable: quantity,
    postingDate: new Date(),
    sourceGrnId,
    status: 'Active'
  }], opts);
  
  return stock;
};

// ================= Inventory Optimization =================

exports.getOptimization = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const opts = await InventoryOptimization.find().populate('materialId', 'name code category')
      .skip(skip).limit(limit);
      
    const total = await InventoryOptimization.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: opts });
  } catch (error) { handleError(res, error); }
};

exports.updateOptimization = async (req, res) => {
  try {
    const { materialId } = req.body;
    let opt = await InventoryOptimization.findOne({ materialId });
    if (opt) {
      Object.assign(opt, req.body);
      await opt.save();
    } else {
      opt = await InventoryOptimization.create(req.body);
    }
    await logAudit('UPDATE', 'InventoryOptimization', opt._id, req.user._id);
    res.json({ success: true, data: opt });
  } catch (error) { handleError(res, error); }
};

exports.runAnalysis = async (req, res) => {
  try {
    const materials = await MasterMaterial.find();
    
    // Calculate real annual consumption value per material from InventoryTransactions
    const transactions = await InventoryTransaction.find({ transactionType: 'Material Issue' });
    
    const consumptionMap = {};
    transactions.forEach(tx => {
      const matId = tx.materialId.toString();
      if (!consumptionMap[matId]) consumptionMap[matId] = 0;
      consumptionMap[matId] += Math.abs(tx.quantity);
    });

    // Calculate total consumption value for ABC ranking
    const matValues = materials.map(mat => ({
      id: mat._id.toString(),
      value: (consumptionMap[mat._id.toString()] || 0) * (mat.standardCost || 0)
    }));

    matValues.sort((a, b) => b.value - a.value);
    const total = matValues.reduce((acc, m) => acc + m.value, 0);

    let cumulative = 0;
    const classMap = {};
    for (const m of matValues) {
      // Cumulative share is measured before this item, so the top consumer classifies as 'A'
      const pct = total > 0 ? (cumulative / total) * 100 : 0;
      cumulative += m.value;
      classMap[m.id] = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
    }

    for (const mat of materials) {
      const matId = mat._id.toString();
      const stocks = await InventoryStock.find({ materialId: mat._id, status: 'Active' });
      const totalQty = stocks.reduce((a, s) => a + s.quantityAvailable, 0);
      // Dead stock: material has stock but no transactions in last 180 days
      const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const recentTx = await InventoryTransaction.findOne({ materialId: mat._id, createdAt: { $gte: cutoff } });
      const isDeadStock = totalQty > 0 && !recentTx;

      await InventoryOptimization.findOneAndUpdate(
        { materialId: mat._id },
        { 
          abcClassification: classMap[matId] || 'C', 
          isDeadStock,
          lastAnalysisDate: new Date()
        },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: 'ABC Analysis Completed using real consumption data' });
  } catch (error) { handleError(res, error); }
};

// ================= Inventory Valuation =================

exports.getValuation = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const vals = await InventoryValuation.find().populate('materialId', 'name code standardCost')
      .skip(skip).limit(limit);
      
    const total = await InventoryValuation.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: vals });
  } catch (error) { handleError(res, error); }
};

exports.calculateValuation = async (req, res) => {
  try {
    const materials = await MasterMaterial.find();
    for (const mat of materials) {
      const stocks = await InventoryStock.find({ materialId: mat._id, status: 'Active' });
      const totalQty = stocks.reduce((acc, curr) => acc + curr.quantityAvailable, 0);
      
      // FIFO valuation: total qty * standard cost (actual cost from PO would require lot-level cost tracking)
      const fifoTotal = totalQty * (mat.standardCost || 0);

      // WAC: fetch all inventory transactions (Goods Receipts) for this material to compute weighted average
      const receiptTxns = await InventoryTransaction.find({ materialId: mat._id, transactionType: 'Goods Receipt' });
      let totalCost = 0;
      let totalReceived = 0;
      receiptTxns.forEach(tx => {
        totalReceived += tx.quantity;
        // Use standard cost as proxy for receipt cost if no unit cost in transaction
        totalCost += tx.quantity * (mat.standardCost || 0);
      });
      const wac = totalReceived > 0 ? (totalCost / totalReceived) : (mat.standardCost || 0);

      await InventoryValuation.findOneAndUpdate(
        { materialId: mat._id },
        { 
          fifoValuation: fifoTotal,
          weightedAverageCost: wac,
          lastCalculatedDate: new Date()
        },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: 'Valuation calculated successfully using real stock data' });
  } catch (error) { handleError(res, error); }
};

// ================= Traceability Management =================

exports.getAllTraceability = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const traces = await InventoryTraceability.find()
      .populate('materialId', 'name code')
      .populate('originTransactionId', 'transactionNumber transactionType')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await InventoryTraceability.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: traces });
  } catch (error) { handleError(res, error); }
};

exports.createTraceability = async (req, res) => {
  try {
    req.body.trackingNumber = internalId('TRK');
    const newTrace = await InventoryTraceability.create(req.body);
    await logAudit('CREATE', 'InventoryTraceability', newTrace._id, req.user._id);
    res.status(201).json({ success: true, data: newTrace });
  } catch (error) { handleError(res, error); }
};

// ================= Inventory Optimization (V2 Architecture) =================

exports.getV2Optimization = async (req, res) => {
  try {
    let params = await OptParameter.findOne();
    if (!params) {
      params = await OptParameter.create({
        ABC_Class_A_Percentage: 70,
        ABC_Class_B_Percentage: 20,
        ABC_Class_C_Percentage: 10,
        Dead_Stock_Threshold_Days: 180,
        Default_Service_Level_Percent: 95
      });
    }

    let profiles = await MatOptProfile.find()
      .populate({
        path: 'Material_ID',
        select: 'name code standardCost grade uomId leadTimeDays minStock maxStock Safety_Stock_Level Reorder_Point categoryId',
        populate: [
          { path: 'uomId', select: 'name code symbol' },
          { path: 'categoryId', select: 'name' }
        ]
      })
      .populate('Category_ID', 'name');

    // If no profiles exist yet, auto-populate from active MasterMaterial
    if (profiles.length === 0) {
      const allMaterials = await MasterMaterial.find({ status: { $ne: 'Inactive' } })
        .populate('uomId', 'name code symbol')
        .populate('categoryId', 'name');
      
      for (const m of allMaterials) {
        const reorder = m.Reorder_Point || m.reorderLevel || 1000;
        const safety = m.Safety_Stock_Level || m.minStock || Math.round(reorder * 0.5);
        const cost = m.standardCost || 0;
        const abc = cost >= 200 ? 'A' : cost >= 60 ? 'B' : 'C';

        await MatOptProfile.findOneAndUpdate(
          { Material_ID: m._id },
          {
            $set: {
              Category_ID: m.categoryId?._id || m.categoryId,
              Reorder_Level: reorder,
              Safety_Stock: safety,
              ABC_Class: abc,
              Dead_Stock_Risk: 'Low Risk',
              Last_Analysis_Date: new Date(),
              Is_Manual_Override: false
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      profiles = await MatOptProfile.find()
        .populate({
          path: 'Material_ID',
          select: 'name code standardCost grade uomId leadTimeDays minStock maxStock Safety_Stock_Level Reorder_Point categoryId',
          populate: [
            { path: 'uomId', select: 'name code symbol' },
            { path: 'categoryId', select: 'name' }
          ]
        })
        .populate('Category_ID', 'name');
    }

    // Attach live on-hand & ATP from InventoryStock or InventorySummary
    const allStocks = await InventoryStock.find({ status: { $nin: ['Consumed', 'Returned'] } });
    const stockMap = {};
    for (const st of allStocks) {
      if (!st.materialId) continue;
      const idKey = st.materialId.toString();
      if (!stockMap[idKey]) stockMap[idKey] = { onHand: 0, allocated: 0 };
      stockMap[idKey].onHand += (st.quantityAvailable || 0);
      stockMap[idKey].allocated += (st.allocatedQuantity || st.reservedQuantity || 0);
    }

    const enrichedProfiles = profiles.map(p => {
      const obj = p.toObject();
      const mat = obj.Material_ID;
      const matIdStr = mat?._id?.toString() || '';
      const st = stockMap[matIdStr] || { onHand: 0, allocated: 0 };
      const onHand = st.onHand;
      const allocated = st.allocated;
      const atp = onHand - allocated;
      const reorderLevel = obj.Reorder_Level || mat?.Reorder_Point || 0;
      const safetyStock = obj.Safety_Stock || mat?.Safety_Stock_Level || 0;
      const standardCost = mat?.standardCost || 0;
      const valuation = Math.round(onHand * standardCost);
      const isReorderTriggered = atp <= reorderLevel;
      const isSafetyBreached = atp < safetyStock;

      let stockHealth = 'OPTIMAL';
      if (atp <= 0) stockHealth = 'CRITICAL_OUT';
      else if (isSafetyBreached) stockHealth = 'SAFETY_BREACH';
      else if (isReorderTriggered) stockHealth = 'REORDER_TRIGGER';

      obj.onHand = onHand;
      obj.allocated = allocated;
      obj.atp = atp;
      obj.standardCost = standardCost;
      obj.valuation = valuation;
      obj.isReorderTriggered = isReorderTriggered;
      obj.isSafetyBreached = isSafetyBreached;
      obj.stockHealth = stockHealth;
      obj.uom = mat?.uomId?.symbol || mat?.uomId?.code || 'KG';
      obj.categoryName = obj.Category_ID?.name || mat?.categoryId?.name || 'Raw Material';
      return obj;
    });

    const runs = await OptRunHistory.find().sort({ Run_Start_Time: -1 }).limit(5);

    res.json({ success: true, data: { parameters: params, profiles: enrichedProfiles, runs } });
  } catch (error) { handleError(res, error); }
};

exports.updateV2Parameters = async (req, res) => {
  try {
    const { ABC_Class_A_Percentage, ABC_Class_B_Percentage, ABC_Class_C_Percentage } = req.body;
    
    // Validation Rule 3: ABC Percentage Integrity
    const total = Number(ABC_Class_A_Percentage) + Number(ABC_Class_B_Percentage) + Number(ABC_Class_C_Percentage);
    if (total !== 100) {
      return res.status(400).json({ success: false, message: 'ABC Percentages must sum to exactly 100.' });
    }

    let params = await OptParameter.findOne();
    if (params) {
      params = await OptParameter.findByIdAndUpdate(params._id, req.body, { new: true });
    } else {
      params = await OptParameter.create(req.body);
    }
    
    await logAudit('UPDATE', 'OptParameter', params._id, req.user._id);
    res.json({ success: true, data: params });
  } catch (error) { handleError(res, error); }
};

exports.updateV2Profile = async (req, res) => {
  try {
    const { Material_ID, Reorder_Level, Safety_Stock } = req.body;
    
    // Validation Rule 1: Reorder Level & Safety Stock Logic
    if (Number(Reorder_Level) < Number(Safety_Stock)) {
      return res.status(400).json({ success: false, message: 'Reorder Level must be greater than or equal to Safety Stock.' });
    }

    let profile = await MatOptProfile.findOne({ Material_ID });
    if (profile) {
      profile = await MatOptProfile.findByIdAndUpdate(profile._id, {
        Reorder_Level, Safety_Stock, Is_Manual_Override: true // Rule 2: Manual Override Protection
      }, { new: true });
    } else {
      profile = await MatOptProfile.create({
        Material_ID, Reorder_Level, Safety_Stock, Is_Manual_Override: true
      });
    }

    // Also keep MasterMaterial in sync
    await MasterMaterial.findByIdAndUpdate(Material_ID, {
      Reorder_Point: Reorder_Level,
      Safety_Stock_Level: Safety_Stock,
      reorderLevel: Reorder_Level,
      minStock: Safety_Stock
    });

    await logAudit('UPDATE', 'MatOptProfile', profile._id, req.user._id);
    res.json({ success: true, data: profile });
  } catch (error) { handleError(res, error); }
};

exports.runV2Analysis = async (req, res) => {
  let run = null;
  try {
    run = await OptRunHistory.create({ Run_Type: 'Full Global Analysis', Triggered_By: req.user._id });
    const params = await OptParameter.findOne() || { ABC_Class_A_Percentage: 70, ABC_Class_B_Percentage: 20, ABC_Class_C_Percentage: 10, Dead_Stock_Threshold_Days: 180 };
    
    // Rule 2: Skip manual overrides
    const profiles = await MatOptProfile.find({ Is_Manual_Override: false });
    const allMaterials = await MasterMaterial.find({ status: 'Active' });
    
    // Calculate total inventory value for ABC
    let totalInvValue = 0;
    const materialValues = [];
    
    for (const mat of allMaterials) {
      const stocks = await InventoryStock.find({ materialId: mat._id });
      const qty = stocks.reduce((sum, s) => sum + s.quantityAvailable, 0);
      const val = qty * (mat.standardCost || 0);
      totalInvValue += val;
      materialValues.push({ matId: mat._id, val, qty });
    }
    
    // Sort descending for ABC
    materialValues.sort((a, b) => b.val - a.val);
    
    let cumValue = 0;
    let analyzedCount = 0;
    
    for (const item of materialValues) {
      // Pareto cumulative must exclude the item being classified, otherwise the
      // highest-value material is scored on its own share and can never be 'A'.
      const pct = totalInvValue > 0 ? (cumValue / totalInvValue) * 100 : 0;
      cumValue += item.val;

      let abc = 'C';
      if (pct <= params.ABC_Class_A_Percentage) abc = 'A';
      else if (pct <= (params.ABC_Class_A_Percentage + params.ABC_Class_B_Percentage)) abc = 'B';
      
      // Rule 4: Dead Stock Real-Time Sync
      // Fetch latest movement date from ledger/transactions
      const latestLedger = await InvLedger.findOne({ Material_ID: item.matId }).sort({ createdAt: -1 });
      const legacyTxn = await InventoryTransaction.findOne({ materialId: item.matId }).sort({ createdAt: -1 });
      
      let lastMovement = new Date();
      if (latestLedger && legacyTxn) {
        lastMovement = latestLedger.createdAt > legacyTxn.createdAt ? latestLedger.createdAt : legacyTxn.createdAt;
      } else if (latestLedger) {
        lastMovement = latestLedger.createdAt;
      } else if (legacyTxn) {
        lastMovement = legacyTxn.createdAt;
      }
      
      const daysInactive = Math.floor((new Date() - lastMovement) / (1000 * 60 * 60 * 24));
      
      let risk = 'Low Risk';
      if (daysInactive > params.Dead_Stock_Threshold_Days) risk = 'Dead';
      else if (daysInactive > (params.Dead_Stock_Threshold_Days / 2)) risk = 'High Risk';
      
      // Create Dead Stock Log
      await DeadStockLog.findOneAndUpdate(
        { Material_ID: item.matId },
        { Last_Movement_Date: lastMovement, Days_Inactive: daysInactive, Current_Stock_Value: item.val },
        { upsert: true }
      );
      
      const existingProfile = profiles.find(p => p.Material_ID.toString() === item.matId.toString());
      if (existingProfile) {
        await MatOptProfile.findByIdAndUpdate(existingProfile._id, { ABC_Class: abc, Dead_Stock_Risk: risk, Last_Analysis_Date: new Date() });
        // Legacy Sync
        await InventoryOptimization.findOneAndUpdate({ materialId: item.matId }, { abcClassification: abc, isDeadStock: risk === 'Dead' });
        analyzedCount++;
      } else {
        const p = await MatOptProfile.findOne({ Material_ID: item.matId, Is_Manual_Override: true });
        if (!p) {
          // Upserts, not creates: a material can already have a legacy
          // optimisation row without a V2 profile (or the reverse), and the
          // unique index on either turned the whole run into a 400 for
          // everyone — "A record with this materialId already exists".
          await MatOptProfile.findOneAndUpdate(
            { Material_ID: item.matId },
            { $set: { ABC_Class: abc, Dead_Stock_Risk: risk, Last_Analysis_Date: new Date() } },
            { upsert: true, setDefaultsOnInsert: true }
          );
          await InventoryOptimization.findOneAndUpdate(
            { materialId: item.matId },
            { $set: { abcClassification: abc, isDeadStock: risk === 'Dead' } },
            { upsert: true, setDefaultsOnInsert: true }
          );
          analyzedCount++;
        } else {
           // Update risk/ABC even if manual override (override protects safety stock/reorder level only)
           await MatOptProfile.findByIdAndUpdate(p._id, { ABC_Class: abc, Dead_Stock_Risk: risk, Last_Analysis_Date: new Date() });
           await InventoryOptimization.findOneAndUpdate({ materialId: item.matId }, { abcClassification: abc, isDeadStock: risk === 'Dead' });
           analyzedCount++;
        }
      }
    }
    
    await OptRunHistory.findByIdAndUpdate(run._id, { Run_End_Time: new Date(), Status: 'Completed', Total_Materials_Analyzed: analyzedCount });
    res.json({ success: true, message: `Checked ${analyzedCount} material${analyzedCount === 1 ? '' : 's'}.` });
  } catch (error) {
    // Otherwise the run sits in the history as "Running" forever.
    if (run) await OptRunHistory.findByIdAndUpdate(run._id, { Run_End_Time: new Date(), Status: 'Failed' }).catch(() => {});
    handleError(res, error);
  }
};

// ================= Inventory Valuation (V2 Architecture) =================

exports.getV2Valuation = async (req, res) => {
  try {
    let summary = await ValuationSummary.findOne();
    let profiles = await MatValProfile.find()
      .populate({
        path: 'Material_ID',
        select: 'name code standardCost grade uomId categoryId leadTimeDays minStock maxStock',
        populate: [
          { path: 'uomId', select: 'name code symbol' },
          { path: 'categoryId', select: 'name' }
        ]
      });

    // Auto-bootstrap profiles if empty
    if (profiles.length === 0) {
      const allMaterials = await MasterMaterial.find({ status: { $ne: 'Inactive' } })
        .populate('uomId', 'name code symbol')
        .populate('categoryId', 'name');

      const allStocks = await InventoryStock.find({ status: { $nin: ['Consumed', 'Returned'] } });
      const stockMap = {};
      for (const st of allStocks) {
        if (!st.materialId) continue;
        const key = st.materialId.toString();
        stockMap[key] = (stockMap[key] || 0) + (st.quantityAvailable || 0);
      }

      for (const m of allMaterials) {
        const stdCost = m.standardCost || 0;
        const qty = stockMap[m._id.toString()] || 0;
        const initVal = qty * stdCost;

        await MatValProfile.findOneAndUpdate(
          { Material_ID: m._id },
          {
            $set: {
              Standard_Cost_Ref: stdCost,
              Calculated_FIFO_Value: initVal,
              Weighted_Avg_Cost_Per_Unit: stdCost,
              Primary_Valuation_Method: 'FIFO',
              Last_Calculated: new Date()
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Also create baseline FIFO layer if stock exists
        if (qty > 0) {
          const existingLayer = await FIFOCostLayer.findOne({ Material_ID: m._id });
          if (!existingLayer) {
            await FIFOCostLayer.create({
              Material_ID: m._id,
              Receipt_Date: new Date(),
              Original_Quantity: qty,
              Remaining_Quantity: qty,
              Unit_Cost: stdCost
            });
          }
        }
      }

      profiles = await MatValProfile.find()
        .populate({
          path: 'Material_ID',
          select: 'name code standardCost grade uomId categoryId leadTimeDays minStock maxStock',
          populate: [
            { path: 'uomId', select: 'name code symbol' },
            { path: 'categoryId', select: 'name' }
          ]
        });
    }

    // Attach live stock and compute financial metrics
    const allStocks = await InventoryStock.find({ status: { $nin: ['Consumed', 'Returned'] } });
    const stockMap = {};
    for (const st of allStocks) {
      if (!st.materialId) continue;
      const key = st.materialId.toString();
      if (!stockMap[key]) stockMap[key] = { onHand: 0, allocated: 0 };
      stockMap[key].onHand += (st.quantityAvailable || 0);
      stockMap[key].allocated += (st.allocatedQuantity || st.reservedQuantity || 0);
    }

    let aggFifo = 0;
    let aggWac = 0;
    let aggStd = 0;
    let aggActive = 0;
    let fifoCount = 0;
    let wacCount = 0;
    let stdCount = 0;

    const enrichedProfiles = profiles.map(p => {
      const obj = p.toObject();
      const mat = obj.Material_ID;
      const matIdStr = mat?._id?.toString() || '';
      const st = stockMap[matIdStr] || { onHand: 0, allocated: 0 };
      
      const onHand = st.onHand;
      const allocated = st.allocated;
      const available = Math.max(0, onHand - allocated);

      const standardCost = obj.Standard_Cost_Ref || mat?.standardCost || 0;
      const standardValue = Math.round(onHand * standardCost);

      // FIFO calculated value: if 0 but onHand > 0, fallback to onHand * standardCost
      let fifoValue = obj.Calculated_FIFO_Value || 0;
      if (fifoValue === 0 && onHand > 0) {
        fifoValue = Math.round(onHand * standardCost);
      }

      // WAC unit cost
      const wacUnit = obj.Weighted_Avg_Cost_Per_Unit || standardCost;
      const wacValue = Math.round(onHand * wacUnit);

      const method = obj.Primary_Valuation_Method || 'FIFO';
      let activeValuation = fifoValue;
      if (method === 'WAC') {
        activeValuation = wacValue;
        wacCount++;
      } else if (method === 'Standard') {
        activeValuation = standardValue;
        stdCount++;
      } else {
        fifoCount++;
      }

      const costVariance = activeValuation - standardValue;
      const costVariancePct = standardValue > 0 ? ((costVariance / standardValue) * 100) : 0;

      aggFifo += fifoValue;
      aggWac += wacValue;
      aggStd += standardValue;
      aggActive += activeValuation;

      obj.onHand = onHand;
      obj.allocated = allocated;
      obj.available = available;
      obj.standardCost = standardCost;
      obj.standardValue = standardValue;
      obj.fifoValue = fifoValue;
      obj.wacUnit = wacUnit;
      obj.wacValue = wacValue;
      obj.activeValuation = activeValuation;
      obj.costVariance = costVariance;
      obj.costVariancePct = Math.round(costVariancePct * 10) / 10;
      obj.uom = mat?.uomId?.symbol || mat?.uomId?.code || 'KG';
      obj.categoryName = mat?.categoryId?.name || 'Raw Material';
      obj.grade = mat?.grade || 'Standard';

      return obj;
    });

    // Category breakdown aggregation
    const catMap = {};
    for (const ep of enrichedProfiles) {
      const cName = ep.categoryName;
      if (!catMap[cName]) {
        catMap[cName] = {
          categoryName: cName,
          materialCount: 0,
          totalQty: 0,
          fifoValue: 0,
          wacValue: 0,
          standardValue: 0,
          activeValuation: 0
        };
      }
      catMap[cName].materialCount += 1;
      catMap[cName].totalQty += ep.onHand;
      catMap[cName].fifoValue += ep.fifoValue;
      catMap[cName].wacValue += ep.wacValue;
      catMap[cName].standardValue += ep.standardValue;
      catMap[cName].activeValuation += ep.activeValuation;
    }

    const categories = Object.values(catMap).map(c => ({
      ...c,
      sharePct: aggActive > 0 ? Math.round((c.activeValuation / aggActive) * 1000) / 10 : 0
    })).sort((a, b) => b.activeValuation - a.activeValuation);

    // Update summary in database to stay accurate
    const enrichedSummary = {
      Total_FIFO_Valuation: aggFifo,
      Total_WAC_Valuation: aggWac,
      Total_Standard_Valuation: aggStd,
      Total_Active_Valuation: aggActive,
      Net_Valuation_Variance: aggActive - aggStd,
      Total_Materials_Count: enrichedProfiles.length,
      Total_FIFO_Tracked_Items: fifoCount,
      Total_WAC_Tracked_Items: wacCount,
      Total_Standard_Tracked_Items: stdCount,
      Last_Global_Calculation: summary?.Last_Global_Calculation || new Date()
    };

    if (summary) {
      await ValuationSummary.findByIdAndUpdate(summary._id, enrichedSummary);
    } else {
      await ValuationSummary.create(enrichedSummary);
    }

    const runs = await ValRunHistory.find()
      .populate('Triggered_By', 'name email role')
      .sort({ Run_Start_Time: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: enrichedSummary,
        profiles: enrichedProfiles,
        categories,
        runs
      }
    });
  } catch (error) { handleError(res, error); }
};

exports.calculateV2Valuation = async (req, res) => {
  let run = null;
  try {
    run = await ValRunHistory.create({
      Triggered_By: req.user._id,
      Run_Type: 'System-Wide',
      Run_Start_Time: new Date(),
      Status: 'In Progress'
    });
    
    const allMaterials = await MasterMaterial.find({ status: { $ne: 'Inactive' } });
    let totalFifo = 0;
    let wacItems = 0;

    for (const mat of allMaterials) {
      const stocks = await InventoryStock.find({ materialId: mat._id, status: { $nin: ['Consumed', 'Returned'] } });
      const currentQty = stocks.reduce((sum, s) => sum + (s.quantityAvailable || 0), 0);

      let profile = await MatValProfile.findOne({ Material_ID: mat._id });
      if (!profile) {
        profile = await MatValProfile.create({ Material_ID: mat._id, Standard_Cost_Ref: mat.standardCost || 0 });
      }

      if (currentQty <= 0) {
        await MatValProfile.findByIdAndUpdate(profile._id, { Calculated_FIFO_Value: 0, Last_Calculated: new Date() });
        continue;
      }

      const legacyInTxns = await InventoryTransaction.find({ materialId: mat._id, transactionType: { $in: ['Goods Receipt', 'Stock Return'] } }).sort({ transactionDate: -1 });
      const v2InTxns = await InvLedger.find({ Material_ID: mat._id, Movement_Type: 'IN' }).sort({ createdAt: -1 });

      let remainingToAssign = currentQty;
      let calculatedFifo = 0;
      
      await FIFOCostLayer.deleteMany({ Material_ID: mat._id });

      const allIn = [...legacyInTxns.map(t => ({ id: t._id, date: t.transactionDate || t.createdAt, qty: t.quantity, cost: t.unitCost || mat.standardCost || 0 })), 
                     ...v2InTxns.map(t => ({ id: t._id, date: t.createdAt, qty: t.Qty_Change, cost: mat.standardCost || 0 }))]
                    .sort((a, b) => b.date - a.date);

      for (const rx of allIn) {
        if (remainingToAssign <= 0) break;
        const qtyForLayer = Math.min(rx.qty, remainingToAssign);
        
        await FIFOCostLayer.create({
          Material_ID: mat._id, Receipt_Transaction_ID: rx.id, Receipt_Date: rx.date,
          Original_Quantity: rx.qty, Remaining_Quantity: qtyForLayer, Unit_Cost: rx.cost
        });

        calculatedFifo += (qtyForLayer * rx.cost);
        remainingToAssign -= qtyForLayer;
      }
      
      if (remainingToAssign > 0) {
        calculatedFifo += (remainingToAssign * (mat.standardCost || 0));
        await FIFOCostLayer.create({
          Material_ID: mat._id, Receipt_Date: new Date(),
          Original_Quantity: remainingToAssign, Remaining_Quantity: remainingToAssign, Unit_Cost: (mat.standardCost || 0)
        });
      }

      let totalValueIn = 0;
      let totalQtyIn = 0;
      for (const rx of allIn) {
        totalValueIn += (rx.qty * rx.cost);
        totalQtyIn += rx.qty;
      }
      const newWAC = totalQtyIn > 0 ? (totalValueIn / totalQtyIn) : (profile.Weighted_Avg_Cost_Per_Unit || mat.standardCost || 0);

      await MatValProfile.findByIdAndUpdate(profile._id, { 
        Calculated_FIFO_Value: calculatedFifo, 
        Weighted_Avg_Cost_Per_Unit: newWAC,
        Last_Calculated: new Date()
      });

      await InventoryValuation.findOneAndUpdate(
        { materialId: mat._id },
        { fifoValuation: calculatedFifo, weightedAverageCost: newWAC, lastCalculatedDate: new Date() },
        { upsert: true }
      );

      totalFifo += calculatedFifo;
      if (profile.Primary_Valuation_Method === 'WAC' || newWAC > 0) wacItems++;
    }

    let summary = await ValuationSummary.findOne();
    if (summary) {
      await ValuationSummary.findByIdAndUpdate(summary._id, { Total_FIFO_Valuation: totalFifo, Total_WAC_Tracked_Items: wacItems, Last_Global_Calculation: new Date() });
    } else {
      await ValuationSummary.create({ Total_FIFO_Valuation: totalFifo, Total_WAC_Tracked_Items: wacItems });
    }

    await ValRunHistory.findByIdAndUpdate(run._id, { Run_End_Time: new Date(), Status: 'Success' });
    res.json({ success: true, message: `Stock valuation calculated successfully across ${allMaterials.length} materials.` });
  } catch (error) { 
    if (run) await ValRunHistory.findByIdAndUpdate(run._id, { Run_End_Time: new Date(), Status: 'Failed' }).catch(() => {});
    handleError(res, error); 
  }
};

exports.getV2ValuationLayers = async (req, res) => {
  try {
    const { materialId } = req.params;
    let layers = await FIFOCostLayer.find({ Material_ID: materialId }).sort({ Receipt_Date: 1 });

    // If no layers yet, check if stock exists and synthesize initial layer
    if (layers.length === 0) {
      const mat = await MasterMaterial.findById(materialId);
      const stocks = await InventoryStock.find({ materialId, status: { $nin: ['Consumed', 'Returned'] } });
      const totalQty = stocks.reduce((sum, s) => sum + (s.quantityAvailable || 0), 0);
      if (mat && totalQty > 0) {
        const synthesized = await FIFOCostLayer.create({
          Material_ID: materialId,
          Receipt_Date: mat.createdAt || new Date(),
          Original_Quantity: totalQty,
          Remaining_Quantity: totalQty,
          Unit_Cost: mat.standardCost || 0
        });
        layers = [synthesized];
      }
    }

    res.json({ success: true, data: layers });
  } catch (error) { handleError(res, error); }
};

exports.updateV2ValuationMethod = async (req, res) => {
  try {
    const { Material_ID, Primary_Valuation_Method, Standard_Cost_Ref } = req.body;
    if (!['FIFO', 'WAC', 'Standard'].includes(Primary_Valuation_Method)) {
      return res.status(400).json({ success: false, message: 'Invalid valuation method. Must be FIFO, WAC, or Standard.' });
    }

    const updateFields = { Primary_Valuation_Method };
    if (Standard_Cost_Ref !== undefined && Standard_Cost_Ref !== null) {
      updateFields.Standard_Cost_Ref = Number(Standard_Cost_Ref);
      await MasterMaterial.findByIdAndUpdate(Material_ID, { standardCost: Number(Standard_Cost_Ref) });
    }

    const profile = await MatValProfile.findOneAndUpdate(
      { Material_ID },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    await logAudit('UPDATE', 'MatValProfile', profile._id, req.user._id);
    res.json({ success: true, data: profile });
  } catch (error) { handleError(res, error); }
};

// ================= Traceability Management (V2 Architecture) =================

// ================= Traceability Management (V2 Architecture) =================

exports.getV2Traceability = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, type, status, materialId } = req.query;
    const skip = (page - 1) * limit;

    // Rule 3: Expiry Hard-Stop. Dynamically update any expired entities before returning
    const currentDate = new Date();
    await TrackingEntity.updateMany(
      { Expiry_Date: { $lt: currentDate }, Current_Status: { $ne: 'Expired' } },
      { $set: { Current_Status: 'Expired' } }
    );

    const query = {};
    if (type && type !== 'ALL') query.Tracking_Type = type;
    if (status && status !== 'ALL') query.Current_Status = status;
    if (materialId) query.Material_ID = materialId;
    if (search) {
      query.$or = [
        { Tracking_Number: { $regex: search, $options: 'i' } },
        { Reference_Code: { $regex: search, $options: 'i' } }
      ];
    }

    const entities = await TrackingEntity.find(query)
      .populate({
        path: 'Material_ID',
        select: 'name code standardCost grade uomId categoryId leadTimeDays',
        populate: [
          { path: 'uomId', select: 'name code symbol' },
          { path: 'categoryId', select: 'name' }
        ]
      })
      .populate('Current_WH_ID', 'name code location')
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit));

    const total = await TrackingEntity.countDocuments(query);

    // Compute live telemetry summary across all entities
    const allEntities = await TrackingEntity.find();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    let totalActive = 0;
    let totalQuarantined = 0;
    let totalExpired = 0;
    let totalExpiringSoon = 0;
    let totalQty = 0;
    let batchesCount = 0;
    let lotsCount = 0;
    let serialsCount = 0;

    for (const ent of allEntities) {
      if (ent.Current_Status === 'Active') totalActive++;
      if (ent.Current_Status === 'Quarantined') totalQuarantined++;
      if (ent.Current_Status === 'Expired') totalExpired++;
      
      if (ent.Expiry_Date) {
        const exp = new Date(ent.Expiry_Date);
        if (exp >= currentDate && exp <= thirtyDaysAhead) {
          totalExpiringSoon++;
        }
      }

      totalQty += (ent.Current_Quantity || 0);

      if (ent.Tracking_Type === 'Batch') batchesCount++;
      else if (ent.Tracking_Type === 'Lot') lotsCount++;
      else if (ent.Tracking_Type === 'Serial Number') serialsCount++;
    }

    const summary = {
      totalEntities: allEntities.length,
      activeEntities: totalActive,
      quarantinedEntities: totalQuarantined,
      expiredEntities: totalExpired,
      expiringSoonEntities: totalExpiringSoon,
      totalTrackedQty: totalQty,
      batchesCount,
      lotsCount,
      serialsCount
    };

    res.json({
      success: true,
      summary,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
      data: entities
    });
  } catch (error) { handleError(res, error); }
};

exports.getV2Genealogy = async (req, res) => {
  try {
    const logs = await EntityGenealogy.find()
      .populate({
        path: 'Entity_ID',
        select: 'Tracking_Number Tracking_Type Reference_Code Current_Status Current_Quantity',
        populate: { path: 'Material_ID', select: 'name code grade' }
      })
      .populate('Source_WH_ID', 'name code')
      .populate('Dest_WH_ID', 'name code')
      .sort({ Transaction_Date: -1 })
      .limit(150);
      
    res.json({ success: true, data: logs });
  } catch (error) { handleError(res, error); }
};

exports.registerV2Entity = async (req, res) => {
  try {
    const { Tracking_Number, Tracking_Type, Material_ID, Origin_Txn_ID } = req.body;

    // Rule 1: Uniqueness Constraint
    if (Tracking_Type === 'Serial Number') {
      const existingSerial = await TrackingEntity.findOne({ Tracking_Number });
      if (existingSerial) {
        return res.status(400).json({ success: false, message: 'Serial Number must be globally unique.' });
      }
    } else {
      const existingBatch = await TrackingEntity.findOne({ Tracking_Number, Material_ID });
      if (existingBatch) {
        return res.status(400).json({ success: false, message: 'Batch/Lot number must be unique for this material.' });
      }
    }

    // Rule 2: Binary Quantity for Serials & Rule 5: Manual Registration Validation
    let currentQty = Number(req.body.Current_Quantity) || 0;
    if (Tracking_Type === 'Serial Number') {
      currentQty = 1;
    }

    let status = req.body.Current_Status || 'Active';
    // Rule 4 & 5: Genealogy Origin Integrity & Pending Status
    if (!Origin_Txn_ID && !req.body.Current_Quantity) {
      status = 'Pending';
      currentQty = 0;
    }

    const newEntity = await TrackingEntity.create({
      ...req.body,
      Current_Quantity: currentQty,
      Current_Status: status
    });

    await EntityGenealogy.create({
      Entity_ID: newEntity._id,
      Txn_ID: Origin_Txn_ID || null,
      Action_Type: 'Creation',
      Dest_WH_ID: req.body.Current_WH_ID || null
    });

    await logAudit('CREATE', 'TrackingEntity', newEntity._id, req.user._id);

    // Legacy sync
    await InventoryTraceability.create({
      trackingNumber: Tracking_Number,
      trackingType: Tracking_Type,
      materialId: Material_ID,
      referenceNumber: req.body.Reference_Code || 'N/A',
      manufacturingDate: req.body.Mfg_Date,
      expiryDate: req.body.Expiry_Date
    });

    res.status(201).json({ success: true, data: newEntity });
  } catch (error) { handleError(res, error); }
};

exports.updateV2EntityStatus = async (req, res) => {
  try {
    const { id, status, reason = 'Quality Inspection Review' } = req.body;
    if (!['Active', 'Quarantined', 'Consumed', 'Scrapped', 'Pending', 'Expired'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status specified.' });
    }

    const entity = await TrackingEntity.findByIdAndUpdate(id, { Current_Status: status }, { new: true });
    if (!entity) return res.status(404).json({ success: false, message: 'Tracking Entity not found.' });

    await EntityGenealogy.create({
      Entity_ID: entity._id,
      Action_Type: status === 'Quarantined' ? 'Quality Hold' : 'Adjustment',
      Transaction_Date: new Date()
    });

    await logAudit('UPDATE', 'TrackingEntity', entity._id, req.user._id);
    res.json({ success: true, data: entity, message: `Batch status successfully updated to ${status}.` });
  } catch (error) { handleError(res, error); }
};

exports.getV2TraceabilityTree = async (req, res) => {
  try {
    const { id } = req.params;
    const entity = await TrackingEntity.findById(id)
      .populate({
        path: 'Material_ID',
        select: 'name code standardCost grade uomId categoryId',
        populate: [
          { path: 'uomId', select: 'name code symbol' },
          { path: 'categoryId', select: 'name' }
        ]
      })
      .populate('Current_WH_ID', 'name code location');

    if (!entity) return res.status(404).json({ success: false, message: 'Tracking Entity not found.' });

    const logs = await EntityGenealogy.find({ Entity_ID: entity._id })
      .populate('Source_WH_ID', 'name')
      .populate('Dest_WH_ID', 'name')
      .sort({ Transaction_Date: 1 });

    const trackingNum = entity.Tracking_Number || '';
    const supplierGuess = trackingNum.startsWith('TATA') ? 'Tata Steel BSL / Jamshedpur' :
                          trackingNum.startsWith('JSW') ? 'JSW Steel Coated Products, Tarapur' :
                          trackingNum.startsWith('SAIL') ? 'Steel Authority of India Ltd (SAIL - Bokaro)' :
                          trackingNum.startsWith('JINDAL') ? 'Jindal Stainless Ltd, Hisar' :
                          trackingNum.startsWith('HIND') ? 'Hindalco Industries Ltd' :
                          trackingNum.startsWith('ADOR') ? 'Ador Welding Ltd' : 'Apex Precision Automotive Supplies';

    const tree = {
      entity,
      upstream: {
        supplierName: supplierGuess,
        poNumber: entity.Reference_Code || 'PO-2026-AUTO',
        mtcNumber: `MTC-${trackingNum.replace(/[^a-zA-Z0-9]/g, '')}`,
        heatNumber: trackingNum,
        inwardDate: entity.Mfg_Date,
        gradeSpec: entity.Material_ID?.grade || 'IS 513 CR4 D Cold Rolled',
        storesBin: entity.Current_WH_ID?.name || 'Raw Material Coil Bay 01',
        inspectionStatus: entity.Current_Status === 'Quarantined' ? 'QUALITY HOLD' : 'APPROVED'
      },
      downstream: [
        {
          stage: 'Work Order Stamping Run',
          workOrderNumber: `WO-2026-${String(entity._id).slice(-4)}`,
          operation: 'Progressive Die Press Line 04 (400T Blanking)',
          outputBatch: `PAC/STAMP/${trackingNum.slice(-5)}`,
          status: entity.Current_Status === 'Consumed' ? 'Completed' : 'Active Run'
        },
        {
          stage: 'Assembly & Sub-Assembly',
          assemblyOrder: `SUB-2026-${String(entity._id).slice(-4)}`,
          operation: 'MIG Robotic Seam Welding & E-Coat Primer',
          status: 'In Progress'
        },
        {
          stage: 'Customer OEM Dispatch Lot',
          customerName: 'Maruti Suzuki India Ltd (Sanand Plant)',
          dispatchLot: `DSP-LOT-${String(entity._id).slice(-5)}`,
          invoiceNumber: `INV-PAC-2026-${String(entity._id).slice(-4)}`,
          status: 'Shipment Certificate Attached'
        }
      ],
      history: logs
    };

    res.json({ success: true, data: tree });
  } catch (error) { handleError(res, error); }
};

exports.deductStockAtomic = deductStockAtomic;
exports.addStockAtomic = addStockAtomic;
