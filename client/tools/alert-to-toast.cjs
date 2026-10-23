#!/usr/bin/env node
/* Replaces window.alert() with a non-blocking toast.
 *
 * Byte splices only — this file is never printed from an AST, because a
 * round-trip through a printer reformats files it should not touch.
 *
 * The tone is read from the message the code already writes: an alert that says
 * "Failed to save" is an error, one that says "Order created" is a success. That
 * distinction is the whole point — a browser dialog cannot show it, so today
 * every outcome looks identical to the operator.
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');

const DRY = !process.argv.includes('--write');
const SRC = path.join(__dirname, '..', 'src');

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.jsx') || e.name.endsWith('.js')) out.push(p);
  }
  return out;
};

// 'Could not …' is the most common phrasing in this codebase and reads as an
// error to the operator, even when it ends with a polite 'Please try again'.
const NEGATIVE = /fail|error|could ?n[o']t|cannot|can't|unable|invalid|not found|\bno\b|denied|reject|exceed|required|must |missing|already exist|wrong|insufficient|expired/i;
const POSITIVE = /success|created|updated|saved|deleted|removed|approved|posted|completed|added|sent|generated|converted|released|issued|recorded|submitted/i;
// Prompts that ask the operator to supply something before continuing.
const CAUTION  = /warn|please |select |enter |choose |confirm|check |at least one|before saving|before you/i;

const toneOf = (snippet) => {
  if (NEGATIVE.test(snippet)) return 'error';
  if (POSITIVE.test(snippet)) return 'success';
  if (CAUTION.test(snippet)) return 'warning';
  return 'info';
};

// Match alert( / window.alert( where `alert` is a real call, not part of a
// longer identifier and not a property of something else.
const CALL = /(?<![\w.$])(?:window\s*\.\s*)?alert\s*\(/g;

let files = 0, calls = 0, skipped = [];
const tally = { error: 0, success: 0, warning: 0, info: 0 };

for (const file of walk(SRC)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/alert\s*\(/.test(src)) continue;

  // Collect comment ranges so an alert() mentioned in prose is left alone.
  let comments = [];
  try {
    comments = (parse(src, { sourceType: 'module', plugins: ['jsx'] }).comments || [])
      .map(c => [c.start, c.end]);
  } catch { skipped.push([file, 'does not parse before edit']); continue; }
  const inComment = (i) => comments.some(([a, b]) => i >= a && i < b);

  // Read the tone from the alert's own argument only. A fixed-width slice runs
  // past the closing paren into whatever follows — usually a catch block whose
  // "Failed to…" then colours an unrelated success message as an error.
  const argumentOf = (openParenIndex) => {
    let depth = 0;
    for (let i = openParenIndex; i < src.length; i++) {
      const c = src[i];
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth === 0) return src.slice(openParenIndex + 1, i); }
      else if (c === '"' || c === "'" || c === '`') {
        // Skip string bodies so a paren inside a message cannot unbalance this.
        const quote = c;
        i++;
        while (i < src.length && src[i] !== quote) { if (src[i] === '\\') i++; i++; }
      }
    }
    return src.slice(openParenIndex, openParenIndex + 200);
  };

  const edits = [];
  for (const m of src.matchAll(CALL)) {
    if (inComment(m.index)) continue;
    const openParen = m.index + m[0].length - 1;
    const tone = toneOf(argumentOf(openParen));
    edits.push({ start: m.index, end: m.index + m[0].length, tone });
  }
  if (!edits.length) continue;

  let out = src;
  for (const e of [...edits].reverse()) {
    out = out.slice(0, e.start) + `notify.${e.tone}(` + out.slice(e.end);
  }

  // Add the import after the final top-level import line.
  if (!/from ['"][^'"]*utils\/notify['"]/.test(out)) {
    const importRe = /^import[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*$/gm;
    let last = null, mm;
    while ((mm = importRe.exec(out))) last = mm;
    if (!last) { skipped.push([file, 'no import statement to anchor to']); continue; }
    const rel = path.relative(path.dirname(file), path.join(SRC, 'utils', 'notify'))
      .split(path.sep).join('/');
    const spec = rel.startsWith('.') ? rel : './' + rel;
    const at = last.index + last[0].length;
    out = out.slice(0, at) + `\nimport { notify } from '${spec}';` + out.slice(at);
  }

  try {
    parse(out, { sourceType: 'module', plugins: ['jsx'] });
  } catch (err) {
    skipped.push([file, 'would not parse after edit: ' + err.message.slice(0, 60)]);
    continue;
  }

  files++; calls += edits.length;
  edits.forEach(e => tally[e.tone]++);
  if (!DRY) fs.writeFileSync(file, out);
}

console.log(`${DRY ? 'DRY RUN' : 'WROTE'}  ${calls} alerts in ${files} files`);
console.log(`  error ${tally.error} · success ${tally.success} · warning ${tally.warning} · info ${tally.info}`);
if (skipped.length) {
  console.log(`  skipped ${skipped.length}:`);
  skipped.forEach(([f, why]) => console.log(`    ${path.relative(SRC, f)} — ${why}`));
}
