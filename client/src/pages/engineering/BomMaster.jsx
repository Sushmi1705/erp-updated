import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Layers, GitBranch, RefreshCw, Link2, AlertCircle, CheckCircle, XCircle,
  Plus, Search, Filter, Cpu, Sliders, ChevronRight, ChevronDown, Edit2,
  Trash2, Download, Printer, Calculator, FileText, Check, ShieldCheck,
  Eye, ArrowRight, CornerDownRight, Box, Zap, Settings, HelpCircle,
  Sparkles, Compass, AlertTriangle, ArrowUpRight, BarChart2, CheckCircle2,
  X, CheckSquare, Hash, Activity, RefreshCcw
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

// ─────────────────────────────────────────────────────────────────────────────
// BLUEPRINT THEME STYLES & PRESETS
// ─────────────────────────────────────────────────────────────────────────────
const BP = {
  navyDark: '#031424',
  navyMid: '#072b4f',
  navyBlue: '#0b477e',
  cobalt: '#0284c7',
  cyanLight: '#38bdf8',
  laserLime: '#84cc16',
  limeLight: '#a3e635',
  amber: '#f59e0b',
  textMuted: '#64748b',
  gridBg: 'radial-gradient(rgba(56, 189, 248, 0.12) 0.8px, transparent 0.8px)'
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: BOM MASTER (ENGINEERING CAD STUDIO)
// ─────────────────────────────────────────────────────────────────────────────
const BomMaster = () => {
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  // Reference data
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [plants, setPlants] = useState([]);
  const [routings, setRoutings] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [ecmList, setEcmList] = useState([]);

  // BOM list (headers)
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Drill-down selection state
  const [selectedHeaderId, setSelectedHeaderId] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState(null);
  const [components, setComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [substitutes, setSubstitutes] = useState([]);
  const [opLinks, setOpLinks] = useState([]);

  // Search, Filters & Active Tab
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [plantFilter, setPlantFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('components'); // 'components' | 'substitutes' | 'oplinks' | 'calculator' | 'specs'
  const [componentSearch, setComponentSearch] = useState('');
  const [batchQuantity, setBatchQuantity] = useState(500);

  // Modal states: 'header' | 'revision' | 'component' | 'substitute' | 'oplink'
  const [modal, setModal] = useState({
    type: null,
    data: null,
    editId: null
  });

  // ── Load reference master collections ──────────────────────────────────────
  const loadReferences = useCallback(async () => {
    try {
      const [p, m, u, pl, r, wc, ecm] = await Promise.all([
        axios.get('/master/product').catch(() => ({ data: { data: [] } })),
        axios.get('/master/material').catch(() => ({ data: { data: [] } })),
        axios.get('/master/uom').catch(() => ({ data: { data: [] } })),
        axios.get('/company/plants').catch(() => ({ data: { data: [] } })),
        axios.get('/engineering/routing').catch(() => ({ data: { data: [] } })),
        axios.get('/master/workcenter').catch(() => ({ data: { data: [] } })),
        axios.get('/engineering/ecm').catch(() => ({ data: { data: [] } }))
      ]);
      setProducts(p.data?.data || []);
      setMaterials(m.data?.data || []);
      setUoms(u.data?.data || []);
      setPlants(pl.data?.data || []);
      setRoutings(r.data?.data || []);
      setWorkCenters(wc.data?.data || []);
      setEcmList(ecm.data?.data || []);
    } catch (e) {
      console.error('Refs load error', e);
    }
  }, []);

  // ── Fetchers ─────────────────────────────────────────────────────────────
  const fetchHeaders = async (autoSelectId = null) => {
    setLoading(true);
    try {
      const res = await axios.get('/engineering/bom');
      const list = res.data?.data || [];
      setHeaders(list);
      if (list.length > 0) {
        if (autoSelectId) {
          const match = list.find(h => h._id === autoSelectId);
          if (match) selectHeader(match);
          else selectHeader(list[0]);
        } else if (!selectedHeaderId || !list.some(h => h._id === selectedHeaderId)) {
          selectHeader(list[0]);
        }
      } else {
        setSelectedHeaderId(null);
        setRevisions([]);
        setComponents([]);
      }
    } catch (e) {
      console.error('Fetch BOM headers error:', e);
      notify.error('Failed to load Parts Lists');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReferences();
    fetchHeaders();
  }, [loadReferences]);

  const fetchRevisions = useCallback(async (headerId, autoSelectRevId = null) => {
    try {
      const res = await axios.get(`/engineering/bom/${headerId}/revisions`);
      const revs = res.data?.data || [];
      setRevisions(revs);
      if (revs.length > 0) {
        const target = autoSelectRevId 
          ? revs.find(r => r._id === autoSelectRevId) || revs[0]
          : revs.find(r => r.approvalStatus === 'Approved') || revs[0];
        selectRevision(target);
      } else {
        setSelectedRevisionId(null);
        setComponents([]);
        setSelectedComponentId(null);
        setSubstitutes([]);
        setOpLinks([]);
      }
    } catch (e) {
      console.error('Fetch revisions error:', e);
    }
  }, []);

  const fetchComponents = useCallback(async (revisionId, autoSelectCompId = null) => {
    try {
      const res = await axios.get(`/engineering/revisions/${revisionId}/components`);
      const comps = res.data?.data || [];
      setComponents(comps);
      if (comps.length > 0) {
        const target = autoSelectCompId
          ? comps.find(c => c._id === autoSelectCompId) || comps[0]
          : comps[0];
        selectComponent(target);
      } else {
        setSelectedComponentId(null);
        setSubstitutes([]);
        setOpLinks([]);
      }
    } catch (e) {
      console.error('Fetch components error:', e);
    }
  }, []);

  const fetchSubstitutes = useCallback(async (componentId) => {
    if (!componentId) { setSubstitutes([]); return; }
    try {
      const res = await axios.get(`/engineering/components/${componentId}/substitutes`);
      setSubstitutes(res.data?.data || []);
    } catch (e) {
      console.error('Fetch substitutes error:', e);
    }
  }, []);

  const fetchOpLinks = useCallback(async (componentId) => {
    if (!componentId) { setOpLinks([]); return; }
    try {
      const res = await axios.get(`/engineering/components/${componentId}/operation-links`);
      setOpLinks(res.data?.data || []);
    } catch (e) {
      console.error('Fetch operation links error:', e);
    }
  }, []);

  // ── Select Handlers ───────────────────────────────────────────────────────
  const selectHeader = (header) => {
    setSelectedHeaderId(header._id);
    fetchRevisions(header._id);
  };

  const selectRevision = (revision) => {
    setSelectedRevisionId(revision._id);
    fetchComponents(revision._id);
  };

  const selectComponent = (comp) => {
    setSelectedComponentId(comp._id);
    fetchSubstitutes(comp._id);
    fetchOpLinks(comp._id);
  };

  // Currently selected objects
  const selectedHeader = useMemo(() => {
    return headers.find(h => h._id === selectedHeaderId) || null;
  }, [headers, selectedHeaderId]);

  const selectedRevision = useMemo(() => {
    return revisions.find(r => r._id === selectedRevisionId) || null;
  }, [revisions, selectedRevisionId]);

  const selectedComponent = useMemo(() => {
    return components.find(c => c._id === selectedComponentId) || null;
  }, [components, selectedComponentId]);

  // ── Filtered BOM Headers ──────────────────────────────────────────────────
  const filteredHeaders = useMemo(() => {
    return headers.filter(h => {
      const matchSearch = searchTerm === '' ||
        (h.bomCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.bomName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.productId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.productId?.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'All' || h.bomType === typeFilter;
      const matchPlant = plantFilter === 'All' || (h.plantId?._id === plantFilter || h.plantId === plantFilter);
      const matchStatus = statusFilter === 'All' || h.status === statusFilter;
      return matchSearch && matchType && matchPlant && matchStatus;
    });
  }, [headers, searchTerm, typeFilter, plantFilter, statusFilter]);

  // Filtered components in active revision
  const filteredComponents = useMemo(() => {
    return components.filter(c => {
      if (!componentSearch) return true;
      const term = componentSearch.toLowerCase();
      const matName = c.materialId?.name || '';
      const matCode = c.materialId?.code || '';
      const prodName = c.productId?.name || '';
      const prodCode = c.productId?.code || '';
      return matName.toLowerCase().includes(term) ||
             matCode.toLowerCase().includes(term) ||
             prodName.toLowerCase().includes(term) ||
             prodCode.toLowerCase().includes(term) ||
             String(c.lineSequenceNumber).includes(term);
    });
  }, [components, componentSearch]);

  // ── Metrics roll-up ───────────────────────────────────────────────────────
  const telemetry = useMemo(() => {
    const totalBOMs = headers.length;
    const activeBOMs = headers.filter(h => h.status === 'Active').length;
    const defaultBOMs = headers.filter(h => h.isDefaultBOM).length;
    const manufacturingBOMs = headers.filter(h => h.bomType === 'Manufacturing').length;
    const totalApprovedCost = revisions
      .filter(r => r.approvalStatus === 'Approved')
      .reduce((sum, r) => sum + (r.totalStandardCost || 0), 0);
    const avgCost = revisions.length > 0 ? (totalApprovedCost / revisions.length) : 0;
    return { totalBOMs, activeBOMs, defaultBOMs, manufacturingBOMs, avgCost };
  }, [headers, revisions]);

  // ── Quick 1-Click Status Update for Revisions ─────────────────────────────
  const handleQuickStatusChange = async (revId, newStatus) => {
    try {
      await axios.put(`/engineering/revisions/${revId}/status`, { status: newStatus });
      notify.success(`Revision status updated to ${newStatus}`);
      if (selectedHeader) fetchRevisions(selectedHeader._id, revId);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating revision status');
    }
  };

  // ── Generic Save ─────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const { type, data, editId } = modal;
    try {
      if (type === 'header') {
        if (editId) {
          await axios.put(`/engineering/bom/${editId}`, data);
          notify.success('Parts list updated successfully');
          fetchHeaders(editId);
        } else {
          const res = await axios.post('/engineering/bom', data);
          notify.success('New parts list created');
          fetchHeaders(res.data?.data?._id);
        }
      } else if (type === 'revision') {
        if (editId) {
          await axios.put(`/engineering/revisions/${editId}/status`, {
            status: data.approvalStatus
          });
          notify.success('Revision status updated');
        } else {
          const res = await axios.post(`/engineering/bom/${selectedHeader._id}/revisions`, {
            ...data,
            bomId: selectedHeader._id
          });
          notify.success('New revision created');
          fetchRevisions(selectedHeader._id, res.data?.data?._id);
          return;
        }
        fetchRevisions(selectedHeader._id, editId);
      } else if (type === 'component') {
        const payload = {
          ...data,
          revisionId: selectedRevision._id
        };
        if (editId) {
          await axios.put(`/engineering/components/${editId}`, payload);
          notify.success('Component updated');
          fetchComponents(selectedRevision._id, editId);
        } else {
          const res = await axios.post(`/engineering/revisions/${selectedRevision._id}/components`, payload);
          notify.success('Component added');
          fetchComponents(selectedRevision._id, res.data?.data?._id);
        }
      } else if (type === 'substitute') {
        const payload = {
          ...data,
          primaryComponentId: selectedComponent._id
        };
        if (editId) {
          await axios.put(`/engineering/substitutes/${editId}`, payload);
          notify.success('Approved substitute updated');
        } else {
          await axios.post(`/engineering/components/${selectedComponent._id}/substitutes`, payload);
          notify.success('Approved substitute added');
        }
        fetchSubstitutes(selectedComponent._id);
      } else if (type === 'oplink') {
        const payload = {
          ...data,
          componentId: selectedComponent._id
        };
        if (editId) {
          await axios.put(`/engineering/operation-links/${editId}`, payload);
          notify.success('Operation step link updated');
        } else {
          await axios.post(`/engineering/components/${selectedComponent._id}/operation-links`, payload);
          notify.success('Operation step linked');
        }
        fetchOpLinks(selectedComponent._id);
      }
      setModal({ type: null, data: null, editId: null });
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Error saving record');
    }
  };

  // ── Generic Delete ───────────────────────────────────────────────────────
  const handleDelete = async (type, id) => {
    if (!await confirmAction(`Delete this ${type}? This action cannot be undone.`)) return;
    try {
      if (type === 'component') {
        await axios.delete(`/engineering/components/${id}`);
        notify.success('Component removed from BOM');
        fetchComponents(selectedRevision._id);
      } else if (type === 'substitute') {
        await axios.delete(`/engineering/substitutes/${id}`);
        notify.success('Substitute material removed');
        fetchSubstitutes(selectedComponent._id);
      } else if (type === 'oplink') {
        await axios.delete(`/engineering/operation-links/${id}`);
        notify.success('Process operation linkage removed');
        fetchOpLinks(selectedComponent._id);
      }
    } catch (err) {
      notify.error(err.response?.data?.message || `Error deleting ${type}`);
    }
  };

  // ── Auto-Generate BOM Code ────────────────────────────────────────────────
  const generateBOMCode = () => {
    return 'BOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // ── Modal Open / Close Helpers ───────────────────────────────────────────
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
      data: { ...m.data, [field]: value }
    }));
  };

  // ── Export BOM to CSV ────────────────────────────────────────────────────
  const exportBOMCSV = () => {
    if (!selectedHeader || components.length === 0) {
      notify.info('No component records available to export for this assembly');
      return;
    }
    const headersCsv = ['Step Seq', 'Component Code', 'Component Name', 'Type', 'Quantity', 'UOM', 'Scrap %', 'Issue Method', 'Cost Relevant', 'Lead Time Days'];
    const rows = components.map(c => [
      c.lineSequenceNumber,
      c.materialId?.code || c.productId?.code || '',
      `"${(c.materialId?.name || c.productId?.name || '').replace(/"/g, '""')}"`,
      c.componentType,
      c.quantityPerAssembly,
      c.uomId?.symbol || '',
      `${c.scrapYieldPercentage || 0}%`,
      c.issueMethod,
      c.costingRelevancy ? 'Yes' : 'No',
      c.leadTimeOffsetDays || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headersCsv.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedHeader.bomCode}_Components_Explosion.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('BOM Component specification exported to CSV');
  };

  // ── Sample Automotive Enrichment ─────────────────────────────────────────
  const calibrateSampleBOM = async () => {
    if (!selectedHeader || !selectedRevision) {
      notify.info('Select a parts list and revision to calibrate');
      return;
    }
    try {
      setBusy(true);
      // If no components exist or to enrich: check if we have materials
      if (materials.length === 0) {
        notify.info('No raw materials found in Master Data to attach');
        setBusy(false);
        return;
      }
      const existingComp = components[0];
      if (existingComp && substitutes.length === 0 && materials.length > 1) {
        // Add sample substitute
        const altMat = materials.find(m => m._id !== existingComp.materialId?._id) || materials[0];
        await axios.post(`/engineering/components/${existingComp._id}/substitutes`, {
          primaryComponentId: existingComp._id,
          substituteMaterialId: altMat._id,
          conversionFactor: 1.0,
          priorityRank: 1,
          validFromDate: new Date().toISOString().split('T')[0],
          isActive: true
        });
        fetchSubstitutes(existingComp._id);
      }

      if (existingComp && opLinks.length === 0 && routings.length > 0 && workCenters.length > 0) {
        // Add sample operation link
        await axios.post(`/engineering/components/${existingComp._id}/operation-links`, {
          componentId: existingComp._id,
          routingId: routings[0]._id,
          operationSequence: 10,
          workCenterId: workCenters[0]._id
        });
        fetchOpLinks(existingComp._id);
      }

      notify.success('Assembly calibration complete: verified revision & component associations');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error calibrating BOM sample data');
    } finally {
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: 14,
      overflow: 'hidden'
    }}>

      {/* ── 1. BLUEPRINT HERO HEADER & TELEMETRY ──────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${BP.navyDark} 0%, ${BP.navyMid} 55%, ${BP.navyBlue} 100%)`,
        borderRadius: 10,
        padding: '16px 20px',
        color: '#ffffff',
        border: `1px solid rgba(56, 189, 248, 0.25)`,
        boxShadow: '0 4px 18px rgba(3, 20, 36, 0.45)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle CAD Blueprint Grid Accent */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: BP.gridBg,
          backgroundSize: '16px 16px',
          opacity: 0.7,
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                borderRadius: 8,
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                color: BP.cyanLight
              }}>
                <Compass size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#fff' }}>
                    Parts Lists (BOM) — Engineering CAD Studio
                  </h1>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(132, 204, 22, 0.22)',
                    color: BP.limeLight,
                    border: `1px solid rgba(163, 230, 53, 0.45)`,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}>
                    CAD Wireframe Active
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
                  Multi-level automotive bill of materials, engineering revision effectivity, scrap yield allowances, and shop-floor routing step associations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={calibrateSampleBOM}
              disabled={busy || !selectedHeader}
              className="btn btn-secondary"
              style={{
                fontSize: 12,
                padding: '6px 12px',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#e2e8f0',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Calibrate sample component substitutes and operation links"
            >
              <Sparkles size={13} color={BP.cyanLight} />
              <span>Calibrate BOM</span>
            </button>

            <button
              onClick={exportBOMCSV}
              disabled={!selectedHeader || components.length === 0}
              className="btn btn-secondary"
              style={{
                fontSize: 12,
                padding: '6px 12px',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#e2e8f0',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => openModal('header', {
                bomCode: generateBOMCode(),
                bomType: 'Manufacturing',
                baseQuantity: 1,
                isDefaultBOM: false,
                status: 'Active'
              })}
              className="btn btn-primary"
              style={{
                fontSize: 12,
                padding: '6px 14px',
                background: `linear-gradient(135deg, ${BP.laserLime} 0%, #4d7c0f 100%)`,
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(132, 204, 22, 0.35)'
              }}
            >
              <Plus size={14} /> Add Parts List
            </button>
          </div>
        </div>

        {/* CAD Telemetry KPI Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid rgba(56, 189, 248, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: 8, borderRadius: 6, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              <Layers size={16} color={BP.cyanLight} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Configured Assemblies</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>
                {telemetry.totalBOMs} <span style={{ fontSize: 11, fontWeight: 400, color: BP.limeLight }}>({telemetry.activeBOMs} Active)</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(132, 204, 22, 0.1)', padding: 8, borderRadius: 6, border: '1px solid rgba(132, 204, 22, 0.25)' }}>
              <CheckCircle2 size={16} color={BP.limeLight} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Default Parts Lists</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>
                {telemetry.defaultBOMs} Assemblies
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: 8, borderRadius: 6, border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <GitBranch size={16} color={BP.amber} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Revisions</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>
                {revisions.length} <span style={{ fontSize: 11, fontWeight: 400, color: '#cbd5e1' }}>in selected</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: 8, borderRadius: 6, border: '1px solid rgba(14, 165, 233, 0.25)' }}>
              <Cpu size={16} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Components Exploded</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>
                {components.length} <span style={{ fontSize: 11, fontWeight: 400, color: BP.limeLight }}>in Rev {selectedRevision?.revisionCode || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN CAD WORKSPACE (MASTER-DETAIL DUAL PANE) ──────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '360px minmax(0, 1fr)',
        gap: 14,
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>

        {/* ── LEFT PANE: BOM ASSEMBLY REGISTRY & SEARCH ───────────────────── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {/* Header Bar */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--surface-canvas)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={15} color="var(--accent-primary)" />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Assembly Registry</span>
            </div>
            <span style={{
              fontSize: 11,
              background: 'var(--bg-primary)',
              padding: '2px 8px',
              borderRadius: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}>
              {filteredHeaders.length} of {headers.length}
            </span>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search BOM code, assembly, part..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 30px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: 2
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {['All', 'Manufacturing', 'Engineering', 'Costing'].map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    border: '1px solid',
                    borderColor: typeFilter === t ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: typeFilter === t ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-primary)',
                    color: typeFilter === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: typeFilter === t ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Plant & Status sub-filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <select
                value={plantFilter}
                onChange={e => setPlantFilter(e.target.value)}
                style={{
                  padding: '4px 6px',
                  fontSize: 11,
                  borderRadius: 4,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="All">All Plants</option>
                {plants.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: '4px 6px',
                  fontSize: 11,
                  borderRadius: 4,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive</option>
                <option value="Obsolete">Obsolete</option>
              </select>
            </div>
          </div>

          {/* BOM Cards List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
                <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                Loading parts lists...
              </div>
            ) : filteredHeaders.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
                <Layers size={24} style={{ opacity: 0.4, margin: '0 auto 8px', display: 'block' }} />
                No parts lists found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredHeaders.map(bom => {
                  const isSelected = selectedHeaderId === bom._id;
                  return (
                    <div
                      key={bom._id}
                      onClick={() => selectHeader(bom)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isSelected ? BP.cobalt : 'var(--border-color)',
                        background: isSelected ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-primary)',
                        position: 'relative',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Left vertical indicator line */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          background: BP.laserLime,
                          borderRadius: '6px 0 0 6px'
                        }} />
                      )}

                      {/* Header row: code & badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: 12,
                          color: isSelected ? BP.cobalt : 'var(--text-primary)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-secondary)',
                          padding: '1px 6px',
                          borderRadius: 4
                        }}>
                          {bom.bomCode}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {bom.isDefaultBOM && (
                            <span style={{
                              fontSize: 10,
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: BP.amber,
                              padding: '1px 5px',
                              borderRadius: 4,
                              fontWeight: 600
                            }}>
                              Default
                            </span>
                          )}
                          <StatusBadge value={bom.status} />
                        </div>
                      </div>

                      {/* BOM Name */}
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {bom.bomName}
                      </div>

                      {/* Finished Part info */}
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Box size={11} color="var(--accent-primary)" />
                        <span>Part: <strong>{bom.productId?.name || 'Unassigned Product'}</strong></span>
                      </div>

                      {/* Footer specs row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        paddingTop: 4,
                        borderTop: '1px dashed var(--border-color)'
                      }}>
                        <span>{bom.plantId?.name || 'Standard Plant'}</span>
                        <span>Base: <strong>{bom.baseQuantity} {bom.uomId?.symbol || 'ea'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: ENGINEERING CAD WORKBENCH STUDIO ────────────────── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {selectedHeader ? (
            <>
              {/* Assembly Header Hero Strip */}
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--surface-canvas)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: 13,
                      background: 'rgba(2, 132, 199, 0.12)',
                      color: BP.cobalt,
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid rgba(2, 132, 199, 0.25)'
                    }}>
                      {selectedHeader.bomCode}
                    </span>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {selectedHeader.bomName}
                    </h2>
                    <StatusBadge value={selectedHeader.status} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span>Part: <strong style={{ color: 'var(--text-primary)' }}>{selectedHeader.productId?.name} ({selectedHeader.productId?.code})</strong></span>
                    <span>•</span>
                    <span>Plant: <strong>{selectedHeader.plantId?.name}</strong></span>
                    <span>•</span>
                    <span>Type: <strong>{selectedHeader.bomType}</strong></span>
                    <span>•</span>
                    <span>Base Qty: <strong>{selectedHeader.baseQuantity} {selectedHeader.uomId?.symbol || 'ea'}</strong></span>
                  </div>
                </div>

                {/* Header Edit & Print Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => openModal('header', {
                      ...selectedHeader,
                      productId: selectedHeader.productId?._id || selectedHeader.productId,
                      plantId: selectedHeader.plantId?._id || selectedHeader.plantId,
                      uomId: selectedHeader.uomId?._id || selectedHeader.uomId,
                      defaultRoutingId: selectedHeader.defaultRoutingId?._id || selectedHeader.defaultRoutingId
                    }, selectedHeader._id)}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <Edit2 size={12} /> Edit Header
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                    title="Print engineering spec sheet"
                  >
                    <Printer size={12} /> Print
                  </button>
                </div>
              </div>

              {/* Revisions Ribbon Bar */}
              <div style={{
                padding: '10px 18px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <GitBranch size={14} color="var(--accent-primary)" />
                    <span>Revisions:</span>
                  </div>

                  {revisions.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--status-caution-fg)' }}>No revisions yet. Create v1.0 below.</span>
                  ) : (
                    revisions.map(rev => {
                      const isRevSelected = selectedRevisionId === rev._id;
                      return (
                        <div
                          key={rev._id}
                          onClick={() => selectRevision(rev)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: isRevSelected ? 600 : 400,
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: isRevSelected ? BP.cobalt : 'var(--border-color)',
                            background: isRevSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-secondary)',
                            color: isRevSelected ? BP.cobalt : 'var(--text-primary)'
                          }}
                        >
                          <span>{rev.revisionCode}</span>
                          <span style={{
                            fontSize: 10,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: rev.approvalStatus === 'Approved' ? 'rgba(132, 204, 22, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                            color: rev.approvalStatus === 'Approved' ? '#65a30d' : 'var(--text-secondary)',
                            fontWeight: 600
                          }}>
                            {rev.approvalStatus}
                          </span>
                          {rev.totalStandardCost > 0 && (
                            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                              ({fmtMoneyFull(rev.totalStandardCost)})
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}

                  <button
                    onClick={() => openModal('revision', {
                      bomId: selectedHeader._id,
                      revisionCode: `v1.${revisions.length}`,
                      validFromDate: new Date().toISOString().split('T')[0],
                      approvalStatus: 'Draft',
                      totalStandardCost: 0
                    })}
                    className="btn btn-secondary"
                    style={{
                      fontSize: 11,
                      padding: '3px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={11} /> New Rev
                  </button>
                </div>

                {/* Active Revision Status Transition Stepper */}
                {selectedRevision && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Quick Status:</span>
                    <select
                      value={selectedRevision.approvalStatus}
                      onChange={e => handleQuickStatusChange(selectedRevision._id, e.target.value)}
                      style={{
                        padding: '3px 8px',
                        fontSize: 12,
                        borderRadius: 4,
                        border: '1px solid var(--border-color)',
                        background: selectedRevision.approvalStatus === 'Approved' ? 'rgba(132, 204, 22, 0.15)' : 'var(--bg-secondary)',
                        color: selectedRevision.approvalStatus === 'Approved' ? '#4d7c0f' : 'var(--text-primary)',
                        fontWeight: 600
                      }}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Pending">Pending Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Obsolete">Obsolete</option>
                    </select>

                    {selectedRevision.ecoNumber && (
                      <span style={{
                        fontSize: 11,
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: BP.cobalt,
                        padding: '2px 8px',
                        borderRadius: 4,
                        border: '1px solid rgba(56, 189, 248, 0.3)'
                      }}>
                        ECO: {selectedRevision.ecoNumber?.changeNumber || 'Attached'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Segmented CAD Workbench Navigation Tabs */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                padding: '0 16px',
                gap: 4
              }}>
                {[
                  { id: 'components', label: 'Components (BOM)', icon: Layers, badge: components.length },
                  { id: 'substitutes', label: 'Approved Substitutes', icon: RefreshCw, badge: substitutes.length },
                  { id: 'oplinks', label: 'Routing Step Links', icon: Link2, badge: opLinks.length },
                  { id: 'calculator', label: 'Batch Material Calculator', icon: Calculator },
                  { id: 'specs', label: 'Engineering Specs', icon: FileText }
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
                        fontWeight: isActive ? 600 : 500,
                        borderBottom: isActive ? `2px solid ${BP.cobalt}` : '2px solid transparent',
                        color: isActive ? BP.cobalt : 'var(--text-secondary)',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                      {tab.badge !== undefined && (
                        <span style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 999,
                          background: isActive ? 'rgba(2, 132, 199, 0.18)' : 'var(--bg-primary)',
                          color: isActive ? BP.cobalt : 'var(--text-secondary)',
                          fontWeight: 700
                        }}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Canvas */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg-primary)' }}>

                {/* ── TAB 1: COMPONENTS (CORE BOM BREAKDOWN) ────────────────── */}
                {activeTab === 'components' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Controls row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ position: 'relative', width: 260 }}>
                          <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input
                            type="text"
                            placeholder="Filter components..."
                            value={componentSearch}
                            onChange={e => setComponentSearch(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px 5px 26px',
                              fontSize: 12,
                              borderRadius: 4,
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Showing {filteredComponents.length} of {components.length} components
                        </span>
                      </div>

                      <button
                        onClick={() => openModal('component', {
                          lineSequenceNumber: (components.length + 1) * 10,
                          componentType: 'Standard',
                          issueMethod: 'Manual Pick',
                          quantityPerAssembly: 1,
                          scrapYieldPercentage: 0,
                          costingRelevancy: true,
                          leadTimeOffsetDays: 0
                        })}
                        className="btn btn-primary"
                        style={{
                          fontSize: 12,
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Plus size={13} /> Add Component
                      </button>
                    </div>

                    {/* Components Table */}
                    <div style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: 'var(--bg-secondary)'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px', width: 60 }}>Step</th>
                            <th style={{ padding: '8px 10px' }}>Material / Sub-Assembly</th>
                            <th style={{ padding: '8px 10px' }}>Type</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty / Assembly</th>
                            <th style={{ padding: '8px 10px' }}>Unit</th>
                            <th style={{ padding: '8px 10px' }}>Scrap (%)</th>
                            <th style={{ padding: '8px 10px' }}>Issue Method</th>
                            <th style={{ padding: '8px 10px' }}>Costed?</th>
                            <th style={{ padding: '8px 10px' }}>Lead Time</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>Alternates</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredComponents.length === 0 ? (
                            <tr>
                              <td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                {components.length === 0 
                                  ? 'No components in this revision yet. Click "Add Component" above or "Calibrate BOM" to generate realistic parts.'
                                  : 'No matching components found.'}
                              </td>
                            </tr>
                          ) : (
                            filteredComponents.map(comp => {
                              const isCompSelected = selectedComponentId === comp._id;
                              const isRawMat = !!comp.materialId;
                              const itemName = comp.materialId?.name || comp.productId?.name || '—';
                              const itemCode = comp.materialId?.code || comp.productId?.code || '';
                              return (
                                <tr
                                  key={comp._id}
                                  onClick={() => selectComponent(comp)}
                                  style={{
                                    borderBottom: '1px solid var(--border-color)',
                                    background: isCompSelected ? 'rgba(2, 132, 199, 0.07)' : 'transparent',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {/* Step No */}
                                  <td style={{ padding: '8px 10px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                                    #{comp.lineSequenceNumber}
                                  </td>

                                  {/* Item Details */}
                                  <td style={{ padding: '8px 10px' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{itemName}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '1px 4px', borderRadius: 3 }}>
                                        {itemCode}
                                      </span>
                                      <span style={{ fontSize: 10, color: isRawMat ? '#0284c7' : '#8b5cf6' }}>
                                        {isRawMat ? 'Raw Material' : 'Sub-Assembly'}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Component Type */}
                                  <td style={{ padding: '8px 10px' }}>
                                    <span style={{
                                      fontSize: 11,
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                      background: comp.componentType === 'Phantom' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-primary)',
                                      color: comp.componentType === 'Phantom' ? '#ef4444' : 'var(--text-secondary)'
                                    }}>
                                      {comp.componentType}
                                    </span>
                                  </td>

                                  {/* Quantity */}
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>
                                    {comp.quantityPerAssembly?.toFixed(4)}
                                  </td>

                                  {/* Unit */}
                                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                                    {comp.uomId?.symbol || 'ea'}
                                  </td>

                                  {/* Scrap */}
                                  <td style={{ padding: '8px 10px' }}>
                                    {comp.scrapYieldPercentage > 0 ? (
                                      <span style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: BP.amber,
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        padding: '1px 6px',
                                        borderRadius: 4
                                      }}>
                                        {comp.scrapYieldPercentage}%
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--text-secondary)' }}>0%</span>
                                    )}
                                  </td>

                                  {/* Issue Method */}
                                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                                    {comp.issueMethod}
                                  </td>

                                  {/* Costed */}
                                  <td style={{ padding: '8px 10px' }}>
                                    {comp.costingRelevancy ? (
                                      <Check size={14} color="#16a34a" />
                                    ) : (
                                      <span style={{ color: 'var(--text-secondary)' }}>—</span>
                                    )}
                                  </td>

                                  {/* Lead Time */}
                                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                                    {comp.leadTimeOffsetDays ? `${comp.leadTimeOffsetDays} d` : '0 d'}
                                  </td>

                                  {/* Alternates Badge */}
                                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectComponent(comp);
                                        setActiveTab('substitutes');
                                      }}
                                      style={{
                                        background: 'none',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 4,
                                        padding: '2px 6px',
                                        fontSize: 10,
                                        cursor: 'pointer',
                                        color: isCompSelected ? BP.cobalt : 'var(--text-secondary)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3
                                      }}
                                      title="Inspect approved substitutes"
                                    >
                                      <RefreshCw size={10} /> Subs
                                    </button>
                                  </td>

                                  {/* Row Actions */}
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openModal('component', {
                                            ...comp,
                                            materialId: comp.materialId?._id || comp.materialId,
                                            productId: comp.productId?._id || comp.productId,
                                            uomId: comp.uomId?._id || comp.uomId
                                          }, comp._id);
                                        }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: 4 }}
                                        title="Edit component"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete('component', comp._id);
                                        }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: 4 }}
                                        title="Delete component"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: APPROVED SUBSTITUTES ───────────────────────────── */}
                {activeTab === 'substitutes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Guidance Alert */}
                    <div style={{
                      padding: '10px 14px',
                      background: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid rgba(2, 132, 199, 0.25)',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <RefreshCw size={16} color={BP.cobalt} />
                      <div>
                        <strong>Approved Substitutes Module:</strong> Alternative raw materials permitted by Engineering when the primary component is out of stock. Conversion factors and priority ranks guide automated work-order staging.
                      </div>
                    </div>

                    {/* Component Selector Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-secondary)',
                      padding: '10px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Active Primary Component:</span>
                        <select
                          value={selectedComponentId || ''}
                          onChange={e => {
                            const c = components.find(item => item._id === e.target.value);
                            if (c) selectComponent(c);
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: 12,
                            borderRadius: 4,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            minWidth: 260
                          }}
                        >
                          {components.map(c => (
                            <option key={c._id} value={c._id}>
                              #{c.lineSequenceNumber}: {c.materialId?.name || c.productId?.name} ({c.materialId?.code || c.productId?.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => openModal('substitute', {
                          conversionFactor: 1,
                          priorityRank: (substitutes.length + 1),
                          isActive: true,
                          validFromDate: new Date().toISOString().split('T')[0]
                        })}
                        disabled={!selectedComponent}
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <Plus size={13} /> Add Substitute
                      </button>
                    </div>

                    {/* Substitutes Table */}
                    <div style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: 'var(--bg-secondary)'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px' }}>Priority</th>
                            <th style={{ padding: '8px 10px' }}>Substitute Raw Material</th>
                            <th style={{ padding: '8px 10px' }}>Conversion Factor</th>
                            <th style={{ padding: '8px 10px' }}>Valid From</th>
                            <th style={{ padding: '8px 10px' }}>Valid To</th>
                            <th style={{ padding: '8px 10px' }}>Status</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {substitutes.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No approved substitutes configured for this component. Click "Add Substitute" to define alternative materials.
                              </td>
                            </tr>
                          ) : (
                            substitutes.map(sub => (
                              <tr key={sub._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                  Rank #{sub.priorityRank}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {sub.substituteMaterialId?.name || '—'}
                                  </div>
                                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                    {sub.substituteMaterialId?.code}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>
                                  1 Primary = {sub.conversionFactor} Substitute
                                </td>
                                <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                                  {sub.validFromDate ? new Date(sub.validFromDate).toLocaleDateString() : '—'}
                                </td>
                                <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                                  {sub.validToDate ? new Date(sub.validToDate).toLocaleDateString() : 'Indefinite'}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  {sub.isActive ? (
                                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Active</span>
                                  ) : (
                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Inactive</span>
                                  )}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                    <button
                                      onClick={() => openModal('substitute', {
                                        ...sub,
                                        substituteMaterialId: sub.substituteMaterialId?._id || sub.substituteMaterialId
                                      }, sub._id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: 4 }}
                                      title="Edit substitute"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete('substitute', sub._id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: 4 }}
                                      title="Delete substitute"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: OPERATION STEP LINKS ───────────────────────────── */}
                {activeTab === 'oplinks' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Guidance Alert */}
                    <div style={{
                      padding: '10px 14px',
                      background: 'rgba(132, 204, 22, 0.08)',
                      border: '1px solid rgba(132, 204, 22, 0.25)',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <Link2 size={16} color="#65a30d" />
                      <div>
                        <strong>Routing Linkage Matrix:</strong> Associating component materials directly with manufacturing operations ensures materials are issued to the exact work center only when that specific operation step is queued.
                      </div>
                    </div>

                    {/* Active Component Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-secondary)',
                      padding: '10px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Active Component:</span>
                        <select
                          value={selectedComponentId || ''}
                          onChange={e => {
                            const c = components.find(item => item._id === e.target.value);
                            if (c) selectComponent(c);
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: 12,
                            borderRadius: 4,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            minWidth: 260
                          }}
                        >
                          {components.map(c => (
                            <option key={c._id} value={c._id}>
                              #{c.lineSequenceNumber}: {c.materialId?.name || c.productId?.name} ({c.materialId?.code || c.productId?.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => openModal('oplink', {
                          operationSequence: 10,
                          routingId: selectedHeader?.defaultRoutingId?._id || routings[0]?._id,
                          workCenterId: workCenters[0]?._id
                        })}
                        disabled={!selectedComponent}
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <Plus size={13} /> Link Process Operation
                      </button>
                    </div>

                    {/* Operation Links Table */}
                    <div style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: 'var(--bg-secondary)'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px' }}>Operation Step #</th>
                            <th style={{ padding: '8px 10px' }}>Process Sheet (Routing)</th>
                            <th style={{ padding: '8px 10px' }}>Assigned Work Centre Cell</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {opLinks.length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No shop floor operations linked to this component yet. Click "Link Process Operation" above.
                              </td>
                            </tr>
                          ) : (
                            opLinks.map(link => (
                              <tr key={link._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                                  Step {link.operationSequence}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {link.routingId?.routingNumber || 'Standard Process Sheet'}
                                  </div>
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {link.workCenterId?.name || '—'}
                                  </div>
                                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                    {link.workCenterId?.code}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                    <button
                                      onClick={() => openModal('oplink', {
                                        ...link,
                                        routingId: link.routingId?._id || link.routingId,
                                        workCenterId: link.workCenterId?._id || link.workCenterId
                                      }, link._id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: 4 }}
                                      title="Edit link"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete('oplink', link._id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: 4 }}
                                      title="Delete link"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: BATCH MATERIAL EXPLOSION CALCULATOR ─────────────── */}
                {activeTab === 'calculator' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Calculator Control Banner */}
                    <div style={{
                      padding: '16px 20px',
                      background: 'var(--surface-canvas)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 14
                    }}>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          BOM Explosion & Material Demand Simulator
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          Model required raw material issue quantities, scrap allowances, and standard unit costs for any planned production lot size.
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Planned Production Run:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={batchQuantity}
                            onChange={e => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{
                              width: 110,
                              padding: '6px 10px',
                              fontSize: 13,
                              fontWeight: 700,
                              borderRadius: 4,
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              textAlign: 'right'
                            }}
                          />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {selectedHeader.uomId?.symbol || 'ea'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Exploded Material Table */}
                    <div style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: 'var(--bg-secondary)'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px' }}>Step</th>
                            <th style={{ padding: '8px 10px' }}>Component Item</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Base Qty</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Net Batch Demand</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Scrap Allowance</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Gross Store Requisition</th>
                            <th style={{ padding: '8px 10px' }}>Unit</th>
                            <th style={{ padding: '8px 10px' }}>Issue Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {components.length === 0 ? (
                            <tr>
                              <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No component items in this assembly to explode.
                              </td>
                            </tr>
                          ) : (
                            components.map(comp => {
                              const unitQty = comp.quantityPerAssembly || 0;
                              const netDemand = unitQty * batchQuantity;
                              const scrapPct = comp.scrapYieldPercentage || 0;
                              const scrapBuffer = netDemand * (scrapPct / 100);
                              const grossRequisition = netDemand + scrapBuffer;
                              return (
                                <tr key={comp._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                    #{comp.lineSequenceNumber}
                                  </td>
                                  <td style={{ padding: '8px 10px' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                      {comp.materialId?.name || comp.productId?.name}
                                    </div>
                                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                      {comp.materialId?.code || comp.productId?.code}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                                    {unitQty.toFixed(4)}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                    {netDemand.toFixed(2)}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: scrapPct > 0 ? BP.amber : 'inherit' }}>
                                    +{scrapBuffer.toFixed(2)} ({scrapPct}%)
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: BP.cobalt }}>
                                    {grossRequisition.toFixed(2)}
                                  </td>
                                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                                    {comp.uomId?.symbol || 'ea'}
                                  </td>
                                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                                    {comp.issueMethod}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TAB 5: ENGINEERING SPECS & AUDIT ─────────────────────── */}
                {activeTab === 'specs' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    <div style={{
                      padding: 16,
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--border-color)', paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Compass size={15} color={BP.cobalt} />
                        <span>Assembly Engineering Profile</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>BOM Identifier:</span>
                        <strong style={{ fontFamily: 'monospace' }}>{selectedHeader.bomCode}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Assembly Type:</span>
                        <strong>{selectedHeader.bomType}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Designated Plant:</span>
                        <strong>{selectedHeader.plantId?.name || 'Default Facility'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Base Assembly Unit:</span>
                        <strong>{selectedHeader.baseQuantity} {selectedHeader.uomId?.symbol}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Default BOM Flag:</span>
                        <strong>{selectedHeader.isDefaultBOM ? 'Yes (Primary)' : 'No'}</strong>
                      </div>
                    </div>

                    <div style={{
                      padding: 16,
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--border-color)', paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShieldCheck size={15} color="#16a34a" />
                        <span>Revision Governance & Effectivity</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Active Revision:</span>
                        <strong>{selectedRevision?.revisionCode || 'None'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Approval State:</span>
                        <StatusBadge value={selectedRevision?.approvalStatus || 'Draft'} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Valid From Date:</span>
                        <span>{selectedRevision?.validFromDate ? new Date(selectedRevision.validFromDate).toLocaleDateString() : '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Valid To Date:</span>
                        <span>{selectedRevision?.validToDate ? new Date(selectedRevision.validToDate).toLocaleDateString() : 'Indefinite'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Rolled-up Standard Cost:</span>
                        <strong style={{ color: BP.cobalt }}>{fmtMoneyFull(selectedRevision?.totalStandardCost || 0)}</strong>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', padding: 32 }}>
              <Compass size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Select an Assembly from the Registry</h3>
              <p style={{ fontSize: 12, margin: '4px 0 0' }}>Click any parts list card on the left to inspect its revision hierarchy, component trees, and process links.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODALS: 100% COVERAGE FOR ALL 5 DATA ENTITIES                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* ── MODAL 1: BOM HEADER MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={modal.type === 'header'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Parts List (BOM) Header' : 'Create New Parts List (BOM)'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Parts List Code *</label>
              <input
                className="input-field"
                required
                readOnly={!!modal.editId}
                value={modal.data?.bomCode || ''}
                onChange={e => updateField('bomCode', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Parts List Name *</label>
              <input
                className="input-field"
                required
                placeholder="e.g. Fuel Tank Mounting Bracket — Manufacturing BOM"
                value={modal.data?.bomName || ''}
                onChange={e => updateField('bomName', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Finished Product *</label>
              <select
                className="input-field"
                required
                value={modal.data?.productId || ''}
                onChange={e => updateField('productId', e.target.value)}
              >
                <option value="" disabled>Choose a finished product</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Manufacturing Plant *</label>
              <select
                className="input-field"
                required
                value={modal.data?.plantId || ''}
                onChange={e => updateField('plantId', e.target.value)}
              >
                <option value="" disabled>Choose a plant</option>
                {plants.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">BOM Category / Type *</label>
              <select
                className="input-field"
                required
                value={modal.data?.bomType || 'Manufacturing'}
                onChange={e => updateField('bomType', e.target.value)}
              >
                {['Manufacturing', 'Engineering', 'Costing'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Base Quantity *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0.0001"
                step="any"
                value={modal.data?.baseQuantity || 1}
                onChange={e => updateField('baseQuantity', parseFloat(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Unit of Measure (UOM) *</label>
              <select
                className="input-field"
                required
                value={modal.data?.uomId || ''}
                onChange={e => updateField('uomId', e.target.value)}
              >
                <option value="" disabled>Choose an assembly unit</option>
                {uoms.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.symbol})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Default Process Sheet (Routing)</label>
              <select
                className="input-field"
                value={modal.data?.defaultRoutingId || ''}
                onChange={e => updateField('defaultRoutingId', e.target.value)}
              >
                <option value="">None / Unlinked</option>
                {routings.map(r => (
                  <option key={r._id} value={r._id}>{r.routingNumber}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Status</label>
              <select
                className="input-field"
                value={modal.data?.status || 'Active'}
                onChange={e => updateField('status', e.target.value)}
              >
                {['Active', 'Inactive', 'Obsolete'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input
                type="checkbox"
                id="isDefaultBOM"
                checked={!!modal.data?.isDefaultBOM}
                onChange={e => updateField('isDefaultBOM', e.target.checked)}
              />
              <label htmlFor="isDefaultBOM" className="input-label" style={{ margin: 0, cursor: 'pointer' }}>
                Set as Default Parts List for this part
              </label>
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
              {busy ? 'Saving...' : (modal.editId ? 'Update Parts List' : 'Create Parts List')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: BOM REVISION MODAL ───────────────────────────────────── */}
      <Modal
        isOpen={modal.type === 'revision'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Update Revision Approval Status' : 'Add Assembly Revision'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          {modal.editId ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Revision Code</label>
                <input className="input-field" readOnly value={modal.data?.revisionCode || ''} />
              </div>
              <div className="input-group">
                <label className="input-label">Approval Status *</label>
                <select
                  className="input-field"
                  required
                  value={modal.data?.approvalStatus || 'Draft'}
                  onChange={e => updateField('approvalStatus', e.target.value)}
                >
                  {['Draft', 'Pending', 'Approved', 'Obsolete'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Revision Code * (e.g. v1.0, v2.0)</label>
                <input
                  className="input-field"
                  required
                  placeholder="v1.0"
                  value={modal.data?.revisionCode || ''}
                  onChange={e => updateField('revisionCode', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Engineering Change Request (ECO)</label>
                <select
                  className="input-field"
                  value={modal.data?.ecoNumber || ''}
                  onChange={e => updateField('ecoNumber', e.target.value)}
                >
                  <option value="">None / Initial Release</option>
                  {ecmList.map(e => (
                    <option key={e._id} value={e._id}>{e.changeNumber || e._id}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Valid From Date *</label>
                <input
                  type="date"
                  className="input-field"
                  required
                  value={modal.data?.validFromDate ? modal.data.validFromDate.split('T')[0] : ''}
                  onChange={e => updateField('validFromDate', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Valid To Date (Optional)</label>
                <input
                  type="date"
                  className="input-field"
                  value={modal.data?.validToDate ? modal.data.validToDate.split('T')[0] : ''}
                  onChange={e => updateField('validToDate', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Total Standard Cost (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  min="0"
                  step="any"
                  value={modal.data?.totalStandardCost || 0}
                  onChange={e => updateField('totalStandardCost', parseFloat(e.target.value))}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Initial Approval Status</label>
                <select
                  className="input-field"
                  value={modal.data?.approvalStatus || 'Draft'}
                  onChange={e => updateField('approvalStatus', e.target.value)}
                >
                  {['Draft', 'Pending', 'Approved', 'Obsolete'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModal({ type: null, data: null, editId: null })}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : (modal.editId ? 'Update Status' : 'Create Revision')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 3: BOM COMPONENT MODAL ──────────────────────────────────── */}
      <Modal
        isOpen={modal.type === 'component'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit BOM Component Item' : 'Add Component Item to Revision'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Step Sequence Number * (10, 20...)</label>
              <input
                type="number"
                className="input-field"
                required
                min="1"
                step="1"
                value={modal.data?.lineSequenceNumber || ''}
                onChange={e => updateField('lineSequenceNumber', parseInt(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Component Classification *</label>
              <select
                className="input-field"
                required
                value={modal.data?.componentType || 'Standard'}
                onChange={e => updateField('componentType', e.target.value)}
              >
                {['Standard', 'Phantom', 'Bulk/Floor Stock'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Raw Material Component</label>
              <select
                className="input-field"
                value={modal.data?.materialId || ''}
                onChange={e => {
                  updateField('materialId', e.target.value);
                  updateField('productId', '');
                }}
              >
                <option value="">Select a raw material</option>
                {materials.map(m => (
                  <option key={m._id} value={m._id}>{m.name} ({m.code}) — {m.status || 'Active'}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">OR Sub-Assembly Product</label>
              <select
                className="input-field"
                value={modal.data?.productId || ''}
                onChange={e => {
                  updateField('productId', e.target.value);
                  updateField('materialId', '');
                }}
              >
                <option value="">Select a sub-assembly</option>
                {products.filter(p => p._id !== selectedHeader?.productId?._id).map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Quantity per Assembly * (4 decimals)</label>
              <input
                type="number"
                className="input-field"
                required
                min="0.0001"
                step="0.0001"
                value={modal.data?.quantityPerAssembly || ''}
                onChange={e => updateField('quantityPerAssembly', parseFloat(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Unit of Measure *</label>
              <select
                className="input-field"
                required
                value={modal.data?.uomId || ''}
                onChange={e => updateField('uomId', e.target.value)}
              >
                <option value="" disabled>Select unit</option>
                {uoms.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.symbol})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Scrap Yield Allowance (%)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                max="100"
                step="0.01"
                value={modal.data?.scrapYieldPercentage || 0}
                onChange={e => updateField('scrapYieldPercentage', parseFloat(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Store Issue Method *</label>
              <select
                className="input-field"
                required
                value={modal.data?.issueMethod || 'Manual Pick'}
                onChange={e => updateField('issueMethod', e.target.value)}
              >
                {['Backflush', 'Manual Pick', 'Floor Stock'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {modal.data?.componentType === 'Phantom' && modal.data?.issueMethod === 'Manual Pick' && (
                <p style={{ color: 'var(--accent-danger)', fontSize: 11, marginTop: 4 }}>
                  <AlertCircle size={10} style={{ verticalAlign: 'middle' }} /> Phantom cannot use Manual Pick
                </p>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Lead Time Offset (Days)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                value={modal.data?.leadTimeOffsetDays || 0}
                onChange={e => updateField('leadTimeOffsetDays', parseInt(e.target.value))}
              />
            </div>

            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input
                type="checkbox"
                id="costingRelevancy"
                checked={modal.data?.costingRelevancy !== false}
                onChange={e => updateField('costingRelevancy', e.target.checked)}
              />
              <label htmlFor="costingRelevancy" className="input-label" style={{ margin: 0, cursor: 'pointer' }}>
                Counted in standard product assembly costing
              </label>
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
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || (modal.data?.componentType === 'Phantom' && modal.data?.issueMethod === 'Manual Pick')}
            >
              {busy ? 'Saving...' : (modal.editId ? 'Update Component' : 'Add Component')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 4: APPROVED SUBSTITUTE MODAL ────────────────────────────── */}
      <Modal
        isOpen={modal.type === 'substitute'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Approved Substitute' : 'Add Approved Substitute Material'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Substitute Material *</label>
              <select
                className="input-field"
                required
                value={modal.data?.substituteMaterialId || ''}
                onChange={e => updateField('substituteMaterialId', e.target.value)}
              >
                <option value="" disabled>Choose alternative raw material</option>
                {materials.map(m => (
                  <option key={m._id} value={m._id}>{m.name} ({m.code})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Conversion Factor * (1 Primary = X Sub)</label>
              <input
                type="number"
                className="input-field"
                required
                min="0.0001"
                step="any"
                value={modal.data?.conversionFactor || 1}
                onChange={e => updateField('conversionFactor', parseFloat(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Priority Order Rank *</label>
              <input
                type="number"
                className="input-field"
                required
                min="1"
                value={modal.data?.priorityRank || 1}
                onChange={e => updateField('priorityRank', parseInt(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Valid From Date *</label>
              <input
                type="date"
                className="input-field"
                required
                value={modal.data?.validFromDate ? modal.data.validFromDate.split('T')[0] : ''}
                onChange={e => updateField('validFromDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Valid To Date</label>
              <input
                type="date"
                className="input-field"
                value={modal.data?.validToDate ? modal.data.validToDate.split('T')[0] : ''}
                onChange={e => updateField('validToDate', e.target.value)}
              />
            </div>

            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input
                type="checkbox"
                id="subActive"
                checked={modal.data?.isActive !== false}
                onChange={e => updateField('isActive', e.target.checked)}
              />
              <label htmlFor="subActive" className="input-label" style={{ margin: 0, cursor: 'pointer' }}>
                Active for Automatic Staging
              </label>
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
              {busy ? 'Saving...' : (modal.editId ? 'Update Substitute' : 'Add Substitute')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 5: OPERATION LINK MODAL ─────────────────────────────────── */}
      <Modal
        isOpen={modal.type === 'oplink'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Operation Link' : 'Link Component to Shop Floor Routing Step'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Process Sheet (Routing) *</label>
              <select
                className="input-field"
                required
                value={modal.data?.routingId || ''}
                onChange={e => updateField('routingId', e.target.value)}
              >
                <option value="" disabled>Choose a process sheet</option>
                {routings.map(r => (
                  <option key={r._id} value={r._id}>{r.routingNumber}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Operation Step Sequence * (10, 20...)</label>
              <input
                type="number"
                className="input-field"
                required
                min="1"
                step="1"
                value={modal.data?.operationSequence || ''}
                onChange={e => updateField('operationSequence', parseInt(e.target.value))}
              />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Work Centre Cell *</label>
              <select
                className="input-field"
                required
                value={modal.data?.workCenterId || ''}
                onChange={e => updateField('workCenterId', e.target.value)}
              >
                <option value="" disabled>Choose a work center</option>
                {workCenters.map(w => (
                  <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
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
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : (modal.editId ? 'Update Link' : 'Save Operation Link')}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default BomMaster;