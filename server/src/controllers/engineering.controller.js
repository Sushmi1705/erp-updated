const { handleError } = require('../utils/errorHandler');
const { editable } = require('../utils/safeBody');
const { BOMHeader, BOMRevision, BOMComponent, SubstituteComponent, OperationLink } = require('../models/EngineeringBOM');
const {
  RoutingHeader, RoutingRevision, RoutingOperation,
  OperationResource, SubcontractingDetail, EngineeringRouting
} = require('../models/EngineeringRouting');
const { EngineeringChange, ECMHeader, ECMAffectedItem, ECMImpactAnalysis, ECMApprovalRouting } = require('../models/EngineeringChange');
const { Material }       = require('../models/MasterMaterial');
const { AuditLog }       = require('../models/Audit');

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const logAudit = async (action, entityType, entityId, userId, changes) => {
  try {
    await AuditLog.create({ action, module: entityType, recordId: entityId, changedBy: userId, newValue: changes || null });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

/**
 * Validation Rule 1: Circular Reference Check
 * Walks up the BOM tree to confirm that parentProductId does not appear
 * as a component (directly or indirectly) of itself.
 */
const checkCircularReference = async (parentProductId, componentMaterialId, componentProductId) => {
  const targetId = componentProductId ? componentProductId.toString() : null;
  if (!targetId) return; // Raw materials cannot cause circular refs

  if (targetId === parentProductId.toString()) {
    throw new Error('Circular Reference: A product cannot be its own component.');
  }

  // Walk up: find BOMs where this sub-product is the parent, and recurse into its components
  const subBOMs = await BOMHeader.find({ productId: targetId });
  for (const subBOM of subBOMs) {
    const revisions = await BOMRevision.find({ bomId: subBOM._id, approvalStatus: 'Approved' });
    for (const rev of revisions) {
      const components = await BOMComponent.find({ revisionId: rev._id });
      for (const comp of components) {
        await checkCircularReference(parentProductId, comp.materialId, comp.productId);
      }
    }
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// A. BOM HEADER
// ──────────────────────────────────────────────────────────────────────────────
exports.getAllBOMHeaders = async (req, res) => {
  try {
    const data = await BOMHeader.find()
      .populate('productId', 'name code')
      .populate('plantId',   'name code')
      .populate('uomId',     'name symbol')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.getBOMHeaderById = async (req, res) => {
  try {
    const data = await BOMHeader.findById(req.params.id)
      .populate('productId',        'name code')
      .populate('plantId',          'name code')
      .populate('uomId',            'name symbol')
      .populate('defaultRoutingId', 'routingNumber');
    if (!data) return res.status(404).json({ success: false, message: 'BOM Header not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.createBOMHeader = async (req, res) => {
  try {
    const data = await BOMHeader.create(req.body);
    await logAudit('CREATE', 'BOMHeader', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateBOMHeader = async (req, res) => {
  try {
    const data = await BOMHeader.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'BOM Header not found' });
    await logAudit('UPDATE', 'BOMHeader', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// B. BOM REVISION
// ──────────────────────────────────────────────────────────────────────────────
exports.getRevisionsByBOM = async (req, res) => {
  try {
    const data = await BOMRevision.find({ bomId: req.params.bomId })
      .populate('ecoNumber', 'changeNumber description')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createBOMRevision = async (req, res) => {
  try {
    const { bomId, revisionCode, validFromDate } = req.body;

    // Validation Rule 2: Revision date overlap — no approved revision date ranges can overlap
    if (validFromDate) {
      const existing = await BOMRevision.find({ bomId, approvalStatus: 'Approved' });
      for (const rev of existing) {
        const revEnd   = rev.validToDate   ? new Date(rev.validToDate)   : new Date('2099-12-31');
        const newStart = new Date(validFromDate);
        const newEnd   = req.body.validToDate ? new Date(req.body.validToDate) : new Date('2099-12-31');
        if (newStart <= revEnd && newEnd >= new Date(rev.validFromDate)) {
          return res.status(400).json({
            success: false,
            message: `Revision Overlap: Date range conflicts with approved revision "${rev.revisionCode}".`
          });
        }
      }
    }

    const data = await BOMRevision.create(req.body);
    await logAudit('CREATE', 'BOMRevision', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateRevisionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const revision = await BOMRevision.findById(req.params.revisionId);
    if (!revision) return res.status(404).json({ success: false, message: 'Revision not found' });

    // Validation Rule 4: Cannot Approve if any component material is Discontinued/Obsolete
    if (status === 'Approved') {
      const components = await BOMComponent.find({ revisionId: revision._id }).populate('materialId');
      for (const comp of components) {
        if (comp.materialId && ['Discontinued', 'Obsolete'].includes(comp.materialId.status)) {
          return res.status(400).json({
            success: false,
            message: `Cannot approve: Material "${comp.materialId.name}" has status "${comp.materialId.status}".`
          });
        }
      }

      // Validation Rule 2: Auto-obsolete overlapping approved revisions
      const overlapping = await BOMRevision.find({
        bomId: revision.bomId,
        approvalStatus: 'Approved',
        _id: { $ne: revision._id }
      });
      for (const r of overlapping) {
        r.approvalStatus = 'Obsolete';
        await r.save();
      }
    }

    revision.approvalStatus = status;
    await revision.save();
    await logAudit('STATUS_CHANGE', 'BOMRevision', revision._id, req.user._id, { status });
    res.json({ success: true, data: revision });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// C. BOM COMPONENTS
// ──────────────────────────────────────────────────────────────────────────────
exports.getComponentsByRevision = async (req, res) => {
  try {
    const data = await BOMComponent.find({ revisionId: req.params.revisionId })
      .populate('materialId', 'name code status')
      .populate('productId',  'name code')
      .populate('uomId',      'name symbol')
      .sort({ lineSequenceNumber: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.getBOMComponents = async (req, res) => {
  try {
    const bom = await BOMHeader.findById(req.params.bomId);
    if (!bom) return res.status(404).json({ success: false, message: 'BOM not found' });
    
    // Enforce BOM effectivity — only return components valid on the required date
    const requiredDate = req.query.requiredDate ? new Date(req.query.requiredDate) : new Date();

    const activeRevisions = await BOMRevision.find({
      bomId: bom._id,
      approvalStatus: 'Approved',
      $or: [
        { validFromDate: { $lte: requiredDate }, validToDate: { $gte: requiredDate } },
        { validFromDate: { $lte: requiredDate }, validToDate: null },  // No end date = still active
        { validFromDate: null }  // No start date = always active
      ]
    }).sort({ validFromDate: -1 }).limit(1);  // Most recent applicable revision

    if (activeRevisions.length === 0) {
      return res.status(404).json({ success: false, message: `No approved BOM revision found for date ${requiredDate.toDateString()}` });
    }
    
    const data = await BOMComponent.find({ revisionId: activeRevisions[0]._id })
      .populate('materialId', 'name code status')
      .populate('productId',  'name code')
      .populate('uomId',      'name symbol')
      .sort({ lineSequenceNumber: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createBOMComponent = async (req, res) => {
  try {
    // Validation Rule 3: Phantom + Manual Pick check (also enforced on model pre-save)
    if (req.body.componentType === 'Phantom' && req.body.issueMethod === 'Manual Pick') {
      return res.status(400).json({ success: false, message: 'Phantom components cannot have Issue Method as Manual Pick.' });
    }

    // Validation Rule 1: Circular Reference check
    const revision = await BOMRevision.findById(req.body.revisionId).populate('bomId');
    if (revision && revision.bomId) {
      const parentProductId = revision.bomId.productId;
      await checkCircularReference(parentProductId, req.body.materialId, req.body.productId);
    }

    const data = await BOMComponent.create(req.body);
    await logAudit('CREATE', 'BOMComponent', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateBOMComponent = async (req, res) => {
  try {
    if (req.body.componentType === 'Phantom' && req.body.issueMethod === 'Manual Pick') {
      return res.status(400).json({ success: false, message: 'Phantom components cannot have Issue Method as Manual Pick.' });
    }
    const data = await BOMComponent.findByIdAndUpdate(req.params.componentId, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Component not found' });
    await logAudit('UPDATE', 'BOMComponent', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteBOMComponent = async (req, res) => {
  try {
    const data = await BOMComponent.findByIdAndUpdate(
      req.params.componentId,
      { isDeleted: true },
      { new: true }
    );
    if (!data) return res.status(404).json({ success: false, message: 'Component not found' });
    await logAudit('DELETE', 'BOMComponent', data._id, req.user._id);
    res.json({ success: true, message: 'Component removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// D. SUBSTITUTE COMPONENTS
// ──────────────────────────────────────────────────────────────────────────────
exports.getSubstitutesByComponent = async (req, res) => {
  try {
    const data = await SubstituteComponent.find({ primaryComponentId: req.params.componentId })
      .populate('substituteMaterialId', 'name code')
      .sort({ priorityRank: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createSubstituteComponent = async (req, res) => {
  try {
    const data = await SubstituteComponent.create(req.body);
    await logAudit('CREATE', 'SubstituteComponent', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateSubstituteComponent = async (req, res) => {
  try {
    const data = await SubstituteComponent.findByIdAndUpdate(req.params.substituteId, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Substitute not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteSubstituteComponent = async (req, res) => {
  try {
    await SubstituteComponent.findByIdAndUpdate(req.params.substituteId, { isDeleted: true });
    res.json({ success: true, message: 'Substitute removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// E. OPERATION LINKS
// ──────────────────────────────────────────────────────────────────────────────
exports.getOperationLinksByComponent = async (req, res) => {
  try {
    const data = await OperationLink.find({ componentId: req.params.componentId })
      .populate('routingId',    'routingNumber')
      .populate('workCenterId', 'name code')
      .sort({ operationSequence: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createOperationLink = async (req, res) => {
  try {
    const data = await OperationLink.create(req.body);
    await logAudit('CREATE', 'OperationLink', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateOperationLink = async (req, res) => {
  try {
    const data = await OperationLink.findByIdAndUpdate(req.params.linkId, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Operation Link not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteOperationLink = async (req, res) => {
  try {
    await OperationLink.findByIdAndUpdate(req.params.linkId, { isDeleted: true });
    res.json({ success: true, message: 'Operation Link removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// LEGACY STUBS — kept so existing ECM & Routing controllers don't break
// ──────────────────────────────────────────────────────────────────────────────
exports.getAllBOMs          = exports.getAllBOMHeaders;
exports.getBOMById         = exports.getBOMHeaderById;
exports.createBOM          = exports.createBOMHeader;
exports.updateBOM          = exports.updateBOMHeader;
exports.addBOMRevision     = exports.createBOMRevision;
exports.changeBOMVersionStatus = exports.updateRevisionStatus;

// ──────────────────────────────────────────────────────────────────────────────
// A. ROUTING HEADER
// ──────────────────────────────────────────────────────────────────────────────
exports.getAllRoutingHeaders = async (req, res) => {
  try {
    const data = await RoutingHeader.find()
      .populate('productId', 'name code')
      .populate('plantId',   'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.getRoutingHeaderById = async (req, res) => {
  try {
    const data = await RoutingHeader.findById(req.params.id)
      .populate('productId', 'name code')
      .populate('plantId',   'name code');
    if (!data) return res.status(404).json({ success: false, message: 'Routing Header not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.createRoutingHeader = async (req, res) => {
  try {
    const data = await RoutingHeader.create(req.body);
    await logAudit('CREATE', 'RoutingHeader', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateRoutingHeader = async (req, res) => {
  try {
    const data = await RoutingHeader.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Routing Header not found' });
    await logAudit('UPDATE', 'RoutingHeader', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// B. ROUTING REVISION
// ──────────────────────────────────────────────────────────────────────────────
exports.getRevisionsByRouting = async (req, res) => {
  try {
    const data = await RoutingRevision.find({ routingId: req.params.routingId })
      .populate('ecoNumber', 'changeNumber description')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createRoutingRevision = async (req, res) => {
  try {
    const { routingId, validFromDate } = req.body;

    // Validation Rule 4: Approved revision date overlap check
    if (validFromDate) {
      const existing = await RoutingRevision.find({ routingId, approvalStatus: 'Approved' });
      for (const rev of existing) {
        const revEnd   = rev.validToDate   ? new Date(rev.validToDate)   : new Date('2099-12-31');
        const newStart = new Date(validFromDate);
        const newEnd   = req.body.validToDate ? new Date(req.body.validToDate) : new Date('2099-12-31');
        if (newStart <= revEnd && newEnd >= new Date(rev.validFromDate)) {
          return res.status(400).json({
            success: false,
            message: `Revision Overlap: Date range conflicts with approved revision "${rev.revisionCode}".`
          });
        }
      }
    }

    const data = await RoutingRevision.create(req.body);
    await logAudit('CREATE', 'RoutingRevision', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateRoutingRevisionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const revision = await RoutingRevision.findById(req.params.revisionId);
    if (!revision) return res.status(404).json({ success: false, message: 'Revision not found' });

    // Validation Rule 4: Auto-obsolete other approved revisions on approval
    if (status === 'Approved') {
      const overlapping = await RoutingRevision.find({
        routingId: revision.routingId,
        approvalStatus: 'Approved',
        _id: { $ne: revision._id }
      });
      for (const r of overlapping) {
        r.approvalStatus = 'Obsolete';
        await r.save();
      }
    }

    revision.approvalStatus = status;
    await revision.save();
    await logAudit('STATUS_CHANGE', 'RoutingRevision', revision._id, req.user._id, { status });
    res.json({ success: true, data: revision });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// C. ROUTING OPERATIONS
// ──────────────────────────────────────────────────────────────────────────────
exports.getOperationsByRevision = async (req, res) => {
  try {
    const data = await RoutingOperation.find({ revisionId: req.params.revisionId })
      .populate('workCenterId', 'name code')
      .populate('machineId',    'name code')
      .sort({ operationSequence: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createRoutingOperation = async (req, res) => {
  try {
    const { revisionId, operationSequence } = req.body;

    // Validation Rule 1: Unique sequence within revision
    const existing = await RoutingOperation.findOne({ revisionId, operationSequence });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Sequence ${operationSequence} already exists in this revision. Use increments of 10.`
      });
    }

    // Validation Rule 5: Work Center is mandatory for non-subcontracted ops
    if (!req.body.isSubcontracted && !req.body.workCenterId) {
      return res.status(400).json({ success: false, message: 'Work Center is required for internal operations.' });
    }

    const data = await RoutingOperation.create(req.body);
    await logAudit('CREATE', 'RoutingOperation', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateRoutingOperation = async (req, res) => {
  try {
    // Validation Rule 1: Unique sequence check on update
    if (req.body.operationSequence) {
      const op = await RoutingOperation.findById(req.params.operationId);
      const dup = await RoutingOperation.findOne({
        revisionId: op.revisionId,
        operationSequence: req.body.operationSequence,
        _id: { $ne: op._id }
      });
      if (dup) return res.status(400).json({ success: false, message: `Sequence ${req.body.operationSequence} already exists.` });
    }
    const data = await RoutingOperation.findByIdAndUpdate(req.params.operationId, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Operation not found' });
    await logAudit('UPDATE', 'RoutingOperation', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteRoutingOperation = async (req, res) => {
  try {
    await RoutingOperation.findByIdAndUpdate(req.params.operationId, { isDeleted: true });
    res.json({ success: true, message: 'Operation removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// D. OPERATION RESOURCES
// ──────────────────────────────────────────────────────────────────────────────
exports.getResourcesByOperation = async (req, res) => {
  try {
    const data = await OperationResource.find({ operationId: req.params.operationId })
      .sort({ resourceType: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createOperationResource = async (req, res) => {
  try {
    const data = await OperationResource.create(req.body);
    await logAudit('CREATE', 'OperationResource', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateOperationResource = async (req, res) => {
  try {
    const data = await OperationResource.findByIdAndUpdate(req.params.resourceId, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteOperationResource = async (req, res) => {
  try {
    await OperationResource.findByIdAndUpdate(req.params.resourceId, { isDeleted: true });
    res.json({ success: true, message: 'Resource removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// E. SUBCONTRACTING DETAILS
// ──────────────────────────────────────────────────────────────────────────────
exports.getSubcontractingByOperation = async (req, res) => {
  try {
    const data = await SubcontractingDetail.find({ operationId: req.params.operationId })
      .populate('vendorId',      'name code')
      .populate('serviceItemId', 'name code');
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createSubcontracting = async (req, res) => {
  try {
    // Validation Rule 3: subcontracting requires a valid vendorId
    if (!req.body.vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor is required for subcontracting details.' });
    }
    const data = await SubcontractingDetail.create(req.body);
    await logAudit('CREATE', 'SubcontractingDetail', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateSubcontracting = async (req, res) => {
  try {
    const data = await SubcontractingDetail.findByIdAndUpdate(req.params.subcontractId, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Subcontracting record not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteSubcontracting = async (req, res) => {
  try {
    await SubcontractingDetail.findByIdAndUpdate(req.params.subcontractId, { isDeleted: true });
    res.json({ success: true, message: 'Subcontracting record removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// LEGACY STUBS — kept so ECM and old routing consumers don't break
// ──────────────────────────────────────────────────────────────────────────────
exports.getAllRoutings = async (req, res) => {
  try {
    // Return RoutingHeaders (new) shaped to look like old EngineeringRouting for ECM dropdowns
    const data = await RoutingHeader.find().populate('productId', 'name code').sort({ createdAt: -1 });
    // Map routingCode -> routingNumber for backward compat
    const shaped = data.map(r => ({ ...r.toObject(), routingNumber: r.routingCode, isActive: r.status === 'Active' }));
    res.json({ success: true, data: shaped });
  } catch (error) { handleError(res, error); }
};

exports.getRoutingById    = exports.getRoutingHeaderById;
exports.createRouting     = exports.createRoutingHeader;
exports.updateRouting     = exports.updateRoutingHeader;

// ──────────────────────────────────────────────────────────────────────────────
// ECM IMPORTS (added here to avoid top-level circular dependency issues)
// ──────────────────────────────────────────────────────────────────────────────
// ECM Models imported at the top

// ── Helper: increment revision code v1.0 -> v1.1, v1.9 -> v2.0 ────────────
const incrementRevision = (code) => {
  const match = code.match(/^v?(\d+)\.(\d+)$/);
  if (!match) return code + '.1';
  let major = parseInt(match[1]);
  let minor = parseInt(match[2]) + 1;
  if (minor >= 10) { major += 1; minor = 0; }
  return `v${major}.${minor}`;
};

// ──────────────────────────────────────────────────────────────────────────────
// A. ECM HEADER
// ──────────────────────────────────────────────────────────────────────────────
exports.getAllECMHeaders = async (req, res) => {
  try {
    const data = await ECMHeader.find().sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.getECMHeaderById = async (req, res) => {
  try {
    const data = await ECMHeader.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'ECR not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.createECMHeader = async (req, res) => {
  try {
    const data = await ECMHeader.create(req.body);
    await logAudit('CREATE', 'ECMHeader', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateECMHeader = async (req, res) => {
  try {
    const ecr = await ECMHeader.findById(req.params.id);
    if (!ecr) return res.status(404).json({ success: false, message: 'ECR not found' });

    // Validation Rule 1: Approved ECRs are locked
    if (ecr.isLocked) {
      return res.status(400).json({ success: false, message: 'This ECR is locked (Approved/ECO). Fields cannot be edited.' });
    }

    const data = await ECMHeader.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    await logAudit('UPDATE', 'ECMHeader', data._id, req.user._id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateECMStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;
    const ecr = await ECMHeader.findById(req.params.id);
    if (!ecr) return res.status(404).json({ success: false, message: 'ECR not found' });

    // Validation Rule 1: Cannot edit a locked ECR
    if (ecr.isLocked && status !== 'Implemented' && status !== 'Closed') {
      return res.status(400).json({ success: false, message: 'ECR is locked after approval. Only Implemented or Closed transitions are allowed.' });
    }

    // Validation Rule 4: Cannot approve unless ALL approval steps are approved
    if (status === 'Approved') {
      const approvals = await ECMApprovalRouting.find({ ecrId: ecr._id });
      const pendingOrRejected = approvals.filter(a => a.approvalStatus !== 'Approved');
      if (pendingOrRejected.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve: ${pendingOrRejected.length} approval step(s) are still Pending or Rejected.`
        });
      }
    }

    ecr.status = status;

    // Validation Rule 1: Lock ECR on Approval
    if (status === 'Approved') {
      ecr.isLocked = true;

      // When ECM is approved, flag open work orders using affected BOMs
      const affectedItems = await ECMAffectedItem.find({ ecrId: ecr._id });
      const affectedProductIds = affectedItems.map(i => i.productId).filter(Boolean);
      
      if (affectedProductIds.length > 0) {
        const { WorkOrder, WOHeader } = require('../models/WorkOrder');
        const flagUpdate = { 
          $set: { 
            ecmFlag: true, 
            ecmReference: ecr._id,
            ecmFlagDate: new Date(),
            ecmFlagNote: `BOM changed by ECM ${ecr.ecmNumber || ecr.ecrNumber || ecr._id}. Review and replan if needed.`
          }
        };
        
        await WorkOrder.updateMany(
          { 
            materialId: { $in: affectedProductIds },
            status: { $in: ['Created', 'Draft', 'Released', 'In Progress', 'In-Progress'] }
          },
          flagUpdate
        );
        
        // Also update WOHeader if necessary (assuming productId is stored somehow, wait WOHeader doesn't have productId, it links via WODetail. Let's do it if possible, but the legacy WorkOrder is fine for now based on the prompt.)
      }

      // Validation Rules 2 & 5: Auto-clone BOM/Routing revisions & stamp ECR number
      // affectedItems already fetched above (line 681)
      for (const item of affectedItems) {
        if (item.itemType === 'BOM' && item.bomId) {
          // Find the latest approved BOM revision
          const latestRev = await BOMRevision.findOne({ bomId: item.bomId, approvalStatus: 'Approved' })
            .sort({ createdAt: -1 });
          if (latestRev) {
            const newCode = incrementRevision(latestRev.revisionCode);
            const newRev = await BOMRevision.create({
              bomId:          latestRev.bomId,
              revisionCode:   newCode,
              ecoNumber:      ecr._id,   // Rule 5: stamp ECR_Number
              validFromDate:  ecr.targetImplementationDate || new Date(),
              approvalStatus: 'Draft',
              totalStandardCost: latestRev.totalStandardCost
            });
            // Update affected item with new revision code
            item.newRevisionCode = newCode;
            await item.save();
          }
        }

        if (item.itemType === 'Routing' && item.routingId) {
          const latestRev = await RoutingRevision.findOne({ routingId: item.routingId, approvalStatus: 'Approved' })
            .sort({ createdAt: -1 });
          if (latestRev) {
            const newCode = incrementRevision(latestRev.revisionCode);
            await RoutingRevision.create({
              routingId:      latestRev.routingId,
              revisionCode:   newCode,
              ecoNumber:      ecr._id,   // Rule 5: stamp ECR_Number
              validFromDate:  ecr.targetImplementationDate || new Date(),
              approvalStatus: 'Draft'
            });
            item.newRevisionCode = newCode;
            await item.save();
          }
        }
      }
    }

    await ecr.save();
    await logAudit('STATUS_CHANGE', 'ECMHeader', ecr._id, req.user._id, { status, comments });
    res.json({ success: true, data: ecr });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// B. ECM AFFECTED ITEMS
// ──────────────────────────────────────────────────────────────────────────────
exports.getAffectedItemsByECR = async (req, res) => {
  try {
    const data = await ECMAffectedItem.find({ ecrId: req.params.ecrId })
      .populate('bomId',     'bomCode bomName')
      .populate('routingId', 'routingCode routingName')
      .populate('productId', 'name code');
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createAffectedItem = async (req, res) => {
  try {
    const { itemType, bomId, routingId } = req.body;

    // Validation Rule 3: Block if this BOM/Routing is already on an open ECR
    const openStatuses = ['Draft', 'Submitted', 'In Review'];
    if (itemType === 'BOM' && bomId) {
      const openECRItems = await ECMAffectedItem.find({ bomId }).populate('ecrId');
      const conflict = openECRItems.find(i => i.ecrId && openStatuses.includes(i.ecrId.status));
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `BOM Lock: This BOM is already listed on open ECR "${conflict.ecrId.ecrNumber}". Close or reject that ECR first.`
        });
      }
    }
    if (itemType === 'Routing' && routingId) {
      const openECRItems = await ECMAffectedItem.find({ routingId }).populate('ecrId');
      const conflict = openECRItems.find(i => i.ecrId && openStatuses.includes(i.ecrId.status));
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Routing Lock: This Routing is already listed on open ECR "${conflict.ecrId.ecrNumber}". Close or reject that ECR first.`
        });
      }
    }

    const data = await ECMAffectedItem.create(req.body);
    await logAudit('CREATE', 'ECMAffectedItem', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateAffectedItem = async (req, res) => {
  try {
    const data = await ECMAffectedItem.findByIdAndUpdate(req.params.itemId, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Affected Item not found' });
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.deleteAffectedItem = async (req, res) => {
  try {
    await ECMAffectedItem.findByIdAndUpdate(req.params.itemId, { isDeleted: true });
    res.json({ success: true, message: 'Affected item removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// C. ECM IMPACT ANALYSIS
// ──────────────────────────────────────────────────────────────────────────────
exports.getImpactByECR = async (req, res) => {
  try {
    const data = await ECMImpactAnalysis.findOne({ ecrId: req.params.ecrId });
    res.json({ success: true, data: data || null });
  } catch (error) { handleError(res, error); }
};

exports.upsertImpactAnalysis = async (req, res) => {
  try {
    const data = await ECMImpactAnalysis.findOneAndUpdate(
      { ecrId: req.params.ecrId },
      { ...req.body, ecrId: req.params.ecrId },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// D. ECM APPROVAL ROUTING
// ──────────────────────────────────────────────────────────────────────────────
exports.getApprovalsByECR = async (req, res) => {
  try {
    const data = await ECMApprovalRouting.find({ ecrId: req.params.ecrId })
      .populate('requiredRole',   'name description')
      .populate('assignedUserId', 'name email')
      .sort({ approvalStep: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(res, error); }
};

exports.createApprovalStep = async (req, res) => {
  try {
    const data = await ECMApprovalRouting.create(req.body);
    await logAudit('CREATE', 'ECMApprovalRouting', data._id, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateApprovalStep = async (req, res) => {
  try {
    const { approvalStatus, comments } = req.body;
    const approval = await ECMApprovalRouting.findById(req.params.approvalId);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval step not found' });

    approval.approvalStatus = approvalStatus;
    approval.comments       = comments || '';
    approval.approvalDate   = approvalStatus !== 'Pending' ? new Date() : null;
    await approval.save();
    await logAudit('APPROVE', 'ECMApprovalRouting', approval._id, req.user._id, { approvalStatus });
    res.json({ success: true, data: approval });
  } catch (error) { handleError(res, error); }
};

exports.deleteApprovalStep = async (req, res) => {
  try {
    await ECMApprovalRouting.findByIdAndUpdate(req.params.approvalId, { isDeleted: true });
    res.json({ success: true, message: 'Approval step removed.' });
  } catch (error) { handleError(res, error); }
};

// ──────────────────────────────────────────────────────────────────────────────
// LEGACY STUBS — keep old /ecm routes alive so nothing breaks
// ──────────────────────────────────────────────────────────────────────────────
exports.getAllChanges = async (req, res) => {
  try {
    const data = await ECMHeader.find().sort({ createdAt: -1 });
    // Shape to match old EngineeringChange structure for backward compat
    const shaped = data.map(r => ({
      ...r.toObject(),
      ecrNumber:     r.ecrNumber,
      changeNumber:  r.ecrNumber,
      description:   r.reasonForChange,
      impactAnalysis: {}
    }));
    res.json({ success: true, data: shaped });
  } catch (error) { handleError(res, error); }
};

exports.createChange = async (req, res) => {
  try {
    const payload = {
      ecrNumber:       req.body.ecrNumber,
      title:           req.body.title,
      reasonForChange: req.body.description || req.body.reasonForChange || '',
      changeType:      req.body.changeType || 'Design',
      priority:        req.body.priority   || 'Medium',
      status:          'Draft'
    };
    const data = await ECMHeader.create(payload);
    res.status(201).json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

exports.updateChangeStatus = async (req, res) => {
  // Delegate to the new status endpoint
  req.params.id = req.params.id;
  return exports.updateECMStatus(req, res);
};

