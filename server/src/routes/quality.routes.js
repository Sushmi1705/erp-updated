const express = require('express');
const router = express.Router();
const qualityController = require('../controllers/quality.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// Inspections V1
router.get('/inspection', requirePermission('Quality', 'read'), qualityController.getAllInspections);
router.post('/inspection', requirePermission('Quality', 'create'), qualityController.recordInspection);
router.put('/inspection/:id', requirePermission('Quality', 'update'), qualityController.updateInspection);
router.post('/inspection/:id/release', requirePermission('Quality', 'create'), qualityController.approveProductRelease);

// Incoming Quality V2 Architecture
router.get('/v2/incoming', requirePermission('Quality', 'read'), qualityController.getV2IncomingInspections);
router.post('/v2/incoming', requirePermission('Quality', 'create'), qualityController.createV2IncomingInspection);
router.put('/v2/incoming/:id/results', requirePermission('Quality', 'update'), qualityController.updateV2IncomingResults);
router.post('/v2/incoming/:id/release', requirePermission('Quality', 'create'), qualityController.releaseV2IncomingQuarantine);

// In-Process Quality V2 Architecture
router.get('/v2/inprocess', requirePermission('Quality', 'read'), qualityController.getV2InProcessInspections);
router.post('/v2/inprocess', requirePermission('Quality', 'create'), qualityController.createV2InProcessInspection);
router.put('/v2/inprocess/:id/results', requirePermission('Quality', 'update'), qualityController.updateV2InProcessResults);

// Final Quality V2 Architecture
router.get('/v2/final', requirePermission('Quality', 'read'), qualityController.getV2FinalInspections);
router.post('/v2/final', requirePermission('Quality', 'create'), qualityController.createV2FinalInspection);
router.put('/v2/final/:id/results', requirePermission('Quality', 'update'), qualityController.updateV2FinalResults);
router.post('/v2/final/:id/release', requirePermission('Quality', 'update'), qualityController.approveV2ProductRelease);

// Parameters V1
router.get('/parameter', requirePermission('Quality', 'read'), qualityController.getAllParameters);
router.post('/parameter', requirePermission('Quality', 'create'), qualityController.createParameter);
router.post('/parameter/:id/measurement', requirePermission('Quality', 'create'), qualityController.recordMeasurement);

// Quality Parameters V2 Architecture
router.get('/v2/parameter', requirePermission('Quality', 'read'), qualityController.getV2QualityParameters);
router.post('/v2/parameter', requirePermission('Quality', 'create'), qualityController.createV2QualityParameter);
router.post('/v2/parameter/:id/measurement', requirePermission('Quality', 'create'), qualityController.logV2Measurement);

// Non-Conformance (CAPA) V1
router.get('/ncr', requirePermission('Quality', 'read'), qualityController.getAllNCRs);
router.post('/ncr', requirePermission('Quality', 'create'), qualityController.recordNCR);
router.put('/ncr/:id', requirePermission('Quality', 'update'), qualityController.updateNCR);

// Non-Conformance Management (CAPA V2 Architecture)
router.get('/v2/capa', requirePermission('Quality', 'read'), qualityController.getV2NCRs);
router.post('/v2/capa', requirePermission('Quality', 'create'), qualityController.createV2NCR);
router.put('/v2/capa/:id/rca', requirePermission('Quality', 'update'), qualityController.updateV2RCA);
router.post('/v2/capa/:id/task', requirePermission('Quality', 'update'), qualityController.addV2CAPATask);
router.put('/v2/capa/:id/close', requirePermission('Quality', 'update'), qualityController.closeV2NCR);

// Analytics
router.get('/analytics', requirePermission('Quality', 'read'), qualityController.getAnalytics);
router.get('/v2/analytics', requirePermission('Quality', 'read'), qualityController.getV2Analytics);

module.exports = router;
