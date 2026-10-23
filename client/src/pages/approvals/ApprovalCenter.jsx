import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Check, X, Search, Filter, RefreshCw, AlertTriangle, Clock, ShieldCheck,
  ArrowRight, Eye, CheckCircle2, XCircle, AlertCircle, ShoppingCart, Factory,
  Boxes, FileText, ChevronRight, Layers, FileCheck, Building2, User,
  SlidersHorizontal, CheckSquare, Square, CornerDownRight, ExternalLink,
  ShieldAlert, History, Calendar, UserCheck, MessageSquare, ChevronLeft,
  ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { notify } from '../../utils/notify';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/common/Modal';

/* ── Authentic Categorized Document Labels & Domain Configuration ─────────── */
const RECORD_LABEL = {
  Plant: 'Plant / Facility',
  Branch: 'Branch Office',
  Warehouse: 'Store / Warehouse',
  User: 'User Login & Access',
  Role: 'Role & Permissions',
  PurchaseOrder: 'Purchase Order (PO)',
  PurchaseRequisition: 'Purchase Request (PR)',
  MasterVendor: 'Supplier / Vendor Onboarding',
  SalesOrder: 'Sales Order (SO)',
  SalesQuotation: 'Sales Quotation',
  SalesInquiry: 'Sales Inquiry',
  MasterCustomer: 'Customer Onboarding',
  WorkOrder: 'Work Order (WO)',
  EngineeringChange: 'Engineering Change (ECR)',
  'Engineering Change': 'Engineering Change (ECR)',
  MasterProduct: 'Product Master',
  MasterMaterial: 'Raw Material Specification',
  QualityNonConformance: 'Quality Non-Conformance (NCR)',
  ScrapManagement: 'Scrap Write-Off',
  'Dispatch Plan': 'Dispatch Execution Plan',
  'MRP Recommendation': 'MRP Recommendation Conversion',
  'BOM Revision': 'BOM Revision Approval',
  Maintenance: 'Machine Maintenance Schedule'
};

const RECORD_DOMAIN = {
  PurchaseOrder: { name: 'Procurement', icon: ShoppingCart, color: 'var(--accent-warning, #f59e0b)' },
  PurchaseRequisition: { name: 'Procurement', icon: ShoppingCart, color: 'var(--accent-warning, #f59e0b)' },
  MasterVendor: { name: 'Procurement', icon: ShoppingCart, color: 'var(--accent-warning, #f59e0b)' },
  SalesOrder: { name: 'Sales & Orders', icon: FileCheck, color: 'var(--accent-primary, #2563eb)' },
  SalesQuotation: { name: 'Sales & Orders', icon: FileCheck, color: 'var(--accent-primary, #2563eb)' },
  SalesInquiry: { name: 'Sales & Orders', icon: FileCheck, color: 'var(--accent-primary, #2563eb)' },
  MasterCustomer: { name: 'Sales & Orders', icon: FileCheck, color: 'var(--accent-primary, #2563eb)' },
  WorkOrder: { name: 'Shop Floor', icon: Factory, color: 'var(--accent-teal, #0d9488)' },
  EngineeringChange: { name: 'Engineering', icon: Factory, color: 'var(--accent-purple, #7c3aed)' },
  'Engineering Change': { name: 'Engineering', icon: Factory, color: 'var(--accent-purple, #7c3aed)' },
  'BOM Revision': { name: 'Engineering', icon: Factory, color: 'var(--accent-purple, #7c3aed)' },
  MasterProduct: { name: 'Engineering', icon: Boxes, color: 'var(--accent-purple, #7c3aed)' },
  MasterMaterial: { name: 'Engineering', icon: Boxes, color: 'var(--accent-purple, #7c3aed)' },
  QualityNonConformance: { name: 'Quality & IATF', icon: AlertCircle, color: 'var(--accent-danger, #ef4444)' },
  ScrapManagement: { name: 'Quality & Scrap', icon: AlertTriangle, color: 'var(--accent-danger, #ef4444)' },
  'Dispatch Plan': { name: 'Logistics', icon: Boxes, color: 'var(--accent-primary, #2563eb)' },
  'MRP Recommendation': { name: 'Planning', icon: Layers, color: 'var(--accent-purple, #7c3aed)' },
  Maintenance: { name: 'Plant Engineering', icon: Factory, color: 'var(--accent-teal, #0d9488)' },
  Plant: { name: 'Governance', icon: Building2, color: 'var(--accent-primary, #2563eb)' },
  Branch: { name: 'Governance', icon: Building2, color: 'var(--accent-primary, #2563eb)' },
  Warehouse: { name: 'Governance', icon: Building2, color: 'var(--accent-primary, #2563eb)' },
  User: { name: 'Administration', icon: User, color: 'var(--text-secondary, #64748b)' },
  Role: { name: 'Administration', icon: ShieldCheck, color: 'var(--text-secondary, #64748b)' }
};

const ACTION_CONFIG = {
  create: { label: 'New Record Creation', tag: 'CREATE', bg: 'rgba(16, 185, 129, 0.12)', fg: '#059669', border: 'rgba(16, 185, 129, 0.3)' },
  update: { label: 'Field Modification', tag: 'UPDATE', bg: 'rgba(245, 158, 11, 0.12)', fg: '#d97706', border: 'rgba(245, 158, 11, 0.3)' },
  delete: { label: 'Deletion Request', tag: 'DELETE', bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626', border: 'rgba(239, 68, 68, 0.3)' },
  approve: { label: 'Sign-off Request', tag: 'SIGN-OFF', bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb', border: 'rgba(37, 99, 235, 0.3)' },
  convert: { label: 'Conversion Request', tag: 'CONVERT', bg: 'rgba(124, 58, 237, 0.12)', fg: '#7c3aed', border: 'rgba(124, 58, 237, 0.3)' }
};

const PRIORITY_BADGES = {
  'Rush Expedite': { label: 'Rush', bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
  Critical: { label: 'Critical', bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
  High: { label: 'High', bg: '#ffedd5', fg: '#9a3412', border: '#fdba74' },
  Normal: { label: 'Normal', bg: 'var(--surface-sunken)', fg: 'var(--text-secondary)', border: 'var(--border-subtle)' },
  Low: { label: 'Low', bg: 'var(--surface-sunken)', fg: 'var(--text-muted)', border: 'var(--border-subtle)' }
};

const ApprovalCenter = () => {
  const { user } = useAuth();

  // Active view tab: 'pending' or 'history'
  const [activeTab, setActiveTab] = useState('pending');

  // Authoritative data states
  const [pendingList, setPendingList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    actionableByMe: 0,
    criticalPriority: 0,
    overdueCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    byModule: {}
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' or 'assigned_to_me'
  const [activeCardFilter, setActiveCardFilter] = useState(null);

  // Pagination states: default to 3 rows per page (giving 1–4 pages for 12 records)
  const [pageSize, setPageSize] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);

  // Right-side panel states (Pending Action vs Approval History & Tabs vs Split view)
  const [rightPanelTab, setRightPanelTab] = useState('pending'); // 'pending' | 'history'
  const [rightPanelMode, setRightPanelMode] = useState('tabs'); // 'tabs' | 'split'
  const [inlineComments, setInlineComments] = useState('');
  const [inlineActing, setInlineActing] = useState(false);

  // Interactive review modal & action states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Approve dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [approving, setApproving] = useState(false);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null); // 'approve' or 'reject'
  const [bulkComments, setBulkComments] = useState('');
  const [processingBulk, setProcessingBulk] = useState(false);

  /* ── 1. Authoritative Data Fetching (Both Pending & History for Split View) ─ */
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);

    try {
      const statsPromise = axios.get('/approvals/stats').catch(() => ({ data: { success: false } }));

      const pendingParams = {};
      if (selectedModule !== 'all') pendingParams.module = selectedModule;
      if (selectedPriority !== 'all') pendingParams.priority = selectedPriority;
      if (searchQuery.trim()) pendingParams.search = searchQuery.trim();
      if (scopeFilter === 'assigned_to_me') pendingParams.scope = 'assigned_to_me';

      const pendingPromise = axios.get('/approvals/pending', { params: pendingParams });

      // Always retrieve history so the right-side Approval History panel is immediately live
      const historyPromise = axios.get('/approvals/history', {
        params: {
          limit: 30,
          module: selectedModule !== 'all' ? selectedModule : undefined
        }
      }).catch(() => ({ data: { success: true, data: [], total: 0 } }));

      const [statsRes, pendingRes, historyRes] = await Promise.all([
        statsPromise,
        pendingPromise,
        historyPromise
      ]);

      if (statsRes.data?.success && statsRes.data?.data) {
        setStats(statsRes.data.data);
      }

      if (pendingRes.data?.success) {
        const list = pendingRes.data.data || [];
        setPendingList(list);
        // Automatically default selectedApproval to the first item for the right-hand action panel
        setSelectedApproval(prev => {
          if (!prev) return list[0] || null;
          const found = list.find(item => item._id === prev._id);
          return found || list[0] || null;
        });
      }

      if (historyRes.data?.success) {
        setHistoryList(historyRes.data.data || []);
        setTotalHistoryCount(historyRes.data.total || 0);
      }

      setLastRefreshed(new Date());
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to load approvals:', err);
      notify.error(err.response?.data?.message || 'Failed to refresh approval queue from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedModule, selectedPriority, searchQuery, scopeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedModule, selectedPriority, selectedAction, searchQuery, scopeFilter, activeCardFilter, pageSize]);

  /* ── 2. Detailed Approval Drill-down ──────────────────────────────────────── */
  const handleOpenDetail = async (approval) => {
    setSelectedApproval(approval);
    setDetailModalOpen(true);
    setLoadingDetail(true);

    try {
      const res = await axios.get(`/approvals/${approval._id}`);
      if (res.data?.success) {
        setSelectedApproval(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch deep diff details, using list payload:', err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ── 3. Single Approve Workflow ───────────────────────────────────────────── */
  const promptApprove = (approval) => {
    setApprovalTarget(approval);
    setApprovalComments('');
    setApproveDialogOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!approvalTarget || approving) return;
    setApproving(true);

    try {
      const res = await axios.post(`/approvals/${approvalTarget._id}/approve`, {
        comments: approvalComments
      });

      notify.success(res.data?.message || 'Approval granted successfully');
      setApproveDialogOpen(false);
      setDetailModalOpen(false);
      await fetchData(true);
    } catch (err) {
      console.error('Approval failed:', err);
      notify.error(err.response?.data?.message || 'Approval could not be processed');
      if (err.response?.status === 409) {
        fetchData(true);
      }
    } finally {
      setApproving(false);
    }
  };

  /* ── 4. Single Reject Workflow (Mandatory Reason Enforced) ─────────────────── */
  const promptReject = (approval) => {
    setRejectTarget(approval);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || rejecting) return;
    if (!rejectionReason.trim()) {
      notify.error('Please enter a mandatory rejection reason to comply with company audit policy.');
      return;
    }

    setRejecting(true);
    try {
      const res = await axios.post(`/approvals/${rejectTarget._id}/reject`, {
        reason: rejectionReason.trim(),
        comments: rejectionReason.trim()
      });

      notify.success(res.data?.message || 'Request rejected and logged in audit history');
      setRejectDialogOpen(false);
      setDetailModalOpen(false);
      await fetchData(true);
    } catch (err) {
      console.error('Rejection failed:', err);
      notify.error(err.response?.data?.message || 'Rejection could not be recorded');
      if (err.response?.status === 409) {
        fetchData(true);
      }
    } finally {
      setRejecting(false);
    }
  };

  /* ── 4b. Inline Fast Approval & Rejection for Right-Side Inspector ─────────── */
  const handleInlineApprove = async () => {
    if (!selectedApproval || inlineActing) return;
    setInlineActing(true);
    try {
      const res = await axios.post(`/approvals/${selectedApproval._id}/approve`, {
        comments: inlineComments.trim() || undefined
      });
      notify.success(res.data?.message || 'Approval granted successfully');
      setInlineComments('');
      await fetchData(true);
    } catch (err) {
      console.error('Inline approval failed:', err);
      notify.error(err.response?.data?.message || 'Approval could not be processed');
      if (err.response?.status === 409) {
        fetchData(true);
      }
    } finally {
      setInlineActing(false);
    }
  };

  const handleInlineReject = async () => {
    if (!selectedApproval || inlineActing) return;
    if (!inlineComments.trim()) {
      notify.error('Please enter a mandatory rejection reason in the remarks field.');
      return;
    }
    setInlineActing(true);
    try {
      const res = await axios.post(`/approvals/${selectedApproval._id}/reject`, {
        reason: inlineComments.trim(),
        comments: inlineComments.trim()
      });
      notify.success(res.data?.message || 'Request rejected and logged in audit history');
      setInlineComments('');
      await fetchData(true);
    } catch (err) {
      console.error('Inline rejection failed:', err);
      notify.error(err.response?.data?.message || 'Rejection could not be recorded');
      if (err.response?.status === 409) {
        fetchData(true);
      }
    } finally {
      setInlineActing(false);
    }
  };

  /* ── 5. Bulk Approve & Reject Handlers ─────────────────────────────────────── */
  const toggleSelectRow = (id, e) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const actionableItems = pendingList.filter(item => item.canAction && !item.isSelfRequest);
    if (selectedIds.size === actionableItems.length && actionableItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(actionableItems.map(i => i._id)));
    }
  };

  const handleExecuteBulk = async () => {
    if (!bulkAction || selectedIds.size === 0 || processingBulk) return;

    if (bulkAction === 'reject' && !bulkComments.trim()) {
      notify.error('Mandatory rejection reason required for batch rejection.');
      return;
    }

    setProcessingBulk(true);
    try {
      const endpoint = bulkAction === 'approve' ? '/approvals/bulk-approve' : '/approvals/bulk-reject';
      const payload = {
        ids: Array.from(selectedIds),
        comments: bulkComments,
        reason: bulkComments
      };

      const res = await axios.post(endpoint, payload);
      notify.success(res.data?.message || `Bulk ${bulkAction} processed successfully.`);
      setBulkAction(null);
      setBulkComments('');
      await fetchData(true);
    } catch (err) {
      notify.error(err.response?.data?.message || `Bulk ${bulkAction} failed.`);
    } finally {
      setProcessingBulk(false);
    }
  };

  /* ── 6. Client-Side Filter & Slicing for Pagination ────────────────────────── */
  const filteredList = useMemo(() => {
    const sourceList = activeTab === 'pending' ? pendingList : historyList;

    return sourceList.filter(item => {
      if (selectedAction !== 'all' && item.action !== selectedAction) return false;

      if (activeCardFilter === 'critical') {
        if (item.priority !== 'Rush Expedite' && item.priority !== 'Critical' && item.priority !== 'High') return false;
      }
      if (activeCardFilter === 'overdue' && !item.isOverdue) return false;
      if (activeCardFilter === 'assigned_to_me' && !item.canAction) return false;

      return true;
    });
  }, [activeTab, pendingList, historyList, selectedAction, activeCardFilter]);

  // Compute pagination bounds
  const totalFilteredCount = activeTab === 'pending' ? filteredList.length : totalHistoryCount;
  const totalPages = Math.max(1, Math.ceil((activeTab === 'pending' ? filteredList.length : totalHistoryCount) / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, activeTab === 'pending' ? filteredList.length : totalHistoryCount);

  // The actual slice rendered in the table on the current page
  const displayedRows = useMemo(() => {
    if (activeTab === 'history') return historyList; // Server paginates history
    return filteredList.slice(startIndex, endIndex); // Client paginates pending
  }, [activeTab, historyList, filteredList, startIndex, endIndex]);

  const handleCardFilterClick = (filterKey) => {
    if (activeCardFilter === filterKey) {
      setActiveCardFilter(null);
    } else {
      setActiveCardFilter(filterKey);
      if (activeTab !== 'pending' && filterKey !== 'history') {
        setActiveTab('pending');
      }
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedModule('all');
    setSelectedPriority('all');
    setSelectedAction('all');
    setScopeFilter('all');
    setActiveCardFilter(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedModule !== 'all' || selectedPriority !== 'all' || selectedAction !== 'all' || scopeFilter !== 'all' || activeCardFilter;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* ── Page Header & Responsibilities ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 8,
        borderBottom: '1px solid var(--border-default)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Pending Approvals
            </h1>
            <span style={{
              fontSize: 10.5,
              fontWeight: 800,
              padding: '1px 8px',
              borderRadius: 10,
              backgroundColor: stats.totalPending > 0 ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface-sunken)',
              color: stats.totalPending > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: `1px solid ${stats.totalPending > 0 ? 'rgba(37, 99, 235, 0.25)' : 'var(--border-subtle)'}`
            }}>
              {stats.totalPending} Awaiting Decision
            </span>
            {stats.actionableByMe > 0 && (
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '1px 8px',
                borderRadius: 10,
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                color: 'var(--accent-teal, #0d9488)',
                border: '1px solid rgba(13, 148, 136, 0.25)'
              }}>
                {stats.actionableByMe} Assigned to Your Role
              </span>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
            Enterprise multi-stage sign-off and audit governance. Inspect field comparisons, review justifications, and execute decisions under separation-of-duties.
          </p>
        </div>

        {/* Global actions: Refresh & Approval Matrix */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
            Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>

          <button
            type="button"
            onClick={() => fetchData(false)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <a
            href="/roles/approval-rights"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--surface-sunken)',
              color: 'var(--text-secondary)',
              textDecoration: 'none'
            }}
            title="Configure role routing thresholds and multi-tier approval rules"
          >
            <SlidersHorizontal size={12} />
            Approval Matrix
          </a>
        </div>
      </div>

      {/* ── Compact Executive KPI Summary Cards ────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 8
      }}>
        {/* Card 1: Total Pending */}
        <div
          onClick={() => { setActiveTab('pending'); setActiveCardFilter(null); }}
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: `1px solid ${activeCardFilter === null && activeTab === 'pending' ? 'var(--accent-primary)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.14s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Pending
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {stats.totalPending} <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>open</span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Across 11 ERP modules</div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={14} />
          </div>
        </div>

        {/* Card 2: Actionable by Me */}
        <div
          onClick={() => handleCardFilterClick('assigned_to_me')}
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: `1px solid ${activeCardFilter === 'assigned_to_me' ? 'var(--accent-teal)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.14s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Actionable by Me
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-teal, #0d9488)', marginTop: 2 }}>
              {stats.actionableByMe} <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>for you</span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Role: {user?.role?.name || 'Approver'}</div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--accent-teal, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={14} />
          </div>
        </div>

        {/* Card 3: High Priority & Rush */}
        <div
          onClick={() => handleCardFilterClick('critical')}
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: `1px solid ${activeCardFilter === 'critical' ? 'var(--accent-danger)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.14s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              High Priority & Rush
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: stats.criticalPriority > 0 ? 'var(--accent-danger)' : 'var(--text-primary)', marginTop: 2 }}>
              {stats.criticalPriority} <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>expedites</span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Line-down / High value &gt; ₹2.5L</div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={14} />
          </div>
        </div>

        {/* Card 4: SLA Overdue */}
        <div
          onClick={() => handleCardFilterClick('overdue')}
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: `1px solid ${activeCardFilter === 'overdue' ? 'var(--accent-warning)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.14s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              SLA Overdue (&gt;3d)
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: stats.overdueCount > 0 ? 'var(--accent-warning)' : 'var(--text-primary)', marginTop: 2 }}>
              {stats.overdueCount} <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>past 72h</span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>IATF compliance attention</div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={14} />
          </div>
        </div>

        {/* Card 5: Decisions History */}
        <div
          onClick={() => { setActiveTab('history'); setActiveCardFilter(null); }}
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: `1px solid ${activeTab === 'history' ? 'var(--accent-purple)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.14s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Audit History
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {stats.approvedCount + stats.rejectedCount} <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>decided</span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{stats.approvedCount} approved · {stats.rejectedCount} rejected</div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History size={14} />
          </div>
        </div>
      </div>

      {/* ── Main Split View Cockpit: Left Grids & Right Pending Action / Approval History ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.22fr) minmax(370px, 1fr)',
        gap: 12,
        flex: 1,
        minHeight: 0
      }}>
        {/* ══════════════════════════════════════════════════════════════════
            LEFT SIDE: GRIDS (Filter Toolbar + Table + 1–4 Pages Pagination)
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Filter Toolbar */}
          <div style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 10px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 200 }}>
              {/* Live Search */}
              <div style={{ position: 'relative', minWidth: 160, flex: '1 1 160px' }}>
                <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search Ref, PO, Requester…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px 4px 25px',
                    fontSize: 11,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--surface-sunken)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                {searchQuery && (
                  <X
                    size={11}
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)' }}
                  />
                )}
              </div>

              {/* Module Filter */}
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                style={{
                  padding: '4px 6px', fontSize: 10.5, borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-sunken)',
                  color: 'var(--text-primary)', cursor: 'pointer', maxWidth: 120
                }}
              >
                <option value="all">All Modules</option>
                <option value="PurchaseOrder">PO</option>
                <option value="SalesOrder">SO</option>
                <option value="WorkOrder">WO</option>
                <option value="QualityNonConformance">NCR</option>
                <option value="ScrapManagement">Scrap</option>
                <option value="EngineeringChange">ECR</option>
                <option value="MasterVendor">Vendor</option>
                <option value="MasterCustomer">Customer</option>
                <option value="MasterProduct">Product</option>
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                style={{
                  padding: '4px 6px', fontSize: 10.5, borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-sunken)',
                  color: 'var(--text-primary)', cursor: 'pointer', maxWidth: 105
                }}
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical / Rush</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="overdue">Overdue</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)',
                    background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: '2px 4px'
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Scope selector */}
            {user?.role?.name === 'Super Admin' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: 'var(--surface-sunken)', padding: 2, borderRadius: 5 }}>
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  style={{
                    padding: '2px 6px', fontSize: 10, fontWeight: 700, borderRadius: 3,
                    border: 'none', cursor: 'pointer',
                    backgroundColor: scopeFilter === 'all' ? 'var(--surface-raised)' : 'transparent',
                    color: scopeFilter === 'all' ? 'var(--accent-primary-text)' : 'var(--text-muted)'
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('assigned_to_me')}
                  style={{
                    padding: '2px 6px', fontSize: 10, fontWeight: 700, borderRadius: 3,
                    border: 'none', cursor: 'pointer',
                    backgroundColor: scopeFilter === 'assigned_to_me' ? 'var(--surface-raised)' : 'transparent',
                    color: scopeFilter === 'assigned_to_me' ? 'var(--accent-primary-text)' : 'var(--text-muted)'
                  }}
                >
                  For Me
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div style={{
            flex: 1,
            minHeight: 0,
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {loading ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--accent-primary)' }} />
                <div style={{ fontSize: 12, fontWeight: 700 }}>Querying approvals queue…</div>
              </div>
            ) : displayedRows.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={24} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {hasActiveFilters ? 'No matches found' : 'All Clear — No Approvals Pending'}
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    style={{
                      marginTop: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 4,
                      backgroundColor: 'var(--accent-primary)', color: '#ffffff', border: 'none', cursor: 'pointer'
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'hidden', flex: 1 }}>
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: 11 }}>
                  <thead>
                    <tr style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderBottom: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase'
                    }}>
                      <th style={{ padding: '6px 6px', width: 28, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.size > 0 && selectedIds.size === pendingList.filter(i => i.canAction && !i.isSelfRequest).length}
                          onChange={toggleSelectAll}
                          style={{ cursor: 'pointer' }}
                          title="Select all actionable rows"
                        />
                      </th>
                      <th style={{ padding: '6px 8px', width: 115 }}>Document Ref</th>
                      <th style={{ padding: '6px 8px', width: 125 }}>Module</th>
                      <th style={{ padding: '6px 8px', width: 110 }}>Requester</th>
                      <th style={{ padding: '6px 6px', width: 68 }}>Priority</th>
                      <th style={{ padding: '6px 6px', width: 75 }}>Status</th>
                      <th style={{ padding: '6px 6px', width: 45, textAlign: 'right' }}>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.map((row) => {
                      const domain = RECORD_DOMAIN[row.module] || { name: 'General', icon: FileText, color: 'var(--text-muted)' };
                      const DomainIcon = domain.icon;
                      const priorityStyle = PRIORITY_BADGES[row.priority] || PRIORITY_BADGES.Normal;
                      const isSelected = selectedIds.has(row._id);
                      const isActiveRow = selectedApproval?._id === row._id;

                      return (
                        <tr
                          key={row._id}
                          onClick={() => {
                            setSelectedApproval(row);
                            setRightPanelTab('pending');
                          }}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: isActiveRow ? 'rgba(37, 99, 235, 0.09)' : isSelected ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                            borderLeft: isActiveRow ? '3px solid var(--accent-primary)' : '3px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.12s ease',
                            height: 40
                          }}
                          onMouseOver={(e) => { if (!isActiveRow && !isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-sunken)'; }}
                          onMouseOut={(e) => { if (!isActiveRow && !isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: '6px 6px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!row.canAction || row.isSelfRequest}
                              onChange={(e) => toggleSelectRow(row._id, e)}
                              style={{ cursor: row.canAction && !row.isSelfRequest ? 'pointer' : 'not-allowed' }}
                            />
                          </td>

                          {/* Document Ref */}
                          <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 11.5, fontWeight: isActiveRow ? 800 : 700, color: isActiveRow ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                {row.documentReference}
                              </span>
                              <span style={{ fontSize: 8.5, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                #{String(row._id).slice(-5).toUpperCase()}
                              </span>
                            </div>
                          </td>

                          {/* Module */}
                          <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                              <div style={{
                                width: 18, height: 18, borderRadius: 4,
                                backgroundColor: `color-mix(in srgb, ${domain.color} 14%, transparent)`,
                                color: domain.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                              }}>
                                <DomainIcon size={10} />
                              </div>
                              <span
                                title={RECORD_LABEL[row.module] || row.module}
                                style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                              >
                                {RECORD_LABEL[row.module] || row.module}
                              </span>
                            </div>
                          </td>

                          {/* Requester */}
                          <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {row.requestedBy ? `${row.requestedBy.firstName} ${row.requestedBy.lastName}` : 'System Seeder'}
                              </span>
                              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                                {new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </td>

                          {/* Priority */}
                          <td style={{ padding: '6px 6px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontSize: 9,
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: 3,
                              backgroundColor: priorityStyle.bg,
                              color: priorityStyle.fg,
                              border: `1px solid ${priorityStyle.border}`
                            }}>
                              {priorityStyle.label}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '6px 6px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 9.5,
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: 8,
                              backgroundColor:
                                row.status === 'Approved' ? 'rgba(16, 185, 129, 0.12)' :
                                row.status === 'Rejected' ? 'rgba(239, 68, 68, 0.12)' :
                                'rgba(245, 158, 11, 0.12)',
                              color:
                                row.status === 'Approved' ? '#059669' :
                                row.status === 'Rejected' ? '#dc2626' :
                                '#d97706',
                              border: `1px solid ${
                                row.status === 'Approved' ? 'rgba(16, 185, 129, 0.28)' :
                                row.status === 'Rejected' ? 'rgba(239, 68, 68, 0.28)' :
                                'rgba(245, 158, 11, 0.28)'
                              }`
                            }}>
                              <span style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                backgroundColor:
                                  row.status === 'Approved' ? '#10b981' :
                                  row.status === 'Rejected' ? '#ef4444' :
                                  '#f59e0b',
                                boxShadow:
                                  row.status === 'Approved' ? '0 0 3px #10b981' :
                                  row.status === 'Rejected' ? '0 0 3px #ef4444' :
                                  '0 0 4px rgba(245, 158, 11, 0.8)'
                              }} />
                              {row.status}
                            </span>
                          </td>

                          {/* Review Arrow */}
                          <td style={{ padding: '6px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApproval(row);
                                setRightPanelTab('pending');
                              }}
                              style={{
                                width: 22, height: 22,
                                borderRadius: 4,
                                border: '1px solid var(--border-default)',
                                backgroundColor: isActiveRow ? 'var(--accent-primary)' : 'var(--surface-sunken)',
                                color: isActiveRow ? '#ffffff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Inspect in right-hand panel"
                            >
                              <Eye size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Grid Pagination Footer (1-4 Pages & 12 Records) ──── */}
            <div style={{
              padding: '6px 10px',
              backgroundColor: 'var(--surface-sunken)',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6,
              fontSize: 10.5,
              color: 'var(--text-secondary)'
            }}>
              {/* Left: Total Records & Range */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '1px 6px',
                  borderRadius: 10,
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border-default)',
                  fontWeight: 800,
                  fontSize: 10,
                  color: 'var(--text-primary)'
                }}>
                  <Boxes size={10} color="var(--accent-primary)" />
                  {totalFilteredCount} Records
                </span>

                <span>
                  <strong>{totalFilteredCount > 0 ? startIndex + 1 : 0}–{endIndex}</strong> of <strong>{totalFilteredCount}</strong>
                </span>

                <span style={{
                  padding: '1px 5px',
                  borderRadius: 3,
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  color: 'var(--accent-primary)',
                  fontWeight: 800,
                  fontSize: 10
                }}>
                  Pg {safePage}/{totalPages}
                </span>
              </div>

              {/* Right: 1-4 Pages Numbered Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '1px 4px',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 3,
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--surface-raised)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <option value={3}>3 / page (4 pgs)</option>
                  <option value={4}>4 / page (3 pgs)</option>
                  <option value={6}>6 / page (2 pgs)</option>
                  <option value={12}>12 / page (All)</option>
                </select>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      style={{
                        padding: '1px 5px', height: 22, fontSize: 10, fontWeight: 700, borderRadius: 3,
                        border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-raised)',
                        color: safePage > 1 ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: safePage > 1 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center'
                      }}
                      title="Previous"
                    >
                      <ChevronLeft size={11} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          minWidth: 20, height: 22, padding: '0 4px', fontSize: 10.5,
                          fontWeight: pageNum === safePage ? 800 : 600,
                          borderRadius: 3,
                          border: pageNum === safePage ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                          backgroundColor: pageNum === safePage ? 'var(--accent-primary)' : 'var(--surface-raised)',
                          color: pageNum === safePage ? '#ffffff' : 'var(--text-primary)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      style={{
                        padding: '1px 5px', height: 22, fontSize: 10, fontWeight: 700, borderRadius: 3,
                        border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-raised)',
                        color: safePage < totalPages ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: safePage < totalPages ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center'
                      }}
                      title="Next"
                    >
                      <ChevronRight size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            RIGHT SIDE: PENDING ACTION & APPROVAL HISTORY PANELS
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: 'var(--surface-raised)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Header with Segmented Tabs: [Pending Action] [Approval History] + Split Mode Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            backgroundColor: 'var(--surface-sunken)',
            borderBottom: '1px solid var(--border-default)',
            gap: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button
                type="button"
                onClick={() => setRightPanelTab('pending')}
                style={{
                  padding: '4px 9px',
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: 4,
                  border: rightPanelTab === 'pending' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  backgroundColor: rightPanelTab === 'pending' ? 'var(--surface-raised)' : 'transparent',
                  color: rightPanelTab === 'pending' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: rightPanelTab === 'pending' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <Clock size={11} />
                Pending Action ({pendingList.length})
              </button>

              <button
                type="button"
                onClick={() => setRightPanelTab('history')}
                style={{
                  padding: '4px 9px',
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: 4,
                  border: rightPanelTab === 'history' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  backgroundColor: rightPanelTab === 'history' ? 'var(--surface-raised)' : 'transparent',
                  color: rightPanelTab === 'history' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: rightPanelTab === 'history' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <History size={11} />
                Approval History ({historyList.length})
              </button>
            </div>

            {/* Split View Toggle */}
            <button
              type="button"
              onClick={() => setRightPanelMode(m => m === 'tabs' ? 'split' : 'tabs')}
              title={rightPanelMode === 'tabs' ? 'Show Both (Split View)' : 'Show Tabs View'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 7px',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 4,
                border: '1px solid var(--border-default)',
                backgroundColor: rightPanelMode === 'split' ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface-raised)',
                color: rightPanelMode === 'split' ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <SlidersHorizontal size={10} />
              {rightPanelMode === 'split' ? 'Both Active' : 'Tabs View'}
            </button>
          </div>

          {/* Right Panel Body: Either Tabbed or Split */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* 1. Pending Action Panel */}
            {(rightPanelMode === 'split' || rightPanelTab === 'pending') && (
              <div style={{
                flex: rightPanelMode === 'split' ? '0 0 auto' : 1,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                borderBottom: rightPanelMode === 'split' ? '2px solid var(--border-default)' : 'none'
              }}>
                {selectedApproval ? (
                  <>
                    {/* Header Strip */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                            {selectedApproval.documentReference}
                          </span>
                          <span style={{
                            fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 3,
                            backgroundColor: (ACTION_CONFIG[selectedApproval.action] || ACTION_CONFIG.create).bg,
                            color: (ACTION_CONFIG[selectedApproval.action] || ACTION_CONFIG.create).fg,
                            border: `1px solid ${(ACTION_CONFIG[selectedApproval.action] || ACTION_CONFIG.create).border}`
                          }}>
                            {(ACTION_CONFIG[selectedApproval.action] || ACTION_CONFIG.create).tag}
                          </span>
                          <span style={{
                            fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 3,
                            backgroundColor: (PRIORITY_BADGES[selectedApproval.priority] || PRIORITY_BADGES.Normal).bg,
                            color: (PRIORITY_BADGES[selectedApproval.priority] || PRIORITY_BADGES.Normal).fg,
                            border: `1px solid ${(PRIORITY_BADGES[selectedApproval.priority] || PRIORITY_BADGES.Normal).border}`
                          }}>
                            {(PRIORITY_BADGES[selectedApproval.priority] || PRIORITY_BADGES.Normal).label}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {RECORD_LABEL[selectedApproval.module] || selectedApproval.module} · Domain: {(RECORD_DOMAIN[selectedApproval.module] || {}).name || 'Operations'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenDetail(selectedApproval)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', fontSize: 10.5, fontWeight: 700,
                          borderRadius: 4, border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-sunken)',
                          color: 'var(--text-primary)', cursor: 'pointer'
                        }}
                        title="Open Full Field-by-Field Diff Comparison"
                      >
                        <Eye size={11} /> Deep Diff
                      </button>
                    </div>

                    {/* Metadata & Governance Card */}
                    <div style={{
                      backgroundColor: 'var(--surface-sunken)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 8,
                      fontSize: 10.5
                    }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase' }}>Requested By</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                          {selectedApproval.requestedBy ? `${selectedApproval.requestedBy.firstName} ${selectedApproval.requestedBy.lastName}` : 'System'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>
                          {new Date(selectedApproval.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase' }}>Workflow Tier</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                          Tier {selectedApproval.currentLevel} of {selectedApproval.requiredLevels?.length || 1}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>
                          Role: {selectedApproval.requiredLevels?.find(l => l.level === selectedApproval.currentLevel)?.roleId?.name || 'Super Admin'}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase' }}>Governance</div>
                        <div style={{ fontWeight: 700, color: selectedApproval.canAction && !selectedApproval.isSelfRequest ? 'var(--accent-teal, #0d9488)' : 'var(--text-muted)', marginTop: 2 }}>
                          {selectedApproval.isSelfRequest ? 'Self-Request (No Sign-off)' : selectedApproval.canAction ? 'Ready for Your Decision' : 'View Only'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>
                          {selectedApproval.isOverdue ? 'Overdue > 72h SLA' : 'Compliant with SLA'}
                        </div>
                      </div>
                    </div>

                    {/* Key Details / Payload Breakdown */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                        Payload Summary & Key Highlights
                      </div>
                      <div style={{
                        backgroundColor: 'var(--surface-sunken)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 10px',
                        fontSize: 11,
                        color: 'var(--text-primary)',
                        maxHeight: 110,
                        overflowY: 'auto'
                      }}>
                        {selectedApproval.payload && Object.keys(selectedApproval.payload).length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {Object.entries(selectedApproval.payload)
                              .filter(([k]) => !k.startsWith('_') && k !== 'companyId')
                              .slice(0, 8)
                              .map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                    {k.replace(/([A-Z])/g, ' $1')}:
                                  </span>
                                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No additional payload attributes provided</span>
                        )}
                      </div>
                    </div>

                    {/* Fast Inline Execution Cockpit */}
                    <div style={{
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                          Execute Sign-off / Rejection
                        </span>
                        <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                          {selectedApproval.canAction && !selectedApproval.isSelfRequest ? 'Actionable under your role' : 'Review only'}
                        </span>
                      </div>

                      {selectedApproval.canAction && !selectedApproval.isSelfRequest ? (
                        <>
                          <textarea
                            rows={2}
                            placeholder="Add approval comment or enter mandatory rejection reason…"
                            value={inlineComments}
                            onChange={(e) => setInlineComments(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              fontSize: 11,
                              borderRadius: 4,
                              border: '1px solid var(--border-default)',
                              backgroundColor: 'var(--surface-sunken)',
                              color: 'var(--text-primary)',
                              resize: 'none',
                              outline: 'none'
                            }}
                          />

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={handleInlineApprove}
                              disabled={inlineActing}
                              style={{
                                flex: 1,
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                borderRadius: 4,
                                backgroundColor: 'var(--accent-teal, #0d9488)',
                                color: '#ffffff',
                                border: 'none',
                                cursor: inlineActing ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                boxShadow: 'var(--shadow-sm)'
                              }}
                            >
                              <Check size={12} strokeWidth={2.5} />
                              {inlineActing ? 'Processing…' : 'Approve Request'}
                            </button>

                            <button
                              type="button"
                              onClick={handleInlineReject}
                              disabled={inlineActing}
                              style={{
                                flex: 1,
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                borderRadius: 4,
                                backgroundColor: 'var(--accent-danger, #ef4444)',
                                color: '#ffffff',
                                border: 'none',
                                cursor: inlineActing ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                boxShadow: 'var(--shadow-sm)'
                              }}
                            >
                              <X size={12} strokeWidth={2.5} />
                              {inlineActing ? 'Processing…' : 'Reject with Reason'}
                            </button>
                          </div>
                        </>
                      ) : selectedApproval.isSelfRequest ? (
                        <div style={{
                          padding: '6px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 700,
                          backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.25)'
                        }}>
                          Separation of duties policy: You initiated this document and cannot approve your own request.
                        </div>
                      ) : (
                        <div style={{
                          padding: '6px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 700,
                          backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)'
                        }}>
                          Awaiting review and authorization from the designated role.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Eye size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <div style={{ fontSize: 12, fontWeight: 700 }}>No document selected</div>
                    <div style={{ fontSize: 10.5 }}>Click any approval row on the left grid to inspect and take action.</div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Approval History & Audit Trail Panel */}
            {(rightPanelMode === 'split' || rightPanelTab === 'history') && (
              <div style={{
                flex: 1,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minHeight: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ShieldCheck size={13} color="var(--accent-purple, #7c3aed)" />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Audit History Trail ({historyList.length})
                    </span>
                  </div>
                  <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                    Authoritative Decided Log
                  </span>
                </div>

                {historyList.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <History size={20} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                    <div style={{ fontSize: 11.5, fontWeight: 700 }}>No history records yet</div>
                    <div style={{ fontSize: 10 }}>Completed approvals and rejections will appear here with full audit trails.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1, maxHeight: rightPanelMode === 'split' ? 220 : 'none' }}>
                    {historyList.map((hist) => {
                      const isApproved = hist.status === 'Approved';
                      return (
                        <div
                          key={hist._id}
                          onClick={() => handleOpenDetail(hist)}
                          style={{
                            backgroundColor: 'var(--surface-sunken)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 10px',
                            cursor: 'pointer',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: 8,
                                backgroundColor: isApproved ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                                color: isApproved ? '#059669' : '#dc2626',
                                border: `1px solid ${isApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                              }}>
                                ● {hist.status}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>
                                {hist.documentReference}
                              </span>
                            </div>
                            <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                              {new Date(hist.updatedAt || hist.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 10 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              Decided by: <strong>{hist.decidedBy ? `${hist.decidedBy.firstName} ${hist.decidedBy.lastName}` : 'System Admin'}</strong>
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {RECORD_LABEL[hist.module] || hist.module}
                            </span>
                          </div>

                          {(hist.rejectionReason || hist.comments) && (
                            <div style={{
                              marginTop: 4,
                              fontSize: 9.5,
                              color: isApproved ? 'var(--text-secondary)' : '#b91c1c',
                              backgroundColor: isApproved ? 'var(--surface-raised)' : '#fef2f2',
                              padding: '3px 6px',
                              borderRadius: 3,
                              fontStyle: 'italic',
                              borderLeft: `2px solid ${isApproved ? 'var(--accent-teal, #0d9488)' : 'var(--accent-danger, #ef4444)'}`
                            }}>
                              "{hist.rejectionReason || hist.comments}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detailed Approval Review & Side-by-Side Diff Modal ──────────────── */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={
          selectedApproval
            ? `${selectedApproval.documentReference} — ${RECORD_LABEL[selectedApproval.module] || selectedApproval.module}`
            : 'Approval Request Details'
        }
        maxWidth={840}
      >
        {selectedApproval && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Modal Header Summary Strip */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Request ID: {selectedApproval._id}
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 4,
                  backgroundColor: ACTION_CONFIG[selectedApproval.action]?.bg || 'var(--surface-sunken)',
                  color: ACTION_CONFIG[selectedApproval.action]?.fg || 'var(--text-primary)',
                  border: `1px solid ${ACTION_CONFIG[selectedApproval.action]?.border || 'var(--border-subtle)'}`
                }}>
                  {ACTION_CONFIG[selectedApproval.action]?.tag || selectedApproval.action}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 12,
                  backgroundColor:
                    selectedApproval.status === 'Approved' ? 'rgba(16, 185, 129, 0.12)' :
                    selectedApproval.status === 'Rejected' ? 'rgba(239, 68, 68, 0.12)' :
                    'rgba(245, 158, 11, 0.12)',
                  color:
                    selectedApproval.status === 'Approved' ? '#059669' :
                    selectedApproval.status === 'Rejected' ? '#dc2626' :
                    '#d97706'
                }}>
                  ● {selectedApproval.status}
                </span>
              </div>
            </div>

            {/* Requester & Justification Panel */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 10
            }}>
              {/* Requester Box */}
              <div style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--surface-raised)'
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Requester Profile
                </div>
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedApproval.requestedBy ? `${selectedApproval.requestedBy.firstName} ${selectedApproval.requestedBy.lastName}` : 'System Seeder'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {selectedApproval.requestedBy?.email || 'automated'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Submitted: {new Date(selectedApproval.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Justification Box */}
              <div style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--surface-raised)'
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Business Reason / Root Cause
                </div>
                <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--text-primary)', fontStyle: selectedApproval.justification ? 'normal' : 'italic' }}>
                  {selectedApproval.justification || 'No explicit justification string attached to payload.'}
                </div>
              </div>
            </div>

            {/* Field Comparison: Current DB Record vs Proposed Change */}
            <div style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--surface-raised)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '7px 10px',
                backgroundColor: 'var(--surface-sunken)',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Field-by-Field Change Comparison
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {selectedApproval.action === 'create' ? 'All fields represent new entity creation' : 'Comparing current database state with proposed updates'}
                </span>
              </div>

              {loadingDetail ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading field diffs…
                </div>
              ) : selectedApproval.fieldDiffs && selectedApproval.fieldDiffs.length > 0 ? (
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: 10 }}>
                        <th style={{ padding: '5px 8px', width: '25%' }}>Attribute</th>
                        {selectedApproval.action === 'update' && (
                          <th style={{ padding: '5px 8px', width: '35%' }}>Current Persisted Value</th>
                        )}
                        <th style={{ padding: '5px 8px', width: selectedApproval.action === 'update' ? '40%' : '75%' }}>Proposed Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedApproval.fieldDiffs.map((diff, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: diff.isChanged ? 'rgba(37, 99, 235, 0.03)' : 'transparent' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {diff.label}
                          </td>
                          {selectedApproval.action === 'update' && (
                            <td style={{ padding: '5px 8px', color: 'var(--text-secondary)' }}>
                              {diff.oldValue != null ? String(diff.oldValue) : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>}
                            </td>
                          )}
                          <td style={{ padding: '5px 8px', color: diff.isChanged ? 'var(--accent-primary-text)' : 'var(--text-primary)', fontWeight: diff.isChanged ? 700 : 400 }}>
                            {diff.newValue != null ? (typeof diff.newValue === 'object' ? JSON.stringify(diff.newValue) : String(diff.newValue)) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                  {JSON.stringify(selectedApproval.payload, null, 2)}
                </div>
              )}
            </div>

            {/* Multi-Stage Workflow History */}
            <div style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--surface-raised)',
              padding: '8px 10px'
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                Multi-Stage Approval Hierarchy & Sign-off History
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(selectedApproval.requiredLevels || []).map((step, idx) => {
                  const roleName = step.roleId?.name || (step.roleId && typeof step.roleId === 'object' ? step.roleId.name : 'Super Admin');
                  const isCurrent = step.level === selectedApproval.currentLevel && selectedApproval.status === 'Pending';

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        borderRadius: 4,
                        backgroundColor: isCurrent ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface-sunken)',
                        border: isCurrent ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%',
                          backgroundColor: step.status === 'Approved' ? 'var(--accent-teal, #0d9488)' : step.status === 'Rejected' ? 'var(--accent-danger)' : 'var(--border-default)',
                          color: '#fff', fontSize: 9.5, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {step.level}
                        </span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                            Stage {step.level}: {roleName}
                          </div>
                          {step.comments && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              Notes: &ldquo;{step.comments}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 3,
                          backgroundColor: step.status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : step.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-raised)',
                          color: step.status === 'Approved' ? '#059669' : step.status === 'Rejected' ? '#dc2626' : 'var(--text-muted)'
                        }}>
                          {step.status}
                        </span>
                        {step.actionedAt && (
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                            {new Date(step.actionedAt).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 8,
              borderTop: '1px solid var(--border-default)',
              marginTop: 2
            }}>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                style={{
                  padding: '5px 12px', fontSize: 11.5, fontWeight: 600, borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', cursor: 'pointer'
                }}
              >
                Close
              </button>

              {selectedApproval.status === 'Pending' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {selectedApproval.isSelfRequest ? (
                    <span style={{ fontSize: 11, color: 'var(--accent-warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldAlert size={13} /> Separation of duties: Self-approval is disabled
                    </span>
                  ) : selectedApproval.canAction ? (
                    <>
                      <button
                        type="button"
                        onClick={() => promptReject(selectedApproval)}
                        style={{
                          padding: '5px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-danger)', cursor: 'pointer'
                        }}
                      >
                        Reject Request
                      </button>

                      <button
                        type="button"
                        onClick={() => promptApprove(selectedApproval)}
                        style={{
                          padding: '5px 14px', fontSize: 11.5, fontWeight: 700, borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--accent-teal, #0d9488)', border: 'none', color: '#ffffff', cursor: 'pointer'
                        }}
                      >
                        Approve Request
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Assigned to another role
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Approve Confirmation Dialog ────────────────────────────────────── */}
      <Modal
        isOpen={approveDialogOpen}
        onClose={() => !approving && setApproveDialogOpen(false)}
        title="Confirm Approval Decision"
        maxWidth={460}
      >
        {approvalTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--accent-teal, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Approve {approvalTarget.documentReference}?
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                  The requested {ACTION_CONFIG[approvalTarget.action]?.label || approvalTarget.action} for{' '}
                  <strong>{RECORD_LABEL[approvalTarget.module] || approvalTarget.module}</strong> will be committed to the database and logged in audit history.
                </p>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
                Reviewer Sign-off Remarks (Optional):
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Approved per drawing tolerance verification and standard delegation threshold."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: 11.5,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--surface-sunken)',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, paddingTop: 4 }}>
              <button
                type="button"
                onClick={() => setApproveDialogOpen(false)}
                disabled={approving}
                style={{ padding: '5px 12px', fontSize: 11.5, borderRadius: 4, border: '1px solid var(--border-default)', background: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={approving}
                style={{
                  padding: '5px 14px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, border: 'none',
                  backgroundColor: 'var(--accent-teal, #0d9488)', color: '#ffffff', cursor: approving ? 'not-allowed' : 'pointer'
                }}
              >
                {approving ? 'Processing…' : 'Confirm & Grant Approval'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Reject Reason Mandatory Dialog ─────────────────────────────────── */}
      <Modal
        isOpen={rejectDialogOpen}
        onClose={() => !rejecting && setRejectDialogOpen(false)}
        title="Reject Approval Request"
        maxWidth={460}
      >
        {rejectTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={16} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Reject {rejectTarget.documentReference}?
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                  This request will be permanently rejected. In compliance with automotive manufacturing quality standards, an explicit justification is required.
                </p>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-danger)', display: 'block', marginBottom: 3 }}>
                Mandatory Rejection Reason: *
              </label>
              <textarea
                rows={3}
                required
                placeholder="State why this change is rejected (e.g. Budget limit exceeded, incorrect revision Rev-C, non-conforming scrap code)…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: 11.5,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent-danger)',
                  backgroundColor: 'var(--surface-sunken)',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                This statement is recorded in the permanent audit trail for traceability.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, paddingTop: 4 }}>
              <button
                type="button"
                onClick={() => setRejectDialogOpen(false)}
                disabled={rejecting}
                style={{ padding: '5px 12px', fontSize: 11.5, borderRadius: 4, border: '1px solid var(--border-default)', background: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting || !rejectionReason.trim()}
                style={{
                  padding: '5px 14px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, border: 'none',
                  backgroundColor: 'var(--accent-danger)', color: '#ffffff', cursor: rejecting || !rejectionReason.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {rejecting ? 'Rejecting…' : 'Submit Rejection'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Bulk Action Execution Modal ────────────────────────────────────── */}
      <Modal
        isOpen={!!bulkAction}
        onClose={() => !processingBulk && setBulkAction(null)}
        title={bulkAction === 'approve' ? `Bulk Approve ${selectedIds.size} Requests` : `Bulk Reject ${selectedIds.size} Requests`}
        maxWidth={460}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            You are about to <strong>{bulkAction}</strong> <strong>{selectedIds.size}</strong> selected approval requests.
            Each request will be individually verified against separation-of-duties and role authorization rules.
          </p>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
              {bulkAction === 'reject' ? 'Mandatory Batch Rejection Reason: *' : 'Batch Reviewer Remarks (Optional):'}
            </label>
            <textarea
              rows={3}
              placeholder={bulkAction === 'reject' ? 'Provide mandatory reason for batch rejection…' : 'e.g. Bulk approved after monthly review meeting.'}
              value={bulkComments}
              onChange={(e) => setBulkComments(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: 11.5,
                borderRadius: 'var(--radius-sm)',
                border: bulkAction === 'reject' ? '1px solid var(--accent-danger)' : '1px solid var(--border-default)',
                backgroundColor: 'var(--surface-sunken)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, paddingTop: 4 }}>
            <button
              type="button"
              onClick={() => setBulkAction(null)}
              disabled={processingBulk}
              style={{ padding: '5px 12px', fontSize: 11.5, borderRadius: 4, border: '1px solid var(--border-default)', background: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteBulk}
              disabled={processingBulk || (bulkAction === 'reject' && !bulkComments.trim())}
              style={{
                padding: '5px 14px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, border: 'none',
                backgroundColor: bulkAction === 'approve' ? 'var(--accent-teal, #0d9488)' : 'var(--accent-danger)',
                color: '#ffffff', cursor: processingBulk || (bulkAction === 'reject' && !bulkComments.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {processingBulk ? 'Executing…' : `Confirm Bulk ${bulkAction === 'approve' ? 'Approve' : 'Reject'}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApprovalCenter;
