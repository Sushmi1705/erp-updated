const { handleError } = require('../utils/errorHandler');
const { internalId } = require('../utils/internalId');
const { postStockMovement } = require('../services/stockPosting.service');
const GoodsReceipt = require('../models/GoodsReceipt');
const QualityInspection = require('../models/QualityInspection');
const InventoryStock = require('../models/InventoryStock');
const { InventoryTransaction } = require('../models/InventoryTransaction');
const { PurchaseOrder, POLineItem: POLineForGRN } = require('../models/PurchaseOrder');
const { Material: MasterMaterial } = require('../models/MasterMaterial');
const { AuditLog } = require('../models/Audit');
const mongoose = require('mongoose');
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

// ================= Goods Receipt Note (GRN) =================

exports.getAllGRNs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const grns = await GoodsReceipt.find()
      .populate('purchaseOrderId', 'poNumber date deliveryStatus totalAmount paymentTerms items')
      .populate('vendorId', 'name code gstin contact phone email')
      .populate('materialId', 'name code uom category standardCost')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await GoodsReceipt.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: grns });
  } catch (error) { handleError(res, error); }
};

exports.createGRN = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.body.purchaseOrderId);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    const poStatus = po.approvalStatus || po.status;
    if (poStatus && poStatus !== 'Approved' && poStatus !== 'Dispatched' && poStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: 'PO must be Approved or Dispatched to receive goods' });
    }

    // The vendor and the ordered quantity are the purchase order's facts, not
    // the caller's. Both used to be taken from the request body, which meant
    // the over-receipt rule was checking the delivery against whatever
    // quantity the client chose to send — a GRN posted with poQuantity 9999
    // walked straight past it. Read them from the PO line instead.
    // The same material can sit on two lines of one order (two delivery
    // dates, two prices). The over-receipt rule below compares everything
    // received for the material against what was ordered, so "ordered" has
    // to be the total across those lines, not whichever line came first.
    const poLines = req.body.materialId
      ? await POLineForGRN.find({ poId: po._id, materialId: req.body.materialId }).lean()
      : [];
    if (req.body.materialId && !poLines.length) {
      return res.status(400).json({ success: false, message: 'That material is not on this purchase order.' });
    }
    req.body.vendorId = po.vendorId;
    if (poLines.length) {
      req.body.poQuantity = poLines.reduce((sum, l) => sum + (Number(l.orderQty) || 0), 0) || Number(req.body.poQuantity) || 0;
    }

    // Prevent over-receipt: check total previously received for this PO
    const existingGRNs = await GoodsReceipt.find({ 
      purchaseOrderId: req.body.purchaseOrderId,
      materialId: req.body.materialId,
      status: { $ne: 'Cancelled' }
    });
    const alreadyReceived = existingGRNs.reduce((acc, g) => acc + g.receivedQuantity, 0);
    const poQty = Number(req.body.poQuantity) || 0;
    const newReceived = Number(req.body.receivedQuantity) || 0;
    if (!(newReceived > 0)) {
      return res.status(400).json({ success: false, message: 'Received quantity must be greater than zero.' });
    }
    if (poQty > 0 && (alreadyReceived + newReceived) > poQty) {
      return res.status(400).json({ success: false, message: `Cannot receive more than PO quantity. Already received: ${alreadyReceived}, PO qty: ${poQty}` });
    }

    // When creating GRN lines, link to PO line item
    if (req.body.lineItems) {
      req.body.lineItems = req.body.lineItems.map(item => ({
        ...item,
        poLineItemId: item.poLineItemId || item.lineItemId
      }));
    }

    req.body.grnNumber = internalId('GRN');
    const newGrn = await GoodsReceipt.create(req.body);

    // Auto-create pending inspection ticket
    const inspectionNumber = internalId('INSP');
    await QualityInspection.create({
      inspectionNumber,
      grnId: newGrn._id,
      inspectedQuantity: newGrn.receivedQuantity,
      inspectorName: 'Unassigned',
      inspectionStatus: 'Pending'
    });
    
    newGrn.status = 'Inspecting';
    await newGrn.save();

    await logAudit('CREATE', 'GoodsReceipt', newGrn._id, req.user._id);
    res.status(201).json({ success: true, data: newGrn });
  } catch (error) { handleError(res, error); }
};

exports.updateGRN = async (req, res) => {
  try {
    const { 
      receivedQuantity, notes, status,
      challanNumber, vehicleNumber, transporterName,
      gatePassNo, storageLocation, packagingCondition 
    } = req.body;
    const grn = await GoodsReceipt.findById(req.params.id);
    if (!grn) return res.status(404).json({ success: false, message: 'GRN record not found' });

    if (receivedQuantity !== undefined) grn.receivedQuantity = receivedQuantity;
    if (notes !== undefined) grn.notes = notes;
    if (status !== undefined) grn.status = status;
    if (challanNumber !== undefined) grn.challanNumber = challanNumber;
    if (vehicleNumber !== undefined) grn.vehicleNumber = vehicleNumber;
    if (transporterName !== undefined) grn.transporterName = transporterName;
    if (gatePassNo !== undefined) grn.gatePassNo = gatePassNo;
    if (storageLocation !== undefined) grn.storageLocation = storageLocation;
    if (packagingCondition !== undefined) grn.packagingCondition = packagingCondition;
    await grn.save();

    await logAudit('UPDATE', 'GoodsReceipt', grn._id, req.user._id);
    res.json({ success: true, data: grn });
  } catch (error) { handleError(res, error); }
};

exports.deleteGRN = async (req, res) => {
  try {
    const grn = await GoodsReceipt.findByIdAndDelete(req.params.id);
    if (!grn) return res.status(404).json({ success: false, message: 'GRN record not found' });
    await logAudit('DELETE', 'GoodsReceipt', req.params.id, req.user._id);
    res.json({ success: true, message: 'GRN deleted successfully' });
  } catch (error) { handleError(res, error); }
};

// ================= Quality Inspection =================

exports.getAllInspections = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const inspections = await QualityInspection.find()
      .populate({
        path: 'grnId',
        select: 'grnNumber materialId vendorId purchaseOrderId receivedQuantity poQuantity receiptDate vehicleNumber challanNumber gatePassNo storageLocation packagingCondition notes',
        populate: [
          { path: 'materialId', select: 'name code uom category standardCost' },
          { path: 'vendorId', select: 'name code gstin contact phone email' },
          { path: 'purchaseOrderId', select: 'poNumber date deliveryStatus totalAmount' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await QualityInspection.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: inspections });
  } catch (error) { handleError(res, error); }
};

exports.updateInspection = async (req, res) => {
  try {
    const { 
      acceptedQuantity, rejectedQuantity, holdQuantity, 
      inspectorName, inspectionStatus, remarks,
      defectCategory, aqlStandard, sampleSize 
    } = req.body;
    
    const insp = await QualityInspection.findById(req.params.id).populate('grnId');
    if (!insp) return res.status(404).json({ success: false, message: 'Not found' });

    const totalInput = Number(acceptedQuantity) + Number(rejectedQuantity) + Number(holdQuantity);
    if (totalInput > insp.inspectedQuantity) {
      return res.status(400).json({ success: false, message: 'Sum of parts cannot exceed total inspected quantity' });
    }

    Object.assign(insp, { 
      acceptedQuantity, rejectedQuantity, holdQuantity, 
      inspectorName, inspectionStatus, remarks,
      defectCategory: defectCategory || insp.defectCategory,
      aqlStandard: aqlStandard || insp.aqlStandard,
      sampleSize: sampleSize !== undefined ? sampleSize : insp.sampleSize
    });
    await insp.save();

    await logAudit('UPDATE', 'QualityInspection', insp._id, req.user._id);
    res.json({ success: true, data: insp });
  } catch (error) { handleError(res, error); }
};

// ================= Inventory Posting =================

exports.getAllInventoryStocks = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = (page - 1) * limit;

    const stocks = await InventoryStock.find()
      .populate('materialId', 'name code uom category standardCost')
      .populate('warehouseId', 'name code type location')
      .populate({
        path: 'sourceGrnId',
        select: 'grnNumber receiptDate vehicleNumber vendorId purchaseOrderId challanNumber',
        populate: [
          { path: 'vendorId', select: 'name code gstin' },
          { path: 'purchaseOrderId', select: 'poNumber' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);
      
    const total = await InventoryStock.countDocuments();
    res.json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, data: stocks });
  } catch (error) { handleError(res, error); }
};

exports.postToInventory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { inspectionId, warehouseId, supplierBatchNo, notes, binLocation, materialId, quantity } = req.body;
    
    if (!warehouseId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Destination warehouse store is required' });
    }

    // Direct Store Induction (Spot Material / Stock Take)
    if (!inspectionId && materialId && Number(quantity) > 0) {
      const mat = await MasterMaterial.findById(materialId).session(session);
      if (!mat) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: 'Material master record not found' });
      }

      const unitCost = Number(mat.standardCost) || 0;
      const batchNumber = internalId('BATCH');
      const newStockArray = await InventoryStock.create([{
        batchNumber,
        materialId,
        warehouseId,
        quantityAvailable: Number(quantity),
        unitCost,
        status: 'Active',
        supplierBatchNo: supplierBatchNo || undefined,
        notes: notes || (binLocation ? `Bin: ${binLocation}` : undefined)
      }], { session });

      await InventoryTransaction.create([{
        transactionNumber: internalId('TXN'),
        transactionType: 'Goods Receipt',
        materialId,
        batchNumber,
        destinationWarehouseId: warehouseId,
        quantity: Number(quantity),
        referenceDocument: 'DIRECT-INDUCTION',
        notes: notes || `Direct store induction for ${mat.name}`
      }], { session });

      const receiptValue = Number((Number(quantity) * unitCost).toFixed(2));
      if (receiptValue > 0) {
        await postStockMovement({
          movementType: 'GOODS_RECEIPT',
          amount: receiptValue,
          description: `Direct store put-away — ${quantity} ${mat.name} received`,
          referenceId: newStockArray[0]._id,
          session
        });
      }

      await session.commitTransaction();
      session.endSession();
      return res.status(201).json({ success: true, data: newStockArray[0] });
    }

    // Standard QA Inspection-Linked Flow
    const insp = await QualityInspection.findById(inspectionId).populate('grnId').session(session);
    if (!insp) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Inspection not found' });
    }
    if (insp.inspectionStatus !== 'Completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Inspection must be Completed to post to inventory' });
    }
    if (insp.acceptedQuantity <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'No accepted quantity to post' });
    }

    // Prevent double-posting: check if this inspection was already posted
    const existingStock = await InventoryStock.findOne({ sourceGrnId: insp.grnId._id }).session(session);
    if (existingStock) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'This GRN has already been posted to inventory' });
    }

    // What the material is worth is on the purchase order line we agreed with
    // the supplier. Without it the batch was booked in at zero, so a warehouse
    // full of steel valued at nothing — which is why the company overview had
    // to invent a flat rate per unit to show anything at all.
    const { POLineItem: POLine } = require('../models/PurchaseOrder');
    let unitCost = 0;
    if (insp.grnId.purchaseOrderId) {
      const pricedLine = await POLine.findOne({
        poId: insp.grnId.purchaseOrderId,
        materialId: insp.grnId.materialId
      }).session(session);
      unitCost = Number(pricedLine?.unitPrice) || 0;
    }
    if (!unitCost) {
      // Fall back to the material master's standard cost, and say so rather
      // than silently booking in at zero.
      const mat = await MasterMaterial.findById(insp.grnId.materialId).session(session);
      unitCost = Number(mat?.standardCost) || 0;
      if (!unitCost) {
        console.warn(`[RECEIPT] ${insp.grnId.grnNumber}: no PO price and no standard cost for this material — booked in at zero value.`);
      }
    }

    // Generate Batch and Create Stock Record
    const batchNumber = internalId('BATCH');
    const newStockArray = await InventoryStock.create([{
      batchNumber,
      materialId: insp.grnId.materialId,
      warehouseId,
      quantityAvailable: insp.acceptedQuantity,
      unitCost,
      sourceGrnId: insp.grnId._id,
      status: 'Active',
      supplierBatchNo: supplierBatchNo || insp.grnId.challanNumber || undefined,
      notes: notes || (binLocation ? `Bin: ${binLocation}` : undefined)
    }], { session });
    const newStock = newStockArray[0];

    // Create an InventoryTransaction record for this goods receipt posting
    await InventoryTransaction.create([{
      transactionNumber: internalId('TXN'),
      transactionType: 'Goods Receipt',
      materialId: insp.grnId.materialId,
      batchNumber,
      destinationWarehouseId: warehouseId,
      quantity: insp.acceptedQuantity,
      referenceDocument: insp.grnId.grnNumber,
      notes: `Goods receipt posted from GRN ${insp.grnId.grnNumber}`
    }], { session });

    // The value side of the same movement. Stock rising and the ledger entry are
    // written in one transaction on purpose: if either fails, neither happened.
    const receiptValue = Number((insp.acceptedQuantity * unitCost).toFixed(2));
    if (receiptValue > 0) {
      await postStockMovement({
        movementType: 'GOODS_RECEIPT',
        amount: receiptValue,
        description: `Goods receipt ${insp.grnId.grnNumber} — ${insp.acceptedQuantity} received`,
        referenceId: insp.grnId._id,
        session
      });
    }

    // Mark GRN as Posted
    await GoodsReceipt.findByIdAndUpdate(insp.grnId._id, { status: 'Posted' }, { session });

    // Update PO delivery status to Delivered
    if (insp.grnId.purchaseOrderId) {
      await PurchaseOrder.findByIdAndUpdate(insp.grnId.purchaseOrderId, { deliveryStatus: 'Delivered' }, { session });
    }

    // Update POLineItem.receivedQty for 3-way match (CRITICAL FIX)
    const { POLineItem } = require('../models/PurchaseOrder');

    const receiptAllocations = [];
    if (insp.grnId.lineItems && insp.grnId.lineItems.length > 0) {
      for (const grnLine of insp.grnId.lineItems) {
        if (grnLine.poLineItemId) {
          receiptAllocations.push({
            poLineItemId: grnLine.poLineItemId,
            quantity: grnLine.acceptedQuantity || grnLine.quantity || insp.acceptedQuantity
          });
        }
      }
    }

    // GRNs raised from the Goods Receipt Note screen are header-first (no lineItems),
    // so resolve the PO line from the received material instead — otherwise receivedQty
    // stays 0 and the 3-way match rejects every invoice for this PO.
    if (receiptAllocations.length === 0 && insp.grnId.purchaseOrderId) {
      const poLine = await POLineItem.findOne({
        poId: insp.grnId.purchaseOrderId,
        materialId: insp.grnId.materialId
      }).session(session);
      // Only accepted units may be invoiced, so rejected/hold quantities are deliberately
      // not credited to the PO line.
      if (poLine) {
        receiptAllocations.push({ poLineItemId: poLine._id, quantity: insp.acceptedQuantity });
      } else {
        console.warn(`[RECEIPT] GRN ${insp.grnId.grnNumber}: no PO line matches the received material — receivedQty left unchanged, 3-way match will block.`);
      }
    }

    for (const allocation of receiptAllocations) {
      const poLine = await POLineItem.findOneAndUpdate(
        { _id: allocation.poLineItemId },
        { $inc: { receivedQty: allocation.quantity } },
        { new: true, session }
      );
      if (!poLine) continue;

      const lineStatus = poLine.receivedQty >= poLine.orderQty
        ? 'Closed'
        : poLine.receivedQty > 0 ? 'Partially_Received' : 'Open';
      if (lineStatus !== poLine.lineStatus) {
        await POLineItem.updateOne({ _id: poLine._id }, { lineStatus }, { session });
      }
    }

    // Handle rejected and hold quantities (H-17 fix)
    let Warehouse;
    try { Warehouse = require('../models/MasterWarehouse').Warehouse; } catch(e) { Warehouse = mongoose.models.Warehouse; }
    
    let quarantineWarehouse = null;
    if (Warehouse) {
      quarantineWarehouse = await Warehouse.findOne({ type: 'Quarantine' }).session(session);
    }

    if (!quarantineWarehouse) {
      console.warn('[INVENTORY] No quarantine warehouse configured. Rejected quantities will be tracked with status QUARANTINE on the source warehouse.');
    }

    const quarantineWh = quarantineWarehouse?._id || warehouseId;

    if (insp.rejectedQuantity > 0) {
      await InventoryStock.create([{
        materialId: insp.grnId.materialId || (insp.grnId.lineItems && insp.grnId.lineItems[0]?.materialId),
        warehouseId: quarantineWh,
        batchNumber: `REJECT-${insp.grnId.grnNumber}-${Date.now()}`,
        quantityAvailable: insp.rejectedQuantity,
        status: 'Quarantine',
        sourceGrnId: insp.grnId._id,
        postingDate: new Date(),
        notes: `Rejected in QA inspection ${insp._id}`
      }], { session });
    }

    if (insp.holdQuantity > 0) {
      await InventoryStock.create([{
        materialId: insp.grnId.materialId || (insp.grnId.lineItems && insp.grnId.lineItems[0]?.materialId),
        warehouseId: quarantineWh,
        batchNumber: `HOLD-${insp.grnId.grnNumber}-${Date.now()}`,
        quantityAvailable: insp.holdQuantity,
        status: 'Hold',
        sourceGrnId: insp.grnId._id,
        postingDate: new Date(),
        notes: `On hold for QA reinspection from GRN ${insp.grnId._id}`
      }], { session });
    }

    await logAudit('INVENTORY_POST', 'InventoryStock', newStock._id, req.user._id, { batchNumber });
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, data: newStock });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    handleError(res, error);
  }
};

/**
 * POST /api/receipt/purchase-return
 * Creates a Return-to-Vendor transaction.
 * Validates against original GRN, deducts stock, logs transaction.
 */
exports.createPurchaseReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { grnId, lineItems, reason, returnWarehouseId } = req.body;
    
    if (!grnId || !lineItems?.length) {
      return res.status(400).json({ success: false, message: 'GRN reference and line items are required' });
    }
    
    const grn = await GoodsReceipt.findById(grnId).session(session);
    if (!grn) return res.status(404).json({ success: false, message: 'GRN not found' });
    
    // Validate return quantities don't exceed accepted quantities
    for (const retLine of lineItems) {
      const grnLine = grn.lineItems && grn.lineItems.find(gl => String(gl._id) === String(retLine.lineItemId));
      // if single item GRN without lineItems but lineItems sent in request, we can assume it targets the single item GRN.
      if (!grnLine && grn.lineItems && grn.lineItems.length > 0) return res.status(400).json({ success: false, message: `Line item ${retLine.lineItemId} not found in GRN` });
      
      const acceptedQty = grnLine ? grnLine.acceptedQuantity : grn.receivedQuantity; // fallback to receivedQuantity if no accepted
      const returnedAlready = grnLine ? (grnLine.returnedQty || 0) : 0;
      
      if (retLine.quantity > (acceptedQty - returnedAlready)) {
        return res.status(400).json({ success: false, message: `Return quantity exceeds returnable quantity` });
      }
    }
    
    const { generateDocNumber } = require('../utils/docNumbering');
    const returnNumber = await generateDocNumber('PRET', 'PRET', session);
    const { deductStockAtomic } = require('./inventory.controller');
    
    // Deduct stock from warehouse
    for (const retLine of lineItems) {
      const grnLine = grn.lineItems && grn.lineItems.find(gl => String(gl._id) === String(retLine.lineItemId));
      const materialId = grnLine ? grnLine.materialId : grn.materialId;
      
      await deductStockAtomic(
        materialId, 
        returnWarehouseId || grn.warehouseId || req.body.warehouseId, 
        retLine.quantity, 
        session
      );
      // Track returned qty on GRN line
      if (grnLine) {
        await GoodsReceipt.updateOne(
          { _id: grnId, 'lineItems._id': retLine.lineItemId },
          { $inc: { 'lineItems.$.returnedQty': retLine.quantity } },
          { session }
        );
      }
    }
    
    // Create return document
    let PurchaseReturn = null;
    try { PurchaseReturn = require('../models/PurchaseReturn'); } catch(e) {}
    let returnDoc;
    if (PurchaseReturn) {
        returnDoc = await PurchaseReturn.create([{ returnNumber, grnId, lineItems, reason, status: 'Completed', createdBy: req.user._id }], { session });
        returnDoc = returnDoc[0];
    } else {
        returnDoc = { returnNumber, grnId, lineItems, reason, status: 'Completed', createdBy: req.user._id };
    }
    
    await AuditLog.create([{ action: 'PURCHASE_RETURN', module: 'GoodsReceipt', recordId: grn._id, changedBy: req.user._id, newValue: returnDoc }], { session });
    
    await session.commitTransaction();
    res.status(201).json({ success: true, data: returnDoc, message: `Purchase return ${returnNumber} created successfully` });
  } catch (error) {
    await session.abortTransaction();
    handleError(res, error);
  } finally {
    session.endSession();
  }
};
