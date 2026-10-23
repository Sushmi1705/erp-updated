/* One real user per job function on the shop floor, for quick sign-in.
 *
 * Every login so far has been the one Super Admin account, which sees every
 * screen and can do everything — useful for building the system, useless for
 * showing someone what a sales executive's day actually looks like versus a
 * store keeper's. requirePermission() and canAccess() both read a role's
 * `permissions` array for real now (see server/src/middlewares/auth.middleware.js
 * and client/src/utils/permissions.js), so a role with a genuine, narrow
 * permissions array produces a genuinely different, restricted app — not a
 * cosmetic relabelling.
 *
 * Idempotent: rerunning this only fills in what is missing. An existing role's
 * permissions and an existing user's password are left alone, so changes made
 * by hand in Roles & Access survive a rerun.
 *
 *   node seeds/quick-login-users.cjs
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const Role = require('../src/models/Role');
const User = require('../src/models/User');

// A module entry with no `actions` grants every action on that module — the
// same shorthand the seeded Super Admin role uses. `actions: ['read']` limits
// a role to looking, which requirePermission enforces on every create/update/
// delete route and canAccess reads to decide what shows in the sidebar.
const CATEGORIES = [
  {
    roleName: 'Sales Executive',
    email: 'sales.exec@lbap.in',
    firstName: 'Karthik',
    lastName: 'Raman',
    description: 'Raises quotations and sales orders, and checks stock before promising a delivery date.',
    permissions: [
      { module: 'Sales' },
      { module: 'MasterData', actions: ['read'] },
      { module: 'Inventory', actions: ['read'] },
      { module: 'Dispatch', actions: ['read'] }
    ]
  },
  {
    roleName: 'Purchase Officer',
    email: 'purchase.officer@lbap.in',
    firstName: 'Deepa',
    lastName: 'Iyer',
    description: 'Converts material-plan suggestions into purchase orders and tracks what suppliers still owe.',
    permissions: [
      { module: 'Procurement' },
      { module: 'MRP', actions: ['read'] },
      { module: 'MasterData', actions: ['read'] },
      { module: 'GoodsReceipt', actions: ['read'] },
      // The material plan runs off consolidated demand; that screen loads it.
      { module: 'DemandPlanning', actions: ['read'] }
    ]
  },
  {
    roleName: 'Store Keeper',
    email: 'store.keeper@lbap.in',
    firstName: 'Muthuvel',
    lastName: 'Pandian',
    description: 'Receives material at the gate, inspects it and posts what is accepted into the store.',
    permissions: [
      { module: 'GoodsReceipt' },
      { module: 'Inventory' },
      { module: 'MasterData', actions: ['read'] },
      // Receipts are against purchase orders; the inspection screen loads them.
      { module: 'Procurement', actions: ['read'] }
    ]
  },
  {
    roleName: 'Production Planner',
    email: 'production.planner@lbap.in',
    firstName: 'Arun',
    lastName: 'Kumar',
    description: 'Runs the material plan, releases work orders and checks machine capacity before committing a date.',
    permissions: [
      { module: 'Production' },
      { module: 'MRP' },
      { module: 'Capacity' },
      { module: 'Engineering', actions: ['read'] },
      { module: 'DemandPlanning', actions: ['read'] },
      { module: 'MasterData', actions: ['read'] }
    ]
  },
  {
    roleName: 'Shop Floor Supervisor',
    email: 'shopfloor.supervisor@lbap.in',
    firstName: 'Selvaraj',
    lastName: 'Murugan',
    description: 'Runs the presses day to day — issues material to a job, logs output, downtime and scrap.',
    permissions: [
      { module: 'ShopFloor' },
      { module: 'Production' },
      { module: 'MasterData', actions: ['read'] }
    ]
  },
  {
    roleName: 'Quality Inspector',
    email: 'quality.inspector@lbap.in',
    firstName: 'Priya',
    lastName: 'Sundaram',
    description: 'Inspects incoming, in-process and final parts, and raises a non-conformance when one fails.',
    permissions: [
      { module: 'Quality' },
      { module: 'GoodsReceipt', actions: ['read'] },
      { module: 'Production', actions: ['read'] },
      { module: 'MasterData', actions: ['read'] },
      // Incoming inspection is done against the purchase order it arrived on.
      { module: 'Procurement', actions: ['read'] }
    ]
  },
  {
    roleName: 'Maintenance Engineer',
    email: 'maintenance.engineer@lbap.in',
    firstName: 'Ravishankar',
    lastName: 'Pillai',
    description: 'Keeps the presses running — planned service, breakdown repair and the spares that cover them.',
    permissions: [
      { module: 'Maintenance' },
      { module: 'MasterData', actions: ['read'] },
      { module: 'ShopFloor', actions: ['read'] },
      // Downtime and breakdowns are logged against the job that was running.
      { module: 'Production', actions: ['read'] }
    ]
  },
  {
    roleName: 'Dispatch Coordinator',
    email: 'dispatch.coordinator@lbap.in',
    firstName: 'Lakshmi',
    lastName: 'Narayanan',
    description: 'Plans deliveries, books the vehicle and confirms dispatch once goods are loaded.',
    permissions: [
      { module: 'Dispatch' },
      { module: 'Sales', actions: ['read'] },
      { module: 'Inventory', actions: ['read'] },
      { module: 'MasterData', actions: ['read'] }
    ]
  },
  {
    roleName: 'Accounts Executive',
    email: 'accounts.executive@lbap.in',
    firstName: 'Meenakshi',
    lastName: 'Krishnan',
    description: 'Raises customer invoices, records receipts and payments, and keeps the books straight.',
    permissions: [
      { module: 'Finance' },
      { module: 'Sales', actions: ['read'] },
      { module: 'Procurement', actions: ['read'] },
      { module: 'MasterData', actions: ['read'] },
      // Stock value goes on the balance sheet; accounts needs to read it.
      { module: 'Inventory', actions: ['read'] }
    ]
  },
  {
    roleName: 'Plant Manager',
    email: 'plant.manager@lbap.in',
    firstName: 'Suresh',
    lastName: 'Babu',
    description: 'Sees the whole shop floor and order book at a glance — everything operational, none of the admin or money screens.',
    permissions: [
      { module: 'Production' },
      { module: 'ShopFloor' },
      { module: 'Quality' },
      { module: 'Maintenance' },
      { module: 'Capacity' },
      { module: 'MRP' },
      { module: 'Dispatch' },
      { module: 'Sales', actions: ['read'] },
      { module: 'Procurement', actions: ['read'] },
      { module: 'Inventory', actions: ['read'] },
      // Deliberately no Finance. It is a single all-or-nothing module covering
      // receivables, payables, the ledger, GST and costing, so granting it to
      // see the company overview also handed a plant manager every customer's
      // outstanding balance and credit exposure — which is the accounts
      // department's business, not the shop floor's.
      { module: 'MasterData', actions: ['read'] },
      { module: 'Engineering', actions: ['read'] },
      { module: 'DemandPlanning', actions: ['read'] }
    ]
  }
];

// Matches the seeded dev fixture password everywhere else in this project, so
// there is exactly one convention to remember, not eleven.
const DEMO_PASSWORD = 'password123';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Quick-login users\n');

  for (const cat of CATEGORIES) {
    let role = await Role.findOne({ name: cat.roleName });
    if (!role) {
      role = await Role.create({
        name: cat.roleName,
        description: cat.description,
        permissions: cat.permissions,
        isActive: true,
        isSystem: false
      });
      console.log(`  + role  ${cat.roleName}`);
    } else {
      console.log(`  = role  ${cat.roleName} (already exists — left as is)`);
    }

    const existingUser = await User.findOne({ email: cat.email });
    if (!existingUser) {
      await User.create({
        firstName: cat.firstName,
        lastName: cat.lastName,
        email: cat.email,
        password: DEMO_PASSWORD, // hashed by the User pre-save hook
        role: role._id,
        status: 'Active'
      });
      console.log(`      user  ${cat.email}`);
    } else {
      console.log(`      user  ${cat.email} (already exists — password left as is)`);
    }
  }

  console.log(`\n${CATEGORIES.length} category logins ready, password "${DEMO_PASSWORD}" for any newly created ones.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
