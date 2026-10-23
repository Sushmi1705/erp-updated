#!/usr/bin/env node
/* Replaces window.confirm() with the in-app confirmation dialog.
 *
 * The dialog is asynchronous, so each call site has to await it — which is only
 * legal inside an async function. Babel locates the enclosing function and the
 * site is skipped and reported if it is not async, because silently adding
 * `await` to a synchronous handler would make the guard evaluate a Promise,
 * which is always truthy: every confirmation would pass and the delete would
 * go through unasked. Byte splices only; the file is never printed from an AST.
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

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

let converted = 0, skipped = [];
const touchedFiles = [];

for (const file of walk(SRC)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/\bconfirm\s*\(/.test(src)) continue;
  if (file.endsWith('confirmAction.js') || file.endsWith('ConfirmDialog.jsx')) continue;

  let ast;
  try { ast = parse(src, { sourceType: 'module', plugins: ['jsx'] }); }
  catch { skipped.push([file, 'does not parse']); continue; }

  const edits = [];
  traverse(ast, {
    CallExpression(p) {
      const c = p.node.callee;
      const isConfirm =
        (c.type === 'Identifier' && c.name === 'confirm') ||
        (c.type === 'MemberExpression' && c.object.name === 'window' && c.property.name === 'confirm');
      if (!isConfirm) return;

      const fn = p.getFunctionParent();
      if (!fn || !fn.node.async) {
        skipped.push([file, `line ${p.node.loc.start.line} — enclosing function is not async`]);
        return;
      }
      // Replace just the callee, keeping the argument expression as authored.
      edits.push({ start: c.start, end: c.end, line: p.node.loc.start.line });
    }
  });

  if (!edits.length) continue;

  let out = src;
  for (const e of [...edits].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + 'await confirmAction' + out.slice(e.end);
  }

  if (!/from ['"][^'"]*utils\/confirmAction['"]/.test(out)) {
    const importRe = /^import[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*$/gm;
    let last = null, m;
    while ((m = importRe.exec(out))) last = m;
    if (!last) { skipped.push([file, 'no import to anchor to']); continue; }
    const rel = path.relative(path.dirname(file), path.join(SRC, 'utils', 'confirmAction'))
      .split(path.sep).join('/');
    const spec = rel.startsWith('.') ? rel : './' + rel;
    const at = last.index + last[0].length;
    out = out.slice(0, at) + `\nimport { confirmAction } from '${spec}';` + out.slice(at);
  }

  try { parse(out, { sourceType: 'module', plugins: ['jsx'] }); }
  catch (err) { skipped.push([file, 'would not parse: ' + err.message.slice(0, 60)]); continue; }

  converted += edits.length;
  touchedFiles.push([path.relative(SRC, file), edits.length]);
  if (!DRY) fs.writeFileSync(file, out);
}

console.log(`${DRY ? 'DRY RUN' : 'WROTE'}  ${converted} confirmations in ${touchedFiles.length} files`);
touchedFiles.forEach(([f, n]) => console.log(`  ${f}  (${n})`));
if (skipped.length) {
  console.log(`\nskipped ${skipped.length} — need hand conversion:`);
  skipped.forEach(([f, why]) => console.log(`  ${path.relative(SRC, f)} — ${why}`));
}
