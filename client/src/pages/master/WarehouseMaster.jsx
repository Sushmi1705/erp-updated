import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Building, Map, Target, Layers, LayoutGrid, Boxes, Warehouse, Truck,
  ArrowRight, Search, Plus, Edit2, Eye, Check, CheckCircle, CheckCircle2, XCircle, X,
  Download, Sparkles, ChevronRight, ChevronDown, Package, ShieldCheck,
  AlertCircle, ExternalLink, FileText, RefreshCw, Copy, Folder, FolderOpen,
  Maximize2, ArrowUpRight, BarChart2
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

/* The five spatial levels of enterprise storage topology */
const LEVEL_CONFIG = {
  warehouses: {
    key: 'warehouses',
    singular: 'Store / Warehouse',
    plural: 'Stores & Warehouses',
    endpoint: '/master/warehouse',
    codePrefix: 'WH-',
    icon: Building,
    parentKey: 'plantId',
    parentLabel: 'Plant',
    badgeColor: '#4338ca',
    bgBadge: 'rgba(67, 56, 202, 0.12)',
    desc: 'Primary facility building where raw materials, WIP, and finished goods are controlled.'
  },
  locations: {
    key: 'locations',
    singular: 'Storage Area / Bay',
    plural: 'Storage Areas & Bays',
    endpoint: '/master/storagelocation',
    codePrefix: 'LOC-',
    icon: Map,
    parentKey: 'warehouseId',
    parentLabel: 'Parent Store',
    badgeColor: '#0284c7',
    bgBadge: 'rgba(2, 132, 199, 0.12)',
    desc: 'Functional receiving, staging, or buffer bay inside a specific warehouse.'
  },
  zones: {
    key: 'zones',
    singular: 'Storage Zone',
    plural: 'Storage Zones',
    endpoint: '/master/storagezone',
    codePrefix: 'ZN-',
    icon: Target,
    parentKey: 'storageLocationId',
    parentLabel: 'Storage Area',
    badgeColor: '#0d9488',
    bgBadge: 'rgba(13, 148, 136, 0.12)',
    desc: 'Designated physical zone grouped by material type (coils, sheets, finished goods).'
  },
  racks: {
    key: 'racks',
    singular: 'Rack / Cantilever',
    plural: 'Racks & Cantilevers',
    endpoint: '/master/rack',
    codePrefix: 'RCK-',
    icon: Layers,
    parentKey: 'zoneId',
    parentLabel: 'Zone',
    badgeColor: '#d97706',
    bgBadge: 'rgba(217, 119, 6, 0.12)',
    desc: 'Multi-tier vertical pallet racking or heavy-duty cantilever coil cradle.'
  },
  bins: {
    key: 'bins',
    singular: 'Storage Bin / Cell',
    plural: 'Storage Bins & Cells',
    endpoint: '/master/bin',
    codePrefix: 'BIN-',
    icon: LayoutGrid,
    parentKey: 'rackId',
    parentLabel: 'Rack',
    badgeColor: '#10b981',
    bgBadge: 'rgba(16, 185, 129, 0.12)',
    desc: 'Micro physical storage slot with barcode address used for GRN putaway and picking.'
  }
};

const WarehouseMaster = () => {
  const navigate = useNavigate();

  // Active console tab: 'warehouses' | 'locations' | 'zones' | 'racks' | 'bins' | 'topology'
  const [activeTab, setActiveTab] = useState('warehouses');

  // View mode for list tabs: 'cards' | 'table'
  const [viewMode, setViewMode] = useState('cards');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParentFilter, setSelectedParentFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'code' | 'parent'

  // Master Data state for all 5 levels
  const [plants, setPlants] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [zones, setZones] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null); // Facility 360 Slide-Over
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // Topology Tree expanded state
  const [expandedNodes, setExpandedNodes] = useState({});

  // Deep-link quick create (?create=1)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('create') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all levels on mount & when tab changes
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pRes, wRes, lRes, zRes, rRes, bRes, sRes] = await Promise.all([
        axios.get('/company/plants?limit=100').catch(() => ({ data: { data: [] } })),
        axios.get('/master/warehouse?limit=200&includeInactive=true').catch(() => ({ data: { data: [] } })),
        axios.get('/master/storagelocation?limit=200&includeInactive=true').catch(() => ({ data: { data: [] } })),
        axios.get('/master/storagezone?limit=200&includeInactive=true').catch(() => ({ data: { data: [] } })),
        axios.get('/master/rack?limit=200&includeInactive=true').catch(() => ({ data: { data: [] } })),
        axios.get('/master/bin?limit=200&includeInactive=true').catch(() => ({ data: { data: [] } })),
        axios.get('/inventory/stock?limit=200').catch(() => ({ data: { data: [] } }))
      ]);

      setPlants(pRes.data?.data || []);
      setWarehouses(wRes.data?.data || []);
      setLocations(lRes.data?.data || []);
      setZones(zRes.data?.data || []);
      setRacks(rRes.data?.data || []);
      setBins(bRes.data?.data || []);
      setStocks(sRes.data?.data || []);

      // Auto-expand first warehouse in topology tree
      const firstWh = (wRes.data?.data || [])[0];
      if (firstWh) {
        setExpandedNodes(prev => ({ ...prev, [firstWh._id]: true }));
      }
    } catch (err) {
      console.error('Error fetching warehouse master data:', err);
    }
    setLoading(false);
  };

  // Telemetry Metrics
  const telemetry = useMemo(() => {
    const totalStores = warehouses.length;
    const activeStores = warehouses.filter(w => w.status !== 'Inactive' && w.isActive !== false).length;
    const totalLocations = locations.length;
    const totalZones = zones.length;
    const totalRacks = racks.length;
    const totalBins = bins.length;
    const totalStockBatches = stocks.length;
    return { totalStores, activeStores, totalLocations, totalZones, totalRacks, totalBins, totalStockBatches };
  }, [warehouses, locations, zones, racks, bins, stocks]);

  // Current Level Dataset based on activeTab
  const currentDataset = useMemo(() => {
    switch (activeTab) {
      case 'warehouses': return warehouses;
      case 'locations': return locations;
      case 'zones': return zones;
      case 'racks': return racks;
      case 'bins': return bins;
      default: return [];
    }
  }, [activeTab, warehouses, locations, zones, racks, bins]);

  // Filtered dataset for current active tab
  const filteredDataset = useMemo(() => {
    if (activeTab === 'topology') return [];

    return currentDataset.filter(item => {
      // Parent Filter
      if (selectedParentFilter !== 'ALL') {
        if (activeTab === 'warehouses') {
          const pid = item.plantId?._id || item.plantId;
          if (pid !== selectedParentFilter) return false;
        } else if (activeTab === 'locations') {
          const wid = item.warehouseId?._id || item.warehouseId;
          if (wid !== selectedParentFilter) return false;
        } else if (activeTab === 'zones') {
          const lid = item.storageLocationId?._id || item.storageLocationId;
          if (lid !== selectedParentFilter) return false;
        } else if (activeTab === 'racks') {
          const zid = item.zoneId?._id || item.zoneId;
          if (zid !== selectedParentFilter) return false;
        } else if (activeTab === 'bins') {
          const rid = item.rackId?._id || item.rackId;
          if (rid !== selectedParentFilter) return false;
        }
      }

      // Status Filter
      if (selectedStatusFilter === 'ACTIVE' && (item.status === 'Inactive' || item.isActive === false)) return false;
      if (selectedStatusFilter === 'INACTIVE' && item.status !== 'Inactive' && item.isActive !== false) return false;

      // Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchCode = item.code?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchType = (item.type || item.areaType || item.zoneType || item.rackType)?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesc && !matchType) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
      return 0;
    });
  }, [activeTab, currentDataset, selectedParentFilter, selectedStatusFilter, searchTerm, sortBy]);

  // One-click Calibrate Standard Automotive Facility Layout
  const handleCalibrateTopologyPresets = async () => {
    if (!await confirmAction('Calibrate complete 5-tier automotive storage layout (Coil Receiving Bay, Stamping Buffers, High-Bay Pallet Racks, and Barcoded Bins) for your stores?')) return;
    setCalibrating(true);
    try {
      // Find or pick a raw material store and a finished goods store
      const rmWh = warehouses.find(w => (w.type || '').toLowerCase().includes('raw') || (w.name || '').toLowerCase().includes('raw')) || warehouses[0];
      const fgWh = warehouses.find(w => (w.type || '').toLowerCase().includes('finished') || (w.name || '').toLowerCase().includes('finished')) || warehouses[1] || warehouses[0];

      if (!rmWh) {
        notify.error('Please create at least one Store / Warehouse first.');
        setCalibrating(false);
        return;
      }

      // 1. Raw Materials Bay
      let locRM = locations.find(l => (l.warehouseId?._id || l.warehouseId) === rmWh._id);
      if (!locRM) {
        const res = await axios.post('/master/storagelocation', {
          name: 'Coil & Heavy Infeed Bay',
          code: 'LOC-RM-COIL-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          warehouseId: rmWh._id,
          areaType: 'Receiving Bay',
          description: 'Dock 1 heavy vehicle receiving & coil cradle infeed area',
          status: 'Active'
        });
        locRM = res.data?.data;
      }

      // 2. Raw Materials Zone
      let zoneRM = null;
      if (locRM) {
        zoneRM = zones.find(z => (z.storageLocationId?._id || z.storageLocationId) === locRM._id);
        if (!zoneRM) {
          const res = await axios.post('/master/storagezone', {
            name: 'CRCA Coil Staging Zone',
            code: 'ZN-CRCA-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            storageLocationId: locRM._id,
            zoneType: 'Heavy Coils',
            description: 'Reinforced floor zone for prime sheet coils',
            status: 'Active'
          });
          zoneRM = res.data?.data;
        }
      }

      // 3. Raw Materials Rack
      let rackRM = null;
      if (zoneRM) {
        rackRM = racks.find(r => (r.zoneId?._id || r.zoneId) === zoneRM._id);
        if (!rackRM) {
          const res = await axios.post('/master/rack', {
            name: 'Cantilever Coil Cradle Rack 01',
            code: 'RCK-COIL-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            zoneId: zoneRM._id,
            rackType: 'Cantilever',
            levels: 2,
            capacityTons: 40,
            status: 'Active'
          });
          rackRM = res.data?.data;
        }
      }

      // 4. Raw Materials Bins
      if (rackRM) {
        const binAExists = bins.some(b => (b.rackId?._id || b.rackId) === rackRM._id);
        if (!binAExists) {
          await axios.post('/master/bin', {
            name: 'Coil Cradle Slot 1-A',
            code: 'BIN-COIL-01A',
            rackId: rackRM._id,
            barcode: 'BC-COIL-01A',
            maxWeightKg: 15000,
            status: 'Active'
          });
          await axios.post('/master/bin', {
            name: 'Coil Cradle Slot 1-B',
            code: 'BIN-COIL-01B',
            rackId: rackRM._id,
            barcode: 'BC-COIL-01B',
            maxWeightKg: 15000,
            status: 'Active'
          });
        }
      }

      // If FG Warehouse exists, seed FG Bay and Bins
      if (fgWh && fgWh._id !== rmWh._id) {
        let locFG = locations.find(l => (l.warehouseId?._id || l.warehouseId) === fgWh._id);
        if (!locFG) {
          const res = await axios.post('/master/storagelocation', {
            name: 'Finished Parts Dispatch Bay',
            code: 'LOC-FG-DSP-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            warehouseId: fgWh._id,
            areaType: 'Dispatch Staging',
            description: 'Outbound dispatch wrapping & pallet staging dock',
            status: 'Active'
          });
          locFG = res.data?.data;
        }

        let zoneFG = null;
        if (locFG) {
          zoneFG = zones.find(z => (z.storageLocationId?._id || z.storageLocationId) === locFG._id);
          if (!zoneFG) {
            const res = await axios.post('/master/storagezone', {
              name: 'High-Bay Pallet Zone',
              code: 'ZN-FG-PALLET-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
              storageLocationId: locFG._id,
              zoneType: 'Finished Assemblies',
              description: 'Multi-tier selective pallet racking for OEM dispatches',
              status: 'Active'
            });
            zoneFG = res.data?.data;
          }
        }

        let rackFG = null;
        if (zoneFG) {
          rackFG = racks.find(r => (r.zoneId?._id || r.zoneId) === zoneFG._id);
          if (!rackFG) {
            const res = await axios.post('/master/rack', {
              name: 'High-Bay Pallet Rack A',
              code: 'RCK-HBR-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
              zoneId: zoneFG._id,
              rackType: 'Pallet Rack',
              levels: 4,
              capacityTons: 20,
              status: 'Active'
            });
            rackFG = res.data?.data;
          }
        }

        if (rackFG) {
          const binFGExists = bins.some(b => (b.rackId?._id || b.rackId) === rackFG._id);
          if (!binFGExists) {
            await axios.post('/master/bin', {
              name: 'Pallet Bay Alpha-01',
              code: 'BIN-FG-A01',
              rackId: rackFG._id,
              barcode: 'BC-FG-A01',
              maxWeightKg: 2500,
              status: 'Active'
            });
            await axios.post('/master/bin', {
              name: 'Pallet Bay Alpha-02',
              code: 'BIN-FG-A02',
              rackId: rackFG._id,
              barcode: 'BC-FG-A02',
              maxWeightKg: 2500,
              status: 'Active'
            });
          }
        }
      }

      await fetchAllData();
      notify.success('Standard automotive facility topology calibrated successfully!');
    } catch (err) {
      console.error(err);
      notify.error('Error calibrating topology: ' + (err.response?.data?.message || err.message));
    }
    setCalibrating(false);
  };

  // Open Create Modal
  const openCreate = () => {
    const config = LEVEL_CONFIG[activeTab] || LEVEL_CONFIG.warehouses;
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const defaultCode = config.codePrefix + randomSuffix;

    setFormData({
      code: defaultCode,
      name: '',
      status: 'Active',
      type: 'Raw Material',
      areaType: 'Storage Bay',
      zoneType: 'Heavy Coils',
      rackType: 'Pallet Rack',
      levels: 3,
      capacityTons: 10,
      maxWeightKg: 5000,
      plantId: plants[0]?._id || '',
      warehouseId: warehouses[0]?._id || '',
      storageLocationId: locations[0]?._id || '',
      zoneId: zones[0]?._id || '',
      rackId: racks[0]?._id || ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (row) => {
    setFormData({
      ...row,
      plantId: row.plantId?._id || row.plantId,
      warehouseId: row.warehouseId?._id || row.warehouseId,
      storageLocationId: row.storageLocationId?._id || row.storageLocationId,
      zoneId: row.zoneId?._id || row.zoneId,
      rackId: row.rackId?._id || row.rackId,
      status: row.status || (row.isActive ? 'Active' : 'Inactive')
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  // Toggle Active/Inactive
  const toggleStatus = async (row) => {
    const config = LEVEL_CONFIG[activeTab] || LEVEL_CONFIG.warehouses;
    const isCurrentlyActive = row.status !== 'Inactive' && row.isActive !== false;

    if (isCurrentlyActive && !await confirmAction(`Deactivate ${config.singular} "${row.name}" (${row.code})?`)) return;

    try {
      await axios.put(`${config.endpoint}/${row._id}`, {
        status: isCurrentlyActive ? 'Inactive' : 'Active',
        isActive: !isCurrentlyActive
      });
      notify.success(`${config.singular} ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully.`);
      fetchAllData();
    } catch (err) {
      notify.error('Error updating status');
    }
  };

  // Save Record
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    const config = LEVEL_CONFIG[activeTab] || LEVEL_CONFIG.warehouses;
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${config.endpoint}/${editingId}`, formData);
        notify.success(`${config.singular} updated successfully!`);
      } else {
        await axios.post(config.endpoint, formData);
        notify.success(`New ${config.singular} registered successfully!`);
      }
      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      fetchAllData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving facility record');
    }
    setSaving(false);
  };

  // Copy code to clipboard
  const handleCopyCode = (id, code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCodeId(id);
    notify.success(`Copied code "${code}" to clipboard!`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Toggle Tree Node
  const toggleTreeNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // CSV Export
  const handleExportCSV = () => {
    const config = LEVEL_CONFIG[activeTab] || LEVEL_CONFIG.warehouses;
    if (filteredDataset.length === 0) {
      notify.error('No records available to export.');
      return;
    }

    const headers = ['Level', 'Code', 'Name', 'Parent Entity', 'Type', 'Status'];
    const rows = filteredDataset.map(item => {
      let parentName = '-';
      if (activeTab === 'warehouses') parentName = item.plantId?.name || '-';
      else if (activeTab === 'locations') parentName = item.warehouseId?.name || '-';
      else if (activeTab === 'zones') parentName = item.storageLocationId?.name || '-';
      else if (activeTab === 'racks') parentName = item.zoneId?.name || '-';
      else if (activeTab === 'bins') parentName = item.rackId?.name || '-';

      const type = item.type || item.areaType || item.zoneType || item.rackType || 'Standard';
      return [
        `"${config.singular}"`,
        `"${item.code || ''}"`,
        `"${item.name || ''}"`,
        `"${parentName}"`,
        `"${type}"`,
        `"${item.status || 'Active'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Precision_Facility_Topology_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Facility topology exported to CSV.');
  };

  const currentLevelConfig = LEVEL_CONFIG[activeTab] || LEVEL_CONFIG.warehouses;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', gap: 20 }}>
      {/* ── INDUSTRIAL LOGISTICS HUB BANNER ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%)',
        borderRadius: 12,
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Logistics Bay Blueprint Grid Motif */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '45%',
          opacity: 0.08,
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', marginBottom: 12, border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Warehouse size={14} color="#fbbf24" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#fbbf24', textTransform: 'uppercase' }}>
                Plant Logistics & Storage Topology Center • 5-Tier Spatial Hierarchy
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Stores & Warehouses Master
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.55 }}>
              Central spatial management hierarchy governing automotive coil stockyards, press infeed buffer staging, multi-tier high-bay pallet racking, and discrete bin cell addresses for automated GRN putaway and work order picking.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Export CSV topology"
            >
              <Download size={15} /> Export CSV
            </button>

            <button
              onClick={handleCalibrateTopologyPresets}
              disabled={calibrating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                background: 'rgba(251, 191, 36, 0.2)',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Calibrate standard automotive bays, zones, racks, and bins"
            >
              <Sparkles size={15} /> {calibrating ? 'Calibrating Layout…' : 'Calibrate Facility Presets'}
            </button>

            {activeTab !== 'topology' && (
              <button
                onClick={openCreate}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: '#f59e0b',
                  color: '#1e1b4b',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={16} /> Add {currentLevelConfig.singular}
              </button>
            )}
          </div>
        </div>

        {/* ── SPATIAL TELEMETRY TILES ───────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
          marginTop: 22
        }}>
          {/* Tile 1 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Stores & Warehouses
              </span>
              <Building size={14} color="#fbbf24" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.totalStores}</span>
              <span style={{ fontSize: 11, color: '#fef08a' }}>({telemetry.activeStores} Active Facilities)</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              Raw Material, WIP & FG storehouses
            </p>
          </div>

          {/* Tile 2 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Storage Bays & Areas
              </span>
              <Map size={14} color="#38bdf8" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.totalLocations}</span>
              <span style={{ fontSize: 11, color: '#bae6fd' }}>Bays & Docks</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              Infeed docks, staging & buffers
            </p>
          </div>

          {/* Tile 3 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Racks & Cantilevers
              </span>
              <Layers size={14} color="#f59e0b" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.totalRacks}</span>
              <span style={{ fontSize: 11, color: '#fef08a' }}>Multi-Tier Racks</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              Cantilevers & vertical pallet tiers
            </p>
          </div>

          {/* Tile 4 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Calibrated Bin Cells
              </span>
              <LayoutGrid size={14} color="#34d399" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.totalBins}</span>
              <span style={{ fontSize: 11, color: '#a7f3d0' }}>Storage Addresses</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              Barcode-scannable putaway cells
            </p>
          </div>
        </div>
      </div>

      {/* ── CONSOLE TABS NAVIGATION ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 4, overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'warehouses', label: `Stores (${warehouses.length})`, icon: Building },
            { id: 'locations', label: `Storage Areas (${locations.length})`, icon: Map },
            { id: 'zones', label: `Zones (${zones.length})`, icon: Target },
            { id: 'racks', label: `Racks (${racks.length})`, icon: Layers },
            { id: 'bins', label: `Bins (${bins.length})`, icon: LayoutGrid },
            { id: 'topology', label: 'Facility Topology Visualizer', icon: FolderOpen }
          ].map(tab => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedParentFilter('ALL');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  border: 'none',
                  background: isSelected ? '#312e81' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab !== 'topology' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-secondary)', padding: 3, borderRadius: 6, border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? '#312e81' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600
              }}
              title="Spatial Cards View"
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#312e81' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600
              }}
              title="Facility Table View"
            >
              <FileText size={14} /> Table
            </button>
          </div>
        )}
      </div>

      {/* ── FILTER & SEARCH BAR (FOR LIST TABS) ──────────────────────────────── */}
      {activeTab !== 'topology' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Parent Context Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Filter by {currentLevelConfig.parentLabel}:
            </span>
            <select
              value={selectedParentFilter}
              onChange={e => setSelectedParentFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              <option value="ALL">All {currentLevelConfig.parentLabel}s</option>
              {activeTab === 'warehouses' && plants.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
              ))}
              {activeTab === 'locations' && warehouses.map(w => (
                <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
              ))}
              {activeTab === 'zones' && locations.map(l => (
                <option key={l._id} value={l._id}>{l.name} ({l.code})</option>
              ))}
              {activeTab === 'racks' && zones.map(z => (
                <option key={z._id} value={z._id}>{z.name} ({z.code})</option>
              ))}
              {activeTab === 'bins' && racks.map(r => (
                <option key={r._id} value={r._id}>{r.name} ({r.code})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={`Search ${currentLevelConfig.plural.toLowerCase()}…`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 12
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 12
              }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 12
              }}
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="code">Sort: Code</option>
            </select>
          </div>
        </div>
      )}

      {/* ── LOADING STATE ──────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
          Querying facility spatial directory…
        </div>
      )}

      {/* ── EMPTY STATE ────────────────────────────────────────────────────── */}
      {!loading && activeTab !== 'topology' && filteredDataset.length === 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <Warehouse size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            No {currentLevelConfig.plural.toLowerCase()} found
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px 0', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
            {currentLevelConfig.desc} Create your first record or click below to calibrate standard automotive storage topology.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={handleCalibrateTopologyPresets}
              className="btn btn-primary"
              style={{ background: '#312e81', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Sparkles size={14} /> Calibrate Facility Presets
            </button>
            <button
              onClick={openCreate}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} /> Add {currentLevelConfig.singular}
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW MODE 1: SPATIAL CARDS GRID ────────────────────────────────── */}
      {!loading && activeTab !== 'topology' && viewMode === 'cards' && filteredDataset.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: 16
        }}>
          {filteredDataset.map(item => {
            const isActive = item.status !== 'Inactive' && item.isActive !== false;
            const isCopied = copiedCodeId === item._id;

            // Parent entity label
            let parentLabel = '-';
            let parentCode = '';
            if (activeTab === 'warehouses') {
              parentLabel = item.plantId?.name || 'Plant';
              parentCode = item.plantId?.code || '';
            } else if (activeTab === 'locations') {
              parentLabel = item.warehouseId?.name || 'Store';
              parentCode = item.warehouseId?.code || '';
            } else if (activeTab === 'zones') {
              parentLabel = item.storageLocationId?.name || 'Area';
              parentCode = item.storageLocationId?.code || '';
            } else if (activeTab === 'racks') {
              parentLabel = item.zoneId?.name || 'Zone';
              parentCode = item.zoneId?.code || '';
            } else if (activeTab === 'bins') {
              parentLabel = item.rackId?.name || 'Rack';
              parentCode = item.rackId?.code || '';
            }

            const itemType = item.type || item.areaType || item.zoneType || item.rackType || 'Standard';

            return (
              <div
                key={item._id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  borderTop: `3px solid ${currentLevelConfig.badgeColor}`
                }}
              >
                <div>
                  {/* Top Bar: Code Chip & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div
                      onClick={() => handleCopyCode(item._id, item.code)}
                      title="Click to copy code"
                      style={{
                        background: currentLevelConfig.bgBadge,
                        color: currentLevelConfig.badgeColor,
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontWeight: 800,
                        fontSize: 13,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>{item.code}</span>
                      {isCopied ? <Check size={12} /> : <Copy size={11} style={{ opacity: 0.6 }} />}
                    </div>

                    <div onClick={() => toggleStatus(item)} style={{ cursor: 'pointer' }} title="Toggle active status">
                      <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                    </div>
                  </div>

                  {/* Title & Type */}
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    {item.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {itemType}
                    </span>

                    {/* Specific level attributes */}
                    {item.levels && (
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        • {item.levels} Tiers
                      </span>
                    )}
                    {item.capacityTons && (
                      <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                        • Max {item.capacityTons} T
                      </span>
                    )}
                    {item.maxWeightKg && (
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                        • Max {item.maxWeightKg.toLocaleString()} kg
                      </span>
                    )}
                  </div>

                  {/* Parent Breadcrumb Pill */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    fontSize: 12,
                    marginBottom: 10
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                      {currentLevelConfig.parentLabel}:
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{parentLabel}</strong>
                    {parentCode && <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>({parentCode})</span>}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-color)',
                  marginTop: 6
                }}>
                  <button
                    onClick={() => setSelectedDossier({ item, level: activeTab })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4338ca',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Eye size={14} /> Inspect 360
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleEdit(item)}
                      title="Edit"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '4px' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => toggleStatus(item)}
                      title={isActive ? 'Deactivate' : 'Activate'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? 'var(--accent-danger)' : 'var(--accent-success)', padding: '4px' }}
                    >
                      {isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW MODE 2: FACILITY TABLE VIEW ───────────────────────────────── */}
      {!loading && activeTab !== 'topology' && viewMode === 'table' && filteredDataset.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 12 }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Code</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>{currentLevelConfig.parentLabel}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDataset.map((item, idx) => {
                const isActive = item.status !== 'Inactive' && item.isActive !== false;
                let parentLabel = '-';
                if (activeTab === 'warehouses') parentLabel = item.plantId?.name || '-';
                else if (activeTab === 'locations') parentLabel = item.warehouseId?.name || '-';
                else if (activeTab === 'zones') parentLabel = item.storageLocationId?.name || '-';
                else if (activeTab === 'racks') parentLabel = item.zoneId?.name || '-';
                else if (activeTab === 'bins') parentLabel = item.rackId?.name || '-';

                const itemType = item.type || item.areaType || item.zoneType || item.rackType || 'Standard';

                return (
                  <tr
                    key={item._id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: currentLevelConfig.badgeColor }}>
                      {item.code}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div>{item.name}</div>
                      {item.description && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{parentLabel}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                        {itemType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => setSelectedDossier({ item, level: activeTab })}
                          title="Inspect 360"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4338ca', padding: '4px' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          title="Edit"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '4px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => toggleStatus(item)}
                          title={isActive ? 'Deactivate' : 'Activate'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? 'var(--accent-danger)' : 'var(--accent-success)', padding: '4px' }}
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
      )}

      {/* ── TAB 6: FACILITY TOPOLOGY VISUALIZER (TREE EXPLORER) ─────────────── */}
      {activeTab === 'topology' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                Plant ➔ Store ➔ Area ➔ Zone ➔ Rack ➔ Bin Spatial Tree
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Interactive visual layout mapping physical inventory addresses down to individual bin cells.
              </p>
            </div>
            <button
              onClick={() => {
                const allIds = {};
                warehouses.forEach(w => { allIds[w._id] = true; });
                locations.forEach(l => { allIds[l._id] = true; });
                zones.forEach(z => { allIds[z._id] = true; });
                racks.forEach(r => { allIds[r._id] = true; });
                setExpandedNodes(allIds);
              }}
              className="btn btn-secondary"
              style={{ fontSize: 12 }}
            >
              Expand All Levels
            </button>
          </div>

          {/* Tree View Container */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            padding: 20
          }}>
            {warehouses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                No stores registered yet. Click "+ Add Store" above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {warehouses.map(wh => {
                  const whExpanded = !!expandedNodes[wh._id];
                  const whLocations = locations.filter(l => (l.warehouseId?._id || l.warehouseId) === wh._id);

                  return (
                    <div
                      key={wh._id}
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        background: 'var(--bg-primary)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Level 1: Warehouse / Store Header */}
                      <div
                        onClick={() => toggleTreeNode(wh._id)}
                        style={{
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(67, 56, 202, 0.08)',
                          cursor: 'pointer',
                          borderBottom: whExpanded ? '1px solid var(--border-color)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {whExpanded ? <ChevronDown size={16} color="#4338ca" /> : <ChevronRight size={16} color="#4338ca" />}
                          <Building size={16} color="#4338ca" />
                          <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{wh.name}</strong>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                            {wh.code}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            ({wh.plantId?.name || 'Plant'})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {whLocations.length} Storage Areas
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDossier({ item: wh, level: 'warehouses' });
                            }}
                            title="Inspect Store"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4338ca', padding: 2 }}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Level 2: Storage Locations inside this Store */}
                      {whExpanded && (
                        <div style={{ padding: '8px 16px 12px 34px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {whLocations.length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '6px 0', fontStyle: 'italic' }}>
                              No storage areas registered in this store yet. Switch to "Storage Areas" tab to add one.
                            </div>
                          ) : (
                            whLocations.map(loc => {
                              const locExpanded = !!expandedNodes[loc._id];
                              const locZones = zones.filter(z => (z.storageLocationId?._id || z.storageLocationId) === loc._id);

                              return (
                                <div key={loc._id} style={{ borderLeft: '2px solid #0284c7', paddingLeft: 12, marginTop: 4 }}>
                                  {/* Storage Location Header */}
                                  <div
                                    onClick={() => toggleTreeNode(loc._id)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      cursor: 'pointer',
                                      padding: '4px 0'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      {locExpanded ? <ChevronDown size={14} color="#0284c7" /> : <ChevronRight size={14} color="#0284c7" />}
                                      <Map size={14} color="#0284c7" />
                                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {loc.name}
                                      </span>
                                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                        ({loc.code})
                                      </span>
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                      {locZones.length} Zones
                                    </span>
                                  </div>

                                  {/* Level 3: Zones inside this Area */}
                                  {locExpanded && (
                                    <div style={{ paddingLeft: 18, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {locZones.length === 0 ? (
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                          No zones registered in this bay yet.
                                        </div>
                                      ) : (
                                        locZones.map(zone => {
                                          const zoneExpanded = !!expandedNodes[zone._id];
                                          const zoneRacks = racks.filter(r => (r.zoneId?._id || r.zoneId) === zone._id);

                                          return (
                                            <div key={zone._id} style={{ borderLeft: '2px solid #0d9488', paddingLeft: 10 }}>
                                              {/* Zone Header */}
                                              <div
                                                onClick={() => toggleTreeNode(zone._id)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '3px 0' }}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                  {zoneExpanded ? <ChevronDown size={12} color="#0d9488" /> : <ChevronRight size={12} color="#0d9488" />}
                                                  <Target size={13} color="#0d9488" />
                                                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {zone.name}
                                                  </span>
                                                  <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                                    ({zone.code})
                                                  </span>
                                                </div>
                                                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                                  {zoneRacks.length} Racks
                                                </span>
                                              </div>

                                              {/* Level 4: Racks inside this Zone */}
                                              {zoneExpanded && (
                                                <div style={{ paddingLeft: 16, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                  {zoneRacks.length === 0 ? (
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                      No racks registered in this zone yet.
                                                    </div>
                                                  ) : (
                                                    zoneRacks.map(rack => {
                                                      const rackExpanded = !!expandedNodes[rack._id];
                                                      const rackBins = bins.filter(b => (b.rackId?._id || b.rackId) === rack._id);

                                                      return (
                                                        <div key={rack._id} style={{ borderLeft: '2px solid #d97706', paddingLeft: 10 }}>
                                                          {/* Rack Header */}
                                                          <div
                                                            onClick={() => toggleTreeNode(rack._id)}
                                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '2px 0' }}
                                                          >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                              {rackExpanded ? <ChevronDown size={12} color="#d97706" /> : <ChevronRight size={12} color="#d97706" />}
                                                              <Layers size={12} color="#d97706" />
                                                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                {rack.name}
                                                               </span>
                                                              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                                                ({rack.code})
                                                              </span>
                                                            </div>
                                                            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                                              {rackBins.length} Bins
                                                            </span>
                                                          </div>

                                                          {/* Level 5: Bins inside this Rack */}
                                                          {rackExpanded && (
                                                            <div style={{ paddingLeft: 16, marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                              {rackBins.length === 0 ? (
                                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                                  No bins allocated to this rack yet.
                                                                </div>
                                                              ) : (
                                                                rackBins.map(bin => (
                                                                  <span
                                                                    key={bin._id}
                                                                    onClick={() => setSelectedDossier({ item: bin, level: 'bins' })}
                                                                    style={{
                                                                      display: 'inline-flex',
                                                                      alignItems: 'center',
                                                                      gap: 4,
                                                                      padding: '2px 8px',
                                                                      borderRadius: 4,
                                                                      background: 'rgba(16, 185, 129, 0.12)',
                                                                      color: '#10b981',
                                                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                                                      fontSize: 11,
                                                                      fontWeight: 700,
                                                                      fontFamily: 'monospace',
                                                                      cursor: 'pointer'
                                                                    }}
                                                                    title="Click to inspect bin details"
                                                                  >
                                                                    <LayoutGrid size={10} />
                                                                    {bin.code}
                                                                  </span>
                                                                ))
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FACILITY 360 SLIDE-OVER DOSSIER DRAWER ─────────────────────────── */}
      {selectedDossier && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          zIndex: 1050,
          display: 'flex',
          justifyContent: 'flex-end',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: 580,
            background: 'var(--bg-secondary)',
            height: '100%',
            overflowY: 'auto',
            padding: '24px 28px',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              {/* Drawer Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottom: '1px solid var(--border-color)', marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: 14,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'rgba(67, 56, 202, 0.15)',
                      color: '#4338ca',
                      border: '1px solid rgba(67, 56, 202, 0.3)'
                    }}>
                      {selectedDossier.item.code}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-color)' }}>
                      Level: {LEVEL_CONFIG[selectedDossier.level]?.singular || 'Storage'}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedDossier.item.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedDossier(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Spatial Specifications */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
                  Spatial Hierarchy Specifications
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Entity Type:</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedDossier.item.type || selectedDossier.item.areaType || selectedDossier.item.zoneType || selectedDossier.item.rackType || 'Standard'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Status:</div>
                    <div><StatusBadge value={selectedDossier.item.status || 'Active'} /></div>
                  </div>
                  {selectedDossier.item.capacityTons && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Weight Capacity:</div>
                      <div style={{ fontWeight: 700, color: '#f59e0b' }}>{selectedDossier.item.capacityTons} Metric Tons</div>
                    </div>
                  )}
                  {selectedDossier.item.maxWeightKg && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Max Weight:</div>
                      <div style={{ fontWeight: 700, color: '#10b981' }}>{selectedDossier.item.maxWeightKg.toLocaleString()} kg</div>
                    </div>
                  )}
                  {selectedDossier.item.levels && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Racking Tiers:</div>
                      <div style={{ fontWeight: 600 }}>{selectedDossier.item.levels} Vertical Levels</div>
                    </div>
                  )}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Description & Notes:</div>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                      {selectedDossier.item.description || 'Calibrated industrial storage element within facility inventory hierarchy.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Downstream Workflow Launchers */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
                  Inventory & Warehouse Workflows
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => navigate('/inventory/grn')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Truck size={15} color="#4338ca" /> Inbound Goods Receipt (GRN Putaway)
                    </span>
                    <ArrowRight size={14} color="var(--text-secondary)" />
                  </button>

                  <button
                    onClick={() => navigate('/inventory/issue')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Package size={15} color="#d97706" /> Issue Material from Location
                    </span>
                    <ArrowRight size={14} color="var(--text-secondary)" />
                  </button>

                  <button
                    onClick={() => navigate('/inventory/control')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BarChart2 size={15} color="#10b981" /> View Live Stock Ledger & Bin Occupancy
                    </span>
                    <ArrowRight size={14} color="var(--text-secondary)" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-color)', marginTop: 20 }}>
              <button
                onClick={() => {
                  const targetItem = selectedDossier.item;
                  setSelectedDossier(null);
                  handleEdit(targetItem);
                }}
                className="btn btn-primary"
                style={{ flex: 1, background: '#4338ca', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Edit2 size={14} /> Edit Record
              </button>
              <button
                onClick={() => {
                  const targetItem = selectedDossier.item;
                  setSelectedDossier(null);
                  toggleStatus(targetItem);
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Toggle Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL (ACROSS ALL 5 LEVELS) ───────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            width: '100%',
            maxWidth: 620,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Warehouse size={18} color="#4338ca" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingId ? `Edit ${currentLevelConfig.singular}` : `Register New ${currentLevelConfig.singular}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Name */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">{currentLevelConfig.singular} Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder={`e.g. Raw Material Central Store, Coil Unloading Bay, High-Bay Pallet Rack`}
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Code */}
                <div className="input-group">
                  <label className="input-label">Unique Code / Identifier *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    readOnly
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                  />
                  <p style={hintStyle}>Auto-generated enterprise barcode prefix.</p>
                </div>

                {/* Parent Dropdown based on active level */}
                {activeTab === 'warehouses' && (
                  <div className="input-group">
                    <label className="input-label">Manufacturing Plant *</label>
                    <select
                      className="input-field"
                      required
                      value={formData.plantId || ''}
                      onChange={e => setFormData({ ...formData, plantId: e.target.value })}
                    >
                      <option value="" disabled>Select plant</option>
                      {plants.map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === 'locations' && (
                  <div className="input-group">
                    <label className="input-label">Parent Store / Warehouse *</label>
                    <select
                      className="input-field"
                      required
                      value={formData.warehouseId || ''}
                      onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
                    >
                      <option value="" disabled>Select parent store</option>
                      {warehouses.map(w => (
                        <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === 'zones' && (
                  <div className="input-group">
                    <label className="input-label">Parent Storage Area / Bay *</label>
                    <select
                      className="input-field"
                      required
                      value={formData.storageLocationId || ''}
                      onChange={e => setFormData({ ...formData, storageLocationId: e.target.value })}
                    >
                      <option value="" disabled>Select storage area</option>
                      {locations.map(l => (
                        <option key={l._id} value={l._id}>{l.name} ({l.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === 'racks' && (
                  <div className="input-group">
                    <label className="input-label">Parent Zone *</label>
                    <select
                      className="input-field"
                      required
                      value={formData.zoneId || ''}
                      onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
                    >
                      <option value="" disabled>Select zone</option>
                      {zones.map(z => (
                        <option key={z._id} value={z._id}>{z.name} ({z.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === 'bins' && (
                  <div className="input-group">
                    <label className="input-label">Parent Rack / Cantilever *</label>
                    <select
                      className="input-field"
                      required
                      value={formData.rackId || ''}
                      onChange={e => setFormData({ ...formData, rackId: e.target.value })}
                    >
                      <option value="" disabled>Select rack</option>
                      {racks.map(r => (
                        <option key={r._id} value={r._id}>{r.name} ({r.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Level Specific Type Selectors */}
                {activeTab === 'warehouses' && (
                  <div className="input-group">
                    <label className="input-label">Warehouse Type</label>
                    <select
                      className="input-field"
                      value={formData.type || 'Raw Material'}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Raw Material">Raw Material Stockyard</option>
                      <option value="Finished Goods">Finished Goods Distribution Center</option>
                      <option value="WIP">WIP Buffer Staging</option>
                      <option value="Scrap">Scrap & Rejection Yard</option>
                      <option value="Consumables">Consumables & Tool Store</option>
                      <option value="General">General Store</option>
                    </select>
                  </div>
                )}

                {activeTab === 'locations' && (
                  <div className="input-group">
                    <label className="input-label">Bay Classification</label>
                    <select
                      className="input-field"
                      value={formData.areaType || 'Storage Bay'}
                      onChange={e => setFormData({ ...formData, areaType: e.target.value })}
                    >
                      <option value="Receiving Bay">Receiving & Unloading Bay</option>
                      <option value="Storage Bay">Prime Storage Bay</option>
                      <option value="Dispatch Staging">Outbound Dispatch Staging</option>
                      <option value="Quarantine">Quality Quarantine / Hold Bay</option>
                      <option value="Press Infeed Buffer">Press Shop Infeed Buffer</option>
                    </select>
                  </div>
                )}

                {activeTab === 'zones' && (
                  <div className="input-group">
                    <label className="input-label">Zone Material Specialization</label>
                    <select
                      className="input-field"
                      value={formData.zoneType || 'Heavy Coils'}
                      onChange={e => setFormData({ ...formData, zoneType: e.target.value })}
                    >
                      <option value="Heavy Coils">Heavy CRCA / HR Steel Coils</option>
                      <option value="Sheet Packs">Sheet Metal Packs & Blanks</option>
                      <option value="Finished Assemblies">Finished Component Pallets</option>
                      <option value="Die Tooling">Press Dies & Punch Tooling</option>
                      <option value="Lubricants & Fluids">Oils & Rust Preventatives</option>
                    </select>
                  </div>
                )}

                {activeTab === 'racks' && (
                  <>
                    <div className="input-group">
                      <label className="input-label">Racking Structure</label>
                      <select
                        className="input-field"
                        value={formData.rackType || 'Pallet Rack'}
                        onChange={e => setFormData({ ...formData, rackType: e.target.value })}
                      >
                        <option value="Cantilever">Heavy Cantilever Cradle</option>
                        <option value="Pallet Rack">Selective Pallet Racking</option>
                        <option value="Flow Rack">Gravity Carton / Tote Flow Rack</option>
                        <option value="Floor Staging">Floor Marked Stacking Grid</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Weight Capacity (Metric Tons)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="e.g. 20"
                        value={formData.capacityTons ?? ''}
                        onChange={e => setFormData({ ...formData, capacityTons: parseFloat(e.target.value) })}
                      />
                    </div>
                  </>
                )}

                {activeTab === 'bins' && (
                  <>
                    <div className="input-group">
                      <label className="input-label">Barcode / Tag Identifier</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. BC-RM-C01"
                        value={formData.barcode || ''}
                        onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Max Slot Weight (kg)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="e.g. 5000"
                        value={formData.maxWeightKg ?? ''}
                        onChange={e => setFormData({ ...formData, maxWeightKg: parseFloat(e.target.value) })}
                      />
                    </div>
                  </>
                )}

                {/* Status Toggle */}
                <div className="input-group">
                  <label className="input-label">Operational Status</label>
                  <select
                    className="input-field"
                    value={formData.status || 'Active'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active — Available for Inventory Putaway</option>
                    <option value="Inactive">Inactive — Temporarily Closed</option>
                  </select>
                </div>

                {/* Description */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Description & Physical Location Notes</label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Enter physical landmarks, access gates, or handling equipment instructions..."
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ background: '#4338ca', border: 'none' }}
                >
                  {saving ? 'Saving…' : editingId ? `Update ${currentLevelConfig.singular}` : `Save ${currentLevelConfig.singular}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseMaster;