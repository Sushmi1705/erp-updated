#!/usr/bin/env node
/* Proves the Roles & Access screen tells the truth.
 *
 * Builds a role through the same API the screen uses, gives it to a throwaway
 * user, signs in as that user and checks that what the role says is exactly
 * what the system allows: the ticked box works, the unticked box is refused,
 * switching the role off stops them, and a role somebody holds cannot be
 * deleted out from under them. Everything it creates is removed at the end.
 *
 *   AUDIT_BASE_URL=http://127.0.0.1:8083 node tools/audit-roles.cjs
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

/* The ERP's own port is 8083. It shared 8082 with the LAB Automotive
 * marketing site until that site took 8082 as its default_server; the ERP has
 * had 8083 to itself since. Still never 5060 — that port is WHATWG-blocked, so
 * fetch() refuses it and these scripts must go through nginx. */
const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8083';
const TAG = 'ROLEAUDIT-' + Date.now().toString(36).toUpperCase();
const results = [];
const created = [];

const step = (name, ok, note = '') => { results.push({ name, ok }); console.log(`  ${ok ? '✓' : '✗'} ${name}${note ? '  — ' + note : ''}`); };

const call = async (method, path, token, body) => {
  const res = await fetch(BASE + '/api' + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 120) }; }
  return { status: res.status, ...json };
};
const login = async (email, password = 'password123') => {
  const r = await call('POST', '/auth/login', null, { email, password });
  return r.token;
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const admin = await login('admin@example.com');
  if (!admin) throw new Error('admin login failed');

  console.log('\nROLES & ACCESS');

  // 1. The catalogue the editor renders from must match what the server enforces.
  const cat = await call('GET', '/roles/catalogue', admin);
  const modules = (cat.data?.groups || []).flatMap((g) => g.modules.map((m) => m.module));
  step('The editor is offered every area the system has', modules.length >= 21, `${modules.length} areas in ${cat.data?.groups?.length} groups`);

  // 2. Build a role that may only look at stock, through the API the screen uses.
  const roleRes = await call('POST', '/roles', admin, {
    name: `${TAG} Stock Viewer`,
    description: 'Audit fixture — may look at stock and nothing else',
    permissions: [{ module: 'Inventory', actions: ['read'] }]
  });
  const roleId = roleRes.data?._id;
  if (roleId) created.push(['roles', roleId]);
  step('Create a role with one ticked box (Stock: View)', roleRes.success && !!roleId, roleRes.message);

  // 3. Junk must not be stored — a typo saved happily used to match nothing
  //    at enforcement time, so the role read as granted and behaved as denied.
  const junk = await call('POST', '/roles', admin, {
    name: `${TAG} Junk`, description: 'Audit fixture',
    permissions: [{ module: 'NotAModule', actions: ['read'] }, { module: 'Sales', actions: ['fly'] }]
  });
  if (junk.data?._id) created.push(['roles', junk.data._id]);
  step('Refuse to store an area or an action the system does not have',
    junk.success && (junk.data?.permissions || []).length === 0 && !!junk.warning, junk.warning);

  // 4. Give it to a throwaway user.
  const userRes = await call('POST', '/users', admin, {
    firstName: 'Audit', lastName: 'Fixture', email: `${TAG.toLowerCase()}@lbap.in`,
    password: 'password123', roleId, status: 'Active'
  });
  const userId = userRes.data?._id || userRes.user?._id;
  if (userId) created.push(['users', userId]);
  step('Give the role to a person', !!userId, userRes.message);

  const token = userId ? await login(`${TAG.toLowerCase()}@lbap.in`) : null;
  step('That person can sign in', !!token);

  if (token) {
    // 5. The ticked box works.
    const canRead = await call('GET', '/inventory/batches', token);
    step('Stock: View is ticked, so the stock list opens', canRead.status < 400, `HTTP ${canRead.status}`);

    // 6. The unticked boxes are refused — by the server, not by a hidden menu.
    const cannotWrite = await call('POST', '/inventory/v2/transactions', token, { Transaction_Type: 'Issue', Quantity: 1 });
    step('Stock: Add is not ticked, so adding stock is refused', cannotWrite.status === 403, cannotWrite.message?.slice(0, 60));

    const cannotSeeMoney = await call('GET', '/finance/v2/ar/invoices', token);
    step('Finance is not ticked at all, so customer invoices are refused', cannotSeeMoney.status === 403, cannotSeeMoney.message?.slice(0, 60));

    const cannotSeeRoles = await call('GET', '/roles', token);
    step('Roles & Access itself is refused', cannotSeeRoles.status === 403, cannotSeeRoles.message?.slice(0, 60));

    // 7. A change to the role reaches a signed-in user immediately.
    const widen = await call('PUT', `/roles/${roleId}`, admin, {
      permissions: [{ module: 'Inventory', actions: ['read'] }, { module: 'Finance', actions: ['read'] }]
    });
    const nowSeesMoney = await call('GET', '/finance/v2/ar/invoices', token);
    step('Ticking Finance: View reaches them without signing in again', nowSeesMoney.status < 400,
      nowSeesMoney.status < 400 ? `HTTP ${nowSeesMoney.status}` : `update said: ${widen.success} ${widen.message || ''} | read said HTTP ${nowSeesMoney.status}`);

    // 8. Switching the role off stops them — the box that did nothing at all.
    const off = await call('PUT', `/roles/${roleId}`, admin, { isActive: false });
    const switchedOff = await call('GET', '/inventory/batches', token);
    step('Switching the role off stops them everywhere', switchedOff.status === 403,
      switchedOff.status === 403 ? switchedOff.message?.slice(0, 70) : `off said: ${off.success} ${off.message || ''} | read HTTP ${switchedOff.status}`);
    await call('PUT', `/roles/${roleId}`, admin, { isActive: true });
    const backOn = await call('GET', '/inventory/batches', token);
    step('Switching it back on lets them in again', backOn.status < 400, `HTTP ${backOn.status}`);
  }

  // 9. A role somebody holds cannot be deleted out from under them.
  const blocked = await call('DELETE', `/roles/${roleId}`, admin);
  step('A role someone holds cannot be deleted', blocked.status === 409, blocked.message?.slice(0, 80));

  // 10. Nobody may widen their own access. Signing in as the fixture user's
  //     own role is the clean way to test it — the Super Admin role is refused
  //     one step earlier for being built in.
  if (token) {
    const selfEdit = await call('PUT', `/roles/${roleId}`, token, { permissions: [{ module: 'Finance', actions: ['read', 'create'] }] });
    step('Nobody may widen their own access', selfEdit.status === 403, selfEdit.message?.slice(0, 70));
  }

  // 11. Every change is on the record.
  const audits = await db.collection('auditlogs').countDocuments({ module: 'Role', 'newValue.role': new RegExp(TAG) });
  step('Every role change is written to the audit log', audits >= 2, `${audits} entries for this run`);

  const bad = results.filter((r) => !r.ok);
  console.log(`\nROLES — ${results.length - bad.length} of ${results.length} behaved, ${bad.length} did not\n`);
  bad.forEach((b) => console.log(`  ✗ ${b.name}`));

  // Cleanup: the user first, so the role is free to delete.
  for (const [coll, id] of created.reverse()) {
    await db.collection(coll).deleteOne({ _id: new mongoose.Types.ObjectId(String(id)) });
  }
  await db.collection('auditlogs').deleteMany({ module: 'Role', 'newValue.role': new RegExp(TAG) });
  console.log(`Removed ${created.length} fixture record(s).`);

  await mongoose.disconnect();
  process.exit(bad.length ? 1 : 0);
})().catch(async (e) => { console.error('audit crashed:', e); try { await mongoose.disconnect(); } catch { /* */ } process.exit(2); });
