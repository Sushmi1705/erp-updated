import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Settings, Cpu, Activity, AlertTriangle, CheckCircle, CheckCircle2,
  XCircle, Plus, Edit2, Eye, Copy, Check, Download, LayoutGrid, List,
  Calendar, Wrench, Shield, Zap, Search, Sparkles, X, ChevronRight,
  ArrowRight, ArrowUpRight, Gauge, Clock, DollarSign, Building, Factory,
  Layers, PowerOff, ShieldCheck, HelpCircle, RefreshCw, BarChart2
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

// Preset detailed engineering specs for automotive machine fleet
const MACHINE_PRESET_SPECS = {
  'MC-001': { tonnage: '250T', bedSize: '1600 × 1100 mm', strokeLength: '250 mm', strokesPerMinute: '35 - 55 SPM', powerRatingKW: 45, criticality: 'A - Super Critical', operationalState: 'Operational', manufacturer: 'Aida Engineering Ltd', serialNumber: 'AIDA-250-2022' },
  'MC-002': { tonnage: '250T', bedSize: '1600 × 1100 mm', strokeLength: '250 mm', strokesPerMinute: '35 - 55 SPM', powerRatingKW: 45, criticality: 'A - Super Critical', operationalState: 'Operational', manufacturer: 'Aida Engineering Ltd', serialNumber: 'AIDA-250-2023' },
  'MC-003': { tonnage: '160T', bedSize: '1300 × 900 mm', strokeLength: '200 mm', strokesPerMinute: '40 - 65 SPM', powerRatingKW: 30, criticality: 'B - Critical', operationalState: 'Operational', manufacturer: 'Komatsu Press Co', serialNumber: 'KMT-160-2021' },
  'MC-004': { tonnage: '63T', bedSize: '900 × 600 mm', strokeLength: '120 mm', strokesPerMinute: '50 - 90 SPM', powerRatingKW: 15, criticality: 'B - Critical', operationalState: 'Operational', manufacturer: 'Isgec Heavy Eng', serialNumber: 'ISG-63T-2020' },
  'MC-005': { tonnage: '60T', bedSize: '850 × 550 mm', strokeLength: '100 mm', strokesPerMinute: '60 - 100 SPM', powerRatingKW: 15, criticality: 'C - Standard', operationalState: 'Operational', manufacturer: 'Godrej Machine Tools', serialNumber: 'GDJ-60M-2019' },
  'MC-006': { tonnage: '4kW Laser', bedSize: '3000 × 1500 mm', strokeLength: 'Fiber Optic', strokesPerMinute: 'Continuous', powerRatingKW: 32, criticality: 'A - Super Critical', operationalState: 'Operational', manufacturer: 'Trumpf Laser GmbH', serialNumber: 'TRF-FIB-2023' },
  'MC-007': { tonnage: '130T', bedSize: '3100 mm Bed', strokeLength: '200 mm Stroke', strokesPerMinute: 'CNC Hydraulic', powerRatingKW: 18, criticality: 'B - Critical', operationalState: 'Operational', manufacturer: 'Amada Co Ltd', serialNumber: 'AMD-HFE-2022' },
  'MC-008': { tonnage: '6mm Cap', bedSize: '2500 mm Cut', strokeLength: 'Hydraulic Shear', strokesPerMinute: '18 - 30 SPM', powerRatingKW: 12, criticality: 'C - Standard', operationalState: 'Operational', manufacturer: 'Haco Machinery', serialNumber: 'HAC-SHR-2020' },
  'MC-009': { tonnage: 'Ø50mm Tube', bedSize: '5-Axis Multi-Radius', strokeLength: 'Electric Servo', strokesPerMinute: 'CNC Bending', powerRatingKW: 22, criticality: 'B - Critical', operationalState: 'Operational', manufacturer: 'Crippa SpA', serialNumber: 'CRP-5AX-2021' },
  'MC-010': { tonnage: '400A Inverter', bedSize: 'Welding Table 2x1m', strokeLength: 'MIG/MAG Synergic', strokesPerMinute: 'Continuous Arc', powerRatingKW: 14, criticality: 'B - Critical', operationalState: 'Operational', manufacturer: 'Fronius International', serialNumber: 'FRN-TPS-2023' }
};

const MachineMaster = () => {
  const navigate = useNavigate();

  // View mode: 'cards' (Press Shop Fleet Grid) vs 'table' (Machine Matrix Table)
  const [viewMode, setViewMode] = useState('cards');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL'); // 'ALL' | 'PRESS' | 'CNC' | 'FABRICATION'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'code' | 'cost' | 'tonnage' | 'capacity'

  // Master Data state
  const [machines, setMachines] = useState([]);
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  // Modals & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null); // Machine 360 Slide-Over
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
      const [pRes, dRes, wRes, uRes] = await Promise.all([
        axios.get('/company/plants?limit=100').catch(() => ({ data: { data: [] } })),
        axios.get('/company/departments?limit=100').catch(() => ({ data: { data: [] } })),
        axios.get('/master/workcenter?limit=100').catch(() => ({ data: { data: [] } })),
        axios.get('/master/uom?limit=100').catch(() => ({ data: { data: [] } }))
      ]);
      setPlants(pRes.data?.data || []);
      setDepartments(dRes.data?.data || []);
      setWorkCenters(wRes.data?.data || []);
      setUoms(uRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching machine dependencies:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/master/machine?limit=200&includeInactive=true');
      setMachines(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching machines:', err);
    }
    setLoading(false);
  };

  // Telemetry Metrics
  const telemetry = useMemo(() => {
    const total = machines.length;
    const active = machines.filter(m => m.status !== 'Inactive' && m.isActive !== false).length;
    const presses = machines.filter(m => (m.name || '').toLowerCase().includes('press')).length;
    const totalHourlyCost = machines.reduce((sum, m) => sum + (m.hourlyCost || 0), 0);
    const superCritical = machines.filter(m => m.criticality?.includes('Super Critical')).length;
    return { total, active, presses, totalHourlyCost, superCritical };
  }, [machines]);

  // One-click Calibrate Machine Fleet Specifications & Work Centers
  const handleCalibrateSpecs = async () => {
    if (!await confirmAction('Calibrate industrial stamping specifications (Tonnages, Bed Sizes, SPM speeds, and Work Center mappings) for all floor machines?')) return;
    setCalibrating(true);
    try {
      // Find press workcenter, tool workcenter, weld workcenter
      const pressWc = workCenters.find(w => (w.code || '').includes('PRESS') || (w.name || '').toLowerCase().includes('press')) || workCenters[0];
      const toolWc = workCenters.find(w => (w.code || '').includes('TOOL') || (w.name || '').toLowerCase().includes('tool')) || workCenters[0];
      const weldWc = workCenters.find(w => (w.code || '').includes('WELD') || (w.name || '').toLowerCase().includes('weld')) || workCenters[0];

      for (const m of machines) {
        const preset = MACHINE_PRESET_SPECS[m.code] || {};
        const deptName = (m.departmentId?.name || '').toLowerCase();
        let targetWcId = m.workCenterId?._id || m.workCenterId;

        if (!targetWcId) {
          if (deptName.includes('press')) targetWcId = pressWc?._id;
          else if (deptName.includes('tool')) targetWcId = toolWc?._id;
          else if (deptName.includes('weld') || deptName.includes('assembly')) targetWcId = weldWc?._id;
          else targetWcId = pressWc?._id;
        }

        const updatePayload = {
          name: m.name,
          code: m.code,
          plantId: m.plantId?._id || m.plantId,
          departmentId: m.departmentId?._id || m.departmentId,
          workCenterId: targetWcId || null,
          uomId: m.uomId?._id || m.uomId || undefined,
          hourlyCost: m.hourlyCost || preset.hourlyCost || 500,
          capacity: m.capacity || 100,
          tonnage: preset.tonnage || m.tonnage || (m.name.includes('250T') ? '250T' : m.name.includes('160T') ? '160T' : m.name.includes('63T') ? '63T' : 'Standard'),
          bedSize: preset.bedSize || m.bedSize || '1200 × 800 mm',
          strokeLength: preset.strokeLength || m.strokeLength || '200 mm',
          strokesPerMinute: preset.strokesPerMinute || m.strokesPerMinute || '45 - 70 SPM',
          powerRatingKW: preset.powerRatingKW || m.powerRatingKW || 25,
          criticality: preset.criticality || m.criticality || 'B - Critical',
          operationalState: preset.operationalState || m.operationalState || 'Operational',
          manufacturer: preset.manufacturer || m.manufacturer || 'Laxmi Machine Tools',
          serialNumber: preset.serialNumber || m.serialNumber || `SN-${m.code}-2022`,
          status: 'Active',
          isActive: true
        };

        await axios.put(`/master/machine/${m._id}`, updatePayload);
      }

      await fetchData();
      notify.success('Machine fleet technical specifications and work center bindings calibrated!');
    } catch (err) {
      console.error(err);
      notify.error('Error calibrating machines: ' + (err.response?.data?.message || err.message));
    }
    setCalibrating(false);
  };

  // Filtered & Sorted Machines
  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      // Department Filter
      if (selectedDeptFilter !== 'ALL') {
        const dId = m.departmentId?._id || m.departmentId;
        if (dId !== selectedDeptFilter) return false;
      }

      // Machine Type Filter
      if (selectedTypeFilter === 'PRESS') {
        if (!(m.name || '').toLowerCase().includes('press')) return false;
      } else if (selectedTypeFilter === 'CNC') {
        const n = (m.name || '').toLowerCase();
        if (!n.includes('cnc') && !n.includes('laser')) return false;
      } else if (selectedTypeFilter === 'FABRICATION') {
        const n = (m.name || '').toLowerCase();
        if (!n.includes('weld') && !n.includes('shear') && !n.includes('bend')) return false;
      }

      // Status Filter
      if (selectedStatusFilter === 'ACTIVE' && (m.status === 'Inactive' || m.isActive === false)) return false;
      if (selectedStatusFilter === 'INACTIVE' && m.status !== 'Inactive' && m.isActive !== false) return false;

      // Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchCode = m.code?.toLowerCase().includes(q);
        const matchTonnage = m.tonnage?.toLowerCase().includes(q);
        const matchMaker = m.manufacturer?.toLowerCase().includes(q);
        const matchDept = m.departmentId?.name?.toLowerCase().includes(q);
        const matchWc = m.workCenterId?.name?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTonnage && !matchMaker && !matchDept && !matchWc) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
      if (sortBy === 'cost') return (b.hourlyCost || 0) - (a.hourlyCost || 0);
      if (sortBy === 'tonnage') return (b.powerRatingKW || 0) - (a.powerRatingKW || 0);
      return 0;
    });
  }, [machines, selectedDeptFilter, selectedTypeFilter, selectedStatusFilter, searchTerm, sortBy]);

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
      code: 'MC-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      name: '',
      plantId: plants[0]?._id || '',
      departmentId: departments[0]?._id || '',
      workCenterId: workCenters[0]?._id || '',
      hourlyCost: 500,
      capacity: 100,
      uomId: uoms[0]?._id || '',
      tonnage: '160T',
      bedSize: '1200 × 800 mm',
      strokeLength: '200 mm',
      strokesPerMinute: '45 SPM',
      powerRatingKW: 30,
      criticality: 'B - Critical',
      operationalState: 'Operational',
      manufacturer: 'Laxmi Machine Tools',
      serialNumber: '',
      preventiveCycleDays: 30,
      status: 'Active',
      description: ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (row) => {
    setFormData({
      ...row,
      plantId: row.plantId?._id || row.plantId,
      departmentId: row.departmentId?._id || row.departmentId,
      workCenterId: row.workCenterId?._id || row.workCenterId || '',
      uomId: row.uomId?._id || row.uomId || '',
      hourlyCost: row.hourlyCost || 0,
      capacity: row.capacity || 0,
      tonnage: row.tonnage || '',
      bedSize: row.bedSize || '',
      strokeLength: row.strokeLength || '',
      strokesPerMinute: row.strokesPerMinute || '',
      powerRatingKW: row.powerRatingKW || 0,
      criticality: row.criticality || 'B - Critical',
      operationalState: row.operationalState || 'Operational',
      preventiveCycleDays: row.preventiveCycleDays || 30,
      status: row.status || (row.isActive ? 'Active' : 'Inactive')
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  // Toggle Active Status
  const toggleStatus = async (row) => {
    const isCurrentlyActive = row.status !== 'Inactive' && row.isActive !== false;
    if (isCurrentlyActive && !await confirmAction(`Deactivate machine "${row.name}" (${row.code})? It will be disabled for future work order routing and scheduling.`)) return;

    try {
      await axios.put(`/master/machine/${row._id}`, {
        isActive: !isCurrentlyActive,
        status: isCurrentlyActive ? 'Inactive' : 'Active'
      });
      notify.success(`Machine ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully.`);
      fetchData();
    } catch (err) {
      notify.error('Error updating status');
    }
  };

  // Save Machine
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        hourlyCost: parseFloat(formData.hourlyCost || 0),
        capacity: parseFloat(formData.capacity || 0),
        powerRatingKW: parseFloat(formData.powerRatingKW || 0),
        preventiveCycleDays: parseInt(formData.preventiveCycleDays || 30, 10),
        isActive: formData.status !== 'Inactive'
      };

      if (!payload.workCenterId) delete payload.workCenterId;
      if (!payload.uomId) delete payload.uomId;

      if (editingId) {
        await axios.put(`/master/machine/${editingId}`, payload);
        notify.success('Machine specifications updated successfully!');
      } else {
        await axios.post('/master/machine', payload);
        notify.success('New machine commissioned and registered!');
      }
      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving machine');
    }
    setSaving(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredMachines.length === 0) {
      notify.error('No machines available to export.');
      return;
    }
    const headers = ['Code', 'Machine Name', 'Plant', 'Department', 'Work Center', 'Tonnage', 'Bed Size', 'Hourly Cost (₹)', 'Power (kW)', 'Criticality', 'Operational State', 'Manufacturer', 'Status'];
    const rows = filteredMachines.map(m => [
      `"${m.code || ''}"`,
      `"${m.name || ''}"`,
      `"${m.plantId?.name || ''}"`,
      `"${m.departmentId?.name || ''}"`,
      `"${m.workCenterId?.name || 'Unassigned'}"`,
      `"${m.tonnage || ''}"`,
      `"${m.bedSize || ''}"`,
      `"${m.hourlyCost || 0}"`,
      `"${m.powerRatingKW || 0}"`,
      `"${m.criticality || 'B - Critical'}"`,
      `"${m.operationalState || 'Operational'}"`,
      `"${m.manufacturer || ''}"`,
      `"${m.status || (m.isActive ? 'Active' : 'Inactive')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Precision_Machine_Fleet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Machine fleet registry exported to CSV.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', gap: 20 }}>
      {/* ── HEAVY MACHINERY & MECHATRONICS COMMAND BANNER ──────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #ea580c 100%)',
        borderRadius: 12,
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(234, 88, 12, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Tachometer / Power grid overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '45%',
          opacity: 0.08,
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', marginBottom: 12, border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Zap size={14} color="#fdba74" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#fdba74', textTransform: 'uppercase' }}>
                Press Shop Fleet & Mechatronics Command Center • Shop Floor Assets
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Machine Assets & Production Equipment
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.55 }}>
              Central equipment directory governing stamping presses (250T, 160T, 63T), CNC laser cutters, press brakes, tube benders, and automated welding lines. Configures hourly run rates, plant allocations, and preventive maintenance triggers.
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
              title="Export CSV fleet registry"
            >
              <Download size={15} /> Export CSV
            </button>

            <button
              onClick={handleCalibrateSpecs}
              disabled={calibrating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                background: 'rgba(253, 186, 116, 0.2)',
                color: '#fdba74',
                border: '1px solid rgba(253, 186, 116, 0.4)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Calibrate press tonnages, SPM, bed sizes, and work center links"
            >
              <Sparkles size={15} /> {calibrating ? 'Calibrating Fleet…' : 'Calibrate Fleet Specs'}
            </button>

            <button
              onClick={openCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={16} /> Add Machine
            </button>
          </div>
        </div>

        {/* ── FLEET TELEMETRY METRIC TILES ──────────────────────────────────── */}
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
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fed7aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Connected Assets
              </span>
              <Factory size={14} color="#ea580c" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.total}</span>
              <span style={{ fontSize: 11, color: '#fed7aa' }}>({telemetry.active} Active on Floor)</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              Press Shop, Tool Room & Welding
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
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fed7aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Heavy Stamping Fleet
              </span>
              <Gauge size={14} color="#f97316" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.presses}</span>
              <span style={{ fontSize: 11, color: '#fed7aa' }}>Power Presses</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              250T, 160T, 63T, 60T Mechanical
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
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fed7aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fleet Hourly Cost Basis
              </span>
              <DollarSign size={14} color="#fbbf24" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{fmtMoneyFull(telemetry.totalHourlyCost)}</span>
              <span style={{ fontSize: 11, color: '#fef08a' }}>/ hr combined</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              Used for routing & standard costing
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
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fed7aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Criticality Guard
              </span>
              <ShieldCheck size={14} color="#34d399" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.superCritical}</span>
              <span style={{ fontSize: 11, color: '#a7f3d0' }}>Super Critical Assets</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              A-Grade monitored under strict PM
            </p>
          </div>
        </div>
      </div>

      {/* ── FILTER & VIEW MODE BAR ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'ALL', label: `All Machines (${machines.length})` },
            { id: 'PRESS', label: 'Power Presses', icon: Gauge },
            { id: 'CNC', label: 'CNC & Laser', icon: Cpu },
            { id: 'FABRICATION', label: 'Fabrication & Welding', icon: Wrench }
          ].map(chip => {
            const isSelected = selectedTypeFilter === chip.id;
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedTypeFilter(chip.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #ea580c' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(234, 88, 12, 0.15)' : 'var(--bg-secondary)',
                  color: isSelected ? '#ea580c' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                {Icon && <Icon size={12} />}
                {chip.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={e => setSelectedDeptFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 12
            }}
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', width: 230 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search machine, code, tonnage…"
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
            <option value="cost">Sort: Cost per Hour (High-Low)</option>
            <option value="tonnage">Sort: Power / Tonnage</option>
          </select>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-secondary)', padding: 3, borderRadius: 6, border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? '#ea580c' : 'transparent',
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
              title="Heavy Equipment Cards View"
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#ea580c' : 'transparent',
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
              title="Fleet Table View"
            >
              <List size={14} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* ── LOADING STATE ──────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
          Querying machine fleet telemetry…
        </div>
      )}

      {/* ── EMPTY STATE ────────────────────────────────────────────────────── */}
      {!loading && filteredMachines.length === 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <Factory size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            No machines match the selected filter
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px 0', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
            Try adjusting your search criteria, or click below to register a new machine.
          </p>
          <button
            onClick={openCreate}
            className="btn btn-primary"
            style={{ background: '#ea580c', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Register Machine
          </button>
        </div>
      )}

      {/* ── VIEW MODE 1: HEAVY EQUIPMENT CARDS GRID ─────────────────────────── */}
      {!loading && viewMode === 'cards' && filteredMachines.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16
        }}>
          {filteredMachines.map(m => {
            const isActive = m.status !== 'Inactive' && m.isActive !== false;
            const isCopied = copiedCodeId === m._id;
            const isSuperCritical = m.criticality?.includes('Super Critical');

            return (
              <div
                key={m._id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  borderTop: isSuperCritical ? '3px solid #ef4444' : '3px solid #ea580c',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Bar: Code Chip, Tonnage & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {/* Code Chip */}
                      <div
                        onClick={() => handleCopyCode(m._id, m.code)}
                        title="Click to copy machine code"
                        style={{
                          background: 'rgba(234, 88, 12, 0.12)',
                          color: '#ea580c',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 800,
                          fontSize: 12,
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <span>{m.code}</span>
                        {isCopied ? <Check size={11} /> : <Copy size={10} style={{ opacity: 0.6 }} />}
                      </div>

                      {/* Tonnage / Force Badge */}
                      {m.tonnage && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(249, 115, 22, 0.15)',
                          color: '#f97316',
                          border: '1px solid rgba(249, 115, 22, 0.3)'
                        }}>
                          {m.tonnage}
                        </span>
                      )}

                      {/* Criticality Pill */}
                      {isSuperCritical ? (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          CRITICAL
                        </span>
                      ) : null}
                    </div>

                    <div onClick={() => toggleStatus(m)} style={{ cursor: 'pointer' }} title="Toggle active status">
                      <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                    </div>
                  </div>

                  {/* Machine Name */}
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    {m.name}
                  </h3>

                  {/* Plant & Department Breadcrumb */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    <Building size={13} />
                    <span>{m.plantId?.name || 'Plant'}</span>
                    <span>•</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{m.departmentId?.name || 'Dept'}</strong>
                    {m.workCenterId?.name && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#0284c7' }}>{m.workCenterId.name}</span>
                      </>
                    )}
                  </div>

                  {/* Technical Specifications Grid */}
                  <div style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    fontSize: 12,
                    marginBottom: 12
                  }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Hourly Rate</div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>
                        {fmtMoneyFull(m.hourlyCost || 0)} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)' }}>/ hr</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Stroke & Speed</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {m.strokesPerMinute || `${m.capacity || 0} ${m.uomId?.symbol || 'pcs/hr'}`}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bed Area</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {m.bedSize || '1200 × 800 mm'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Power Rating</div>
                      <div style={{ fontWeight: 600, color: '#f59e0b' }}>
                        {m.powerRatingKW ? `${m.powerRatingKW} kW` : 'Standard'}
                      </div>
                    </div>
                  </div>

                  {/* Manufacturer & Serial */}
                  {m.manufacturer && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      Maker: <strong style={{ color: 'var(--text-primary)' }}>{m.manufacturer}</strong> {m.serialNumber && `(SN: ${m.serialNumber})`}
                    </div>
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
                    onClick={() => setSelectedDossier(m)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ea580c',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Eye size={14} /> Machine 360
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleEdit(m)}
                      title="Edit machine specifications"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '4px' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => toggleStatus(m)}
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

      {/* ── VIEW MODE 2: FLEET MATRIX TABLE VIEW ───────────────────────────── */}
      {!loading && viewMode === 'table' && filteredMachines.length > 0 && (
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
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Machine Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Plant</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Department</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Work Center</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tonnage / Specs</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Cost / hr</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Criticality</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMachines.map((m, idx) => {
                const isActive = m.status !== 'Inactive' && m.isActive !== false;
                const isSuperCritical = m.criticality?.includes('Super Critical');

                return (
                  <tr
                    key={m._id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#ea580c' }}>
                      {m.code}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div>{m.name}</div>
                      {m.manufacturer && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {m.manufacturer} {m.serialNumber && `(${m.serialNumber})`}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12 }}>
                      {m.plantId?.name || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12 }}>
                      {m.departmentId?.name || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: m.workCenterId ? '#0284c7' : 'var(--text-secondary)' }}>
                      {m.workCenterId?.name || 'Unassigned'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12 }}>
                      {m.tonnage ? (
                        <span style={{ fontWeight: 700, color: '#f97316' }}>{m.tonnage}</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                      {fmtMoneyFull(m.hourlyCost || 0)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isSuperCritical ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                          Super Critical
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {m.criticality || 'B - Critical'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => setSelectedDossier(m)}
                          title="Inspect Machine 360"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea580c', padding: '4px' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(m)}
                          title="Edit"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '4px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => toggleStatus(m)}
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

      {/* ── MACHINE 360 SLIDE-OVER DOSSIER DRAWER ───────────────────────────── */}
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
                      background: 'rgba(234, 88, 12, 0.15)',
                      color: '#ea580c',
                      border: '1px solid rgba(234, 88, 12, 0.3)'
                    }}>
                      {selectedDossier.code}
                    </span>
                    {selectedDossier.tonnage && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#f97316', background: 'rgba(249, 115, 22, 0.12)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                        {selectedDossier.tonnage}
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                      {selectedDossier.criticality || 'B - Critical'}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedDossier.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedDossier(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Technical Specifications Section */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
                  Technical Press Specifications
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Stamping Force / Tonnage:</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDossier.tonnage || 'Standard Force'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Bed Dimensions:</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDossier.bedSize || '1200 × 800 mm'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Stroke Length:</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDossier.strokeLength || '200 mm'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Speed / SPM:</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDossier.strokesPerMinute || '45 SPM'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Electric Power Rating:</div>
                    <div style={{ fontWeight: 600, color: '#f59e0b' }}>{selectedDossier.powerRatingKW ? `${selectedDossier.powerRatingKW} kW` : '25 kW'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cost Per Running Hour:</div>
                    <div style={{ fontWeight: 800, color: '#ea580c', fontFamily: 'monospace' }}>{fmtMoneyFull(selectedDossier.hourlyCost || 0)} / hr</div>
                  </div>
                </div>
              </div>

              {/* Plant & Hierarchy Assignment */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
                  Shop Floor Assignment
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Plant Location:</div>
                    <div style={{ fontWeight: 600 }}>{selectedDossier.plantId?.name || 'Plant'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Department:</div>
                    <div style={{ fontWeight: 600 }}>{selectedDossier.departmentId?.name || 'Dept'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Work Center:</div>
                    <div style={{ fontWeight: 600, color: '#0284c7' }}>{selectedDossier.workCenterId?.name || 'Unassigned Line'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Manufacturer:</div>
                    <div style={{ fontWeight: 600 }}>{selectedDossier.manufacturer || 'Laxmi Machine Tools'}</div>
                  </div>
                </div>
              </div>

              {/* Downstream Shop Floor & Maintenance Launchers */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
                  Production & Maintenance Workflows
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => navigate('/maintenance/preventive')}
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
                      <Wrench size={15} color="#ea580c" /> Schedule Preventive Maintenance (PM)
                    </span>
                    <ArrowRight size={14} color="var(--text-secondary)" />
                  </button>

                  <button
                    onClick={() => navigate('/maintenance/breakdown')}
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
                      <AlertTriangle size={15} color="#ef4444" /> Report Breakdown & Downtime Log
                    </span>
                    <ArrowRight size={14} color="var(--text-secondary)" />
                  </button>

                  <button
                    onClick={() => navigate('/shopfloor/utilization')}
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
                      <BarChart2 size={15} color="#10b981" /> View Live Machine OEE & Running Hours
                    </span>
                    <ArrowRight size={14} color="var(--text-secondary)" />
                  </button>

                  <button
                    onClick={() => navigate('/engineering/routing')}
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
                      <Layers size={15} color="#0284c7" /> Configure Routing Process Sheet
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
                  const m = selectedDossier;
                  setSelectedDossier(null);
                  handleEdit(m);
                }}
                className="btn btn-primary"
                style={{ flex: 1, background: '#ea580c', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Edit2 size={14} /> Edit Machine
              </button>
              <button
                onClick={() => {
                  const m = selectedDossier;
                  setSelectedDossier(null);
                  toggleStatus(m);
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

      {/* ── CREATE / EDIT MACHINE MODAL ─────────────────────────────────────── */}
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
            maxWidth: 680,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column'
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
                <Zap size={18} color="#ea580c" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingId ? 'Edit Machine Specifications' : 'Commission New Machine Asset'}
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

            <form onSubmit={handleSave} style={{ padding: '20px 24px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Machine Name */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Machine Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. Power Press 250T #1, CNC Laser Cutting Machine, Hydraulic Press Brake"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Machine Code */}
                <div className="input-group">
                  <label className="input-label">Machine Code *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    readOnly
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                  />
                  <p style={hintStyle}>Auto-assigned asset identification code.</p>
                </div>

                {/* Hourly Cost */}
                <div className="input-group">
                  <label className="input-label">Cost Per Running Hour (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    className="input-field"
                    placeholder="e.g. 850"
                    value={formData.hourlyCost ?? ''}
                    onChange={e => setFormData({ ...formData, hourlyCost: e.target.value })}
                  />
                  <p style={hintStyle}>Used in production routing cost accumulation.</p>
                </div>

                {/* Plant */}
                <div className="input-group">
                  <label className="input-label">Plant *</label>
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

                {/* Department */}
                <div className="input-group">
                  <label className="input-label">Department *</label>
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

                {/* Work Center */}
                <div className="input-group">
                  <label className="input-label">Work Center (Optional)</label>
                  <select
                    className="input-field"
                    value={formData.workCenterId || ''}
                    onChange={e => setFormData({ ...formData, workCenterId: e.target.value })}
                  >
                    <option value="">None — Machine stands on its own</option>
                    {workCenters.map(w => (
                      <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>

                {/* Criticality */}
                <div className="input-group">
                  <label className="input-label">Machine Criticality *</label>
                  <select
                    className="input-field"
                    value={formData.criticality || 'B - Critical'}
                    onChange={e => setFormData({ ...formData, criticality: e.target.value })}
                  >
                    <option value="A - Super Critical">A - Super Critical (Bottleneck line)</option>
                    <option value="B - Critical">B - Critical (Standard line)</option>
                    <option value="C - Standard">C - Standard (Redundant equipment)</option>
                  </select>
                </div>

                {/* Tonnage / Force */}
                <div className="input-group">
                  <label className="input-label">Stamping Tonnage / Capacity</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 250T, 160T, 63T, 4kW"
                    value={formData.tonnage || ''}
                    onChange={e => setFormData({ ...formData, tonnage: e.target.value })}
                  />
                </div>

                {/* Bed Size */}
                <div className="input-group">
                  <label className="input-label">Bed Dimensions</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 1600 × 1100 mm"
                    value={formData.bedSize || ''}
                    onChange={e => setFormData({ ...formData, bedSize: e.target.value })}
                  />
                </div>

                {/* Speed / SPM */}
                <div className="input-group">
                  <label className="input-label">Strokes Per Minute (SPM)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 35 - 55 SPM"
                    value={formData.strokesPerMinute || ''}
                    onChange={e => setFormData({ ...formData, strokesPerMinute: e.target.value })}
                  />
                </div>

                {/* Power Rating */}
                <div className="input-group">
                  <label className="input-label">Connected Power (kW)</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="e.g. 45"
                    value={formData.powerRatingKW ?? ''}
                    onChange={e => setFormData({ ...formData, powerRatingKW: e.target.value })}
                  />
                </div>

                {/* Manufacturer */}
                <div className="input-group">
                  <label className="input-label">Manufacturer / Brand</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Aida, Komatsu, Isgec, Amada"
                    value={formData.manufacturer || ''}
                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>

                {/* Serial Number */}
                <div className="input-group">
                  <label className="input-label">Serial Number</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. AD-250-2022"
                    value={formData.serialNumber || ''}
                    onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>

                {/* PM Cycle Days */}
                <div className="input-group">
                  <label className="input-label">PM Inspection Frequency (Days)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 30"
                    value={formData.preventiveCycleDays ?? 30}
                    onChange={e => setFormData({ ...formData, preventiveCycleDays: e.target.value })}
                  />
                </div>

                {/* Operational Status */}
                <div className="input-group">
                  <label className="input-label">Master Status</label>
                  <select
                    className="input-field"
                    value={formData.status || 'Active'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active — Available for Production & Routing</option>
                    <option value="Inactive">Inactive — Decommissioned</option>
                  </select>
                </div>

                {/* Description */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Description & Tooling Notes</label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Enter die clamping requirements, feeder attachments, or oil grade..."
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
                  style={{ background: '#ea580c', border: 'none' }}
                >
                  {saving ? 'Commissioning…' : editingId ? 'Update Machine Specs' : 'Commission Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineMaster;