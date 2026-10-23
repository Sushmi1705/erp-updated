import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  FileText, Plus, Search, Package, Link2, Wrench,
  MessageSquare, Lock, AlertTriangle, Printer, Layers,
  ChevronRight, RefreshCw, XCircle
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

// Subcomponents
import { InquiryCommandBar } from './inquiry/InquiryCommandBar';
import { InquiryDossierList } from './inquiry/InquiryDossierList';
import { InquiryFlightDeck } from './inquiry/InquiryFlightDeck';
import { InquiryLineItemsTab } from './inquiry/InquiryLineItemsTab';
import { InquiryCrossRefTab } from './inquiry/InquiryCrossRefTab';
import { InquiryFeasibilityTab } from './inquiry/InquiryFeasibilityTab';
import { InquiryFollowUpsTab } from './inquiry/InquiryFollowUpsTab';
import { InquiryPrintableSheet } from './inquiry/InquiryPrintableSheet';

const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: 'var(--font-caption)',
  marginTop: 'var(--space-2)',
  lineHeight: 'var(--leading-normal)'
};

const InquiryMaster = () => {
  // Reference data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [users, setUsers] = useState([]);

  // Inquiry Header list
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState('All');

  // Drill-down state
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [crossRefs, setCrossRefs] = useState([]);
  const [feasibility, setFeasibility] = useState(null);
  const [feasibilityForm, setFeasibilityForm] = useState({});
  const [feasSaving, setFeasSaving] = useState(false);
  const [saving, setSaving] = useState(false);

  // Active Tab in Deal Desk Workbench
  const [activeTab, setActiveTab] = useState('parts'); // 'parts' | 'crossref' | 'feasibility' | 'followups'
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Modals
  const [modal, setModal] = useState({
    type: null,
    data: null,
    editId: null
  });

  // ── Load references ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [cu, pr, um, us] = await Promise.all([
          axios.get('/master/customer'),
          axios.get('/master/product'),
          axios.get('/master/uom'),
          axios.get('/users/directory')
        ]);
        setCustomers(cu.data.data?.filter(c => c.status !== 'Inactive') || cu.data.data || []);
        setProducts(pr.data.data?.filter(p => p.status !== 'Inactive') || pr.data.data || []);
        setUoms(um.data.data || []);
        setUsers(us.data.data || []);
      } catch (e) {
        console.error('Refs error', e);
      }
    })();
    fetchHeaders();
  }, []);

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchHeaders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/sales/inquiry');
      const data = res.data.data || [];
      setHeaders(data);
      // Auto select first inquiry if none selected
      if (data.length > 0 && !selectedInquiry) {
        selectInquiry(data[0]);
      } else if (selectedInquiry) {
        const updated = data.find(h => h._id === selectedInquiry._id);
        if (updated) setSelectedInquiry(updated);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchLineItems = useCallback(async inquiryId => {
    try {
      const res = await axios.get(`/sales/inquiry/${inquiryId}/lines`);
      const lines = res.data.data || [];
      setLineItems(lines);
      if (lines.length > 0) {
        selectLine(lines[0]);
      } else {
        setSelectedLine(null);
        setCrossRefs([]);
        setFeasibility(null);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchFollowUps = useCallback(async inquiryId => {
    try {
      const res = await axios.get(`/sales/inquiry/${inquiryId}/follow-ups`);
      setFollowUps(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchCrossRefs = useCallback(async lineId => {
    try {
      const res = await axios.get(`/sales/inquiry-lines/${lineId}/cross-refs`);
      setCrossRefs(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchFeasibility = useCallback(async lineId => {
    try {
      const res = await axios.get(`/sales/inquiry-lines/${lineId}/feasibility`);
      const d = res.data.data || {};
      setFeasibility(d);
      setFeasibilityForm({
        isToolingRequired: d.isToolingRequired ?? false,
        estimatedToolingCost: d.estimatedToolingCost ?? 0,
        estimatedLeadTimeDays: d.estimatedLeadTimeDays ?? 0,
        approvalStatus: d.approvalStatus || 'Pending',
        engineeringNotes: d.engineeringNotes || ''
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ── Selectors ─────────────────────────────────────────────────────────────
  const selectInquiry = (row) => {
    setSelectedInquiry(row);
    fetchLineItems(row._id);
    fetchFollowUps(row._id);
  };

  const selectLine = (row) => {
    setSelectedLine(row);
    fetchCrossRefs(row._id);
    fetchFeasibility(row._id);
  };

  // ── Generic save ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const { type, data, editId } = modal;
    if (saving) return;
    setSaving(true);
    try {
      if (type === 'header') {
        if (editId) {
          await axios.put(`/sales/inquiry/${editId}`, data);
          notify.success('Inquiry updated successfully');
        } else {
          const res = await axios.post('/sales/inquiry', data);
          notify.success('Inquiry created successfully');
          if (res.data?.data) {
            selectInquiry(res.data.data);
          }
        }
        fetchHeaders();
      } else if (type === 'line') {
        if (editId) {
          await axios.put(`/sales/inquiry-lines/${editId}`, data);
          notify.success('Line item updated');
        } else {
          const res = await axios.post(`/sales/inquiry/${selectedInquiry._id}/lines`, data);
          if (res.data.warning) notify.warning(res.data.warning); // Rule 2: duplicate soft warning
          notify.success('Part added to inquiry');
        }
        fetchLineItems(selectedInquiry._id);
        fetchHeaders();
      } else if (type === 'crossref') {
        const payload = {
          ...data,
          inquiryLineId: selectedLine._id
        };
        if (editId) {
          await axios.put(`/sales/cross-refs/${editId}`, payload);
          notify.success('Part match updated');
        } else {
          await axios.post(`/sales/inquiry-lines/${selectedLine._id}/cross-refs`, payload);
          notify.success('Part cross-reference added');
        }
        fetchCrossRefs(selectedLine._id);
      } else if (type === 'followup') {
        const payload = {
          ...data,
          inquiryId: selectedInquiry._id
        };
        if (editId) {
          await axios.put(`/sales/follow-ups/${editId}`, payload);
          notify.success('Follow-up updated');
        } else {
          await axios.post(`/sales/inquiry/${selectedInquiry._id}/follow-ups`, payload);
          notify.success('Follow-up touchpoint logged');
        }
        fetchFollowUps(selectedInquiry._id);
      }
      setModal({ type: null, data: null, editId: null });
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Error saving');
    }
    setSaving(false);
  };

  const handleDelete = async (type, id) => {
    if (!await confirmAction('Delete this record?')) return;
    try {
      if (type === 'line') {
        await axios.delete(`/sales/inquiry-lines/${id}`);
        fetchLineItems(selectedInquiry._id);
        fetchHeaders();
        notify.success('Line item removed');
      }
      if (type === 'crossref') {
        await axios.delete(`/sales/cross-refs/${id}`);
        fetchCrossRefs(selectedLine._id);
        notify.success('Cross-reference removed');
      }
      if (type === 'followup') {
        await axios.delete(`/sales/follow-ups/${id}`);
        fetchFollowUps(selectedInquiry._id);
        notify.success('Touchpoint removed');
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error deleting');
    }
  };

  // ── Status transitions ────────────────────────────────────────────────────
  const changeStatus = async (id, status) => {
    try {
      await axios.put(`/sales/inquiry/${id}/status`, { status });
      fetchHeaders();
      if (selectedInquiry?._id === id) {
        setSelectedInquiry(h => ({ ...h, status }));
      }
      notify.success(`Status updated to ${status}`);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error changing status');
    }
  };

  // ── Save feasibility ──────────────────────────────────────────────────────
  const saveFeasibility = async () => {
    if (!selectedLine) return;
    setFeasSaving(true);
    try {
      await axios.put(`/sales/inquiry-lines/${selectedLine._id}/feasibility`, feasibilityForm);
      fetchFeasibility(selectedLine._id);
      fetchLineItems(selectedInquiry._id);
      notify.success('Engineering feasibility review saved successfully!');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving feasibility');
    }
    setFeasSaving(false);
  };

  const openModal = (type, prefill = {}, editId = null) => {
    setModal({
      type,
      data: { ...prefill },
      editId
    });
  };

  const updateField = (field, value) => {
    setModal(m => ({
      ...m,
      data: {
        ...m.data,
        [field]: value
      }
    }));
  };

  const newInqNo = () => 'INQ-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // ── Filtered Headers ──────────────────────────────────────────────────────
  const filteredHeaders = useMemo(() => {
    return headers.filter(h => {
      // Status filter
      if (statusFilter !== 'All' && h.status !== statusFilter) return false;
      // Inquiry type filter
      if (inquiryTypeFilter !== 'All' && h.inquiryType !== inquiryTypeFilter) return false;
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inqNo = (h.inquiryNumber || '').toLowerCase();
        const custName = (h.customerId?.name || '').toLowerCase();
        const custCode = (h.customerId?.code || '').toLowerCase();
        let repName = '';
        if (h.salesRepId && typeof h.salesRepId === 'object') {
          repName = `${h.salesRepId.firstName || ''} ${h.salesRepId.lastName || ''} ${h.salesRepId.name || ''}`.toLowerCase();
        }
        return inqNo.includes(q) || custName.includes(q) || custCode.includes(q) || repName.includes(q);
      }
      return true;
    });
  }, [headers, statusFilter, inquiryTypeFilter, searchTerm]);

  // ── Tab items configuration ───────────────────────────────────────────────
  const tabs = [
    {
      id: 'parts',
      label: 'Requested Parts & Pricing',
      count: lineItems.length,
      icon: Package,
      badgeColor: '#0077b6'
    },
    {
      id: 'crossref',
      label: 'Fitment & Cross-Ref',
      count: selectedLine ? crossRefs.length : null,
      icon: Link2,
      badgeColor: '#059669'
    },
    {
      id: 'feasibility',
      label: 'APQP Feasibility Gate',
      count: feasibility?.approvalStatus || (selectedLine && !selectedLine.productId ? 'Required' : null),
      isTag: true,
      icon: Wrench,
      badgeColor: '#d97706'
    },
    {
      id: 'followups',
      label: 'CRM Touchpoints & Notes',
      count: followUps.length,
      icon: MessageSquare,
      badgeColor: '#7c3aed'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: 14
    }}>
      {/* ── 1. COMMAND & RADAR HEADER ───────────────────────────────────────── */}
      <InquiryCommandBar
        headers={headers}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        inquiryTypeFilter={inquiryTypeFilter}
        setInquiryTypeFilter={setInquiryTypeFilter}
        loading={loading}
        onOpenCreateModal={() => openModal('header', {
          inquiryNumber: newInqNo(),
          inquiryType: 'Standard',
          status: 'New',
          probabilityOfWin: 50,
          dateReceived: new Date().toISOString().split('T')[0]
        })}
      />

      {/* ── 2. DUAL-PANEL COMMERCIAL DEAL DESK ──────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: 14,
        flex: 1,
        minHeight: 580
      }}>
        {/* LEFT PANEL: Deal Dossier Queue */}
        <InquiryDossierList
          headers={filteredHeaders}
          selectedInquiry={selectedInquiry}
          onSelectInquiry={selectInquiry}
          loading={loading}
        />

        {/* RIGHT PANEL: FlightDeck & Tabbed Interactive Workbench */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          {selectedInquiry ? (
            <>
              {/* Flight Deck Control Banner */}
              <InquiryFlightDeck
                selectedInquiry={selectedInquiry}
                lineItems={lineItems}
                onChangeStatus={changeStatus}
                onOpenEditModal={openModal}
                onOpenPrint={() => setIsPrintOpen(true)}
                busy={loading}
              />

              {/* Workbench Tabs Strip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: 2,
                overflowX: 'auto'
              }}>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        background: isActive ? 'var(--surface-canvas)' : 'transparent',
                        border: 'none',
                        borderBottom: isActive ? '3px solid #00b4d8' : '3px solid transparent',
                        borderRadius: '6px 6px 0 0',
                        cursor: 'pointer',
                        color: isActive ? '#0077b6' : 'var(--text-secondary)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 12.5,
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={14} color={isActive ? '#0077b6' : 'var(--text-secondary)'} />
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 10,
                          background: isActive ? 'rgba(0, 180, 216, 0.15)' : 'var(--bg-secondary)',
                          color: isActive ? '#0077b6' : 'var(--text-secondary)',
                          fontFamily: 'monospace'
                        }}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Workbench Tab Content */}
              <div style={{ flex: 1 }}>
                {activeTab === 'parts' && (
                  <InquiryLineItemsTab
                    selectedInquiry={selectedInquiry}
                    lineItems={lineItems}
                    selectedLine={selectedLine}
                    onSelectLine={(line) => {
                      selectLine(line);
                    }}
                    onOpenAddLineModal={() => openModal('line', {
                      lineStatus: 'Open',
                      requestedQuantity: 1,
                      targetUnitPrice: 0
                    })}
                    onOpenEditLineModal={(line) => openModal('line', {
                      ...line,
                      productId: line.productId?._id || line.productId || '',
                      uomId: line.uomId?._id || line.uomId || ''
                    }, line._id)}
                    onDeleteLine={(id) => handleDelete('line', id)}
                  />
                )}

                {activeTab === 'crossref' && (
                  <InquiryCrossRefTab
                    selectedInquiry={selectedInquiry}
                    selectedLine={selectedLine}
                    crossRefs={crossRefs}
                    onOpenAddCrossRefModal={() => openModal('crossref', {
                      matchType: 'Exact Match',
                      isPrimaryMatch: crossRefs.length === 0
                    })}
                    onOpenEditCrossRefModal={(ref) => openModal('crossref', {
                      ...ref,
                      internalProductId: ref.internalProductId?._id || ref.internalProductId
                    }, ref._id)}
                    onDeleteCrossRef={(id) => handleDelete('crossref', id)}
                  />
                )}

                {activeTab === 'feasibility' && (
                  <InquiryFeasibilityTab
                    selectedInquiry={selectedInquiry}
                    selectedLine={selectedLine}
                    feasibility={feasibility}
                    feasibilityForm={feasibilityForm}
                    setFeasibilityForm={setFeasibilityForm}
                    onSaveFeasibility={saveFeasibility}
                    saving={feasSaving}
                  />
                )}

                {activeTab === 'followups' && (
                  <InquiryFollowUpsTab
                    selectedInquiry={selectedInquiry}
                    followUps={followUps}
                    onOpenAddFollowUpModal={() => openModal('followup', {
                      method: 'Phone',
                      activityDate: new Date().toISOString().split('T')[0]
                    })}
                    onOpenEditFollowUpModal={(f) => openModal('followup', {
                      ...f,
                      activityDate: f.activityDate?.split('T')[0] || '',
                      nextActionDate: f.nextActionDate?.split('T')[0] || ''
                    }, f._id)}
                    onDeleteFollowUp={(id) => handleDelete('followup', id)}
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
              height: '100%',
              padding: 40,
              background: 'var(--surface-canvas)',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              gap: 12
            }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                background: 'rgba(0, 180, 216, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={30} color="#0077b6" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                No Customer Inquiry Selected
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, margin: 0 }}>
                Select an RFQ deal dossier from the left sidebar queue, or create a new customer inquiry to commence commercial review.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openModal('header', {
                  inquiryNumber: newInqNo(),
                  inquiryType: 'Standard',
                  status: 'New',
                  probabilityOfWin: 50,
                  dateReceived: new Date().toISOString().split('T')[0]
                })}
                style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}
              >
                <Plus size={15} /> Create New Inquiry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. MODALS ───────────────────────────────────────────────────────── */}

      {/* A. Header Modal */}
      <Modal
        isOpen={modal.type === 'header'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Customer Inquiry Header' : 'New Customer Inquiry / RFQ'}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group">
              <label className="input-label">Inquiry Number *</label>
              <input className="input-field" required readOnly value={modal.data?.inquiryNumber || ''} style={{ fontFamily: 'monospace', fontWeight: 700 }} />
            </div>

            <div className="input-group">
              <label className="input-label">Inquiry Type *</label>
              <select
                className="input-field"
                required
                value={modal.data?.inquiryType || 'Standard'}
                onChange={e => updateField('inquiryType', e.target.value)}
              >
                {['Standard', 'RFQ', 'Sample Request', 'Blanket Contract'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Customer Organization *</label>
              <select
                className="input-field"
                required
                value={modal.data?.customerId || ''}
                onChange={e => updateField('customerId', e.target.value)}
              >
                <option value="">Select a customer</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                ))}
              </select>
              {customers.length === 0 && (
                <p style={hintStyle}>No customers found — add one under Master Data &gt; Customers first.</p>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Customer Contact Person</label>
              <select
                className="input-field"
                value={modal.data?.contactPersonId || ''}
                onChange={e => updateField('contactPersonId', e.target.value)}
              >
                <option value="">None / General</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Commercial Sales Lead</label>
              <select
                className="input-field"
                value={modal.data?.salesRepId || ''}
                onChange={e => updateField('salesRepId', e.target.value)}
              >
                <option value="">None / Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Date Received *</label>
              <input
                type="date"
                className="input-field"
                required
                value={modal.data?.dateReceived || ''}
                onChange={e => updateField('dateReceived', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Target Quotation Due Date</label>
              <input
                type="date"
                className="input-field"
                value={modal.data?.targetQuotationDate || ''}
                onChange={e => updateField('targetQuotationDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Win Probability Gauge (%)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                max="100"
                value={modal.data?.probabilityOfWin ?? 50}
                onChange={e => updateField('probabilityOfWin', parseInt(e.target.value) || 0)}
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
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : modal.editId ? 'Save Changes' : 'Create Inquiry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* B. Line Item Modal */}
      <Modal
        isOpen={modal.type === 'line'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Requested Part' : 'Add Requested Part to Inquiry'}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group">
              <label className="input-label">Customer Part Number (What they call it)</label>
              <input
                className="input-field"
                placeholder="e.g., BRK-CAL-9982"
                value={modal.data?.customerPartNumber || ''}
                onChange={e => updateField('customerPartNumber', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">OEM Part Number (Vehicle maker spec #)</label>
              <input
                className="input-field"
                placeholder="e.g., HYUNDAI-58100-B9000"
                value={modal.data?.oemPartNumber || ''}
                onChange={e => updateField('oemPartNumber', e.target.value)}
              />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Precision Catalog Match (Optional — leave blank for new/custom parts)</label>
              <select
                className="input-field"
                value={modal.data?.productId || ''}
                onChange={e => updateField('productId', e.target.value || null)}
              >
                <option value="">[New / Custom Part — Requires Engineering APQP Feasibility]</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Requested Quantity *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0.0001"
                step="any"
                value={modal.data?.requestedQuantity || 1}
                onChange={e => updateField('requestedQuantity', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Unit of Measure (UOM)</label>
              <select
                className="input-field"
                value={modal.data?.uomId || ''}
                onChange={e => updateField('uomId', e.target.value)}
              >
                <option value="" disabled>Select a unit</option>
                {uoms.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Target Unit Price (₹)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                step="any"
                value={modal.data?.targetUnitPrice || 0}
                onChange={e => updateField('targetUnitPrice', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Line Status</label>
              <select
                className="input-field"
                value={modal.data?.lineStatus || 'Open'}
                onChange={e => updateField('lineStatus', e.target.value)}
              >
                {['Open', 'Evaluating', 'Quoted', 'Rejected'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
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
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : modal.editId ? 'Save Part' : 'Add Part'}
            </button>
          </div>
        </form>
      </Modal>

      {/* C. Cross-Reference Modal */}
      <Modal
        isOpen={modal.type === 'crossref'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Product Fitment Match' : 'Map Part to Precision SKU'}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Which Precision internal part fits? *</label>
              <select
                className="input-field"
                required
                value={modal.data?.internalProductId || ''}
                onChange={e => updateField('internalProductId', e.target.value)}
              >
                <option value="" disabled>Select internal product SKU</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">How well does it match? *</label>
              <select
                className="input-field"
                required
                value={modal.data?.matchType || 'Exact Match'}
                onChange={e => updateField('matchType', e.target.value)}
              >
                {['Exact Match', 'Form-Fit-Function', 'Modification Required'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
              <input
                type="checkbox"
                id="isPrimaryModal"
                checked={!!modal.data?.isPrimaryMatch}
                onChange={e => updateField('isPrimaryMatch', e.target.checked)}
              />
              <label htmlFor="isPrimaryModal" className="input-label" style={{ margin: 0 }}>
                Primary Match ⭐
              </label>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Fitment Notes & Tolerances</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="e.g., Direct bolt-on equivalent, same mounting pitch and spline count"
                value={modal.data?.fitmentNotes || ''}
                onChange={e => updateField('fitmentNotes', e.target.value)}
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
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : modal.editId ? 'Save Match' : 'Add Matching SKU'}
            </button>
          </div>
        </form>
      </Modal>

      {/* D. Follow-up Modal */}
      <Modal
        isOpen={modal.type === 'followup'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Touchpoint' : 'Log Customer Touchpoint / CRM Activity'}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group">
              <label className="input-label">Date of Contact *</label>
              <input
                type="date"
                className="input-field"
                required
                value={modal.data?.activityDate || ''}
                onChange={e => updateField('activityDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Communication Channel *</label>
              <select
                className="input-field"
                required
                value={modal.data?.method || 'Phone'}
                onChange={e => updateField('method', e.target.value)}
              >
                {['Email', 'Phone', 'Meeting', 'Customer Portal'].map(m => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Touchpoint Notes & Key Discussion Points *</label>
              <textarea
                className="input-field"
                rows={3}
                required
                placeholder="Discussed batch delivery schedule, customer requested sample testing report…"
                value={modal.data?.notes || ''}
                onChange={e => updateField('notes', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Next Action Due Date</label>
              <input
                type="date"
                className="input-field"
                value={modal.data?.nextActionDate || ''}
                onChange={e => updateField('nextActionDate', e.target.value)}
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
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : modal.editId ? 'Save Touchpoint' : 'Log Touchpoint'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── 4. PRINTABLE RFQ DOSSIER ────────────────────────────────────────── */}
      {isPrintOpen && (
        <InquiryPrintableSheet
          inquiry={selectedInquiry}
          lineItems={lineItems}
          followUps={followUps}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
};

export default InquiryMaster;