import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Package, Layers, Cpu, Wrench, Settings2, TrendingUp, Plus, Search, Filter,
  Download, LayoutGrid, List, Eye, Edit2, Copy, Check, CheckCircle2,
  XCircle, Tag, ChevronRight, ArrowUpRight, HelpCircle, Clock,
  Sparkles, X, Award, ShieldCheck, Boxes, FileCode, Compass, DollarSign,
  Percent, BarChart2, CheckCircle, Scale, Building, Warehouse as WarehouseIcon
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

const ProductMaster = () => {
  const navigate = useNavigate();

  // Primary navigation tabs: 'products' | 'categories'
  const [activeTab, setActiveTab] = useState('products');

  // View mode for products: 'cards' (Engineering Blueprint Tiles) vs 'table' (Technical Specs Matrix)
  const [viewMode, setViewMode] = useState('cards');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedLifecycleFilter, setSelectedLifecycleFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Draft' | 'Obsolete'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'code' | 'price' | 'margin' | 'weight'

  // Data state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null); // Product 360 Slide-Over
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [copiedHsnId, setCopiedHsnId] = useState(null);

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
    fetchUoms();
    fetchWarehouses();
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/master/productcategory?limit=200&includeInactive=true');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching product categories:', err);
    }
  };

  const fetchUoms = async () => {
    try {
      const res = await axios.get('/master/uom?limit=100');
      setUoms(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching UOMs:', err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get('/master/warehouse?limit=100');
      setWarehouses(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const res = await axios.get('/master/product?limit=200&includeInactive=true');
        setProducts(res.data?.data || []);
      } else {
        const res = await axios.get('/master/productcategory?limit=200&includeInactive=true');
        setCategories(res.data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err);
      notify.error('Could not load products data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Copy helpers
  const handleCopyCode = (code, id, e) => {
    if (e) e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
    notify.success(`Part number ${code} copied to clipboard`);
  };

  const handleCopyHsn = (hsn, id, e) => {
    if (e) e.stopPropagation();
    if (!hsn) return;
    navigator.clipboard.writeText(hsn);
    setCopiedHsnId(id);
    setTimeout(() => setCopiedHsnId(null), 2000);
    notify.success(`HSN code ${hsn} copied to clipboard`);
  };

  // Open Create Modal
  const openCreate = () => {
    if (activeTab === 'products') {
      const codeNum = String(products.length + 1).padStart(3, '0');
      const defaultUom = uoms.find(u => u.name?.toLowerCase() === 'nos' || u.code?.toUpperCase() === 'EA' || u.name?.toLowerCase() === 'each')?._id || (uoms[0]?._id || '');
      const defaultWh = warehouses.find(w => w.type?.toLowerCase().includes('finish') || w.name?.toLowerCase().includes('finish'))?._id || '';

      setFormData({
        code: `PRD-${codeNum}`,
        uomId: defaultUom,
        defaultWarehouseId: defaultWh,
        currentRevision: '1.0',
        lifecycleStatus: 'Active',
        weight: 1.0,
        standardCost: 0,
        sellingPrice: 0,
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
  const handleEdit = (item, e) => {
    if (e) e.stopPropagation();
    if (activeTab === 'products') {
      setFormData({
        name: item.name || '',
        code: item.code || '',
        categoryId: item.categoryId?._id || item.categoryId || '',
        uomId: item.uomId?._id || item.uomId || '',
        hsnCode: item.hsnCode || '',
        weight: item.weight ?? 0,
        currentRevision: item.currentRevision || '1.0',
        lifecycleStatus: item.lifecycleStatus || 'Active',
        standardCost: item.standardCost ?? 0,
        sellingPrice: item.sellingPrice ?? 0,
        defaultWarehouseId: item.defaultWarehouseId?._id || item.defaultWarehouseId || '',
        status: item.status || (item.isActive ? 'Active' : 'Inactive'),
        isActive: item.isActive !== false && item.status !== 'Inactive'
      });
    } else {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        status: item.status || (item.isActive ? 'Active' : 'Inactive'),
        isActive: item.isActive !== false && item.status !== 'Inactive'
      });
    }
    setEditingId(item._id);
    setIsModalOpen(true);
  };

  // Toggle Active/Inactive Status
  const toggleStatus = async (item, e) => {
    if (e) e.stopPropagation();
    const currentActive = item.isActive !== false && item.status !== 'Inactive';
    const nextStatus = currentActive ? 'Inactive' : 'Active';
    const actionLabel = currentActive ? 'deactivate' : 'activate';

    const confirmed = await confirmAction({
      title: `${currentActive ? 'Deactivate' : 'Reactivate'} ${activeTab === 'products' ? 'Product' : 'Category'}?`,
      message: currentActive
        ? `Are you sure you want to ${actionLabel} "${item.name}"? It will be flagged inactive in sales orders and BOM references.`
        : `Are you sure you want to reactivate "${item.name}" for production quoting and work orders?`,
      confirmLabel: currentActive ? 'Deactivate' : 'Reactivate',
      destructive: currentActive
    });

    if (!confirmed) return;

    try {
      const endpoint = activeTab === 'products' ? '/master/product' : '/master/productcategory';
      await axios.put(`${endpoint}/${item._id}`, {
        status: nextStatus,
        isActive: !currentActive
      });
      notify.success(`${activeTab === 'products' ? 'Product' : 'Category'} marked ${nextStatus}`);
      fetchData();
      if (selectedDossier && selectedDossier._id === item._id) {
        setSelectedDossier(prev => prev ? { ...prev, status: nextStatus, isActive: !currentActive } : null);
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      notify.error(err.response?.data?.message || 'Error updating status');
    }
  };

  // Save Modal Form
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!formData.name?.trim()) {
      notify.error('Name is required');
      return;
    }

    if (activeTab === 'products') {
      if (!formData.code?.trim()) {
        notify.error('Part number/code is required');
        return;
      }
      if (!formData.categoryId) {
        notify.error('Please select a Product Category');
        return;
      }
      if (!formData.uomId) {
        notify.error('Please select a Unit of Measure');
        return;
      }
    }

    setSaving(true);
    try {
      const endpoint = activeTab === 'products' ? '/master/product' : '/master/productcategory';
      const payload = {
        ...formData,
        status: formData.isActive ? 'Active' : (formData.status || 'Active')
      };

      if (editingId) {
        const res = await axios.put(`${endpoint}/${editingId}`, payload);
        notify.success(`${activeTab === 'products' ? 'Product' : 'Category'} updated successfully`);
        if (selectedDossier && selectedDossier._id === editingId) {
          setSelectedDossier(res.data?.data || null);
        }
      } else {
        await axios.post(endpoint, payload);
        notify.success(`New ${activeTab === 'products' ? 'product' : 'category'} registered successfully`);
      }

      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error('Save error:', err);
      notify.error(err.response?.data?.message || 'Error saving record');
    } finally {
      setSaving(false);
    }
  };

  // CSV Export for Engineering Catalog
  const exportToCSV = () => {
    const list = filteredProducts;
    if (list.length === 0) {
      notify.error('No products available to export');
      return;
    }

    const headers = [
      'Part Number',
      'Product Name',
      'Category',
      'Unit of Measure',
      'Drawing Revision',
      'Lifecycle Status',
      'HSN Code',
      'Weight (kg)',
      'Standard Cost (INR)',
      'Selling Price (INR)',
      'Gross Margin (%)',
      'Default Warehouse',
      'Active Status'
    ];

    const rows = list.map(p => {
      const cost = Number(p.standardCost) || 0;
      const price = Number(p.sellingPrice) || 0;
      const marginPct = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : '0';

      return [
        `"${p.code || ''}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.categoryId?.name || ''}"`,
        `"${p.uomId?.name || p.uomId?.symbol || ''}"`,
        `"${p.currentRevision || '1.0'}"`,
        `"${p.lifecycleStatus || 'Active'}"`,
        `"${p.hsnCode || ''}"`,
        p.weight ?? 0,
        cost,
        price,
        `${marginPct}%`,
        `"${p.defaultWarehouseId?.name || ''}"`,
        `"${p.status || (p.isActive ? 'Active' : 'Inactive')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Precision_ERP_Manufactured_Products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Manufactured parts catalog exported to CSV');
  };

  // Engineering & Manufacturing Catalog Analytics
  const catalogStats = useMemo(() => {
    const totalCount = products.length;
    const activeCount = products.filter(p => p.isActive !== false && p.status !== 'Inactive').length;
    const inactiveCount = totalCount - activeCount;

    // Margin Calculations
    let validPricedCount = 0;
    let sumMarginPct = 0;
    products.forEach(p => {
      const price = Number(p.sellingPrice) || 0;
      const cost = Number(p.standardCost) || 0;
      if (price > 0) {
        validPricedCount++;
        sumMarginPct += ((price - cost) / price) * 100;
      }
    });
    const avgMarginPct = validPricedCount > 0 ? (sumMarginPct / validPricedCount).toFixed(1) : '0';

    // Categories Breakdown
    const pressPartsCount = products.filter(p => (p.categoryId?.name || '').toLowerCase().includes('press') || (p.categoryId?.name || '').toLowerCase().includes('stamp')).length;
    const subAssemblyCount = products.filter(p => (p.categoryId?.name || '').toLowerCase().includes('sub-assembly') || (p.categoryId?.name || '').toLowerCase().includes('assembly')).length;

    // Drawing Revision Active Controls
    const drawingControlledCount = products.filter(p => p.currentRevision && p.currentRevision !== '0').length;

    return {
      totalCount,
      activeCount,
      inactiveCount,
      avgMarginPct,
      pressPartsCount,
      subAssemblyCount,
      drawingControlledCount
    };
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search match
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.hsnCode || '').toLowerCase().includes(q) ||
        (p.categoryId?.name || '').toLowerCase().includes(q) ||
        (p.currentRevision || '').toLowerCase().includes(q);

      // Category filter
      const matchCat = selectedCategoryFilter === 'ALL' ||
        (selectedCategoryFilter === 'PRESS' && (p.categoryId?.name || '').toLowerCase().includes('press')) ||
        (selectedCategoryFilter === 'ASSEMBLY' && (p.categoryId?.name || '').toLowerCase().includes('assembly')) ||
        (p.categoryId?._id === selectedCategoryFilter);

      // Lifecycle filter
      const matchLifecycle = selectedLifecycleFilter === 'ALL' ||
        (p.lifecycleStatus || 'Active').toLowerCase() === selectedLifecycleFilter.toLowerCase();

      // Status filter
      const isActive = p.isActive !== false && p.status !== 'Inactive';
      const matchStatus = selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ACTIVE' && isActive) ||
        (selectedStatusFilter === 'INACTIVE' && !isActive);

      return matchSearch && matchCat && matchLifecycle && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'price') return (b.sellingPrice || 0) - (a.sellingPrice || 0);
      if (sortBy === 'cost') return (b.standardCost || 0) - (a.standardCost || 0);
      if (sortBy === 'margin') {
        const marginA = a.sellingPrice > 0 ? ((a.sellingPrice - (a.standardCost || 0)) / a.sellingPrice) : -1;
        const marginB = b.sellingPrice > 0 ? ((b.sellingPrice - (b.standardCost || 0)) / b.sellingPrice) : -1;
        return marginB - marginA;
      }
      if (sortBy === 'weight') return (b.weight || 0) - (a.weight || 0);
      if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [products, searchTerm, selectedCategoryFilter, selectedLifecycleFilter, selectedStatusFilter, sortBy]);

  // Category counts map for category cards
  const categoryUsageMap = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const catId = p.categoryId?._id || p.categoryId;
      if (catId) map[catId] = (map[catId] || 0) + 1;
    });
    return map;
  }, [products]);

  // Helper for Margin Calculations
  const getMarginData = (cost, price) => {
    const c = Number(cost) || 0;
    const p = Number(price) || 0;
    const diff = p - c;
    const pct = p > 0 ? ((diff / p) * 100).toFixed(1) : '0';
    const isPositive = diff >= 0;
    return { diff, pct, isPositive };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', gap: '20px' }}>
      
      {/* ─────────────────────────────────────────────────────────────
          ENGINEERING & FINISHED GOODS COMMAND DECK HEADER
          Deep Tech Blueprint Gradient Theme (#091e3a -> #0c2b4e)
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #071527 0%, #0c233c 55%, #103254 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(14, 165, 233, 0.28)',
        boxShadow: '0 8px 30px rgba(7, 21, 39, 0.45)',
        padding: '24px 28px',
        color: '#f8fafc',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle CAD Blueprint Grid Glow Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(14, 165, 233, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.6,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: 'rgba(6, 182, 212, 0.18)',
                border: '1px solid rgba(6, 182, 212, 0.45)',
                color: '#22d3ee',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}>
                <Compass size={13} />
                CAD Engineering Catalog
              </span>
              <span style={{
                color: 'rgba(148, 163, 184, 0.9)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.02em'
              }}>
                Finished Goods Specification Matrix & Pricing Ledger
              </span>
            </div>

            <h1 style={{
              margin: 0,
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              Manufactured Products We Make
            </h1>

            <p style={{
              margin: '8px 0 0 0',
              fontSize: '13px',
              color: '#94a3b8',
              maxWidth: '820px',
              lineHeight: 1.55
            }}>
              Master registry of automotive stamped sheet metal parts, sub-assemblies, and brackets manufactured in-house. Governs part numbers, engineering drawing revisions, piece weights, standard costs, selling prices, and HSN codes for Sales Quotations, BOMs, and Shop Floor Work Orders.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={exportToCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            >
              <Download size={15} />
              Export CSV
            </button>

            <button
              onClick={openCreate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: '1px solid #38bdf8',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.45)';
              }}
            >
              <Plus size={16} />
              {activeTab === 'products' ? 'Register New Product' : 'Add Product Category'}
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MANUFACTURING CATALOG TELEMETRY STRIP (4 KPI CARDS)
            ───────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginTop: '22px'
        }}>
          {/* Card 1: Active Production Parts */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(14, 165, 233, 0.22)',
            borderRadius: '12px',
            padding: '14px 18px',
            backdropFilter: 'blur(6px)'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: 600 }}>
              Active Catalog Parts
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
                {catalogStats.activeCount}
              </span>
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 500 }}>
                ({catalogStats.totalCount} Total Catalog)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              All ready for quotation & work orders
            </div>
          </div>

          {/* Card 2: Average Gross Margin */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '14px 18px',
            backdropFilter: 'blur(6px)'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Percent size={12} />
              Avg Target Margin
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                {catalogStats.avgMarginPct}%
              </span>
              <span style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                Healthy
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Spread over standard piece cost
            </div>
          </div>

          {/* Card 3: Pressing & Sub-Assemblies */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(245, 158, 11, 0.22)',
            borderRadius: '12px',
            padding: '14px 18px',
            backdropFilter: 'blur(6px)'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layers size={12} />
              Press & Sub-Assembly
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
                {catalogStats.pressPartsCount + catalogStats.subAssemblyCount}
              </span>
              <span style={{ fontSize: '12px', color: '#fde68a', fontWeight: 500 }}>
                Parts
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {catalogStats.pressPartsCount} Stamped Press | {catalogStats.subAssemblyCount} Assemblies
            </div>
          </div>

          {/* Card 4: Drawing Revision Control */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(14, 165, 233, 0.22)',
            borderRadius: '12px',
            padding: '14px 18px',
            backdropFilter: 'blur(6px)'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileCode size={12} />
              Drawing Revision SLA
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
                100%
              </span>
              <span style={{ fontSize: '12px', color: '#7dd3fc', fontWeight: 500 }}>
                Versioned
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {catalogStats.drawingControlledCount} parts bound to CAD revisions
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PRIMARY NAVIGATION TABS & FILTER BAR
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        backgroundColor: 'var(--bg-primary)',
        padding: '14px 18px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Main Module Tabs (Products vs Categories) */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setActiveTab('products')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'products' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: activeTab === 'products' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeTab === 'products' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Package size={15} />
              Manufactured Products ({products.length})
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'categories' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: activeTab === 'categories' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeTab === 'categories' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Tag size={15} />
              Product Categories ({categories.length})
            </button>
          </div>

          {/* When Products tab is active: Search, Quick Filters & View Switcher */}
          {activeTab === 'products' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Search Input */}
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Search part name, code, HSN..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Category Quick Chips */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setSelectedCategoryFilter('ALL')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: selectedCategoryFilter === 'ALL' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: selectedCategoryFilter === 'ALL' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedCategoryFilter('PRESS')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: selectedCategoryFilter === 'PRESS' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: selectedCategoryFilter === 'PRESS' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                  }}
                >
                  Press Parts
                </button>
                <button
                  onClick={() => setSelectedCategoryFilter('ASSEMBLY')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: selectedCategoryFilter === 'ASSEMBLY' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: selectedCategoryFilter === 'ASSEMBLY' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                  }}
                >
                  Sub-Assembly
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="name">Sort: Part Name</option>
                <option value="code">Sort: Part Number</option>
                <option value="price">Sort: Price (High to Low)</option>
                <option value="margin">Sort: Gross Margin %</option>
                <option value="weight">Sort: Weight (Heavy to Light)</option>
              </select>

              {/* View Switcher: Blueprint Grid vs Matrix Table */}
              <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setViewMode('cards')}
                  title="Blueprint Cards View"
                  style={{
                    padding: '6px 10px',
                    background: viewMode === 'cards' ? 'var(--bg-secondary)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: viewMode === 'cards' ? '#0284c7' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Specification Table View"
                  style={{
                    padding: '6px 10px',
                    background: viewMode === 'table' ? 'var(--bg-secondary)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: viewMode === 'table' ? '#0284c7' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: PRODUCTS WE MAKE (BLUEPRINT GRID OR SPEC TABLE)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              Loading manufactured parts catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px dashed var(--border-color)'
            }}>
              <Compass size={44} style={{ color: '#0284c7', margin: '0 auto 12px', opacity: 0.8 }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600 }}>No products match your criteria</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Try clearing search terms or registering a new manufactured finished part.
              </p>
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={14} /> Register First Product
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* ─────────────────────────────────────────────────────────────
               VIEW 1: BLUEPRINT CARDS GRID
               ───────────────────────────────────────────────────────────── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '16px'
            }}>
              {filteredProducts.map(p => {
                const isActive = p.isActive !== false && p.status !== 'Inactive';
                const cost = Number(p.standardCost) || 0;
                const price = Number(p.sellingPrice) || 0;
                const margin = getMarginData(cost, price);

                return (
                  <div
                    key={p._id}
                    onClick={() => setSelectedDossier(p)}
                    style={{
                      background: 'var(--bg-primary)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(2, 132, 199, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(2, 132, 199, 0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    {/* Top Decorative CAD Corner Accent */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '38px',
                      height: '38px',
                      background: 'linear-gradient(135deg, transparent 50%, rgba(2, 132, 199, 0.15) 50%)',
                      borderTopRightRadius: '14px',
                      pointerEvents: 'none'
                    }} />

                    {/* Card Top Row: Part Number & Status Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            onClick={e => handleCopyCode(p.code, p._id, e)}
                            title="Click to copy part number"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(2, 132, 199, 0.12)',
                              color: '#0284c7',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '12px',
                              letterSpacing: '0.04em'
                            }}
                          >
                            {p.code || 'PRD-NEW'}
                            {copiedCodeId === p._id ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                          </span>

                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            📐 Rev {p.currentRevision || '1.0'}
                          </span>
                        </div>

                        <h3 style={{
                          margin: '8px 0 0 0',
                          fontSize: '15px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3
                        }}>
                          {p.name}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                        {p.lifecycleStatus && p.lifecycleStatus !== 'Active' && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: p.lifecycleStatus === 'Draft' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: p.lifecycleStatus === 'Draft' ? '#d97706' : '#dc2626'
                          }}>
                            {p.lifecycleStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category & Physical Attributes Badge Strip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(100, 116, 139, 0.1)',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: 500
                      }}>
                        {p.categoryId?.name || 'Standard Component'}
                      </span>

                      {p.weight > 0 && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(14, 165, 233, 0.08)',
                          color: '#0369a1',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          <Scale size={11} />
                          {p.weight} kg/pc
                        </span>
                      )}

                      {p.hsnCode && (
                        <span
                          onClick={e => handleCopyHsn(p.hsnCode, p._id, e)}
                          title="Click to copy HSN Code"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          HSN: {p.hsnCode}
                          {copiedHsnId === p._id ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                        </span>
                      )}
                    </div>

                    {/* Pricing & Gross Margin Telemetry Card */}
                    <div style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                            Standard Selling Price
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtMoneyFull(price)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                            Cost Basis
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtMoneyFull(cost)}
                          </div>
                        </div>
                      </div>

                      {/* Visual Margin Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Unit Contribution Margin:</span>
                          <span style={{ fontWeight: 700, color: margin.isPositive ? '#16a34a' : '#dc2626' }}>
                            {margin.isPositive ? '+' : ''}{fmtMoneyFull(margin.diff)} ({margin.pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(Math.max(Number(margin.pct) || 0, 0), 100)}%`,
                            height: '100%',
                            background: margin.isPositive ? 'linear-gradient(90deg, #10b981, #059669)' : '#dc2626',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Footer: Warehouse Store & Quick Action Buttons */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '11px',
                      color: 'var(--text-tertiary)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <WarehouseIcon size={13} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {p.defaultWarehouseId?.name || 'Default Finished Store'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedDossier(p);
                          }}
                          title="Inspect 360 Product Dossier"
                          style={{
                            padding: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#0284c7'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={e => handleEdit(p, e)}
                          title="Edit Product Specs"
                          style={{
                            padding: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#0284c7'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={e => toggleStatus(p, e)}
                          title={isActive ? 'Deactivate product' : 'Reactivate product'}
                          style={{
                            padding: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isActive ? '#dc2626' : '#16a34a',
                            borderRadius: '4px'
                          }}
                        >
                          {isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               VIEW 2: TECHNICAL SPECIFICATION ENTERPRISE TABLE
               ───────────────────────────────────────────────────────────── */
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <th style={{ padding: '12px 16px' }}>Part Number & Name</th>
                      <th style={{ padding: '12px 14px' }}>Category</th>
                      <th style={{ padding: '12px 14px' }}>CAD Revision</th>
                      <th style={{ padding: '12px 14px' }}>Weight & UOM</th>
                      <th style={{ padding: '12px 14px' }}>HSN Code</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Cost Basis</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Selling Price</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Gross Margin</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => {
                      const isActive = p.isActive !== false && p.status !== 'Inactive';
                      const cost = Number(p.standardCost) || 0;
                      const price = Number(p.sellingPrice) || 0;
                      const margin = getMarginData(cost, price);

                      return (
                        <tr
                          key={p._id}
                          onClick={() => setSelectedDossier(p)}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Part Number & Name */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                onClick={e => handleCopyCode(p.code, p._id, e)}
                                title="Copy Part Code"
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: '#0284c7',
                                  fontSize: '12px',
                                  background: 'rgba(2, 132, 199, 0.1)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                {p.code}
                              </span>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {p.name}
                              </span>
                            </div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)',
                              fontSize: '12px'
                            }}>
                              {p.categoryId?.name || '-'}
                            </span>
                          </td>

                          {/* CAD Revision */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(14, 165, 233, 0.1)',
                              color: '#0284c7',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              Rev {p.currentRevision || '1.0'}
                            </span>
                          </td>

                          {/* Weight & UOM */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                              {p.weight ? `${p.weight} kg` : '-'}
                            </span>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginLeft: '4px' }}>
                              ({p.uomId?.name || p.uomId?.symbol || 'EA'})
                            </span>
                          </td>

                          {/* HSN Code */}
                          <td style={{ padding: '12px 14px' }}>
                            {p.hsnCode ? (
                              <span
                                onClick={e => handleCopyHsn(p.hsnCode, p._id, e)}
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '11px',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer'
                                }}
                                title="Click to copy HSN"
                              >
                                {p.hsnCode}
                              </span>
                            ) : '-'}
                          </td>

                          {/* Standard Cost */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                            {fmtMoneyFull(cost)}
                          </td>

                          {/* Selling Price */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {fmtMoneyFull(price)}
                          </td>

                          {/* Gross Margin */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <span style={{
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                              color: margin.isPositive ? '#16a34a' : '#dc2626',
                              fontSize: '12px'
                            }}>
                              {margin.isPositive ? '+' : ''}{margin.pct}%
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 14px' }}>
                            <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedDossier(p);
                                }}
                                title="Inspect 360 Dossier"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#0284c7'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                onClick={e => handleEdit(p, e)}
                                title="Edit Product"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#0284c7'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                onClick={e => toggleStatus(p, e)}
                                title={isActive ? 'Make Inactive' : 'Make Active'}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#dc2626' : '#16a34a' }}
                              >
                                {isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
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

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PRODUCT CATEGORIES CONSOLE
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Manufacturing Families & Product Categories</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Group finished goods into Press Stamped Parts, Sub-Assembly Frames, Clamps, or Engine Brackets to organize routing sequences and BOM hierarchies.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={14} /> Add Product Category
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '14px'
          }}>
            {categories.map(c => {
              const isActive = c.isActive !== false && c.status !== 'Inactive';
              const partsCount = categoryUsageMap[c._id] || 0;

              return (
                <div
                  key={c._id}
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(2, 132, 199, 0.1)',
                        color: '#0284c7',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}>
                        {c.name}
                      </span>
                      <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                    </div>

                    <p style={{
                      margin: '12px 0 0 0',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      minHeight: '36px'
                    }}>
                      {c.description || 'Standard manufacturing classification for parts and assembly items.'}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '12px'
                  }}>
                    <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Boxes size={13} />
                      <strong style={{ color: 'var(--text-primary)' }}>{partsCount}</strong> Parts assigned
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={e => handleEdit(c, e)}
                        title="Edit Category"
                        style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#0284c7'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={e => toggleStatus(c, e)}
                        title={isActive ? 'Deactivate Category' : 'Activate Category'}
                        style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#dc2626' : '#16a34a' }}
                      >
                        {isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PRODUCT 360 SLIDE-OVER ENGINEERING DOSSIER DRAWER
          ───────────────────────────────────────────────────────────── */}
      {selectedDossier && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              height: '100%',
              background: 'var(--bg-primary)',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '24px 28px',
              gap: '20px'
            }}
          >
            {/* Dossier Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(2, 132, 199, 0.12)',
                    color: '#0284c7',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}>
                    {selectedDossier.code}
                  </span>
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    📐 Rev {selectedDossier.currentRevision || '1.0'}
                  </span>
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px'
                  }}>
                    {selectedDossier.categoryId?.name || 'Finished Good'}
                  </span>
                </div>

                <h2 style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedDossier.name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedDossier(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Commercial Economics & Profitability Card */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={13} />
                Commercial Economics & Profitability
              </div>

              {(() => {
                const cost = Number(selectedDossier.standardCost) || 0;
                const price = Number(selectedDossier.sellingPrice) || 0;
                const margin = getMarginData(cost, price);

                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Standard Selling Price</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                          {fmtMoneyFull(price)}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Standard Unit Cost</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                          {fmtMoneyFull(cost)}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: margin.isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: margin.isPositive ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Unit Gross Contribution</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: margin.isPositive ? '#16a34a' : '#dc2626' }}>
                          {margin.isPositive ? '+' : ''}{fmtMoneyFull(margin.diff)} / piece
                        </div>
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        color: margin.isPositive ? '#16a34a' : '#dc2626',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {margin.pct}%
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Technical Engineering & CAD Attributes */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCode size={13} />
                Technical & Manufacturing Specifications
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>HSN Code:</span>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedDossier.hsnCode || '87089900'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Piece Weight:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedDossier.weight ? `${selectedDossier.weight} kg / piece` : 'Not specified'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Unit of Measure:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedDossier.uomId?.name || selectedDossier.uomId?.symbol || 'Each (EA)'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Lifecycle Status:</span>
                  <div style={{ fontWeight: 600, color: '#0284c7', marginTop: '2px' }}>
                    {selectedDossier.lifecycleStatus || 'Active (Production)'}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Default Storage Facility:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <WarehouseIcon size={12} color="#64748b" />
                    {selectedDossier.defaultWarehouseId?.name || 'Finished Goods Distribution Center'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Engineering & Downstream Launchers */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Engineering & Production Workflows
              </div>

              <button
                onClick={() => navigate('/engineering/bom')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0284c7'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={14} color="#0284c7" />
                  View Bill of Materials (BOM)
                </span>
                <ArrowUpRight size={14} color="var(--text-tertiary)" />
              </button>

              <button
                onClick={() => navigate('/engineering/routing')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0284c7'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wrench size={14} color="#0284c7" />
                  View Manufacturing Routing
                </span>
                <ArrowUpRight size={14} color="var(--text-tertiary)" />
              </button>

              <button
                onClick={() => navigate('/sales/quotations')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0284c7'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={14} color="#16a34a" />
                  Create Customer Quotation
                </span>
                <ArrowUpRight size={14} color="var(--text-tertiary)" />
              </button>
            </div>

            {/* Dossier Bottom Controls */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => handleEdit(selectedDossier)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: '1px solid #38bdf8',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Edit2 size={14} />
                Edit Product
              </button>

              <button
                onClick={() => toggleStatus(selectedDossier)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: (selectedDossier.isActive !== false && selectedDossier.status !== 'Inactive') ? '#dc2626' : '#16a34a',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {(selectedDossier.isActive !== false && selectedDossier.status !== 'Inactive') ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PRODUCT / CATEGORY REGISTRATION & EDIT MODAL
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
            width: '100%',
            maxWidth: activeTab === 'products' ? '740px' : '480px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #071527 0%, #0c233c 100%)',
              color: '#ffffff'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
                  {editingId ? 'Edit Manufactured Product' : 'Register New Finished Product'}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  {activeTab === 'products'
                    ? 'Configure drawing revision, piece weight, pricing, and HSN code for engineering releases.'
                    : 'Group products into functional families for routing and reporting.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {activeTab === 'products' ? (
                <>
                  {/* Two-Column Form Layout for Product */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: 600 }}>
                        Product / Part Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="e.g., Exhaust Heat Shield, Battery Tray Assembly"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: 600 }}>
                        Part Number (Code) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="PRD-014"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: 600 }}>
                        Product Category <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        className="input-field"
                        required
                        value={formData.categoryId || ''}
                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                      >
                        <option value="" disabled>Select Category</option>
                        {categories.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      {categories.length === 0 && (
                        <p style={hintStyle}>No categories yet — add one on the categories tab.</p>
                      )}
                    </div>

                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: 600 }}>
                        Unit of Measure (UOM) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        className="input-field"
                        required
                        value={formData.uomId || ''}
                        onChange={e => setFormData({ ...formData, uomId: e.target.value })}
                      >
                        <option value="" disabled>Select Unit</option>
                        {uoms.map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.symbol || u.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CAD Engineering Specs & Lifecycle */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div className="input-group">
                      <label className="input-label">Drawing Revision</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="1.0"
                        value={formData.currentRevision || '1.0'}
                        onChange={e => setFormData({ ...formData, currentRevision: e.target.value })}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Lifecycle Stage</label>
                      <select
                        className="input-field"
                        value={formData.lifecycleStatus || 'Active'}
                        onChange={e => setFormData({ ...formData, lifecycleStatus: e.target.value })}
                      >
                        <option value="Active">Active (Production)</option>
                        <option value="Draft">Draft (Prototype / APQP)</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Obsolete">Obsolete (End of Life)</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">HSN Code (GST)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="87089900"
                        value={formData.hsnCode || ''}
                        onChange={e => setFormData({ ...formData, hsnCode: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Weight & Financials */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div className="input-group">
                      <label className="input-label">Weight (kg/piece)</label>
                      <input
                        type="number"
                        step="0.001"
                        className="input-field"
                        placeholder="e.g., 2.500"
                        value={formData.weight ?? ''}
                        onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Standard Cost (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        placeholder="0.00"
                        value={formData.standardCost ?? ''}
                        onChange={e => setFormData({ ...formData, standardCost: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Selling Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        placeholder="0.00"
                        value={formData.sellingPrice ?? ''}
                        onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Default Warehouse Store Location */}
                  <div className="input-group">
                    <label className="input-label">Default Finished Goods Warehouse Store</label>
                    <select
                      className="input-field"
                      value={formData.defaultWarehouseId || ''}
                      onChange={e => setFormData({ ...formData, defaultWarehouseId: e.target.value })}
                    >
                      <option value="">Select Finished Goods Warehouse Location</option>
                      {warehouses.map(w => (
                        <option key={w._id} value={w._id}>{w.name} ({w.code || w.type || 'Warehouse'})</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* Category Form */
                <>
                  <div className="input-group">
                    <label className="input-label" style={{ fontWeight: 600 }}>
                      Category Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      placeholder="e.g., Automotive Press Components, Sub-Assembly Frames"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Category Description & Scope</label>
                    <textarea
                      className="input-field"
                      rows="4"
                      placeholder="Describe what manufacturing operations and part types fall under this category..."
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Active Toggle Switch */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginTop: '4px'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Active Status in Precision ERP
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Active items can be quoted by sales executives and released on shop floor work orders.
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false && formData.status !== 'Inactive'}
                    onChange={e => setFormData({
                      ...formData,
                      isActive: e.target.checked,
                      status: e.target.checked ? 'Active' : 'Inactive'
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: (formData.isActive !== false && formData.status !== 'Inactive') ? '#16a34a' : 'var(--text-secondary)' }}>
                    {(formData.isActive !== false && formData.status !== 'Inactive') ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: '1px solid #38bdf8',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  {saving ? 'Saving Specs...' : (editingId ? 'Update Specifications' : 'Register Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMaster;