// Which launchpad tiles and sidebar sections a user sees.
//
// ─── STILL A UI CONVENIENCE, NOT THE ONLY BOUNDARY ───────────────────────────
// requirePermission() and authorize() in server/src/middlewares/auth.middleware.js
// are real now — every create/update/delete route checks the caller's role
// against the same module names used here, and a Store Keeper genuinely
// cannot create a sales order (403). But most GET routes are open to any
// authenticated user regardless of role, so hiding a section here stops
// someone stumbling into a screen that means nothing to their job — it does
// not stop someone who goes looking. Never cite a hidden menu item as proof
// a role cannot reach the data behind it; cite the requirePermission() check.
//
// Module names below follow the server's requirePermission(...) spelling in
// server/src/routes/*.js, so the two agree. Nothing enforces that agreement
// mechanically today (client is ESM, server is CJS, no root package.json —
// a genuinely shared file needs build tooling we don't have), so a renamed
// module on one side silently stops matching on the other; canAccess() fails
// open when that happens rather than hiding a section for everyone.

export const MODULES = Object.freeze({
  APPROVALS: 'Approvals',
  AUDIT: 'Audit',
  CAPACITY: 'Capacity',
  COMPANY_SETUP: 'CompanySetup',
  DEMAND_PLANNING: 'DemandPlanning',
  DISPATCH: 'Dispatch',
  ENGINEERING: 'Engineering',
  FINANCE: 'Finance',
  GOODS_RECEIPT: 'GoodsReceipt',
  INVENTORY: 'Inventory',
  MAINTENANCE: 'Maintenance',
  MASTER_DATA: 'MasterData',
  MRP: 'MRP',
  PROCUREMENT: 'Procurement',
  PRODUCTION: 'Production',
  QUALITY: 'Quality',
  ROLES: 'Roles',
  SALES: 'Sales',
  SHOP_FLOOR: 'ShopFloor',
  // Not in the server list — the client needs them and App.jsx already
  // gates on its own names for both.
  USERS: 'Users',
  ANALYTICS: 'Analytics'
});

export const MODULE_LIST = Object.freeze(Object.values(MODULES));

const WILDCARD = '*';

// Collapses casing/spacing/punctuation drift: 'Company Setup', 'company_setup'
// and 'COMPANYSETUP' all land on the same key.
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Only for names that differ by actual words, not formatting. Left side is
// anything the three existing vocabularies emit (the role editor's four, the
// requiredModule values in App.jsx, and the seed data's 'All').
const ALIASES = {
  all: WILDCARD,
  usermanagement: MODULES.USERS,
  user: MODULES.USERS,
  rolespermissions: MODULES.ROLES,
  role: MODULES.ROLES,
  security: MODULES.ROLES,
  auditlogs: MODULES.AUDIT,
  ceodashboard: MODULES.ANALYTICS,
  dashboards: MODULES.ANALYTICS,
  reports: MODULES.ANALYTICS,
  company: MODULES.COMPANY_SETUP,
  master: MODULES.MASTER_DATA,
  masterdata: MODULES.MASTER_DATA,
  receipt: MODULES.GOODS_RECEIPT,
  grn: MODULES.GOODS_RECEIPT,
  demand: MODULES.DEMAND_PLANNING
};

const BY_NORM = MODULE_LIST.reduce((acc, name) => {
  acc[norm(name)] = name;
  return acc;
}, {});

/** Resolve any module spelling to a canonical name, WILDCARD, or null. */
const canonical = (raw) => {
  const key = norm(raw);
  if (!key) return null;
  return ALIASES[key] || BY_NORM[key] || null;
};

// The `user` object has three incompatible shapes depending on how the session
// was established — see client/src/contexts/AuthContext.jsx. All three are
// read here so callers never have to care which one they got.
const readPermissions = (user) => {
  if (!user) return null;
  // (a) page reload via /auth/me — role is the full Role document
  if (user.role && typeof user.role === 'object' && Array.isArray(user.role.permissions)) {
    return user.role.permissions;
  }
  // (b) fresh login — role is a string, permissions hoisted to top level
  if (Array.isArray(user.permissions)) return user.permissions;
  // (c) degraded session (AuthContext fallback when /auth/me times out) —
  //     no permissions at all. Caller fails open.
  return null;
};

/**
 * Can this user see the thing tagged with `moduleName`?
 *
 * `moduleName` may be a single name or an array, in which case any match wins
 * (Customers is reachable by Sales *or* MasterData people).
 *
 * Fails OPEN everywhere it cannot form a confident opinion. That is deliberate:
 * the live database has a Super Admin whose `permissions` array is empty, so a
 * fail-closed default would hide every tile from the owner of the system.
 */
export function canAccess(user, moduleName) {
  // Fail open 1 — untagged. Tagging is opt-in; a forgotten tag hides nothing.
  if (!moduleName) return true;

  const wanted = (Array.isArray(moduleName) ? moduleName : [moduleName])
    .map(canonical)
    .filter(Boolean);

  // Fail open 2 — the tag itself is unknown (typo). Never let a typo blank a
  // tile for everyone; surface it in development instead.
  if (wanted.length === 0) {
    if (import.meta.env.DEV) console.warn('[permissions] unknown module tag:', moduleName);
    return true;
  }

  const perms = readPermissions(user);

  // Fail open 3 — no permission data. Covers the empty-array Super Admin, a
  // user with no role, and the degraded session above.
  if (!perms || perms.length === 0) return true;

  const granted = new Set();
  for (const p of perms) {
    const key = canonical(p && p.module);
    if (key === WILDCARD) return true;
    if (key) granted.add(key);
  }

  // Fail open 4 — every entry present but none recognised, so we cannot reason
  // about this role at all. (A *partly* recognised role does not land here: one
  // junk entry alongside real ones should not grant everything.)
  if (granted.size === 0) return true;

  return wanted.some((w) => granted.has(w));
}
