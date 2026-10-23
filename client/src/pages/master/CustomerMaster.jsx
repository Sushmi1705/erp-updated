import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Building2, ShieldCheck, CreditCard, Plus, Search, Filter,
  Download, LayoutGrid, List, Eye, Edit2, Copy, Check, CheckCircle2,
  XCircle, ExternalLink, MapPin, Phone, Mail, FileText, TrendingUp,
  Briefcase, Tag, ChevronRight, ArrowUpRight, HelpCircle, Clock,
  Sparkles, X, ChevronDown, CheckCircle, AlertTriangle, Landmark, Award
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

/* Guidance / Hint style */
const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: '12px',
  marginTop: '4px',
  lineHeight: 1.4
};

const formatIndianCurrency = (val) => {
  const num = Number(val) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const CustomerMaster = () => {
  const navigate = useNavigate();

  // Primary navigation tabs: 'customers' | 'categories'
  const [activeTab, setActiveTab] = useState('customers');

  // View mode for customers: 'cards' (Customer 360 Tiles) vs 'table' (Enterprise Directory)
  const [viewMode, setViewMode] = useState('cards');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'code' | 'creditLimit' | 'category'

  // Data state
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null); // Customer 360 Slide-Over
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
    fetchUsers();
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/master/customercategory?limit=200&includeInactive=true');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
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

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users/directory');
      setUsers(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching user directory:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'customers') {
        const res = await axios.get('/master/customer?limit=200&includeInactive=true');
        setCustomers(res.data?.data || []);
      } else {
        const res = await axios.get('/master/customercategory?limit=200&includeInactive=true');
        setCategories(res.data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      notify.error('Could not load data. Please refresh.');
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
    notify.success(`GSTIN ${gst} copied to clipboard`);
  };

  // Open Create
  const openCreate = () => {
    if (activeTab === 'customers') {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const codeNum = String(customers.length + 1).padStart(3, '0');
      setFormData({
        code: `CUST-${codeNum}`,
        currencyId: currencies.find(c => c.code === 'INR')?._id || '',
        paymentTermsId: paymentTerms.find(p => p.code?.includes('30') || p.name?.includes('30'))?._id || '',
        creditLimit: 2500000,
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

  // Open Edit
  const handleEdit = (row, e) => {
    if (e) e.stopPropagation();
    setFormData({
      ...row,
      categoryId: row.categoryId?._id || row.categoryId || '',
      currencyId: row.currencyId?._id || row.currencyId || '',
      paymentTermsId: row.paymentTermsId?._id || row.paymentTermsId || '',
      salesPersonId: row.salesPersonId?._id || row.salesPersonId || ''
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  // Toggle Active/Inactive Status
  const toggleStatus = async (row, e) => {
    if (e) e.stopPropagation();
    const isActivating = !row.isActive && row.status !== 'Active';
    if (!isActivating && !(await confirmAction(`Are you sure you want to deactivate ${row.name}? Deactivated clients will not appear in sales dispatch queues.`))) {
      return;
    }

    try {
      const endpoint = activeTab === 'customers' ? '/master/customer' : '/master/customercategory';
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
      const endpoint = activeTab === 'customers' ? '/master/customer' : '/master/customercategory';
      const payload = { ...formData };

      if (activeTab === 'categories') {
        delete payload.code;
      } else {
        if (!payload.currencyId) delete payload.currencyId;
        if (!payload.paymentTermsId) delete payload.paymentTermsId;
        if (!payload.salesPersonId) delete payload.salesPersonId;
        if (!payload.gst || payload.gst.trim() === '') delete payload.gst;
        if (!payload.pan || payload.pan.trim() === '') delete payload.pan;
      }

      if (editingId) {
        await axios.put(`${endpoint}/${editingId}`, payload);
        notify.success(`${activeTab === 'customers' ? 'Customer' : 'Category'} updated successfully`);
      } else {
        await axios.post(endpoint, payload);
        notify.success(`${activeTab === 'customers' ? 'Customer' : 'Category'} created successfully`);
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

  // Copy billing to shipping address
  const copyBillingToShipping = () => {
    if (formData.billingAddress) {
      setFormData(prev => ({ ...prev, shippingAddress: prev.billingAddress }));
      notify.info('Copied Billing Address to Shipping Address');
    }
  };

  // Export Customers to CSV
  const exportCustomersCsv = () => {
    if (!customers || customers.length === 0) return;
    const headers = ['Code', 'Customer Name', 'Category', 'Credit Limit', 'GSTIN', 'PAN', 'Phone', 'Email', 'Payment Terms', 'Sales Person', 'Status', 'Billing Address'];
    const rows = customers.map(c => [
      `"${c.code || ''}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.categoryId?.name || ''}"`,
      c.creditLimit || 0,
      `"${c.gst || ''}"`,
      `"${c.pan || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.paymentTermsId?.name || ''}"`,
      `"${c.salesPersonId ? `${c.salesPersonId.firstName || ''} ${c.salesPersonId.lastName || ''}`.trim() : ''}"`,
      `"${c.status || (c.isActive ? 'Active' : 'Inactive')}"`,
      `"${(c.billingAddress || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Precision_ERP_Customer_Master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Customer registry exported to CSV');
  };

  // Analytics & Aggregates
  const portfolioStats = useMemo(() => {
    const totalCount = customers.length;
    const activeCount = customers.filter(c => c.isActive !== false && c.status !== 'Inactive').length;
    const inactiveCount = totalCount - activeCount;

    const oemCount = customers.filter(c => (c.categoryId?.name || '').toLowerCase().includes('oem')).length;
    const tier1Count = customers.filter(c => (c.categoryId?.name || '').toLowerCase().includes('tier')).length;
    const totalCreditLimit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
    const avgCreditLimit = totalCount > 0 ? Math.round(totalCreditLimit / totalCount) : 0;

    return {
      totalCount,
      activeCount,
      inactiveCount,
      oemCount,
      tier1Count,
      totalCreditLimit,
      avgCreditLimit
    };
  }, [customers]);

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Search match
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.gst || '').toLowerCase().includes(q) ||
        (c.pan || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.categoryId?.name || '').toLowerCase().includes(q);

      // Category filter
      const matchCat = selectedCategoryFilter === 'ALL' ||
        (selectedCategoryFilter === 'OEM' && (c.categoryId?.name || '').toLowerCase().includes('oem')) ||
        (selectedCategoryFilter === 'TIER1' && (c.categoryId?.name || '').toLowerCase().includes('tier')) ||
        (c.categoryId?._id === selectedCategoryFilter);

      // Status filter
      const isActive = c.isActive !== false && c.status !== 'Inactive';
      const matchStatus = selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ACTIVE' && isActive) ||
        (selectedStatusFilter === 'INACTIVE' && !isActive);

      return matchSearch && matchCat && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'creditLimit') return (b.creditLimit || 0) - (a.creditLimit || 0);
      if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
      if (sortBy === 'category') return (a.categoryId?.name || '').localeCompare(b.categoryId?.name || '');
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [customers, searchTerm, selectedCategoryFilter, selectedStatusFilter, sortBy]);

  // Category counts for categories tab
  const categoryCustomerCounts = useMemo(() => {
    const counts = {};
    customers.forEach(c => {
      const catId = c.categoryId?._id || c.categoryId;
      if (catId) counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [customers]);

  // Color helper for category badges
  const getCategoryStyle = (catName = '') => {
    const lower = catName.toLowerCase();
    if (lower.includes('oem')) {
      return {
        bg: '#eff6ff',
        color: '#1e40af',
        border: '1px solid #bfdbfe',
        badge: 'OEM Client'
      };
    }
    if (lower.includes('tier-1') || lower.includes('tier 1')) {
      return {
        bg: '#ecfdf5',
        color: '#065f46',
        border: '1px solid #a7f3d0',
        badge: 'Tier-1 Partner'
      };
    }
    if (lower.includes('export')) {
      return {
        bg: '#f5f3ff',
        color: '#6d28d9',
        border: '1px solid #ddd6fe',
        badge: 'Export Partner'
      };
    }
    return {
      bg: 'var(--bg-secondary)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-subtle)',
      badge: catName || 'General Client'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="customer-master-hub">
      {/* ═══════════ 1. COMMERCIAL COMMAND HEADER ═══════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #090e17 0%, #0f172a 45%, #1e293b 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        color: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}>
                <Award size={13} /> Automotive Client Registry
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                IATF 16949 / ISO 9001 Approved Partners
              </span>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Commercial Accounts & Customer Registry
            </h1>
            <p style={{ fontSize: 13.5, color: '#94a3b8', margin: '8px 0 0', lineHeight: 1.5 }}>
              Central repository of automobile OEMs, Tier-1 system assemblers, and institutional buyers. Sales, production dispatch, and accounts receivable validate GSTIN, delivery gate, and credit limits from this master record.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {activeTab === 'customers' && (
              <button
                type="button"
                onClick={exportCustomersCsv}
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
                title="Download full customer directory with GSTIN & Credit Limits"
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
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                transition: 'transform 0.15s ease'
              }}
            >
              <Plus size={16} /> {activeTab === 'customers' ? 'Register New Customer' : 'Add Customer Category'}
            </button>
          </div>
        </div>

        {/* ═══════════ 2. COMMERCIAL PORTFOLIO TELEMETRY TILES ═══════════ */}
        {activeTab === 'customers' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            marginTop: 22,
            paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Tile 1: Total Portfolio */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em' }}>
                Commercial Accounts
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                {portfolioStats.totalCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#38bdf8' }}>({portfolioStats.activeCount} Active)</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 3 }}>
                {portfolioStats.inactiveCount > 0 ? `${portfolioStats.inactiveCount} inactive accounts` : 'All accounts verified active'}
              </div>
            </div>

            {/* Tile 2: Key OEM Accounts */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#60a5fa', letterSpacing: '0.04em' }}>
                Automotive OEMs
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#60a5fa', marginTop: 4 }}>
                {portfolioStats.oemCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#93c5fd' }}>Key Clients</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 3 }}>
                Yamaha, Caterpillar, Bosch, Titan
              </div>
            </div>

            {/* Tile 3: Tier-1 Integrators */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#34d399', letterSpacing: '0.04em' }}>
                Tier-1 Automotive Partners
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
                {portfolioStats.tier1Count} <span style={{ fontSize: 13, fontWeight: 500, color: '#a7f3d0' }}>Partners</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 3 }}>
                Sundram, Brakes India, Lucas-TVS
              </div>
            </div>

            {/* Tile 4: Approved Credit Line */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '0.04em' }}>
                Approved Credit Exposure
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
                {formatIndianCurrency(portfolioStats.totalCreditLimit)}
              </div>
              <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 3 }}>
                Avg limit: {formatIndianCurrency(portfolioStats.avgCreditLimit)} / client
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════ 3. NAVIGATION TABS & FILTER BAR ═══════════ */}
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
            onClick={() => setActiveTab('customers')}
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
              background: activeTab === 'customers' ? '#1e40af' : 'transparent',
              color: activeTab === 'customers' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={14} /> Customers ({customers.length})
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
              background: activeTab === 'categories' ? '#1e40af' : 'transparent',
              color: activeTab === 'categories' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Tag size={14} /> Customer Categories ({categories.length})
          </button>
        </div>

        {/* View Mode & Search for Customers */}
        {activeTab === 'customers' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            {/* Live Search Input */}
            <div style={{ position: 'relative', minWidth: 240, maxWidth: 360, width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by client, code, GSTIN..."
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
                onClick={() => setSelectedCategoryFilter('OEM')}
                style={{
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedCategoryFilter === 'OEM' ? '#eff6ff' : 'transparent',
                  color: selectedCategoryFilter === 'OEM' ? '#1e40af' : 'var(--text-muted)',
                  boxShadow: selectedCategoryFilter === 'OEM' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                OEMs
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('TIER1')}
                style={{
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedCategoryFilter === 'TIER1' ? '#ecfdf5' : 'transparent',
                  color: selectedCategoryFilter === 'TIER1' ? '#065f46' : 'var(--text-muted)',
                  boxShadow: selectedCategoryFilter === 'TIER1' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                Tier-1s
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
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
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* View Mode Toggle: Cards vs Table */}
            <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 2 }}>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Customer 360 Card View"
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'cards' ? 'var(--surface-raised)' : 'transparent',
                  color: viewMode === 'cards' ? '#1e40af' : 'var(--text-muted)',
                  boxShadow: viewMode === 'cards' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Commercial Directory Table"
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'table' ? 'var(--surface-raised)' : 'transparent',
                  color: viewMode === 'table' ? '#1e40af' : 'var(--text-muted)',
                  boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ 4. TAB CONTENT: CUSTOMERS (CARDS OR TABLE) ═══════════ */}
      {activeTab === 'customers' && (
        <>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading commercial customer accounts...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <Building2 size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                No customers match your filter
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 16px' }}>
                {searchTerm ? `No records matching "${searchTerm}". Try resetting your search.` : 'Get started by registering your first automotive customer.'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreate}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
              >
                <Plus size={14} /> Register Customer
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* ── VIEW A: CUSTOMER 360 CARDS GRID ── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16
            }}>
              {filteredCustomers.map(customer => {
                const catStyle = getCategoryStyle(customer.categoryId?.name);
                const isActive = customer.isActive !== false && customer.status !== 'Inactive';
                const initials = customer.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

                return (
                  <div
                    key={customer._id}
                    onClick={() => setSelectedDossier(customer)}
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
                      e.currentTarget.style.borderColor = '#93c5fd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    {/* Card Header: Avatar, Name, Code & Badges */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Client Avatar */}
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--radius-md)',
                            background: catStyle.bg,
                            border: catStyle.border,
                            color: catStyle.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 15,
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>

                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                              {customer.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                                {customer.code}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 'var(--radius-pill)', background: catStyle.bg, color: catStyle.color, border: catStyle.border }}>
                                {customer.categoryId?.name || 'General'}
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
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Commercial Exposure Strip */}
                      <div style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        marginBottom: 12,
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)' }}>
                          <span>Approved Credit Limit</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {customer.paymentTermsId?.name || 'Net 30 Days'}
                          </span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                          {formatIndianCurrency(customer.creditLimit || 0)}
                        </div>
                        {/* Subtle credit bar */}
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginTop: 6 }}>
                          <div style={{ width: `${Math.min(((customer.creditLimit || 0) / 5000000) * 100, 100)}%`, height: '100%', background: '#3b82f6', borderRadius: 2 }} />
                        </div>
                      </div>

                      {/* Statutory & Location Chips */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                        {customer.gst && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                              <ShieldCheck size={13} style={{ color: '#059669' }} /> GSTIN:
                            </span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <code style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                                {customer.gst}
                              </code>
                              <button
                                type="button"
                                onClick={(e) => handleCopyGst(customer.gst, customer._id, e)}
                                title="Copy GSTIN"
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, color: copiedGstId === customer._id ? '#059669' : 'var(--text-muted)' }}
                              >
                                {copiedGstId === customer._id ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        )}

                        {customer.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{customer.phone}</span>
                          </div>
                        )}

                        {customer.billingAddress && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 260
                            }}>
                              {customer.billingAddress}
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
                          setSelectedDossier(customer);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#1e40af',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <Eye size={13} /> View 360 Dossier
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={(e) => handleEdit(customer, e)}
                          title="Edit Customer"
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
                          onClick={(e) => toggleStatus(customer, e)}
                          title={isActive ? 'Deactivate' : 'Activate'}
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
            /* ── VIEW B: COMMERCIAL DIRECTORY TABLE ── */
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
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Customer Name & Code</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Category</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Approved Credit Limit</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>GSTIN / Tax ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Payment Terms</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Sales Person</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer, idx) => {
                      const catStyle = getCategoryStyle(customer.categoryId?.name);
                      const isActive = customer.isActive !== false && customer.status !== 'Inactive';

                      return (
                        <tr
                          key={customer._id}
                          onClick={() => setSelectedDossier(customer)}
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
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.name}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{customer.code}</div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: catStyle.bg, color: catStyle.color, border: catStyle.border }}>
                              {customer.categoryId?.name || '—'}
                            </span>
                          </td>

                          {/* Credit Limit */}
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            {formatIndianCurrency(customer.creditLimit || 0)}
                          </td>

                          {/* GSTIN */}
                          <td style={{ padding: '12px 16px' }}>
                            {customer.gst ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <code style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{customer.gst}</code>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyGst(customer.gst, customer._id, e)}
                                  title="Copy GSTIN"
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: copiedGstId === customer._id ? '#059669' : 'var(--text-muted)' }}
                                >
                                  {copiedGstId === customer._id ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                            )}
                          </td>

                          {/* Payment Terms */}
                          <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {customer.paymentTermsId?.name || 'Net 30 Days'}
                          </td>

                          {/* Sales Person */}
                          <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {customer.salesPersonId ? `${customer.salesPersonId.firstName || ''} ${customer.salesPersonId.lastName || ''}`.trim() : 'Unassigned'}
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
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedDossier(customer); }}
                                title="View Dossier"
                                style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: '#1e40af', cursor: 'pointer' }}
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleEdit(customer, e)}
                                title="Edit Record"
                                style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => toggleStatus(customer, e)}
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

      {/* ═══════════ 5. TAB CONTENT: CUSTOMER CATEGORIES ═══════════ */}
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
                Customer Classification Categories
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                Group clients into OEMs, Tier-1 automotive integrators, and exports to control pricing markups and delivery SLAs.
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
                background: '#1e40af',
                color: '#fff',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Add Category
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16
          }}>
            {categories.map(category => {
              const custCount = categoryCustomerCounts[category._id] || 0;
              const catStyle = getCategoryStyle(category.name);
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
                        background: catStyle.bg,
                        color: catStyle.color,
                        border: catStyle.border
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
                      {category.description || 'Standard automotive commercial category grouping for sales, dispatch and pricing tier management.'}
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
                      👥 {custCount} {custCount === 1 ? 'Customer' : 'Customers'} assigned
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

      {/* ═══════════ 6. CUSTOMER 360 SLIDE-OVER DOSSIER DRAWER ═══════════ */}
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
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#1e40af', color: '#fff' }}>
                    {selectedDossier.code}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
                    {selectedDossier.categoryId?.name || 'Customer'}
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
              {/* Commercial Terms Block */}
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e40af', marginBottom: 12 }}>
                  Commercial & Credit Terms
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Approved Credit Limit</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                      {formatIndianCurrency(selectedDossier.creditLimit || 0)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Payment Terms</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                      {selectedDossier.paymentTermsId?.name || 'Net 30 Days'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Billing Currency</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                      {selectedDossier.currencyId?.name || 'INR (Indian Rupee - ₹)'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Key Account Sales Person</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                      {selectedDossier.salesPersonId ? `${selectedDossier.salesPersonId.firstName || ''} ${selectedDossier.salesPersonId.lastName || ''}`.trim() : 'Unassigned'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory & Tax Block */}
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669', marginBottom: 12 }}>
                  Statutory & Tax Registration
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

              {/* Contact Information */}
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Contact & Logistics Address
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{selectedDossier.phone || 'No phone recorded'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{selectedDossier.email || 'No email recorded'}</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 4 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Billing Legal Address:
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {selectedDossier.billingAddress || 'No billing address recorded.'}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 4 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Shipping Delivery Gate / Plant Dock:
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {selectedDossier.shippingAddress || selectedDossier.billingAddress || 'Same as billing address.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Transaction Launchers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Quick Commercial Actions
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/sales/salesorders?customerId=${selectedDossier._id}`)}
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
                  <span>Create Sales Order for {selectedDossier.name}</span>
                  <ArrowUpRight size={15} style={{ color: '#1e40af' }} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/finance/ar?customerId=${selectedDossier._id}`)}
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
                  <span>View Accounts Receivable Ledger</span>
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
                {selectedDossier.isActive !== false ? 'Deactivate Customer' : 'Activate Customer'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const cust = selectedDossier;
                  setSelectedDossier(null);
                  handleEdit(cust);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: '#1e40af',
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

      {/* ═══════════ 7. ADD / EDIT STRUCTURED MODAL ═══════════ */}
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
            maxWidth: activeTab === 'customers' ? 760 : 480,
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
                  {editingId ? 'Edit' : 'Register'} {activeTab === 'customers' ? 'Customer Account' : 'Customer Category'}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {activeTab === 'customers' ? 'Automotive OEM / Tier-1 commercial partner configuration' : 'Group clients for pricing and delivery priority'}
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
                {activeTab === 'customers' ? (
                  <>
                    {/* Row 1: Legal Name & Code */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Legal Company / Customer Name <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. India Yamaha Motor Pvt Ltd"
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
                          Customer Code <span style={{ color: '#dc2626' }}>*</span>
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

                    {/* Row 2: Category & Sales Person */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Client Category <span style={{ color: '#dc2626' }}>*</span>
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
                          <option value="" disabled>Select Category</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                        {categories.length === 0 && (
                          <p style={hintStyle}>No categories found. Create one under the Customer Categories tab.</p>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Assigned Key Account Sales Person
                        </label>
                        <select
                          value={formData.salesPersonId || ''}
                          onChange={(e) => setFormData({ ...formData, salesPersonId: e.target.value })}
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
                          <option value="">Select Sales Executive</option>
                          {users.map((u) => (
                            <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>
                          ))}
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

                    {/* Row 4: Credit Limit & Payment Terms */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Credit Limit (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          value={formData.creditLimit ?? ''}
                          onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
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
                        <div style={{ fontSize: 11, color: '#059669', marginTop: 3, fontWeight: 600 }}>
                          Preview: {formatIndianCurrency(formData.creditLimit || 0)}
                        </div>
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

                    {/* Row 5: Email & Phone */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Primary Dispatch Email
                        </label>
                        <input
                          type="email"
                          placeholder="procurement@client.com"
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

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Direct Phone Number
                        </label>
                        <input
                          type="text"
                          placeholder="+91 98400 12345"
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
                    </div>

                    {/* Row 6: Billing & Shipping Address with Copy Helper */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Registered Billing Address
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Plant Plot No, Industrial Area, City, State, PIN"
                          value={formData.billingAddress || ''}
                          onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
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

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                            Shipping Delivery Dock Address
                          </label>
                          <button
                            type="button"
                            onClick={copyBillingToShipping}
                            style={{ fontSize: 11, color: '#1e40af', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Same as Billing
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Receiving Bay / Unloading Gate Address"
                          value={formData.shippingAddress || ''}
                          onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
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
                    </div>
                  </>
                ) : (
                  /* Categories Form */
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                        Category Name <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. OEM, Tier-1 Supplier, Direct Export"
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
                        Description & Strategic Scope
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe customer tier requirements, delivery urgency, or quality certification scope."
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
                    background: '#1e40af',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Saving...' : editingId ? `Update ${activeTab === 'customers' ? 'Customer' : 'Category'}` : `Save ${activeTab === 'customers' ? 'Customer' : 'Category'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMaster;