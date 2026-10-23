const express = require('express');
const router = express.Router();
const c = require('../controllers/demand.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// ── 1. FORECAST HEADERS ──
router.get('/forecasts',      requirePermission('DemandPlanning', 'read'), c.getAllForecasts);
router.get('/forecasts/:id',  requirePermission('DemandPlanning', 'read'), c.getForecastById);
router.post('/forecasts',     requirePermission('DemandPlanning', 'create'), c.createForecast);
router.put('/forecasts/:id',  requirePermission('DemandPlanning', 'update'), c.updateForecast);

// ── 2. FORECAST LINE ITEMS ──
router.get('/forecasts/:id/lines',      requirePermission('DemandPlanning', 'read'), c.getLinesByForecast);
router.post('/forecasts/:id/lines',     requirePermission('DemandPlanning', 'create'), c.createForecastLine);
router.put('/forecast-lines/:lineId',   requirePermission('DemandPlanning', 'update'), c.updateForecastLine);
router.delete('/forecast-lines/:lineId',requirePermission('DemandPlanning', 'delete'), c.deleteForecastLine);

// ── 3. HISTORICAL DATA REFS ──
router.get('/forecasts/:id/history',     requirePermission('DemandPlanning', 'read'), c.getHistoryByForecast);
router.post('/forecasts/:id/history',    requirePermission('DemandPlanning', 'create'), c.createHistoryRef);
router.delete('/history-refs/:refId',    requirePermission('DemandPlanning', 'delete'), c.deleteHistoryRef);

// ── 4. ADJUSTMENTS & OVERRIDES ──
router.get('/forecast-lines/:lineId/adjustments', requirePermission('DemandPlanning', 'read'), c.getAdjustmentsByLine);

// ── HISTORICAL ANALYSIS ──
router.get('/historical', requirePermission('DemandPlanning', 'read'), c.getHistoricalAnalysis);

// ── DEMAND CONSOLIDATION (3-Tier) ──
router.get('/consolidation-runs', requirePermission('DemandPlanning', 'read'), c.getAllConsolidations);
router.post('/consolidation-runs/generate', requirePermission('DemandPlanning', 'create'), c.generateConsolidation);
router.put('/consolidation-runs/:runId/status', requirePermission('DemandPlanning', 'update'), c.updateConsolidationRunStatus);

router.get('/consolidation-runs/:runId/lines', requirePermission('DemandPlanning', 'read'), c.getConsolidationLinesByRun);
router.put('/consolidation-lines/:lineId', requirePermission('DemandPlanning', 'update'), c.updateConsolidationLine);

router.get('/consolidation-lines/:lineId/traceability', requirePermission('DemandPlanning', 'read'), c.getTraceabilityLinksByLine);

module.exports = router;
