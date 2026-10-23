const express = require('express');
const { getRoles, createRole, deleteRole, updateRole, getRoleDirectory, getAccessCatalogue, getRoleUsers } = require('../controllers/role.controller');
const { protect, authorize, requirePermission } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

// Role names for an approver picker — reachable by every signed-in user.
// Declared before authorize() on purpose; see user.routes.js.
router.get('/directory', getRoleDirectory);

router.use(authorize('Super Admin', 'Admin'));

// What a role can be given — the editor renders its checkboxes from this, so
// the screen and the enforcement can never disagree about the module list.
router.get('/catalogue', getAccessCatalogue);

router.route('/')
  .get(getRoles)
  .post(requirePermission('Roles', 'create'), createRole);

router.get('/:id/users', getRoleUsers);

router.route('/:id')
  .put(requirePermission('Roles', 'update'), updateRole)
  .delete(requirePermission('Roles', 'delete'), deleteRole);

module.exports = router;
