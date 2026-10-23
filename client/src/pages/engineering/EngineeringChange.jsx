import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  GitPullRequest, Plus, ChevronRight, Trash2, CheckCircle, XCircle,
  Package, BarChart2, UserCheck, AlertTriangle, Lock, ShieldCheck,
  FileText, Clock, RefreshCw, Layers
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';
import ECRCommandBar from './change/ECRCommandBar';
import ECRDossierList from './change/ECRDossierList';
import ECRFlightDeck from './change/ECRFlightDeck';
import ECRApprovalRunway from './change/ECRApprovalRunway';
import ECRAffectedAssets from './change/ECRAffectedAssets';
import ECRImpactRadar from './change/ECRImpactRadar';
import ECROfficialTraveler from './change/ECROfficialTraveler';

const EngineeringChange = () => {
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  // ── Reference Master Data ─────────────────────────────────────────────────
  const [boms, setBoms] = useState([]);
  const [routings, setRoutings] = useState([]);
  const [products, setProducts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  // ── ECR Header Data ───────────────────────────────────────────────────────
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Search & Filter State ─────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [changeTypeFilter, setChangeTypeFilter] = useState('All');

  // ── Selected ECR & Child Data ─────────────────────────────────────────────
  const [selectedECR, setSelectedECR] = useState(null);
  const [affectedItems, setAffectedItems] = useState([]);
  const [impact, setImpact] = useState(null);
  const [approvals, setApprovals] = useState([]);

  // ── Active Workbench Tab inside Selected ECR ──────────────────────────────
  const [activeTab, setActiveTab] = useState('runway'); // 'runway' | 'assets' | 'impact' | 'traveler'

  // ── Modals: 'header' | 'affected' | 'approval' ───────────────────────────
  const [modal, setModal] = useState({
    type: null,
    data: null,
    editId: null
  });

  // ── Impact Form State ─────────────────────────────────────────────────────
  const [impactForm, setImpactForm] = useState({});
  const [impactSaving, setImpactSaving] = useState(false);

  // ── Load References ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [b, r, p, ro, u] = await Promise.all([
          axios.get('/engineering/bom').catch(() => ({ data: { data: [] } })),
          axios.get('/engineering/routing').catch(() => ({ data: { data: [] } })),
          axios.get('/master/product').catch(() => ({ data: { data: [] } })),
          axios.get('/roles/directory').catch(() => ({ data: { data: [] } })),
          axios.get('/users/directory').catch(() => ({ data: { data: [] } }))
        ]);
        setBoms(b.data.data || []);
        setRoutings(r.data.data || []);
        setProducts(p.data.data || []);
        setRoles(ro.data.data || []);
        setUsers(u.data.data || []);
      } catch (e) {
        console.error('Refs error', e);
      }
    })();
    fetchHeaders();
  }, []);

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchHeaders = async (autoSelectId = null) => {
    setLoading(true);
    try {
      const res = await axios.get('/engineering/ecm');
      const data = res.data.data || [];
      setHeaders(data);

      if (autoSelectId) {
        const target = data.find(h => h._id === autoSelectId);
        if (target) selectECR(target);
      } else if (!selectedECR && data.length > 0) {
        selectECR(data[0]);
      } else if (selectedECR) {
        const refreshed = data.find(h => h._id === selectedECR._id);
        if (refreshed) setSelectedECR(refreshed);
      }
    } catch (e) {
      console.error(e);
      notify.error('Failed to load engineering change requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchAffectedItems = useCallback(async ecrId => {
    try {
      const res = await axios.get(`/engineering/ecm/${ecrId}/affected-items`);
      setAffectedItems(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchImpact = useCallback(async ecrId => {
    try {
      const res = await axios.get(`/engineering/ecm/${ecrId}/impact`);
      const d = res.data.data || {};
      setImpact(d);
      setImpactForm({
        productImpactNotes: d.productImpactNotes || '',
        bomImpactNotes: d.bomImpactNotes || '',
        routingImpactNotes: d.routingImpactNotes || '',
        costImpactEstimated: d.costImpactEstimated || 0,
        inventoryDisposition: d.inventoryDisposition || 'Use Existing'
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchApprovals = useCallback(async ecrId => {
    try {
      const res = await axios.get(`/engineering/ecm/${ecrId}/approvals`);
      setApprovals(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ── Select ECR ────────────────────────────────────────────────────────────
  const selectECR = row => {
    setSelectedECR(row);
    fetchAffectedItems(row._id);
    fetchImpact(row._id);
    fetchApprovals(row._id);
  };

  // ── Filtered Headers List ─────────────────────────────────────────────────
  const filteredHeaders = useMemo(() => {
    return headers.filter(h => {
      // Search
      const term = (searchTerm || '').toLowerCase();
      const matchSearch = !term ||
        (h.ecrNumber || '').toLowerCase().includes(term) ||
        (h.title || '').toLowerCase().includes(term) ||
        (h.reasonForChange || '').toLowerCase().includes(term);

      // Status
      const matchStatus = statusFilter === 'All' || h.status === statusFilter;

      // Priority
      const matchPriority = priorityFilter === 'All' || h.priority === priorityFilter;

      // Change Type
      const matchType = changeTypeFilter === 'All' || h.changeType === changeTypeFilter;

      return matchSearch && matchStatus && matchPriority && matchType;
    });
  }, [headers, searchTerm, statusFilter, priorityFilter, changeTypeFilter]);

  // ── Save Generic ──────────────────────────────────────────────────────────
  const handleSave = async e => {
    e.preventDefault();
    const { type, data, editId } = modal;
    try {
      if (type === 'header') {
        let savedId = editId;
        if (editId) {
          await axios.put(`/engineering/ecm/${editId}`, data);
        } else {
          const res = await axios.post('/engineering/ecm', data);
          savedId = res.data.data?._id;
        }
        fetchHeaders(savedId);
        notify.success('Change request saved.');
      } else if (type === 'affected') {
        const payload = { ...data, ecrId: selectedECR._id };
        if (editId) {
          await axios.put(`/engineering/affected-items/${editId}`, payload);
        } else {
          await axios.post(`/engineering/ecm/${selectedECR._id}/affected-items`, payload);
        }
        fetchAffectedItems(selectedECR._id);
        notify.success('Affected part saved.');
      } else if (type === 'approval') {
        const payload = { ...data, ecrId: selectedECR._id };
        if (editId) {
          await axios.put(`/engineering/ecm-approvals/${editId}`, payload);
        } else {
          await axios.post(`/engineering/ecm/${selectedECR._id}/approvals`, payload);
        }
        fetchApprovals(selectedECR._id);
        notify.success('Approval gate saved.');
      }

      setModal({ type: null, data: null, editId: null });
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Error saving record');
    }
  };

  // ── Delete Generic ────────────────────────────────────────────────────────
  const handleDelete = async (type, id) => {
    if (!await confirmAction('Delete this item permanently?')) return;
    try {
      if (type === 'affected') {
        await axios.delete(`/engineering/affected-items/${id}`);
        fetchAffectedItems(selectedECR._id);
        notify.success('Affected item removed.');
      }
      if (type === 'approval') {
        await axios.delete(`/engineering/ecm-approvals/${id}`);
        fetchApprovals(selectedECR._id);
        notify.success('Approval gate removed.');
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error deleting');
    }
  };

  // ── Status Change with IATF 16949 Lock Protection ─────────────────────────
  const changeStatus = async (id, status) => {
    try {
      setBusy(true);
      await axios.put(`/engineering/ecm/${id}/status`, { status });
      fetchHeaders(id);
      fetchAffectedItems(id);
      notify.success(`Status updated to ${status}`);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error changing status');
    } finally {
      setBusy(false);
    }
  };

  // ── Approval Step Sign-Off ────────────────────────────────────────────────
  const signApproval = async (approvalId, newStatus) => {
    try {
      setBusy(true);
      await axios.put(`/engineering/ecm-approvals/${approvalId}`, {
        approvalStatus: newStatus
      });
      fetchApprovals(selectedECR._id);
      notify.success(`Approval gate marked as ${newStatus}`);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating approval');
    } finally {
      setBusy(false);
    }
  };

  // ── Save Impact Analysis ──────────────────────────────────────────────────
  const saveImpact = async () => {
    setImpactSaving(true);
    try {
      await axios.put(`/engineering/ecm/${selectedECR._id}/impact`, impactForm);
      fetchImpact(selectedECR._id);
      notify.success('Impact analysis saved successfully.');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving impact');
    } finally {
      setImpactSaving(false);
    }
  };

  // ── Modal Helpers ─────────────────────────────────────────────────────────
  const openModal = (type, prefill = {}, editId = null) => setModal({
    type,
    data: { ...prefill },
    editId
  });

  const updateField = (field, value) => setModal(m => ({
    ...m,
    data: { ...m.data, [field]: value }
  }));

  const newECRNumber = () => 'ECR-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // ── Approval Calculations ─────────────────────────────────────────────────
  const approvedCount = approvals.filter(a => a.approvalStatus === 'Approved').length;
  const allApproved = approvals.length > 0 && approvedCount === approvals.length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      minHeight: '100%',
      paddingBottom: 24
    }}>
      {/* ── PRINT MEDIA STYLES ────────────────────────────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-eco, #printable-eco * {
            visibility: visible;
          }
          #printable-eco {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
        }
      `}</style>

      {/* ── 1. EXECUTIVE COMMAND BAR & TELEMETRY HUD ───────────────────────── */}
      <ECRCommandBar
        headers={headers}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        changeTypeFilter={changeTypeFilter}
        setChangeTypeFilter={setChangeTypeFilter}
        onOpenCreateModal={() => openModal('header', {
          ecrNumber: newECRNumber(),
          changeType: 'Design',
          priority: 'Medium',
          status: 'Draft',
          targetImplementationDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        })}
        loading={loading}
      />

      {/* ── 2. DUAL-PANEL ENGINEERING CHANGE BOARD (ECB) WORKBENCH ────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '360px minmax(0, 1fr)',
        gap: 14,
        alignItems: 'start'
      }}>
        {/* Left: ECR Dossier Cards List */}
        <ECRDossierList
          headers={filteredHeaders}
          selectedECR={selectedECR}
          onSelectECR={selectECR}
          onOpenEditModal={openModal}
          onChangeStatus={changeStatus}
          loading={loading}
        />

        {/* Right: ECR Flight Deck & Mission Control Tabs */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          {selectedECR ? (
            <>
              {/* ECR Flight Deck: Lifecycle Stepper & Quick Actions */}
              <ECRFlightDeck
                selectedECR={selectedECR}
                allApproved={allApproved}
                approvals={approvals}
                onChangeStatus={changeStatus}
                onOpenEditModal={openModal}
                busy={busy}
              />

              {/* Sub-workbench Segmented Tabs */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--surface-canvas)',
                padding: '0 12px',
                gap: 4,
                overflowX: 'auto',
                borderRadius: '8px 8px 0 0'
              }}>
                {[
                  { id: 'runway', label: 'IATF 16949 Sign-Off Runway', icon: UserCheck, count: approvals.length },
                  { id: 'assets', label: 'Affected Parts & BOMs', icon: Package, count: affectedItems.length },
                  { id: 'impact', label: '4-D Impact & Stock Disposition', icon: BarChart2 },
                  { id: 'traveler', label: 'Official ECO Release Bulletin', icon: FileText }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '10px 14px',
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 500,
                        borderBottom: isActive ? '2px solid #f59e0b' : '2px solid transparent',
                        color: isActive ? '#f59e0b' : 'var(--text-secondary)',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          borderRadius: 999,
                          background: isActive ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-primary)',
                          color: isActive ? '#f59e0b' : 'var(--text-secondary)',
                          fontWeight: 700
                        }}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Viewport */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                padding: '14px'
              }}>
                {activeTab === 'runway' && (
                  <ECRApprovalRunway
                    selectedECR={selectedECR}
                    approvals={approvals}
                    onOpenApprovalModal={openModal}
                    onSignApproval={signApproval}
                    onDeleteApproval={id => handleDelete('approval', id)}
                    busy={busy}
                  />
                )}

                {activeTab === 'assets' && (
                  <ECRAffectedAssets
                    selectedECR={selectedECR}
                    affectedItems={affectedItems}
                    onOpenAffectedModal={openModal}
                    onDeleteAffected={id => handleDelete('affected', id)}
                  />
                )}

                {activeTab === 'impact' && (
                  <ECRImpactRadar
                    selectedECR={selectedECR}
                    impactForm={impactForm}
                    setImpactForm={setImpactForm}
                    onSaveImpact={saveImpact}
                    saving={impactSaving}
                  />
                )}

                {activeTab === 'traveler' && (
                  <ECROfficialTraveler
                    selectedECR={selectedECR}
                    affectedItems={affectedItems}
                    impactForm={impactForm}
                    approvals={approvals}
                  />
                )}
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 340,
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              border: '1px dashed var(--border-color)',
              color: 'var(--text-secondary)',
              padding: 32
            }}>
              <GitPullRequest size={36} style={{ opacity: 0.35, marginBottom: 12 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Select an Engineering Change Request
              </h3>
              <p style={{ fontSize: 12, margin: '4px 0 0', maxWidth: 400, textAlign: 'center' }}>
                Select any ECR from the left registry to review sign-off gates, affected BOMs, cost impact, and release the official ECO notice.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODALS: 100% COVERAGE FOR ALL 3 ECM ENTITIES                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* Modal 1: ECR Header Modal */}
      <Modal
        isOpen={modal.type === 'header'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Engineering Change Request' : 'Create Engineering Change Request (ECR)'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Change Request Number *</label>
              <input
                className="input-field"
                required
                readOnly
                value={modal.data?.ecrNumber || ''}
                onChange={e => updateField('ecrNumber', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Change Title *</label>
              <input
                className="input-field"
                required
                placeholder="e.g. Silencer Mounting Bracket — Gauge Increase"
                value={modal.data?.title || ''}
                onChange={e => updateField('title', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Change Classification *</label>
              <select
                className="input-field"
                required
                value={modal.data?.changeType || 'Design'}
                onChange={e => updateField('changeType', e.target.value)}
              >
                {['Design', 'Process', 'Material Replacement', 'Cost Reduction'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Priority Severity *</label>
              <select
                className="input-field"
                required
                value={modal.data?.priority || 'Medium'}
                onChange={e => updateField('priority', e.target.value)}
              >
                {['Low', 'Medium', 'High', 'Urgent/Line-Down'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Target Cutover Date</label>
              <input
                type="date"
                className="input-field"
                value={modal.data?.targetImplementationDate ? modal.data.targetImplementationDate.split('T')[0] : ''}
                onChange={e => updateField('targetImplementationDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Initial Status</label>
              <select
                className="input-field"
                value={modal.data?.status || 'Draft'}
                onChange={e => updateField('status', e.target.value)}
              >
                {['Draft', 'Submitted', 'In Review'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Root Cause / Engineering Justification *</label>
              <textarea
                className="input-field"
                rows={3}
                required
                placeholder="Explain why this change is necessary (customer request, warranty claim, line stoppage, cost optimization)..."
                value={modal.data?.reasonForChange || ''}
                onChange={e => updateField('reasonForChange', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModal({ type: null, data: null, editId: null })}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : (modal.editId ? 'Update Change Request' : 'Create Change Request')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Affected Item Modal */}
      <Modal
        isOpen={modal.type === 'affected'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Affected Asset' : 'Add Affected Item (BOM / Routing / Product)'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Target Asset Type *</label>
              <select
                className="input-field"
                required
                value={modal.data?.itemType || 'BOM'}
                onChange={e => updateField('itemType', e.target.value)}
              >
                {['BOM', 'Routing', 'Product Master', 'Document'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {(modal.data?.itemType === 'BOM' || !modal.data?.itemType) && (
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Select Parts List (BOM) *</label>
                <select
                  className="input-field"
                  required
                  value={modal.data?.bomId || ''}
                  onChange={e => updateField('bomId', e.target.value)}
                >
                  <option value="" disabled>Choose a BOM</option>
                  {boms.map(b => (
                    <option key={b._id} value={b._id}>{b.bomCode} — {b.bomName}</option>
                  ))}
                </select>
              </div>
            )}

            {modal.data?.itemType === 'Routing' && (
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Select Process Sheet (Routing) *</label>
                <select
                  className="input-field"
                  required
                  value={modal.data?.routingId || ''}
                  onChange={e => updateField('routingId', e.target.value)}
                >
                  <option value="" disabled>Choose a Routing</option>
                  {routings.map(r => (
                    <option key={r._id} value={r._id}>{r.routingCode || r.routingNumber} — {r.routingName}</option>
                  ))}
                </select>
              </div>
            )}

            {modal.data?.itemType === 'Product Master' && (
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Select Finished Product *</label>
                <select
                  className="input-field"
                  required
                  value={modal.data?.productId || ''}
                  onChange={e => updateField('productId', e.target.value)}
                >
                  <option value="" disabled>Choose a Product</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Current Revision Code</label>
              <input
                className="input-field"
                placeholder="e.g. v1.0"
                value={modal.data?.currentRevisionCode || ''}
                onChange={e => updateField('currentRevisionCode', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModal({ type: null, data: null, editId: null })}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : (modal.editId ? 'Update Affected Part' : 'Attach Affected Part')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Approval Step Modal */}
      <Modal
        isOpen={modal.type === 'approval'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Approval Gate' : 'Add IATF 16949 Approval Gate'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Approval Gate Step Number *</label>
              <input
                type="number"
                className="input-field"
                required
                min="1"
                value={modal.data?.approvalStep || 1}
                onChange={e => updateField('approvalStep', parseInt(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Required Role *</label>
              <select
                className="input-field"
                required
                value={modal.data?.requiredRole || ''}
                onChange={e => updateField('requiredRole', e.target.value)}
              >
                <option value="" disabled>Choose an authorized role</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Assigned Approver</label>
              <select
                className="input-field"
                value={modal.data?.assignedUserId || ''}
                onChange={e => updateField('assignedUserId', e.target.value)}
              >
                <option value="">Any Engineer with this Role</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Gate Status</label>
              <select
                className="input-field"
                value={modal.data?.approvalStatus || 'Pending'}
                onChange={e => updateField('approvalStatus', e.target.value)}
              >
                {['Pending', 'Approved', 'Rejected'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Review Comments / Conditions</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="Technical comments, inspection findings, or sign-off prerequisites..."
                value={modal.data?.comments || ''}
                onChange={e => updateField('comments', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModal({ type: null, data: null, editId: null })}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : (modal.editId ? 'Update Gate' : 'Add Gate')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EngineeringChange;