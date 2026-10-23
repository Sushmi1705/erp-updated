#!/usr/bin/env node
/* Reads the live database for the things a screen never shows but a report
 * silently sums: a line whose header was deleted, a batch with a negative
 * quantity, two documents sharing one number, an invoice for a customer who
 * no longer exists, a paid invoice with nothing applied to it. Read-only.
 *
 *   node tools/scan-integrity.cjs
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const findings = [];
  const note = (severity, area, what, n, sample) => { if (n > 0) findings.push({ severity, area, what, n, sample }); };
  const ids = (rows, f = '_id') => rows.slice(0, 3).map((r) => String(r[f] ?? r)).join(', ');

  const orphans = async (child, childField, parent, area, label) => {
    const rows = await db.collection(child).aggregate([
      { $match: { isDeleted: { $ne: true }, [childField]: { $ne: null } } },
      { $lookup: { from: parent, localField: childField, foreignField: '_id', as: 'p' } },
      { $match: { p: { $size: 0 } } }, { $limit: 50 }
    ]).toArray();
    note('warning', area, `${label}: ${child} rows whose ${childField} points at a missing ${parent} record`, rows.length, ids(rows));
  };
  const dupes = async (coll, field, area) => {
    const rows = await db.collection(coll).aggregate([
      { $match: { isDeleted: { $ne: true }, [field]: { $exists: true, $nin: [null, ''] } } },
      { $group: { _id: `$${field}`, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }, { $limit: 20 }
    ]).toArray();
    note('critical', area, `Duplicate ${field} in ${coll}`, rows.length, rows.map((r) => `${r._id}×${r.n}`).slice(0, 3).join(', '));
  };
  const negatives = async (coll, field, area) => {
    const rows = await db.collection(coll).find({ [field]: { $lt: 0 } }).limit(20).toArray();
    note('critical', area, `Negative ${field} in ${coll}`, rows.length, ids(rows));
  };

  // ── Orphans ─────────────────────────────────────────────────────────────
  await orphans('solineitems', 'orderId', 'soheaders', 'Sales', 'Order lines without an order');
  await orphans('soheaders', 'customerId', 'customers', 'Sales', 'Orders for a missing customer');
  await orphans('polineitems', 'poId', 'poheaders', 'Purchasing', 'PO lines without a PO');
  await orphans('poheaders', 'vendorId', 'vendors', 'Purchasing', 'POs for a missing supplier');
  await orphans('goodsreceipts', 'purchaseOrderId', 'poheaders', 'Stores', 'GRNs for a missing PO');
  await orphans('inventorystocks', 'materialId', 'materials', 'Stock', 'Stock batches for a missing material');
  await orphans('inventorystocks', 'warehouseId', 'warehouses', 'Stock', 'Stock batches in a missing warehouse');
  await orphans('wodetails', 'WO_ID', 'woheaders', 'Production', 'Work-order lines without a header');
  await orphans('yielddetails', 'Output_ID', 'outputheaders', 'Production', 'Yield lines without an output record');
  await orphans('customerinvoices', 'Customer_ID', 'customers', 'Finance', 'Invoices for a missing customer');
  await orphans('invoicelineitems', 'Invoice_ID', 'customerinvoices', 'Finance', 'Invoice lines without an invoice');
  await orphans('vendorbills', 'Vendor_ID', 'vendors', 'Finance', 'Bills for a missing supplier');
  await orphans('billlineitems', 'Bill_ID', 'vendorbills', 'Finance', 'Bill lines without a bill');
  await orphans('paymentapplications', 'Invoice_ID', 'customerinvoices', 'Finance', 'Receipt applications to a missing invoice');
  await orphans('journalentrylines', 'Journal_Entry_ID', 'journalentries', 'Finance', 'Journal lines without an entry');
  await orphans('journalentrylines', 'Account_ID', 'chartofaccounts', 'Finance', 'Journal lines to a missing account');
  await orphans('breakdownincidentheaders', 'Machine_ID', 'machines', 'Maintenance', 'Breakdowns on a missing machine');

  // ── Duplicates ──────────────────────────────────────────────────────────
  await dupes('soheaders', 'orderNumber', 'Sales');
  await dupes('poheaders', 'poNumber', 'Purchasing');
  await dupes('goodsreceipts', 'grnNumber', 'Stores');
  await dupes('customerinvoices', 'Invoice_Number', 'Finance');
  await dupes('vendorbills', 'Bill_Number', 'Finance');
  await dupes('woheaders', 'WO_Number', 'Production');
  await dupes('journalentries', 'Entry_Number', 'Finance');
  await dupes('customers', 'code', 'Master data');
  await dupes('materials', 'code', 'Master data');
  await dupes('users', 'email', 'Users');

  // ── Negatives ───────────────────────────────────────────────────────────
  await negatives('inventorystocks', 'quantityAvailable', 'Stock');
  await negatives('inventorystocks', 'unitCost', 'Stock');
  await negatives('solineitems', 'orderedQuantity', 'Sales');
  await negatives('customerinvoices', 'Total_Amount', 'Finance');
  await negatives('vendorbills', 'Total_Amount', 'Finance');

  // ── Contradictions ──────────────────────────────────────────────────────
  {
    const rows = await db.collection('customerinvoices').aggregate([
      { $match: { Status: 'Paid' } },
      { $lookup: { from: 'paymentapplications', localField: '_id', foreignField: 'Invoice_ID', as: 'ap' } },
      { $addFields: { applied: { $sum: '$ap.Applied_Amount' } } },
      { $match: { $expr: { $lt: ['$applied', { $subtract: ['$Total_Amount', 1] }] } } }, { $limit: 20 }
    ]).toArray();
    note('critical', 'Finance', 'Invoices marked Paid with less than their total applied', rows.length, rows.map((r) => `${r.Invoice_Number} ₹${r.applied}/${r.Total_Amount}`).slice(0, 3).join(', '));
  }
  {
    const rows = await db.collection('customerinvoices').aggregate([
      { $match: { Status: { $in: ['Sent', 'Overdue'] } } },
      { $lookup: { from: 'paymentapplications', localField: '_id', foreignField: 'Invoice_ID', as: 'ap' } },
      { $addFields: { applied: { $sum: '$ap.Applied_Amount' } } },
      { $match: { applied: { $gt: 0 } } }, { $limit: 20 }
    ]).toArray();
    note('warning', 'Finance', 'Invoices with money applied but still marked Sent/Overdue (should be Partially Paid or Paid)', rows.length, rows.map((r) => `${r.Invoice_Number} ₹${r.applied}/${r.Total_Amount}`).slice(0, 3).join(', '));
  }
  {
    const rows = await db.collection('customerinvoices').find({ Status: { $in: ['Sent', 'Partially Paid'] }, Due_Date: { $lt: new Date() } }).limit(50).toArray();
    note('info', 'Finance', 'Invoices past due date but not flagged Overdue (the report treats them as overdue anyway)', rows.length, ids(rows, 'Invoice_Number'));
  }
  {
    const rows = await db.collection('wodetails').find({ $expr: { $gt: ['$Produced_Quantity', { $multiply: ['$Target_Quantity', 1.05] }] } }).limit(20).toArray();
    note('warning', 'Production', 'Work-order lines produced more than 5% over target', rows.length, ids(rows));
  }
  {
    const rows = await db.collection('woheaders').aggregate([
      { $match: { Status: { $in: ['Completed', 'Closed'] } } },
      { $lookup: { from: 'wodetails', localField: '_id', foreignField: 'WO_ID', as: 'd' } },
      { $addFields: { produced: { $sum: '$d.Produced_Quantity' }, target: { $sum: '$d.Target_Quantity' } } },
      { $match: { $expr: { $and: [{ $gt: ['$target', 0] }, { $lt: ['$produced', { $multiply: ['$target', 0.5] }] }] } } }, { $limit: 20 }
    ]).toArray();
    note('warning', 'Production', 'Work orders Completed/Closed with under half the target produced', rows.length, rows.map((r) => `${r.WO_Number} ${r.produced}/${r.target}`).slice(0, 3).join(', '));
  }
  {
    const rows = await db.collection('woheaders').aggregate([
      { $match: { Status: { $in: ['Released', 'Draft'] } } },
      { $lookup: { from: 'wodetails', localField: '_id', foreignField: 'WO_ID', as: 'd' } },
      { $addFields: { produced: { $sum: '$d.Produced_Quantity' } } },
      { $match: { produced: { $gt: 0 } } }, { $limit: 20 }
    ]).toArray();
    note('warning', 'Production', 'Work orders with output recorded but status still Draft/Released', rows.length, rows.map((r) => `${r.WO_Number} produced ${r.produced}`).slice(0, 3).join(', '));
  }
  {
    const rows = await db.collection('soheaders').aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $lookup: { from: 'solineitems', localField: '_id', foreignField: 'orderId', as: 'l' } },
      { $addFields: { lineSum: { $sum: '$l.lineTotal' } } },
      { $match: { $expr: { $and: [{ $gt: [{ $size: '$l' }, 0] }, { $gt: [{ $abs: { $subtract: ['$subTotal', '$lineSum'] } }, 1] }] } } }, { $limit: 20 }
    ]).toArray();
    note('warning', 'Sales', 'Orders whose subtotal does not equal the sum of their lines', rows.length, rows.map((r) => `${r.orderNumber} ${r.subTotal} vs ${r.lineSum}`).slice(0, 3).join(', '));
  }
  {
    const rows = await db.collection('soheaders').aggregate([
      { $match: { status: { $nin: ['Cancelled', 'Draft'] } } },
      { $lookup: { from: 'solineitems', localField: '_id', foreignField: 'orderId', as: 'l' } },
      { $match: { l: { $size: 0 } } }, { $limit: 20 }
    ]).toArray();
    note('warning', 'Sales', 'Approved/processing orders with no lines at all', rows.length, ids(rows, 'orderNumber'));
  }
  {
    // A header whose lines were never written: the document exists, means
    // nothing, and cannot be removed from any screen.
    for (const [parent, child, fk, area, label] of [
      ['planheaders', 'plandetails', 'Plan_ID', 'Production', 'Production plans'],
      ['woheaders', 'wodetails', 'WO_ID', 'Production', 'Work orders'],
      ['customerinvoices', 'invoicelineitems', 'Invoice_ID', 'Finance', 'Customer invoices'],
      ['vendorbills', 'billlineitems', 'Bill_ID', 'Finance', 'Supplier bills'],
      ['poheaders', 'polineitems', 'poId', 'Purchasing', 'Purchase orders']
    ]) {
      const rows = await db.collection(parent).aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $lookup: { from: child, localField: '_id', foreignField: fk, as: 'l' } },
        { $match: { l: { $size: 0 } } }, { $limit: 25 }
      ]).toArray();
      note('warning', area, `${label} with no lines at all`, rows.length,
        ids(rows, parent === 'planheaders' ? 'Plan_Number' : parent === 'woheaders' ? 'WO_Number' : parent === 'customerinvoices' ? 'Invoice_Number' : parent === 'vendorbills' ? 'Bill_Number' : 'poNumber'));
    }
  }
  {
    const rows = await db.collection('goodsreceipts').aggregate([
      { $match: { status: { $in: ['Received', 'Inspecting'] } } },
      { $lookup: { from: 'qualityinspections', localField: '_id', foreignField: 'grnId', as: 'q' } },
      { $match: { q: { $size: 0 } } }, { $limit: 20 }
    ]).toArray();
    note('warning', 'Stores', 'GRNs awaiting inspection with no inspection record', rows.length, ids(rows, 'grnNumber'));
  }
  {
    const rows = await db.collection('journalentries').aggregate([
      { $match: { Status: 'Posted' } },
      { $lookup: { from: 'journalentrylines', localField: '_id', foreignField: 'Journal_Entry_ID', as: 'l' } },
      { $addFields: { dr: { $sum: { $map: { input: { $filter: { input: '$l', as: 'x', cond: { $eq: ['$$x.Type', 'Debit'] } } }, as: 'x', in: '$$x.Amount' } } }, cr: { $sum: { $map: { input: { $filter: { input: '$l', as: 'x', cond: { $eq: ['$$x.Type', 'Credit'] } } }, as: 'x', in: '$$x.Amount' } } } } },
      { $match: { $expr: { $gt: [{ $abs: { $subtract: ['$dr', '$cr'] } }, 0.01] } } }, { $limit: 20 }
    ]).toArray();
    note('critical', 'Finance', 'Posted journal entries that do not balance', rows.length, rows.map((r) => `${r.Entry_Number || r._id} dr ${r.dr} cr ${r.cr}`).slice(0, 3).join(', '));
  }
  {
    const rows = await db.collection('users').find({ status: 'Active', role: null }).limit(20).toArray();
    note('critical', 'Users', 'Active users with no role (cannot open anything)', rows.length, ids(rows, 'email'));
    const missingRole = await db.collection('users').aggregate([{ $match: { status: 'Active', role: { $ne: null } } }, { $lookup: { from: 'roles', localField: 'role', foreignField: '_id', as: 'r' } }, { $match: { r: { $size: 0 } } }, { $limit: 20 }]).toArray();
    note('critical', 'Users', 'Active users whose role no longer exists', missingRole.length, ids(missingRole, 'email'));
  }
  {
    const rows = await db.collection('materials').find({ isDeleted: { $ne: true }, status: 'Active', $or: [{ reorderLevel: { $in: [null, 0] } }, { reorderLevel: { $exists: false } }], Material_Type: 'RAW_MATERIAL' }).limit(100).toArray();
    note('info', 'Master data', 'Raw materials with no reorder level (never appear in the low-stock check)', rows.length, ids(rows, 'name'));
    const noCost = await db.collection('inventorystocks').find({ status: 'Active', quantityAvailable: { $gt: 0 }, $or: [{ unitCost: null }, { unitCost: 0 }, { unitCost: { $exists: false } }] }).limit(100).toArray();
    note('info', 'Stock', 'Live stock batches with no unit cost (valued at ₹0 in the Stock Report)', noCost.length, ids(noCost, 'batchNumber'));
  }

  const order = { critical: 0, warning: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  console.log(`\nINTEGRITY — ${findings.length} finding(s)\n`);
  for (const f of findings) console.log(`  ${f.severity.toUpperCase().padEnd(8)} ${f.area.padEnd(12)} ${f.what} — ${f.n}${f.sample ? `  (${f.sample})` : ''}`);
  if (!findings.length) console.log('  nothing out of place');
  await mongoose.disconnect();
  process.exit(findings.some((f) => f.severity === 'critical') ? 1 : 0);
})();
