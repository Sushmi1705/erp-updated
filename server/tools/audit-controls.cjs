#!/usr/bin/env node
/* Tries to break the controls a finance director or an auditor would ask about.
 *
 * Reading the code tells you a check was written. Only running it tells you the
 * check fires — a guard that reads the wrong field, sits behind a condition
 * that is never true, or throws before it reaches the comparison all look
 * correct in review and stop nothing in production.
 *
 * Each case states what it attempts and what a system with the control would
 * do about it. Nothing here is destructive by design: anything that succeeds
 * (which means the control did NOT hold) is recorded so it can be cleaned up.
 *
 *   node tools/audit-controls.cjs            # against a local server on 5097
 *   AUDIT_BASE_URL=http://127.0.0.1:8083 node tools/audit-controls.cjs
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
// An explicit URL beats a port flag here: it works unchanged against a local
// server, the deployed one over a tunnel, or CI, with no argument parsing to
// get wrong.
//   AUDIT_BASE_URL=http://127.0.0.1:8083 node tools/audit-controls.cjs
const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8083';

const created = [];   // { collection, id } — anything a failed control let through
const results = [];

const record = (name, held, detail, severity = 'high') =>
  results.push({ name, held, detail, severity });

let token;
const api = async (method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, body: json, ok: res.ok };
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const login = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
  });
  const lj = await login.json();
  token = lj.token || lj.data?.token;
  if (!token) throw new Error('login failed: ' + JSON.stringify(lj).slice(0, 200));

  // ── 1. Credit limit ────────────────────────────────────────────────────
  // Selling more to a customer than their agreed credit limit allows is how a
  // company ends up unable to collect. The order should be refused.
  {
    const customer = await db.collection('customers').findOne({ creditLimit: { $gt: 0 } });
    const product = await db.collection('products').findOne({});
    const wild = (customer.creditLimit || 0) * 50 + 10_000_000;
    const r = await api('POST', '/api/sales/so-headers', {
      orderNumber: `SO-CTRL-${Date.now().toString(36).toUpperCase()}`,
      customerId: String(customer._id),
      orderDate: new Date().toISOString(),
      subTotal: wild, totalTaxAmount: 0, grandTotal: wild, status: 'Draft'
    });
    if (r.ok) {
      created.push({ collection: 'soheaders', id: r.body?.data?._id });
      record('Credit limit on a sales order', false,
        `Booked ₹${wild.toLocaleString('en-IN')} against ${customer.name}, whose limit is ₹${(customer.creditLimit).toLocaleString('en-IN')}.`);
    } else {
      record('Credit limit on a sales order', true, `Refused: ${String(r.body?.message).slice(0, 110)}`);
    }
    void product;
  }

  // ── 2. Over-receipt against a purchase order ───────────────────────────
  // Receiving far more than was ordered is either a keying error or a fraud
  // route; either way the store should not silently accept it.
  {
    const poLine = await db.collection('polineitems').findOne({ orderQty: { $gt: 0 } });
    const po = await db.collection('poheaders').findOne({ _id: poLine.poId });
    const absurd = (poLine.orderQty || 0) * 100;
    const r = await api('POST', '/api/receipt/grn', {
      purchaseOrderId: String(po._id),
      vendorId: String(po.vendorId),
      materialId: String(poLine.materialId),
      poQuantity: poLine.orderQty,
      receivedQuantity: absurd,
      receiptDate: new Date().toISOString(),
      status: 'Received'
    });
    if (r.ok) {
      created.push({ collection: 'goodsreceipts', id: r.body?.data?._id });
      record('Over-receipt against a purchase order', false,
        `Accepted ${absurd.toLocaleString('en-IN')} against an order for ${poLine.orderQty.toLocaleString('en-IN')} — 100x.`);
    } else {
      record('Over-receipt against a purchase order', true, `Refused: ${String(r.body?.message).slice(0, 110)}`);
    }
  }

  // ── 3. Duplicate vendor bill ───────────────────────────────────────────
  // Paying the same supplier invoice twice is the classic accounts-payable
  // loss. The second entry of the same bill number should be refused.
  {
    const vendor = await db.collection('vendors').findOne({});
    const marker = 'CTRL-DUP-' + Date.now().toString(36).toUpperCase();
    // Enter the same supplier invoice number twice. The first must succeed,
    // the second must not.
    const first = await api('POST', '/api/finance/v2/ap/bills', {
      Vendor_ID: String(vendor._id),
      Vendor_Invoice_Number: marker,
      Bill_Date: new Date().toISOString(),
      Due_Date: new Date(Date.now() + 2592e6).toISOString(),
      lineItems: [{ Line_Sequence: 1, Description: 'duplicate control test', Quantity: 1, Unit_Price: 1000 }]
    });
    if (first.ok) created.push({ collection: 'vendorbills', id: first.body?.data?._id });
    if (!first.ok) record('Duplicate vendor bill', true, 'Could not seed the first bill — inconclusive', 'skip');
    else {
      const r = await api('POST', '/api/finance/v2/ap/bills', {
        Vendor_ID: String(vendor._id),
        Vendor_Invoice_Number: marker,            // deliberately the same again
        Bill_Date: new Date().toISOString(),
        Due_Date: new Date(Date.now() + 2592e6).toISOString(),
        lineItems: [{ Line_Sequence: 1, Description: 'duplicate control test', Quantity: 1, Unit_Price: 1000 }]
      });
      if (r.ok) {
        created.push({ collection: 'vendorbills', id: r.body?.data?._id });
        record('Duplicate vendor bill', false,
          `Accepted the same supplier invoice ${marker} twice — the bill can be paid twice.`);
      } else {
        record('Duplicate vendor bill', true, `Refused: ${String(r.body?.message).slice(0, 110)}`);
      }
    }
  }

  // ── 4. Backdating into a closed period ─────────────────────────────────
  // Once a month is reported, posting into it changes numbers someone has
  // already signed. A journal dated two years back should not post.
  {
    // Control accounts refuse manual journals outright, which would mask the
    // result — pick accounts a manual entry is actually allowed to touch.
    const coa = await db.collection('chartofaccounts').find({ Is_Control_Account: { $ne: true } }).limit(2).toArray();
    if (coa.length < 2) record('Posting into a closed period', true, 'Not enough accounts to test', 'skip');
    else {
      const r = await api('POST', '/api/finance/v2/gl/entries', {
        Entry_Date: '2023-04-01T00:00:00.000Z',
        Description: 'control test — backdated entry',
        Source_Module: 'Manual',
        lines: [
          { Account_ID: String(coa[0]._id), Type: 'Debit', Amount: 1000 },
          { Account_ID: String(coa[1]._id), Type: 'Credit', Amount: 1000 }
        ]
      });
      if (r.ok) {
        created.push({ collection: 'journalentries', id: r.body?.data?._id });
        // April 2023 is open. Remove the draft this test just put there (a
        // month with a draft in it cannot be closed — that rule is right),
        // close it, try again, then put it back as it was.
        await db.collection('journalentries').deleteOne({ _id: new mongoose.Types.ObjectId(String(r.body?.data?._id)) });
        created.pop();
        const wasClosed = await db.collection('accountingperiods').findOne({ key: '2023-04', status: 'Closed' });
        const c = await api('PUT', '/api/finance/v2/periods/2023-04/close', { note: 'control test' });
        if (!c.ok) {
          record('Posting into a closed period', false, `Could not close April 2023 to test: ${String(c.body?.message).slice(0, 100)}`, 'medium');
        } else {
          const again = await api('POST', '/api/finance/v2/gl/entries', {
            Entry_Date: '2023-04-15T00:00:00.000Z',
            Description: 'control test — backdated entry into closed month',
            Source_Module: 'Manual',
            lines: [
              { Account_ID: String(coa[0]._id), Type: 'Debit', Amount: 1000 },
              { Account_ID: String(coa[1]._id), Type: 'Credit', Amount: 1000 }
            ]
          });
          if (again.ok) {
            created.push({ collection: 'journalentries', id: again.body?.data?._id });
            record('Posting into a closed period', false, 'April 2023 was closed and a journal dated inside it was still accepted.', 'high');
          } else {
            record('Posting into a closed period', true, `Refused once the month was closed: ${String(again.body?.message).slice(0, 100)}`);
          }
          if (!wasClosed) {
            await api('PUT', '/api/finance/v2/periods/2023-04/reopen', { note: 'control test — restoring' });
            await db.collection('accountingperiods').deleteOne({ key: '2023-04' });
          }
        }
      } else {
        record('Posting into a closed period', true, `Refused: ${String(r.body?.message).slice(0, 110)}`);
      }
    }
  }

  // ── 5. Unbalanced journal entry ────────────────────────────────────────
  // Debits must equal credits. This one is bookkeeping's oldest rule.
  {
    const coa = await db.collection('chartofaccounts').find({ Is_Control_Account: { $ne: true } }).limit(2).toArray();
    const r = await api('POST', '/api/finance/v2/gl/entries', {
      Entry_Date: new Date().toISOString(),
      Description: 'control test — unbalanced',
      Source_Module: 'Manual',
      lines: [
        { Account_ID: String(coa[0]._id), Type: 'Debit', Amount: 5000 },
        { Account_ID: String(coa[1]._id), Type: 'Credit', Amount: 3000 }
      ]
    });
    if (r.ok) {
      created.push({ collection: 'journalentries', id: r.body?.data?._id });
      record('Debits must equal credits', false, 'Accepted a journal with ₹5,000 debit against ₹3,000 credit.');
    } else {
      record('Debits must equal credits', true, `Refused: ${String(r.body?.message).slice(0, 110)}`);
    }
  }

  // ── 6. Issuing stock that is not there ─────────────────────────────────
  // Stock going negative means the store record and the physical rack have
  // parted company.
  {
    const stock = await db.collection('inventorystocks').findOne({ status: 'Active', quantityAvailable: { $gt: 0 } });
    const ah = await db.collection('allocationheaders').findOne({});
    const reqDoc = ah ? await db.collection('componentrequirements').findOne({ Allocation_ID: ah._id }) : null;
    if (!reqDoc) record('Issuing more stock than exists', true, 'No component requirement available to test through', 'skip');
    else {
      const wo = await db.collection('woheaders').findOne({ _id: ah.WO_ID });
      const r = await api('PUT', `/api/production/v2/material-allocation/${wo._id}/process`, {
        allocations: [{ reqId: String(reqDoc._id), action: 'Issue', quantity: (stock.quantityAvailable || 0) * 1000 + 999999 }]
      });
      if (r.ok) {
        record('Issuing more stock than exists', false, 'Issued far more than the store holds — stock can go negative.');
      } else {
        record('Issuing more stock than exists', true, `Refused: ${String(r.body?.message).slice(0, 110)}`);
      }
    }
  }

  // ── 7. Negative price / quantity on a sales order line ─────────────────
  // A negative line is how a discount gets hidden, or a credit note gets
  // raised without anyone approving one.
  {
    const so = await db.collection('soheaders').findOne({});
    const product = await db.collection('products').findOne({});
    const r = await api('POST', `/api/sales/so-headers/${so._id}/lines`, {
      lineSequence: 9990, productId: String(product._id),
      orderedQuantity: -500, unitPrice: -25, lineTotal: 12500
    });
    if (r.ok) {
      created.push({ collection: 'solineitems', id: r.body?.data?._id });
      record('Negative quantity or price on an order line', false,
        'Accepted a line for -500 units at -₹25.', 'medium');
    } else {
      record('Negative quantity or price on an order line', true, `Refused: ${String(r.body?.message).slice(0, 110)}`);
    }
  }

  // ── report ─────────────────────────────────────────────────────────────
  const held = results.filter(r => r.held && r.severity !== 'skip');
  const failed = results.filter(r => !r.held);
  const skipped = results.filter(r => r.severity === 'skip');

  console.log(`\nCONTROLS — ${held.length} held, ${failed.length} did not${skipped.length ? `, ${skipped.length} skipped` : ''}\n`);
  for (const r of results) {
    const mark = r.severity === 'skip' ? '–' : r.held ? '✓' : '✗';
    console.log(`  ${mark} ${r.name}`);
    console.log(`      ${r.detail}`);
  }

  // Line items are written by the controller, not returned to us, so they are
  // matched on the marker text rather than tracked by id — an earlier run left
  // three of them behind.
  const strayLines = await db.collection('billlineitems').deleteMany({ Description: 'duplicate control test' });
  if (strayLines.deletedCount) console.log(`\nRemoved ${strayLines.deletedCount} test bill line(s)`);

  if (created.length) {
    console.log(`\nCleaning up ${created.length} record(s) a failed control let through:`);
    for (const c of created) {
      if (!c.id) continue;
      const res = await db.collection(c.collection).deleteOne({ _id: new mongoose.Types.ObjectId(String(c.id)) });
      console.log(`  removed ${res.deletedCount} from ${c.collection}`);
    }
  }

  await mongoose.disconnect();
  process.exit(failed.length ? 1 : 0);
})().catch(err => { console.error(err); process.exit(2); });
