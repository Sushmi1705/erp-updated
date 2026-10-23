const jwt = require('jsonwebtoken');
const { requiredSecret } = require('../utils/generateToken');
const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');

// The DB is a long round trip from this app server (~225ms per query), and
// populate('role') costs a second one on every authenticated request. Roles are
// a tiny, rarely-changing set, so serve them from a short-lived in-process cache.
const ROLE_CACHE_TTL_MS = 60 * 1000;
let roleCache = { at: 0, byId: new Map() };

/* Drop the cache the moment a role is written.
 *
 * Without this a permission change took up to a minute to reach anyone
 * already signed in, while the Roles & Access screen told the administrator
 * they would see it immediately. For a permission being *taken away* — a role
 * switched off, Finance unticked after someone left the department — a minute
 * of continued access is the wrong answer, so role.controller.js calls this on
 * every create, update and delete. The cache still absorbs the read traffic it
 * was built for; it just never serves a role that has since changed.
 *
 * In-process, like the token denylist above: a second app instance keeps its
 * own copy for up to the TTL. One instance runs here.
 */
const invalidateRoleCache = () => { roleCache = { at: 0, byId: new Map() }; };

const getRoleById = async (roleId) => {
  if (!roleId) return null;
  const key = String(roleId);
  if (Date.now() - roleCache.at < ROLE_CACHE_TTL_MS) {
    const hit = roleCache.byId.get(key);
    if (hit) return hit;
  }
  const roles = await Role.find().lean();
  roleCache = { at: Date.now(), byId: new Map(roles.map(r => [String(r._id), r])) };
  return roleCache.byId.get(key) || null;
};

// Attach the cached role document in place of a populate() round trip.
const withRole = async (userDoc) => {
  if (!userDoc) return userDoc;
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  user.role = await getRoleById(user.role);
  return user;
};

// Clients send the session JWT as a Bearer header (the SPA keeps it in
// localStorage); the httpOnly cookie is the fallback for same-site requests.
const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
};

// Logout has to end a session carried by a stateless JWT, so tokens surrendered
// at logout are held here until their own `exp` passes.
// Tradeoff: this lives in process memory. A restart or a second app instance
// forgets the revocation and the token works again until it expires on its own
// (JWT_EXPIRE, 15m in this deployment) — which is why entries are keyed by exp
// and pruned, so the map cannot grow without bound. A durable denylist or a
// tokenVersion column compared in protect() would survive both, but either needs
// a User schema change or an external store; neither is in scope here.
const revokedTokens = new Map(); // sha256(token) -> expiry in epoch ms
const MAX_REVOCATION_MS = 7 * 24 * 60 * 60 * 1000;

const tokenFingerprint = (token) => crypto.createHash('sha256').update(token).digest('hex');

const revokeToken = (token) => {
  if (!token) return;
  const decoded = jwt.decode(token);
  const expiresAt = decoded && decoded.exp ? decoded.exp * 1000 : Date.now() + MAX_REVOCATION_MS;
  if (expiresAt <= Date.now()) return; // already dead on its own

  const now = Date.now();
  for (const [fingerprint, entryExpiry] of revokedTokens) {
    if (entryExpiry <= now) revokedTokens.delete(fingerprint);
  }
  revokedTokens.set(tokenFingerprint(token), expiresAt);
};

// generateToken() signs only {id} with an iat in whole seconds, so a token minted
// in the same second as a revoked one is byte-identical and would inherit its
// revocation — logging out and straight back in would fail until the old exp.
// Callers that have just re-proven credentials clear the entry to avoid that.
const clearRevocation = (token) => {
  if (token) revokedTokens.delete(tokenFingerprint(token));
};

const isTokenRevoked = (token) => {
  const fingerprint = tokenFingerprint(token);
  const expiresAt = revokedTokens.get(fingerprint);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    revokedTokens.delete(fingerprint);
    return false;
  }
  return true;
};

const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token || isTokenRevoked(token)) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  let decoded;
  try {
    const secret = requiredSecret('JWT_SECRET');
    decoded = jwt.verify(token, secret);
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  // The password-expiry temp token carries `tempId`, not `id`, and must not open a
  // session; reject it here rather than letting findById fall back to a broad query.
  if (!decoded || !decoded.id) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  const currentUser = await User.findById(decoded.id).lean();
  if (!currentUser) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  if (currentUser.status !== 'Active') {
    return res.status(403).json({ success: false, message: 'Account is not active. Please contact administrator.' });
  }

  req.user = await withRole(currentUser);

  /* A role switched off in Roles & Access blocks everyone holding it.
   *
   * `isActive` existed on the Role model and on the screen, and nothing
   * anywhere read it — switching a role off looked like it had worked and
   * changed nothing at all. It is the gentler alternative to deleting a role
   * (which orphans its users), so it has to actually stop them. */
  const activeRole = req.user && req.user.role;
  if (activeRole && typeof activeRole === 'object' && activeRole.isActive === false) {
    return res.status(403).json({
      success: false,
      message: `Your role "${activeRole.name}" has been switched off. Ask an administrator to switch it back on or move you to another role.`
    });
  }

  return next();
};

// Full access has to come from the role's identity, not its permission list: the
// live 'Super Admin' role carries an empty permissions array and the seeded one
// only carries {module:'All'}, so checking the list would lock the owner out of
// his own system. Role.name is unique in the schema, so this cannot be claimed by
// creating a second role under the same name.
const isSuperAdmin = (role) => !!role && role.name === 'Super Admin';

const authorize = (...roles) => {
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role) {
      return res.status(403).json({ success: false, message: 'Not authorized: no role assigned to this user' });
    }

    if (isSuperAdmin(role) || roles.includes(role.name)) {
      return next();
    }

    return res.status(403).json({ success: false, message: `Role '${role.name}' is not authorized to access this route` });
  };
};

// Seeded roles are written as {module:'All'} with no actions key at all, so an
// entry that lists no actions grants the whole module — its presence is the grant.
const entryAllowsAction = (entry, action) => {
  if (!Array.isArray(entry.actions) || entry.actions.length === 0) return true;
  return entry.actions.includes(action) || entry.actions.includes('manage') || entry.actions.includes('*');
};

const requirePermission = (moduleName, action) => {
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role) {
      return res.status(403).json({ success: false, message: 'Not authorized: no role assigned to this user' });
    }

    if (isSuperAdmin(role)) {
      return next();
    }

    const permissions = Array.isArray(role.permissions) ? role.permissions : [];
    const granted = permissions.some((entry) =>
      entry && (entry.module === 'All' || entry.module === moduleName) && entryAllowsAction(entry, action)
    );

    if (granted) {
      return next();
    }

    return res.status(403).json({ success: false, message: `Not authorized to ${action} ${moduleName}` });
  };
};

/* The same test requirePermission makes, as a plain function — for a
   controller that assembles one response from several modules and has to
   leave out the parts the caller may not read. */
const hasPermission = (user, moduleName, action) => {
  const role = user && user.role;
  if (!role) return false;
  if (isSuperAdmin(role)) return true;
  const permissions = Array.isArray(role.permissions) ? role.permissions : [];
  return permissions.some((entry) =>
    entry && (entry.module === 'All' || entry.module === moduleName) && entryAllowsAction(entry, action)
  );
};

module.exports = { protect, authorize, requirePermission, hasPermission, invalidateRoleCache, extractToken, revokeToken, isTokenRevoked, clearRevocation };
