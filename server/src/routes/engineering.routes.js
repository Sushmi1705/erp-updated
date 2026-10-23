const express = require('express');
const router  = express.Router();
const c       = require('../controllers/engineering.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');

router.use(protect);

// ── A. BOM HEADER ─────────────────────────────────────────────────────────
router.get('/bom',      requirePermission('Engineering', 'read'), c.getAllBOMHeaders);
router.get('/bom/:id',  requirePermission('Engineering', 'read'), c.getBOMHeaderById);
router.post('/bom',     requirePermission('Engineering', 'create'), c.createBOMHeader);
router.put('/bom/:id',  requirePermission('Engineering', 'update'), c.updateBOMHeader);

// ── B. BOM REVISION ───────────────────────────────────────────────────────
router.get('/bom/:bomId/revisions',                                  requirePermission('Engineering', 'read'), c.getRevisionsByBOM);
router.post('/bom/:bomId/revisions',  requirePermission('Engineering', 'create'), c.createBOMRevision);
router.put('/revisions/:revisionId/status', requirePermission('Engineering', 'update'), c.updateRevisionStatus);

// ── C. BOM COMPONENTS ─────────────────────────────────────────────────────
router.get('/bom/:bomId/components',                                 requirePermission('Engineering', 'read'), c.getBOMComponents);
router.get('/revisions/:revisionId/components',                      requirePermission('Engineering', 'read'), c.getComponentsByRevision);
router.post('/revisions/:revisionId/components', requirePermission('Engineering', 'create'), c.createBOMComponent);
router.put('/components/:componentId',           requirePermission('Engineering', 'update'), c.updateBOMComponent);
router.delete('/components/:componentId',        requirePermission('Engineering', 'delete'), c.deleteBOMComponent);

// ── D. SUBSTITUTE COMPONENTS ──────────────────────────────────────────────
router.get('/components/:componentId/substitutes',                   requirePermission('Engineering', 'read'), c.getSubstitutesByComponent);
router.post('/components/:componentId/substitutes', requirePermission('Engineering', 'create'), c.createSubstituteComponent);
router.put('/substitutes/:substituteId',            requirePermission('Engineering', 'update'), c.updateSubstituteComponent);
router.delete('/substitutes/:substituteId',         requirePermission('Engineering', 'delete'), c.deleteSubstituteComponent);

// ── E. OPERATION LINKS ────────────────────────────────────────────────────
router.get('/components/:componentId/operation-links',               requirePermission('Engineering', 'read'), c.getOperationLinksByComponent);
router.post('/components/:componentId/operation-links', requirePermission('Engineering', 'create'), c.createOperationLink);
router.put('/operation-links/:linkId',                  requirePermission('Engineering', 'update'), c.updateOperationLink);
router.delete('/operation-links/:linkId',               requirePermission('Engineering', 'delete'), c.deleteOperationLink);

// ── LEGACY ALIASES (keep existing ECM / Routing / old BOM routes alive) ──
router.post('/bom/:id/revision',       requirePermission('Engineering', 'create'), c.addBOMRevision);
router.put('/bom/:id/version-status',  requirePermission('Engineering', 'update'), c.changeBOMVersionStatus);

// ── A. ROUTING HEADER ─────────────────────────────────────────────────────
router.get('/routing',      requirePermission('Engineering', 'read'), c.getAllRoutingHeaders);
router.get('/routing/:id',  requirePermission('Engineering', 'read'), c.getRoutingHeaderById);
router.post('/routing',     requirePermission('Engineering', 'create'), c.createRoutingHeader);
router.put('/routing/:id',  requirePermission('Engineering', 'update'), c.updateRoutingHeader);

// ── B. ROUTING REVISION ───────────────────────────────────────────────────
router.get('/routing/:routingId/revisions',                                     requirePermission('Engineering', 'read'), c.getRevisionsByRouting);
router.post('/routing/:routingId/revisions', requirePermission('Engineering', 'create'), c.createRoutingRevision);
router.put('/routing-revisions/:revisionId/status', requirePermission('Engineering', 'update'), c.updateRoutingRevisionStatus);

// ── C. ROUTING OPERATIONS ─────────────────────────────────────────────────
router.get('/routing-revisions/:revisionId/operations',                             requirePermission('Engineering', 'read'), c.getOperationsByRevision);
router.post('/routing-revisions/:revisionId/operations', requirePermission('Engineering', 'create'), c.createRoutingOperation);
router.put('/routing-operations/:operationId',           requirePermission('Engineering', 'update'), c.updateRoutingOperation);
router.delete('/routing-operations/:operationId',        requirePermission('Engineering', 'delete'), c.deleteRoutingOperation);

// ── D. OPERATION RESOURCES ────────────────────────────────────────────────
router.get('/routing-operations/:operationId/resources',                              requirePermission('Engineering', 'read'), c.getResourcesByOperation);
router.post('/routing-operations/:operationId/resources', requirePermission('Engineering', 'create'), c.createOperationResource);
router.put('/operation-resources/:resourceId',            requirePermission('Engineering', 'update'), c.updateOperationResource);
router.delete('/operation-resources/:resourceId',         requirePermission('Engineering', 'delete'), c.deleteOperationResource);

// ── E. SUBCONTRACTING DETAILS ─────────────────────────────────────────────
router.get('/routing-operations/:operationId/subcontracting',                                requirePermission('Engineering', 'read'), c.getSubcontractingByOperation);
router.post('/routing-operations/:operationId/subcontracting', requirePermission('Engineering', 'create'), c.createSubcontracting);
router.put('/subcontracting/:subcontractId',                   requirePermission('Engineering', 'update'), c.updateSubcontracting);
router.delete('/subcontracting/:subcontractId',                requirePermission('Engineering', 'delete'), c.deleteSubcontracting);

// ── A. ECM HEADER ─────────────────────────────────────────────────────────
router.get('/ecm',                requirePermission('Engineering', 'read'), c.getAllECMHeaders);
router.get('/ecm/:id',            requirePermission('Engineering', 'read'), c.getECMHeaderById);
router.post('/ecm',               requirePermission('Engineering', 'create'), c.createECMHeader);
router.put('/ecm/:id',            requirePermission('Engineering', 'update'), c.updateECMHeader);
router.put('/ecm/:id/status',     requirePermission('Engineering', 'update'), c.updateECMStatus);

// ── B. ECM AFFECTED ITEMS ─────────────────────────────────────────────────
router.get('/ecm/:ecrId/affected-items',                                   requirePermission('Engineering', 'read'), c.getAffectedItemsByECR);
router.post('/ecm/:ecrId/affected-items', requirePermission('Engineering', 'create'), c.createAffectedItem);
router.put('/affected-items/:itemId',     requirePermission('Engineering', 'update'), c.updateAffectedItem);
router.delete('/affected-items/:itemId',  requirePermission('Engineering', 'delete'), c.deleteAffectedItem);

// ── C. ECM IMPACT ANALYSIS ────────────────────────────────────────────────
router.get('/ecm/:ecrId/impact',                                        requirePermission('Engineering', 'read'), c.getImpactByECR);
router.put('/ecm/:ecrId/impact', requirePermission('Engineering', 'update'), c.upsertImpactAnalysis);

// ── D. ECM APPROVAL ROUTING ───────────────────────────────────────────────
router.get('/ecm/:ecrId/approvals',                                          requirePermission('Engineering', 'read'), c.getApprovalsByECR);
router.post('/ecm/:ecrId/approvals',  requirePermission('Engineering', 'create'), c.createApprovalStep);
router.put('/ecm-approvals/:approvalId',  requirePermission('Engineering', 'update'), c.updateApprovalStep);
router.delete('/ecm-approvals/:approvalId', requirePermission('Engineering', 'delete'), c.deleteApprovalStep);

module.exports = router;
