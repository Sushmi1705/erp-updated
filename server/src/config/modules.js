/* The access catalogue — the one list of what a role can be given.
 *
 * This is the server's list, because the server is what enforces it:
 * requirePermission(module, action) in auth.middleware.js matches on these
 * exact names. The Roles & Access screen asks for this catalogue rather than
 * carrying its own copy, which is how the editor drifted to four modules while
 * the system grew to twenty-one — a role for a store keeper could not be built
 * on that screen at all.
 *
 * Every entry carries the words a plant manager would use, not the words a
 * developer would. `what` says what the area is; `whoTypically` names the job
 * that usually holds it, so whoever sets up a new person has somewhere to
 * start.
 */

/* The five things a role can be allowed to do in an area. `approve` is
 * separate from `update` on purpose: signing off a purchase order is a
 * different job from typing it. */
const ACTIONS = [
  { key: 'read', label: 'View', hint: 'Open the screens and see the records. Without this the area is hidden.' },
  { key: 'create', label: 'Add', hint: 'Raise new records — a new order, a new receipt, a new inspection.' },
  { key: 'update', label: 'Change', hint: 'Edit a record that already exists, and move it along its stages.' },
  { key: 'delete', label: 'Delete', hint: 'Remove a record. Rare — most things should be cancelled, not deleted.' },
  { key: 'approve', label: 'Approve', hint: 'Sign off what someone else raised, where the screen asks for approval.' }
];

const GROUPS = [
  {
    key: 'sell',
    label: 'Selling and delivering',
    hint: 'Everything from a customer enquiry to the lorry leaving the gate.',
    modules: [
      { module: 'Sales', label: 'Sales', what: 'Customer enquiries, quotations and sales orders.', whoTypically: 'Sales executive' },
      { module: 'Dispatch', label: 'Dispatch', what: 'Planning deliveries, booking the vehicle, confirming what went out.', whoTypically: 'Dispatch coordinator' },
      { module: 'DemandPlanning', label: 'Demand Planning', what: 'What customers are expected to need in the coming months.', whoTypically: 'Production planner' }
    ]
  },
  {
    key: 'buy',
    label: 'Buying and stores',
    hint: 'Ordering material, receiving it at the gate, and what sits on the shelves.',
    modules: [
      { module: 'Procurement', label: 'Purchasing', what: 'Purchase requests, supplier quotations and purchase orders.', whoTypically: 'Purchase officer' },
      { module: 'GoodsReceipt', label: 'Goods Receiving', what: 'Booking in material that arrives, and the inspection that follows.', whoTypically: 'Store keeper' },
      { module: 'Inventory', label: 'Stock', what: 'What is in the store right now, where it sits and what it is worth.', whoTypically: 'Store keeper' },
      { module: 'MRP', label: 'Material Planning (MRP)', what: 'Works out what to buy and make, and by when.', whoTypically: 'Production planner' }
    ]
  },
  {
    key: 'make',
    label: 'Making',
    hint: 'The plan, the work orders, and the presses themselves.',
    modules: [
      { module: 'Production', label: 'Production', what: 'Production plans, work orders and recorded output.', whoTypically: 'Production planner' },
      { module: 'ShopFloor', label: 'Shop Floor', what: 'Machine running time, downtime, operators and scrap.', whoTypically: 'Shop floor supervisor' },
      { module: 'Capacity', label: 'Capacity Planning', what: 'Machine hours and manpower against what has been promised.', whoTypically: 'Production planner' },
      { module: 'Engineering', label: 'Engineering', what: 'Parts lists (BOM), process steps and design change requests.', whoTypically: 'Engineering' }
    ]
  },
  {
    key: 'check',
    label: 'Quality and upkeep',
    hint: 'Checking the parts, and keeping the machines running.',
    modules: [
      { module: 'Quality', label: 'Quality', what: 'Incoming, in-process and final inspection, and non-conformances.', whoTypically: 'Quality inspector' },
      { module: 'Maintenance', label: 'Maintenance', what: 'Planned service, breakdowns and the spares that cover them.', whoTypically: 'Maintenance engineer' }
    ]
  },
  {
    key: 'money',
    label: 'Money',
    hint: 'Customer invoices, supplier bills, the ledger and GST. Sensitive — this is where every customer’s outstanding balance lives.',
    modules: [
      { module: 'Finance', label: 'Finance and Accounts', what: 'Money in, money out, the general ledger, GST and costing.', whoTypically: 'Accounts executive', sensitive: true },
      { module: 'Analytics', label: 'Reports and Analytics', what: 'The department reports and the company overview.', whoTypically: 'Plant manager' }
    ]
  },
  {
    key: 'setup',
    label: 'Setup and administration',
    hint: 'The standing lists everything else is built on, and who may use the system.',
    modules: [
      { module: 'MasterData', label: 'Master Data', what: 'Customers, suppliers, materials, machines, warehouses and units.', whoTypically: 'Almost everyone needs View here' },
      { module: 'CompanySetup', label: 'Company Setup', what: 'Company name, GSTIN, plants and addresses.', whoTypically: 'Administrator', sensitive: true },
      { module: 'Users', label: 'Users and Logins', what: 'Adding staff and resetting their logins.', whoTypically: 'Administrator', sensitive: true },
      { module: 'Roles', label: 'Roles and Access', what: 'This screen. Anyone with Change here can grant themselves anything.', whoTypically: 'Administrator', sensitive: true },
      { module: 'Approvals', label: 'Approvals', what: 'Who signs off what, and the limits they sign off up to.', whoTypically: 'Plant manager', sensitive: true },
      { module: 'Audit', label: 'Change History', what: 'Who changed what and when. Read-only by nature.', whoTypically: 'Administrator' }
    ]
  }
];

const MODULES = GROUPS.flatMap((g) => g.modules.map((m) => m.module));
const MODULE_SET = new Set(MODULES);
const ACTION_SET = new Set(ACTIONS.map((a) => a.key));

/** The catalogue as the Roles screen needs it. */
const catalogue = () => ({ groups: GROUPS, actions: ACTIONS });

/**
 * Cleans a permissions array coming from a client.
 *
 * Returns { permissions, rejected }. Unknown module names and unknown actions
 * are dropped rather than stored: a typo used to be saved happily and then
 * matched nothing at enforcement time, so the role looked granted on screen
 * and denied in practice.
 */
const sanitisePermissions = (input) => {
  const rejected = [];
  const byModule = new Map();
  for (const entry of Array.isArray(input) ? input : []) {
    const name = entry && entry.module;
    if (!MODULE_SET.has(name)) { if (name) rejected.push(`module "${name}"`); continue; }
    const actions = (Array.isArray(entry.actions) ? entry.actions : []).filter((a) => {
      if (ACTION_SET.has(a)) return true;
      rejected.push(`action "${a}" on ${name}`);
      return false;
    });
    // An entry with no actions means "everything on this module" to
    // entryAllowsAction(). Ticking nothing must mean no access at all, so an
    // empty entry is dropped instead of silently granting the module.
    if (actions.length === 0) continue;
    byModule.set(name, { module: name, actions: [...new Set(actions)] });
  }
  return { permissions: [...byModule.values()], rejected };
};

module.exports = { GROUPS, ACTIONS, MODULES, catalogue, sanitisePermissions };
