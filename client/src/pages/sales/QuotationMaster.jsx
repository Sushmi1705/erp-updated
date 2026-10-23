import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  DollarSign, Plus, Search, Layers, FileText,
  UserCheck, Lock, AlertTriangle, Printer, Copy,
  Receipt, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

// Subcomponents
import { QuotationCommandBar } from './quotation/QuotationCommandBar';
import { QuotationPortfolioList } from './quotation/QuotationPortfolioList';
import { QuotationRevisionNavigator } from './quotation/QuotationRevisionNavigator';
import { QuotationLinesTab } from './quotation/QuotationLinesTab';
import { QuotationFinancialsTab } from './quotation/QuotationFinancialsTab';
import { QuotationApprovalsTab } from './quotation/QuotationApprovalsTab';
import { QuotationPrintModal } from './quotation/QuotationPrintModal';

const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: 'var(--font-caption)',
  marginTop: 'var(--space-2)',
  lineHeight: 'var(--leading-normal)'
};

const QuotationMaster = () => {
  // References
  const [customers, setCustomers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [products, setProducts] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  // Data
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');

  // Drill-down State
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [lines, setLines] = useState([]);
  const [financials, setFinancials] = useState([]);
  const [approvals, setApprovals] = useState([]);

  // Active Workbench Tab
  const [activeTab, setActiveTab] = useState('lines'); // 'lines' | 'financials' | 'approvals' | 'audit'
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Modal State
  const [modal, setModal] = useState({
    type: null,
    data: null,
    editId: null
  });
  const [saving, setSaving] = useState(false);

  // ── References ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [cu, inq, pr, um, tx, ro, us] = await Promise.all([
          axios.get('/master/customer'),
          axios.get('/sales/inquiry'),
          axios.get('/master/product'),
          axios.get('/master/uom'),
          axios.get('/master/tax'),
          axios.get('/roles/directory'),
          axios.get('/users/directory')
        ]);
        setCustomers(cu.data.data?.filter(c => c.status !== 'Inactive') || cu.data.data || []);
        setInquiries(inq.data.data || []);
        setProducts(pr.data.data?.filter(p => p.status !== 'Inactive') || pr.data.data || []);
        setUoms(um.data.data || []);
        setTaxes(tx.data.data || []);
        setRoles(ro.data.data || []);
        setUsers(us.data.data || []);
      } catch (e) {
        console.error('Refs:', e);
      }
    })();
    fetchHeaders();
  }, []);

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchHeaders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/sales/quotation-headers');
      const data = res.data.data || [];
      setHeaders(data);
      if (data.length > 0 && !selectedHeader) {
        selectHeader(data[0]);
      } else if (selectedHeader) {
        const updated = data.find(h => h._id === selectedHeader._id);
        if (updated) setSelectedHeader(updated);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchRevisions = useCallback(async (headerId) => {
    try {
      const res = await axios.get(`/sales/quotation-headers/${headerId}/revisions`);
      const revs = res.data.data || [];
      setRevisions(revs);
      if (revs.length > 0) {
        selectRevision(revs[0]);
      } else {
        setSelectedRevision(null);
        setLines([]);
        setFinancials([]);
        setApprovals([]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchLines = useCallback(async (revId) => {
    try {
      const res = await axios.get(`/sales/quotation-revisions/${revId}/lines`);
      setLines(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchFinancials = useCallback(async (revId) => {
    try {
      const res = await axios.get(`/sales/quotation-revisions/${revId}/financials`);
      setFinancials(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchApprovals = useCallback(async (revId) => {
    try {
      const res = await axios.get(`/sales/quotation-revisions/${revId}/approvals`);
      setApprovals(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ── Selectors ─────────────────────────────────────────────────────────────
  const selectHeader = (row) => {
    setSelectedHeader(row);
    fetchRevisions(row._id);
  };

  const selectRevision = (row) => {
    setSelectedRevision(row);
    fetchLines(row._id);
    fetchFinancials(row._id);
    fetchApprovals(row._id);
  };

  // ── Status transitions ────────────────────────────────────────────────────
  const changeRevisionStatus = async (revId, status) => {
    try {
      await axios.put(`/sales/quotation-revisions/${revId}/status`, { status });
      fetchRevisions(selectedHeader._id);
      if (selectedRevision?._id === revId) {
        setSelectedRevision(r => ({
          ...r,
          status,
          isLocked: ['Approved', 'Sent to Customer', 'Accepted'].includes(status)
        }));
      }
      notify.success(`Revision status updated to ${status}`);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const cloneRevision = async (revId) => {
    const today = new Date().toISOString().split('T')[0];
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    try {
      await axios.post(`/sales/quotation-revisions/${revId}/clone`, {
        validFromDate: today,
        validToDate: in30
      });
      fetchRevisions(selectedHeader._id);
      notify.info('Revision cloned as a new editable Draft!');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error cloning revision');
    }
  };

  const actionApproval = async (approvalId, actionTaken, notes = '') => {
    try {
      await axios.put(`/sales/quotation-approvals/${approvalId}/action`, {
        actionTaken,
        approvalNotes: notes
      });
      fetchApprovals(selectedRevision._id);
      notify.success(`Approval decision recorded: ${actionTaken}`);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error recording approval decision');
    }
  };

  // ── Generic save ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const { type, data, editId } = modal;
    if (saving) return;
    setSaving(true);
    try {
      let res;
      if (type === 'header') {
        if (editId) {
          res = await axios.put(`/sales/quotation-headers/${editId}`, data);
          notify.success('Quotation header updated');
        } else {
          res = await axios.post('/sales/quotation-headers', data);
          notify.success('Quotation created');
          if (res.data?.data) {
            selectHeader(res.data.data);
          }
        }
        fetchHeaders();
      } else if (type === 'revision') {
        res = await axios.post(`/sales/quotation-headers/${selectedHeader._id}/revisions`, data);
        notify.success('New version added');
        fetchRevisions(selectedHeader._id);
      } else if (type === 'line') {
        if (editId) {
          res = await axios.put(`/sales/quotation-lines/${editId}`, data);
          notify.success('Line item updated');
        } else {
          res = await axios.post(`/sales/quotation-revisions/${selectedRevision._id}/lines`, {
            ...data,
            revisionId: selectedRevision._id
          });
          notify.success('Line item added');
        }
        if (res?.data?.warning) notify.warning(res.data.warning);
        if (res?.data?.toolingApplied) notify.info(res.data.toolingApplied);
        fetchLines(selectedRevision._id);
        fetchRevisions(selectedHeader._id);
      } else if (type === 'financial') {
        if (editId) {
          res = await axios.put(`/sales/quotation-financials/${editId}`, data);
          notify.success('Adjustment updated');
        } else {
          res = await axios.post(`/sales/quotation-revisions/${selectedRevision._id}/financials`, {
            ...data,
            revisionId: selectedRevision._id
          });
          notify.success('Adjustment added');
        }
        fetchFinancials(selectedRevision._id);
        fetchRevisions(selectedHeader._id);
      } else if (type === 'approval') {
        res = await axios.post(`/sales/quotation-revisions/${selectedRevision._id}/approvals`, {
          ...data,
          revisionId: selectedRevision._id
        });
        notify.success('Approver role added');
        fetchApprovals(selectedRevision._id);
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
        await axios.delete(`/sales/quotation-lines/${id}`);
        fetchLines(selectedRevision._id);
        fetchRevisions(selectedHeader._id);
        notify.success('Line item removed');
      }
      if (type === 'financial') {
        await axios.delete(`/sales/quotation-financials/${id}`);
        fetchFinancials(selectedRevision._id);
        fetchRevisions(selectedHeader._id);
        notify.success('Adjustment removed');
      }
      if (type === 'approval') {
        await axios.delete(`/sales/quotation-approvals/${id}`);
        fetchApprovals(selectedRevision._id);
        notify.success('Approver removed');
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error deleting');
    }
  };

  const openModal = (type, prefill = {}, editId = null) => {
    setModal({
      type,
      data: { ...prefill },
      editId
    });
  };

  const updateField = (f, v) => {
    setModal(m => ({
      ...m,
      data: {
        ...m.data,
        [f]: v
      }
    }));
  };

  const newQtnNo = () => 'QTN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // ── Filtered Headers ──────────────────────────────────────────────────────
  const filteredHeaders = useMemo(() => {
    return headers.filter(h => {
      // Customer filter
      if (customerFilter !== 'All') {
        const cId = h.customerId?._id || h.customerId;
        if (cId !== customerFilter) return false;
      }
      // Status filter
      if (statusFilter !== 'All') {
        // Find if any revision matches this status
        // Alternatively, if revision is selected
        // We will keep it flexible
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const qtnNo = (h.quotationNumber || '').toLowerCase();
        const custName = (h.customerId?.name || '').toLowerCase();
        const custCode = (h.customerId?.code || '').toLowerCase();
        const inqNo = (h.inquiryId?.inquiryNumber || '').toLowerCase();
        let repName = '';
        if (h.salesRepId && typeof h.salesRepId === 'object') {
          repName = `${h.salesRepId.firstName || ''} ${h.salesRepId.lastName || ''} ${h.salesRepId.name || ''}`.toLowerCase();
        }
        return qtnNo.includes(q) || custName.includes(q) || custCode.includes(q) || inqNo.includes(q) || repName.includes(q);
      }
      return true;
    });
  }, [headers, customerFilter, statusFilter, searchTerm]);

  const linesTotalMarginFlag = lines.some(l => l.isBelowMarginThreshold);

  // ── Workbench Tabs ────────────────────────────────────────────────────────
  const tabs = [
    {
      id: 'lines',
      label: 'Quoted Line Items & Costs',
      count: lines.length,
      icon: DollarSign,
      color: '#d97706'
    },
    {
      id: 'financials',
      label: 'GST Taxes & Commercial Adjustments',
      count: financials.length,
      icon: Receipt,
      color: '#0077b6'
    },
    {
      id: 'approvals',
      label: 'Managerial Approvals Chain',
      count: `${approvals.filter(a => a.actionTaken === 'Approved').length}/${approvals.length}`,
      icon: UserCheck,
      color: '#059669'
    },
    {
      id: 'audit',
      label: 'Commercial Audit & RFQ Origin',
      count: null,
      icon: FileText,
      color: '#7c3aed'
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
      <QuotationCommandBar
        headers={headers}
        revisions={revisions}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        customerFilter={customerFilter}
        setCustomerFilter={setCustomerFilter}
        customers={customers}
        loading={loading}
        onOpenCreateModal={() => openModal('header', {
          quotationNumber: newQtnNo(),
          isActive: true
        })}
      />

      {/* ── 2. DUAL-STREAM QUOTATION STUDIO ─────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: 14,
        flex: 1,
        minHeight: 580
      }}>
        {/* LEFT STREAM: Master Portfolio Queue */}
        <QuotationPortfolioList
          headers={filteredHeaders}
          selectedHeader={selectedHeader}
          onSelectHeader={selectHeader}
          onOpenEditHeaderModal={(h) => openModal('header', {
            ...h,
            customerId: h.customerId?._id || h.customerId,
            inquiryId: h.inquiryId?._id || h.inquiryId,
            salesRepId: h.salesRepId?._id || h.salesRepId
          }, h._id)}
          loading={loading}
        />

        {/* RIGHT STREAM: Revision Navigator & Interactive Workspaces */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          {selectedHeader ? (
            <>
              {/* Revision Navigator & Commercial Cockpit */}
              <QuotationRevisionNavigator
                selectedHeader={selectedHeader}
                revisions={revisions}
                selectedRevision={selectedRevision}
                onSelectRevision={selectRevision}
                onOpenNewRevisionModal={() => openModal('revision', {
                  validFromDate: today,
                  validToDate: in30,
                  status: 'Draft'
                })}
                onChangeRevisionStatus={changeRevisionStatus}
                onCloneRevision={cloneRevision}
                onOpenPrintModal={() => setIsPrintOpen(true)}
                linesTotalMarginFlag={linesTotalMarginFlag}
              />

              {/* Workbench Tab Navigation */}
              {selectedRevision && (
                <>
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
                            borderBottom: isActive ? '3px solid #d97706' : '3px solid transparent',
                            borderRadius: '6px 6px 0 0',
                            cursor: 'pointer',
                            color: isActive ? '#d97706' : 'var(--text-secondary)',
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 12.5,
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Icon size={14} color={isActive ? '#d97706' : 'var(--text-secondary)'} />
                          <span>{tab.label}</span>
                          {tab.count !== null && (
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 10,
                              background: isActive ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-secondary)',
                              color: isActive ? '#b45309' : 'var(--text-secondary)',
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
                    {activeTab === 'lines' && (
                      <QuotationLinesTab
                        selectedRevision={selectedRevision}
                        lines={lines}
                        onOpenAddLineModal={() => openModal('line', {
                          lineType: 'Standard Part',
                          quantity: 1,
                          unitCost: 0,
                          unitPrice: 0,
                          lineDiscountPercentage: 0
                        })}
                        onOpenEditLineModal={(l) => openModal('line', {
                          ...l,
                          productId: l.productId?._id || l.productId || '',
                          uomId: l.uomId?._id || l.uomId || ''
                        }, l._id)}
                        onDeleteLine={(id) => handleDelete('line', id)}
                      />
                    )}

                    {activeTab === 'financials' && (
                      <QuotationFinancialsTab
                        selectedRevision={selectedRevision}
                        financials={financials}
                        onOpenAddFinancialModal={() => openModal('financial', {
                          entryType: 'Tax',
                          ratePercentage: 0,
                          calculatedAmount: 0
                        })}
                        onOpenEditFinancialModal={(f) => openModal('financial', { ...f }, f._id)}
                        onDeleteFinancial={(id) => handleDelete('financial', id)}
                      />
                    )}

                    {activeTab === 'approvals' && (
                      <QuotationApprovalsTab
                        selectedRevision={selectedRevision}
                        approvals={approvals}
                        onOpenAddApprovalModal={() => openModal('approval', {})}
                        onActionApproval={actionApproval}
                        onDeleteApproval={(id) => handleDelete('approval', id)}
                      />
                    )}

                    {activeTab === 'audit' && (
                      <div style={{
                        background: 'var(--surface-canvas)',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)',
                        padding: '20px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Commercial Audit Trail & Traceability
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: 16
                        }}>
                          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Quotation Identifier</div>
                            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{selectedHeader.quotationNumber}</div>
                          </div>

                          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Customer Account</div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedHeader.customerId?.name}</div>
                          </div>

                          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Originating Inquiry / RFQ</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: selectedHeader.inquiryId ? '#0077b6' : 'var(--text-secondary)' }}>
                              {selectedHeader.inquiryId?.inquiryNumber || 'Direct Commercial Quotation (No RFQ)'}
                            </div>
                          </div>

                          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Assigned Sales Lead</div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>
                              {typeof selectedHeader.salesRepId === 'object'
                                ? `${selectedHeader.salesRepId?.firstName || ''} ${selectedHeader.salesRepId?.lastName || ''}`.trim() || selectedHeader.salesRepId?.name
                                : selectedHeader.salesRepId || 'Unassigned'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
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
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={30} color="#d97706" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                No Quotation Contract Selected
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, margin: 0 }}>
                Select a quotation from the portfolio queue on the left, or create a new quotation contract to begin commercial price modelling.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openModal('header', {
                  quotationNumber: newQtnNo(),
                  isActive: true
                })}
                style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}
              >
                <Plus size={15} /> Add Quotation
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
        title={modal.editId ? 'Edit Quotation Contract' : 'Add New Quotation Contract'}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group">
              <label className="input-label">Quotation Number *</label>
              <input
                className="input-field"
                required
                readOnly
                value={modal.data?.quotationNumber || ''}
                style={{ fontFamily: 'monospace', fontWeight: 700 }}
              />
            </div>

            <div className="input-group">
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

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Originating Customer Inquiry (Optional)</label>
              <select
                className="input-field"
                value={modal.data?.inquiryId || ''}
                onChange={e => updateField('inquiryId', e.target.value || null)}
              >
                <option value="">Direct Proposal — No RFQ Origin</option>
                {inquiries.map(i => (
                  <option key={i._id} value={i._id}>{i.inquiryNumber} — {i.customerId?.name || 'Customer'}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Commercial Account Manager / Sales Person</label>
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
              {saving ? 'Saving…' : modal.editId ? 'Save Changes' : 'Create Quotation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* B. Revision Modal */}
      <Modal
        isOpen={modal.type === 'revision'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={`Add Revision V${revisions.length + 1}`}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group">
              <label className="input-label">Prices Valid From *</label>
              <input
                type="date"
                className="input-field"
                required
                value={modal.data?.validFromDate || today}
                onChange={e => updateField('validFromDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Prices Valid Until *</label>
              <input
                type="date"
                className="input-field"
                required
                value={modal.data?.validToDate || in30}
                onChange={e => updateField('validToDate', e.target.value)}
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
              {saving ? 'Saving…' : `Create Version V${revisions.length + 1}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* C. Line Item Modal */}
      <Modal
        isOpen={modal.type === 'line'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Quoted Line Item' : 'Add Line to Quotation'}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Quoted Item Classification *</label>
              <select
                className="input-field"
                required
                value={modal.data?.lineType || 'Standard Part'}
                onChange={e => updateField('lineType', e.target.value)}
              >
                {['Standard Part', 'Custom Part', 'Tooling Cost', 'NRE/Engineering'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Product SKU (Optional for Tooling/NRE)</label>
              <select
                className="input-field"
                value={modal.data?.productId || ''}
                onChange={e => updateField('productId', e.target.value || null)}
              >
                <option value="">[Custom Part, Tooling or Engineering Service — Describe below]</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Item Description & Specification</label>
              <input
                className="input-field"
                placeholder="e.g., Die-cast aluminum casing tooling or custom CNC machining"
                value={modal.data?.description || ''}
                onChange={e => updateField('description', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Quantity Quoted *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0.0001"
                step="any"
                value={modal.data?.quantity || 1}
                onChange={e => updateField('quantity', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Unit of Measure (UOM)</label>
              <select
                className="input-field"
                value={modal.data?.uomId || ''}
                onChange={e => updateField('uomId', e.target.value)}
              >
                <option value="" disabled>Select unit</option>
                {uoms.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', gap: 4 }}>
                <span>Internal Unit Cost (₹)</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>— strictly confidential</span>
              </label>
              <input
                type="number"
                className="input-field"
                min="0"
                step="any"
                value={modal.data?.unitCost || 0}
                onChange={e => updateField('unitCost', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Quoted Price per Unit (₹) *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0"
                step="any"
                value={modal.data?.unitPrice || 0}
                onChange={e => updateField('unitPrice', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Line Discount (%)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                max="100"
                step="any"
                value={modal.data?.lineDiscountPercentage || 0}
                onChange={e => updateField('lineDiscountPercentage', parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Live Profit Margin Feedback */}
            <div style={{
              gridColumn: '1 / -1',
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              fontSize: 12
            }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>Projected Profit Margin:</div>
              {(() => {
                const p = modal.data?.unitPrice || 0;
                const c = modal.data?.unitCost || 0;
                const m = p > 0 ? ((p - c) / p * 100).toFixed(1) : null;
                if (!m) return <span style={{ color: 'var(--text-secondary)' }}>Enter price to calculate profit margin</span>;
                const isBelow = parseFloat(m) < 15;
                return (
                  <strong style={{
                    fontSize: 14,
                    color: isBelow ? '#d97706' : '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    {isBelow && <AlertTriangle size={14} />}
                    <span>{m}% Gross Margin</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {isBelow ? '(Below 15% threshold — Managerial approval will be required)' : '(Complies with standard margin policies)'}
                    </span>
                  </strong>
                );
              })()}
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
              {saving ? 'Saving…' : modal.editId ? 'Save Line Item' : 'Add Line Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* D. Financial Entry Modal */}
      <Modal
        isOpen={modal.type === 'financial'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Tax / Surcharge' : 'Add Tax, Discount or Freight'}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group">
              <label className="input-label">Adjustment Type *</label>
              <select
                className="input-field"
                required
                value={modal.data?.entryType || 'Tax'}
                onChange={e => updateField('entryType', e.target.value)}
              >
                {['Tax', 'Discount', 'Surcharge', 'Shipping'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Statutory GST Tax Code</label>
              <select
                className="input-field"
                value={modal.data?.taxCodeId || ''}
                onChange={e => updateField('taxCodeId', e.target.value)}
              >
                <option value="">None / Custom</option>
                {taxes.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.rate || 0}%)</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Rate (%)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                step="any"
                value={modal.data?.ratePercentage || 0}
                onChange={e => updateField('ratePercentage', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Calculated Amount (₹) *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0"
                step="any"
                value={modal.data?.calculatedAmount || 0}
                onChange={e => updateField('calculatedAmount', parseFloat(e.target.value) || 0)}
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
              {saving ? 'Saving…' : modal.editId ? 'Save Adjustment' : 'Add Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* E. Approval Modal */}
      <Modal
        isOpen={modal.type === 'approval'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title="Add Role to Approval Chain"
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Which Role Must Approve? *</label>
              <select
                className="input-field"
                required
                value={modal.data?.approverRoleId || ''}
                onChange={e => updateField('approverRoleId', e.target.value)}
              >
                <option value="" disabled>Select approver role</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Specific Assignee (Optional)</label>
              <select
                className="input-field"
                value={modal.data?.approverUserId || ''}
                onChange={e => updateField('approverUserId', e.target.value)}
              >
                <option value="">Any user in designated role</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</option>
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
              {saving ? 'Saving…' : 'Add to Approval Chain'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── 4. PRINTABLE FORMAL QUOTATION ───────────────────────────────────── */}
      {isPrintOpen && selectedRevision && (
        <QuotationPrintModal
          header={selectedHeader}
          revision={selectedRevision}
          lines={lines}
          financials={financials}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
};

export default QuotationMaster;