#!/usr/bin/env node
/* Tier 0 verification gate.
 *
 * A clean lint run is not achievable here — there are ~394 pre-existing
 * problems — so the gate is "no NEW errors", measured per (file, rule)
 * against a committed baseline.
 *
 * Two rules are held at absolute zero because they catch exactly the way a
 * mechanical migration fails:
 *   no-undef                   a component deleted but still referenced in JSX
 *                              (ESLint resolves JSX element names)
 *   react-hooks/rules-of-hooks a hook inserted into a callback instead of the
 *                              component body, e.g. by an alert-to-toast codemod
 *
 * Usage:  node tools/lint-gate.js          check against baseline
 *         node tools/lint-gate.js --save   record current state as baseline
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASELINE = path.join(__dirname, 'lint-baseline.json');
const ZERO_TOLERANCE = ['no-undef', 'react-hooks/rules-of-hooks'];

const collect = () => {
  let out;
  try {
    out = execFileSync('node', [
      path.join(ROOT, 'node_modules/eslint/bin/eslint.js'), 'src', '--format', 'json'
    ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    // eslint exits non-zero whenever errors exist, which here is always.
    out = e.stdout;
  }
  const counts = {};
  for (const file of JSON.parse(out)) {
    const rel = path.relative(ROOT, file.filePath);
    for (const m of file.messages) {
      const key = rel + ' ' + (m.ruleId || 'none');
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return counts;
};

const counts = collect();
const total = Object.values(counts).reduce((a, b) => a + b, 0);
const files = new Set(Object.keys(counts).map(k => k.split(' ')[0])).size;

if (process.argv.includes('--save')) {
  fs.writeFileSync(BASELINE, JSON.stringify(counts, null, 0));
  console.log('baseline saved: ' + total + ' problems across ' + files + ' files');
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.error('no baseline - run: node tools/lint-gate.js --save');
  process.exit(2);
}

const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
const regressions = [];

for (const [key, n] of Object.entries(counts)) {
  const sp = key.indexOf(' ');
  const file = key.slice(0, sp);
  const rule = key.slice(sp + 1);
  if (ZERO_TOLERANCE.includes(rule)) {
    regressions.push(file + ': ' + n + 'x ' + rule + '  [MUST BE ZERO]');
  } else if (n > (base[key] || 0)) {
    regressions.push(file + ': ' + rule + ' ' + (base[key] || 0) + ' -> ' + n);
  }
}

if (regressions.length) {
  console.error('FAIL - ' + regressions.length + ' regression(s):');
  regressions.forEach(r => console.error('  ' + r));
  process.exit(1);
}
console.log('PASS - ' + total + ' problems, none new; no-undef and rules-of-hooks at zero');
