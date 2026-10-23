import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Truck, Factory, Building2, ShieldCheck, Plus, Search, Filter,
  Download, LayoutGrid, List, Eye, Edit2, Copy, Check, CheckCircle2,
  XCircle, MapPin, Phone, Mail, FileText, Tag, ChevronRight, ArrowUpRight,
  HelpCircle, Clock, Sparkles, X, Award, Star, Zap, BarChart2, CheckCircle
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

/* Guidance / Hint style */
const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: '12px',
  marginTop: '4px',
  lineHeight: 1.4
};

const VendorMaster = () => {
  const navigate = useNavigate();

  // Primary navigation tabs: 'vendors' | 'categories'
  const [activeTab, setActiveTab] = useState('vendors');

  // View mode for vendors: 'cards' (Vendor Scorecard Tiles) vs 'table' (Procurement Matrix)
  const [viewMode, setViewMode] = useState('cards');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('ALL'); // 'ALL' | 'A' | 'B' | 'C' | 'D'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'code' | 'rating' | 'leadTime'

  // Data state
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null); // Vendor 360 Slide-Over
  const [copiedGstId, setCopiedGstId] = useState(null);

  // Launchpad quick-create deep link (?create=1)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('create') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    fetchCategories();
    fetchCurrencies();
    fetchPaymentTerms();
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/master/vendorcategory?limit=200&includeInactive=true');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching vendor categories:', err);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await axios.get('/master/currency?limit=100');
      setCurrencies(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching currencies:', err);
    }
  };

  const fetchPaymentTerms = async () => {
    try {
      const res = await axios.get('/master/paymentterms?limit=100');
      setPaymentTerms(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching payment terms:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'vendors') {
        const res = await axios.get('/master/vendor?limit=200&includeInactive=true');
        setVendors(res.data?.data || []);
      } else {
        const res = await axios.get('/master/vendorcategory?limit=200&includeInactive=true');
        setCategories(res.data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      notify.error('Could not load supplier data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Copy GSTIN helper
  const handleCopyGst = (gst, id, e) => {
    if (e) e.stopPropagation();
    if (!gst) return;
    navigator.clipboard.writeText(gst);
    setCopiedGstId(id);
    setTimeout(() => setCopiedGstId(null), 2000);
    notify.success(`Supplier GSTIN ${gst} copied to clipboard`);
  };

  // Open Create Modal
  const openCreate = () => {
    if (activeTab === 'vendors') {
      const codeNum = String(vendors.length + 1).padStart(3, '0');
      setFormData({
        code: `VND-${codeNum}`,
        currencyId: currencies.find(c => c.code === 'INR')?._id || '',
        paymentTermsId: paymentTerms.find(p => p.code?.includes('30') || p.name?.includes('30'))?._id || '',
        rating: 'B',
        leadTimeDays: 7,
        status: 'Active',
        isActive: true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'Active',
        isActive: true
      });
    }
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (row, e) => {
    if (e) e.stopPropagation();
    setFormData({
      ...row,
      categoryId: row.categoryId?._id || row.categoryId || '',
      currencyId: row.currencyId?._id || row.currencyId || '',
      paymentTermsId: row.paymentTermsId?._id || row.paymentTermsId || ''
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  // Toggle Active/Inactive Status
  const toggleStatus = async (row, e) => {
    if (e) e.stopPropagation();
    const isActivating = !row.isActive && row.status !== 'Active';
    if (!isActivating && !(await confirmAction(`Are you sure you want to deactivate ${row.name}? Deactivated suppliers will be blocked from purchase orders.`))) {
      return;
    }

    try {
      const endpoint = activeTab === 'vendors' ? '/master/vendor' : '/master/vendorcategory';
      await axios.put(`${endpoint}/${row._id}`, {
        isActive: isActivating,
        status: isActivating ? 'Active' : 'Inactive'
      });
      notify.success(`${row.name} marked as ${isActivating ? 'Active' : 'Inactive'}`);
      fetchData();
      if (selectedDossier && selectedDossier._id === row._id) {
        setSelectedDossier(prev => ({
          ...prev,
          isActive: isActivating,
          status: isActivating ? 'Active' : 'Inactive'
        }));
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating record status');
    }
  };

  // Save Record
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const endpoint = activeTab === 'vendors' ? '/master/vendor' : '/master/vendorcategory';
      const payload = { ...formData };

      if (activeTab === 'categories') {
        delete payload.code;
      } else {
        if (!payload.currencyId) delete payload.currencyId;
        if (!payload.paymentTermsId) delete payload.paymentTermsId;
        if (!payload.gst || payload.gst.trim() === '') delete payload.gst;
        if (!payload.pan || payload.pan.trim() === '') delete payload.pan;
      }

      if (editingId) {
        await axios.put(`${endpoint}/${editingId}`, payload);
        notify.success(`${activeTab === 'vendors' ? 'Supplier' : 'Category'} updated successfully`);
      } else {
        await axios.post(endpoint, payload);
        notify.success(`${activeTab === 'vendors' ? 'Supplier' : 'Category'} registered successfully`);
      }

      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to save record. Check for duplicate Code or GSTIN.');
    } finally {
      setSaving(false);
    }
  };

  // Export Suppliers to CSV
  const exportVendorsCsv = () => {
    if (!vendors || vendors.length === 0) return;
    const headers = ['Code', 'Supplier Name', 'Category', 'Rating', 'Lead Time (Days)', 'GSTIN', 'PAN', 'Phone', 'Email', 'Payment Terms', 'Contact Person', 'Status', 'Address'];
    const rows = vendors.map(v => [
      `"${v.code || ''}"`,
      `"${(v.name || '').replace(/"/g, '""')}"`,
      `"${v.categoryId?.name || ''}"`,
      `"${v.rating || 'C'}"`,
      v.leadTimeDays || 0,
      `"${v.gst || ''}"`,
      `"${v.pan || ''}"`,
      `"${v.phone || ''}"`,
      `"${v.email || ''}"`,
      `"${v.paymentTermsId?.name || ''}"`,
      `"${v.contactPerson || ''}"`,
      `"${v.status || (v.isActive ? 'Active' : 'Inactive')}"`,
      `"${(v.address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Precision_ERP_Approved_Suppliers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Approved supplier directory exported to CSV');
  };

  // Supply Base Analytics & Aggregates
  const supplyBaseStats = useMemo(() => {
    const totalCount = vendors.length;
    const activeCount = vendors.filter(v => v.isActive !== false && v.status !== 'Inactive').length;
    const inactiveCount = totalCount - activeCount;

    const gradeACount = vendors.filter(v => (v.rating || 'C').toUpperCase() === 'A').length;
    const gradeBCount = vendors.filter(v => (v.rating || 'C').toUpperCase() === 'B').length;
    const steelVendorsCount = vendors.filter(v => (v.categoryId?.name || '').toLowerCase().includes('steel') || (v.categoryId?.name || '').toLowerCase().includes('raw')).length;
    const avgLeadTime = totalCount > 0 ? (vendors.reduce((sum, v) => sum + (v.leadTimeDays || 0), 0) / totalCount).toFixed(1) : '0';

    return {
      totalCount,
      activeCount,
      inactiveCount,
      gradeACount,
      gradeBCount,
      steelVendorsCount,
      avgLeadTime
    };
  }, [vendors]);

  // Filtered & Sorted Suppliers
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      // Search match
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (v.name || '').toLowerCase().includes(q) ||
        (v.code || '').toLowerCase().includes(q) ||
        (v.gst || '').toLowerCase().includes(q) ||
        (v.pan || '').toLowerCase().includes(q) ||
        (v.phone || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.contactPerson || '').toLowerCase().includes(q) ||
        (v.categoryId?.name || '').toLowerCase().includes(q);

      // Category filter
      const matchCat = selectedCategoryFilter === 'ALL' ||
        (selectedCategoryFilter === 'STEEL' && (v.categoryId?.name || '').toLowerCase().includes('steel')) ||
        (selectedCategoryFilter === 'JOBWORK' && (v.categoryId?.name || '').toLowerCase().includes('job')) ||
        (selectedCategoryFilter === 'CONSUMABLE' && (v.categoryId?.name || '').toLowerCase().includes('consum')) ||
        (v.categoryId?._id === selectedCategoryFilter);

      // Rating filter
      const r = (v.rating || 'C').toUpperCase();
      const matchRating = selectedRatingFilter === 'ALL' || selectedRatingFilter === r;

      // Status filter
      const isActive = v.isActive !== false && v.status !== 'Inactive';
      const matchStatus = selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ACTIVE' && isActive) ||
        (selectedStatusFilter === 'INACTIVE' && !isActive);

      return matchSearch && matchCat && matchRating && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'leadTime') return (a.leadTimeDays || 0) - (b.leadTimeDays || 0);
      if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
      if (sortBy === 'rating') return (a.rating || 'C').localeCompare(b.rating || 'C');
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [vendors, searchTerm, selectedCategoryFilter, selectedRatingFilter, selectedStatusFilter, sortBy]);

  // Category counts for categories tab
  const categoryVendorCounts = useMemo(() => {
    const counts = {};
    vendors.forEach(v => {
      const catId = v.categoryId?._id || v.categoryId;
      if (catId) counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [vendors]);

  // Rating Badge Styling
  const getRatingBadge = (rating = 'C') => {
    const r = rating.toUpperCase();
    if (r === 'A') {
      return {
        bg: '#ecfdf5',
        color: '#065f46',
        border: '1px solid #a7f3d0',
        label: 'Grade A — Prime Mill / Best Quality',
        pill: 'Grade A (Prime)'
      };
    }
    if (r === 'B') {
      return {
        bg: '#eff6ff',
        color: '#1e40af',
        border: '1px solid #bfdbfe',
        label: 'Grade B — Approved Standard',
        pill: 'Grade B (Standard)'
      };
    }
    if (r === 'C') {
      return {
        bg: '#fffbeb',
        color: '#b45309',
        border: '1px solid #fde68a',
        label: 'Grade C — Under Monitoring',
        pill: 'Grade C (Monitored)'
      };
    }
    return {
      bg: '#fef2f2',
      color: '#b91c1c',
      border: '1px solid #fecaca',
      label: 'Grade D — Restricted / Review',
      pill: 'Grade D (Restricted)'
    };
  };

  // Color helper for vendor category
  const getCategoryBadge = (catName = '') => {
    const lower = catName.toLowerCase();
    if (lower.includes('steel') || lower.includes('raw')) {
      return { bg: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' };
    }
    if (lower.includes('tooling') || lower.includes('job')) {
      return { bg: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
    }
    if (lower.includes('consumable')) {
      return { bg: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' };
    }
    return { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="vendor-master-hub">
      {/* ═══════════ 1. PROCUREMENT COMMAND DECK HEADER ═══════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #131720 0%, #1e2430 45%, #2a3242 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        color: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.24)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}>
                <Truck size={13} /> Direct Material Supply Base
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                IATF 16949 Section 8.4 Qualified Sources
              </span>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Approved Supplier Directory & Vendor Intelligence
            </h1>
            <p style={{ fontSize: 13.5, color: '#94a3b8', margin: '8px 0 0', lineHeight: 1.5 }}>
              Central supplier master governing direct automotive steel coils, rod bar stock, heat treatment job work, and plant consumables. Purchase orders, inbound GRN receipts, and accounts payable check statutory GSTIN and lead times against these verified vendors.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {activeTab === 'vendors' && (
              <button
                type="button"
                onClick={exportVendorsCsv}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                title="Download verified supplier list with GSTIN & Lead Times"
              >
                <Download size={14} /> Export CSV
              </button>
            )}

            <button
              type="button"
              onClick={openCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#fff',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
                transition: 'transform 0.15s ease'
              }}
            >
              <Plus size={16} /> {activeTab === 'vendors' ? 'Register New Supplier' : 'Add Supplier Category'}
            </button>
          </div>
        </div>

        {/* ═══════════ 2. SUPPLY BASE TELEMETRY STRIP ═══════════ */}
        {activeTab === 'vendors' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            marginTop: 22,
            paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Tile 1: Total Supply Base */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em' }}>
                Qualified Supply Base
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                {supplyBaseStats.totalCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#38bdf8' }}>({supplyBaseStats.activeCount} Active)</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 3 }}>
                {supplyBaseStats.inactiveCount > 0 ? `${supplyBaseStats.inactiveCount} blocked suppliers` : 'All vendors active & qualified'}
              </div>
            </div>

            {/* Tile 2: Prime Rated Suppliers (Grade A) */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#34d399', letterSpacing: '0.04em' }}>
                Grade-A Prime Mills
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
                {supplyBaseStats.gradeACount} <span style={{ fontSize: 13, fontWeight: 500, color: '#a7f3d0' }}>Suppliers</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 3 }}>
                Tata Steel, JSW, Ador Welding
              </div>
            </div>

            {/* Tile 3: Direct Steel Mills & Processors */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '0.04em' }}>
                Steel & Coil Mills
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
                {supplyBaseStats.steelVendorsCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#fde68a' }}>Sources</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 3 }}>
                Jindal, SAIL, Tata, JSW, Kalyani
              </div>
            </div>

            {/* Tile 4: Average Inbound Lead Time */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#f97316', letterSpacing: '0.04em' }}>
                Average Inbound Lead Time
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f97316', marginTop: 4 }}>
                {supplyBaseStats.avgLeadTime} <span style={{ fontSize: 13, fontWeight: 500, color: '#fdba74' }}>Days</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 3 }}>
                From PO dispatch to plant dock receipt
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════ 3. TABS & FILTER CONTROLS ═══════════ */}
      <div style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14
      }}>
        {/* Module Tab Switcher */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-pill)', padding: 3 }}>
          <button
            type="button"
            onClick={() => setActiveTab('vendors')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'vendors' ? '#d97706' : 'transparent',
              color: activeTab === 'vendors' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Truck size={14} /> Suppliers ({vendors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'categories' ? '#d97706' : 'transparent',
              color: activeTab === 'categories' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Tag size={14} /> Supplier Categories ({categories.length})
          </button>
        </div>

        {/* View Mode & Filter Controls */}
        {activeTab === 'vendors' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            {/* Live Search */}
            <div style={{ position: 'relative', minWidth: 240, maxWidth: 360, width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search vendor, code, GSTIN, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 34px',
                  fontSize: 12.5,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 2 }}>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('ALL')}
                style={{
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedCategoryFilter === 'ALL' ? 'var(--surface-raised)' : 'transparent',
                  color: selectedCategoryFilter === 'ALL' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: selectedCategoryFilter === 'ALL' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('STEEL')}
                style={{
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedCategoryFilter === 'STEEL' ? '#f1f5f9' : 'transparent',
                  color: selectedCategoryFilter === 'STEEL' ? '#0f172a' : 'var(--text-muted)',
                  boxShadow: selectedCategoryFilter === 'STEEL' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                Steel Mills
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('JOBWORK')}
                style={{
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedCategoryFilter === 'JOBWORK' ? '#fef3c7' : 'transparent',
                  color: selectedCategoryFilter === 'JOBWORK' ? '#92400e' : 'var(--text-muted)',
                  boxShadow: selectedCategoryFilter === 'JOBWORK' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                Job Work
              </button>
            </div>

            {/* Rating Filter */}
            <select
              value={selectedRatingFilter}
              onChange={(e) => setSelectedRatingFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Ratings</option>
              <option value="A">Grade A (Best)</option>
              <option value="B">Grade B (Good)</option>
              <option value="C">Grade C (Average)</option>
              <option value="D">Grade D (Poor)</option>
            </select>

            {/* View Mode Switcher: Cards vs Table */}
            <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 2 }}>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Vendor Scorecard Grid"
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'cards' ? 'var(--surface-raised)' : 'transparent',
                  color: viewMode === 'cards' ? '#d97706' : 'var(--text-muted)',
                  boxShadow: viewMode === 'cards' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Procurement Directory Table"
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'table' ? 'var(--surface-raised)' : 'transparent',
                  color: viewMode === 'table' ? '#d97706' : 'var(--text-muted)',
                  boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ 4. TAB CONTENT: SUPPLIERS (CARDS OR TABLE) ═══════════ */}
      {activeTab === 'vendors' && (
        <>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading approved supplier directory...
            </div>
          ) : filteredVendors.length === 0 ? (
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <Factory size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                No suppliers match your filter criteria
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 16px' }}>
                {searchTerm ? `No suppliers matching "${searchTerm}". Try resetting your filter.` : 'Register your first material or tooling supplier.'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreate}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto', background: '#d97706' }}
              >
                <Plus size={14} /> Register Supplier
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* ── VIEW A: VENDOR SCORECARD TILES ── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16
            }}>
              {filteredVendors.map(vendor => {
                const ratingBadge = getRatingBadge(vendor.rating);
                const catBadge = getCategoryBadge(vendor.categoryId?.name);
                const isActive = vendor.isActive !== false && vendor.status !== 'Inactive';
                const initials = vendor.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

                return (
                  <div
                    key={vendor._id}
                    onClick={() => setSelectedDossier(vendor)}
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-sm)',
                      padding: '18px 20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      e.currentTarget.style.borderColor = '#f59e0b';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <div>
                      {/* Card Header: Rating Avatar, Name, Code & Status */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Rating Emblem Avatar */}
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--radius-md)',
                            background: ratingBadge.bg,
                            border: ratingBadge.border,
                            color: ratingBadge.color,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            <span style={{ fontSize: 16, lineHeight: 1 }}>{vendor.rating || 'C'}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Grade</span>
                          </div>

                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                              {vendor.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                                {vendor.code}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 'var(--radius-pill)', background: catBadge.bg, color: catBadge.color, border: catBadge.border }}>
                                {vendor.categoryId?.name || 'Supplier'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Chip */}
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          background: isActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                          color: isActive ? '#059669' : '#64748b',
                          flexShrink: 0
                        }}>
                          {isActive ? 'Active' : 'Blocked'}
                        </span>
                      </div>

                      {/* Lead Time & Sourcing Terms Strip */}
                      <div style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        marginBottom: 12,
                        border: '1px solid var(--border-subtle)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10
                      }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inbound Lead Time</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={14} /> {vendor.leadTimeDays || 0} Days
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Payment Terms</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 3 }}>
                            {vendor.paymentTermsId?.name || 'Net 30 Days'}
                          </div>
                        </div>
                      </div>

                      {/* Statutory & Contact Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                        {vendor.gst && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                              <ShieldCheck size={13} style={{ color: '#059669' }} /> GSTIN:
                            </span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <code style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                                {vendor.gst}
                              </code>
                              <button
                                type="button"
                                onClick={(e) => handleCopyGst(vendor.gst, vendor._id, e)}
                                title="Copy GSTIN"
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, color: copiedGstId === vendor._id ? '#059669' : 'var(--text-muted)' }}
                              >
                                {copiedGstId === vendor._id ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        )}

                        {vendor.contactPerson && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>Contact: <strong>{vendor.contactPerson}</strong></span>
                          </div>
                        )}

                        {vendor.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{vendor.phone}</span>
                          </div>
                        )}

                        {vendor.address && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                              {vendor.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 14,
                      paddingTop: 10,
                      borderTop: '1px solid var(--border-subtle)'
                    }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDossier(vendor);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#d97706',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <Eye size={13} /> View 360 Scorecard
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={(e) => handleEdit(vendor, e)}
                          title="Edit Supplier"
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleStatus(vendor, e)}
                          title={isActive ? 'Deactivate / Block' : 'Activate Supplier'}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: isActive ? '#dc2626' : '#059669',
                            cursor: 'pointer'
                          }}
                        >
                          {isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── VIEW B: PROCUREMENT DIRECTORY TABLE ── */
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Supplier Name & Code</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Category</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Quality Rating</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Inbound Lead Time</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>GSTIN / Tax ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Payment Terms</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Contact Person</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.map((vendor, idx) => {
                      const ratingBadge = getRatingBadge(vendor.rating);
                      const catBadge = getCategoryBadge(vendor.categoryId?.name);
                      const isActive = vendor.isActive !== false && vendor.status !== 'Inactive';

                      return (
                        <tr
                          key={vendor._id}
                          onClick={() => setSelectedDossier(vendor)}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            background: idx % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent'; }}
                        >
                          {/* Name & Code */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{vendor.name}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{vendor.code}</div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: catBadge.bg, color: catBadge.color, border: catBadge.border }}>
                              {vendor.categoryId?.name || '—'}
                            </span>
                          </td>

                          {/* Rating Badge */}
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              background: ratingBadge.bg,
                              color: ratingBadge.color,
                              border: ratingBadge.border
                            }}>
                              Grade {vendor.rating || 'C'}
                            </span>
                          </td>

                          {/* Lead Time */}
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f59e0b' }}>
                            {vendor.leadTimeDays || 0} Days
                          </td>

                          {/* GSTIN */}
                          <td style={{ padding: '12px 16px' }}>
                            {vendor.gst ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <code style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{vendor.gst}</code>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyGst(vendor.gst, vendor._id, e)}
                                  title="Copy GSTIN"
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: copiedGstId === vendor._id ? '#059669' : 'var(--text-muted)' }}
                                >
                                  {copiedGstId === vendor._id ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                            )}
                          </td>

                          {/* Payment Terms */}
                          <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {vendor.paymentTermsId?.name || 'Net 30 Days'}
                          </td>

                          {/* Contact Person */}
                          <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {vendor.contactPerson || '—'}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              background: isActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                              color: isActive ? '#059669' : '#64748b'
                            }}>
                              {isActive ? 'Active' : 'Blocked'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedDossier(vendor); }}
                                title="View 360 Scorecard"
                                style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: '#d97706', cursor: 'pointer' }}
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleEdit(vendor, e)}
                                title="Edit Record"
                                style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => toggleStatus(vendor, e)}
                                title={isActive ? 'Deactivate' : 'Activate'}
                                style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: isActive ? '#dc2626' : '#059669', cursor: 'pointer' }}
                              >
                                {isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ 5. TAB CONTENT: SUPPLIER CATEGORIES ═══════════ */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Supplier Sourcing Classifications
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                Group vendors into Steel Mills, Subcontract Tooling & Heat Treaters, and Consumables to manage MRP recommendations and inbound inspection gates.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: '#d97706',
                color: '#fff',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Add Supplier Category
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16
          }}>
            {categories.map(category => {
              const vendorCount = categoryVendorCounts[category._id] || 0;
              const catBadge = getCategoryBadge(category.name);
              const isActive = category.isActive !== false && category.status !== 'Inactive';

              return (
                <div
                  key={category._id}
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        background: catBadge.bg,
                        color: catBadge.color,
                        border: catBadge.border
                      }}>
                        {category.name}
                      </span>

                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: isActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                        color: isActive ? '#059669' : '#64748b'
                      }}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', minHeight: 38, margin: 0, lineHeight: 1.45 }}>
                      {category.description || 'Standard procurement sourcing group for steel raw materials, bought-out components, and subcontract operations.'}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      🏭 {vendorCount} {vendorCount === 1 ? 'Supplier' : 'Suppliers'} assigned
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={(e) => handleEdit(category, e)}
                        title="Edit Category"
                        style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => toggleStatus(category, e)}
                        title={isActive ? 'Deactivate' : 'Activate'}
                        style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: isActive ? '#dc2626' : '#059669', cursor: 'pointer' }}
                      >
                        {isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════ 6. VENDOR 360 SLIDE-OVER DOSSIER DRAWER ═══════════ */}
      {selectedDossier && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
          backdropFilter: 'blur(3px)'
        }} onClick={() => setSelectedDossier(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              height: '100%',
              background: 'var(--surface-raised)',
              boxShadow: '-8px 0 24px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              borderLeft: '1px solid var(--border-subtle)'
            }}
          >
            {/* Drawer Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#d97706', color: '#fff' }}>
                    {selectedDossier.code}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-pill)',
                    background: getRatingBadge(selectedDossier.rating).bg,
                    color: getRatingBadge(selectedDossier.rating).color,
                    border: getRatingBadge(selectedDossier.rating).border
                  }}>
                    Grade {selectedDossier.rating || 'C'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    {selectedDossier.categoryId?.name || 'Supplier'}
                  </span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {selectedDossier.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Inbound Logistics & Quality Block */}
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d97706', marginBottom: 12 }}>
                  Quality Rating & Inbound Logistics
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Vendor Quality Tier</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: getRatingBadge(selectedDossier.rating).color, marginTop: 2 }}>
                      {getRatingBadge(selectedDossier.rating).label}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Standard Delivery Lead Time</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={15} /> {selectedDossier.leadTimeDays || 0} Days from PO
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Payment Terms</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                      {selectedDossier.paymentTermsId?.name || 'Net 30 Days'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Transaction Currency</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                      {selectedDossier.currencyId?.name || 'INR (Indian Rupee - ₹)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory & Tax Registration Block */}
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669', marginBottom: 12 }}>
                  Statutory & Tax Credentials
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>GSTIN Identification:</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <code style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', background: 'var(--surface-raised)', padding: '2px 8px', borderRadius: 4 }}>
                        {selectedDossier.gst || 'Not registered'}
                      </code>
                      {selectedDossier.gst && (
                        <button
                          type="button"
                          onClick={() => handleCopyGst(selectedDossier.gst, selectedDossier._id)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: copiedGstId === selectedDossier._id ? '#059669' : 'var(--text-muted)' }}
                        >
                          {copiedGstId === selectedDossier._id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Permanent Account No (PAN):</span>
                    <code style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', background: 'var(--surface-raised)', padding: '2px 8px', borderRadius: 4 }}>
                      {selectedDossier.pan || '—'}
                    </code>
                  </div>
                </div>
              </div>

              {/* Contact Information & Dispatch Plant */}
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Contact Representative & Plant Address
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                  {selectedDossier.contactPerson && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-primary)' }}>Contact: <strong>{selectedDossier.contactPerson}</strong></span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{selectedDossier.phone || 'No direct phone recorded'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{selectedDossier.email || 'No dispatch email recorded'}</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 4 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Dispatch Factory & Works Location:
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {selectedDossier.address || 'No physical plant address recorded.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Procurement Launchers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Quick Procurement Actions
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/procurement/po?vendorId=${selectedDossier._id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-raised)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>Issue Purchase Order to {selectedDossier.name}</span>
                  <ArrowUpRight size={15} style={{ color: '#d97706' }} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/finance/ap?vendorId=${selectedDossier._id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-raised)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>View Accounts Payable Ledger</span>
                  <ArrowUpRight size={15} style={{ color: '#059669' }} />
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{
              marginTop: 'auto',
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <button
                type="button"
                onClick={() => toggleStatus(selectedDossier)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-raised)',
                  color: selectedDossier.isActive !== false ? '#dc2626' : '#059669',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {selectedDossier.isActive !== false ? 'Deactivate Supplier' : 'Activate Supplier'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const vend = selectedDossier;
                  setSelectedDossier(null);
                  handleEdit(vend);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: '#d97706',
                  color: '#fff',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Edit2 size={13} /> Edit Full Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ 7. REGISTER / EDIT MODAL ═══════════ */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: activeTab === 'vendors' ? 760 : 480,
            maxHeight: '90vh',
            background: 'var(--surface-raised)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {editingId ? 'Edit' : 'Register'} {activeTab === 'vendors' ? 'Supplier Record' : 'Supplier Category'}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {activeTab === 'vendors' ? 'Direct raw material mill, job worker or bought-out component vendor' : 'Group suppliers for procurement & MRP requisition routing'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeTab === 'vendors' ? (
                  <>
                    {/* Row 1: Legal Name & Code */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Supplier Legal Business Name <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tata Steel Ltd / JSW Steel Coils"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Supplier Code <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          readOnly={Boolean(editingId)}
                          value={formData.code || ''}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 700,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: editingId ? 'rgba(0,0,0,0.04)' : 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Row 2: Category & Rating */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Supplier Category <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <select
                          required
                          value={formData.categoryId || ''}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <option value="" disabled>Select Sourcing Category</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                        {categories.length === 0 && (
                          <p style={hintStyle}>No categories found. Create one under the Supplier Categories tab.</p>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Quality Rating Tier
                        </label>
                        <select
                          value={formData.rating || 'C'}
                          onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 600,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <option value="A">Grade A — Prime Mill / Best Quality</option>
                          <option value="B">Grade B — Approved Standard</option>
                          <option value="C">Grade C — Monitored</option>
                          <option value="D">Grade D — Under Review</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 3: Statutory GSTIN & PAN */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          GSTIN Identification
                        </label>
                        <input
                          type="text"
                          maxLength={15}
                          placeholder="e.g. 33AABCL1234H1Z5"
                          value={formData.gst || ''}
                          onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase().replace(/\s/g, '') })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          PAN Number
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="e.g. AABCL1234H"
                          value={formData.pan || ''}
                          onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase().replace(/\s/g, '') })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Row 4: Lead Time, Payment Terms & Currency */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Inbound Lead Time (Days)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={formData.leadTimeDays ?? ''}
                          onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            fontWeight: 700,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Payment Terms
                        </label>
                        <select
                          value={formData.paymentTermsId || ''}
                          onChange={(e) => setFormData({ ...formData, paymentTermsId: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <option value="">Standard (Net 30)</option>
                          {paymentTerms.length > 0 ? paymentTerms.map((p) => (
                            <option key={p._id} value={p._id}>{p.name} ({p.code || ''})</option>
                          )) : (
                            <>
                              <option value="NET30">Net 30 Days</option>
                              <option value="NET60">Net 60 Days</option>
                              <option value="NET90">Net 90 Days</option>
                              <option value="IMMEDIATE">Immediate / COD</option>
                              <option value="ADVANCE">100% Advance</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Currency
                        </label>
                        <select
                          value={formData.currencyId || ''}
                          onChange={(e) => setFormData({ ...formData, currencyId: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <option value="">INR (Indian Rupee - ₹)</option>
                          {currencies.map((c) => (
                            <option key={c._id} value={c._id}>{c.name} ({c.symbol || c.code})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 5: Contact Person, Phone & Email */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Contact Person
                        </label>
                        <input
                          type="text"
                          placeholder="Key Account Mgr"
                          value={formData.contactPerson || ''}
                          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Direct Phone
                        </label>
                        <input
                          type="text"
                          placeholder="+91 98400 56789"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Order Dispatch Email
                        </label>
                        <input
                          type="email"
                          placeholder="orders@vendor.com"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 13,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Row 6: Works / Plant Address */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                        Works & Plant Dispatch Address
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Factory Works, Industrial Area, City, State, PIN"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: 12.5,
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </>
                ) : (
                  /* Categories Form */
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                        Supplier Category Name <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Steel Supplier, Tooling & Job Work, Fasteners"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: 13,
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                        Sourcing Scope & Description
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe raw material specifications, minimum order quantity rules, or subcontract processing scopes."
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: 12.5,
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-raised)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: '#d97706',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Saving...' : editingId ? `Update ${activeTab === 'vendors' ? 'Supplier' : 'Category'}` : `Save ${activeTab === 'vendors' ? 'Supplier' : 'Category'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMaster;