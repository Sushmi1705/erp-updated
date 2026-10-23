#!/usr/bin/env node
/* Presses every control on every screen and reports what each one did.
 *
 * The crawl proves each screen loads; the flow audit proves the API works.
 * Neither proves that the button in front of an operator does anything. This
 * one, as Admin, opens every route and clicks every distinct control in the
 * content area that is not destructive or state-changing (no Delete, Approve,
 * Post, Void…), then records what followed: a dialog, a toast, a navigation,
 * a changed page, an API failure, a crash — or nothing at all, which is a
 * dead button. On every "New / Add / Create" dialog it also submits the form
 * empty: the right answer is a validation message (or a 400); a 2xx means the
 * server accepted a blank record, a 500 means it fell over.
 *
 *   node tools/exercise-screens.cjs [--base http://169.58.171.158:8083]
 *                                   [--only /sales/order,/finance/ar]
 *                                   [--out report.json]
 * Uses one login.
 */
const path = require('path');
const fs = require('fs');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://169.58.171.158:8083');
const EMAIL = arg('email', 'admin@example.com');
const ONLY = arg('only', '').split(',').map(s => s.trim()).filter(Boolean);
const OUT = arg('out', '');

// Controls whose click mutates state without a form in between. Recorded as
// present, never pressed.
const SKIP = /^(delete|remove|void|reject|approve|post|close|reopen|cancel|logout|log out|sign out|confirm|submit|save|start|stop|pause|resume|complete|finish|release|issue|ship|dispatch|receive|export|print|download|reset|clear|send|mark|generate|run|recalculate|recompute|sync|import|upload|lock|unlock|activate|deactivate|enable|disable|toggle|assign|allocate|convert|turn|simulate|fire|trigger|webhook|advance|move|promote|progress|transition|set status|change status|next stage|stage|accept|decline|archive|restore|duplicate|clone|copy|apply|publish|invite|resend|revoke|escalate|dismiss|resolve|acknowledge|tell the team|report a problem|use suggested|auto-?fill|record|log|book|raise|create .* from|make)\b/i;
const CREATE = /^(\+|new\b|add\b|create\b|raise\b|book\b|open\b)/i;

const appSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
let routes = [...appSrc.matchAll(/path="([^"]+)"/g)]
  .map(m => m[1])
  .filter(p => !p.includes(':') && !['*', '/login', '/unauthorized', '/'].includes(p))
  .map(p => (p.startsWith('/') ? p : '/' + p));
if (ONLY.length) routes = routes.filter(r => ONLY.includes(r));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Collectors, reset before each click.
  let api = [], crashes = [], consoleErrs = [], natives = [];
  page.on('response', (res) => {
    const url = res.url();
    if (!url.includes('/api/')) return;
    api.push({ status: res.status(), method: res.request().method(), url: url.replace(BASE, '').replace(/^\/api/, ''), res });
  });
  page.on('pageerror', (e) => crashes.push(String(e.message).slice(0, 140)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource/.test(t)) return;
    consoleErrs.push(t.slice(0, 140));
  });
  page.on('dialog', async (d) => { natives.push(d.type() + ': ' + d.message().slice(0, 80)); await d.dismiss().catch(() => {}); });
  const reset = () => { api = []; crashes = []; consoleErrs = []; natives = []; };

  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  const login = await page.evaluate(async (em) => {
    localStorage.clear();
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: em, password: 'password123' }) });
    const text = await r.text();
    let d; try { d = JSON.parse(text); } catch { return { ok: false, why: text.slice(0, 60) }; }
    if (d.token) localStorage.setItem('token', d.token);
    if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken);
    return { ok: !!d.token, why: d.message };
  }, EMAIL);
  if (!login.ok) { console.error('login failed: ' + login.why); process.exit(2); }
  // The access token lives fifteen minutes and this run takes longer. If the
  // refresh call cannot mint a new one, every screen after the first quarter
  // hour would "bounce to /login" — which is what a real user would see too.
  const refreshed = await page.evaluate(async () => {
    const r = await fetch('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }) });
    const d = await r.json().catch(() => ({}));
    return { status: r.status, ok: !!d.token };
  });
  if (!refreshed.ok) { console.error(`SESSION REFRESH BROKEN: POST /auth/refresh → ${refreshed.status} with a token issued seconds ago. Every user is signed out after 15 minutes.`); process.exit(2); }
  console.log('session refresh works ✓');

  // Everything pressable in the content area, tagged so we can find it again.
  const snapshot = () => page.evaluate(() => {
    const root = document.querySelector('main.main-content') || document.body;
    const els = [...root.querySelectorAll('button, [role="tab"], [role="button"], a.btn, .tab')];
    const out = [];
    els.forEach((el, i) => {
      el.setAttribute('data-ex', String(i));
      const visible = !!(el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden';
      if (!visible || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      const inDialog = !!el.closest('.modal-body, [role="dialog"], [role="alertdialog"], [aria-modal="true"]');
      const label = (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48) || '[icon]';
      // A button's tooltip can be gentler than its text ("Turn this suggestion
      // into a real order" over "Convert"). The skip test sees every name.
      const names = [el.getAttribute('aria-label'), el.getAttribute('title'), el.innerText || el.textContent].map(x => (x || '').trim().replace(/\s+/g, ' ')).filter(Boolean);
      const active = el.classList.contains('active') || el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-current') === 'page';
      out.push({ i, label, names, inDialog, active, tag: el.tagName.toLowerCase(), type: el.getAttribute('type') });
    });
    return out;
  });
  const dialogOpen = () => page.evaluate(() => !!document.querySelector('.modal-body, [role="dialog"], [role="alertdialog"], [aria-modal="true"]'));
  const toasts = () => page.evaluate(() => {
    const box = [...document.querySelectorAll('div[style*="9999"]')].find(d => d.style.position === 'fixed');
    if (!box) return [];
    return [...box.children].map(c => {
      const icon = (c.querySelector('span') || {}).textContent || '';
      const kind = icon === '✕' ? 'error' : icon === '✓' ? 'success' : icon === '⚠' ? 'warning' : 'info';
      return { kind, text: (c.textContent || '').replace(/[✓✕⚠ℹ×]/g, '').trim().slice(0, 120) };
    });
  });
  const fingerprint = () => page.evaluate(() => {
    const root = document.querySelector('main.main-content') || document.body;
    return (root.innerText || '').length + ':' + root.querySelectorAll('*').length;
  });
  const settle = async () => { await sleep(500); await page.waitForNetworkIdle({ idleTime: 400, timeout: 5000 }).catch(() => {}); await sleep(200); };
  const clickEx = (i) => page.evaluate((n) => { const el = document.querySelector(`[data-ex="${n}"]`); if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true; }, i);

  const closeDialog = async () => {
    for (let attempt = 0; attempt < 3 && await dialogOpen(); attempt++) {
      const done = await page.evaluate(() => {
        const dlg = document.querySelector('.modal-body, [role="dialog"], [role="alertdialog"], [aria-modal="true"]');
        const scope = dlg.closest('[role="dialog"], [aria-modal="true"]') || dlg.parentElement || dlg;
        const x = scope.querySelector('[aria-label="Close"]') || [...scope.querySelectorAll('button')].find(b => /^(cancel|close|dismiss|back)$/i.test(b.textContent.trim()));
        if (x) { x.click(); return 'button'; }
        return null;
      });
      if (!done) await page.keyboard.press('Escape');
      await sleep(350);
    }
    return !(await dialogOpen());
  };

  const open = async (route) => {
    await page.goto(BASE + route, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForFunction(() => { const t = (document.body.innerText || '').trim(); return t.length > 40 && !/^Loading/i.test(t); }, { timeout: 12000, polling: 250 }).catch(() => {});
  };

  const report = {};
  let fails = 0, warns = 0, clicks = 0;
  const t0 = Date.now();

  for (const route of routes) {
    const findings = [];
    const note = (kind, label, detail) => { findings.push({ kind, label, detail }); if (kind === 'FAIL') fails++; if (kind === 'WARN') warns++; };
    reset();
    try { await open(route); } catch (e) { note('FAIL', '(load)', 'NAV ' + e.message.slice(0, 80)); report[route] = { findings }; continue; }
    if (page.url().includes('/login')) { note('FAIL', '(load)', 'bounced to /login'); report[route] = { findings }; continue; }
    api.filter(a => a.status >= 400).forEach(a => note(a.status >= 500 ? 'FAIL' : 'WARN', '(load)', `${a.status} ${a.method} ${a.url}`));
    crashes.forEach(c => note('FAIL', '(load)', 'CRASH ' + c));
    consoleErrs.forEach(c => note('WARN', '(load)', 'console: ' + c));

    const seen = new Set();
    let controls = await snapshot();
    const total = controls.filter(c => !c.inDialog).length;
    let skipped = 0, pressed = 0, rowsPressed = 0;
    const queue = controls.filter(c => !c.inDialog);
    for (const c of queue) {
      if (seen.has(c.label)) continue;
      seen.add(c.label);
      if (c.names.some(n => SKIP.test(n)) || c.type === 'submit') { skipped++; continue; }
      // A document row (INQ-2026-0012 …, SO-2026-1003 …) selects a record.
      // One per screen proves selection works; pressing every row only
      // multiplies the state-changing buttons that appear once one is selected.
      if (/^[A-Z]{2,5}[-/]\d{2,4}/.test(c.label)) { if (rowsPressed++) { skipped++; continue; } }
      if (c.active) { note('INFO', c.label, 'already the selected tab'); continue; }
      if (pressed >= 40) { note('INFO', '(cap)', 'more than 40 distinct controls; rest not pressed'); break; }
      pressed++; clicks++;

      // Make sure the element still exists (previous click may have re-rendered).
      const fresh = await snapshot();
      // Match by label only. Falling back to the same index pressed whatever
      // now sat at that position after a tab switch — on Delivery Tracking that
      // was the handover button, and the "empty" submit that followed was a
      // full, valid handover form.
      const match = fresh.find(f => !f.inDialog && f.label === c.label);
      if (!match) { note('INFO', c.label, 'gone before it could be pressed'); continue; }

      reset();
      const before = await fingerprint();
      const urlBefore = page.url();
      await clickEx(match.i);
      await settle();

      const urlAfter = page.url();
      const dlg = await dialogOpen();
      const ts = await toasts();
      const after = await fingerprint();
      const bad = api.filter(a => a.status >= 500);
      const denied = api.filter(a => a.status >= 400 && a.status < 500);

      crashes.forEach(x => note('FAIL', c.label, 'CRASH ' + x));
      bad.forEach(a => note('FAIL', c.label, `${a.status} ${a.method} ${a.url}`));
      natives.forEach(n => note('WARN', c.label, 'native browser dialog: ' + n));
      consoleErrs.forEach(x => note('WARN', c.label, 'console: ' + x));
      ts.filter(t => t.kind === 'error').forEach(t => note(denied.length ? 'INFO' : 'WARN', c.label, `error toast: "${t.text}"` + (denied.length ? ` after ${denied[0].status} ${denied[0].url}` : '')));

      if (urlAfter !== urlBefore) {
        if (urlAfter.includes('/login')) note('FAIL', c.label, 'session lost → /login');
        else note('OK', c.label, '→ ' + urlAfter.replace(BASE, ''));
        await open(route).catch(() => {});
        continue;
      }
      if (dlg) {
        let detail = 'opens dialog';
        if (CREATE.test(c.label)) {
          // Submit it empty.
          reset();
          const submitted = await page.evaluate(() => {
            const dlgEl = document.querySelector('.modal-body, [role="dialog"], [aria-modal="true"]');
            const scope = dlgEl.closest('[role="dialog"], [aria-modal="true"]') || dlgEl.parentElement || dlgEl;
            const btn = scope.querySelector('button[type="submit"]') || [...scope.querySelectorAll('button')].find(b => /^(save|create|add|submit|raise|book|record|confirm)\b/i.test(b.textContent.trim()));
            if (!btn) return null;
            if (btn.disabled) return 'disabled';
            btn.click(); return btn.textContent.trim().slice(0, 30);
          });
          await settle();
          const ts2 = await toasts();
          const writes = api.filter(a => a.method !== 'GET');
          const invalid = await page.evaluate(() => document.querySelectorAll(':invalid').length);
          if (submitted === null) detail += '; no submit button found';
          else if (submitted === 'disabled') detail += '; submit disabled until filled ✓';
          else if (writes.some(a => a.status >= 500)) note('FAIL', c.label, `empty submit → ${writes.find(a => a.status >= 500).status} ${writes[0].url}`);
          else if (writes.some(a => a.status >= 200 && a.status < 300)) {
            const w = writes.find(a => a.status < 300);
            let id = ''; try { const j = await w.res.json(); id = j._id || j.data?._id || j.id || JSON.stringify(j).slice(0, 60); } catch { /* */ }
            note('FAIL', c.label, `empty form ACCEPTED → ${w.status} ${w.method} ${w.url} ${id}`);
          }
          else if (writes.some(a => a.status >= 400)) detail += `; empty submit rejected by server (${writes.find(a => a.status >= 400).status}) ✓`;
          else if (invalid > 0 || ts2.some(t => t.kind === 'error' || t.kind === 'warning')) detail += '; empty submit blocked by validation ✓';
          else if (await dialogOpen()) note('WARN', c.label, 'empty submit did nothing visible (no request, no message)');
          else detail += '; empty submit closed the dialog without a request';
          crashes.forEach(x => note('FAIL', c.label, 'CRASH on submit ' + x));
        }
        const closed = await closeDialog();
        if (!closed) { note('FAIL', c.label, 'dialog could not be closed'); await open(route).catch(() => {}); }
        else note('OK', c.label, detail);
        continue;
      }
      if (ts.length) { note('OK', c.label, `${ts[0].kind} toast: "${ts[0].text}"`); continue; }
      if (after !== before) { note('OK', c.label, 'page changed'); continue; }
      if (api.length) { note('OK', c.label, `request only (${api.map(a => a.status + ' ' + a.url).slice(0, 2).join(', ')})`); continue; }
      note('WARN', c.label, 'no visible effect');
    }
    report[route] = { controls: total, pressed, skipped, findings };
    const f = findings.filter(x => x.kind === 'FAIL').length, w = findings.filter(x => x.kind === 'WARN').length;
    console.log(`${f ? '✗' : w ? '△' : '✓'} ${route.padEnd(28)} ${String(total).padStart(3)} controls, ${String(pressed).padStart(3)} pressed` + (f ? `, ${f} FAIL` : '') + (w ? `, ${w} warn` : ''));
  }

  console.log(`\n${routes.length} screens, ${clicks} presses, ${fails} failures, ${warns} warnings in ${Math.round((Date.now() - t0) / 1000)}s\n`);
  for (const [route, r] of Object.entries(report)) {
    const shown = r.findings.filter(x => x.kind !== 'OK');
    if (!shown.length) continue;
    console.log(route);
    shown.forEach(x => console.log(`    ${x.kind.padEnd(4)} ${x.label.padEnd(30)} ${x.detail}`));
  }
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
