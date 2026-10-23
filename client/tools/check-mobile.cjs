#!/usr/bin/env node
/* Opens every screen at phone size and reports the things that make a page
 * unusable in a hand: content wider than the screen (which forces sideways
 * panning on every page), controls too small to hit with a thumb, and text
 * too small to read. The role crawl proves a screen loads; this proves it
 * loads into 375 points.
 *
 *   node tools/check-mobile.cjs --base http://169.58.171.158:8082
 */
const path = require('path');
const fs = require('fs');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
/* The ERP's own port is 8083. It shared 8082 with the LAB Automotive
 * marketing site until that site took 8082 as its default_server; the ERP has
 * had 8083 to itself since. Still never 5060 — that port is WHATWG-blocked, so
 * fetch() refuses it and these scripts must go through nginx. */
const BASE = arg('base', 'http://169.58.171.158:8083');
const WIDTH = Number(arg('width', 375));
const HEIGHT = Number(arg('height', 812));
/* A thumb needs 34pt; a mouse does not. Above the touch breakpoint the app
   is designed for a pointer and a 30px menu row is correct, so the tap rule
   only applies where the app itself switches to fingertip sizing. */
const TOUCH_WIDTH = 1024;
const MIN_TAP = WIDTH <= TOUCH_WIDTH ? 34 : 0;
const MIN_FONT = 11;     // px — readable at arm's length on any screen

const appSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const routes = [...appSrc.matchAll(/path="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((p) => !p.includes(':') && !['*', '/login', '/unauthorized'].includes(p))
  .map((p) => (p.startsWith('/') ? p : '/' + p));

(async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  const ok = await page.evaluate(async () => {
    localStorage.clear();
    const r = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
    });
    const t = await r.text();
    let d; try { d = JSON.parse(t); } catch { return false; }
    if (d.token) localStorage.setItem('token', d.token);
    if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken);
    return !!d.token;
  });
  if (!ok) { console.error('login failed'); process.exit(2); }

  const problems = [];
  let checked = 0;

  for (const route of [...new Set(routes)]) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle0', timeout: 30000 });
      await page.waitForFunction(() => (document.body.innerText || '').trim().length > 40, { timeout: 10000 }).catch(() => {});
      const found = await page.evaluate((MIN_TAP, MIN_FONT) => {
        const out = [];
        const vw = window.innerWidth;

        if (document.documentElement.scrollWidth > vw + 1) {
          // Name the widest thing sticking out, so the fix has somewhere to go.
          let worst = null;
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.right <= vw + 1) continue;
            const style = getComputedStyle(el);
            if (style.position === 'fixed') continue;
            // Something inside its own scrolling box is contained, not spilling.
            let box = el.parentElement, contained = false;
            while (box && box !== document.body) {
              const o = getComputedStyle(box).overflowX;
              if (o === 'auto' || o === 'scroll') { contained = true; break; }
              box = box.parentElement;
            }
            if (contained) continue;
            if (!worst || r.right > worst.right) worst = { right: Math.round(r.right), tag: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''), text: (el.innerText || '').trim().slice(0, 40) };
          }
          out.push(`page is ${document.documentElement.scrollWidth}px wide on a ${vw}px screen` + (worst ? ` — widest: <${worst.tag}> reaching ${worst.right}px "${worst.text}"` : ''));
        }

        const small = [];
        for (const el of document.querySelectorAll('button, a[href], select, input:not([type=hidden]), [role=button]')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;          // hidden
          if (r.height >= MIN_TAP) continue;
          const label = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.tagName).trim().slice(0, 28);
          small.push(`${label} (${Math.round(r.height)}px)`);
        }
        if (small.length) out.push(`${small.length} control(s) under ${MIN_TAP}px tall: ${[...new Set(small)].slice(0, 4).join(', ')}`);

        const tiny = new Set();
        for (const el of document.querySelectorAll('body *')) {
          if (!el.childNodes.length) continue;
          const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2);
          if (!hasText) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs && fs < MIN_FONT) tiny.add(`${fs}px "${el.textContent.trim().slice(0, 24)}"`);
        }
        if (tiny.size) out.push(`${tiny.size} text run(s) under ${MIN_FONT}px: ${[...tiny].slice(0, 3).join(', ')}`);

        return out;
      }, MIN_TAP, MIN_FONT);

      checked++;
      if (found.length) problems.push({ route, found });
    } catch (e) {
      checked++;
      problems.push({ route, found: ['NAV ' + e.message.slice(0, 70)] });
    }
  }

  console.log(`\n${checked} screens at ${WIDTH}x${HEIGHT} — ${problems.length} with problems\n`);
  for (const p of problems) {
    console.log(`  ${p.route}`);
    p.found.forEach((f) => console.log(`      ${f}`));
  }
  if (!problems.length) console.log('  every screen fits, every control is thumb-sized');
  await browser.close();
  process.exit(problems.length ? 1 : 0);
})();
