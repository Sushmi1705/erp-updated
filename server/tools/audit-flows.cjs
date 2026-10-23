#!/usr/bin/env node
/* Runs the two chains a press shop lives on, end to end, through the same
 * endpoints the screens call, and reports every step that does not behave:
 *
 *   Procure-to-pay   PO → approve → GRN → inspect → post to stock → bill →
 *                    payment → apply
 *   Order-to-cash    SO → line → approve → plan → validate → approve →
 *                    work order → release → output → post → dispatch plan →
 *                    invoice → receipt → apply
 *   Plus             incoming inspection, breakdown → repair → resolve
 *
 * The endpoint sweep proves each GET answers; the role crawl proves each
 * screen loads. Neither proves that a store keeper can actually receive a
 * delivery and see it in stock. This does. Every document it creates is
 * tagged and removed at the end, so the live figures are not disturbed.
 *
 *   AUDIT_BASE_URL=http://127.0.0.1:8083 node tools/audit-flows.cjs
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

/* The ERP's own port is 8083. It shared 8082 with the LAB Automotive
 * marketing site until that site took 8082 as its default_server; the ERP has
 * had 8083 to itself since. Still never 5060 — that port is WHATWG-blocked, so
 * fetch() refuses it and these scripts must go through nginx. */
const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8083';
const TAG = 'FLOWAUDIT-' + Date.now().toString(36).toUpperCase();
const created = [];   // { collection, id } — removed at the end
const results = [];   // { chain, step, ok, note }

let token;
const api = async (method, path, body) => {
  const res = await fetch(BASE + '/api' + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { success: false, message: text.slice(0, 200) }; }
  return { status: res.status, ...json };
};
const step = (chain, name, ok, note = '') => { results.push({ chain, step: name, ok, note }); console.log(`  ${ok ? '✓' : '✗'} ${name}${note ? '  — ' + note : ''}`); return ok; };
const track = (collection, id) => { if (id) created.push({ collection, id: String(id) }); };
const today = new Date().toISOString().slice(0, 10);
const plusDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const login = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }) });
  token = (await login.json()).token;
  if (!token) throw new Error('login failed');

  // Reference data every chain needs.
  const [vendors, materials, customers, products, warehouses, plants, machines] = await Promise.all([
    api('GET', '/master/vendor'), api('GET', '/master/material'), api('GET', '/master/customer'),
    api('GET', '/master/product'), api('GET', '/master/warehouse'), api('GET', '/company/plants').catch(() => ({})), api('GET', '/master/machine')
  ]);
  const vendor = (vendors.data || [])[0];
  const material = (materials.data || []).find((m) => m.Material_Type === 'RAW_MATERIAL') || (materials.data || [])[0];
  const customer = (customers.data || []).find((c) => !c.creditLimit || c.creditLimit > 500000) || (customers.data || [])[0];
  const product = (products.data || [])[0];
  const warehouse = (warehouses.data || []).find((w) => w.type !== 'Quarantine') || (warehouses.data || [])[0];
  const plant = (plants.data || plants.plants || [])[0] || (await db.collection('plants').findOne({}));
  const machine = (machines.data || [])[0];
  console.log(`\nUsing vendor "${vendor?.name}", material "${material?.name}", customer "${customer?.name}", product "${product?.name}", warehouse "${warehouse?.name}", plant "${plant?.name}", machine "${machine?.name}"\n`);

  // ── Procure-to-pay ─────────────────────────────────────────────────────
  console.log('PROCURE-TO-PAY');
  const C = 'P2P';
  let po, grn, insp, bill, payment;
  {
    const r = await api('POST', '/procurement/po', { vendorId: vendor._id, paymentTerms: 'Net30', incoterms: 'DDP', items: [{ materialId: material._id, quantity: 50, unitPrice: 12.5, scheduledDeliveryDate: plusDays(10) }] });
    const noDate = await api('POST', '/procurement/po', { vendorId: vendor._id, paymentTerms: 'Net30', incoterms: 'DDP', items: [{ materialId: material._id, quantity: 5, unitPrice: 1 }] });
    track('poheaders', noDate.data?._id);
    step(C, 'Refuse a PO line without a promised delivery date', noDate.status === 400, noDate.message?.slice(0, 70));
    po = r.data; track('poheaders', po?._id);
    if (po?._id) { const lines = await db.collection('polineitems').find({ poId: new mongoose.Types.ObjectId(po._id) }).toArray(); lines.forEach((l) => track('polineitems', l._id)); }
    step(C, 'Raise a purchase order', r.success && !!po?._id, r.success ? `${po.poNumber}, total ₹${po.totalAmount}` : r.message);
    if (r.success && Number(po.totalAmount) !== 625) step(C, 'PO total = qty × price', false, `expected 625, got ${po.totalAmount}`);
  }
  if (po?._id) {
    const r = await api('PUT', `/procurement/po/${po._id}/status`, { status: 'Approved' });
    step(C, 'Approve the PO', r.success && r.data?.approvalStatus === 'Approved', r.message || r.data?.approvalStatus);
  }
  if (po?._id) {
    const r = await api('POST', '/receipt/grn', { purchaseOrderId: po._id, materialId: material._id, poQuantity: 50, receivedQuantity: 50, notes: TAG });
    grn = r.data; track('goodsreceipts', grn?._id);
    step(C, 'Receive the goods (GRN)', r.success && !!grn?._id, r.success ? grn.grnNumber : r.message);
    const over = await api('POST', '/receipt/grn', { purchaseOrderId: po._id, materialId: material._id, poQuantity: 50, receivedQuantity: 1, notes: TAG });
    track('goodsreceipts', over.data?._id);
    step(C, 'Refuse receiving more than ordered', !over.success && over.status === 400, over.message?.slice(0, 80));
    // The control must hold even when the caller lies about the ordered quantity.
    const lie = await api('POST', '/receipt/grn', { purchaseOrderId: po._id, materialId: material._id, poQuantity: 9999, receivedQuantity: 1, notes: TAG });
    track('goodsreceipts', lie.data?._id);
    step(C, 'Refuse over-receipt even with a false PO quantity in the request', !lie.success && lie.status === 400, lie.message?.slice(0, 80));
  }
  if (grn?._id) {
    const list = await api('GET', '/receipt/inspection');
    insp = (list.data || []).find((i) => String(i.grnId?._id || i.grnId) === String(grn._id));
    track('qualityinspections', insp?._id);
    step(C, 'A GRN opens an inspection automatically', !!insp, insp ? `${insp.inspectionNumber || insp._id} · ${insp.inspectionStatus}` : 'no inspection found for the GRN');
  }
  if (insp?._id) {
    const bad = await api('PUT', `/receipt/inspection/${insp._id}`, { acceptedQuantity: 60, rejectedQuantity: 0, holdQuantity: 0, inspectorName: TAG, inspectionStatus: 'Completed' });
    step(C, 'Refuse accepting more than was inspected', !bad.success, bad.message?.slice(0, 70));
    const r = await api('PUT', `/receipt/inspection/${insp._id}`, { acceptedQuantity: 48, rejectedQuantity: 2, holdQuantity: 0, inspectorName: TAG, inspectionStatus: 'Completed', remarks: TAG });
    step(C, 'Record the inspection result (48 ok, 2 rejected)', r.success, r.message);
  }
  let stockBefore = 0;
  if (insp?._id) {
    const agg = await db.collection('inventorystocks').aggregate([{ $match: { materialId: new mongoose.Types.ObjectId(material._id), status: 'Active' } }, { $group: { _id: null, q: { $sum: '$quantityAvailable' } } }]).toArray();
    stockBefore = agg[0]?.q || 0;
    const r = await api('POST', '/receipt/inventory/post', { inspectionId: insp._id, warehouseId: warehouse._id });
    const stocks = await db.collection('inventorystocks').find({ sourceGrnId: new mongoose.Types.ObjectId(grn._id) }).toArray();
    stocks.forEach((s) => track('inventorystocks', s._id));
    const txs = await db.collection('inventorytransactions').find({ $or: [{ referenceId: new mongoose.Types.ObjectId(grn._id) }, { grnId: new mongoose.Types.ObjectId(grn._id) }] }).toArray();
    txs.forEach((t) => track('inventorytransactions', t._id));
    step(C, 'Post accepted quantity to stock', r.success, r.message);
    const agg2 = await db.collection('inventorystocks').aggregate([{ $match: { materialId: new mongoose.Types.ObjectId(material._id), status: 'Active' } }, { $group: { _id: null, q: { $sum: '$quantityAvailable' } } }]).toArray();
    const delta = (agg2[0]?.q || 0) - stockBefore;
    step(C, 'Stock on hand rose by exactly the accepted 48', delta === 48, `rose by ${delta}`);
    const again = await api('POST', '/receipt/inventory/post', { inspectionId: insp._id, warehouseId: warehouse._id });
    step(C, 'Refuse posting the same GRN twice', !again.success, again.message?.slice(0, 70));
    const poNow = await api('GET', '/procurement/po');
    const poRow = (poNow.data || []).find((p) => p._id === po._id);
    step(C, 'PO shows the received quantity', ['Partially Delivered', 'Delivered', 'Partial'].includes(poRow?.deliveryStatus) || (poRow?.items || poRow?.lines || []).some((l) => l.receivedQty > 0), `deliveryStatus=${poRow?.deliveryStatus}`);
  }
  if (po?._id) {
    const r = await api('POST', '/finance/v2/ap/bills', { Vendor_ID: vendor._id, Vendor_Invoice_Number: TAG + '-INV', Bill_Date: today, Due_Date: plusDays(30), Terms_ID: 'Net 30', PO_Reference_ID: po._id, lineItems: [{ Description: TAG, Quantity: 48, Unit_Price: 12.5, PO_Reference_ID: po._id }] });
    bill = r.data; track('vendorbills', bill?._id);
    if (bill?._id) (await db.collection('billlineitems').find({ Bill_ID: new mongoose.Types.ObjectId(bill._id) }).toArray()).forEach((l) => track('billlineitems', l._id));
    step(C, 'Record the supplier bill against the PO', r.success && !!bill?._id, r.success ? `${bill.Bill_Number} ₹${bill.Total_Amount}` : r.message);
    const dup = await api('POST', '/finance/v2/ap/bills', { Vendor_ID: vendor._id, Vendor_Invoice_Number: TAG + '-INV', Bill_Date: today, Due_Date: plusDays(30), Terms_ID: 'Net 30', lineItems: [{ Description: TAG, Quantity: 1, Unit_Price: 1 }] });
    track('vendorbills', dup.data?._id);
    step(C, 'Refuse the same supplier invoice number twice', dup.status === 409, dup.message?.slice(0, 60));
  }
  if (bill?._id) {
    const r = await api('POST', '/finance/v2/ap/payments', { Vendor_ID: vendor._id, Payment_Date: today, Total_Paid: 300, Payment_Method: 'NEFT', Reference_Number: TAG });
    payment = r.data; track('vendorpayments', payment?._id);
    step(C, 'Record a part payment of ₹300', r.success && !!payment?._id, r.message);
    if (payment?._id) {
      const a = await api('POST', `/finance/v2/ap/payments/${payment._id}/apply`, { Bill_ID: bill._id, Applied_Amount: 300 });
      (await db.collection('billpaymentapplications').find({ Payment_ID: new mongoose.Types.ObjectId(payment._id) }).toArray()).forEach((x) => track('billpaymentapplications', x._id));
      step(C, 'Apply it to the bill', a.success, a.message);
      const b = await db.collection('vendorbills').findOne({ _id: new mongoose.Types.ObjectId(bill._id) });
      step(C, 'Bill now reads Partially Paid', b?.Status === 'Partially Paid', `Status=${b?.Status}`);
      const over = await api('POST', `/finance/v2/ap/payments/${payment._id}/apply`, { Bill_ID: bill._id, Applied_Amount: 5000 });
      step(C, 'Refuse applying more than the payment holds', !over.success, over.message?.slice(0, 70));
    }
  }

  // ── Order-to-cash ──────────────────────────────────────────────────────
  console.log('\nORDER-TO-CASH');
  const O = 'O2C';
  let so, line, plan, wo, output, invoice, receipt;
  {
    const r = await api('POST', '/sales/so-headers', { customerId: customer._id, orderDate: today, deliveryCommitmentDate: plusDays(14), customerPONumber: TAG, status: 'Draft' });
    so = r.data; track('soheaders', so?._id);
    step(O, 'Raise a sales order', r.success && !!so?._id, r.success ? so.orderNumber : r.message);
  }
  if (so?._id) {
    const r = await api('POST', `/sales/so-headers/${so._id}/lines`, { productId: product._id, orderedQuantity: 100, unitPrice: 42 });
    line = r.data; track('solineitems', line?._id);
    step(O, 'Add a line (100 × ₹42)', r.success && !!line?._id, r.message);
    const hdr = await db.collection('soheaders').findOne({ _id: new mongoose.Types.ObjectId(so._id) });
    step(O, 'Order total recomputed from its lines', Number(hdr?.subTotal) === 4200 || Number(hdr?.grandTotal) >= 4200, `subTotal=${hdr?.subTotal} grandTotal=${hdr?.grandTotal}`);
    const neg = await api('POST', `/sales/so-headers/${so._id}/lines`, { productId: product._id, orderedQuantity: -5, unitPrice: 42 });
    track('solineitems', neg.data?._id);
    step(O, 'Refuse a negative quantity', !neg.success, neg.message?.slice(0, 60));
  }
  if (so?._id) {
    const r = await api('PUT', `/sales/so-headers/${so._id}/status`, { status: 'Approved' });
    step(O, 'Approve the order', r.success && ['Approved', 'Credit Hold'].includes(r.data?.status), r.message || r.data?.status);
    if (r.data?.status === 'Credit Hold') step(O, 'Order went on credit hold (customer over limit) — acceptable', true);
  }
  if (plant?._id) {
    const r = await api('POST', '/production/v2/production-plan', { header: { Plan_Type: 'Make-to-Order', Priority: 'Normal', Plant_ID: plant._id, Notes: TAG }, details: [{ Line_Sequence_Number: 10, Material_ID: material._id, Target_Quantity: 100, Planned_Start_Date: today, Planned_End_Date: plusDays(7) }] });
    plan = r.data?.header || r.data; track('planheaders', plan?._id);
    if (plan?._id) {
      (await db.collection('plandetails').find({ Plan_ID: new mongoose.Types.ObjectId(plan._id) }).toArray()).forEach((d) => track('plandetails', d._id));
      (await db.collection('productionplans').find({ $or: [{ planHeaderId: new mongoose.Types.ObjectId(plan._id) }, { notes: TAG }] }).toArray()).forEach((d) => track('productionplans', d._id));
    }
    step(O, 'Create a production plan', r.success && !!plan?._id, r.success ? (plan.Plan_Number || plan._id) : r.message);
    const bad = await api('POST', '/production/v2/production-plan', { header: { Plan_Type: 'Make-to-Order', Priority: 'Normal', Plant_ID: plant._id }, details: [{ Line_Sequence_Number: 10, Material_ID: material._id, Target_Quantity: 100, Planned_Start_Date: plusDays(7), Planned_End_Date: today }] });
    track('planheaders', bad.data?.header?._id || bad.data?._id);
    step(O, 'Refuse a plan whose end is before its start', !bad.success, bad.message?.slice(0, 70));
  } else step(O, 'Create a production plan', false, 'no plant configured');
  if (plan?._id) {
    const v = await api('PUT', `/production/v2/production-plan/${plan._id}/validate`, {});
    step(O, 'Validate capacity', v.success, v.message || v.data?.Capacity_Status);
    const a = await api('PUT', `/production/v2/production-plan/${plan._id}/approve`, { comments: TAG });
    (await db.collection('approvalroutings').find({ Approver_Comments: TAG }).toArray()).forEach((d) => track('approvalroutings', d._id));
    (await db.collection('capacityvalidations').find({ Plan_ID: new mongoose.Types.ObjectId(plan._id) }).toArray()).forEach((d) => track('capacityvalidations', d._id));
    step(O, 'Approve the plan', a.success, a.message || a.data?.Status);
  }
  if (plan?._id) {
    const r = await api('POST', '/production/v2/work-orders/generate', { Source_Plan_ID: plan._id, Plant_ID: plant._id, details: [{ Material_ID: material._id, Target_Quantity: 100 }] });
    wo = r.data?.header || r.data; track('woheaders', wo?._id);
    if (wo?._id) {
      (await db.collection('wodetails').find({ WO_ID: new mongoose.Types.ObjectId(wo._id) }).toArray()).forEach((d) => track('wodetails', d._id));
      (await db.collection('workorders').find({ $or: [{ woHeaderId: new mongoose.Types.ObjectId(wo._id) }, { workOrderNumber: wo.WO_Number }] }).toArray()).forEach((d) => track('workorders', d._id));
    }
    step(O, 'Generate a work order from the plan', r.success && !!wo?._id, r.success ? wo.WO_Number : r.message);
  }
  if (wo?._id) {
    const early = await api('POST', '/production/v2/output', { WO_ID: wo._id });
    track('outputheaders', early.data?._id);
    step(O, 'Refuse output against a work order not yet released', !early.success, early.message?.slice(0, 70));
    const r = await api('PUT', `/production/v2/work-orders/${wo._id}/release`, {});
    step(O, 'Release the work order to the floor', r.success, r.message || r.data?.Status);
  }
  if (wo?._id) {
    const r = await api('POST', '/production/v2/output', { WO_ID: wo._id });
    output = r.data; track('outputheaders', output?._id);
    if (output?._id) (await db.collection('yielddetails').find({ Output_ID: new mongoose.Types.ObjectId(output._id) }).toArray()).forEach((d) => track('yielddetails', d._id));
    step(O, 'Open an output record for the work order', r.success && !!output?._id, r.message);
  }
  if (output?._id) {
    const yd = await db.collection('yielddetails').findOne({ Output_ID: new mongoose.Types.ObjectId(output._id) });
    step(O, 'Output record carries a yield line with the target', !!yd && Number(yd.Target_Quantity) === 100, `target=${yd?.Target_Quantity}`);
    if (yd) {
      const noCode = await api('PUT', `/production/v2/output/${output._id}/post`, { yields: [{ yieldDetailId: yd._id, Good_Quantity: 95, Rejected_Quantity: 5, Scrap_Quantity: 0 }] });
      step(O, 'Refuse rejects without a defect reason', !noCode.success, noCode.message?.slice(0, 70));
      const stockB = await db.collection('inventorystocks').countDocuments({ notes: new RegExp(TAG) });
      const r = await api('PUT', `/production/v2/output/${output._id}/post`, { yields: [{ yieldDetailId: yd._id, Good_Quantity: 100, Rejected_Quantity: 0, Scrap_Quantity: 0 }] });
      step(O, 'Post 100 good pieces', r.success, r.message);
      (await db.collection('inventoryputaways').find({ Yield_Detail_ID: yd._id }).toArray()).forEach((d) => track('inventoryputaways', d._id));
      const fg = await db.collection('inventorystocks').find({ createdAt: { $gte: new Date(Date.now() - 60000) }, materialId: new mongoose.Types.ObjectId(material._id), sourceGrnId: { $exists: false } }).toArray();
      fg.forEach((s) => track('inventorystocks', s._id));
      step(O, 'Good pieces landed in stock', fg.some((s) => Number(s.quantityAvailable) === 100), `${fg.length} new batch(es), qty ${fg.map((s) => s.quantityAvailable).join(',')} (before: ${stockB})`);
      const again = await api('PUT', `/production/v2/output/${output._id}/post`, { yields: [{ yieldDetailId: yd._id, Good_Quantity: 100, Rejected_Quantity: 0, Scrap_Quantity: 0 }] });
      step(O, 'Refuse posting the same output twice', !again.success, again.message?.slice(0, 60));
      const woNow = await db.collection('woheaders').findOne({ _id: new mongoose.Types.ObjectId(wo._id) });
      step(O, 'Work order progress reflects the output', ['In Progress', 'Completed'].includes(woNow?.Status) || Number(woNow?.Overall_Progress_Percentage) > 0, `Status=${woNow?.Status} progress=${woNow?.Overall_Progress_Percentage}`);
    }
  }
  if (so?._id) {
    const r = await api('POST', '/dispatch/v2/planning', { Sales_Order_ID: so._id, Planned_Date: plusDays(2) });
    track('deliveryplans', r.data?._id);
    step(O, 'Plan the delivery', r.success, r.message);
  }
  {
    const r = await api('POST', '/finance/v2/ar/invoices', { Customer_ID: customer._id, Issue_Date: today, Due_Date: plusDays(30), Terms_ID: 'Net 30', lineItems: [{ Description: TAG, Quantity: 100, Unit_Price: 42 }] });
    invoice = r.data; track('customerinvoices', invoice?._id);
    if (invoice?._id) (await db.collection('invoicelineitems').find({ Invoice_ID: new mongoose.Types.ObjectId(invoice._id) }).toArray()).forEach((l) => track('invoicelineitems', l._id));
    step(O, 'Raise the customer invoice', r.success && !!invoice?._id, r.success ? `${invoice.Invoice_Number} ₹${invoice.Total_Amount}` : r.message);
    if (r.success) step(O, 'Invoice total includes GST on ₹4,200', Number(invoice.Total_Amount) > 4200, `₹${invoice.Total_Amount}`);
    const back = await api('POST', '/finance/v2/ar/invoices', { Customer_ID: customer._id, Issue_Date: today, Due_Date: plusDays(-5), lineItems: [{ Description: TAG, Quantity: 1, Unit_Price: 1 }] });
    track('customerinvoices', back.data?._id);
    step(O, 'Refuse a due date before the issue date', !back.success, back.message?.slice(0, 60));
  }
  if (invoice?._id) {
    const r = await api('POST', '/finance/v2/ar/receipts', { Customer_ID: customer._id, Payment_Date: today, Total_Received: 1000, Payment_Method: 'UPI', Reference_Number: TAG });
    receipt = r.data; track('paymentreceipts', receipt?._id);
    step(O, 'Record a receipt of ₹1,000', r.success && !!receipt?._id, r.message);
    if (receipt?._id) {
      const a = await api('POST', `/finance/v2/ar/receipts/${receipt._id}/apply`, { Invoice_ID: invoice._id, Applied_Amount: 1000 });
      (await db.collection('paymentapplications').find({ Receipt_ID: new mongoose.Types.ObjectId(receipt._id) }).toArray()).forEach((x) => track('paymentapplications', x._id));
      step(O, 'Apply it to the invoice', a.success, a.message);
      const inv = await db.collection('customerinvoices').findOne({ _id: new mongoose.Types.ObjectId(invoice._id) });
      step(O, 'Invoice now reads Partially Paid', inv?.Status === 'Partially Paid', `Status=${inv?.Status}`);
      const over = await api('POST', `/finance/v2/ar/receipts/${receipt._id}/apply`, { Invoice_ID: invoice._id, Applied_Amount: 9999 });
      step(O, 'Refuse applying more than was received', !over.success, over.message?.slice(0, 60));
    }
  }

  // ── Quality + maintenance ──────────────────────────────────────────────
  console.log('\nQUALITY & MAINTENANCE');
  const Q = 'Q&M';
  {
    const r = await api('POST', '/quality/v2/incoming', { GRN_ID: grn?._id, Vendor_ID: vendor._id, Material_ID: material._id, Received_Quantity: 50, Sample_Size: 5 });
    const q = r.data?.header || r.data; track('incominginspectionheaders', q?._id);
    if (q?._id) (await db.collection('incomingmaterialsamplings').find({ Insp_ID: new mongoose.Types.ObjectId(q._id) }).toArray()).forEach((d) => track('incomingmaterialsamplings', d._id));
    step(Q, 'Open an incoming inspection', r.success && !!q?._id, r.message);
    if (q?._id) {
      const u = await api('PUT', `/quality/v2/incoming/${q._id}/results`, { Accepted_Quantity: 48, Rejected_Quantity: 2, Overall_Status: 'Conditional Accept', Defect_Code_ID: 'Material Defect', Action_Required: 'Accept on Deviation', Evaluation_Notes: TAG });
      (await db.collection('incomingdefectlogs').find({ createdAt: { $gte: new Date(Date.now() - 60000) } }).toArray()).forEach((d) => track('incomingdefectlogs', d._id));
      (await db.collection('incomingvendorevaluations').find({ Insp_ID: new mongoose.Types.ObjectId(q._id) }).toArray()).forEach((d) => track('incomingvendorevaluations', d._id));
      step(Q, 'Record the result (2 rejected, accept on deviation)', u.success, u.message);
      const bad = await api('PUT', `/quality/v2/incoming/${q._id}/results`, { Accepted_Quantity: 60, Rejected_Quantity: 0, Overall_Status: 'Pass' });
      step(Q, 'Refuse accepting more than received', !bad.success, bad.message?.slice(0, 70));
    }
  }
  if (machine?._id) {
    const r = await api('POST', '/maintenance/v2/breakdown', { Machine_ID: machine._id, Reported_Issue: TAG + ' test breakdown' });
    const b = r.data?.header || r.data; track('breakdownincidentheaders', b?._id);
    step(Q, 'Report a breakdown', r.success && !!b?._id, r.message);
    if (b?._id) {
      const l = await api('POST', `/maintenance/v2/breakdown/${b._id}/repair-log`, { Action_Taken: TAG, Labor_Hours_Spent: 1.5 });
      (await db.collection('repairactionlogs').find({ Incident_ID: new mongoose.Types.ObjectId(b._id) }).toArray()).forEach((d) => track('repairactionlogs', d._id));
      step(Q, 'Log the repair', l.success, l.message);
      const s = await api('PUT', `/maintenance/v2/breakdown/${b._id}/status`, { Status: 'Resolved', Current_Status: 'Resolved', status: 'Resolved' });
      step(Q, 'Resolve it', s.success, s.message);
      const row = await db.collection('breakdownincidentheaders').findOne({ _id: new mongoose.Types.ObjectId(b._id) });
      const st = row?.Current_Status || row?.Status || row?.status;
      step(Q, 'Breakdown reads Resolved', /resolved|closed/i.test(String(st)), `status=${st}`);
      const ms = await db.collection('machinestates').findOne({ machineId: new mongoose.Types.ObjectId(machine._id) }) || await db.collection('shopfloormachines').findOne({ machineId: new mongoose.Types.ObjectId(machine._id) });
      if (ms) step(Q, 'Machine is not left flagged as in maintenance', ms.status !== 'Maintenance', `shop-floor status=${ms.status}`);
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────
  const fails = results.filter((r) => !r.ok);
  console.log(`\nFLOWS — ${results.length - fails.length} of ${results.length} steps behaved, ${fails.length} did not\n`);
  fails.forEach((f) => console.log(`  ✗ [${f.chain}] ${f.step}${f.note ? ' — ' + f.note : ''}`));

  // ── Cleanup ────────────────────────────────────────────────────────────
  console.log(`\nRemoving ${created.length} test document(s)…`);
  const byColl = {};
  for (const c of created) { if (!c.id || c.id === 'undefined') continue; (byColl[c.collection] = byColl[c.collection] || []).push(new mongoose.Types.ObjectId(c.id)); }
  for (const [coll, ids] of Object.entries(byColl)) {
    const r = await db.collection(coll).deleteMany({ _id: { $in: ids } });
    if (r.deletedCount) console.log(`  ${coll}: ${r.deletedCount}`);
  }
  // Anything tagged that slipped through untracked.
  for (const coll of ['inventorystocks', 'inventorytransactions', 'goodsreceipts', 'qualityinspections', 'billlineitems', 'invoicelineitems', 'journalentries', 'incomingdefectlogs', 'auditlogs', 'repairactionlogs', 'approvalroutings', 'breakdownincidentheaders']) {
    const r = await db.collection(coll).deleteMany({ $or: [{ notes: new RegExp(TAG) }, { remarks: new RegExp(TAG) }, { Description: new RegExp(TAG) }, { description: new RegExp(TAG) }, { inspectorName: TAG }, { Reference_Number: TAG }, { Action_Taken: TAG }, { Approver_Comments: TAG }, { Reported_Issue: new RegExp(TAG) }] });
    if (r.deletedCount) console.log(`  ${coll} (tagged): ${r.deletedCount}`);
  }
  await mongoose.disconnect();
  process.exit(fails.length ? 1 : 0);
})().catch(async (e) => { console.error('audit crashed:', e); try { await mongoose.disconnect(); } catch { /* */ } process.exit(2); });
