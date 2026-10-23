const express = require('express');
const { getAll, create, update, remove } = require('../controllers/master.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect); // Ensure all master data routes are protected

// Dynamic generic routes
router.get('/:model', requirePermission('MasterData', 'read'), getAll);
router.post('/:model', requirePermission('MasterData', 'create'), create);
router.put('/:model/:id', requirePermission('MasterData', 'update'), update);
router.delete('/:model/:id', requirePermission('MasterData', 'delete'), remove);

module.exports = router;
