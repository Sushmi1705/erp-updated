const express = require('express');
const { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  updateUserStatus, 
  resetUserPassword, 
  getUserDirectory 
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

// Names only, for dropdowns on ordinary screens.
router.get('/directory', getUserDirectory);

router.use(authorize('Super Admin', 'Admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/status')
  .put(updateUserStatus);

router.route('/:id/reset-password')
  .put(resetUserPassword);

module.exports = router;
