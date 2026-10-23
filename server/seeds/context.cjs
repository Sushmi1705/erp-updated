/* Shared context for the LBAP demo seeders.
 *
 * Every module seeder is a file in this directory exporting
 *   module.exports = { name, run: async (ctx) => ({ collection: count, ... }) }
 * and receives this context so they all hang off the same master data rather
 * than inventing their own.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
const mongoose = require('mongoose');
const path = require('path');

const M = (p) => require(path.join(__dirname, '..', 'src', 'models', p));

// Deterministic-ish helpers so repeated runs look plausible, not identical.
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const rndN = (a, n) => [...a].sort(() => Math.random() - 0.5).slice(0, n);
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const money = (lo, hi) => Math.round(randInt(lo, hi) / 10) * 10;
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const daysAhead = (n) => new Date(Date.now() + n * 864e5);
const pad = (n, w = 4) => String(n).padStart(w, '0');
const YEAR = new Date().getFullYear();

async function buildContext() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  const db = mongoose.connection.db;

  const col = (c) => db.collection(c);
  const all = async (c, q = {}) => col(c).find(q).toArray();

  const [customers, vendors, products, materials, warehouses, machines, workcenters,
         users, plants, companies, uoms, currencies, departments, soheaders, poheaders] =
    await Promise.all([
      all('customers'), all('vendors'), all('products'), all('materials'),
      all('warehouses'), all('machines'), all('workcenters'), all('users'),
      all('plants'), all('companies'), all('uoms'), all('currencies'),
      all('departments'), all('soheaders'), all('poheaders')
    ]);

  const byName = (list, needle) => list.find((x) => (x.name || '').toLowerCase().includes(needle));

  return {
    mongoose, db, col, M,
    rnd, rndN, randInt, money, daysAgo, daysAhead, pad, YEAR,
    customers, vendors, products, materials, warehouses, machines, workcenters,
    users, departments, soheaders, poheaders,
    plant: plants.find((p) => p.code === 'LBAP-HOSUR') || plants[0],
    company: companies.find((c) => c.code === 'LBAP') || companies[0],
    admin: users.find((u) => u.email === 'admin@example.com') || users[0],
    inr: currencies.find((c) => c.code === 'INR') || currencies[0],
    uomKg: uoms.find((u) => u.symbol === 'kg'),
    uomEa: uoms.find((u) => u.symbol === 'ea'),
    whRM: byName(warehouses, 'raw') || warehouses[0],
    whWIP: byName(warehouses, 'wip') || warehouses[0],
    whFG: byName(warehouses, 'finished') || warehouses[0],
    // Steel coil/sheet only — excludes consumables and tool steel.
    steel: materials.filter((m) => /coil|sheet/i.test(m.name)),
    // Sellable finished parts — excludes the press tool.
    sellable: products.filter((p) => !/die|tool/i.test(p.name))
  };
}

module.exports = { buildContext, mongoose };
