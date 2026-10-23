import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Layers, Cpu, Zap, Activity, AlertTriangle, CheckCircle, CheckCircle2,
  XCircle, Plus, Edit2, Eye, Copy, Check, Download, LayoutGrid, List,
  MapPin, Users, Clock, DollarSign, Building, Factory, Shield, HelpCircle,
  RefreshCw, BarChart2, ArrowRight, ArrowUpRight, Gauge, Sliders,
  ChevronRight, X, Sparkles, Compass, Search
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

// Preset detailed lean cellular engineering standards
const WORK_CENTER_PRESETS = {
  'WC-PRESS': {
    category: 'Heavy Stamping & Press Line',
    shiftsPerDay: 2,
    baseDailyHours: 16.0,
    efficiencyRate: 0.88,
    laborRatePerHour: 240,
    overheadRatePerHour: 420,
    manningLevel: 4,
    floorLocation: 'Bay 1 - Heavy Stamping Line',
    supervisor: 'R. Murugan (Press Shop Superintendent)',
    criticality: 'A - Bottleneck Pacing Cell',
    description: 'Central stamping press battery handling primary blanking, deep draw, and progressive stamping of automotive chassis and bracket parts.'
  },
  'WC-TOOL': {
    category: 'CNC Machining & Precision Tooling',
    shiftsPerDay: 2,
    baseDailyHours: 16.0,
    efficiencyRate: 0.84,
    laborRatePerHour: 280,
    overheadRatePerHour: 520,
    manningLevel: 3,
    floorLocation: 'Bay 3 - Tooling & Laser Cell',
    supervisor: 'K. Narayanan (Tool Room Lead)',
    criticality: 'B - Balanced Cell',
    description: 'Precision CNC laser profile cutting, 5-axis tube bending, and tooling maintenance cell supporting rapid engineering changeovers.'
  },
  'WC-WELD': {
    category: 'Robotic Welding & Sub-Assembly',
    shiftsPerDay: 2,
    baseDailyHours: 16.0,
    efficiencyRate: 0.86,
    laborRatePerHour: 210,
    overheadRatePerHour: 310,
    manningLevel: 3,
    floorLocation: 'Bay 2 - Robotic Arc Welding Cell',
    supervisor: 'S. Praveen (Welding Inspector)',
    criticality: 'B - Balanced Cell',
    description: 'High-amperage synergic MIG welding and automated rotary fixture station for high-integrity structural automotive assemblies.'
  },
  'WC-QC': {
    category: 'Quality Assurance & Metrology',
    shiftsPerDay: 2,
    baseDailyHours: 16.0,
    efficiencyRate: 0.92,
    laborRatePerHour: 260,
    overheadRatePerHour: 280,
    manningLevel: 2,
    floorLocation: 'QC Metrology Pavilion (Temp-Controlled)',
    supervisor: 'D. Suresh (QA Lead)',
    criticality: 'B - Balanced Cell',
    description: 'Precision coordinate measurement (CMM), surface roughness, weld micro-hardness, and first-piece approval inspection center.'
  },
  'WC-ASSY-01': {
    category: 'Final Assembly & Kitting',
    shiftsPerDay: 2,
    baseDailyHours: 16.0,
    efficiencyRate: 0.90,
    laborRatePerHour: 190,
    overheadRatePerHour: 240,
    manningLevel: 6,
    floorLocation: 'Plant 1 - Line A Concourse',
    supervisor: 'M. Balaji (Assembly Line Supervisor)',
    criticality: 'C - Buffer Cell',
    description: 'Multi-station progressive assembly conveyor for sub-assembly integration, torque verification, packaging, and kanban dispatch staging.'
  }
};

const WorkCenterMaster = () => {
  const navigate = useNavigate();

  // View modes: 'cells' (Cellular Grid), 'table' (Matrix Table), 'topology' (Floor Map)
  const [viewMode, setViewMode] = useState('cells');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('code');

  // Master Data state
  const [workCenters, setWorkCenters] = useState([]);
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  // Modals & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null); // Work Center 360 Slide-Over
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // Deep-link quick create (?create=1)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('create') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    fetchDependencies();
  }, []);

  const fetchDependencies = async () => {
    try {
      const [pRes, dRes, mRes] = await Promise.all([
        axios.get('/company/plants?limit=100').catch(() => ({ data: { data: [] } })),
        axios.get('/company/departments?limit=100').catch(() => ({ data: { data: [] } })),
        axios.get('/master/machine?limit=200&includeInactive=true').catch(() => ({ data: { data: [] } }))
      ]);
      setPlants(pRes.data?.data || []);
      setDepartments(dRes.data?.data || []);
      setMachines(mRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching work center dependencies:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/master/workcenter?limit=200&includeInactive=true');
      setWorkCenters(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching work centers:', err);
    }
    setLoading(false);
  };

  // Map machines to each work center for dynamic bidirectional display
  const machinesByWc = useMemo(() => {
    const map = {};
    for (const m of machines) {
      const wcId = m.workCenterId?._id || m.workCenterId;
      if (wcId) {
        if (!map[wcId]) map[wcId] = [];
        map[wcId].push(m);
      }
    }
    return map;
  }, [machines]);

  // Telemetry Metrics
  const telemetry = useMemo(() => {
    const total = workCenters.length;
    const active = workCenters.filter(w => w.status !== 'Inactive' && w.isActive !== false).length;
    
    // Total planned gross daily capacity across active cells
    const totalGrossDailyHours = workCenters.reduce((sum, w) => {
      const shifts = w.shiftsPerDay || 2;
      const baseHrs = w.baseDailyHours || 8;
      return sum + (shifts * (baseHrs / (w.shiftsPerDay || 1) || 8));
    }, 0);

    // Total net effective capacity considering OEE
    const totalNetEffectiveHours = workCenters.reduce((sum, w) => {
      const baseHrs = w.baseDailyHours || 16;
      const eff = w.efficiencyRate ?? 0.85;
      return sum + (baseHrs * eff);
    }, 0);

    // Weighted average target OEE
    const avgOEE = total > 0 
      ? (workCenters.reduce((sum, w) => sum + (w.efficiencyRate ?? 0.85), 0) / total) * 100 
      : 85;

    // Total assigned floor manning
    const totalManning = workCenters.reduce((sum, w) => sum + (w.manningLevel || 3), 0);

    // Bottleneck cells
    const bottlenecks = workCenters.filter(w => (w.criticality || '').includes('Bottleneck')).length;

    return {
      total,
      active,
      totalGrossDailyHours,
      totalNetEffectiveHours: totalNetEffectiveHours.toFixed(1),
      avgOEE: avgOEE.toFixed(1),
      totalManning,
      bottlenecks
    };
  }, [workCenters]);

  // One-click Calibrate Work Center Standards & Machine Bindings
  const handleCalibrateStandards = async () => {
    if (!await confirmAction('Calibrate industrial lean cellular standards (Target OEE efficiency, shift operating windows, labor & overhead rates, and floor manning) for all work centers?')) return;
    setCalibrating(true);
    try {
      for (const wc of workCenters) {
        const preset = WORK_CENTER_PRESETS[wc.code] || {};
        
        // Find machines belonging to this workcenter
        const linkedMachines = machines.filter(m => {
          const wId = m.workCenterId?._id || m.workCenterId;
          return wId === wc._id;
        }).map(m => m._id);

        const updatePayload = {
          name: wc.name,
          code: wc.code,
          plantId: wc.plantId?._id || wc.plantId,
          departmentId: wc.departmentId?._id || wc.departmentId,
          category: preset.category || wc.category || 'Production Line',
          shiftsPerDay: preset.shiftsPerDay || wc.shiftsPerDay || 2,
          baseDailyHours: preset.baseDailyHours || wc.baseDailyHours || 16.0,
          efficiencyRate: preset.efficiencyRate ?? wc.efficiencyRate ?? 0.85,
          laborRatePerHour: preset.laborRatePerHour || wc.laborRatePerHour || 220,
          overheadRatePerHour: preset.overheadRatePerHour || wc.overheadRatePerHour || 350,
          manningLevel: preset.manningLevel || wc.manningLevel || 3,
          floorLocation: preset.floorLocation || wc.floorLocation || 'Bay 1 - Main Concourse',
          supervisor: preset.supervisor || wc.supervisor || 'Cell Team Leader',
          criticality: preset.criticality || wc.criticality || 'B - Balanced Cell',
          description: preset.description || wc.description || '',
          machines: linkedMachines.length > 0 ? linkedMachines : undefined,
          status: 'Active',
          isActive: true
        };

        await axios.put(`/master/workcenter/${wc._id}`, updatePayload);
      }

      await fetchData();
      await fetchDependencies();
      notify.success('Work center cellular standards, absorption rates, and machine associations calibrated!');
    } catch (err) {
      console.error(err);
      notify.error('Error calibrating work centers: ' + (err.response?.data?.message || err.message));
    }
    setCalibrating(false);
  };

  // Filtered & Sorted Work Centers
  const filteredWorkCenters = useMemo(() => {
    return workCenters.filter(w => {
      // Department Filter
      if (selectedDeptFilter !== 'ALL') {
        const dId = w.departmentId?._id || w.departmentId;
        if (dId !== selectedDeptFilter) return false;
      }

      // Category Filter
      if (selectedCategoryFilter === 'STAMPING') {
        if (!w.name.toLowerCase().includes('press') && !(w.category || '').toLowerCase().includes('stamp')) return false;
      } else if (selectedCategoryFilter === 'WELDING') {
        if (!w.name.toLowerCase().includes('weld') && !(w.category || '').toLowerCase().includes('weld')) return false;
      } else if (selectedCategoryFilter === 'TOOLING') {
        if (!w.name.toLowerCase().includes('tool') && !(w.category || '').toLowerCase().includes('cnc') && !(w.category || '').toLowerCase().includes('tool')) return false;
      } else if (selectedCategoryFilter === 'QUALITY') {
        if (!w.name.toLowerCase().includes('qc') && !w.name.toLowerCase().includes('quality') && !(w.category || '').toLowerCase().includes('quality')) return false;
      } else if (selectedCategoryFilter === 'ASSEMBLY') {
        if (!w.name.toLowerCase().includes('assy') && !w.name.toLowerCase().includes('assembly') && !(w.category || '').toLowerCase().includes('assembly')) return false;
      }

      // Status Filter
      if (selectedStatusFilter === 'ACTIVE' && (w.status === 'Inactive' || w.isActive === false)) return false;
      if (selectedStatusFilter === 'INACTIVE' && w.status !== 'Inactive' && w.isActive !== false) return false;

      // Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = w.name?.toLowerCase().includes(q);
        const matchCode = w.code?.toLowerCase().includes(q);
        const matchCategory = w.category?.toLowerCase().includes(q);
        const matchLocation = w.floorLocation?.toLowerCase().includes(q);
        const matchSupervisor = w.supervisor?.toLowerCase().includes(q);
        const matchDept = w.departmentId?.name?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCategory && !matchLocation && !matchSupervisor && !matchDept) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
      if (sortBy === 'efficiency') return (b.efficiencyRate || 0) - (a.efficiencyRate || 0);
      if (sortBy === 'rate') return ((b.laborRatePerHour || 0) + (b.overheadRatePerHour || 0)) - ((a.laborRatePerHour || 0) + (a.overheadRatePerHour || 0));
      return 0;
    });
  }, [workCenters, selectedDeptFilter, selectedCategoryFilter, selectedStatusFilter, searchTerm, sortBy]);

  // Copy code to clipboard
  const handleCopyCode = (id, code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCodeId(id);
    notify.success(`Copied code "${code}" to clipboard!`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Open Create Modal
  const openCreate = () => {
    setFormData({
      code: 'WC-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      name: '',
      plantId: plants[0]?._id || '',
      departmentId: departments[0]?._id || '',
      category: 'Heavy Stamping & Press Line',
      shiftsPerDay: 2,
      baseDailyHours: 16.0,
      efficiencyRate: 0.85,
      laborRatePerHour: 220,
      overheadRatePerHour: 350,
      manningLevel: 3,
      floorLocation: 'Bay 1 - Main Floor',
      supervisor: '',
      criticality: 'B - Balanced Cell',
      status: 'Active',
      description: ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (wc) => {
    setFormData({
      ...wc,
      plantId: wc.plantId?._id || wc.plantId,
      departmentId: wc.departmentId?._id || wc.departmentId,
      category: wc.category || 'Production Line',
      shiftsPerDay: wc.shiftsPerDay || 2,
      baseDailyHours: wc.baseDailyHours || 16.0,
      efficiencyRate: wc.efficiencyRate ?? 0.85,
      laborRatePerHour: wc.laborRatePerHour || 220,
      overheadRatePerHour: wc.overheadRatePerHour || 350,
      manningLevel: wc.manningLevel || 3,
      floorLocation: wc.floorLocation || '',
      supervisor: wc.supervisor || '',
      criticality: wc.criticality || 'B - Balanced Cell'
    });
    setEditingId(wc._id);
    setIsModalOpen(true);
  };

  // Save Work Center Form
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        plantId: formData.plantId,
        departmentId: formData.departmentId,
        category: formData.category,
        shiftsPerDay: Number(formData.shiftsPerDay) || 2,
        baseDailyHours: Number(formData.baseDailyHours) || 16.0,
        efficiencyRate: Number(formData.efficiencyRate) || 0.85,
        laborRatePerHour: Number(formData.laborRatePerHour) || 220,
        overheadRatePerHour: Number(formData.overheadRatePerHour) || 350,
        manningLevel: Number(formData.manningLevel) || 3,
        floorLocation: formData.floorLocation,
        supervisor: formData.supervisor,
        criticality: formData.criticality,
        status: formData.status || 'Active',
        isActive: formData.status !== 'Inactive',
        description: formData.description
      };

      if (editingId) {
        await axios.put(`/master/workcenter/${editingId}`, payload);
        notify.success('Work centre updated successfully');
      } else {
        await axios.post('/master/workcenter', payload);
        notify.success('Work centre commissioned successfully');
      }

      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      await fetchData();
      await fetchDependencies();
    } catch (err) {
      console.error(err);
      notify.error(err.response?.data?.message || 'Error saving work centre');
    }
    setSaving(false);
  };

  // Toggle Active/Inactive
  const toggleStatus = async (wc) => {
    const isCurrentlyActive = wc.status !== 'Inactive' && wc.isActive !== false;
    if (isCurrentlyActive && !await confirmAction(`Deactivate work centre "${wc.name}"? Active routing steps scheduled on this cell will require reassignment.`)) return;
    try {
      await axios.put(`/master/workcenter/${wc._id}`, {
        status: isCurrentlyActive ? 'Inactive' : 'Active',
        isActive: !isCurrentlyActive
      });
      notify.success(`Work centre ${isCurrentlyActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      notify.error('Error updating work centre status');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredWorkCenters.length === 0) {
      notify.error('No work centres to export');
      return;
    }
    const headers = [
      'Code', 'Name', 'Category', 'Plant', 'Department', 'Floor Location',
      'Shifts/Day', 'Base Daily Hours', 'Efficiency (OEE %)', 'Net Effective Hrs',
      'Labor Rate (₹/hr)', 'Overhead Rate (₹/hr)', 'Combined Rate (₹/hr)',
      'Manning Level', 'Supervisor', 'Criticality', 'Assigned Machines Count', 'Status'
    ];
    const rows = filteredWorkCenters.map(w => {
      const assigned = machinesByWc[w._id] || [];
      const netEffective = ((w.baseDailyHours || 16) * (w.efficiencyRate ?? 0.85)).toFixed(1);
      const combinedRate = (w.laborRatePerHour || 220) + (w.overheadRatePerHour || 350);
      return [
        w.code,
        `"${(w.name || '').replace(/"/g, '""')}"`,
        `"${(w.category || '').replace(/"/g, '""')}"`,
        `"${(w.plantId?.name || '').replace(/"/g, '""')}"`,
        `"${(w.departmentId?.name || '').replace(/"/g, '""')}"`,
        `"${(w.floorLocation || '').replace(/"/g, '""')}"`,
        w.shiftsPerDay || 2,
        w.baseDailyHours || 16.0,
        Math.round((w.efficiencyRate ?? 0.85) * 100) + '%',
        netEffective,
        w.laborRatePerHour || 220,
        w.overheadRatePerHour || 350,
        combinedRate,
        w.manningLevel || 3,
        `"${(w.supervisor || '').replace(/"/g, '""')}"`,
        `"${(w.criticality || '').replace(/"/g, '""')}"`,
        assigned.length,
        w.status || 'Active'
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `precision_work_centers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success(`Exported ${filteredWorkCenters.length} work centres to CSV`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%' }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HERO COMMAND BANNER (Deep Titanium Violet & Electric Purple)
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #130a2a 0%, #2e1065 50%, #4c1d95 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(76, 29, 149, 0.3), 0 8px 10px -6px rgba(46, 16, 101, 0.3)'
      }}>
        {/* Ambient background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(168, 85, 247, 0.25) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(139, 92, 246, 0.18) 0%, transparent 40%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Module tag pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#d8b4fe',
              border: '1px solid rgba(216, 180, 254, 0.25)'
            }}>
              <Layers size={13} style={{ color: '#c084fc' }} /> CELLULAR MANUFACTURING & ROUTING HUBS • PLANT WORK CELLS
            </span>
          </div>

          {/* Title & Actions row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ maxWidth: '680px' }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff'
              }}>
                Work Centres & Manufacturing Cells
              </h1>
              <p style={{
                fontSize: '13px',
                lineHeight: 1.5,
                color: '#e9d5ff',
                margin: '6px 0 0 0'
              }}>
                Production routing nodes governing plant capacity loading, standard OEE efficiency targets, labor & factory overhead absorption rates, and cellular machine pools.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleExportCSV}
                className="btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Download size={15} /> Export CSV
              </button>

              <button
                onClick={handleCalibrateStandards}
                disabled={calibrating}
                className="btn"
                style={{
                  background: 'rgba(168, 85, 247, 0.25)',
                  color: '#f3e8ff',
                  border: '1px solid rgba(216, 180, 254, 0.4)',
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                title="Populate realistic industrial cellular standards (OEE, shift hours, labor/overhead rates, bays, and machines)"
              >
                <Sparkles size={15} style={{ color: '#e879f9' }} />
                {calibrating ? 'Calibrating...' : 'Calibrate Cell Standards'}
              </button>

              <button
                onClick={openCreate}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(109, 40, 217, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Commission Work Centre
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              TELEMETRY METRICS STRIP (4 Cell KPI Cards)
              ───────────────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginTop: '22px'
          }}>
            {/* KPI 1: Active Production Cells */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(216, 180, 254, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c084fc', fontWeight: 700 }}>
                  Active Work Cells
                </span>
                <Layers size={14} style={{ color: '#d8b4fe' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>{telemetry.total}</span>
                <span style={{ fontSize: '12px', color: '#e9d5ff' }}>({telemetry.active} Online)</span>
              </div>
              <div style={{ fontSize: '11px', color: '#c4b5fd', marginTop: '2px' }}>
                Routing nodes on shop floor
              </div>
            </div>

            {/* KPI 2: Daily Net Available Capacity */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(216, 180, 254, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c084fc', fontWeight: 700 }}>
                  Daily Net Capacity
                </span>
                <Clock size={14} style={{ color: '#d8b4fe' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>{telemetry.totalNetEffectiveHours}</span>
                <span style={{ fontSize: '12px', color: '#e9d5ff' }}>Effective Hrs / Day</span>
              </div>
              <div style={{ fontSize: '11px', color: '#c4b5fd', marginTop: '2px' }}>
                Gross: {telemetry.totalGrossDailyHours} hrs • Factoring OEE
              </div>
            </div>

            {/* KPI 3: Weighted Plant OEE Target */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(216, 180, 254, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c084fc', fontWeight: 700 }}>
                  Target OEE Benchmark
                </span>
                <Gauge size={14} style={{ color: '#a7f3d0' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#6ee7b7' }}>{telemetry.avgOEE}%</span>
                <span style={{ fontSize: '12px', color: '#e9d5ff' }}>Plant OEE</span>
              </div>
              <div style={{ fontSize: '11px', color: '#c4b5fd', marginTop: '2px' }}>
                Lean cellular standard efficiency
              </div>
            </div>

            {/* KPI 4: Manning & Bottlenecks */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(216, 180, 254, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c084fc', fontWeight: 700 }}>
                  Floor Manning & Pace
                </span>
                <Users size={14} style={{ color: '#fbbf24' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#fde047' }}>{telemetry.totalManning}</span>
                <span style={{ fontSize: '12px', color: '#e9d5ff' }}>Operators / Shift</span>
              </div>
              <div style={{ fontSize: '11px', color: '#c4b5fd', marginTop: '2px' }}>
                {telemetry.bottlenecks} Pacing Bottleneck Cell(s)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FILTER & TOOLBAR STRIP
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--card-bg, #ffffff)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border-color, #e2e8f0)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* Category Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All Cells (${workCenters.length})`, icon: Layers },
            { id: 'STAMPING', label: 'Stamping & Press', icon: Zap },
            { id: 'WELDING', label: 'Welding & Assembly', icon: Cpu },
            { id: 'TOOLING', label: 'CNC & Tooling', icon: Sliders },
            { id: 'QUALITY', label: 'Quality & CMM', icon: Shield },
            { id: 'ASSEMBLY', label: 'Final Assembly', icon: Factory }
          ].map(chip => {
            const Icon = chip.icon;
            const isSelected = selectedCategoryFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedCategoryFilter(chip.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #7c3aed' : '1px solid var(--border-color, #e2e8f0)',
                  background: isSelected ? 'rgba(124, 58, 237, 0.12)' : 'var(--bg-secondary, #f8fafc)',
                  color: isSelected ? '#6d28d9' : 'var(--text-secondary, #64748b)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={13} style={{ color: isSelected ? '#7c3aed' : 'inherit' }} />
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Search, Dropdowns & View Mode Toggles */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 360px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={15} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary, #94a3b8)'
              }} />
              <input
                type="text"
                placeholder="Search cell name, code, bay, supervisor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-primary, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '13px'
              }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '13px'
              }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '13px'
              }}
            >
              <option value="code">Sort: Cell Code (A-Z)</option>
              <option value="name">Sort: Cell Name</option>
              <option value="efficiency">Sort: OEE Efficiency (High &rarr; Low)</option>
              <option value="rate">Sort: Cost Absorption Rate</option>
            </select>
          </div>

          {/* Tri-View Mode Switcher */}
          <div style={{
            display: 'inline-flex',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #cbd5e1)',
            padding: '2px',
            background: 'var(--bg-secondary, #f1f5f9)'
          }}>
            <button
              onClick={() => setViewMode('cells')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: viewMode === 'cells' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'cells' ? '#7c3aed' : 'transparent',
                color: viewMode === 'cells' ? '#ffffff' : 'var(--text-secondary, #64748b)'
              }}
            >
              <LayoutGrid size={13} /> Cell Console
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: viewMode === 'table' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'table' ? '#7c3aed' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary, #64748b)'
              }}
            >
              <List size={13} /> Matrix Table
            </button>
            <button
              onClick={() => setViewMode('topology')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: viewMode === 'topology' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'topology' ? '#7c3aed' : 'transparent',
                color: viewMode === 'topology' ? '#ffffff' : 'var(--text-secondary, #64748b)'
              }}
            >
              <Compass size={13} /> Plant Floor Map
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN CONTENT: CELL CONSOLE / TABLE / FLOOR MAP
          ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 0',
          color: 'var(--text-secondary, #64748b)'
        }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: '#7c3aed' }} />
          <span style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600 }}>Loading manufacturing work cells...</span>
        </div>
      ) : filteredWorkCenters.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '16px',
          border: '1px dashed var(--border-color, #cbd5e1)'
        }}>
          <Layers size={40} style={{ color: '#7c3aed', opacity: 0.6, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary, #0f172a)' }}>
            No Work Centres Found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
            No manufacturing cells match your current filter criteria. Group your machines into operational work cells to enable production routing and capacity planning.
          </p>
          <button
            onClick={openCreate}
            className="btn btn-primary"
            style={{ background: '#7c3aed', color: '#ffffff' }}
          >
            <Plus size={14} /> Add First Work Centre
          </button>
        </div>
      ) : viewMode === 'cells' ? (
        /* ── CELL OPERATIONS CONSOLE (Modular Cards) ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '18px'
        }}>
          {filteredWorkCenters.map(wc => {
            const assignedMachines = machinesByWc[wc._id] || [];
            const isActive = wc.status !== 'Inactive' && wc.isActive !== false;
            const effPercent = Math.round((wc.efficiencyRate ?? 0.85) * 100);
            const netEffectiveHrs = ((wc.baseDailyHours || 16.0) * (wc.efficiencyRate ?? 0.85)).toFixed(1);
            const combinedRate = (wc.laborRatePerHour || 220) + (wc.overheadRatePerHour || 350);
            const isBottleneck = (wc.criticality || '').includes('Bottleneck');

            return (
              <div
                key={wc._id}
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  borderRadius: '14px',
                  border: isBottleneck ? '1.5px solid #a855f7' : '1px solid var(--border-color, #e2e8f0)',
                  boxShadow: isBottleneck ? '0 4px 15px rgba(168, 85, 247, 0.12)' : '0 2px 5px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  opacity: isActive ? 1 : 0.65
                }}
              >
                {/* Cell Card Header */}
                <div style={{
                  padding: '16px 18px 12px 18px',
                  borderBottom: '1px solid var(--border-color, #f1f5f9)',
                  background: isBottleneck ? 'rgba(168, 85, 247, 0.04)' : 'transparent'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Code Badge with 1-click copy */}
                      <span
                        onClick={() => handleCopyCode(wc._id, wc.code)}
                        title="Click to copy code"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          background: '#f3e8ff',
                          color: '#6d28d9',
                          border: '1px solid #d8b4fe',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedCodeId === wc._id ? <Check size={11} style={{ color: '#16a34a' }} /> : <Copy size={11} />}
                        {wc.code}
                      </span>

                      {/* Criticality Tag */}
                      {isBottleneck ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: '#fdf2f8',
                          color: '#be185d',
                          border: '1px solid #fbcfe8'
                        }}>
                          ⚡ PACING BOTTLENECK
                        </span>
                      ) : (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: 600,
                          background: '#f8fafc',
                          color: '#64748b',
                          border: '1px solid #e2e8f0'
                        }}>
                          {wc.criticality || 'B - Balanced Cell'}
                        </span>
                      )}
                    </div>

                    <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                  </div>

                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '8px 0 2px 0',
                    color: 'var(--text-primary, #0f172a)'
                  }}>
                    {wc.name}
                  </h3>

                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary, #64748b)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap'
                  }}>
                    <span>{wc.plantId?.name || 'Hosur Plant'}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: '#7c3aed' }}>{wc.departmentId?.name || 'Press Shop'}</span>
                    {wc.floorLocation && (
                      <>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#475569' }}>
                          <MapPin size={11} /> {wc.floorLocation}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Capacity & OEE Gauge Box */}
                <div style={{
                  padding: '14px 18px',
                  background: 'var(--bg-secondary, #faf5ff)',
                  borderBottom: '1px solid var(--border-color, #f1f5f9)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6d28d9' }}>
                      Cell Capacity & OEE Target
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: effPercent >= 85 ? '#059669' : '#d97706' }}>
                      {effPercent}% OEE
                    </span>
                  </div>

                  {/* Dual Capacity Visual Bar */}
                  <div style={{
                    height: '8px',
                    width: '100%',
                    background: '#e9d5ff',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${effPercent}%`,
                      background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                      borderRadius: '9999px'
                    }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Gross Operating:</span>{' '}
                      <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{wc.baseDailyHours || 16.0}h ({wc.shiftsPerDay || 2} Shifts)</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Net Effective:</span>{' '}
                      <strong style={{ color: '#6d28d9' }}>{netEffectiveHrs}h / day</strong>
                    </div>
                  </div>
                </div>

                {/* Assigned Machines Battery */}
                <div style={{ padding: '12px 18px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary, #64748b)' }}>
                      Assigned Machine Fleet ({assignedMachines.length})
                    </span>
                    <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>
                      Pool Roster
                    </span>
                  </div>

                  {assignedMachines.length === 0 ? (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary, #94a3b8)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary, #f8fafc)',
                      border: '1px dashed var(--border-color, #e2e8f0)',
                      textAlign: 'center'
                    }}>
                      No machines bound. Click "Calibrate Cell Standards" to map floor assets.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {assignedMachines.slice(0, 4).map(m => (
                        <span
                          key={m._id}
                          title={`${m.name} (${m.code}) - Tonnage: ${m.tonnage || 'Standard'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'var(--bg-secondary, #f1f5f9)',
                            color: 'var(--text-primary, #334155)',
                            border: '1px solid var(--border-color, #e2e8f0)'
                          }}
                        >
                          <Cpu size={10} style={{ color: '#ea580c' }} />
                          {m.name.length > 20 ? m.name.substring(0, 18) + '...' : m.name}
                        </span>
                      ))}
                      {assignedMachines.length > 4 && (
                        <span style={{
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#f3e8ff',
                          color: '#7c3aed'
                        }}>
                          +{assignedMachines.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Economics & Rates Row */}
                <div style={{
                  padding: '10px 18px',
                  background: 'var(--bg-primary, #ffffff)',
                  borderTop: '1px solid var(--border-color, #f1f5f9)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary, #64748b)' }}>Absorption Rate:</span>{' '}
                    <strong style={{ color: '#0f172a', fontWeight: 800 }}>₹{combinedRate}.00</strong>
                    <span style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '11px' }}> / hr</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary, #64748b)' }}>Manning:</span>{' '}
                    <strong style={{ color: '#0f172a' }}>{wc.manningLevel || 3} ops</strong>
                  </div>
                </div>

                {/* Action Card Footer */}
                <div style={{
                  padding: '10px 18px',
                  background: 'var(--bg-secondary, #f8fafc)',
                  borderTop: '1px solid var(--border-color, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => setSelectedDossier(wc)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7c3aed',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <Eye size={13} /> Cell 360° Dossier <ChevronRight size={13} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(wc)}
                      title="Edit Work Centre"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary, #64748b)',
                        padding: '4px'
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => toggleStatus(wc)}
                      title={isActive ? 'Deactivate Work Centre' : 'Activate Work Centre'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isActive ? 'var(--accent-danger, #ef4444)' : 'var(--accent-success, #22c55e)',
                        padding: '4px'
                      }}
                    >
                      {isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        /* ── CAPACITY & COSTING MATRIX TABLE ── */
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{
                  background: 'var(--bg-secondary, #f8fafc)',
                  borderBottom: '1px solid var(--border-color, #e2e8f0)',
                  color: 'var(--text-secondary, #475569)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '12px 16px' }}>Code</th>
                  <th style={{ padding: '12px 16px' }}>Work Centre Name</th>
                  <th style={{ padding: '12px 16px' }}>Plant / Dept</th>
                  <th style={{ padding: '12px 16px' }}>Floor Bay</th>
                  <th style={{ padding: '12px 16px' }}>Operating Hrs</th>
                  <th style={{ padding: '12px 16px' }}>OEE Target</th>
                  <th style={{ padding: '12px 16px' }}>Net Capacity</th>
                  <th style={{ padding: '12px 16px' }}>Labor Rate</th>
                  <th style={{ padding: '12px 16px' }}>Overhead Rate</th>
                  <th style={{ padding: '12px 16px' }}>Total Absorption</th>
                  <th style={{ padding: '12px 16px' }}>Machines</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkCenters.map((wc, idx) => {
                  const assignedMachines = machinesByWc[wc._id] || [];
                  const isActive = wc.status !== 'Inactive' && wc.isActive !== false;
                  const effPercent = Math.round((wc.efficiencyRate ?? 0.85) * 100);
                  const netEffectiveHrs = ((wc.baseDailyHours || 16.0) * (wc.efficiencyRate ?? 0.85)).toFixed(1);
                  const combinedRate = (wc.laborRatePerHour || 220) + (wc.overheadRatePerHour || 350);

                  return (
                    <tr
                      key={wc._id}
                      style={{
                        borderBottom: '1px solid var(--border-color, #f1f5f9)',
                        background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, #fafafa)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed' }}>
                        {wc.code}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>{wc.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>{wc.category || 'Production Line'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div>{wc.plantId?.name || 'Hosur Plant'}</div>
                        <div style={{ fontSize: '11px', color: '#6d28d9', fontWeight: 600 }}>{wc.departmentId?.name || 'Press Shop'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '12px' }}>
                        {wc.floorLocation || 'Bay 1 - Floor'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 600 }}>{wc.baseDailyHours || 16.0}h</span>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary, #94a3b8)' }}>{wc.shiftsPerDay || 2} Shifts</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: effPercent >= 85 ? '#ecfdf5' : '#fffbeb',
                          color: effPercent >= 85 ? '#065f46' : '#92400e',
                          border: `1px solid ${effPercent >= 85 ? '#a7f3d0' : '#fde68a'}`
                        }}>
                          {effPercent}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#6d28d9' }}>
                        {netEffectiveHrs}h / day
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary, #475569)' }}>
                        ₹{wc.laborRatePerHour || 220}/h
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary, #475569)' }}>
                        ₹{wc.overheadRatePerHour || 350}/h
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>
                        ₹{combinedRate}.00/h
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#f3e8ff',
                          color: '#7c3aed'
                        }}>
                          {assignedMachines.length} Assets
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedDossier(wc)}
                            title="Cell 360° Dossier"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#7c3aed',
                              padding: '4px'
                            }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleEdit(wc)}
                            title="Edit Work Centre"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-secondary, #64748b)',
                              padding: '4px'
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => toggleStatus(wc)}
                            title={isActive ? 'Deactivate' : 'Activate'}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: isActive ? 'var(--accent-danger, #ef4444)' : 'var(--accent-success, #22c55e)',
                              padding: '4px'
                            }}
                          >
                            {isActive ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
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
      ) : (
        /* ── PLANT FLOOR TOPOLOGY MAP ── */
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #e2e8f0)',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary, #0f172a)' }}>
              Plant Floor Spatial Layout & Bay Topology
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', margin: 0 }}>
              Physical distribution of cellular manufacturing routing nodes across Plant Bays, illustrating production flow and machine allocations.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {/* Bay 1: Stamping */}
            <div style={{
              background: '#faf5ff',
              borderRadius: '12px',
              border: '1.5px solid #d8b4fe',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#7c3aed',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  BAY 1: HEAVY STAMPING
                </span>
                <span style={{ fontSize: '12px', color: '#6d28d9', fontWeight: 600 }}>Primary Blanking & Drawing</span>
              </div>

              {workCenters.filter(w => (w.floorLocation || '').includes('Bay 1') || w.code === 'WC-PRESS').map(wc => (
                <div
                  key={wc._id}
                  onClick={() => setSelectedDossier(wc)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #e9d5ff',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{wc.name}</strong>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', color: '#7c3aed' }}>{wc.code}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {machinesByWc[wc._id]?.length || 0} Connected Presses • {(wc.efficiencyRate ?? 0.85) * 100}% OEE
                  </div>
                </div>
              ))}
            </div>

            {/* Bay 2: Welding */}
            <div style={{
              background: '#f5f3ff',
              borderRadius: '12px',
              border: '1.5px solid #c4b5fd',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#6d28d9',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  BAY 2: WELDING CELL
                </span>
                <span style={{ fontSize: '12px', color: '#6d28d9', fontWeight: 600 }}>Robotic Arc & Fixture Staging</span>
              </div>

              {workCenters.filter(w => (w.floorLocation || '').includes('Bay 2') || w.code === 'WC-WELD').map(wc => (
                <div
                  key={wc._id}
                  onClick={() => setSelectedDossier(wc)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #ddd6fe',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{wc.name}</strong>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', color: '#6d28d9' }}>{wc.code}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {machinesByWc[wc._id]?.length || 0} Welding Cells • {(wc.efficiencyRate ?? 0.85) * 100}% OEE
                  </div>
                </div>
              ))}
            </div>

            {/* Bay 3: Tooling & QC */}
            <div style={{
              background: '#faf5ff',
              borderRadius: '12px',
              border: '1.5px solid #d8b4fe',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#5b21b6',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  BAY 3: TOOLING & QC
                </span>
                <span style={{ fontSize: '12px', color: '#6d28d9', fontWeight: 600 }}>Laser, Bender & CMM Lab</span>
              </div>

              {workCenters.filter(w => (w.floorLocation || '').includes('Bay 3') || w.code === 'WC-TOOL' || w.code === 'WC-QC').map(wc => (
                <div
                  key={wc._id}
                  onClick={() => setSelectedDossier(wc)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #e9d5ff',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{wc.name}</strong>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', color: '#7c3aed' }}>{wc.code}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {machinesByWc[wc._id]?.length || 0} Machines • {(wc.efficiencyRate ?? 0.85) * 100}% OEE
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. WORK CENTRE 360° SLIDE-OVER DOSSIER DRAWER
          ───────────────────────────────────────────────────────────── */}
      {selectedDossier && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: 'var(--card-bg, #ffffff)',
            height: '100%',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Drawer Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    background: '#f3e8ff',
                    color: '#6d28d9',
                    border: '1px solid #d8b4fe'
                  }}>
                    {selectedDossier.code}
                  </span>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: (selectedDossier.criticality || '').includes('Bottleneck') ? '#fdf2f8' : '#f8fafc',
                    color: (selectedDossier.criticality || '').includes('Bottleneck') ? '#be185d' : '#64748b',
                    border: '1px solid #e2e8f0'
                  }}>
                    {selectedDossier.criticality || 'B - Balanced Cell'}
                  </span>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '8px 0 2px 0', color: 'var(--text-primary, #0f172a)' }}>
                  {selectedDossier.name}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
                  {selectedDossier.category || 'Cellular Manufacturing Line'}
                </div>
              </div>

              <button
                onClick={() => setSelectedDossier(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary, #64748b)',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Section 1: Capacity & OEE Metrics */}
            <div style={{
              background: 'var(--bg-secondary, #faf5ff)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e9d5ff'
            }}>
              <h4 style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 700,
                color: '#6d28d9',
                margin: '0 0 12px 0'
              }}>
                Cellular Capacity Architecture
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Operating Shifts:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                    {selectedDossier.shiftsPerDay || 2} Shifts / Day
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Daily Gross Window:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                    {selectedDossier.baseDailyHours || 16.0} Hours
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>OEE Target Efficiency:</span>
                  <div style={{ fontWeight: 800, color: '#059669' }}>
                    {Math.round((selectedDossier.efficiencyRate ?? 0.85) * 100)}% Standard
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Net Effective Capacity:</span>
                  <div style={{ fontWeight: 800, color: '#7c3aed' }}>
                    {((selectedDossier.baseDailyHours || 16.0) * (selectedDossier.efficiencyRate ?? 0.85)).toFixed(1)} Planned Hrs / Day
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Operating Economics & Cost Absorption */}
            <div style={{
              background: 'var(--card-bg, #ffffff)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--border-color, #e2e8f0)'
            }}>
              <h4 style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 700,
                color: '#7c3aed',
                margin: '0 0 12px 0'
              }}>
                Operating Economics & Cost Absorption
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Direct Labor Rate:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{selectedDossier.laborRatePerHour || 220}.00 / hr
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Factory Overhead Rate:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{selectedDossier.overheadRatePerHour || 350}.00 / hr
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Combined Work Center Rate:</span>
                  <div style={{ fontWeight: 800, color: '#6d28d9', fontSize: '15px' }}>
                    ₹{(selectedDossier.laborRatePerHour || 220) + (selectedDossier.overheadRatePerHour || 350)}.00 / hr
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Floor Manning:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedDossier.manningLevel || 3} Operators / Shift
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Shop Floor Location & Leadership */}
            <div style={{
              background: 'var(--card-bg, #ffffff)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--border-color, #e2e8f0)'
            }}>
              <h4 style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 700,
                color: '#7c3aed',
                margin: '0 0 12px 0'
              }}>
                Shop Floor Assignment & Supervision
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Plant Location:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedDossier.plantId?.name || 'Hosur Main Plant'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Department:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedDossier.departmentId?.name || 'Press Shop'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Floor Bay Location:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedDossier.floorLocation || 'Bay 1 - Main Floor'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Cell Supervisor / Lead:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedDossier.supervisor || 'Shift In-Charge'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Connected Machine Roster */}
            <div style={{
              background: 'var(--card-bg, #ffffff)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--border-color, #e2e8f0)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  color: '#7c3aed',
                  margin: 0
                }}>
                  Connected Machine Pool ({machinesByWc[selectedDossier._id]?.length || 0})
                </h4>
                <button
                  onClick={() => navigate('/master/machine')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7c3aed',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  Manage Machines <ArrowUpRight size={11} />
                </button>
              </div>

              {(machinesByWc[selectedDossier._id] || []).length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                  No floor machines currently assigned to this work centre.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(machinesByWc[selectedDossier._id] || []).map(m => (
                    <div
                      key={m._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        background: 'var(--bg-secondary, #f8fafc)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, #e2e8f0)'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{m.name}</span>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Code: {m.code} • {m.tonnage || 'Standard Force'} • {m.manufacturer || 'Laxmi Machine Tools'}
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed' }}>
                        ₹{m.hourlyCost || 500}/h
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 5: Downstream Workflow Launchers */}
            <div style={{
              background: 'var(--bg-secondary, #faf5ff)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e9d5ff'
            }}>
              <h4 style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 700,
                color: '#6d28d9',
                margin: '0 0 12px 0'
              }}>
                Production & Routing Workflows
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => navigate('/engineering/routing')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #d8b4fe',
                    color: '#6d28d9',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={15} style={{ color: '#7c3aed' }} /> Configure Engineering Routing Sheet
                  </span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => navigate('/production/scheduling')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #d8b4fe',
                    color: '#6d28d9',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={15} style={{ color: '#7c3aed' }} /> View Production Schedule & Cell Loading
                  </span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => navigate('/shopfloor/capacity')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #d8b4fe',
                    color: '#6d28d9',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={15} style={{ color: '#7c3aed' }} /> Shop Floor Capacity & Bottleneck Analytics
                  </span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => navigate('/finance/cost-accounting')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #d8b4fe',
                    color: '#6d28d9',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={15} style={{ color: '#7c3aed' }} /> Cost Accounting & Overhead Absorption
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. COMMISSION / EDIT WORK CENTRE MODAL
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} style={{ color: '#7c3aed' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                  {editingId ? 'Edit Work Centre Configuration' : 'Commission New Manufacturing Work Centre'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #64748b)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Work Centre Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label" style={{ fontWeight: 600 }}>Work Centre Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. Press Shop Line 1, Weld & Assembly Bay, Tool Room CNC"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Code */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Work Centre Code *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    readOnly={!!editingId}
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                  <span style={{ fontSize: '11px', color: '#6d28d9' }}>Automated routing key identifier.</span>
                </div>

                {/* Category */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Cell Classification *</label>
                  <select
                    className="input-field"
                    required
                    value={formData.category || 'Heavy Stamping & Press Line'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Heavy Stamping & Press Line">Heavy Stamping & Press Line</option>
                    <option value="Robotic Welding & Sub-Assembly">Robotic Welding & Sub-Assembly</option>
                    <option value="CNC Machining & Precision Tooling">CNC Machining & Precision Tooling</option>
                    <option value="Quality Assurance & Metrology">Quality Assurance & Metrology</option>
                    <option value="Final Assembly & Kitting">Final Assembly & Kitting</option>
                    <option value="General Fabrication">General Fabrication</option>
                  </select>
                </div>

                {/* Plant */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Plant Location *</label>
                  <select
                    className="input-field"
                    required
                    value={formData.plantId || ''}
                    onChange={e => setFormData({ ...formData, plantId: e.target.value })}
                  >
                    <option value="" disabled>Select plant</option>
                    {plants.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Department *</label>
                  <select
                    className="input-field"
                    required
                    value={formData.departmentId || ''}
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="" disabled>Select department</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Operating Shifts */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Operating Shifts / Day *</label>
                  <select
                    className="input-field"
                    required
                    value={formData.shiftsPerDay || 2}
                    onChange={e => setFormData({ ...formData, shiftsPerDay: Number(e.target.value) })}
                  >
                    <option value={1}>1 Shift (8 hrs / day)</option>
                    <option value={2}>2 Shifts (16 hrs / day)</option>
                    <option value={3}>3 Shifts (24 hrs continuous)</option>
                  </select>
                </div>

                {/* Base Daily Gross Hours */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Base Daily Hours (Gross) *</label>
                  <input
                    type="number"
                    step="0.5"
                    className="input-field"
                    required
                    value={formData.baseDailyHours ?? 16.0}
                    onChange={e => setFormData({ ...formData, baseDailyHours: parseFloat(e.target.value) })}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>Gross available time before OEE.</span>
                </div>

                {/* Target OEE Efficiency Rate */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Target OEE Efficiency (0.1 - 1.0) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="1.0"
                    className="input-field"
                    required
                    value={formData.efficiencyRate ?? 0.85}
                    onChange={e => setFormData({ ...formData, efficiencyRate: parseFloat(e.target.value) })}
                  />
                  <span style={{ fontSize: '11px', color: '#059669' }}>
                    Standard OEE: {Math.round((formData.efficiencyRate ?? 0.85) * 100)}%
                  </span>
                </div>

                {/* Manning Level */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Operators / Manning Level *</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    required
                    value={formData.manningLevel ?? 3}
                    onChange={e => setFormData({ ...formData, manningLevel: parseInt(e.target.value) })}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>Assigned operators per shift.</span>
                </div>

                {/* Direct Labor Rate */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Direct Labor Absorption Rate (₹/hr) *</label>
                  <input
                    type="number"
                    className="input-field"
                    required
                    value={formData.laborRatePerHour ?? 220}
                    onChange={e => setFormData({ ...formData, laborRatePerHour: parseFloat(e.target.value) })}
                  />
                </div>

                {/* Factory Overhead Rate */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Factory Overhead Absorption Rate (₹/hr) *</label>
                  <input
                    type="number"
                    className="input-field"
                    required
                    value={formData.overheadRatePerHour ?? 350}
                    onChange={e => setFormData({ ...formData, overheadRatePerHour: parseFloat(e.target.value) })}
                  />
                </div>

                {/* Floor Location / Bay */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Floor Bay / Spatial Zone</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Bay 1 - Heavy Stamping Line"
                    value={formData.floorLocation || ''}
                    onChange={e => setFormData({ ...formData, floorLocation: e.target.value })}
                  />
                </div>

                {/* Criticality */}
                <div>
                  <label className="input-label" style={{ fontWeight: 600 }}>Pacing & Bottleneck Classification *</label>
                  <select
                    className="input-field"
                    required
                    value={formData.criticality || 'B - Balanced Cell'}
                    onChange={e => setFormData({ ...formData, criticality: e.target.value })}
                  >
                    <option value="A - Bottleneck Pacing Cell">A - Bottleneck Pacing Cell</option>
                    <option value="B - Balanced Cell">B - Balanced Cell</option>
                    <option value="C - Buffer Cell">C - Buffer Cell</option>
                  </select>
                </div>

                {/* Supervisor */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label" style={{ fontWeight: 600 }}>Cell Team Leader / Supervisor</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. R. Murugan (Press Shop Superintendent)"
                    value={formData.supervisor || ''}
                    onChange={e => setFormData({ ...formData, supervisor: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label" style={{ fontWeight: 600 }}>Operational Scope & Routing Notes</label>
                  <textarea
                    className="input-field"
                    rows="2"
                    placeholder="Describe manufacturing operations performed (blanking, forming, pierce, robotic welding)..."
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color, #e2e8f0)'
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
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {saving ? 'Saving Cell...' : editingId ? 'Update Work Centre' : 'Commission Work Centre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkCenterMaster;