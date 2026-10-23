/* Run every LBAP demo seeder in seeds/, in filename order.
 *
 * Each seeder owns its own collections and clears them before inserting, so
 * this is safe to re-run: it resets the demo to a known, coherent state.
 * Master data (customers, vendors, products, materials, plant, machines) comes
 * from seed-lbap.cjs — run that first if the database is empty.
 *
 *   node seed-lbap.cjs      # master data + core transactions
 *   node seed-all.cjs       # every module's demo data
 */
const fs = require('fs');
const path = require('path');
const { buildContext, mongoose } = require('./seeds/context.cjs');

(async () => {
  const dir = path.join(__dirname, 'seeds');
  const files = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.cjs') && f !== 'context.cjs')
    .sort();

  if (!files.length) {
    console.error('no seeders found in seeds/');
    process.exit(1);
  }

  const ctx = await buildContext();
  if (!ctx.plant || !ctx.customers.length) {
    console.error('master data missing — run `node seed-lbap.cjs` first');
    process.exit(1);
  }

  const totals = {};
  let grand = 0;

  for (const file of files) {
    const mod = require(path.join(dir, file));
    const label = mod.name || file;
    process.stdout.write(`${label.padEnd(26)} `);
    try {
      const counts = (await mod.run(ctx)) || {};
      const n = Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0);
      grand += n;
      Object.assign(totals, counts);
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]).slice(0, 4)
        .map(([k, v]) => `${k} ${v}`).join(', ');
      console.log(`${String(n).padStart(5)} rows   ${top}`);
    } catch (e) {
      console.log(`FAILED — ${e.message}`);
    }
  }

  console.log(`\n${grand} rows across ${Object.keys(totals).length} collections`);
  await mongoose.disconnect();
  process.exit(0);
})();
