#!/usr/bin/env node
/* Exercises every read endpoint the application exposes and reports what
 * answers, what fails, and what answers with nothing.
 *
 * The third category is the useful one. A 500 announces itself; a screen that
 * quietly returns an empty list because its controller reads a table the
 * application stopped writing to years ago looks exactly like a screen with no
 * data yet — and that is how the sales report came to show zero orders against
 * ₹1.2Cr of revenue.
 *
 *   node tools/audit-api.cjs                  # against a local server on 5097
 *   node tools/audit-api.cjs --port 5060      # against another port
 *   node tools/audit-api.cjs --json out.json  # machine-readable
 */
const fs = require('fs');
const path = require('path');

const arg = (name, fallback) => {
  const i = process.argv.indexOf('--' + name);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const PORT = Number(arg('port', 5097));
const BASE = `http://127.0.0.1:${PORT}`;
const JSON_OUT = arg('json', null);

// Where each route file is mounted, mirroring app.js.
const MOUNTS = {
  auth: '/api/auth', user: '/api/users', company: '/api/company', role: '/api/roles',
  audit: '/api/audit', dashboard: '/api/dashboards', master: '/api/master',
  engineering: '/api/engineering', sales: '/api/sales', demand: '/api/demand',
  mrp: '/api/mrp', approval: '/api/approvals', capacity: '/api/capacity',
  procurement: '/api/procurement', receipt: '/api/receipt', inventory: '/api/inventory',
  production: '/api/production', shopfloor: '/api/shopfloor', quality: '/api/quality',
  maintenance: '/api/maintenance', dispatch: '/api/dispatch', finance: '/api/finance'
};

const collectRoutes = () => {
  const dir = path.join(__dirname, '..', 'src', 'routes');
  const out = [];
  for (const file of fs.readdirSync(dir)) {
    const base = MOUNTS[file.replace('.routes.js', '')];
    if (!base) continue;
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const m of src.matchAll(/router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g)) {
      const suffix = m[2] === '/' ? '' : m[2];
      out.push({
        module: file.replace('.routes.js', ''),
        method: m[1].toUpperCase(),
        path: (base + suffix).replace(/\/$/, '') || base
      });
    }
  }
  return out;
};

const login = async () => {
  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
  });
  const body = await res.json();
  const token = body.token || body.data?.token;
  if (!token) throw new Error('login failed: ' + JSON.stringify(body).slice(0, 160));
  return token;
};

(async () => {
  const all = collectRoutes();
  const readable = all.filter(r => r.method === 'GET' && !r.path.includes(':'));
  const token = await login();

  const results = [];
  for (const route of readable) {
    try {
      const res = await fetch(BASE + route.path, { headers: { Authorization: 'Bearer ' + token } });
      let body = null;
      try { body = await res.json(); } catch { /* non-JSON body */ }
      const payload = body?.data ?? body;
      const count = Array.isArray(payload)
        ? payload.length
        : (payload && typeof payload === 'object' ? Object.keys(payload).length : null);
      results.push({
        ...route,
        status: res.status,
        count,
        message: res.status >= 400 ? String(body?.message || '').slice(0, 120) : null
      });
    } catch (err) {
      results.push({ ...route, status: 0, count: null, message: err.message.slice(0, 120) });
    }
  }

  const failing = results.filter(r => r.status >= 400 || r.status === 0);
  const empty = results.filter(r => r.status === 200 && r.count === 0);

  const byMethod = all.reduce((acc, r) => { acc[r.method] = (acc[r.method] || 0) + 1; return acc; }, {});
  console.log(`${all.length} endpoints defined — ${Object.entries(byMethod).map(([m, n]) => `${m} ${n}`).join('  ')}`);
  console.log(`${results.length} readable without parameters — ${results.length - failing.length} answered, ${failing.length} failed\n`);

  if (failing.length) {
    console.log(`FAILING (${failing.length})`);
    for (const r of failing) {
      console.log(`  ${String(r.status).padEnd(4)} ${r.module.padEnd(12)} ${r.path}`);
      if (r.message) console.log(`       ${r.message}`);
    }
    console.log('');
  }

  if (empty.length) {
    console.log(`ANSWERED WITH NOTHING (${empty.length}) — either genuinely no data, or reading the wrong table`);
    for (const r of empty) console.log(`  ${r.module.padEnd(12)} ${r.path}`);
    console.log('');
  }

  console.log(failing.length === 0 ? 'No endpoint is failing.' : `${failing.length} endpoints need attention.`);
  if (JSON_OUT) {
    fs.writeFileSync(JSON_OUT, JSON.stringify({ results, failing, empty }, null, 1));
    console.log(`\nwritten to ${JSON_OUT}`);
  }
  process.exit(failing.length ? 1 : 0);
})().catch(err => { console.error(err.message); process.exit(2); });
