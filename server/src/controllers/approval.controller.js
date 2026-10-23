const mongoose = require('mongoose');
const { editable } = require('../utils/safeBody');
const { handleError } = require('../utils/errorHandler');
const { ApprovalRequest, ApprovalConfig } = require('../models/Approval');
const User = require('../models/User');
const Role = require('../models/Role');
const { AuditLog } = require('../models/Audit');

// ── Model Resolution Helper ───────────────────────────────────────────────────
// Resolve Mongoose model for a given module name, including legacy/alias variants
const getModelForModule = (moduleName) => {
  if (!moduleName) return null;
  const standardMap = {
    PurchaseOrder: 'POHeader',
    PurchaseRequisition: 'PurchaseRequisition',
    SalesOrder: 'SOHeader',
    SalesQuotation: 'QuotationHeader',
    SalesInquiry: 'InquiryHeader',
    WorkOrder: 'WOHeader',
    ScrapManagement: 'ScrapHeader',
    QualityNonConformance: 'QualityNonConformance',
    EngineeringChange: 'EngineeringChange',
    MasterVendor: 'Vendor',
    MasterCustomer: 'Customer',
    MasterProduct: 'Product',
    MasterMaterial: 'Material',
    Plant: 'Plant',
    Warehouse: 'Warehouse',
    Branch: 'Branch',
    User: 'User',
    Role: 'Role'
  };

  const primaryName = standardMap[moduleName] || moduleName;
  if (mongoose.models[primaryName]) return mongoose.models[primaryName];
  if (mongoose.models[moduleName]) return mongoose.models[moduleName];

  // Try dynamic require if not yet registered in Mongoose memory
  try {
    const required = require(`../models/${moduleName}`);
    return required.default || required[primaryName] || required[moduleName] || required;
  } catch (err) {
    // Fallback: check all registered mongoose models case-insensitively
    const lower = moduleName.toLowerCase();
    for (const [key, val] of Object.entries(mongoose.models)) {
      if (key.toLowerCase() === lower) return val;
    }
    return null;
  }
};

// ── Extract Document Reference / Number ────────────────────────────────────────
const extractDocumentReference = (approval) => {
  const p = approval.payload || {};
  return (
    approval.recordReference ||
    p.poNumber ||
    p.orderNumber ||
    p.woNumber ||
    p.scrapReportId ||
    p.ncrNumber ||
    p.ecrNumber ||
    p.inquiryNumber ||
    p.quoteNumber ||
    p.code ||
    p.name ||
    p.title ||
    `REQ-${String(approval._id).slice(-6).toUpperCase()}`
  );
};

// ── Calculate Authentic Business Priority ──────────────────────────────────────
const calculatePriority = (approval) => {
  if (approval.priority) return approval.priority;
  const p = approval.payload || {};
  if (p.priority) return p.priority;
  if (p.severity === 'Major' || p.severity === 'Critical') return 'High';
  if (
    (p.totalAmount && Number(p.totalAmount) > 250000) ||
    (p.grandTotal && Number(p.grandTotal) > 250000) ||
    (p.scrapValueInr && Number(p.scrapValueInr) > 20000)
  ) {
    return 'High';
  }
  if (p.isRush || p.isExpedite || p.urgent) return 'Rush Expedite';
  return 'Normal';
};

// ── Helper to find existing record in database for diffing ────────────────────
const findUnderlyingRecord = async (approval) => {
  try {
    const Model = getModelForModule(approval.module);
    if (!Model) return null;

    const p = approval.payload || {};
    if (approval.recordId) {
      const byId = await Model.findById(approval.recordId).lean();
      if (byId) return byId;
    }
    if (p._id || p.id) {
      const byPayloadId = await Model.findById(p._id || p.id).lean();
      if (byPayloadId) return byPayloadId;
    }

    // Search by prominent business document numbers
    const queryFields = [
      { poNumber: p.poNumber },
      { orderNumber: p.orderNumber },
      { woNumber: p.woNumber },
      { scrapReportId: p.scrapReportId },
      { ncrNumber: p.ncrNumber },
      { ecrNumber: p.ecrNumber },
      { code: p.code }
    ];

    for (const q of queryFields) {
      const [key, val] = Object.entries(q)[0];
      if (val) {
        const found = await Model.findOne({ [key]: val }).lean();
        if (found) return found;
      }
    }
    return null;
  } catch (err) {
    return null;
  }
};

// ── Enrich an approval document for frontend UI ────────────────────────────────
const enrichApproval = (reqDoc, currentUserId, userRoleId, delegatorRoleIds = [], isSuperAdmin = false) => {
  const obj = reqDoc.toObject ? reqDoc.toObject() : { ...reqDoc };
  const currentStep = (obj.requiredLevels || []).find((l) => l.level === obj.currentLevel);

  const reference = extractDocumentReference(obj);
  const priority = calculatePriority(obj);
  const p = obj.payload || {};

  // SLA Overdue threshold: older than 3 days
  const createdDate = new Date(obj.createdAt);
  const now = new Date();
  const ageMs = now - createdDate;
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  const isOverdue = obj.status === 'Pending' && ageDays >= 3;

  // Determine if caller has authorization to action this specific step
  const stepRoleId = currentStep?.roleId?._id ? currentStep.roleId._id.toString() : currentStep?.roleId ? currentStep.roleId.toString() : null;
  const isAssignedRole = stepRoleId && (stepRoleId === userRoleId?.toString() || delegatorRoleIds.includes(stepRoleId));
  const canAction = obj.status === 'Pending' && (isSuperAdmin || isAssignedRole);

  const reqUserId = obj.requestedBy?._id ? obj.requestedBy._id.toString() : obj.requestedBy?.toString();
  const isSelfRequest = reqUserId && currentUserId && reqUserId === currentUserId.toString();

  // Human-readable justification / remarks
  const justification = p.note || p.reason || p.rootCause || p.disposition || p.justification || p.remarks || '';

  // Extract change summary chips
  const summaryItems = [];
  if (p.poNumber) summaryItems.push({ label: 'PO Number', val: p.poNumber });
  if (p.orderNumber) summaryItems.push({ label: 'SO Number', val: p.orderNumber });
  if (p.woNumber) summaryItems.push({ label: 'WO Number', val: p.woNumber });
  if (p.scrapReportId) summaryItems.push({ label: 'Scrap Report', val: p.scrapReportId });
  if (p.ncrNumber) summaryItems.push({ label: 'NCR Number', val: p.ncrNumber });
  if (p.ecrNumber) summaryItems.push({ label: 'ECR Number', val: p.ecrNumber });
  if (p.supplier || p.vendor) summaryItems.push({ label: 'Supplier', val: p.supplier || p.vendor });
  if (p.customer) summaryItems.push({ label: 'Customer', val: p.customer });
  if (p.product || p.partNumber) summaryItems.push({ label: 'Part / Product', val: p.product || p.partNumber });
  if (p.quantity != null) summaryItems.push({ label: 'Quantity', val: String(p.quantity) });
  if (p.totalAmount != null) summaryItems.push({ label: 'Total Value', val: `₹${Number(p.totalAmount).toLocaleString('en-IN')}` });
  if (p.grandTotal != null) summaryItems.push({ label: 'Grand Total', val: `₹${Number(p.grandTotal).toLocaleString('en-IN')}` });
  if (p.scrapValueInr != null) summaryItems.push({ label: 'Scrap Value', val: `₹${Number(p.scrapValueInr).toLocaleString('en-IN')}` });

  return {
    ...obj,
    documentReference: reference,
    priority,
    ageDays,
    isOverdue,
    canAction,
    isSelfRequest,
    justification,
    summaryItems
  };
};

// @desc    Get pending approvals for the current user
// @route   GET /api/approvals/pending
// @access  Private
exports.getPendingApprovals = async (req, res) => {
  try {
    const userRole = req.user.role?._id;
    const userId = req.user._id;
    const isSuperAdmin = req.user.role?.name === 'Super Admin';

    // Find delegator roles
    const delegators = await User.find({ delegatedTo: userId }).select('_id role');
    const roleIdsToCheck = [userRole].filter(Boolean);
    delegators.forEach(d => { if (d.role) roleIdsToCheck.push(d.role); });
    const delegatorRoleIds = delegators.map(d => d.role?.toString()).filter(Boolean);

    // Query filters
    const { module: modFilter, priority: priorityFilter, search: searchFilter, scope } = req.query;

    const query = { status: 'Pending' };
    if (modFilter && modFilter !== 'all') {
      query.module = modFilter;
    }

    const requests = await ApprovalRequest.find(query)
      .populate('requestedBy', 'firstName lastName email role')
      .populate('requiredLevels.roleId', 'name description')
      .populate('requiredLevels.actionedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Filter to actionable or all according to scope and permissions
    let filtered = requests;
    if (!isSuperAdmin || scope === 'assigned_to_me') {
      filtered = requests.filter(r => {
        const currentStep = r.requiredLevels.find(l => l.level === r.currentLevel);
        if (!currentStep || currentStep.status !== 'Pending') return false;
        const stepRoleId = currentStep.roleId?._id || currentStep.roleId;
        return roleIdsToCheck.some(roleId => roleId.equals ? roleId.equals(stepRoleId) : String(roleId) === String(stepRoleId));
      });
    }

    // Enrich items
    let enriched = filtered.map(item => enrichApproval(item, userId, userRole, delegatorRoleIds, isSuperAdmin));

    // Priority filter
    if (priorityFilter && priorityFilter !== 'all') {
      if (priorityFilter === 'critical') {
        enriched = enriched.filter(e => e.priority === 'Rush Expedite' || e.priority === 'Critical' || e.priority === 'High');
      } else if (priorityFilter === 'overdue') {
        enriched = enriched.filter(e => e.isOverdue);
      } else {
        enriched = enriched.filter(e => e.priority.toLowerCase() === priorityFilter.toLowerCase());
      }
    }

    // Search filter
    if (searchFilter && searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      enriched = enriched.filter(e => {
        const refMatch = e.documentReference?.toLowerCase().includes(q);
        const modMatch = e.module?.toLowerCase().includes(q);
        const reqMatch = `${e.requestedBy?.firstName || ''} ${e.requestedBy?.lastName || ''} ${e.requestedBy?.email || ''}`.toLowerCase().includes(q);
        const jsonMatch = JSON.stringify(e.payload || {}).toLowerCase().includes(q);
        return refMatch || modMatch || reqMatch || jsonMatch;
      });
    }

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get approval summary statistics and metrics
// @route   GET /api/approvals/stats
// @access  Private
exports.getApprovalStats = async (req, res) => {
  try {
    const userRole = req.user.role?._id;
    const userId = req.user._id;
    const isSuperAdmin = req.user.role?.name === 'Super Admin';

    const delegators = await User.find({ delegatedTo: userId }).select('_id role');
    const roleIdsToCheck = [userRole].filter(Boolean);
    delegators.forEach(d => { if (d.role) roleIdsToCheck.push(d.role); });

    const allPending = await ApprovalRequest.find({ status: 'Pending' })
      .populate('requestedBy', 'firstName lastName email')
      .populate('requiredLevels.roleId', 'name description');

    const totalPending = allPending.length;

    // Filter actionable by user
    const actionable = allPending.filter(r => {
      if (isSuperAdmin) return true;
      const currentStep = r.requiredLevels.find(l => l.level === r.currentLevel);
      if (!currentStep || currentStep.status !== 'Pending') return false;
      const stepRoleId = currentStep.roleId?._id || currentStep.roleId;
      return roleIdsToCheck.some(roleId => roleId.equals ? roleId.equals(stepRoleId) : String(roleId) === String(stepRoleId));
    });

    const now = new Date();
    let criticalCount = 0;
    let overdueCount = 0;
    const byModule = {};

    allPending.forEach(r => {
      const pri = calculatePriority(r);
      if (pri === 'Critical' || pri === 'High' || pri === 'Rush Expedite') criticalCount++;
      const ageDays = Math.floor((now - new Date(r.createdAt)) / (1000 * 60 * 60 * 24));
      if (ageDays >= 3) overdueCount++;

      byModule[r.module] = (byModule[r.module] || 0) + 1;
    });

    const approvedCount = await ApprovalRequest.countDocuments({ status: 'Approved' }).catch(() => 0);
    const rejectedCount = await ApprovalRequest.countDocuments({ status: 'Rejected' }).catch(() => 0);

    res.status(200).json({
      success: true,
      data: {
        totalPending,
        actionableByMe: actionable.length,
        criticalPriority: criticalCount,
        overdueCount,
        approvedCount,
        rejectedCount,
        byModule
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get approval decision history & audit trail
// @route   GET /api/approvals/history
// @access  Private
exports.getApprovalHistory = async (req, res) => {
  try {
    const { status, module: modFilter, search: searchFilter, page = 1, limit = 25 } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $in: ['Approved', 'Rejected'] };
    }

    if (modFilter && modFilter !== 'all') {
      query.module = modFilter;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ApprovalRequest.countDocuments(query);

    const history = await ApprovalRequest.find(query)
      .populate('requestedBy', 'firstName lastName email role')
      .populate('requiredLevels.roleId', 'name description')
      .populate('requiredLevels.actionedBy', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const enriched = history.map(item => enrichApproval(item, req.user._id, req.user.role?._id, [], req.user.role?.name === 'Super Admin'));

    res.status(200).json({
      success: true,
      count: enriched.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      data: enriched
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get detailed approval with current record diff comparison
// @route   GET /api/approvals/:id
// @access  Private
exports.getApprovalById = async (req, res) => {
  try {
    const approval = await ApprovalRequest.findById(req.params.id)
      .populate('requestedBy', 'firstName lastName email role')
      .populate('requiredLevels.roleId', 'name description')
      .populate('requiredLevels.actionedBy', 'firstName lastName email');

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    const enriched = enrichApproval(approval, req.user._id, req.user.role?._id, [], req.user.role?.name === 'Super Admin');

    // Attempt to locate persisted record in database
    const currentRecord = await findUnderlyingRecord(approval);

    // Compute field-by-field diff
    const fieldDiffs = [];
    const p = approval.payload || {};

    if (approval.action === 'update' && currentRecord) {
      Object.entries(p).forEach(([key, newVal]) => {
        if (key.startsWith('_') || key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === '__v') return;
        const oldVal = currentRecord[key];
        const isDifferent = JSON.stringify(oldVal) !== JSON.stringify(newVal);
        fieldDiffs.push({
          field: key,
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          oldValue: oldVal !== undefined ? oldVal : null,
          newValue: newVal !== undefined ? newVal : null,
          isChanged: isDifferent
        });
      });
    } else {
      // Creation request: all proposed fields
      Object.entries(p).forEach(([key, newVal]) => {
        if (key.startsWith('_') || key === 'id') return;
        fieldDiffs.push({
          field: key,
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          oldValue: null,
          newValue: newVal,
          isChanged: true
        });
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...enriched,
        currentRecord,
        fieldDiffs
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// ── Business Model Mutation Handler ──────────────────────────────────────────
const applyApprovedChangesToModule = async (approval, actioningUser) => {
  const Model = getModelForModule(approval.module);
  if (!Model) return { applied: false, note: `Model for ${approval.module} not found` };

  const p = approval.payload || {};

  try {
    if (approval.action === 'create') {
      // Check if document was pre-created in 'Pending' state
      const queryCandidates = [
        { poNumber: p.poNumber },
        { orderNumber: p.orderNumber },
        { woNumber: p.woNumber },
        { scrapReportId: p.scrapReportId },
        { ncrNumber: p.ncrNumber },
        { ecrNumber: p.ecrNumber },
        { code: p.code }
      ];

      for (const q of queryCandidates) {
        const [k, v] = Object.entries(q)[0];
        if (v) {
          const existing = await Model.findOne({ [k]: v });
          if (existing) {
            existing.approvalStatus = 'Approved';
            if (existing.status === 'Draft' || existing.status === 'Pending') {
              if (approval.module === 'PurchaseOrder') existing.status = 'Issued';
              else if (approval.module === 'SalesOrder') existing.status = 'Confirmed';
              else if (approval.module === 'WorkOrder') existing.status = 'Released';
              else if (approval.module === 'ScrapManagement') existing.status = 'Approved';
              else if (approval.module === 'EngineeringChange') existing.status = 'Approved';
              else if (approval.module === 'QualityNonConformance') existing.status = 'Disposition Approved';
            }
            existing.updatedBy = actioningUser._id;
            await existing.save();
            return { applied: true, recordId: existing._id, type: 'updated_existing_document' };
          }
        }
      }

      // Document does not exist yet: create new document
      const created = await Model.create({
        ...p,
        approvalStatus: 'Approved',
        createdBy: approval.requestedBy?._id || approval.requestedBy,
        updatedBy: actioningUser._id
      });
      return { applied: true, recordId: created._id, type: 'created_new_record' };
    }

    if (approval.action === 'update') {
      const existing = await findUnderlyingRecord(approval);
      if (existing) {
        const cleanPayload = { ...p };
        delete cleanPayload._id;
        delete cleanPayload.id;
        cleanPayload.approvalStatus = 'Approved';
        cleanPayload.updatedBy = actioningUser._id;

        const updated = await Model.findByIdAndUpdate(existing._id, cleanPayload, { new: true });
        return { applied: true, recordId: updated?._id, type: 'applied_update' };
      }
    }

    if (approval.action === 'delete') {
      const existing = await findUnderlyingRecord(approval);
      if (existing) {
        if (Model.schema?.paths?.isDeleted) {
          await Model.findByIdAndUpdate(existing._id, { isDeleted: true, deletedBy: actioningUser._id, deletedAt: new Date() });
        } else {
          await Model.findByIdAndDelete(existing._id);
        }
        return { applied: true, recordId: existing._id, type: 'deleted' };
      }
    }

    return { applied: true, note: 'Approved without external entity mutation' };
  } catch (err) {
    console.error(`Failed to apply changes to module ${approval.module}:`, err.message);
    return { applied: false, error: err.message };
  }
};

// @desc    Approve a request step with atomic concurrency & audit logging
// @route   POST /api/approvals/:id/approve
// @access  Private
exports.approveRequest = async (req, res) => {
  try {
    const approval = await ApprovalRequest.findById(req.params.id)
      .populate('requestedBy', 'firstName lastName email role')
      .populate('requiredLevels.roleId', 'name description');

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    // Atomic Concurrency Guard
    if (approval.status !== 'Pending') {
      return res.status(409).json({
        success: false,
        message: `Conflict: This approval request is already ${approval.status}. Actioned on ${new Date(approval.updatedAt).toLocaleString('en-IN')}. Please refresh your view.`
      });
    }

    const currentStep = approval.requiredLevels.find((l) => l.level === approval.currentLevel);
    if (!currentStep) {
      return res.status(400).json({ success: false, message: 'Invalid approval workflow state' });
    }

    // Separation of Duties Enforcement: Caller cannot sign off on own request unless explicitly Super Admin
    const isSuperAdmin = req.user.role?.name === 'Super Admin';
    const reqUserId = approval.requestedBy?._id ? approval.requestedBy._id.toString() : approval.requestedBy?.toString();
    if (!isSuperAdmin && reqUserId && reqUserId === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Separation of Duties violation: You cannot approve your own request. Another authorized approver must sign off.'
      });
    }

    // Role / Delegation Authorization Check
    const userRoleId = req.user.role?._id ? req.user.role._id.toString() : null;
    const requiredRoleId = currentStep.roleId?._id ? currentStep.roleId._id.toString() : currentStep.roleId ? currentStep.roleId.toString() : null;

    if (requiredRoleId && userRoleId !== requiredRoleId && !isSuperAdmin) {
      const delegators = await User.find({ delegatedTo: req.user._id }).select('role');
      const delegatedRoleIds = delegators.map((d) => d.role?.toString());
      if (!delegatedRoleIds.includes(requiredRoleId)) {
        return res.status(403).json({
          success: false,
          message: `Authorization Error: This approval step requires the role "${currentStep.roleId?.name || 'Authorized Approver'}".`
        });
      }
    }

    const comments = req.body?.comments?.trim() || req.body?.reason?.trim() || '';

    // Mark current step as approved
    currentStep.status = 'Approved';
    currentStep.actionedBy = req.user._id;
    currentStep.actionedAt = Date.now();
    currentStep.comments = comments || 'Approved by authorized workflow reviewer';

    // Check if subsequent levels exist in multi-stage sequence
    const nextStep = approval.requiredLevels.find((l) => l.level === approval.currentLevel + 1);
    if (nextStep) {
      approval.currentLevel += 1;
      await approval.save();

      // Audit Log for intermediate step approval
      await AuditLog.create({
        action: 'APPROVAL_STEP_GRANT',
        module: approval.module,
        recordId: approval._id,
        oldValue: { status: 'Pending', step: approval.currentLevel - 1 },
        newValue: { status: 'Pending', step: approval.currentLevel, actionedBy: req.user._id, comments },
        changedBy: req.user._id,
        ipAddress: req.ip
      }).catch((e) => console.error('AuditLog error:', e.message));

      return res.status(200).json({
        success: true,
        message: `Step ${approval.currentLevel - 1} approved. Request routed to next approval tier (Step ${approval.currentLevel}).`,
        data: approval
      });
    }

    // Final Approval: All levels cleared!
    approval.status = 'Approved';
    await approval.save();

    // Commit changes to actual underlying business module
    const mutationResult = await applyApprovedChangesToModule(approval, req.user);

    // Audit Log for final approval grant
    await AuditLog.create({
      action: 'APPROVAL_GRANT',
      module: approval.module,
      recordId: approval._id,
      oldValue: { status: 'Pending', currentLevel: approval.currentLevel },
      newValue: {
        status: 'Approved',
        action: approval.action,
        actionedBy: req.user._id,
        actionedByName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        actionedByRole: req.user.role?.name,
        comments,
        mutationResult
      },
      changedBy: req.user._id,
      ipAddress: req.ip
    }).catch((e) => console.error('AuditLog error:', e.message));

    res.status(200).json({
      success: true,
      message: `Final approval granted for ${extractDocumentReference(approval)}. Changes applied successfully.`,
      data: approval
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Reject a request with mandatory justification & audit logging
// @route   POST /api/approvals/:id/reject
// @access  Private
exports.rejectRequest = async (req, res) => {
  try {
    const reason = req.body?.comments?.trim() || req.body?.reason?.trim();
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is mandatory under ISO/IATF compliance and company approval policy.'
      });
    }

    const approval = await ApprovalRequest.findById(req.params.id)
      .populate('requestedBy', 'firstName lastName email role')
      .populate('requiredLevels.roleId', 'name description');

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    // Atomic Concurrency Guard
    if (approval.status !== 'Pending') {
      return res.status(409).json({
        success: false,
        message: `Conflict: This approval request is already ${approval.status}. Actioned on ${new Date(approval.updatedAt).toLocaleString('en-IN')}. Please refresh your view.`
      });
    }

    const currentStep = approval.requiredLevels.find((l) => l.level === approval.currentLevel);

    // Role / Delegation Authorization Check
    const isSuperAdmin = req.user.role?.name === 'Super Admin';
    const userRoleId = req.user.role?._id ? req.user.role._id.toString() : null;
    const requiredRoleId = currentStep?.roleId?._id ? currentStep.roleId._id.toString() : currentStep?.roleId ? currentStep.roleId.toString() : null;

    if (requiredRoleId && userRoleId !== requiredRoleId && !isSuperAdmin) {
      const delegators = await User.find({ delegatedTo: req.user._id }).select('role');
      const delegatedRoleIds = delegators.map((d) => d.role?.toString());
      if (!delegatedRoleIds.includes(requiredRoleId)) {
        return res.status(403).json({
          success: false,
          message: `Authorization Error: Only "${currentStep?.roleId?.name || 'Authorized Approver'}" can reject this step.`
        });
      }
    }

    if (currentStep) {
      currentStep.status = 'Rejected';
      currentStep.actionedBy = req.user._id;
      currentStep.actionedAt = Date.now();
      currentStep.comments = reason;
    }

    approval.status = 'Rejected';
    await approval.save();

    // If underlying document was created with 'Pending' approvalStatus, update it to 'Rejected'
    try {
      const existing = await findUnderlyingRecord(approval);
      if (existing) {
        const Model = getModelForModule(approval.module);
        if (Model && Model.schema?.paths?.approvalStatus) {
          await Model.findByIdAndUpdate(existing._id, { approvalStatus: 'Rejected', updatedBy: req.user._id });
        }
      }
    } catch (docErr) {
      console.warn('Note updating underlying document rejection status:', docErr.message);
    }

    // Audit Log for rejection
    await AuditLog.create({
      action: 'APPROVAL_REJECT',
      module: approval.module,
      recordId: approval._id,
      oldValue: { status: 'Pending', currentLevel: approval.currentLevel },
      newValue: {
        status: 'Rejected',
        rejectionReason: reason,
        actionedBy: req.user._id,
        actionedByName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        actionedByRole: req.user.role?.name
      },
      changedBy: req.user._id,
      ipAddress: req.ip
    }).catch((e) => console.error('AuditLog error:', e.message));

    res.status(200).json({
      success: true,
      message: `Request for ${extractDocumentReference(approval)} rejected and logged in audit history.`,
      data: approval
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Bulk approve multiple requests
// @route   POST /api/approvals/bulk-approve
// @access  Private
exports.bulkApprove = async (req, res) => {
  try {
    const { ids = [], comments = 'Bulk approved by authorized user' } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No approval request IDs provided.' });
    }

    const results = { approved: [], skipped: [], errors: [] };
    const isSuperAdmin = req.user.role?.name === 'Super Admin';
    const userRoleId = req.user.role?._id ? req.user.role._id.toString() : null;

    const delegators = await User.find({ delegatedTo: req.user._id }).select('role');
    const delegatedRoleIds = delegators.map((d) => d.role?.toString());

    for (const id of ids) {
      try {
        const approval = await ApprovalRequest.findById(id).populate('requestedBy', 'firstName lastName email role');
        if (!approval) {
          results.skipped.push({ id, reason: 'Not found' });
          continue;
        }
        if (approval.status !== 'Pending') {
          results.skipped.push({ id, reason: `Already ${approval.status}` });
          continue;
        }

        // Separation of duties
        const reqUserId = approval.requestedBy?._id ? approval.requestedBy._id.toString() : approval.requestedBy?.toString();
        if (!isSuperAdmin && reqUserId && reqUserId === req.user._id.toString()) {
          results.skipped.push({ id, reason: 'Separation of duties: Cannot self-approve' });
          continue;
        }

        const currentStep = approval.requiredLevels.find((l) => l.level === approval.currentLevel);
        const requiredRoleId = currentStep?.roleId?._id ? currentStep.roleId._id.toString() : currentStep?.roleId ? currentStep.roleId.toString() : null;

        if (requiredRoleId && userRoleId !== requiredRoleId && !isSuperAdmin && !delegatedRoleIds.includes(requiredRoleId)) {
          results.skipped.push({ id, reason: 'Insufficient role authorization' });
          continue;
        }

        if (currentStep) {
          currentStep.status = 'Approved';
          currentStep.actionedBy = req.user._id;
          currentStep.actionedAt = Date.now();
          currentStep.comments = comments;
        }

        const nextStep = approval.requiredLevels.find((l) => l.level === approval.currentLevel + 1);
        if (nextStep) {
          approval.currentLevel += 1;
        } else {
          approval.status = 'Approved';
          await applyApprovedChangesToModule(approval, req.user);
        }

        await approval.save();

        await AuditLog.create({
          action: 'APPROVAL_GRANT',
          module: approval.module,
          recordId: approval._id,
          oldValue: { status: 'Pending' },
          newValue: { status: approval.status, comments, isBulk: true },
          changedBy: req.user._id,
          ipAddress: req.ip
        }).catch(() => {});

        results.approved.push(id);
      } catch (itemErr) {
        results.errors.push({ id, error: itemErr.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch operation completed: ${results.approved.length} approved, ${results.skipped.length} skipped, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Bulk reject multiple requests
// @route   POST /api/approvals/bulk-reject
// @access  Private
exports.bulkReject = async (req, res) => {
  try {
    const { ids = [], reason = '' } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is mandatory for batch rejection.' });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No approval request IDs provided.' });
    }

    const results = { rejected: [], skipped: [], errors: [] };
    const isSuperAdmin = req.user.role?.name === 'Super Admin';
    const userRoleId = req.user.role?._id ? req.user.role._id.toString() : null;

    const delegators = await User.find({ delegatedTo: req.user._id }).select('role');
    const delegatedRoleIds = delegators.map((d) => d.role?.toString());

    for (const id of ids) {
      try {
        const approval = await ApprovalRequest.findById(id);
        if (!approval) {
          results.skipped.push({ id, reason: 'Not found' });
          continue;
        }
        if (approval.status !== 'Pending') {
          results.skipped.push({ id, reason: `Already ${approval.status}` });
          continue;
        }

        const currentStep = approval.requiredLevels.find((l) => l.level === approval.currentLevel);
        const requiredRoleId = currentStep?.roleId?._id ? currentStep.roleId._id.toString() : currentStep?.roleId ? currentStep.roleId.toString() : null;

        if (requiredRoleId && userRoleId !== requiredRoleId && !isSuperAdmin && !delegatedRoleIds.includes(requiredRoleId)) {
          results.skipped.push({ id, reason: 'Insufficient role authorization' });
          continue;
        }

        if (currentStep) {
          currentStep.status = 'Rejected';
          currentStep.actionedBy = req.user._id;
          currentStep.actionedAt = Date.now();
          currentStep.comments = reason.trim();
        }

        approval.status = 'Rejected';
        await approval.save();

        await AuditLog.create({
          action: 'APPROVAL_REJECT',
          module: approval.module,
          recordId: approval._id,
          oldValue: { status: 'Pending' },
          newValue: { status: 'Rejected', rejectionReason: reason.trim(), isBulk: true },
          changedBy: req.user._id,
          ipAddress: req.ip
        }).catch(() => {});

        results.rejected.push(id);
      } catch (itemErr) {
        results.errors.push({ id, error: itemErr.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch rejection completed: ${results.rejected.length} rejected, ${results.skipped.length} skipped, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    handleError(res, error);
  }
};

// ── Approval Configuration CRUD Endpoints (Who Can Approve What) ─────────────
// @desc    Get all approval configurations
// @route   GET /api/approvals/config
// @access  Private/Admin
exports.getConfigs = async (req, res) => {
  try {
    const configs = await ApprovalConfig.find().populate('levels.roleId', 'name description');
    res.status(200).json({ success: true, count: configs.length, data: configs });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Create an approval configuration
// @route   POST /api/approvals/config
// @access  Private/Admin
exports.createConfig = async (req, res) => {
  try {
    const existing = await ApprovalConfig.findOne({ module: req.body.module, action: req.body.action });
    if (existing) {
      return res.status(400).json({ success: false, message: `An approval rule for ${req.body.module} (${req.body.action}) already exists.` });
    }

    if (req.body.levels && req.body.levels.length > 0) {
      const selectedRoles = req.body.levels.map(l => (l.roleId?._id || l.roleId).toString());
      const uniqueRoles = new Set(selectedRoles);
      if (uniqueRoles.size !== selectedRoles.length) {
        return res.status(400).json({ success: false, message: 'Duplicate roles are not allowed within the same approval rule. Each approval level must be a distinct role.' });
      }
    }

    const config = await ApprovalConfig.create(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update an approval configuration
// @route   PUT /api/approvals/config/:id
// @access  Private/Admin
exports.updateConfig = async (req, res) => {
  try {
    if (req.body.module && req.body.action) {
      const existing = await ApprovalConfig.findOne({ module: req.body.module, action: req.body.action, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: `An approval rule for ${req.body.module} (${req.body.action}) already exists.` });
      }
    }

    if (req.body.levels && req.body.levels.length > 0) {
      const selectedRoles = req.body.levels.map(l => (l.roleId?._id || l.roleId).toString());
      const uniqueRoles = new Set(selectedRoles);
      if (uniqueRoles.size !== selectedRoles.length) {
        return res.status(400).json({ success: false, message: 'Duplicate roles are not allowed within the same approval rule. Each approval level must be a distinct role.' });
      }
    }

    const config = await ApprovalConfig.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete an approval configuration
// @route   DELETE /api/approvals/config/:id
// @access  Private/Admin
exports.deleteConfig = async (req, res) => {
  try {
    const config = await ApprovalConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }
    await config.deleteOne();
    res.status(200).json({ success: true, message: 'Configuration deleted' });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Toggle an approval configuration active state
// @route   PATCH /api/approvals/config/:id/toggle
// @access  Private/Admin
exports.toggleConfigStatus = async (req, res) => {
  try {
    const config = await ApprovalConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }
    config.isActive = req.body.isActive !== undefined ? req.body.isActive : !config.isActive;
    await config.save();
    const populated = await ApprovalConfig.findById(config._id).populate('levels.roleId', 'name description');
    res.status(200).json({ success: true, data: populated, message: `Approval rule ${config.isActive ? 'activated' : 'paused'}` });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Seed standard automotive approval rules (IATF 16949 compliant)
// @route   POST /api/approvals/config/seed-defaults
// @access  Private/Admin
exports.seedDefaultConfigs = async (req, res) => {
  try {
    const roles = await Role.find();
    if (!roles || roles.length === 0) {
      return res.status(400).json({ success: false, message: 'No roles found in system. Please seed roles first.' });
    }

    const findRole = (...names) => {
      for (const name of names) {
        const found = roles.find(r => r.name.toLowerCase() === name.toLowerCase());
        if (found) return found._id;
      }
      const adminRole = roles.find(r => r.name.toLowerCase().includes('admin'));
      return adminRole ? adminRole._id : roles[0]._id;
    };

    let hrExec = findRole('HR Executive', 'HR & Admin');
    if (!roles.some(r => r.name.toLowerCase() === 'hr executive')) {
      try {
        const newHr = await Role.create({
          name: 'HR Executive',
          description: 'Manages employee leave requests, overtime authorization, attendance records and staff onboarding.',
          permissions: [{ module: 'Employee' }, { module: 'HR' }],
          isActive: true,
          isSystem: false
        });
        hrExec = newHr._id;
      } catch (e) {
        // Fallback to admin if role creation fails
      }
    }

    const plantMgr = findRole('Plant Manager');
    const superAdmin = findRole('Super Admin', 'Admin');
    const purchaseOff = findRole('Purchase Officer');
    const qualityInsp = findRole('Quality Inspector');
    const salesExec = findRole('Sales Executive');
    const prodPlanner = findRole('Production Planner');
    const storeKeeper = findRole('Store Keeper');
    const accountsExec = findRole('Accounts Executive');
    const shopfloorSup = findRole('Shop Floor Supervisor');
    const maintEng = findRole('Maintenance Engineer');

    const defaultRules = [
      // ── A. HR & Personnel Operations ──
      {
        module: 'EmployeeLeave',
        action: 'create',
        name: 'Employee Leave Application & Sanction',
        description: 'Mandatory 2-stage sign-off: HR verifies quota & balance, then Reporting Manager approves operational clearance.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: hrExec, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 24, thresholdAmount: 0, notifyEscalation: true }
        ]
      },
      {
        module: 'OvertimeAuthorization',
        action: 'create',
        name: 'Overtime & Shift Allowance Authorization',
        description: 'Extended press shop production shift overtime and operator allowance sign-off.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: hrExec, slaHours: 12, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 24, thresholdAmount: 0, notifyEscalation: true }
        ]
      },
      {
        module: 'EmployeeAttendance',
        action: 'create',
        name: 'Attendance Regularization & Punch Correction',
        description: 'Biometric missing punch, late mark waiver, and shift adjustment authorization.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: hrExec, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 24, thresholdAmount: 0, notifyEscalation: true }
        ]
      },

      // ── B. Procurement & Supply Chain ──
      {
        module: 'PurchaseOrder',
        action: 'create',
        name: 'PO Multi-Tier Sign-off',
        description: 'Standard 2-tier sign-off for raw material, tooling and bought-out procurement.',
        minAmount: 25000,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: plantMgr, slaHours: 24, thresholdAmount: 25000, notifyEscalation: true },
          { level: 2, roleId: superAdmin, slaHours: 48, thresholdAmount: 100000, notifyEscalation: true }
        ]
      },
      {
        module: 'PurchaseRequisition',
        action: 'create',
        name: 'Material Indent Sign-off',
        description: 'Internal purchase requisitions from MRP & shop-floor prior to PO issuance.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: purchaseOff, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 24, thresholdAmount: 50000, notifyEscalation: true }
        ]
      },
      {
        module: 'MasterVendor',
        action: 'create',
        name: 'Supplier / Vendor Onboarding (IATF 16949)',
        description: 'Quality audit and commercial qualification before vendor master activation.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: qualityInsp, slaHours: 48, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: superAdmin, slaHours: 48, thresholdAmount: 0, notifyEscalation: true }
        ]
      },

      // ── C. Sales & Commercial ──
      {
        module: 'SalesOrder',
        action: 'create',
        name: 'Customer Sales Order & Credit Release',
        description: 'Customer delivery commitments and commercial credit limits verification.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: accountsExec, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: superAdmin, slaHours: 48, thresholdAmount: 150000, notifyEscalation: true }
        ]
      },
      {
        module: 'SalesQuotation',
        action: 'create',
        name: 'Automotive Tooling & Part Quotation',
        description: 'Stamping piece rates, tooling amortization, and margin threshold sign-off.',
        minAmount: 50000,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: plantMgr, slaHours: 24, thresholdAmount: 50000, notifyEscalation: true },
          { level: 2, roleId: superAdmin, slaHours: 48, thresholdAmount: 250000, notifyEscalation: true }
        ]
      },

      // ── D. Manufacturing & Shop Floor ──
      {
        module: 'WorkOrder',
        action: 'create',
        name: 'Production Work Order Batch Release',
        description: 'Press line capacity validation, blank steel allocation, and tooling sign-off.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: shopfloorSup, slaHours: 12, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 12, thresholdAmount: 0, notifyEscalation: true }
        ]
      },
      {
        module: 'EngineeringBOM',
        action: 'create',
        name: 'Bill of Materials (BOM) Revision Release',
        description: 'Engineering drawing consumption ratios, raw material specs, and scrap allowance sign-off.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: qualityInsp, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 24, thresholdAmount: 0, notifyEscalation: true }
        ]
      },

      // ── E. Quality & IATF 16949 ──
      {
        module: 'EngineeringChange',
        action: 'create',
        name: 'Engineering Change Request (ECR) Governance',
        description: 'Customer drawing revisions, die modifications, and PPAP level 3 re-validation.',
        minAmount: 0,
        priority: 'CRITICAL',
        isActive: true,
        levels: [
          { level: 1, roleId: qualityInsp, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 48, thresholdAmount: 0, notifyEscalation: true }
        ]
      },
      {
        module: 'QualityNonConformance',
        action: 'create',
        name: 'Quality NCR Defect Containment Sign-off',
        description: 'Containment actions, customer PPM lot quarantine, and 8D root-cause sign-off.',
        minAmount: 0,
        priority: 'CRITICAL',
        isActive: true,
        levels: [
          { level: 1, roleId: qualityInsp, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 24, thresholdAmount: 0, notifyEscalation: true }
        ]
      },

      // ── F. Maintenance & Asset Reliability ──
      {
        module: 'BreakdownMaintenance',
        action: 'create',
        name: 'Emergency Press Breakdown & Repair Sign-off',
        description: 'Unplanned machine breakdown, hydraulic press downtime, and urgent spare drawal.',
        minAmount: 0,
        priority: 'CRITICAL',
        isActive: true,
        levels: [
          { level: 1, roleId: maintEng, slaHours: 6, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 12, thresholdAmount: 0, notifyEscalation: true }
        ]
      },
      {
        module: 'PreventiveMaintenance',
        action: 'create',
        name: 'Preventive Maintenance (PM) Schedule Sign-off',
        description: 'Monthly/quarterly press service, sensor calibration, and lubrication logs.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: plantMgr, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: qualityInsp, slaHours: 24, thresholdAmount: 0, notifyEscalation: true }
        ]
      },

      // ── G. Inventory, Scrap & Warehouse ──
      {
        module: 'ScrapManagement',
        action: 'create',
        name: 'Floor Scrap Disposal & Metallurgical Write-off',
        description: 'Press shop offcut scrap disposal authorization and rejected stamping write-off.',
        minAmount: 10000,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: qualityInsp, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 24, thresholdAmount: 20000, notifyEscalation: true },
          { level: 3, roleId: superAdmin, slaHours: 48, thresholdAmount: 100000, notifyEscalation: true }
        ]
      },
      {
        module: 'InventoryAdjustment',
        action: 'create',
        name: 'Stock Cycle Count Variance Write-down',
        description: 'Discrepancy reconciliation between physical stock count and ERP inventory ledger.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: accountsExec, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: plantMgr, slaHours: 24, thresholdAmount: 0, notifyEscalation: true }
        ]
      },
      {
        module: 'Plant',
        action: 'create',
        name: 'Plant Facility Master Governance',
        description: 'Manufacturing facility setup, stamping line additions, and plant profile configuration.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: plantMgr, slaHours: 48, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: superAdmin, slaHours: 48, thresholdAmount: 0, notifyEscalation: true }
        ]
      },
      {
        module: 'Warehouse',
        action: 'create',
        name: 'Warehouse & Store Bay Setup',
        description: 'Raw material storage bays, coil racks, and dispatch warehouse configuration.',
        minAmount: 0,
        priority: 'ALL',
        isActive: true,
        levels: [
          { level: 1, roleId: storeKeeper, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: superAdmin, slaHours: 48, thresholdAmount: 0, notifyEscalation: true }
        ]
      },
      {
        module: 'User',
        action: 'create',
        name: 'User Account Provisioning & Security Clearance',
        description: 'New employee ERP login credentials, role privilege assignment and branch clearance.',
        minAmount: 0,
        priority: 'CRITICAL',
        isActive: true,
        levels: [
          { level: 1, roleId: plantMgr, slaHours: 24, thresholdAmount: 0, notifyEscalation: true },
          { level: 2, roleId: superAdmin, slaHours: 24, thresholdAmount: 0, notifyEscalation: true }
        ]
      }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const rule of defaultRules) {
      const existing = await ApprovalConfig.findOne({ module: rule.module, action: rule.action });
      if (existing) {
        await ApprovalConfig.findByIdAndUpdate(existing._id, {
          name: existing.name || rule.name,
          description: existing.description || rule.description,
          minAmount: existing.minAmount || rule.minAmount,
          priority: existing.priority || rule.priority,
          isActive: existing.isActive !== undefined ? existing.isActive : true,
          levels: existing.levels && existing.levels.length > 0 ? existing.levels.map((lvl, idx) => ({
            level: lvl.level || (idx + 1),
            roleId: lvl.roleId,
            slaHours: lvl.slaHours || (idx === 0 ? 24 : 48),
            thresholdAmount: lvl.thresholdAmount || 0,
            notifyEscalation: lvl.notifyEscalation !== undefined ? lvl.notifyEscalation : true
          })) : rule.levels
        });
        updatedCount++;
      } else {
        await ApprovalConfig.create(rule);
        createdCount++;
      }
    }

    const allConfigs = await ApprovalConfig.find().populate('levels.roleId', 'name description');
    res.status(200).json({
      success: true,
      message: `Automotive approval matrix updated: ${createdCount} created, ${updatedCount} synchronized.`,
      count: allConfigs.length,
      data: allConfigs
    });
  } catch (error) {
    handleError(res, error);
  }
};
