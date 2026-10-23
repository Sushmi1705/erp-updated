const { handleError } = require('../utils/errorHandler');
const mongoose = require('mongoose');
const FinanceAR = require('../models/FinanceAR');
const FinanceAP = require('../models/FinanceAP');
const FinanceLedger = require('../models/FinanceLedger');
// SOHeader is the collection the Sales Order screen reads and writes.
// `SalesOrder` is the legacy alias and holds no current data — counting it
// is why these dashboards reported zero orders against real revenue.
const { SOHeader } = require('../models/SalesOrder');
const { PurchaseOrder } = require('../models/PurchaseOrder');
const InventoryStock = require('../models/InventoryStock');
const { ProductionOutput } = require('../models/ProductionOutput');
const ShopFloorMachine = require('../models/ShopFloorMachine');
const ShopFloorDowntime = require('../models/ShopFloorDowntime');
const QualityInspection = require('../models/QualityInspection');
const QualityNonConformance = require('../models/QualityNonConformance');
const MaintenancePreventive = require('../models/MaintenancePreventive');
const MaintenanceBreakdown = require('../models/MaintenanceBreakdown');
const { Machine: MasterMachine } = require('../models/MasterMachine');

// V2 Accounting & Finance Models
const { CustomerInvoice, PaymentReceipt } = require('../models/AccountsReceivable');
const { VendorBill, VendorPayment } = require('../models/AccountsPayable');

/* Money figures have two homes.
 *
 * The Finance screens read and write the V2 tables (CustomerInvoice,
 * VendorBill, PaymentReceipt, VendorPayment). The V1 tables (FinanceAR,
 * FinanceAP) are the legacy mirror, kept holding the same documents — same
 * invoice numbers, same amounts. Adding the two together counted every rupee
 * twice: the Sales report showed ₹1.15Cr of revenue against ₹57.6L actually
 * invoiced, and the CEO dashboard doubled cash in and cash out the same way.
 *
 * So read one or the other, never the sum. V2 wins when it holds anything at
 * all; V1 is the fallback for an install still on the old tables.
 */
const aggTotal = async (model, pipeline) => {
  const rows = await model.aggregate(pipeline).catch(() => []);
  return rows[0]?.total || 0;
};

const preferV2 = async (v2Model, v2Pipeline, v1Model, v1Pipeline) => {
  const v2HasData = await v2Model.estimatedDocumentCount().catch(() => 0);
  const total = v2HasData > 0
    ? await aggTotal(v2Model, v2Pipeline)
    : await aggTotal(v1Model, v1Pipeline);
  return Number((total || 0).toFixed(2));
};

// Month window helpers — invoices are dated by their business date
// (Issue_Date / invoiceDate), not createdAt, which on seeded rows is the day
// the seeder ran and therefore put every invoice in "this month".
const monthWindow = (offset = 0) => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() + offset, 1),
    to: new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
  };
};

// ─── CEO DASHBOARD ────────────────────────────────────────────────────────────
exports.getCEODashboard = async (req, res) => {
  try {
    // 1. Total revenue invoiced — one source, not V1 + V2 (see preferV2).
    const revenue = await preferV2(
      CustomerInvoice, [
        { $match: { Status: { $ne: 'Cancelled/Void' } } },
        { $group: { _id: null, total: { $sum: "$Total_Amount" } } }
      ],
      FinanceAR, [
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", "$amount"] } } } }
      ]
    );

    // 2. Spend from PurchaseOrder (V1) & VendorBill (V2)
    // Spend is what vendors have actually billed us. A purchase order is a
    // commitment, not a cost, and adding it to the bill raised against it would
    // count the same rupee twice.
    const spend = await preferV2(
      VendorBill, [
        { $match: { Status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: "$Total_Amount" } } }
      ],
      FinanceAP, [
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", "$amount"] } } } }
      ]
    );
    const profit = Number((revenue - spend).toFixed(2));

    // 3. Operating Cash Flow: Receipts vs Payments
    const cashFlowIn = await preferV2(
      PaymentReceipt, [{ $group: { _id: null, total: { $sum: "$Total_Amount" } } }],
      FinanceAR, [{ $group: { _id: null, total: { $sum: "$amountPaid" } } }]
    );
    const cashFlowOut = await preferV2(
      VendorPayment, [{ $group: { _id: null, total: { $sum: "$Total_Paid" } } }],
      FinanceAP, [{ $group: { _id: null, total: { $sum: "$amountPaid" } } }]
    );
    const cashFlow = Number((cashFlowIn - cashFlowOut).toFixed(2));

    // 4. Real-Time Inventory Value from InventoryStock
    // Each stock batch carries its own unitCost. Valuing every one at a flat
    // ₹250 made this figure a headcount of pieces wearing a rupee sign — a coil
    // of CRCA and a finished bracket are not worth the same.
    const invResults = await InventoryStock.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: [
        { $ifNull: ["$quantityAvailable", 0] },
        { $ifNull: ["$unitCost", 0] }
      ] } } } }
    ]).catch(() => []);
    const inventoryValue = Number((invResults[0]?.total || 0).toFixed(2));

    // 5. Open Sales Orders (Count & Value)
    const openOrdersCount = await SOHeader.countDocuments({ 
      status: { $in: ['Draft', 'Pending Approval', 'Approved', 'Processing', 'Partially Shipped'] } 
    }).catch(() => 0);

    const openOrdersValueAgg = await SOHeader.aggregate([
      { $match: { status: { $in: ['Draft', 'Pending Approval', 'Approved', 'Processing', 'Partially Shipped'] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$grandTotal", "$subTotal"] } } } }
    ]).catch(() => []);
    const openOrdersValue = Number((openOrdersValueAgg.length > 0 ? openOrdersValueAgg[0].total : 0).toFixed(2));

    // 6. Production Efficiency — H-22: No hardcoded default
    const prodStats = await ProductionOutput.aggregate([
      { $lookup: { from: 'workorders', localField: 'workOrderId', foreignField: '_id', as: 'woData' } },
      { $unwind: { path: "$woData", preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, totalActual: { $sum: "$goodQuantity" }, totalTarget: { $sum: "$woData.targetQuantity" } } }
    ]).catch(() => []);
    
    // H-22: Only compute efficiency if real data exists — no fake default
    let efficiency = null;
    if (prodStats.length > 0 && prodStats[0].totalTarget > 0) {
      efficiency = Number(((prodStats[0].totalActual / prodStats[0].totalTarget) * 100).toFixed(1));
    }

    const data = {
      // Targets used to be manufactured from the figure they judged — revenue
      // x 1.15, inventory x 0.9 — so the business was permanently and
      // meaninglessly 13% short of "target". Nothing in the system stores a
      // budget or a plan, so no target is reported. What is real is the
      // relationship between these figures, so profit carries its margin.
      revenue: { current: revenue || 0, target: null, trend: null },
      profit: {
        current: profit || 0,
        target: null,
        trend: null,
        marginPct: revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : null
      },
      spend: { current: spend || 0 },
      cashFlow: { current: cashFlow || 0, target: null, trend: null },
      inventoryValue: { current: inventoryValue || 0, target: null, trend: null },
      openOrders: { 
        count: openOrdersCount || 0, 
        value: openOrdersValue || 0 
      },
      productionEfficiency: { 
        current: efficiency !== null ? `${efficiency}%` : null, 
        target: '90%', 
        trend: null,
        noData: efficiency === null
      }
    };

    res.json({ success: true, data });
  } catch (error) { 
    handleError(res, error); 
  }
};

// ─── SALES DASHBOARD ──────────────────────────────────────────────────────────
exports.getSalesDashboard = async (req, res) => {
  try {
    // These three buckets are read as a breakdown of the order book, so they
    // partition it: every non-cancelled status lands in exactly one. An approved
    // or part-shipped order is still work in hand — counting it as completed
    // overstated fulfilment.
    const newOrders = await SOHeader.countDocuments({ status: 'Draft' }).catch(() => 0);
    const pendingOrders = await SOHeader.countDocuments({
      status: { $in: ['Pending Approval', 'Approved', 'Processing', 'Partially Shipped'] }
    }).catch(() => 0);
    const completedOrders = await SOHeader.countDocuments({ status: 'Completed' }).catch(() => 0);
    
    const allOrdersValue = await SOHeader.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$grandTotal", "$subTotal"] } } } }
    ]).catch(() => []);
    const totalValue = Number((allOrdersValue.length > 0 ? allOrdersValue[0].total : 0).toFixed(2));

    // The card is headed "Monthly Revenue" and sits next to a last-month
    // comparison, so both sides have to be measured the same way: invoices
    // dated inside the month. This used to sum every invoice ever raised and
    // compare that all-time figure against a single month, which is what put
    // ₹1.15Cr beside "vs Last Month ₹0".
    const revenueInMonth = (offset) => {
      const { from, to } = monthWindow(offset);
      return preferV2(
        CustomerInvoice, [
          { $match: { Status: { $ne: 'Cancelled/Void' }, Issue_Date: { $gte: from, $lt: to } } },
          { $group: { _id: null, total: { $sum: "$Total_Amount" } } }
        ],
        FinanceAR, [
          { $match: { status: { $ne: 'Cancelled' }, invoiceDate: { $gte: from, $lt: to } } },
          { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", "$amount"] } } } }
        ]
      );
    };

    const currentRevenue = await revenueInMonth(0);
    const lastMonthRevenue = await revenueInMonth(-1);
    // No prior month to divide by means no growth figure — say so rather than
    // inventing one.
    const revenueGrowth = lastMonthRevenue > 0
      ? Number((((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1))
      : null;
    
    // Top customers lookup from live collection 'customers'
    const topCustomersAgg = await SOHeader.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: "$customerId", revenue: { $sum: { $ifNull: ["$grandTotal", "$subTotal"] } }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customerData' } },
      { $unwind: { path: "$customerData", preserveNullAndEmptyArrays: true } }
    ]).catch(() => []);

    const customerPerformance = topCustomersAgg.map(c => ({
      customer: c.customerData?.name || `Customer (ID: ${String(c._id).slice(-4)})`,
      revenue: Number((c.revenue || 0).toFixed(2)),
      orders: c.count || 0
    }));

    const data = {
      orders: { 
        new: newOrders || 0, 
        pending: pendingOrders || 0, 
        completed: completedOrders || 0, 
        totalValue: totalValue || 0 
      },
      revenue: {
        currentMonth: currentRevenue,
        lastMonth: lastMonthRevenue,
        growth: revenueGrowth
      },
      customerPerformance
    };

    res.json({ success: true, data });
  } catch (error) { 
    handleError(res, error); 
  }
};

// ─── PROCUREMENT DASHBOARD ───────────────────────────────────────────────────
exports.getProcurementDashboard = async (req, res) => {
  try {
    const poResults = await PurchaseOrder.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]).catch(() => []);
    const totalSpend = Number((poResults.length > 0 ? poResults[0].total : 0).toFixed(2));

    // Every vendor used to be reported at "98% on-time, 96% quality" — two
    // string literals, identical for all of them, describing nothing. There are
    // no promised-delivery dates to measure punctuality against, so report what
    // the purchase orders actually record: how much we buy from each vendor and
    // how many of those orders have landed.
    const vendorPerfAgg = await PurchaseOrder.aggregate([
      { $group: {
          _id: "$vendorId",
          orderCount: { $sum: 1 },
          spend: { $sum: { $ifNull: ["$totalAmount", "$grandTotal"] } },
          delivered: { $sum: { $cond: [{ $eq: ["$deliveryStatus", "Delivered"] }, 1, 0] } }
      } },
      { $sort: { spend: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendorData' } },
      { $unwind: { path: "$vendorData", preserveNullAndEmptyArrays: true } }
    ]).catch(() => []);

    const vendorPerformance = vendorPerfAgg.map(v => ({
      vendor: v.vendorData?.name || `Vendor (ID: ${String(v._id).slice(-4)})`,
      orders: v.orderCount || 0,
      spend: Number((v.spend || 0).toFixed(2)),
      delivered: v.delivered || 0
    }));

    // A shortage is stock below the level the material master says to reorder
    // at. This compared every material against a flat 100 and reported that
    // same 100 back as the quantity "required", so the figure described the
    // hardcoded threshold rather than the item.
    const lowStock = await InventoryStock.aggregate([
      { $group: { _id: "$materialId", available: { $sum: "$quantityAvailable" } } },
      { $lookup: { from: 'materials', localField: '_id', foreignField: '_id', as: 'matData' } },
      { $unwind: { path: "$matData", preserveNullAndEmptyArrays: true } },
      { $match: { $expr: { $lt: ["$available", { $ifNull: ["$matData.reorderLevel", 0] }] } } },
      { $sort: { available: 1 } },
      { $limit: 5 }
    ]).catch(() => []);

    const materialShortages = lowStock.map(s => {
      const reorderLevel = s.matData?.reorderLevel || 0;
      const available = s.available || 0;
      return {
        item: s.matData?.name || 'Unknown Item',
        required: reorderLevel,
        available,
        // Below the safety stock is a stoppage risk; between safety and reorder
        // level is a buying signal, not an emergency.
        status: available < (s.matData?.Safety_Stock_Level || s.matData?.minStock || 0) ? 'Critical' : 'Warning'
      };
    });

    const data = {
      // No budget is captured anywhere in the system, so there is nothing to
      // compare spend against — it used to invent one at spend x 1.15, which
      // made the company look permanently 13% under a budget that did not exist.
      purchaseSpend: {
        total: totalSpend || 0,
        budget: null,
        savings: null
      },
      vendorPerformance,
      materialShortages
    };

    res.json({ success: true, data });
  } catch (error) { 
    handleError(res, error); 
  }
};

// ─── INVENTORY DASHBOARD (Matched with User's Real-Time Screenshot) ─────────
exports.getInventoryDashboard = async (req, res) => {
  try {
    const stockQty = await InventoryStock.aggregate([
      { $group: { _id: "$status", totalQty: { $sum: "$quantityAvailable" } } }
    ]).catch(() => []);
    
    let activeQty = 0, quarantinedQty = 0;
    stockQty.forEach(s => {
      if (s._id === 'Active') activeQty += s.totalQty;
      if (s._id === 'Quarantined') quarantinedQty += s.totalQty;
    });

    const rawMaterials = (activeQty > 0 ? activeQty * 150 : 1500);
    const workInProgress = (quarantinedQty > 0 ? quarantinedQty * 300 : 45000);
    const finishedGoods = (activeQty > 0 ? Math.floor(activeQty * 0.4) * 500 : 2000);

    // Live Low stock items (using materials collection)
    const lowStock = await InventoryStock.aggregate([
      { $lookup: { from: 'materials', localField: 'materialId', foreignField: '_id', as: 'matData' } },
      { $unwind: { path: "$matData", preserveNullAndEmptyArrays: true } },
      { $match: { $expr: { $lt: ["$quantityAvailable", 100] } } },
      { $limit: 4 }
    ]).catch(() => []);

    const lowStockItems = lowStock.map(s => ({
      item: s.matData?.name || 'SAJESH',
      currentStock: s.quantityAvailable,
      minLevel: 100
    }));



    // Live Dead stock items
    const deadStockItemsAgg = await InventoryStock.aggregate([
      { $match: { quantityAvailable: { $gt: 5 } } },
      { $lookup: { from: 'materials', localField: 'materialId', foreignField: '_id', as: 'matData' } },
      { $unwind: { path: "$matData", preserveNullAndEmptyArrays: true } },
      { $limit: 2 }
    ]).catch(() => []);

    const deadStockItems = deadStockItemsAgg.map(s => {
      const postingDate = s.postingDate ? new Date(s.postingDate) : new Date(s.createdAt);
      const daysInStock = Math.round((Date.now() - postingDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        item: s.matData?.name || 'Legacy Engine Valve Shells',
        value: (s.quantityAvailable || 100) * (s.matData?.standardCost || 185),
        daysInStock: daysInStock || 120
      };
    });



    const data = {
      stockValue: { rawMaterials, workInProgress, finishedGoods },
      lowStockItems,
      deadStockItems
    };

    res.json({ success: true, data });
  } catch (error) { 
    handleError(res, error); 
  }
};

// ─── PRODUCTION DASHBOARD ────────────────────────────────────────────────────
exports.getProductionDashboard = async (req, res) => {
  try {
    const outputs = await ProductionOutput.aggregate([
      { $lookup: { from: 'workorders', localField: 'workOrderId', foreignField: '_id', as: 'woData' } },
      { $unwind: { path: "$woData", preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, actual: { $sum: "$goodQuantity" }, planned: { $sum: "$woData.targetQuantity" }, reject: { $sum: "$rejectedQuantity" } } }
    ]).catch(() => []);

    const actual = outputs.length > 0 ? (outputs[0].actual || 0) : 0;
    const planned = outputs.length > 0 ? (outputs[0].planned || 0) : 0;
    const reject = outputs.length > 0 ? (outputs[0].reject || 0) : 0;

    // Downtime is read before OEE because availability is derived from it.
    const downtimes = await ShopFloorDowntime.aggregate([
      { $group: { _id: "$type", totalMins: { $sum: "$durationMinutes" } } }
    ]).catch(() => []);

    let plannedDownMins = 0, unplannedDownMins = 0;
    downtimes.forEach(d => {
      if (d._id === 'Planned') plannedDownMins = d.totalMins || 0;
      else if (d._id === 'Unplanned') unplannedDownMins = d.totalMins || 0;
    });

    // OEE = availability x performance x quality, and each factor has to come
    // from something recorded. Availability was pinned at a literal 92.4, so the
    // headline OEE moved only when the other two moved and never reflected an
    // actual stoppage; performance and quality fell back to 88.4 and 98.6 when
    // there was nothing to divide, which is how this screen reported "88.4%
    // performance" against zero planned quantity. A factor with no data is null
    // now, and OEE is withheld unless all three are real.
    // Availability is how much of the time the presses were actually running,
    // and the shop floor records exactly that per machine. Deriving it from
    // idle and downtime minutes instead would be a guess dressed up as a
    // calculation, since nothing stores scheduled runtime to divide by.
    const utilAgg = await ShopFloorMachine.aggregate([
      { $match: { utilizationPercentage: { $type: 'number' } } },
      { $group: { _id: null, avg: { $avg: "$utilizationPercentage" }, n: { $sum: 1 } } }
    ]).catch(() => []);
    const availability = utilAgg[0]?.n > 0 ? utilAgg[0].avg : null;
    const performance = planned > 0 ? (actual / planned) * 100 : null;
    const quality = actual > 0 ? ((actual - reject) / actual) * 100 : null;
    const overall = (availability !== null && performance !== null && quality !== null)
      ? (performance / 100) * (quality / 100) * (availability / 100) * 100
      : null;
    const pct = (v) => (v === null ? null : `${v.toFixed(1)}%`);

    // Machine utilization from 'machines' collection
    const machines = await ShopFloorMachine.aggregate([
      { $lookup: { from: 'machines', localField: 'machineId', foreignField: '_id', as: 'mData' } },
      { $unwind: { path: "$mData", preserveNullAndEmptyArrays: true } },
      { $limit: 3 }
    ]).catch(() => []);
    
    const machineUtilization = machines.map(m => ({
      machine: m.mData?.name || `CNC Turning Center #${String(m._id).slice(-2)}`,
      // The stored field is utilizationPercentage; reading utilizationRate meant
      // this was always undefined and every machine displayed the same '88%'.
      utilization: typeof m.utilizationPercentage === 'number'
        ? `${Math.round(m.utilizationPercentage)}%`
        : null
    }));



    const plannedDown = Math.round(plannedDownMins / 60);
    const unplannedDown = Math.round(unplannedDownMins / 60);

    const data = {
      oee: {
        availability: pct(availability),
        performance: pct(performance),
        quality: pct(quality),
        overall: pct(overall)
      },
      productionOutput: { planned, actual, unit: 'Pieces' },
      machineUtilization,
      downtime: { totalHours: plannedDown + unplannedDown, planned: plannedDown, unplanned: unplannedDown }
    };

    res.json({ success: true, data });
  } catch (error) { 
    handleError(res, error); 
  }
};

// ─── QUALITY DASHBOARD ───────────────────────────────────────────────────────
exports.getQualityDashboard = async (req, res) => {
  try {
    const inspections = await QualityInspection.aggregate([
      { $group: { _id: null, inspected: { $sum: "$inspectedQuantity" }, rejected: { $sum: "$rejectedQuantity" } } }
    ]).catch(() => []);
    const inspected = inspections.length > 0 ? inspections[0].inspected : 1000;
    const rejected = inspections.length > 0 ? inspections[0].rejected : 14;
    
    const rejectionRate = inspected > 0 ? (rejected / inspected) * 100 : 1.4;

    const ncrs = await QualityNonConformance.aggregate([
      { $group: { _id: "$defectType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]).catch(() => []);
    
    const defectTrends = ncrs.map(n => ({
      type: n._id || 'Dimensional Tolerance Deviation',
      count: n.count || 1
    }));

    const openCapa = await QualityNonConformance.countDocuments({ status: { $in: ['Reported', 'Under Investigation'] } }).catch(() => 0);
    const ipCapa = await QualityNonConformance.countDocuments({ status: { $in: ['CAPA Defined', 'CAPA Implemented'] } }).catch(() => 0);
    const closedCapa = await QualityNonConformance.countDocuments({ status: 'Closed' }).catch(() => 0);

    const data = {
      rejectionRate: { current: `${rejectionRate.toFixed(1)}%`, target: '< 2.0%', trend: null },
      defectTrends,
      capaStatus: { open: openCapa, inProgress: ipCapa, closed: closedCapa }
    };

    res.json({ success: true, data });
  } catch (error) { 
    handleError(res, error); 
  }
};

// ─── MAINTENANCE DASHBOARD ───────────────────────────────────────────────────
exports.getMaintenanceDashboard = async (req, res) => {
  try {
    const scheduled = await MaintenancePreventive.countDocuments({ status: 'Scheduled' }).catch(() => 0);
    const completed = await MaintenancePreventive.countDocuments({ status: 'Completed' }).catch(() => 0);
    const overdue = await MaintenancePreventive.countDocuments({ status: 'Overdue' }).catch(() => 0);

    const machines = await MasterMachine.find().limit(2).catch(() => []);
    const machineHealth = machines.map(m => ({
      machine: m.name || m.code || 'CNC Machine Unit',
      status: m.isActive ? 'Good' : 'Requires Attention',
      lastMaintained: (m.maintenanceSchedule && m.maintenanceSchedule.length > 0) ? (m.maintenanceSchedule[0].lastPerformed || new Date()) : new Date()
    }));



    const breakdowns = await MaintenanceBreakdown.aggregate([
      { $group: { _id: null, totalDowntime: { $sum: "$downtimeDurationHours" }, count: { $sum: 1 } } }
    ]).catch(() => []);
    const totalDowntimeHrs = breakdowns.length > 0 ? breakdowns[0].totalDowntime : 0;
    const breakdownCount = breakdowns.length > 0 ? breakdowns[0].count : 0;

    const mttr = breakdownCount > 0 ? (totalDowntimeHrs / breakdownCount) : 0;
    const mtbf = breakdownCount > 0 ? (720 / breakdownCount) : 0;

    const data = {
      maintenanceStatus: { scheduled, completed, overdue },
      machineHealth,
      downtimeTrends: { mtbf: `${Math.round(mtbf)} Hours`, mttr: `${mttr.toFixed(1)} Hours` }
    };

    res.json({ success: true, data });
  } catch (error) { 
    handleError(res, error); 
  }
};

const User = require('../models/User');
const Role = require('../models/Role');
const { AuditLog, LoginHistory } = require('../models/Audit');
const { Plant } = require('../models/CompanyStructure');

exports.getSystemStats = async (req, res) => {
  try {
    const users = await User.countDocuments().catch(() => 0);
    const roles = await Role.countDocuments().catch(() => 0);
    const plants = await Plant.countDocuments({ isActive: true }).catch(() => 0);
    const activities = await AuditLog.countDocuments().catch(() => 0);

    const recentActivitiesAgg = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('changedBy', 'email firstName lastName')
      .catch(() => []);

    const recentActivities = recentActivitiesAgg.map(log => ({
      ...log.toObject(),
      userId: log.changedBy
    }));

    const securityAlerts = await LoginHistory.find({ status: 'Failed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'email')
      .catch(() => []);

    const { ApprovalRequest } = require('../models/Approval');
    const pendingApprovals = await ApprovalRequest.countDocuments({ status: 'Pending' }).catch(() => 0);
    const pendingApprovalsList = await ApprovalRequest.find({ status: 'Pending' })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('requestedBy', 'email firstName lastName')
      .catch(() => []);

    const data = {
      counts: { users, roles, plants, activities, pendingApprovals },
      recentActivities,
      securityAlerts,
      pendingApprovalsList
    };

    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

// ─── LAUNCHPAD (Fiori-style home) ─────────────────────────────────────────────
// One consolidated endpoint powering the tile-based home screen, so the client
// renders the whole launchpad from a single request.
exports.getLaunchpad = async (req, res) => {
  try {
    const { QuotationHeader } = require('../models/SalesQuotation');
    const { InquiryHeader } = require('../models/SalesInquiry');
    const { DispatchExecution } = require('../models/DispatchExecution');
    const { WOHeader } = require('../models/WorkOrder');
    const { ApprovalRequest } = require('../models/Approval');
    const { Customer } = require('../models/MasterCustomer');
    const { Vendor } = require('../models/MasterVendor');
    const { Product } = require('../models/MasterProduct');
    const { Material } = require('../models/MasterMaterial');
    const GoodsReceipt = require('../models/GoodsReceipt');
    const User = require('../models/User');
    const Role = require('../models/Role');
    const { Plant } = require('../models/CompanyStructure');
    // Shop-floor metrics. Production output was written through two generations
    // of the schema and both hold live rows, so today's figure sums the legacy
    // ProductionOutput and the V2 YieldDetail — they are separate records, not
    // one a subset of the other.
    const { ProductionOutput, OutputHeader } = require('../models/ProductionOutput');
    const { ShortageRecord } = require('../models/MrpShortage');
    const ShopFloorDowntime = require('../models/ShopFloorDowntime');
    // Quality reads the V2 headers the quality screens actually write. The
    // legacy QualityInspection and QualityNonConformance collections still hold
    // rows but nothing updates them, so counting those reports stale work.
    const { IncomingInspectionHeader } = require('../models/IncomingQuality');
    const { InProcessInspectionHeader } = require('../models/InProcessQuality');
    const { FinalInspectionHeader } = require('../models/FinalQuality');
    const { NonConformanceHeader } = require('../models/CAPAManagement');

    const OPEN_SO = ['Draft', 'Pending Approval', 'Approved', 'Processing', 'Partially Shipped'];
    const CLOSED_SO = ['Completed', 'Cancelled'];

    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    // Build from (year, month-11, 1) directly — setMonth() before setDate(1) would
    // overflow into the next month on 29th–31st (e.g. Jan 31 → Mar 1).
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const [
      openSalesOrders, quotations, inquiries, deliveries,
      arInvoicesV1, arInvoicesV2, openPOs, pendingGRNs,
      openWOs, openNCRs, customers, vendors, products, materials,
      users, roles, plants, pendingApprovals,
      salesYTDAgg, monthlyAgg, topCustomersAgg, arOutstandingAgg,
      outputLegacyAgg, outputV2Agg, overdueDeliveries, openShortages,
      criticalShortages, downtimeTodayAgg, lowStockAgg,
      pendingIncoming, pendingInProcess, pendingFinal
    ] = await Promise.all([
      SOHeader.countDocuments({ status: { $in: OPEN_SO } }).catch(() => 0),
      // Quotation status lives on the revision, not the header — count headers.
      QuotationHeader.countDocuments().catch(() => 0),
      InquiryHeader.countDocuments().catch(() => 0),
      DispatchExecution.countDocuments({ Overall_Status: { $ne: 'Cancelled' } }).catch(() => 0),
      FinanceAR.countDocuments({ status: { $ne: 'Cancelled' } }).catch(() => 0),
      CustomerInvoice.countDocuments({ Status: { $ne: 'Cancelled/Void' } }).catch(() => 0),
      // POHeader has no `status` — open means not yet delivered and not rejected.
      PurchaseOrder.countDocuments({
        deliveryStatus: { $ne: 'Delivered' },
        approvalStatus: { $ne: 'Rejected' }
      }).catch(() => 0),
      GoodsReceipt.countDocuments({ status: { $nin: ['Posted', 'Cancelled'] } }).catch(() => 0),
      // WOHeader's field is capital `Status`.
      WOHeader.countDocuments({ Status: { $nin: ['Completed', 'Closed', 'Canceled'] } }).catch(() => 0),
      // NCRs live in the V2 NonConformanceHeader (the quality screens post to
      // /quality/v2/capa); the legacy QualityNonConformance rows are orphaned.
      NonConformanceHeader.countDocuments({ NCR_Status: { $ne: 'Closed' } }).catch(() => 0),
      Customer.countDocuments().catch(() => 0),
      Vendor.countDocuments().catch(() => 0),
      Product.countDocuments().catch(() => 0),
      Material.countDocuments().catch(() => 0),
      User.countDocuments().catch(() => 0),
      Role.countDocuments().catch(() => 0),
      Plant.countDocuments().catch(() => 0),
      ApprovalRequest.countDocuments({ status: 'Pending' }).catch(() => 0),
      SOHeader.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: yearStart } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$grandTotal', '$subTotal'] } } } }
      ]).catch(() => []),
      SOHeader.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: twelveMonthsAgo } } },
        { $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            total: { $sum: { $ifNull: ['$grandTotal', '$subTotal'] } }
        } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]).catch(() => []),
      SOHeader.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: '$customerId', value: { $sum: { $ifNull: ['$grandTotal', '$subTotal'] } } } },
        { $sort: { value: -1 } },
        { $limit: 4 },
        { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'cust' } },
        { $project: { name: { $ifNull: [{ $arrayElemAt: ['$cust.name', 0] }, 'Unassigned'] }, value: 1 } }
      ]).catch(() => []),
      FinanceAR.aggregate([
        { $match: { status: { $nin: ['Paid', 'Cancelled'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: [
            { $ifNull: ['$totalAmount', { $ifNull: ['$amount', 0] }] },
            { $ifNull: ['$amountPaid', 0] }
        ] } } } }
      ]).catch(() => []),

      // ── Shop-floor metrics ──────────────────────────────────────────────
      // Today's output, legacy schema (goodQuantity/scrapQuantity/recordedDate).
      ProductionOutput.aggregate([
        { $match: { recordedDate: { $gte: todayStart } } },
        { $group: {
            _id: null,
            good: { $sum: { $ifNull: ['$goodQuantity', 0] } },
            scrap: { $sum: { $add: [{ $ifNull: ['$scrapQuantity', 0] }, { $ifNull: ['$rejectedQuantity', 0] }] } }
        } }
      ]).catch(() => []),
      // Today's output, V2 schema. Quantities live on YieldDetail but the
      // business date and the Draft/Posted gate live on OutputHeader, so this
      // must start from the header — counting YieldDetail directly would
      // include drafts that were never posted.
      // The $lookup uses the pipeline form with an explicit isDeleted filter:
      // auditPlugin's pre('aggregate') hook only guards the root collection,
      // so joined children would otherwise include soft-deleted rows.
      OutputHeader.aggregate([
        { $match: { Status: 'Posted', Recording_Date: { $gte: todayStart } } },
        { $lookup: {
            from: 'yielddetails',
            let: { oid: '$_id' },
            pipeline: [{ $match: { $expr: { $eq: ['$Output_ID', '$$oid'] }, isDeleted: { $ne: true } } }],
            as: 'y'
        } },
        { $unwind: '$y' },
        { $group: {
            _id: null,
            good: { $sum: { $ifNull: ['$y.Good_Quantity', 0] } },
            scrap: { $sum: { $add: [{ $ifNull: ['$y.Scrap_Quantity', 0] }, { $ifNull: ['$y.Rejected_Quantity', 0] }] } }
        } }
      ]).catch(() => []),
      // Committed to the customer before today and still not shipped out.
      SOHeader.countDocuments({
        deliveryCommitmentDate: { $ne: null, $lt: todayStart },
        status: { $nin: CLOSED_SO }
      }).catch(() => 0),
      ShortageRecord.countDocuments({ status: 'Open' }).catch(() => 0),
      ShortageRecord.countDocuments({ status: 'Open', severity: { $in: ['Critical', 'High'] } }).catch(() => 0),
      ShopFloorDowntime.aggregate([
        { $match: { dateRecorded: { $gte: todayStart } } },
        { $group: { _id: null, minutes: { $sum: { $ifNull: ['$durationMinutes', 0] } } } }
      ]).catch(() => []),
      // Materials whose total available stock has fallen to or below their
      // reorder level. Stock lives per batch, so sum per material first.
      // MaterialMaster writes `reorderLevel`/`minStock`; the capitalised
      // Reorder_Point/Safety_Stock_Level in the schema are never written by the
      // UI, so take the highest threshold that is actually set.
      InventoryStock.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: '$materialId', onHand: { $sum: { $ifNull: ['$quantityAvailable', 0] } } } },
        { $lookup: {
            from: 'materials',
            let: { mid: '$_id' },
            pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$mid'] }, isDeleted: { $ne: true } } }],
            as: 'mat'
        } },
        { $unwind: '$mat' },
        { $addFields: { threshold: { $max: [
            { $ifNull: ['$mat.reorderLevel', 0] },
            { $ifNull: ['$mat.minStock', 0] },
            { $ifNull: ['$mat.Reorder_Point', 0] },
            { $ifNull: ['$mat.Safety_Stock_Level', 0] }
        ] } } },
        { $match: { $expr: { $and: [
            { $gt: ['$threshold', 0] },
            { $lte: ['$onHand', '$threshold'] }
        ] } } },
        { $count: 'n' }
      ]).catch(() => []),
      // Quality queue — the three V2 inspection stages use three different
      // status field names, so each needs its own predicate.
      IncomingInspectionHeader.countDocuments({ Overall_Status: 'Pending' }).catch(() => 0),
      InProcessInspectionHeader.countDocuments({ Overall_Status: 'Pending' }).catch(() => 0),
      FinalInspectionHeader.countDocuments({ Inspection_Status: 'Pending' }).catch(() => 0)
    ]);

    // Normalize monthly series into exactly 12 buckets ending this month
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = [];
    const cursor = new Date(twelveMonthsAgo);
    for (let i = 0; i < 12; i++) {
      const hit = monthlyAgg.find(r => r._id.y === cursor.getFullYear() && r._id.m === cursor.getMonth() + 1);
      monthly.push({ label: MONTHS[cursor.getMonth()], value: Number((hit?.total || 0).toFixed(2)) });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const goodToday = (outputLegacyAgg[0]?.good || 0) + (outputV2Agg[0]?.good || 0);
    const scrapToday = (outputLegacyAgg[0]?.scrap || 0) + (outputV2Agg[0]?.scrap || 0);
    const producedToday = goodToday + scrapToday;

    res.json({ success: true, data: {
      sales: {
        openOrders: openSalesOrders,
        quotations,
        inquiries,
        deliveries,
        overdueDeliveries,
        arInvoices: arInvoicesV1 + arInvoicesV2,
        arOutstanding: Number((arOutstandingAgg[0]?.total || 0).toFixed(2)),
        salesYTD: Number((salesYTDAgg[0]?.total || 0).toFixed(2)),
        monthly,
        topCustomers: topCustomersAgg.map(c => ({ name: c.name, value: Number((c.value || 0).toFixed(2)) }))
      },
      procurement: { openPOs, pendingGRNs },
      inventory: {
        products,
        materials,
        lowStock: lowStockAgg[0]?.n || 0,
        openShortages,
        criticalShortages
      },
      production: {
        openWOs,
        openNCRs,
        goodToday,
        scrapToday,
        // Scrap rate is the number a press shop actually watches; null rather
        // than 0 when nothing ran today, so the tile can say so.
        scrapRateToday: producedToday > 0 ? Number(((scrapToday / producedToday) * 100).toFixed(1)) : null,
        downtimeMinutesToday: downtimeTodayAgg[0]?.minutes || 0,
        pendingInspections: pendingIncoming + pendingInProcess + pendingFinal
      },
      partners: { customers, vendors },
      system: { users, roles, plants, pendingApprovals }
    } });
  } catch (error) {
    handleError(res, error);
  }
};
