const { handleError } = require('../utils/errorHandler');
const Role = require('../models/Role');
const User = require('../models/User');
const { AuditLog } = require('../models/Audit');
const { catalogue, sanitisePermissions } = require('../config/modules');
const { invalidateRoleCache } = require('../middlewares/auth.middleware');

/* Roles & Access.
 *
 * A role is a job — store keeper, quality inspector, accounts — and the
 * permissions on it are what that job may do. requirePermission() in
 * auth.middleware.js reads these entries on every write, so what is saved here
 * is what the system actually enforces.
 *
 * Changing a role changes what live users can do the moment it is saved —
 * protect() re-reads the role on every request — so every change here is
 * written to the audit log.
 */
const logRoleChange = async (action, role, userId, changes) => {
  try {
    // Same shape as every other controller writes — see models/Audit.js.
    await AuditLog.create({
      action,
      module: 'Role',
      recordId: role?._id,
      changedBy: userId,
      newValue: { role: role?.name, ...changes }
    });
  } catch { /* a failed audit write must not fail the request */ }
};

/** Names each permission entry in words, for the audit trail and the UI. */
const describe = (permissions) =>
  (permissions || []).map((p) => `${p.module}: ${(p.actions || []).join('/') || 'everything'}`).join('; ') || 'nothing';

/* Role names for an approver dropdown. Open to any signed-in user; the full
 * role records, with their permission matrices, stay Super Admin only. */
exports.getRoleDirectory = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: { $ne: false } })
      .select('name description')
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, count: roles.length, data: roles });
  } catch (error) {
    handleError(res, error);
  }
};

/* What a role can be given. The editor renders from this rather than its own
   copy of the list — see config/modules.js. */
exports.getAccessCatalogue = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: catalogue() });
  } catch (error) { handleError(res, error); }
};

// @desc    Get all roles, each with how many people hold it
// @route   GET /api/roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().lean();
    // "3 people have this role" is the fact that decides whether a change is
    // safe to make; without it the screen invites edits in the dark.
    const counts = await User.aggregate([
      { $match: { role: { $ne: null } } },
      { $group: { _id: '$role', n: { $sum: 1 } }, }
    ]).catch(() => []);
    const byRole = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    const withUsage = roles.map((r) => ({ ...r, userCount: byRole[String(r._id)] || 0 }));
    res.status(200).json({ success: true, count: withUsage.length, data: withUsage });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Who holds this role
// @route   GET /api/roles/:id/users
exports.getRoleUsers = async (req, res) => {
  try {
    const users = await User.find({ role: req.params.id })
      .select('firstName lastName email status')
      .sort({ firstName: 1 })
      .lean();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) { handleError(res, error); }
};

// @desc    Create a role
// @route   POST /api/roles
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Give the role a name — the job it stands for.' });
    }

    // Case-insensitive: "Store Keeper" and "store keeper" are one job.
    const roleExists = await Role.findOne({ name: new RegExp(`^${String(name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (roleExists) {
      return res.status(400).json({ success: false, message: `A role called "${roleExists.name}" already exists.` });
    }

    const { permissions: clean, rejected } = sanitisePermissions(permissions);

    const role = await Role.create({ name: String(name).trim(), description, permissions: clean });
    invalidateRoleCache();
    await logRoleChange('CREATE', role, req.user._id, { granted: describe(clean) });

    res.status(201).json({
      success: true,
      data: role,
      message: `Role "${role.name}" created.`,
      ...(rejected.length ? { warning: `Ignored what this system does not have: ${rejected.join(', ')}.` } : {})
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        message: `"${role.name}" is built into the system and cannot be changed. Copy it and change the copy.`
      });
    }

    // Nobody may edit the role they are signed in with. Otherwise an
    // administrator can quietly widen their own access, and the audit trail
    // shows them approving it themselves.
    const ownRoleId = req.user?.role?._id || req.user?.role;
    if (ownRoleId && String(ownRoleId) === String(role._id)) {
      return res.status(403).json({
        success: false,
        message: 'This is your own role. Ask another administrator to change it — nobody may widen their own access.'
      });
    }

    const before = describe(role.permissions);
    const update = {};
    if (req.body.name !== undefined) update.name = String(req.body.name).trim();
    if (req.body.description !== undefined) update.description = req.body.description;
    if (req.body.isActive !== undefined) update.isActive = !!req.body.isActive;

    let rejected = [];
    if (req.body.permissions !== undefined) {
      const clean = sanitisePermissions(req.body.permissions);
      update.permissions = clean.permissions;
      rejected = clean.rejected;
    }

    // Switching a role off takes the screens away from everyone holding it, so
    // say how many people that is rather than doing it quietly.
    let affected = 0;
    if (update.isActive === false || update.permissions) {
      affected = await User.countDocuments({ role: role._id }).catch(() => 0);
    }

    const updatedRole = await Role.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    // Reaches everyone holding this role on their very next request.
    invalidateRoleCache();
    await logRoleChange('UPDATE', updatedRole, req.user._id, {
      from: before, to: describe(updatedRole.permissions), usersAffected: affected
    });

    res.status(200).json({
      success: true,
      data: updatedRole,
      message: affected
        ? `Saved. ${affected} ${affected === 1 ? 'person' : 'people'} with this role see the change immediately.`
        : 'Saved. Nobody holds this role yet.',
      ...(rejected.length ? { warning: `Ignored what this system does not have: ${rejected.join(', ')}.` } : {})
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    if (role.isSystem) {
      return res.status(400).json({ success: false, message: `"${role.name}" is built into the system and cannot be deleted.` });
    }

    // A user whose role no longer exists cannot open anything and cannot be
    // fixed from any screen — the role picker has nothing to show. Deleting a
    // role out from under people used to do exactly that, silently.
    const holders = await User.find({ role: role._id }).select('firstName lastName email').limit(10).lean();
    if (holders.length) {
      const names = holders.map((u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email).join(', ');
      return res.status(409).json({
        success: false,
        message: `${holders.length} ${holders.length === 1 ? 'person holds' : 'people hold'} this role — ${names}. Move them to another role under Users & Logins first, or switch this role off instead of deleting it.`,
        users: holders
      });
    }

    await logRoleChange('DELETE', role, req.user._id, { had: describe(role.permissions) });
    await role.deleteOne();
    invalidateRoleCache();

    res.status(200).json({ success: true, data: {}, message: `Role "${role.name}" deleted.` });
  } catch (error) {
    handleError(res, error);
  }
};
