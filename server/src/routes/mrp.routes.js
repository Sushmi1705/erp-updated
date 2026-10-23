const express = require('express');
const router = express.Router();
const mrpController = require('../controllers/mrp.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// MRP Run execution
router.get('/run', requirePermission('MRP', 'read'), mrpController.getAllMrpRuns);
router.post('/run/execute', requirePermission('MRP', 'create'), mrpController.executeMrpRun);

// MRP Data Retrieval
router.get('/requirements', requirePermission('MRP', 'read'), mrpController.getRequirements);
router.get('/snapshots', requirePermission('MRP', 'read'), mrpController.getSnapshots);
router.get('/shortages', requirePermission('MRP', 'read'), mrpController.getShortages);

// Shortage Analysis Actions
router.post('/shortages/:shortageId/resolve', requirePermission('MRP', 'update'), mrpController.resolveShortage);
router.post('/shortages/refresh-live', requirePermission('MRP', 'read'), mrpController.refreshLiveShortages);

// Recommendation Engine Actions
router.get('/recommendations', requirePermission('MRP', 'read'), mrpController.getRecommendations);
router.post('/recommendations/:id/convert', requirePermission('MRP', 'create'), mrpController.convertRecommendation);

module.exports = router;
