const { handleError } = require('../utils/errorHandler');
const { hasPermission } = require('../middlewares/auth.middleware');
const { SOHeader } = require('../models/SalesOrder');
const { PurchaseOrder, POLineItem } = require('../models/PurchaseOrder');
const InventoryStock = require('../models/InventoryStock');
const { ProductionOutput, OutputHeader } = require('../models/ProductionOutput');
const { WOHeader } = require('../models/WorkOrder');
const ShopFloorMachine = require('../models/ShopFloorMachine');
const ShopFloorDowntime = require('../models/ShopFloorDowntime');
const MaintenancePreventive = require('../models/MaintenancePreventive');
const MaintenanceBreakdown = require('../models/MaintenanceBreakdown');
const { IncomingInspectionHeader, IncomingMaterialSampling, IncomingDefectLog } = require('../models/IncomingQuality');
const { InProcessInspectionHeader, InProcessDefectLog } = require('../models/InProcessQuality');
const { FinalInspectionHeader } = require('../models/FinalQuality');
const { NonConformanceHeader } = require('../models/CAPAManagement');
const { CustomerInvoice, PaymentReceipt, PaymentApplication } = require('../models/AccountsReceivable');
const { VendorBill, VendorPayment } = require('../models/AccountsPayable');
const { Machine } = require('../models/MasterMachine');

/* The department reports.
 *
 * One rule runs through every figure here: it comes from a document someone
 * on the floor actually raised, or it is reported as missing. The previous
 * versions of these reports filled gaps with invented values — a stock value
 * of "pieces × 150", a rejection rate of 1.4% when no inspection existed, a
 * mean time between failures of 720 ÷ breakdowns — and a plant manager cannot
 * act on a number that may be made up. A null here is honest; the screen
 * says "not recorded" and points at the screen where it would be recorded.
 *
 * Every report shares one shape so the screens can share one layout:
 *
 *   period      what window the figures cover, and the window before it
 *   headline    the four to six numbers to read first, each with what it
 *               is compared against
 *   series      month-by-month lines for the period
 *   breakdowns  ranked lists — top customers, downtime by reason, and so on
 *   attention   the things that need someone to act, each with a link
 *
 * All windows use the document's business date (order date, issue date,
 * inspection date) and fall back to createdAt only where a legacy row has
 * no business date at all.
 */

// ─── period helpers ──────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ?months=1..24, default 6. The period is whole calendar months ending now,
 *  and the comparison window is the same number of months just before it. */
const readPeriod = (req) => {
  const months = Math.min(24, Math.max(1, parseInt(req.query.months, 10) || 6));
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const prevFrom = new Date(from.getFullYear(), from.getMonth() - months, 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    months, from, to: now, prevFrom, prevTo: from, today,
    label: months === 1 ? 'this month' : `last ${months} months`
  };
};

const buckets = (from, months) => {
  const out = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    out.push({ y: d.getFullYear(), m: d.getMonth() + 1, label: MONTHS[d.getMonth()] + (d.getMonth() === 0 || i === 0 ? ` ${String(d.getFullYear()).slice(2)}` : '') });
  }
  return out;
};

/** A $match on a business date with a createdAt fallback for legacy rows. */
const inWindow = (dateField, from, to) => ({
  $expr: { $and: [
    { $gte: [{ $ifNull: [`$${dateField}`, '$createdAt'] }, from] },
    { $lt: [{ $ifNull: [`$${dateField}`, '$createdAt'] }, to] }
  ] }
});

/** Sum `valueExpr` per month over the period, normalised to every month. */
const monthly = async (model, dateField, valueExpr, extraMatch, period) => {
  const rows = await model.aggregate([
    { $match: { ...extraMatch, ...inWindow(dateField, period.from, period.to) } },
    { $addFields: { _d: { $ifNull: [`$${dateField}`, '$createdAt'] } } },
    { $group: { _id: { y: { $year: '$_d' }, m: { $month: '$_d' } }, value: { $sum: valueExpr }, n: { $sum: 1 } } }
  ]).catch(() => []);
  return buckets(period.from, period.months).map((b) => {
    const hit = rows.find((r) => r._id.y === b.y && r._id.m === b.m);
    return { label: b.label, value: round(hit?.value || 0), count: hit?.n || 0 };
  });
};

const sumIn = async (model, dateField, valueExpr, extraMatch, from, to) => {
  const rows = await model.aggregate([
    { $match: { ...extraMatch, ...inWindow(dateField, from, to) } },
    { $group: { _id: null, value: { $sum: valueExpr }, n: { $sum: 1 } } }
  ]).catch(() => []);
  return { value: round(rows[0]?.value || 0), count: rows[0]?.n || 0 };
};

const round = (n) => Number((Number(n) || 0).toFixed(2));
const pct = (num, den) => (den > 0 ? round((num / den) * 100) : null);
const delta = (now, before) => (before > 0 ? round(((now - before) / before) * 100) : null);
const daysSince = (d, today) => Math.max(0, Math.floor((today - new Date(d)) / 86400000));

/** $lookup that respects the audit plugin's soft delete on the joined side. */
const join = (from, localField, as) => ({
  $lookup: {
    from, let: { k: `$${localField}` },
    pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$k'] }, isDeleted: { $ne: true } } }],
    as
  }
});
const first = (arr, field, fallback) => ({ $ifNull: [{ $arrayElemAt: [`$${arr}.${field}`, 0] }, fallback] });
const firstOf = (arr, fields, fallback) => ({ $ifNull: [...fields.map((f) => ({ $arrayElemAt: [`$${arr}.${f}`, 0] })), fallback] });

const SO_VALUE = { $ifNull: ['$grandTotal', { $ifNull: ['$subTotal', 0] }] };
const SO_OPEN = ['Draft', 'Pending Approval', 'Approved', 'Processing', 'Partially Shipped'];
const SO_CLOSED = ['Completed', 'Cancelled'];

// ─── attention: what needs someone to act ────────────────────────────────────

/* Each collector returns zero or more items:
 *   { module, severity: 'critical'|'warning'|'info', title, detail, count, path }
 * `module` is what the caller filters by — a Store Keeper's launchpad shows
 * stock items, not receivables. The list is what a manager reads first. */
const attention = {
  async Sales({ today }) {
    const items = [];
    const overdue = await SOHeader.aggregate([
      { $match: { deliveryCommitmentDate: { $ne: null, $lt: today }, status: { $nin: SO_CLOSED } } },
      join('customers', 'customerId', 'c'),
      { $project: { orderNumber: 1, deliveryCommitmentDate: 1, value: SO_VALUE, customer: first('c', 'name', 'Customer') } },
      { $sort: { deliveryCommitmentDate: 1 } }, { $limit: 50 }
    ]).catch(() => []);
    if (overdue.length) items.push({
      module: 'Sales', severity: 'critical',
      title: `${overdue.length} sales order${overdue.length === 1 ? '' : 's'} past the promised delivery date`,
      detail: overdue.slice(0, 3).map((o) => `${o.orderNumber} · ${o.customer} · ${daysSince(o.deliveryCommitmentDate, today)}d late`).join('  ·  '),
      count: overdue.length, path: '/sales/order',
      rows: overdue.slice(0, 10).map((o) => ({ ref: o.orderNumber, who: o.customer, days: daysSince(o.deliveryCommitmentDate, today), value: round(o.value) }))
    });
    const onHold = await SOHeader.countDocuments({ holdStatus: { $in: ['Credit Hold', 'Admin Hold'] }, status: { $nin: SO_CLOSED } }).catch(() => 0);
    if (onHold) items.push({ module: 'Sales', severity: 'warning', title: `${onHold} order${onHold === 1 ? ' is' : 's are'} on hold`, detail: 'Credit or admin hold — nothing ships until it is lifted.', count: onHold, path: '/sales/order' });
    const awaiting = await SOHeader.countDocuments({ status: 'Pending Approval' }).catch(() => 0);
    if (awaiting) items.push({ module: 'Sales', severity: 'info', title: `${awaiting} order${awaiting === 1 ? '' : 's'} waiting for approval`, detail: 'Cannot be planned or shipped until approved.', count: awaiting, path: '/approvals' });
    return items;
  },

  async Procurement({ today }) {
    const items = [];
    const late = await POLineItem.aggregate([
      { $match: { promisedDeliveryDate: { $ne: null, $lt: today }, $expr: { $lt: [{ $ifNull: ['$receivedQty', 0] }, { $ifNull: ['$orderQty', 0] }] } } },
      join('poheaders', 'poId', 'po'),
      { $unwind: '$po' },
      { $match: { 'po.approvalStatus': { $ne: 'Rejected' }, 'po.deliveryStatus': { $ne: 'Delivered' } } },
      join('vendors', 'po.vendorId', 'v'), join('materials', 'materialId', 'm'),
      { $project: { poNumber: '$po.poNumber', promisedDeliveryDate: 1, vendor: first('v', 'name', 'Supplier'), material: first('m', 'name', 'Material'),
        pending: { $subtract: [{ $ifNull: ['$orderQty', 0] }, { $ifNull: ['$receivedQty', 0] }] } } },
      { $sort: { promisedDeliveryDate: 1 } }, { $limit: 50 }
    ]).catch(() => []);
    if (late.length) items.push({
      module: 'Procurement', severity: 'critical',
      title: `${late.length} supplier deliver${late.length === 1 ? 'y is' : 'ies are'} late`,
      detail: late.slice(0, 3).map((l) => `${l.poNumber} · ${l.vendor} · ${l.material} · ${daysSince(l.promisedDeliveryDate, today)}d late`).join('  ·  '),
      count: late.length, path: '/procurement/po',
      rows: late.slice(0, 10).map((l) => ({ ref: l.poNumber, who: `${l.vendor} — ${l.material}`, days: daysSince(l.promisedDeliveryDate, today), qty: l.pending }))
    });
    const awaiting = await PurchaseOrder.countDocuments({ approvalStatus: 'Pending' }).catch(() => 0);
    if (awaiting) items.push({ module: 'Procurement', severity: 'info', title: `${awaiting} purchase order${awaiting === 1 ? '' : 's'} waiting for approval`, detail: 'Suppliers have not been sent these yet.', count: awaiting, path: '/approvals' });
    return items;
  },

  async Inventory() {
    const items = [];
    const low = await lowStockRows();
    if (low.length) items.push({
      module: 'Inventory', severity: low.some((r) => r.onHand <= 0) ? 'critical' : 'warning',
      title: `${low.length} material${low.length === 1 ? ' is' : 's are'} at or below the reorder level`,
      detail: low.slice(0, 3).map((r) => `${r.item}: ${r.onHand} on hand, reorder at ${r.reorderLevel}`).join('  ·  '),
      count: low.length, path: '/inventory/control',
      rows: low.slice(0, 10).map((r) => ({ ref: r.code || '', who: r.item, qty: r.onHand, limit: r.reorderLevel }))
    });
    const held = await InventoryStock.aggregate([
      { $match: { status: { $in: ['Quarantine', 'Quarantined', 'Hold'] }, quantityAvailable: { $gt: 0 } } },
      { $group: { _id: null, n: { $sum: 1 }, value: { $sum: { $multiply: [{ $ifNull: ['$quantityAvailable', 0] }, { $ifNull: ['$unitCost', 0] }] } } } }
    ]).catch(() => []);
    if (held[0]?.n) items.push({ module: 'Inventory', severity: 'warning', title: `${held[0].n} batch${held[0].n === 1 ? '' : 'es'} held in quarantine`, detail: `Worth ₹${round(held[0].value).toLocaleString('en-IN')} — not usable until quality releases them.`, count: held[0].n, path: '/inventory/control' });
    return items;
  },

  async Production({ today }) {
    const items = [];
    const stalled = await WOHeader.aggregate([
      { $match: { Status: 'Released', $expr: { $lt: ['$createdAt', new Date(today.getTime() - 7 * 86400000)] } } },
      { $count: 'n' }
    ]).catch(() => []);
    if (stalled[0]?.n) items.push({ module: 'Production', severity: 'warning', title: `${stalled[0].n} work order${stalled[0].n === 1 ? '' : 's'} released over a week ago and not started`, detail: 'Released to the floor but no progress recorded.', count: stalled[0].n, path: '/production/wo' });
    const down = await ShopFloorMachine.aggregate([
      { $match: { status: 'Maintenance' } }, join('machines', 'machineId', 'm'),
      { $project: { name: first('m', 'name', 'Machine') } }, { $limit: 10 }
    ]).catch(() => []);
    if (down.length) items.push({ module: 'Production', severity: 'warning', title: `${down.length} machine${down.length === 1 ? ' is' : 's are'} out for maintenance`, detail: down.map((d) => d.name).join(', '), count: down.length, path: '/shopfloor/machine' });
    return items;
  },

  async Quality({ today }) {
    const items = [];
    const [inc, ip, fin] = await Promise.all([
      IncomingInspectionHeader.countDocuments({ Overall_Status: 'Pending' }).catch(() => 0),
      InProcessInspectionHeader.countDocuments({ Overall_Status: 'Pending' }).catch(() => 0),
      FinalInspectionHeader.countDocuments({ Inspection_Status: 'Pending' }).catch(() => 0)
    ]);
    const pending = inc + ip + fin;
    if (pending) items.push({ module: 'Quality', severity: 'warning', title: `${pending} inspection${pending === 1 ? '' : 's'} waiting to be done`, detail: `${inc} incoming · ${ip} in-process · ${fin} final`, count: pending, path: '/quality/incoming' });
    const oldNcr = await NonConformanceHeader.countDocuments({ NCR_Status: { $ne: 'Closed' }, $expr: { $lt: [{ $ifNull: ['$Date_Logged', '$createdAt'] }, new Date(today.getTime() - 30 * 86400000)] } }).catch(() => 0);
    if (oldNcr) items.push({ module: 'Quality', severity: 'critical', title: `${oldNcr} non-conformance${oldNcr === 1 ? '' : 's'} open for more than 30 days`, detail: 'Corrective action has not been closed out.', count: oldNcr, path: '/quality/ncr' });
    return items;
  },

  async Maintenance({ today }) {
    const items = [];
    const open = await MaintenanceBreakdown.aggregate([
      { $match: { repairStatus: { $in: ['Reported', 'In-Repair'] } } }, join('machines', 'machineId', 'm'),
      { $project: { breakdownNumber: 1, reportedDate: 1, repairStatus: 1, machine: first('m', 'name', 'Machine') } },
      { $sort: { reportedDate: 1 } }, { $limit: 20 }
    ]).catch(() => []);
    if (open.length) items.push({
      module: 'Maintenance', severity: 'critical',
      title: `${open.length} breakdown${open.length === 1 ? '' : 's'} still open`,
      detail: open.slice(0, 3).map((b) => `${b.machine} · ${b.repairStatus} · ${daysSince(b.reportedDate, today)}d`).join('  ·  '),
      count: open.length, path: '/maintenance/breakdown',
      rows: open.slice(0, 10).map((b) => ({ ref: b.breakdownNumber, who: b.machine, days: daysSince(b.reportedDate, today), status: b.repairStatus }))
    });
    const overdue = await MaintenancePreventive.countDocuments({ $or: [{ status: 'Overdue' }, { status: 'Scheduled', scheduledDate: { $lt: today } }] }).catch(() => 0);
    if (overdue) items.push({ module: 'Maintenance', severity: 'warning', title: `${overdue} planned service task${overdue === 1 ? ' is' : 's are'} overdue`, detail: 'Scheduled before today and not marked done.', count: overdue, path: '/maintenance/preventive' });
    return items;
  },

  async Finance({ today }) {
    const items = [];
    const overdueInv = await CustomerInvoice.aggregate([
      { $match: { Status: { $in: ['Sent', 'Partially Paid', 'Overdue'] }, Due_Date: { $lt: today } } },
      { $group: { _id: null, n: { $sum: 1 }, value: { $sum: '$Total_Amount' } } }
    ]).catch(() => []);
    if (overdueInv[0]?.n) items.push({ module: 'Finance', severity: 'critical', title: `${overdueInv[0].n} customer invoice${overdueInv[0].n === 1 ? ' is' : 's are'} past due`, detail: `₹${round(overdueInv[0].value).toLocaleString('en-IN')} billed and not yet collected on time.`, count: overdueInv[0].n, path: '/finance/ar' });
    const dueBills = await VendorBill.aggregate([
      { $match: { Status: { $in: ['Open', 'Partially Paid', 'Overdue'] }, Due_Date: { $lt: new Date(today.getTime() + 7 * 86400000) } } },
      { $group: { _id: null, n: { $sum: 1 }, value: { $sum: '$Total_Amount' } } }
    ]).catch(() => []);
    if (dueBills[0]?.n) items.push({ module: 'Finance', severity: 'warning', title: `${dueBills[0].n} supplier bill${dueBills[0].n === 1 ? '' : 's'} due within a week`, detail: `₹${round(dueBills[0].value).toLocaleString('en-IN')} to pay.`, count: dueBills[0].n, path: '/finance/ap' });
    return items;
  }
};

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 };
const collectAttention = async (modules, ctx) => {
  const lists = await Promise.all(modules.map((m) => (attention[m] ? attention[m](ctx).catch(() => []) : [])));
  return lists.flat().sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
};

/** Materials whose stock is at or below the reorder level they were given. */
const lowStockRows = () => InventoryStock.aggregate([
  { $match: { status: 'Active' } },
  { $group: { _id: '$materialId', onHand: { $sum: { $ifNull: ['$quantityAvailable', 0] } } } },
  join('materials', '_id', 'mat'), { $unwind: '$mat' },
  { $addFields: { threshold: { $max: [
    { $ifNull: ['$mat.reorderLevel', 0] }, { $ifNull: ['$mat.minStock', 0] },
    { $ifNull: ['$mat.Reorder_Point', 0] }, { $ifNull: ['$mat.Safety_Stock_Level', 0] }
  ] } } },
  { $match: { $expr: { $and: [{ $gt: ['$threshold', 0] }, { $lte: ['$onHand', '$threshold'] }] } } },
  { $project: { item: '$mat.name', code: '$mat.code', onHand: 1, reorderLevel: '$threshold', shortfall: { $subtract: ['$threshold', '$onHand'] } } },
  { $sort: { shortfall: -1 } }, { $limit: 50 }
]).catch(() => []);

// ─── /dashboards/attention ───────────────────────────────────────────────────

exports.getAttention = async (req, res) => {
  try {
    const period = readPeriod(req);
    const modules = Object.keys(attention).filter((m) => hasPermission(req.user, m, 'read'));
    const items = await collectAttention(modules, period);
    res.json({ success: true, data: { items, modules } });
  } catch (error) { handleError(res, error); }
};

// ─── SALES ───────────────────────────────────────────────────────────────────

exports.getSalesReport = async (req, res) => {
  try {
    const p = readPeriod(req);
    const notCancelled = { status: { $ne: 'Cancelled' } };
    const [ordersNow, ordersBefore, invoicedNow, invoicedBefore, openBook, ordersSeries, invoicedSeries, topCustomers, byStatus, att] = await Promise.all([
      sumIn(SOHeader, 'orderDate', SO_VALUE, notCancelled, p.from, p.to),
      sumIn(SOHeader, 'orderDate', SO_VALUE, notCancelled, p.prevFrom, p.prevTo),
      sumIn(CustomerInvoice, 'Issue_Date', '$Total_Amount', { Status: { $ne: 'Cancelled/Void' } }, p.from, p.to),
      sumIn(CustomerInvoice, 'Issue_Date', '$Total_Amount', { Status: { $ne: 'Cancelled/Void' } }, p.prevFrom, p.prevTo),
      SOHeader.aggregate([{ $match: { status: { $in: SO_OPEN } } }, { $group: { _id: null, value: { $sum: SO_VALUE }, n: { $sum: 1 } } }]).catch(() => []),
      monthly(SOHeader, 'orderDate', SO_VALUE, notCancelled, p),
      monthly(CustomerInvoice, 'Issue_Date', '$Total_Amount', { Status: { $ne: 'Cancelled/Void' } }, p),
      SOHeader.aggregate([
        { $match: { ...notCancelled, ...inWindow('orderDate', p.from, p.to) } },
        { $group: { _id: '$customerId', value: { $sum: SO_VALUE }, orders: { $sum: 1 } } },
        { $sort: { value: -1 } }, { $limit: 8 },
        join('customers', '_id', 'c'), { $project: { label: first('c', 'name', 'Unassigned'), value: 1, orders: 1 } }
      ]).catch(() => []),
      SOHeader.aggregate([{ $match: notCancelled }, { $group: { _id: '$status', n: { $sum: 1 }, value: { $sum: SO_VALUE } } }]).catch(() => []),
      collectAttention(['Sales'], p)
    ]);

    const totalTop = topCustomers.reduce((s, c) => s + (c.value || 0), 0);
    res.json({ success: true, data: {
      period: { months: p.months, label: p.label, from: p.from, to: p.to },
      headline: [
        { key: 'orders', label: 'Orders received', value: ordersNow.count, unit: 'count', delta: delta(ordersNow.count, ordersBefore.count), caption: `worth ₹${ordersNow.value.toLocaleString('en-IN')} · vs ${ordersBefore.count} before` },
        { key: 'orderValue', label: 'Order value received', value: ordersNow.value, unit: 'money', delta: delta(ordersNow.value, ordersBefore.value), caption: `vs previous ${p.label.replace('last ', '')}` },
        { key: 'invoiced', label: 'Revenue invoiced', value: invoicedNow.value, unit: 'money', delta: delta(invoicedNow.value, invoicedBefore.value), caption: `${invoicedNow.count} invoice${invoicedNow.count === 1 ? '' : 's'} · vs ₹${invoicedBefore.value.toLocaleString('en-IN')} before` },
        { key: 'openBook', label: 'Open order book', value: round(openBook[0]?.value || 0), unit: 'money', caption: `${openBook[0]?.n || 0} order${(openBook[0]?.n || 0) === 1 ? '' : 's'} still to deliver, all time` }
      ],
      series: [
        { key: 'orders', label: 'Orders received', points: ordersSeries, unit: 'money' },
        { key: 'invoiced', label: 'Revenue invoiced', points: invoicedSeries, unit: 'money' }
      ],
      breakdowns: [
        { key: 'customers', title: 'Top customers', caption: `By order value, ${p.label}`, unit: 'money',
          rows: topCustomers.map((c) => ({ label: c.label, value: round(c.value), sub: `${c.orders} order${c.orders === 1 ? '' : 's'}`, share: pct(c.value, totalTop) })) },
        { key: 'status', title: 'Order book by stage', caption: 'Every open and completed order, by where it stands', unit: 'count',
          rows: [...SO_OPEN, 'Completed'].map((s) => { const r = byStatus.find((x) => x._id === s); return { label: s, value: r?.n || 0, sub: r ? `₹${round(r.value).toLocaleString('en-IN')}` : '' }; }) }
      ],
      attention: att
    } });
  } catch (error) { handleError(res, error); }
};

// ─── PURCHASING ──────────────────────────────────────────────────────────────

exports.getPurchasingReport = async (req, res) => {
  try {
    const p = readPeriod(req);
    const live = { approvalStatus: { $ne: 'Rejected' } };
    const [spendNow, spendBefore, openPOs, spendSeries, topVendors, byDelivery, awaiting, billedNow, att] = await Promise.all([
      sumIn(PurchaseOrder, 'date', { $ifNull: ['$totalAmount', 0] }, live, p.from, p.to),
      sumIn(PurchaseOrder, 'date', { $ifNull: ['$totalAmount', 0] }, live, p.prevFrom, p.prevTo),
      PurchaseOrder.aggregate([{ $match: { ...live, deliveryStatus: { $ne: 'Delivered' } } }, { $group: { _id: null, value: { $sum: { $ifNull: ['$totalAmount', 0] } }, n: { $sum: 1 } } }]).catch(() => []),
      monthly(PurchaseOrder, 'date', { $ifNull: ['$totalAmount', 0] }, live, p),
      PurchaseOrder.aggregate([
        { $match: { ...live, ...inWindow('date', p.from, p.to) } },
        { $group: { _id: '$vendorId', value: { $sum: { $ifNull: ['$totalAmount', 0] } }, orders: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'Delivered'] }, 1, 0] } } } },
        { $sort: { value: -1 } }, { $limit: 8 },
        join('vendors', '_id', 'v'), { $project: { label: first('v', 'name', 'Supplier'), value: 1, orders: 1, delivered: 1 } }
      ]).catch(() => []),
      PurchaseOrder.aggregate([{ $match: live }, { $group: { _id: { $ifNull: ['$deliveryStatus', 'Pending'] }, n: { $sum: 1 }, value: { $sum: { $ifNull: ['$totalAmount', 0] } } } }]).catch(() => []),
      PurchaseOrder.countDocuments({ approvalStatus: 'Pending' }).catch(() => 0),
      sumIn(VendorBill, 'Bill_Date', '$Total_Amount', { Status: { $ne: 'Cancelled' } }, p.from, p.to),
      collectAttention(['Procurement', 'Inventory'], p)
    ]);
    const total = topVendors.reduce((s, v) => s + (v.value || 0), 0);
    res.json({ success: true, data: {
      period: { months: p.months, label: p.label, from: p.from, to: p.to },
      headline: [
        { key: 'spend', label: 'Purchase orders raised', value: spendNow.value, unit: 'money', delta: delta(spendNow.value, spendBefore.value), caption: `${spendNow.count} PO${spendNow.count === 1 ? '' : 's'} · vs ₹${spendBefore.value.toLocaleString('en-IN')} before` },
        { key: 'billed', label: 'Billed by suppliers', value: billedNow.value, unit: 'money', caption: `${billedNow.count} bill${billedNow.count === 1 ? '' : 's'} received ${p.label}` },
        { key: 'open', label: 'Still to be delivered', value: round(openPOs[0]?.value || 0), unit: 'money', caption: `${openPOs[0]?.n || 0} open purchase order${(openPOs[0]?.n || 0) === 1 ? '' : 's'}` },
        { key: 'awaiting', label: 'Waiting for approval', value: awaiting, unit: 'count', caption: awaiting ? 'Suppliers have not been sent these yet' : 'Nothing waiting' }
      ],
      series: [{ key: 'spend', label: 'Purchase orders raised', points: spendSeries, unit: 'money' }],
      breakdowns: [
        { key: 'vendors', title: 'Top suppliers', caption: `By purchase value, ${p.label}`, unit: 'money',
          rows: topVendors.map((v) => ({ label: v.label, value: round(v.value), sub: `${v.orders} PO${v.orders === 1 ? '' : 's'} · ${v.delivered} delivered`, share: pct(v.value, total) })) },
        { key: 'delivery', title: 'Purchase orders by delivery status', caption: 'All live purchase orders', unit: 'count',
          rows: byDelivery.map((d) => ({ label: d._id, value: d.n, sub: `₹${round(d.value).toLocaleString('en-IN')}` })) }
      ],
      attention: att
    } });
  } catch (error) { handleError(res, error); }
};

// ─── STOCK ───────────────────────────────────────────────────────────────────

exports.getStockReport = async (req, res) => {
  try {
    const p = readPeriod(req);
    const VALUE = { $multiply: [{ $ifNull: ['$quantityAvailable', 0] }, { $ifNull: ['$unitCost', { $ifNull: ['$mat.standardCost', 0] }] }] };
    const withMat = [join('materials', 'materialId', 'mat'), { $unwind: { path: '$mat', preserveNullAndEmptyArrays: true } }];
    const ninety = new Date(p.today.getTime() - 90 * 86400000);
    const [byType, held, slow, topItems, low, receivedSeries, batchesHeld, att] = await Promise.all([
      InventoryStock.aggregate([{ $match: { status: 'Active', quantityAvailable: { $gt: 0 } } }, ...withMat,
        { $group: { _id: { $ifNull: ['$mat.Material_Type', 'RAW_MATERIAL'] }, value: { $sum: VALUE }, batches: { $sum: 1 } } }]).catch(() => []),
      InventoryStock.aggregate([{ $match: { status: { $in: ['Quarantine', 'Quarantined', 'Hold'] }, quantityAvailable: { $gt: 0 } } }, ...withMat,
        { $group: { _id: null, value: { $sum: VALUE }, n: { $sum: 1 } } }]).catch(() => []),
      InventoryStock.aggregate([{ $match: { status: 'Active', quantityAvailable: { $gt: 0 }, $expr: { $lt: [{ $ifNull: ['$postingDate', '$createdAt'] }, ninety] } } }, ...withMat,
        { $project: { item: { $ifNull: ['$mat.name', 'Material'] }, batchNumber: 1, qty: '$quantityAvailable', value: VALUE, since: { $ifNull: ['$postingDate', '$createdAt'] } } },
        { $sort: { value: -1 } }, { $limit: 10 }]).catch(() => []),
      InventoryStock.aggregate([{ $match: { status: 'Active', quantityAvailable: { $gt: 0 } } }, ...withMat,
        { $group: { _id: '$materialId', label: { $first: { $ifNull: ['$mat.name', 'Material'] } }, value: { $sum: VALUE }, qty: { $sum: '$quantityAvailable' } } },
        { $sort: { value: -1 } }, { $limit: 8 }]).catch(() => []),
      lowStockRows(),
      monthly(InventoryStock, 'postingDate', { $multiply: [{ $ifNull: ['$quantityAvailable', 0] }, { $ifNull: ['$unitCost', 0] }] }, {}, p),
      InventoryStock.countDocuments({ status: 'Active', quantityAvailable: { $gt: 0 } }).catch(() => 0),
      collectAttention(['Inventory'], p)
    ]);
    const TYPE_LABEL = { RAW_MATERIAL: 'Raw material', WIP: 'Work in progress', FINISHED_GOOD: 'Finished goods', SPARE_PART: 'Spares' };
    const totalValue = round(byType.reduce((s, t) => s + (t.value || 0), 0));
    const slowValue = round(slow.reduce((s, r) => s + (r.value || 0), 0));
    const topTotal = topItems.reduce((s, t) => s + (t.value || 0), 0);
    res.json({ success: true, data: {
      period: { months: p.months, label: p.label, from: p.from, to: p.to },
      headline: [
        { key: 'value', label: 'Stock on hand', value: totalValue, unit: 'money', caption: `${batchesHeld} live batch${batchesHeld === 1 ? '' : 'es'}, valued at what each cost` },
        { key: 'low', label: 'Below reorder level', value: low.length, unit: 'count', caption: low.length ? 'Materials that need a purchase order' : 'Every material is above its reorder level', tone: low.length ? 'negative' : 'positive' },
        { key: 'held', label: 'Held in quarantine', value: round(held[0]?.value || 0), unit: 'money', caption: `${held[0]?.n || 0} batch${(held[0]?.n || 0) === 1 ? '' : 'es'} waiting on quality` },
        { key: 'slow', label: 'Not moved in 90 days', value: slowValue, unit: 'money', caption: `${slow.length} batch${slow.length === 1 ? '' : 'es'} received more than 90 days ago` }
      ],
      series: [{ key: 'received', label: 'Stock received (value)', points: receivedSeries, unit: 'money' }],
      breakdowns: [
        { key: 'type', title: 'Stock value by type', caption: 'Where the money on the shelves sits', unit: 'money',
          rows: byType.map((t) => ({ label: TYPE_LABEL[t._id] || t._id, value: round(t.value), sub: `${t.batches} batch${t.batches === 1 ? '' : 'es'}`, share: pct(t.value, totalValue) })) },
        { key: 'items', title: 'Highest-value materials', caption: 'Top items by value on hand', unit: 'money',
          rows: topItems.map((t) => ({ label: t.label, value: round(t.value), sub: `${round(t.qty)} in stock`, share: pct(t.value, topTotal) })) },
        { key: 'low', title: 'Below reorder level', caption: 'On hand against the level set in Master Data', unit: 'count',
          rows: low.map((r) => ({ label: r.item, value: r.onHand, sub: `reorder at ${r.reorderLevel} · short by ${round(r.shortfall)}`, tone: r.onHand <= 0 ? 'negative' : 'caution' })) },
        { key: 'slow', title: 'Slow-moving batches', caption: 'Received over 90 days ago and still on the shelf', unit: 'money',
          rows: slow.map((r) => ({ label: r.item, value: round(r.value), sub: `${r.batchNumber || 'batch'} · ${round(r.qty)} pcs · ${daysSince(r.since, p.today)} days` })) }
      ],
      attention: att
    } });
  } catch (error) { handleError(res, error); }
};

// ─── PRODUCTION ──────────────────────────────────────────────────────────────

/* Output was recorded through two generations of the schema and both hold
   live rows, so every figure sums legacy ProductionOutput and V2 OutputHeader
   → YieldDetail. They are separate records, not one a subset of the other. */
const outputIn = async (from, to) => {
  const [legacy, v2] = await Promise.all([
    ProductionOutput.aggregate([
      { $match: inWindow('recordedDate', from, to) },
      { $group: { _id: null, good: { $sum: { $ifNull: ['$goodQuantity', 0] } }, scrap: { $sum: { $add: [{ $ifNull: ['$scrapQuantity', 0] }, { $ifNull: ['$rejectedQuantity', 0] }] } } } }
    ]).catch(() => []),
    OutputHeader.aggregate([
      { $match: { Status: 'Posted', ...inWindow('Recording_Date', from, to) } },
      { $lookup: { from: 'yielddetails', let: { oid: '$_id' }, pipeline: [{ $match: { $expr: { $eq: ['$Output_ID', '$$oid'] }, isDeleted: { $ne: true } } }], as: 'y' } },
      { $unwind: '$y' },
      { $group: { _id: null, good: { $sum: { $ifNull: ['$y.Good_Quantity', 0] } }, scrap: { $sum: { $add: [{ $ifNull: ['$y.Scrap_Quantity', 0] }, { $ifNull: ['$y.Rejected_Quantity', 0] }] } } } }
    ]).catch(() => [])
  ]);
  return { good: (legacy[0]?.good || 0) + (v2[0]?.good || 0), scrap: (legacy[0]?.scrap || 0) + (v2[0]?.scrap || 0) };
};

exports.getProductionReport = async (req, res) => {
  try {
    const p = readPeriod(req);
    const bs = buckets(p.from, p.months);
    const [now, before, perMonth, downNow, downBefore, downByReason, downSeries, machines, woByStatus, woDone, att] = await Promise.all([
      outputIn(p.from, p.to), outputIn(p.prevFrom, p.prevTo),
      Promise.all(bs.map((b) => outputIn(new Date(b.y, b.m - 1, 1), new Date(b.y, b.m, 1)))),
      ShopFloorDowntime.aggregate([{ $match: inWindow('dateRecorded', p.from, p.to) }, { $group: { _id: '$type', mins: { $sum: { $ifNull: ['$durationMinutes', 0] } }, n: { $sum: 1 } } }]).catch(() => []),
      ShopFloorDowntime.aggregate([{ $match: inWindow('dateRecorded', p.prevFrom, p.prevTo) }, { $group: { _id: null, mins: { $sum: { $ifNull: ['$durationMinutes', 0] } } } }]).catch(() => []),
      ShopFloorDowntime.aggregate([{ $match: inWindow('dateRecorded', p.from, p.to) }, { $group: { _id: { $ifNull: ['$reason', 'Not given'] }, mins: { $sum: { $ifNull: ['$durationMinutes', 0] } }, n: { $sum: 1 } } }, { $sort: { mins: -1 } }, { $limit: 8 }]).catch(() => []),
      monthly(ShopFloorDowntime, 'dateRecorded', { $divide: [{ $ifNull: ['$durationMinutes', 0] }, 60] }, {}, p),
      ShopFloorMachine.aggregate([join('machines', 'machineId', 'm'), { $project: { label: first('m', 'name', 'Machine'), utilisation: '$utilizationPercentage', status: 1, idle: '$idleTimeMinutes' } }, { $sort: { utilisation: -1 } }, { $limit: 12 }]).catch(() => []),
      WOHeader.aggregate([{ $group: { _id: '$Status', n: { $sum: 1 } } }]).catch(() => []),
      WOHeader.countDocuments({ Status: { $in: ['Completed', 'Closed'] }, ...inWindow('Actual_End_Date', p.from, p.to) }).catch(() => 0),
      collectAttention(['Production'], p)
    ]);
    const produced = now.good + now.scrap;
    const producedBefore = before.good + before.scrap;
    const scrapRate = pct(now.scrap, produced);
    const scrapRateBefore = pct(before.scrap, producedBefore);
    const mins = (t) => downNow.find((d) => d._id === t)?.mins || 0;
    const downHours = round((mins('Planned') + mins('Unplanned')) / 60);
    const downHoursBefore = round((downBefore[0]?.mins || 0) / 60);
    const rated = machines.filter((m) => typeof m.utilisation === 'number');
    const avgUtil = rated.length ? round(rated.reduce((s, m) => s + m.utilisation, 0) / rated.length) : null;
    const openWO = woByStatus.filter((s) => !['Completed', 'Closed', 'Canceled'].includes(s._id)).reduce((s, x) => s + x.n, 0);
    res.json({ success: true, data: {
      period: { months: p.months, label: p.label, from: p.from, to: p.to },
      headline: [
        { key: 'good', label: 'Good pieces produced', value: now.good, unit: 'count', delta: delta(now.good, before.good), caption: `vs ${before.good.toLocaleString('en-IN')} before` },
        { key: 'scrap', label: 'Scrap rate', value: scrapRate, unit: 'percent', delta: scrapRate !== null && scrapRateBefore !== null ? round(scrapRate - scrapRateBefore) : null, deltaIsPoints: true, upIsGood: false, caption: produced ? `${now.scrap.toLocaleString('en-IN')} scrapped or rejected of ${produced.toLocaleString('en-IN')} made` : 'No output recorded in this period' },
        { key: 'downtime', label: 'Downtime', value: downHours, unit: 'hours', delta: delta(downHours, downHoursBefore), upIsGood: false, caption: `${round(mins('Unplanned') / 60)}h unplanned · ${round(mins('Planned') / 60)}h planned` },
        { key: 'utilisation', label: 'Average machine utilisation', value: avgUtil, unit: 'percent', caption: avgUtil === null ? 'Not recorded — log it on the Machine Utilization screen' : `across ${rated.length} machine${rated.length === 1 ? '' : 's'} with a figure` },
        { key: 'wo', label: 'Work orders open', value: openWO, unit: 'count', caption: `${woDone} completed ${p.label}` }
      ],
      series: [
        { key: 'good', label: 'Good pieces', points: bs.map((b, i) => ({ label: b.label, value: perMonth[i].good })), unit: 'count' },
        { key: 'scrap', label: 'Scrap / rejected', points: bs.map((b, i) => ({ label: b.label, value: perMonth[i].scrap })), unit: 'count' },
        { key: 'downtime', label: 'Downtime (hours)', points: downSeries, unit: 'hours' }
      ],
      breakdowns: [
        { key: 'reasons', title: 'Downtime by reason', caption: `Hours lost, ${p.label}`, unit: 'hours',
          rows: downByReason.map((r) => ({ label: r._id, value: round(r.mins / 60), sub: `${r.n} stoppage${r.n === 1 ? '' : 's'}`, share: pct(r.mins, mins('Planned') + mins('Unplanned')) })) },
        { key: 'machines', title: 'Machine utilisation', caption: 'As recorded on the shop floor', unit: 'percent',
          rows: machines.map((m) => ({ label: m.label, value: typeof m.utilisation === 'number' ? round(m.utilisation) : null, sub: m.status || '', share: typeof m.utilisation === 'number' ? round(m.utilisation) : null })) },
        { key: 'wo', title: 'Work orders by stage', caption: 'Every work order on the system', unit: 'count',
          rows: ['Draft', 'Released', 'In Progress', 'Completed', 'Closed', 'Canceled'].map((s) => ({ label: s, value: woByStatus.find((x) => x._id === s)?.n || 0 })) }
      ],
      attention: att
    } });
  } catch (error) { handleError(res, error); }
};

// ─── QUALITY ─────────────────────────────────────────────────────────────────

exports.getQualityReport = async (req, res) => {
  try {
    const p = readPeriod(req);
    const stage = (model, dateField, statusField, extra = {}) => ({ from, to }) => model.aggregate([
      { $match: { ...extra, ...inWindow(dateField, from, to) } },
      { $group: { _id: `$${statusField}`, n: { $sum: 1 } } }
    ]).catch(() => []);
    const incoming = stage(IncomingInspectionHeader, 'Inspection_Date', 'Overall_Status');
    const inprocess = stage(InProcessInspectionHeader, 'Inspection_Date', 'Overall_Status');
    const final = stage(FinalInspectionHeader, 'Inspection_Date', 'Inspection_Status');
    const win = { from: p.from, to: p.to }, prev = { from: p.prevFrom, to: p.prevTo };
    const [incNow, ipNow, finNow, incPrev, ipPrev, finPrev, incQty, incQtyPrev, ncrByStatus, ncrRaised, ncrClosed, defects, ncrSeries, incSeries, ipSeries, finSeries, att] = await Promise.all([
      incoming(win), inprocess(win), final(win), incoming(prev), inprocess(prev), final(prev),
      IncomingMaterialSampling.aggregate([
        { $lookup: { from: 'incominginspectionheaders', localField: 'Insp_ID', foreignField: '_id', as: 'h' } }, { $unwind: '$h' },
        { $match: { $expr: { $and: [{ $gte: [{ $ifNull: ['$h.Inspection_Date', '$h.createdAt'] }, p.from] }, { $lt: [{ $ifNull: ['$h.Inspection_Date', '$h.createdAt'] }, p.to] }] } } },
        { $group: { _id: null, received: { $sum: { $ifNull: ['$Received_Quantity', 0] } }, rejected: { $sum: { $ifNull: ['$Rejected_Quantity', 0] } } } }
      ]).catch(() => []),
      IncomingMaterialSampling.aggregate([
        { $lookup: { from: 'incominginspectionheaders', localField: 'Insp_ID', foreignField: '_id', as: 'h' } }, { $unwind: '$h' },
        { $match: { $expr: { $and: [{ $gte: [{ $ifNull: ['$h.Inspection_Date', '$h.createdAt'] }, p.prevFrom] }, { $lt: [{ $ifNull: ['$h.Inspection_Date', '$h.createdAt'] }, p.prevTo] }] } } },
        { $group: { _id: null, received: { $sum: { $ifNull: ['$Received_Quantity', 0] } }, rejected: { $sum: { $ifNull: ['$Rejected_Quantity', 0] } } } }
      ]).catch(() => []),
      NonConformanceHeader.aggregate([{ $group: { _id: '$NCR_Status', n: { $sum: 1 } } }]).catch(() => []),
      NonConformanceHeader.countDocuments(inWindow('Date_Logged', p.from, p.to)).catch(() => 0),
      NonConformanceHeader.countDocuments({ NCR_Status: 'Closed', ...inWindow('updatedAt', p.from, p.to) }).catch(() => 0),
      Promise.all([
        // Defect codes are a master (DefectCode); a log with no code is still a defect.
        IncomingDefectLog.aggregate([join('defectcodes', 'Defect_Code_ID', 'd'), { $group: { _id: firstOf('d', ['name', 'description', 'code'], 'Incoming — code not given'), n: { $sum: 1 }, qty: { $sum: { $ifNull: ['$Affected_Quantity', 0] } } } }]).catch(() => []),
        InProcessDefectLog.aggregate([join('defectcodes', 'Defect_Code_ID', 'd'), { $group: { _id: firstOf('d', ['name', 'description', 'code'], 'In-process — code not given'), n: { $sum: 1 }, qty: { $sum: { $ifNull: ['$Affected_Quantity', 0] } } } }]).catch(() => [])
      ]),
      monthly(NonConformanceHeader, 'Date_Logged', 1, {}, p),
      monthly(IncomingInspectionHeader, 'Inspection_Date', { $cond: [{ $eq: ['$Overall_Status', 'Fail'] }, 1, 0] }, {}, p),
      monthly(InProcessInspectionHeader, 'Inspection_Date', { $cond: [{ $eq: ['$Overall_Status', 'Fail'] }, 1, 0] }, {}, p),
      monthly(FinalInspectionHeader, 'Inspection_Date', { $cond: [{ $eq: ['$Inspection_Status', 'Fail'] }, 1, 0] }, {}, p),
      collectAttention(['Quality'], p)
    ]);
    const tally = (rows) => ({ total: rows.reduce((s, r) => s + r.n, 0), failed: rows.filter((r) => ['Fail', 'Rework'].includes(r._id)).reduce((s, r) => s + r.n, 0), pending: rows.find((r) => r._id === 'Pending')?.n || 0 });
    const stages = { incoming: tally(incNow), inprocess: tally(ipNow), final: tally(finNow) };
    const stagesPrev = { incoming: tally(incPrev), inprocess: tally(ipPrev), final: tally(finPrev) };
    const done = (s) => Object.values(s).reduce((a, x) => a + x.total, 0);
    const failed = (s) => Object.values(s).reduce((a, x) => a + x.failed, 0);
    const failRate = pct(failed(stages), done(stages));
    const failRatePrev = pct(failed(stagesPrev), done(stagesPrev));
    const incRate = pct(incQty[0]?.rejected || 0, incQty[0]?.received || 0);
    const incRatePrev = pct(incQtyPrev[0]?.rejected || 0, incQtyPrev[0]?.received || 0);
    const openNcr = ncrByStatus.filter((s) => s._id !== 'Closed').reduce((a, s) => a + s.n, 0);
    const defectRows = [...defects[0], ...defects[1]].sort((a, b) => b.n - a.n).slice(0, 8);
    const defectTotal = defectRows.reduce((s, d) => s + d.n, 0);
    const failSeries = incSeries.map((pt, i) => ({ label: pt.label, value: pt.value + ipSeries[i].value + finSeries[i].value }));
    res.json({ success: true, data: {
      period: { months: p.months, label: p.label, from: p.from, to: p.to },
      headline: [
        { key: 'inspections', label: 'Inspections done', value: done(stages), unit: 'count', delta: delta(done(stages), done(stagesPrev)), caption: `${stages.incoming.total} incoming · ${stages.inprocess.total} in-process · ${stages.final.total} final` },
        { key: 'failRate', label: 'Inspections failed', value: failRate, unit: 'percent', delta: failRate !== null && failRatePrev !== null ? round(failRate - failRatePrev) : null, deltaIsPoints: true, upIsGood: false, caption: done(stages) ? `${failed(stages)} of ${done(stages)} failed or sent for rework` : 'No inspections recorded in this period' },
        { key: 'incRate', label: 'Incoming material rejected', value: incRate, unit: 'percent', delta: incRate !== null && incRatePrev !== null ? round(incRate - incRatePrev) : null, deltaIsPoints: true, upIsGood: false, caption: incQty[0]?.received ? `${round(incQty[0].rejected)} of ${round(incQty[0].received)} pieces received` : 'No incoming quantities recorded' },
        { key: 'ncrOpen', label: 'Non-conformances open', value: openNcr, unit: 'count', caption: `${ncrRaised} raised · ${ncrClosed} closed ${p.label}`, tone: openNcr ? 'caution' : 'positive' }
      ],
      series: [
        { key: 'failed', label: 'Inspections failed', points: failSeries, unit: 'count' },
        { key: 'ncr', label: 'Non-conformances raised', points: ncrSeries, unit: 'count' }
      ],
      breakdowns: [
        { key: 'stages', title: 'Results by inspection stage', caption: p.label, unit: 'count',
          rows: [['incoming', 'Incoming (at the gate)'], ['inprocess', 'In-process (on the press)'], ['final', 'Final (before dispatch)']].map(([k, label]) => ({ label, value: stages[k].total, sub: `${stages[k].failed} failed · ${stages[k].pending} pending`, share: pct(stages[k].failed, stages[k].total), tone: stages[k].failed ? 'caution' : undefined })) },
        { key: 'defects', title: 'Most common defects', caption: 'Logged against inspections, all time', unit: 'count',
          rows: defectRows.map((d) => ({ label: d._id, value: d.n, sub: `${round(d.qty)} pieces affected`, share: pct(d.n, defectTotal) })) },
        { key: 'ncr', title: 'Non-conformances by stage', caption: 'Where each NCR stands', unit: 'count',
          rows: ['Open', 'Under Investigation', 'Pending Actions', 'Closed'].map((s) => ({ label: s, value: ncrByStatus.find((x) => x._id === s)?.n || 0 })) }
      ],
      attention: att
    } });
  } catch (error) { handleError(res, error); }
};

// ─── MAINTENANCE ─────────────────────────────────────────────────────────────

exports.getMaintenanceReport = async (req, res) => {
  try {
    const p = readPeriod(req);
    const HOURS = { $ifNull: ['$downtimeDurationHours', 0] };
    const [bdNow, bdBefore, bdSeries, hoursSeries, byMachine, byStatus, mttr, pm, pmDone, pmDoneBefore, machinesTotal, att] = await Promise.all([
      sumIn(MaintenanceBreakdown, 'reportedDate', HOURS, {}, p.from, p.to),
      sumIn(MaintenanceBreakdown, 'reportedDate', HOURS, {}, p.prevFrom, p.prevTo),
      monthly(MaintenanceBreakdown, 'reportedDate', 1, {}, p),
      monthly(MaintenanceBreakdown, 'reportedDate', HOURS, {}, p),
      MaintenanceBreakdown.aggregate([
        { $match: inWindow('reportedDate', p.from, p.to) },
        { $group: { _id: '$machineId', n: { $sum: 1 }, hours: { $sum: HOURS }, cost: { $sum: { $multiply: [HOURS, { $ifNull: ['$downtimeCostPerHour', 0] }] } } } },
        { $sort: { hours: -1 } }, { $limit: 8 }, join('machines', '_id', 'm'), { $project: { label: first('m', 'name', 'Machine'), n: 1, hours: 1, cost: 1 } }
      ]).catch(() => []),
      MaintenanceBreakdown.aggregate([{ $group: { _id: '$repairStatus', n: { $sum: 1 } } }]).catch(() => []),
      MaintenanceBreakdown.aggregate([{ $match: { repairStatus: 'Resolved', ...inWindow('reportedDate', p.from, p.to) } }, { $group: { _id: null, avg: { $avg: HOURS }, n: { $sum: 1 } } }]).catch(() => []),
      MaintenancePreventive.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]).catch(() => []),
      MaintenancePreventive.countDocuments({ status: 'Completed', ...inWindow('executionDate', p.from, p.to) }).catch(() => 0),
      MaintenancePreventive.countDocuments({ status: 'Completed', ...inWindow('executionDate', p.prevFrom, p.prevTo) }).catch(() => 0),
      Machine.countDocuments({ status: { $ne: 'Inactive' } }).catch(() => 0),
      collectAttention(['Maintenance'], p)
    ]);
    const overdue = await MaintenancePreventive.countDocuments({ $or: [{ status: 'Overdue' }, { status: 'Scheduled', scheduledDate: { $lt: p.today } }] }).catch(() => 0);
    const totalHours = round(bdNow.value);
    res.json({ success: true, data: {
      period: { months: p.months, label: p.label, from: p.from, to: p.to },
      headline: [
        { key: 'breakdowns', label: 'Breakdowns', value: bdNow.count, unit: 'count', delta: delta(bdNow.count, bdBefore.count), upIsGood: false, caption: `across ${machinesTotal} active machine${machinesTotal === 1 ? '' : 's'} · ${bdBefore.count} before` },
        { key: 'hours', label: 'Hours lost to breakdowns', value: totalHours, unit: 'hours', delta: delta(totalHours, round(bdBefore.value)), upIsGood: false, caption: `vs ${round(bdBefore.value)}h before` },
        { key: 'mttr', label: 'Average time to repair', value: mttr[0]?.n ? round(mttr[0].avg) : null, unit: 'hours', caption: mttr[0]?.n ? `over ${mttr[0].n} resolved breakdown${mttr[0].n === 1 ? '' : 's'}` : 'No breakdown resolved in this period' },
        { key: 'pmOverdue', label: 'Planned service overdue', value: overdue, unit: 'count', caption: `${pmDone} task${pmDone === 1 ? '' : 's'} done ${p.label} · ${pmDoneBefore} before`, tone: overdue ? 'negative' : 'positive' }
      ],
      series: [
        { key: 'breakdowns', label: 'Breakdowns', points: bdSeries, unit: 'count' },
        { key: 'hours', label: 'Hours lost', points: hoursSeries, unit: 'hours' }
      ],
      breakdowns: [
        { key: 'machines', title: 'Machines with the most downtime', caption: p.label, unit: 'hours',
          rows: byMachine.map((m) => ({ label: m.label, value: round(m.hours), sub: `${m.n} breakdown${m.n === 1 ? '' : 's'}${m.cost ? ` · ₹${round(m.cost).toLocaleString('en-IN')} lost` : ''}`, share: pct(m.hours, totalHours) })) },
        { key: 'status', title: 'Breakdowns by repair status', caption: 'All time', unit: 'count',
          rows: ['Reported', 'In-Repair', 'Resolved'].map((s) => ({ label: s, value: byStatus.find((x) => x._id === s)?.n || 0, tone: s !== 'Resolved' && byStatus.find((x) => x._id === s)?.n ? 'caution' : undefined })) },
        { key: 'pm', title: 'Planned service by status', caption: 'Preventive maintenance schedule', unit: 'count',
          rows: ['Scheduled', 'In-Progress', 'Completed', 'Overdue'].map((s) => ({ label: s, value: pm.find((x) => x._id === s)?.n || 0, tone: s === 'Overdue' && pm.find((x) => x._id === s)?.n ? 'negative' : undefined })) }
      ],
      attention: att
    } });
  } catch (error) { handleError(res, error); }
};

// ─── COMPANY OVERVIEW ────────────────────────────────────────────────────────

exports.getCompanyReport = async (req, res) => {
  try {
    const p = readPeriod(req);
    const liveInv = { Status: { $ne: 'Cancelled/Void' } }, liveBill = { Status: { $ne: 'Cancelled' } };
    const [revNow, revBefore, spendNow, spendBefore, cashIn, cashOut, revSeries, spendSeries, cashInSeries, cashOutSeries, owedToUs, weOwe, stockValue, openBook, output, att] = await Promise.all([
      sumIn(CustomerInvoice, 'Issue_Date', '$Total_Amount', liveInv, p.from, p.to),
      sumIn(CustomerInvoice, 'Issue_Date', '$Total_Amount', liveInv, p.prevFrom, p.prevTo),
      sumIn(VendorBill, 'Bill_Date', '$Total_Amount', liveBill, p.from, p.to),
      sumIn(VendorBill, 'Bill_Date', '$Total_Amount', liveBill, p.prevFrom, p.prevTo),
      sumIn(PaymentReceipt, 'Payment_Date', '$Total_Received', { Status: { $ne: 'Bounced' } }, p.from, p.to),
      sumIn(VendorPayment, 'Payment_Date', '$Total_Paid', { Status: { $ne: 'Failed' } }, p.from, p.to),
      monthly(CustomerInvoice, 'Issue_Date', '$Total_Amount', liveInv, p),
      monthly(VendorBill, 'Bill_Date', '$Total_Amount', liveBill, p),
      monthly(PaymentReceipt, 'Payment_Date', '$Total_Received', { Status: { $ne: 'Bounced' } }, p),
      monthly(VendorPayment, 'Payment_Date', '$Total_Paid', { Status: { $ne: 'Failed' } }, p),
      // Owed to us: every unpaid invoice less what has been applied against it.
      CustomerInvoice.aggregate([
        { $match: { Status: { $in: ['Sent', 'Partially Paid', 'Overdue'] } } },
        { $lookup: { from: 'paymentapplications', let: { id: '$_id' }, pipeline: [{ $match: { $expr: { $eq: ['$Invoice_ID', '$$id'] }, isDeleted: { $ne: true } } }, { $group: { _id: null, a: { $sum: '$Applied_Amount' } } }], as: 'ap' } },
        { $project: { due: { $subtract: ['$Total_Amount', { $ifNull: [{ $arrayElemAt: ['$ap.a', 0] }, 0] }] }, overdue: { $lt: ['$Due_Date', p.today] } } },
        { $group: { _id: null, total: { $sum: '$due' }, n: { $sum: 1 }, overdue: { $sum: { $cond: ['$overdue', '$due', 0] } }, overdueN: { $sum: { $cond: ['$overdue', 1, 0] } } } }
      ]).catch(() => []),
      VendorBill.aggregate([
        { $match: { Status: { $in: ['Open', 'Partially Paid', 'Overdue'] } } },
        { $lookup: { from: 'billpaymentapplications', let: { id: '$_id' }, pipeline: [{ $match: { $expr: { $eq: ['$Bill_ID', '$$id'] }, isDeleted: { $ne: true } } }, { $group: { _id: null, a: { $sum: '$Applied_Amount' } } }], as: 'ap' } },
        { $project: { due: { $subtract: ['$Total_Amount', { $ifNull: [{ $arrayElemAt: ['$ap.a', 0] }, 0] }] }, overdue: { $lt: ['$Due_Date', p.today] } } },
        { $group: { _id: null, total: { $sum: '$due' }, n: { $sum: 1 }, overdue: { $sum: { $cond: ['$overdue', '$due', 0] } } } }
      ]).catch(() => []),
      InventoryStock.aggregate([{ $match: { status: 'Active' } }, { $group: { _id: null, total: { $sum: { $multiply: [{ $ifNull: ['$quantityAvailable', 0] }, { $ifNull: ['$unitCost', 0] }] } } } }]).catch(() => []),
      SOHeader.aggregate([{ $match: { status: { $in: SO_OPEN } } }, { $group: { _id: null, value: { $sum: SO_VALUE }, n: { $sum: 1 } } }]).catch(() => []),
      outputIn(p.from, p.to),
      collectAttention(Object.keys(attention), p)
    ]);
    const gross = round(revNow.value - spendNow.value);
    const grossBefore = round(revBefore.value - spendBefore.value);
    const produced = output.good + output.scrap;
    res.json({ success: true, data: {
      period: { months: p.months, label: p.label, from: p.from, to: p.to },
      headline: [
        { key: 'revenue', label: 'Revenue invoiced', value: revNow.value, unit: 'money', delta: delta(revNow.value, revBefore.value), caption: `${revNow.count} invoice${revNow.count === 1 ? '' : 's'} · vs ₹${revBefore.value.toLocaleString('en-IN')} before` },
        { key: 'spend', label: 'Billed by suppliers', value: spendNow.value, unit: 'money', delta: delta(spendNow.value, spendBefore.value), upIsGood: false, caption: `${spendNow.count} bill${spendNow.count === 1 ? '' : 's'} · vs ₹${spendBefore.value.toLocaleString('en-IN')} before` },
        { key: 'gross', label: 'Revenue less purchases', value: gross, unit: 'money', delta: delta(gross, grossBefore), caption: revNow.value ? `${pct(gross, revNow.value)}% of revenue` : 'No revenue in this period' },
        { key: 'cash', label: 'Cash in less cash out', value: round(cashIn.value - cashOut.value), unit: 'money', caption: `₹${cashIn.value.toLocaleString('en-IN')} received · ₹${cashOut.value.toLocaleString('en-IN')} paid` },
        { key: 'owed', label: 'Customers owe us', value: round(owedToUs[0]?.total || 0), unit: 'money', caption: owedToUs[0]?.overdueN ? `₹${round(owedToUs[0].overdue).toLocaleString('en-IN')} of it past due on ${owedToUs[0].overdueN} invoice${owedToUs[0].overdueN === 1 ? '' : 's'}` : `${owedToUs[0]?.n || 0} open invoice${(owedToUs[0]?.n || 0) === 1 ? '' : 's'}, none past due`, tone: owedToUs[0]?.overdueN ? 'caution' : undefined },
        { key: 'owe', label: 'We owe suppliers', value: round(weOwe[0]?.total || 0), unit: 'money', caption: weOwe[0]?.overdue ? `₹${round(weOwe[0].overdue).toLocaleString('en-IN')} of it past due` : `${weOwe[0]?.n || 0} open bill${(weOwe[0]?.n || 0) === 1 ? '' : 's'}` },
        { key: 'stock', label: 'Stock on hand', value: round(stockValue[0]?.total || 0), unit: 'money', caption: 'Valued at what each batch cost' },
        { key: 'book', label: 'Open order book', value: round(openBook[0]?.value || 0), unit: 'money', caption: `${openBook[0]?.n || 0} order${(openBook[0]?.n || 0) === 1 ? '' : 's'} still to deliver` },
        { key: 'output', label: 'Good pieces produced', value: output.good, unit: 'count', caption: produced ? `${pct(output.scrap, produced)}% scrap rate` : 'No output recorded in this period' }
      ],
      series: [
        { key: 'revenue', label: 'Revenue invoiced', points: revSeries, unit: 'money' },
        { key: 'spend', label: 'Billed by suppliers', points: spendSeries, unit: 'money' },
        { key: 'cashIn', label: 'Cash received', points: cashInSeries, unit: 'money' },
        { key: 'cashOut', label: 'Cash paid out', points: cashOutSeries, unit: 'money' }
      ],
      breakdowns: [],
      attention: att
    } });
  } catch (error) { handleError(res, error); }
};
