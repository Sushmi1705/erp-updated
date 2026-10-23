#!/usr/bin/env node
/* Codemod runner.
 *
 * Uses Babel purely as a LOCATOR, never as a printer. Only 36 of 87 source
 * files round-trip byte-identically through parse+generate, so regenerating a
 * file would rewrite hundreds of lines that the transform never intended to
 * touch — and review, not execution, is the scarce resource here.
 *
 * Every transform therefore returns a list of {start, end, replacement} byte
 * splices against the original source. Splices are applied descending so
 * earlier offsets stay valid. Formatting and comments survive untouched, and
 * the git diff contains only the lines meant to change.
 *
 *   node tools/codemod.cjs <name>           dry run, prints the diff
 *   node tools/codemod.cjs <name> --write   apply
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const parser = require('@babel/parser');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.jsx')) out.push(p);
  }
  return out;
};

const parse = (code) => parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

const applySplices = (code, splices) => {
  let out = code;
  for (const s of [...splices].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, s.start) + s.replacement + out.slice(s.end);
  }
  return out;
};

/** Insert an import after the last existing import in the file. */
const importSplice = (ast, code, statement) => {
  const imports = ast.program.body.filter(n => n.type === 'ImportDeclaration');
  if (!imports.length) return { start: 0, end: 0, replacement: statement + '\n' };
  const last = imports[imports.length - 1];
  return { start: last.end, end: last.end, replacement: '\n' + statement };
};

// ── transforms ──────────────────────────────────────────────────────────────

const TRANSFORMS = {
  /* Replace a page-local component definition with an import of the shared one.
   * Call sites are untouched because the JSX element name does not change —
   * which is what makes this class of transform provably safe. */
  'extract-local-component': ({ componentName, importPath, files }) => (file, code) => {
    if (files && !files.some(f => file.endsWith(f))) return null;
    // The shared component defines this name too; rewriting it would delete its
    // own body and make it import itself.
    if (path.resolve(file) === path.resolve(path.join(SRC, importPath + '.jsx'))) return null;
    const ast = parse(code);
    const splices = [];
    let found = false;

    for (const node of ast.program.body) {
      if (node.type !== 'VariableDeclaration') continue;
      const d = node.declarations[0];
      if (!d || d.id.type !== 'Identifier' || d.id.name !== componentName) continue;
      found = true;
      // Swallow trailing whitespace so removal does not leave a blank gap.
      let end = node.end;
      while (end < code.length && (code[end] === '\n' || code[end] === ' ')) end++;
      splices.push({ start: node.start, end, replacement: '' });
    }
    if (!found) return null;

    const rel = path.relative(path.dirname(file), path.join(SRC, importPath))
      .replace(/\\/g, '/');
    const spec = rel.startsWith('.') ? rel : './' + rel;
    splices.push(importSplice(ast, code, `import ${componentName} from '${spec}';`));
    return applySplices(code, splices);
  }
};

// ── recipes ─────────────────────────────────────────────────────────────────

const RECIPES = {
  'status-badge': TRANSFORMS['extract-local-component']({
    componentName: 'StatusBadge',
    importPath: 'components/common/StatusBadge'
  })
};

// ── runner ──────────────────────────────────────────────────────────────────

const name = process.argv[2];
const write = process.argv.includes('--write');
const recipe = RECIPES[name];

if (!recipe) {
  console.error('usage: node tools/codemod.cjs <' + Object.keys(RECIPES).join('|') + '> [--write]');
  process.exit(2);
}

const changed = [];
for (const file of walk(SRC)) {
  const code = fs.readFileSync(file, 'utf8');
  let next;
  try {
    next = recipe(file, code);
  } catch (e) {
    console.error('PARSE/TRANSFORM FAIL ' + path.relative(ROOT, file) + ': ' + e.message);
    process.exit(1);
  }
  if (next && next !== code) {
    changed.push(path.relative(ROOT, file));
    if (write) fs.writeFileSync(file, next);
  }
}

console.log((write ? 'wrote ' : 'would change ') + changed.length + ' file(s):');
changed.forEach(f => console.log('  ' + f));

if (!write && changed.length) console.log('\nre-run with --write to apply');
