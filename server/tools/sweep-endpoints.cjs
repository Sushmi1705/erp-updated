#!/usr/bin/env node
/* Calls every parameter-less GET route in the API as the Super Admin and
 * reports anything that is not a clean 2xx JSON — a 500, a hang, an HTML
 * error page, a response with success:false. The role crawl proves each
 * screen loads; this proves each endpoint behind them (and the ones no
 * screen calls yet) answers.
 *
 *   AUDIT_BASE_URL=http://127.0.0.1:8083 node tools/sweep-endpoints.cjs
 */
const fs = require('fs');
const path = require('path');
/* The ERP's own port. Never 5060 — that is the Express port behind nginx and
 * it is WHATWG-blocked, so fetch() refuses it outright. */
const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:8083';

const MOUNTS = {};
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
for (const m of app.matchAll(/app\.use\('(\/api\/[a-z]+)',\s*(\w+)\)/g)) MOUNTS[m[2]] = m[1];
const imports = {};
for (const m of app.matchAll(/const (\w+) = require\('\.\/src\/routes\/([\w.]+)'\)/g)) imports[m[2]] = m[1];

const routes = [];
for (const file of fs.readdirSync(path.join(__dirname, '..', 'src', 'routes'))) {
  const varName = imports[file.replace(/\.js$/, '')] || imports[file];
  const mount = MOUNTS[varName];
  if (!mount) continue;
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', file), 'utf8');
  for (const m of src.matchAll(/router\.get\('([^']*)'/g)) {
    if (m[1].includes(':')) continue;
    routes.push(mount + (m[1] === '/' ? '' : m[1]));
  }
}
const MASTER = ['customer','customercategory','vendor','vendorcategory','product','productcategory','material','materialcategory','uom','uomconversion','currency','tax','paymentterms','documentseries','warehouse','storagelocation','storagezone','rack','bin','machine','workcenter'];
MASTER.forEach((m) => routes.push('/api/master/' + m));

/* --as store.keeper@lbap.in   sweep as a narrow role: a 200 on a module the
   role does not hold is a leak, a 403 is the system working.
   --anon                      no token at all: anything but 401 is a leak. */
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const AS = arg('as');
const ANON = process.argv.includes('--anon');
// Module each mount belongs to, so a role sweep knows which 403s are right.
const MOUNT_MODULE = { '/api/sales': 'Sales', '/api/procurement': 'Procurement', '/api/receipt': 'GoodsReceipt', '/api/inventory': 'Inventory', '/api/production': 'Production', '/api/shopfloor': 'ShopFloor', '/api/quality': 'Quality', '/api/maintenance': 'Maintenance', '/api/dispatch': 'Dispatch', '/api/finance': 'Finance', '/api/engineering': 'Engineering', '/api/demand': 'DemandPlanning', '/api/mrp': 'MRP', '/api/capacity': 'Capacity', '/api/master': 'MasterData', '/api/users': 'Users', '/api/roles': 'Roles', '/api/company': 'CompanySetup', '/api/audit': 'Audit', '/api/approvals': 'Approvals' };

(async () => {
  const unique = [...new Set(routes)].sort();
  const bad = [];
  let ok = 0;

  if (ANON) {
    let leaks = 0;
    for (const r of unique) {
      const res = await fetch(BASE + r);
      if (res.status !== 401) { leaks++; bad.push(`${res.status}  ${r}  answered without a token`); }
    }
    console.log(`\n${unique.length} GET endpoints without a token — ${unique.length - leaks} refused (401), ${leaks} answered\n`);
    bad.forEach((b) => console.log('  ' + b));
    process.exit(leaks ? 1 : 0);
  }

  const login = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: AS || 'admin@example.com', password: 'password123' }) });
  const lj = await login.json();
  const token = lj.token;
  if (!token) throw new Error('login failed: ' + JSON.stringify(lj).slice(0, 120));

  if (AS) {
    const me = await (await fetch(BASE + '/api/auth/me', { headers: { Authorization: 'Bearer ' + token } })).json();
    const perms = me.data?.role?.permissions || me.user?.role?.permissions || me.role?.permissions || [];
    const held = new Set(perms.map((p) => p.module));
    let leaks = 0, denied = 0, allowed = 0;
    for (const r of unique) {
      const mount = '/api/' + r.split('/')[2];
      const mod = MOUNT_MODULE[mount];
      const res = await fetch(BASE + r, { headers: { Authorization: 'Bearer ' + token } });
      // Every role's personal inbox: the controller filters to requests the
      // caller's role can action, so answering is right, not a leak.
      if (r === '/api/approvals/pending') { allowed++; continue; }
      const shouldHold = !mod || held.has(mod) || mount === '/api/dashboards' || mount === '/api/dashboard' || mount === '/api/auth';
      if (res.status === 403 && shouldHold && mod && held.has(mod)) bad.push(`403  ${r}  refused although the role holds ${mod}`);
      else if (res.status < 400 && mod && !held.has(mod) && !['/api/users', '/api/roles'].includes(mount)) { leaks++; bad.push(`${res.status}  ${r}  answered to a role WITHOUT ${mod}`); }
      else if (res.status < 400 && ['/api/users', '/api/roles'].includes(mount) && !r.endsWith('/directory')) { leaks++; bad.push(`${res.status}  ${r}  admin-only list answered to a non-admin`); }
      else if (res.status === 403) denied++;
      else if (res.status < 400) allowed++;
      else if (res.status >= 500) bad.push(`${res.status}  ${r}  server error`);
    }
    console.log(`\n${unique.length} GET endpoints as ${AS} (holds: ${[...held].join(', ')}) — ${allowed} allowed, ${denied} correctly refused, ${leaks} leak(s)\n`);
    bad.forEach((b) => console.log('  ' + b));
    process.exit(bad.length ? 1 : 0);
  }

  for (const r of unique) {
    const t0 = Date.now();
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 20000);
      const res = await fetch(BASE + r, { headers: { Authorization: 'Bearer ' + token }, signal: ctl.signal });
      clearTimeout(timer);
      const ms = Date.now() - t0;
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* not json */ }
      if (res.status >= 500) bad.push(`${res.status}  ${r}  ${(json?.message || text).slice(0, 120)}`);
      else if (res.status === 404) bad.push(`404  ${r}  (route declared but not reachable)`);
      else if (!json) bad.push(`${res.status}  ${r}  non-JSON body: ${text.slice(0, 60)}`);
      else if (json.success === false) bad.push(`${res.status}  ${r}  success:false — ${json.message}`);
      else if (ms > 5000) bad.push(`SLOW ${ms}ms  ${r}`);
      else ok++;
    } catch (e) {
      bad.push(`ERR  ${r}  ${e.name === 'AbortError' ? 'timed out after 20s' : e.message}`);
    }
  }
  console.log(`\n${unique.length} GET endpoints — ${ok} clean, ${bad.length} with problems\n`);
  bad.forEach((b) => console.log('  ' + b));
  process.exit(bad.length ? 1 : 0);
})();
