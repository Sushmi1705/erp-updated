#!/usr/bin/env node
/* Puts back what the first screen audit changed on 2026-09-29.
 *
 * exercise-screens.cjs presses every control on every screen. Its first
 * runs (18:00–19:00 UTC on 2026-09-29) pressed several controls that change
 * state without a form in between — "Advance to …" on sales orders and
 * inquiries, "Move to the next status" on an engineering change, "Make
 * inactive", two "Sample … demand" mock buttons and a mock goods-receipt
 * webhook. The script now skips all of those and the mock buttons are gone.
 *
 * This reverses each change, from the audit log and the values the records
 * held before (the seed logic for delivery releases encodes each order's
 * status at seed time). Every write is guarded: a record is only changed if
 * it still holds the value the audit left, so running this twice is safe,
 * and so is running it after someone has legitimately moved a record on.
 *
 *   cd /srv/www/precision-erp/server
 *   node tools/undo-screen-audit-2026-09-29.cjs          # dry run: lists what it would do
 *   node tools/undo-screen-audit-2026-09-29.cjs --apply  # does it
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const APPLY = process.argv.includes('--apply');
const oid = (s) => new mongoose.Types.ObjectId(s);

// [collection, id, label, field(s) the audit left, field(s) to restore]
const RESTORES = [
  // Sales orders — statuses before the "Advance to …" presses at 18:01 and 18:18 UTC
  ['soheaders', '6a84e9beb2fa6464aeaa143e', 'SO-2026-1004', { status: 'Pending Approval' }, { status: 'Draft' }],
  ['soheaders', '6a84e9beb2fa6464aeaa1446', 'SO-2026-1008', { status: 'Partially Shipped' }, { status: 'Approved' }],
  ['soheaders', '6a84e9bfb2fa6464aeaa1449', 'SO-2026-1009', { status: 'Completed' }, { status: 'Processing' }],
  ['soheaders', '6a84e9bfb2fa6464aeaa144b', 'SO-2026-1010', { status: 'Completed' }, { status: 'Partially Shipped' }],
  ['soheaders', '6a84e9bfb2fa6464aeaa144f', 'SO-2026-1011', { status: 'Processing' }, { status: 'Draft' }],
  // Inquiries — seeded statuses (server/seeds/10-sales.cjs rows 4, 11, 13)
  ['inquiryheaders', '6a84f57f37630b97bd3c02c1', 'INQ-2026-0004', { status: 'Closed-Won' }, { status: 'Active' }],
  ['inquiryheaders', '6a84f57f37630b97bd3c02c8', 'INQ-2026-0011', { status: 'Feasibility Check' }, { status: 'New' }],
  ['inquiryheaders', '6a84f57f37630b97bd3c02ca', 'INQ-2026-0013', { status: 'Active' }, { status: 'New' }],
  // Engineering change — seeded 'Submitted' (server/seeds/80-engineering-planning.cjs)
  ['ecmheaders', '6a84f6da9070edd27d8bd41d', 'ECR-2026-004', { status: 'In Review' }, { status: 'Submitted' }],
  // "Make inactive" pressed on the Company and Product screens
  ['costcenters', '6aa0d2267b9828cd3e8d96f2', 'cost centre "aj"', { status: 'Inactive' }, { status: 'Active' }],
  ['productcategories', '6a84e9bab2fa6464aeaa13e6', 'product category "Non-Automotive Parts"', { isActive: false }, { isActive: true, status: 'Active' }]
];

// Rows created by mock buttons: fake capacity demand and a productivity metric.
const DELETES = [
  ['loaddetails', '6abc015172a0a8f422251352', 'machine load from "Sample work order demand" (work order id is not a real order)'],
  ['laborloaddetails', '6abc016072a0a8f422251355', 'labour load from "Sample operator demand"'],
  ['performancemetrics', '6abc0515e1ef8883186fbfaf', 'productivity metric from "Work Out Output" pressed on a seeded operator']
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  let planned = 0, done = 0;

  console.log(APPLY ? 'Applying.' : 'Dry run — nothing is written. Add --apply to do it.');
  console.log('\nStatus restores:');
  for (const [col, id, label, left, restore] of RESTORES) {
    const doc = await db.collection(col).findOne({ _id: oid(id) });
    if (!doc) { console.log(`  – ${label}: not found, skipped`); continue; }
    const stillAsLeft = Object.entries(left).every(([k, v]) => doc[k] === v);
    if (!stillAsLeft) { console.log(`  – ${label}: now ${JSON.stringify(Object.fromEntries(Object.keys(left).map(k => [k, doc[k]])))}, not what the audit left — skipped`); continue; }
    planned++;
    console.log(`  • ${label}: ${JSON.stringify(left)} → ${JSON.stringify(restore)}`);
    if (APPLY) {
      await db.collection(col).updateOne({ _id: oid(id) }, { $set: { ...restore, updatedAt: new Date() } });
      await db.collection('auditlogs').insertOne({ action: 'SYSTEM_RESTORE', module: col, recordId: oid(id), changedBy: null, newValue: { ...restore, reason: 'Reversed a state change made by the screen audit on 2026-09-29' }, createdAt: new Date(), updatedAt: new Date() });
      done++;
    }
  }

  console.log('\nMRP purchase suggestions dismissed by the mock webhook (18:19 UTC):');
  const ids = (await db.collection('auditlogs').find({ action: 'SYSTEM_INVALIDATE', module: 'RecommendationRecord', createdAt: { $gte: new Date('2026-09-29T18:19:00Z'), $lte: new Date('2026-09-29T18:20:30Z') } }).project({ recordId: 1 }).toArray()).map(a => a.recordId);
  const recFilter = { _id: { $in: ids }, status: 'Dismissed', actionType: 'Cancel' };
  const recs = await db.collection('recommendationrecords').find(recFilter).project({ _id: 1 }).toArray();
  console.log(`  • ${recs.length} of ${ids.length} still dismissed → Pending / Create New`);
  planned += recs.length;
  if (APPLY && recs.length) {
    const r = await db.collection('recommendationrecords').updateMany(recFilter, { $set: { status: 'Pending', actionType: 'Create New', updatedAt: new Date() } });
    await db.collection('auditlogs').insertMany(recs.map(a => ({ action: 'SYSTEM_RESTORE', module: 'RecommendationRecord', recordId: a._id, changedBy: null, newValue: { status: 'Pending', actionType: 'Create New', reason: 'Reversed the mock goods-receipt webhook fired by the screen audit on 2026-09-29; the mock has been removed.' }, createdAt: new Date(), updatedAt: new Date() })));
    done += r.modifiedCount;
  }

  console.log('\nRows created by mock buttons:');
  for (const [col, id, label] of DELETES) {
    const doc = await db.collection(col).findOne({ _id: oid(id) });
    if (!doc) { console.log(`  – ${label}: already gone`); continue; }
    planned++;
    console.log(`  • delete ${col}/${id}: ${label}`);
    if (APPLY) { await db.collection(col).deleteOne({ _id: oid(id) }); done++; }
  }

  console.log(APPLY ? `\n${done} change(s) applied.` : `\n${planned} change(s) would be made.`);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
