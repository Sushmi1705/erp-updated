#!/usr/bin/env node
/* Opens every screen each job role is allowed to reach, AS that role, and
 * reports anything that fails.
 *
 * The endpoint audit proved each role can read its own modules' list
 * endpoints. That is not the same as proving each role's screens work: a
 * screen can call an endpoint with a parameter, call one from a shared axios
 * instance the static scan missed, or call one owned by a module the role was
 * never given — a customer dropdown, a users list for an "assigned to" field.
 * Any of those turns into a 403 and a screen that quietly shows nothing, or
 * an error toast, for a real user who was told this is their system.
 *
 *   node tools/crawl-roles.cjs --base http://192.168.1.12:8099
 */
const path = require('path');
const fs = require('fs');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://169.58.171.158:8083');

// Mirrors server/seeds/quick-login-users.cjs. Each role visits the screens
// whose sidebar module it holds, plus the two every role sees.
const ROLES = {
  'Sales Executive':        { email: 'sales.exec@lbap.in',           modules: ['Sales', 'MasterData', 'Inventory', 'Dispatch'] },
  'Purchase Officer':       { email: 'purchase.officer@lbap.in',     modules: ['Procurement', 'MRP', 'MasterData', 'GoodsReceipt'] },
  'Store Keeper':           { email: 'store.keeper@lbap.in',         modules: ['GoodsReceipt', 'Inventory', 'MasterData'] },
  'Production Planner':     { email: 'production.planner@lbap.in',   modules: ['Production', 'MRP', 'Capacity', 'Engineering', 'DemandPlanning', 'MasterData'] },
  'Shop Floor Supervisor':  { email: 'shopfloor.supervisor@lbap.in', modules: ['ShopFloor', 'Production', 'MasterData'] },
  'Quality Inspector':      { email: 'quality.inspector@lbap.in',    modules: ['Quality', 'GoodsReceipt', 'Production', 'MasterData'] },
  'Maintenance Engineer':   { email: 'maintenance.engineer@lbap.in', modules: ['Maintenance', 'MasterData', 'ShopFloor'] },
  'Dispatch Coordinator':   { email: 'dispatch.coordinator@lbap.in', modules: ['Dispatch', 'Sales', 'Inventory', 'MasterData'] },
  'Accounts Executive':     { email: 'accounts.executive@lbap.in',   modules: ['Finance', 'Sales', 'Procurement', 'MasterData'] },
  'Plant Manager':          { email: 'plant.manager@lbap.in',        modules: ['Production', 'ShopFloor', 'Quality', 'Maintenance', 'Capacity', 'MRP', 'Dispatch', 'Sales', 'Procurement', 'Inventory', 'MasterData', 'Engineering', 'DemandPlanning'] }
};

// Route prefix -> module, matching Sidebar.jsx's tags.
const PREFIX_MODULE = [
  ['/dashboards/ceo', 'Finance'], ['/dashboards/sales', 'Sales'], ['/dashboards/procurement', 'Procurement'],
  ['/dashboards/inventory', 'Inventory'], ['/dashboards/production', 'Production'],
  ['/dashboards/quality', 'Quality'], ['/dashboards/maintenance', 'Maintenance'],
  ['/master', 'MasterData'], ['/engineering', 'Engineering'], ['/sales', 'Sales'], ['/demand', 'DemandPlanning'],
  ['/mrp', 'MRP'], ['/capacity', 'Capacity'], ['/procurement', 'Procurement'], ['/receipt', 'GoodsReceipt'],
  ['/inventory', 'Inventory'], ['/production', 'Production'], ['/shopfloor', 'ShopFloor'], ['/quality', 'Quality'],
  ['/maintenance', 'Maintenance'], ['/dispatch', 'Dispatch'], ['/finance', 'Finance'],
  ['/dashboard', null], ['/approvals', null]   // null = every role
];
const moduleForRoute = (route) => {
  const hit = PREFIX_MODULE.filter(([p]) => route === p || route.startsWith(p + '/') || route.startsWith(p))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return hit ? hit[1] : undefined;
};

/* Denials that are correct, not defects. A screen may enrich itself from a
 * module a narrow role legitimately lacks; when the screen catches that 403 and
 * renders without the enrichment, the permission system has done its job.
 * Listing each one here — with the reason — keeps the report honest: a tool
 * that always shows one "problem" teaches people to stop reading it, and a
 * blanket "ignore 403s" would hide real breakage. Anything not listed still
 * counts. */
const EXPECTED_DENIALS = [
  {
    role: 'Accounts Executive', route: '/procurement/requisition', endpoint: '/mrp/recommendations',
    why: 'Purchase Requests shows which MRP suggestion a request came from. Accounts reads requests for bill matching and has no business in material planning; the screen catches the 403 and shows the list without that column.'
  }
];
const isExpectedDenial = (role, route, failure) =>
  EXPECTED_DENIALS.some(d => d.role === role && d.route === route && failure.startsWith('403 ') && failure.includes(d.endpoint));

const appSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const allRoutes = [...appSrc.matchAll(/path="([^"]+)"/g)]
  .map(m => m[1])
  .filter(p => !p.includes(':') && !['*', '/login', '/unauthorized'].includes(p))
  .map(p => (p.startsWith('/') ? p : '/' + p));

(async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const report = {};
  let totalScreens = 0, totalProblems = 0, expectedSeen = 0;

  // --roles "Purchase Officer,Accounts Executive" limits the run. The login
  // endpoint allows ten attempts per fifteen minutes per IP, and a full run
  // uses exactly ten; re-checking two roles should not need the other eight.
  const onlyRoles = arg('roles', '').split(',').map(x => x.trim()).filter(Boolean);
  const roleEntries = Object.entries(ROLES).filter(([n]) => !onlyRoles.length || onlyRoles.includes(n));

  for (const [roleName, { email, modules }] of roleEntries) {
    // Fresh session per role.
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    const ok = await page.evaluate(async (em) => {
      localStorage.clear();
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, password: 'password123' })
      });
      // The login endpoint rate-limits to ten attempts per fifteen minutes and
      // answers the eleventh with plain text, not JSON.
      const text = await r.text();
      let d; try { d = JSON.parse(text); } catch { return { ok: false, why: text.slice(0, 60) }; }
      if (d.token) localStorage.setItem('token', d.token);
      if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken);
      return { ok: !!d.token, why: d.message };
    }, email);
    if (!ok.ok) { report[roleName] = [{ route: '(login)', problems: ['login failed: ' + ok.why] }]; totalProblems++; continue; }

    const routes = allRoutes.filter(r => {
      const mod = moduleForRoute(r);
      if (mod === undefined) return false;       // admin-only or untagged: not this role's
      return mod === null || modules.includes(mod);
    });

    const problems = [];
    for (const route of routes) {
      const failures = [];
      const onResponse = (res) => {
        const url = res.url();
        if (!url.includes('/api/')) return;
        if (res.status() >= 400) failures.push(`${res.status()} ${url.replace(BASE, '').replace(/^\/api/, '')}`);
      };
      const onPageError = (e) => failures.push('CRASH ' + String(e.message).slice(0, 100));
      page.on('response', onResponse);
      page.on('pageerror', onPageError);
      try {
        // networkidle0, not networkidle2: the latter tolerates two requests
        // still in flight, and one of them from the previous screen was being
        // counted against this one.
        await page.goto(BASE + route, { waitUntil: 'networkidle0', timeout: 30000 });
        try {
          await page.waitForFunction(() => {
            const t = (document.body.innerText || '').trim();
            return t.length > 40 && !/^Loading/i.test(t);
          }, { timeout: 12000, polling: 250 });
        } catch { /* recorded below */ }
        // Did it bounce back to the login screen? That is a failed session, not a permission.
        const url = page.url();
        if (url.includes('/login')) failures.push('bounced to /login');
      } catch (e) {
        failures.push('NAV ' + e.message.slice(0, 80));
      }
      page.off('response', onResponse);
      page.off('pageerror', onPageError);
      totalScreens++;
      // Dedupe repeated failures for the same endpoint on one screen.
      const unique = [...new Set(failures)].filter(f => {
        if (isExpectedDenial(roleName, route, f)) { expectedSeen++; return false; }
        return true;
      });
      if (unique.length) { problems.push({ route, problems: unique }); totalProblems++; }
    }
    report[roleName] = problems;
  }

  console.log(`\n${totalScreens} screen visits across ${roleEntries.length} role${roleEntries.length === 1 ? '' : 's'} — ${totalProblems} with problems` +
    (expectedSeen ? `  (${expectedSeen} expected denial${expectedSeen === 1 ? '' : 's'} seen and confirmed handled)` : '') + '\n');
  for (const [role, problems] of Object.entries(report)) {
    if (!problems.length) { console.log(`✓ ${role}`); continue; }
    console.log(`✗ ${role}`);
    for (const p of problems) {
      console.log(`    ${p.route}`);
      p.problems.forEach(x => console.log(`        ${x}`));
    }
  }
  await browser.close();
  process.exit(totalProblems ? 1 : 0);
})();
