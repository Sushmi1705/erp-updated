#!/usr/bin/env node
/* Walk every route and report which ones break.
 *
 * There are no tests in this client and lint carries hundreds of pre-existing
 * problems, so after a broad mechanical change this is the only real evidence
 * that 80 pages still render. It reads window.__pageErrors, which the
 * ErrorBoundary fills, so a crashed page reports itself by name instead of
 * showing up as a blank screen.
 *
 *   node tools/crawl.cjs --base http://192.168.1.4:8099
 */
const path = require('path');
const fs = require('fs');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://127.0.0.1:8083');

// Routes come straight from App.jsx so the list cannot drift from the app.
const appSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const routes = [...appSrc.matchAll(/path="([^"]+)"/g)]
  .map(m => m[1])
  .filter(p => !p.includes(':') && !['*', '/login', '/unauthorized'].includes(p))
  .map(p => (p.startsWith('/') ? p : '/' + p));

(async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Authenticate once with the seeded dev fixture; every route is behind auth.
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  const ok = await page.evaluate(async () => {
    const r = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
    });
    const d = await r.json();
    if (d.token) localStorage.setItem('token', d.token);
    if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken);
    return !!d.success;
  });
  if (!ok) { console.error('login failed — is the API up?'); process.exit(1); }

  const bad = [];
  let clean = 0;

  for (const route of routes) {
    const consoleErrors = [];
    const onConsole = (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); };
    const onPageError = (e) => consoleErrors.push('PAGEERROR ' + String(e.message).slice(0, 160));
    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30000 });
      // Wait for content rather than a fixed pause. The database is in Mumbai
      // and the server in France, so a page that fires several queries can
      // still be on its loading line well after the network goes idle — a
      // fixed wait reported nine healthy screens as blank.
      try {
        await page.waitForFunction(
          () => {
            const t = (document.body.innerText || '').trim();
            return t.length > 40 && !/^Loading|^Loading the /i.test(t);
          },
          { timeout: 12000, polling: 250 }
        );
      } catch { /* fall through — the check below records what was actually there */ }
      const state = await page.evaluate(() => ({
        boundary: (window.__pageErrors || []).map(e => e.message).slice(0, 2),
        text: (document.body.innerText || '').trim().length
      }));
      // Ignore the noisy-but-harmless class: failed favicon, aborted fetches.
      const real = consoleErrors.filter(e => !/favicon|ERR_ABORTED|Download the React/i.test(e));
      if (state.boundary.length || real.length || state.text < 40) {
        bad.push({ route, boundary: state.boundary, errors: real.slice(0, 2), textLen: state.text });
      } else clean++;
    } catch (e) {
      bad.push({ route, errors: ['NAV ' + e.message.slice(0, 100)] });
    }
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }

  console.log(`\n${clean}/${routes.length} routes clean`);
  if (bad.length) {
    console.log(`\n${bad.length} with problems:`);
    for (const b of bad) {
      console.log(`  ${b.route}`);
      (b.boundary || []).forEach(m => console.log(`      BOUNDARY: ${m}`));
      (b.errors || []).forEach(m => console.log(`      ${m}`));
      if (b.textLen !== undefined && b.textLen < 40) console.log(`      near-empty page (${b.textLen} chars)`);
    }
  }
  await browser.close();
  process.exit(bad.length ? 1 : 0);
})();
