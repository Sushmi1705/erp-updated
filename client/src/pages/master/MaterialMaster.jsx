import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Boxes, Layers, Plus, Search, Filter, Download, LayoutGrid, List,
  Eye, Edit2, Copy, Check, CheckCircle2, XCircle, Tag, ChevronRight,
  ArrowUpRight, HelpCircle, Clock, Sparkles, X, Award, ShieldCheck,
  Truck, Warehouse as WarehouseIcon, AlertTriangle, BarChart2,
  CheckCircle, Scale, Building, DollarSign, Database, Activity, Flame
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

const MaterialMaster = () => {
  const navigate = useNavigate();

  // Primary navigation tabs: 'materials' | 'categories'
  const [activeTab, setActiveTab] = useState('materials');

  // View mode for materials: 'cards' (Steel Yard & Coil Tiles) vs 'table' (Material Inventory Matrix)
  const [viewMode, setViewMode] = useState('cards');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL'); // 'ALL' | 'RAW_MATERIAL' | 'CONSUMABLE' | 'SPARE_PART'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'code' | 'cost' | 'reorder' | 'leadTime'

  // Data state
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null); // Material 360 Slide-Over
  const [copiedCodeId, setCopiedCodeId] = useState(null);

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
    fetchVendors();
    fetchUoms();
    fetchBins();
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/master/materialcategory?limit=200&includeInactive=true');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching material categories:', err);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await axios.get('/master/vendor?limit=200&includeInactive=true');
      setVendors(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
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

  const fetchBins = async () => {
    try {
      const res = await axios.get('/master/bin?limit=100');
      setBins(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching bins:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'materials') {
        const res = await axios.get('/master/material?limit=200&includeInactive=true');
        setMaterials(res.data?.data || []);
      } else {
        const res = await axios.get('/master/materialcategory?limit=200&includeInactive=true');
        setCategories(res.data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching raw material data:', err);
      notify.error('Could not load raw materials. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Copy helper
  const handleCopyCode = (code, id, e) => {
    if (e) e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
    notify.success(`Material code ${code} copied to clipboard`);
  };

  // Open Create Modal
  const openCreate = () => {
    if (activeTab === 'materials') {
      const codeNum = String(materials.length + 1).padStart(3, '0');
      const defaultUom = uoms.find(u => u.name?.toLowerCase().includes('kilo') || u.code?.toUpperCase() === 'KG')?._id || (uoms[0]?._id || '');
      const defaultSupplier = vendors.find(v => v.name?.toLowerCase().includes('tata') || v.name?.toLowerCase().includes('jsw'))?._id || '';

      setFormData({
        code: `MAT-${codeNum}`,
        uomId: defaultUom,
        preferredVendorId: defaultSupplier,
        Material_Type: 'RAW_MATERIAL',
        standardCost: 60,
        leadTimeDays: 7,
        shelfLifeDays: 365,
        minStock: 1000,
        reorderLevel: 2500,
        maxStock: 8000,
        Safety_Stock_Level: 1000,
        Reorder_Point: 2500,
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
    if (activeTab === 'materials') {
      setFormData({
        name: item.name || '',
        code: item.code || '',
        categoryId: item.categoryId?._id || item.categoryId || '',
        uomId: item.uomId?._id || item.uomId || '',
        grade: item.grade || '',
        Material_Type: item.Material_Type || 'RAW_MATERIAL',
        preferredVendorId: item.preferredVendorId?._id || item.preferredVendorId || '',
        standardCost: item.standardCost ?? 0,
        leadTimeDays: item.leadTimeDays ?? 0,
        shelfLifeDays: item.shelfLifeDays ?? 0,
        minStock: item.minStock ?? item.Safety_Stock_Level ?? 0,
        reorderLevel: item.reorderLevel ?? item.Reorder_Point ?? 0,
        maxStock: item.maxStock ?? 0,
        Safety_Stock_Level: item.Safety_Stock_Level ?? item.minStock ?? 0,
        Reorder_Point: item.Reorder_Point ?? item.reorderLevel ?? 0,
        defaultBinId: item.defaultBinId?._id || item.defaultBinId || '',
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
      title: `${currentActive ? 'Deactivate' : 'Reactivate'} ${activeTab === 'materials' ? 'Raw Material' : 'Category'}?`,
      message: currentActive
        ? `Are you sure you want to ${actionLabel} "${item.name}"? It will be hidden from new purchase requisitions and BOM material allocations.`
        : `Are you sure you want to reactivate "${item.name}" for infeed stock receipts and store issues?`,
      confirmLabel: currentActive ? 'Deactivate' : 'Reactivate',
      destructive: currentActive
    });

    if (!confirmed) return;

    try {
      const endpoint = activeTab === 'materials' ? '/master/material' : '/master/materialcategory';
      await axios.put(`${endpoint}/${item._id}`, {
        status: nextStatus,
        isActive: !currentActive
      });
      notify.success(`${activeTab === 'materials' ? 'Material' : 'Category'} marked ${nextStatus}`);
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

    if (activeTab === 'materials') {
      if (!formData.code?.trim()) {
        notify.error('Material code is required');
        return;
      }
      if (!formData.categoryId) {
        notify.error('Please select a Material Category');
        return;
      }
      if (!formData.uomId) {
        notify.error('Please select a Unit of Measure');
        return;
      }
    }

    setSaving(true);
    try {
      const endpoint = activeTab === 'materials' ? '/master/material' : '/master/materialcategory';
      const payload = {
        ...formData,
        Safety_Stock_Level: formData.minStock || formData.Safety_Stock_Level || 0,
        Reorder_Point: formData.reorderLevel || formData.Reorder_Point || 0,
        status: formData.isActive ? 'Active' : (formData.status || 'Active')
      };

      if (!payload.preferredVendorId) delete payload.preferredVendorId;
      if (!payload.defaultBinId) delete payload.defaultBinId;

      if (editingId) {
        const res = await axios.put(`${endpoint}/${editingId}`, payload);
        notify.success(`${activeTab === 'materials' ? 'Material' : 'Category'} updated successfully`);
        if (selectedDossier && selectedDossier._id === editingId) {
          setSelectedDossier(res.data?.data || null);
        }
      } else {
        await axios.post(endpoint, payload);
        notify.success(`New ${activeTab === 'materials' ? 'raw material' : 'category'} registered successfully`);
      }

      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error('Save error:', err);
      notify.error(err.response?.data?.message || 'Error saving material');
    } finally {
      setSaving(false);
    }
  };

  // CSV Export for Raw Materials & Steel Yard Registry
  const exportToCSV = () => {
    const list = filteredMaterials;
    if (list.length === 0) {
      notify.error('No materials available to export');
      return;
    }

    const headers = [
      'Material Code',
      'Material Name',
      'Category',
      'Metallurgical Grade',
      'Material Type',
      'Unit of Measure',
      'Standard Cost (INR)',
      'Buffer Stock / Min',
      'Reorder Point',
      'Max Stock',
      'Lead Time (Days)',
      'Preferred Supplier',
      'Storage Bin',
      'Status'
    ];

    const rows = list.map(m => [
      `"${m.code || ''}"`,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${m.categoryId?.name || ''}"`,
      `"${m.grade || ''}"`,
      `"${m.Material_Type || 'RAW_MATERIAL'}"`,
      `"${m.uomId?.name || m.uomId?.symbol || ''}"`,
      Number(m.standardCost) || 0,
      m.minStock ?? m.Safety_Stock_Level ?? 0,
      m.reorderLevel ?? m.Reorder_Point ?? 0,
      m.maxStock ?? 0,
      m.leadTimeDays ?? 0,
      `"${m.preferredVendorId?.name || ''}"`,
      `"${m.defaultBinId?.name || ''}"`,
      `"${m.status || (m.isActive ? 'Active' : 'Inactive')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Precision_ERP_Raw_Materials_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Raw materials inventory exported to CSV');
  };

  // Raw Material Inventory & Metallurgy Analytics
  const materialStats = useMemo(() => {
    const totalCount = materials.length;
    const activeCount = materials.filter(m => m.isActive !== false && m.status !== 'Inactive').length;
    const inactiveCount = totalCount - activeCount;

    // Steel Coils & Sheets (CR, HR, GI, SS, Aluminium)
    const steelCoilCount = materials.filter(m => {
      const cat = (m.categoryId?.name || '').toLowerCase();
      const n = (m.name || '').toLowerCase();
      return cat.includes('steel') || cat.includes('sheet') || cat.includes('coil') || n.includes('crca') || n.includes('hr coil');
    }).length;

    // Average Lead Time from steel mills
    const avgLeadTime = totalCount > 0 ? (materials.reduce((sum, m) => sum + (m.leadTimeDays || 0), 0) / totalCount).toFixed(1) : '0';

    // Total Steel Stock Reorder Buffer Monitored
    const reorderTrackedCount = materials.filter(m => (m.reorderLevel || m.Reorder_Point) > 0).length;

    return {
      totalCount,
      activeCount,
      inactiveCount,
      steelCoilCount,
      avgLeadTime,
      reorderTrackedCount
    };
  }, [materials]);

  // Filtered & Sorted Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      // Search match
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.code || '').toLowerCase().includes(q) ||
        (m.grade || '').toLowerCase().includes(q) ||
        (m.categoryId?.name || '').toLowerCase().includes(q) ||
        (m.preferredVendorId?.name || '').toLowerCase().includes(q);

      // Category filter
      const matchCat = selectedCategoryFilter === 'ALL' ||
        (selectedCategoryFilter === 'STEEL' && ((m.categoryId?.name || '').toLowerCase().includes('steel') || (m.categoryId?.name || '').toLowerCase().includes('sheet'))) ||
        (selectedCategoryFilter === 'CONSUMABLE' && (m.categoryId?.name || '').toLowerCase().includes('consum')) ||
        (m.categoryId?._id === selectedCategoryFilter);

      // Material Type filter
      const matchType = selectedTypeFilter === 'ALL' ||
        (m.Material_Type || 'RAW_MATERIAL') === selectedTypeFilter;

      // Status filter
      const isActive = m.isActive !== false && m.status !== 'Inactive';
      const matchStatus = selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ACTIVE' && isActive) ||
        (selectedStatusFilter === 'INACTIVE' && !isActive);

      return matchSearch && matchCat && matchType && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'cost') return (b.standardCost || 0) - (a.standardCost || 0);
      if (sortBy === 'reorder') return ((b.reorderLevel || b.Reorder_Point) || 0) - ((a.reorderLevel || a.Reorder_Point) || 0);
      if (sortBy === 'leadTime') return (a.leadTimeDays || 0) - (b.leadTimeDays || 0);
      if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [materials, searchTerm, selectedCategoryFilter, selectedTypeFilter, selectedStatusFilter, sortBy]);

  // Category counts map for category console
  const categoryUsageMap = useMemo(() => {
    const map = {};
    materials.forEach(m => {
      const catId = m.categoryId?._id || m.categoryId;
      if (catId) map[catId] = (map[catId] || 0) + 1;
    });
    return map;
  }, [materials]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', gap: '20px' }}>
      
      {/* ─────────────────────────────────────────────────────────────
          RAW METALLURGY & STEEL STOCKYARD COMMAND DECK HEADER
          Deep Charcoal Steel & Molten Bronze Theme (#18181b -> #27272a)
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
        padding: '24px 28px',
        color: '#f8fafc',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Industrial Steel Texture Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(45deg, rgba(245, 158, 11, 0.05) 25%, transparent 25%, transparent 50%, rgba(245, 158, 11, 0.05) 50%, rgba(245, 158, 11, 0.05) 75%, transparent 75%, transparent)',
          backgroundSize: '40px 40px',
          opacity: 0.4,
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
                background: 'rgba(245, 158, 11, 0.16)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                color: '#fbbf24',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}>
                <Flame size={13} />
                Raw Metallurgy & Coil Stockyard
              </span>
              <span style={{
                color: 'rgba(212, 212, 216, 0.85)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.02em'
              }}>
                Primary Stamping Infeed & Steel Store Registry
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
              Raw Materials & Infeed Steel Inventory
            </h1>

            <p style={{
              margin: '8px 0 0 0',
              fontSize: '13px',
              color: '#a1a1aa',
              maxWidth: '840px',
              lineHeight: 1.55
            }}>
              Central store ledger governing CRCA coils, HR steel sheets, aluminium coils, and press consumables. Configures metallurgical grades, standard ₹/kg purchase costs, safety stock buffers, reorder trigger levels, and preferred mill suppliers for MRP and automated Purchase Requisitions.
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
                color: '#e4e4e7',
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
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                border: '1px solid #f59e0b',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.45)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(217, 119, 6, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(217, 119, 6, 0.45)';
              }}
            >
              <Plus size={16} />
              {activeTab === 'materials' ? 'Register Raw Material' : 'Add Material Category'}
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            METALLURGICAL TELEMETRY STRIP (4 KPI CARDS)
            ───────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginTop: '22px'
        }}>
          {/* Card 1: Active Material Catalog */}
          <div style={{
            background: 'rgba(24, 24, 27, 0.75)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '14px 18px',
            backdropFilter: 'blur(6px)'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a1a1aa', fontWeight: 600 }}>
              Stocked Raw Materials
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
                {materialStats.activeCount}
              </span>
              <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 500 }}>
                ({materialStats.totalCount} Total in Master)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
              Available for BOM allocation & GRN
            </div>
          </div>

          {/* Card 2: Steel & Coil Grades */}
          <div style={{
            background: 'rgba(24, 24, 27, 0.75)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '14px 18px',
            backdropFilter: 'blur(6px)'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layers size={12} />
              Steel Coils & Sheets
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                {materialStats.steelCoilCount}
              </span>
              <span style={{ fontSize: '11px', color: '#fef3c7', fontWeight: 600, background: 'rgba(245, 158, 11, 0.18)', padding: '2px 6px', borderRadius: '4px' }}>
                Prime Infeed
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
              CRCA, HR Steel, GI & Alloys
            </div>
          </div>

          {/* Card 3: Avg Inbound Lead Time */}
          <div style={{
            background: 'rgba(24, 24, 27, 0.75)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '14px 18px',
            backdropFilter: 'blur(6px)'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Truck size={12} />
              Average Lead Time
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
                {materialStats.avgLeadTime}
              </span>
              <span style={{ fontSize: '12px', color: '#7dd3fc', fontWeight: 500 }}>
                Days
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
              Mill dispatch to store receipt
            </div>
          </div>

          {/* Card 4: Reorder Buffers Monitored */}
          <div style={{
            background: 'rgba(24, 24, 27, 0.75)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '14px 18px',
            backdropFilter: 'blur(6px)'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} />
              ROP Buffer Guard
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                100%
              </span>
              <span style={{ fontSize: '12px', color: '#a7f3d0', fontWeight: 500 }}>
                Tracked
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
              {materialStats.reorderTrackedCount} items under safety stock guard
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
          
          {/* Main Module Tabs (Materials vs Categories) */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setActiveTab('materials')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'materials' ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'transparent',
                color: activeTab === 'materials' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeTab === 'materials' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Boxes size={15} />
              Raw Materials ({materials.length})
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
                background: activeTab === 'categories' ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'transparent',
                color: activeTab === 'categories' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeTab === 'categories' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Tag size={15} />
              Material Categories ({categories.length})
            </button>
          </div>

          {/* When Materials tab is active: Search, Quick Filters & View Switcher */}
          {activeTab === 'materials' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Search Input */}
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Search material, grade, code..."
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
                    background: selectedCategoryFilter === 'ALL' ? '#d97706' : 'var(--bg-secondary)',
                    color: selectedCategoryFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedCategoryFilter('STEEL')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: selectedCategoryFilter === 'STEEL' ? '#d97706' : 'var(--bg-secondary)',
                    color: selectedCategoryFilter === 'STEEL' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  Steel Coils
                </button>
                <button
                  onClick={() => setSelectedCategoryFilter('CONSUMABLE')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: selectedCategoryFilter === 'CONSUMABLE' ? '#d97706' : 'var(--bg-secondary)',
                    color: selectedCategoryFilter === 'CONSUMABLE' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  Consumables
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
                <option value="name">Sort: Material Name</option>
                <option value="code">Sort: Material Code</option>
                <option value="cost">Sort: Cost (High to Low)</option>
                <option value="reorder">Sort: Reorder Point</option>
                <option value="leadTime">Sort: Lead Time (Shortest)</option>
              </select>

              {/* View Switcher: Coil Cards vs Inventory Table */}
              <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setViewMode('cards')}
                  title="Steel Yard Cards View"
                  style={{
                    padding: '6px 10px',
                    background: viewMode === 'cards' ? 'var(--bg-secondary)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: viewMode === 'cards' ? '#d97706' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Inventory Directory Table View"
                  style={{
                    padding: '6px 10px',
                    background: viewMode === 'table' ? 'var(--bg-secondary)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: viewMode === 'table' ? '#d97706' : 'var(--text-secondary)',
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
          TAB 1: RAW MATERIALS (STEEL YARD CARDS OR SPEC TABLE)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'materials' && (
        <>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              Loading raw materials inventory...
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px dashed var(--border-color)'
            }}>
              <Boxes size={44} style={{ color: '#d97706', margin: '0 auto 12px', opacity: 0.8 }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600 }}>No raw materials match your criteria</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Try clearing search terms or registering a new coil grade or sheet material.
              </p>
              <button className="btn btn-primary" onClick={openCreate} style={{ background: '#d97706', borderColor: '#f59e0b' }}>
                <Plus size={14} /> Register First Material
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* ─────────────────────────────────────────────────────────────
               VIEW 1: STEEL YARD & COIL CARDS GRID
               ───────────────────────────────────────────────────────────── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '16px'
            }}>
              {filteredMaterials.map(m => {
                const isActive = m.isActive !== false && m.status !== 'Inactive';
                const cost = Number(m.standardCost) || 0;
                const min = m.minStock ?? m.Safety_Stock_Level ?? 0;
                const rop = m.reorderLevel ?? m.Reorder_Point ?? 0;
                const max = m.maxStock || 10000;
                const uomSymbol = m.uomId?.symbol || m.uomId?.name || 'kg';

                return (
                  <div
                    key={m._id}
                    onClick={() => setSelectedDossier(m)}
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
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(217, 119, 6, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.45)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    {/* Top Bronze Industrial Accent */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '42px',
                      height: '42px',
                      background: 'linear-gradient(135deg, transparent 50%, rgba(245, 158, 11, 0.15) 50%)',
                      borderTopRightRadius: '14px',
                      pointerEvents: 'none'
                    }} />

                    {/* Card Top: Code & Grade Chips */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            onClick={e => handleCopyCode(m.code, m._id, e)}
                            title="Click to copy material code"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(245, 158, 11, 0.14)',
                              color: '#d97706',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '12px',
                              letterSpacing: '0.04em'
                            }}
                          >
                            {m.code || 'MAT-NEW'}
                            {copiedCodeId === m._id ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                          </span>

                          {m.grade && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              fontSize: '11px',
                              fontWeight: 700
                            }}>
                              <Flame size={11} color="#d97706" />
                              {m.grade}
                            </span>
                          )}
                        </div>

                        <h3 style={{
                          margin: '8px 0 0 0',
                          fontSize: '15px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3
                        }}>
                          {m.name}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(100, 116, 139, 0.15)',
                          color: 'var(--text-secondary)'
                        }}>
                          {m.Material_Type || 'RAW_MATERIAL'}
                        </span>
                      </div>
                    </div>

                    {/* Category & Sourcing Mill Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(217, 119, 6, 0.08)',
                        color: '#b45309',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {m.categoryId?.name || 'Raw Material'}
                      </span>

                      {m.preferredVendorId && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 500
                        }}>
                          <Building size={11} />
                          {m.preferredVendorId.name}
                        </span>
                      )}

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(14, 165, 233, 0.08)',
                        color: '#0284c7',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        <Clock size={11} />
                        {m.leadTimeDays || 0}d lead time
                      </span>
                    </div>

                    {/* Pricing & Stock Buffer Metrics Container */}
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
                            Standard Material Cost
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtMoneyFull(cost)} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/ {uomSymbol}</span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                            Reorder Trigger (ROP)
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#d97706', fontVariantNumeric: 'tabular-nums' }}>
                            {rop.toLocaleString()} {uomSymbol}
                          </div>
                        </div>
                      </div>

                      {/* Safety Buffer & ROP Progress Indicator */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Min Buffer: {min.toLocaleString()} {uomSymbol}</span>
                          <span style={{ color: 'var(--text-tertiary)' }}>Max: {max.toLocaleString()} {uomSymbol}</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min((rop / max) * 100, 100)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #d97706, #f59e0b)',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Footer: Storage Bin & Action Icons */}
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
                          Bin: {m.defaultBinId?.name || 'Raw Material Store Yard'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedDossier(m);
                          }}
                          title="Inspect Material 360 Dossier"
                          style={{
                            padding: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#d97706'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={e => handleEdit(m, e)}
                          title="Edit Material Specs"
                          style={{
                            padding: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#d97706'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={e => toggleStatus(m, e)}
                          title={isActive ? 'Deactivate material' : 'Reactivate material'}
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
               VIEW 2: MATERIAL INVENTORY MATRIX (ENTERPRISE TABLE)
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
                      <th style={{ padding: '12px 16px' }}>Code & Description</th>
                      <th style={{ padding: '12px 14px' }}>Category</th>
                      <th style={{ padding: '12px 14px' }}>Grade</th>
                      <th style={{ padding: '12px 14px' }}>Material Type</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Standard Cost</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Buffer (Min)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Reorder Level</th>
                      <th style={{ padding: '12px 14px' }}>Preferred Supplier</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map(m => {
                      const isActive = m.isActive !== false && m.status !== 'Inactive';
                      const cost = Number(m.standardCost) || 0;
                      const min = m.minStock ?? m.Safety_Stock_Level ?? 0;
                      const rop = m.reorderLevel ?? m.Reorder_Point ?? 0;
                      const uomSymbol = m.uomId?.symbol || m.uomId?.name || 'kg';

                      return (
                        <tr
                          key={m._id}
                          onClick={() => setSelectedDossier(m)}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Code & Name */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                onClick={e => handleCopyCode(m.code, m._id, e)}
                                title="Copy Material Code"
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: '#d97706',
                                  fontSize: '12px',
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                {m.code}
                              </span>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {m.name}
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
                              {m.categoryId?.name || '-'}
                            </span>
                          </td>

                          {/* Grade */}
                          <td style={{ padding: '12px 14px' }}>
                            {m.grade ? (
                              <span style={{
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                background: 'rgba(245, 158, 11, 0.08)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {m.grade}
                              </span>
                            ) : '-'}
                          </td>

                          {/* Material Type */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {m.Material_Type || 'RAW_MATERIAL'}
                            </span>
                          </td>

                          {/* Standard Cost */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {fmtMoneyFull(cost)} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>/{uomSymbol}</span>
                          </td>

                          {/* Buffer Min Stock */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                            {min.toLocaleString()} {uomSymbol}
                          </td>

                          {/* Reorder Level */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#d97706' }}>
                            {rop.toLocaleString()} {uomSymbol}
                          </td>

                          {/* Preferred Vendor */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                              {m.preferredVendorId?.name || 'Spot / Open RFQ'}
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
                                  setSelectedDossier(m);
                                }}
                                title="Inspect 360 Dossier"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#d97706'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                onClick={e => handleEdit(m, e)}
                                title="Edit Material"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#d97706'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                onClick={e => toggleStatus(m, e)}
                                title={isActive ? 'Deactivate' : 'Activate'}
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
          TAB 2: MATERIAL CATEGORIES CONSOLE
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
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Raw Material Classifications & Categories</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Group infeed inventory into CR Steel Coils, HR Steel Plates, Tool Steel for dies, and Consumables for press shop operations.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openCreate} style={{ background: '#d97706', borderColor: '#f59e0b' }}>
              <Plus size={14} /> Add Material Category
            </button>
          </div>

          <div style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            display: 'grid',
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
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#d97706',
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
                      {c.description || 'Standard procurement classification for stamping infeed materials.'}
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
                      <strong style={{ color: 'var(--text-primary)' }}>{partsCount}</strong> Materials assigned
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={e => handleEdit(c, e)}
                        title="Edit Category"
                        style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#d97706'}
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
          MATERIAL 360 SLIDE-OVER METALLURGY DOSSIER DRAWER
          ───────────────────────────────────────────────────────────── */}
      {selectedDossier && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(24, 24, 27, 0.6)',
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
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.35)',
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
                    background: 'rgba(245, 158, 11, 0.14)',
                    color: '#d97706',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}>
                    {selectedDossier.code}
                  </span>
                  {selectedDossier.grade && (
                    <span style={{
                      padding: '2px 7px',
                      borderRadius: '5px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#b45309',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      {selectedDossier.grade}
                    </span>
                  )}
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px'
                  }}>
                    {selectedDossier.categoryId?.name || 'Raw Material'}
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

            {/* Inventory Buffers & Safety Guard Card */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={13} />
                Store Buffers & Reorder Triggers
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Reorder Point (ROP)</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#d97706', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                    {(selectedDossier.reorderLevel ?? selectedDossier.Reorder_Point ?? 0).toLocaleString()} {selectedDossier.uomId?.symbol || 'kg'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Minimum Buffer Stock</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                    {(selectedDossier.minStock ?? selectedDossier.Safety_Stock_Level ?? 0).toLocaleString()} {selectedDossier.uomId?.symbol || 'kg'}
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Max Store Capacity</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {(selectedDossier.maxStock || 10000).toLocaleString()} {selectedDossier.uomId?.symbol || 'kg'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Shelf Life Duration</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>
                    {selectedDossier.shelfLifeDays ? `${selectedDossier.shelfLifeDays} Days` : 'Unlimited'}
                  </div>
                </div>
              </div>
            </div>

            {/* Procurement & Metallurgical Sourcing */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={13} />
                Procurement & Inbound Mill Logistics
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Standard Inbound Cost:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px', marginTop: '2px' }}>
                    {fmtMoneyFull(selectedDossier.standardCost || 0)} / {selectedDossier.uomId?.symbol || 'kg'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Supplier Lead Time:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedDossier.leadTimeDays || 0} Days from PO dispatch
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Preferred Mill / Supplier:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={13} color="#d97706" />
                    {selectedDossier.preferredVendorId?.name || 'Spot / Multi-Source Mill'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Storage Bin Location:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <WarehouseIcon size={12} color="#64748b" />
                    {selectedDossier.defaultBinId?.name || 'Main Raw Materials Yard'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>HSN Code:</span>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedDossier.hsnCode || '7209 (Cold Rolled Flat)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Downstream Material Workflows */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Inventory & Procurement Workflows
              </div>

              <button
                onClick={() => navigate('/procurement/pr')}
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
                onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={14} color="#d97706" />
                  Raise Purchase Requisition (PR)
                </span>
                <ArrowUpRight size={14} color="var(--text-tertiary)" />
              </button>

              <button
                onClick={() => navigate('/inventory/issue')}
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
                onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Boxes size={14} color="#0284c7" />
                  Issue to Shop Floor Work Order
                </span>
                <ArrowUpRight size={14} color="var(--text-tertiary)" />
              </button>

              <button
                onClick={() => navigate('/inventory/control')}
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
                onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={14} color="#16a34a" />
                  View Current Stock Level & Transactions
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
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  border: '1px solid #f59e0b',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Edit2 size={14} />
                Edit Material Specs
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
          RAW MATERIAL / CATEGORY REGISTRATION & EDIT MODAL
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(24, 24, 27, 0.7)',
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
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
            width: '100%',
            maxWidth: activeTab === 'materials' ? '740px' : '480px',
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
              background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
              color: '#ffffff'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
                  {editingId ? 'Edit Raw Material' : 'Register New Raw Material'}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#a1a1aa' }}>
                  {activeTab === 'materials'
                    ? 'Configure metallurgical grade, safety buffer stock, standard cost, and preferred mill supplier.'
                    : 'Group materials into steel types or consumables for shop floor routing.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: '4px' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {activeTab === 'materials' ? (
                <>
                  {/* Two-Column Form Layout for Material */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: 600 }}>
                        Material Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="e.g., CRCA Coil 0.8mm, HR Sheet 2.0mm"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: 600 }}>
                        Material Code <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="MAT-011"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: 600 }}>
                        Material Category <span style={{ color: '#ef4444' }}>*</span>
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

                  {/* Metallurgical Grade, Material Type & Preferred Supplier */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div className="input-group">
                      <label className="input-label">Metallurgical Grade</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., CRCA D513, IS 2062"
                        value={formData.grade || ''}
                        onChange={e => setFormData({ ...formData, grade: e.target.value })}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Material Classification</label>
                      <select
                        className="input-field"
                        value={formData.Material_Type || 'RAW_MATERIAL'}
                        onChange={e => setFormData({ ...formData, Material_Type: e.target.value })}
                      >
                        <option value="RAW_MATERIAL">Raw Material (Infeed)</option>
                        <option value="WIP">Work in Progress (WIP)</option>
                        <option value="FINISHED_GOOD">Finished Component</option>
                        <option value="SPARE_PART">Maintenance Spare</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Preferred Sourcing Mill</label>
                      <select
                        className="input-field"
                        value={formData.preferredVendorId || ''}
                        onChange={e => setFormData({ ...formData, preferredVendorId: e.target.value })}
                      >
                        <option value="">None / Spot RFQ</option>
                        {vendors.map(v => (
                          <option key={v._id} value={v._id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pricing, Lead Time & Storage Bin */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div className="input-group">
                      <label className="input-label">Standard Cost (₹ / unit)</label>
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
                      <label className="input-label">Delivery Lead Time (Days)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="7"
                        value={formData.leadTimeDays ?? ''}
                        onChange={e => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Default Storage Bin Location</label>
                      <select
                        className="input-field"
                        value={formData.defaultBinId || ''}
                        onChange={e => setFormData({ ...formData, defaultBinId: e.target.value })}
                      >
                        <option value="">Select Bin / Yard Location</option>
                        {bins.map(b => (
                          <option key={b._id} value={b._id}>{b.name} ({b.code || 'Bin'})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Stock Buffers & Reorder Triggers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div className="input-group">
                      <label className="input-label">Minimum Buffer Stock (Min)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="1000"
                        value={formData.minStock ?? ''}
                        onChange={e => setFormData({
                          ...formData,
                          minStock: parseFloat(e.target.value) || 0,
                          Safety_Stock_Level: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: 600, color: '#d97706' }}>
                        Reorder Trigger Level (ROP)
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="2500"
                        value={formData.reorderLevel ?? ''}
                        onChange={e => setFormData({
                          ...formData,
                          reorderLevel: parseFloat(e.target.value) || 0,
                          Reorder_Point: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Maximum Yard Capacity</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="10000"
                        value={formData.maxStock ?? ''}
                        onChange={e => setFormData({ ...formData, maxStock: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
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
                      placeholder="e.g., CR Steel, HR Steel, Tool Steel, Consumables"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Category Description & Scope</label>
                    <textarea
                      className="input-field"
                      rows="4"
                      placeholder="Specify material specifications and typical sheet/coil thickness ranges..."
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
                    Active materials can be ordered via Purchase Orders and allocated in BOM production routines.
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
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    border: '1px solid #f59e0b',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)'
                  }}
                >
                  {saving ? 'Saving...' : (editingId ? 'Update Material Specs' : 'Register Material')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialMaster;