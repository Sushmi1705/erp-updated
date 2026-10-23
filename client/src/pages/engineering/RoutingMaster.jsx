import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Layers, GitBranch, Wrench, Truck, AlertCircle, Plus, ChevronRight,
  ChevronDown, Edit2, Trash2, Download, Printer, Calculator, FileText,
  Check, ShieldCheck, Eye, ArrowRight, CornerDownRight, Box, Zap, Settings,
  HelpCircle, Sparkles, Compass, AlertTriangle, ArrowUpRight, BarChart2,
  CheckCircle2, X, CheckSquare, Hash, Activity, RefreshCcw, Clock,
  Gauge, Shield, Factory, Users, PlayCircle, Search, Filter, Sliders,
  RefreshCw, ArrowUp, ArrowDown, Copy, Cpu, Award, TrendingUp, QrCode,
  Flame, CheckCheck, Maximize2
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';
import RoutingCommandBar from './routing/RoutingCommandBar';
import RoutingFlowlineTab from './routing/RoutingFlowlineTab';
import RoutingTaktStudio from './routing/RoutingTaktStudio';
import RoutingTravelerTab from './routing/RoutingTravelerTab';

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMOTIVE MES & FLOWLINE STUDIO THEME (TITANIUM & ELECTRIC SLATE)
// ─────────────────────────────────────────────────────────────────────────────
const MES = {
  headerBg: 'linear-gradient(135deg, #090d16 0%, #0f172a 45%, #1e293b 100%)',
  headerBorder: 'rgba(56, 189, 248, 0.22)',
  cyanNeon: '#06b6d4',
  cyanLight: '#38bdf8',
  bluePrecision: '#2563eb',
  amberFlame: '#f59e0b',
  amberGlow: 'rgba(245, 158, 11, 0.15)',
  rubyCritical: '#f43f5e',
  rubyGlow: 'rgba(244, 63, 94, 0.15)',
  emeraldSuccess: '#10b981',
  emeraldGlow: 'rgba(16, 185, 129, 0.15)',
  violetOutside: '#8b5cf6',
  violetGlow: 'rgba(139, 92, 246, 0.15)',
  slateDark: '#0f172a',
  slateMid: '#1e293b',
  slateLight: '#334155',
  slateMuted: '#64748b',
  slateBorder: 'rgba(148, 163, 184, 0.18)',
  crimsonNeon: '#0284c7',
  crimsonLight: '#38bdf8',
  amberLight: '#fbbf24'
};
const FORGE = MES;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: ROUTING MASTER (PROCESS STEPS & FLOWLINE STUDIO)
// ─────────────────────────────────────────────────────────────────────────────
const RoutingMaster = () => {
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  // Reference master data
  const [products, setProducts] = useState([]);
  const [plants, setPlants] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [machines, setMachines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [ecmList, setEcmList] = useState([]);

  // Process sheets (Routing headers)
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Drill-down selection states
  const [selectedHeaderId, setSelectedHeaderId] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState(null);
  const [operations, setOperations] = useState([]);
  const [selectedOperationId, setSelectedOperationId] = useState(null);
  const [resources, setResources] = useState([]);
  const [subcontracting, setSubcontracting] = useState([]);

  // Search, Filters & Active Workbench Tab
  const [searchTerm, setSearchTerm] = useState('');
  const [plantFilter, setPlantFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [outsideFilter, setOutsideFilter] = useState(false);
  const [activeTab, setActiveTab] = useState('flowline'); // 'flowline' | 'takttime' | 'resources' | 'subcontracting' | 'traveler'
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'table'
  const [operationSearch, setOperationSearch] = useState('');
  const [simulatedBatchQty, setSimulatedBatchQty] = useState(500);
  const [targetTaktMinutes, setTargetTaktMinutes] = useState(35);
  const [shiftHours, setShiftHours] = useState(8);

  // Modals: 'header' | 'revision' | 'operation' | 'resource' | 'subcontracting'
  const [modal, setModal] = useState({
    type: null,
    data: null,
    editId: null
  });

  // ── Load references ───────────────────────────────────────────────────────
  const loadReferences = useCallback(async () => {
    try {
      const [p, pl, wc, m, v, ecm] = await Promise.all([
        axios.get('/master/product').catch(() => ({ data: { data: [] } })),
        axios.get('/company/plants').catch(() => ({ data: { data: [] } })),
        axios.get('/master/workcenter').catch(() => ({ data: { data: [] } })),
        axios.get('/master/machine').catch(() => ({ data: { data: [] } })),
        axios.get('/master/vendor').catch(() => ({ data: { data: [] } })),
        axios.get('/engineering/ecm').catch(() => ({ data: { data: [] } }))
      ]);
      setProducts(p.data?.data || []);
      setPlants(pl.data?.data || []);
      setWorkCenters(wc.data?.data || []);
      setMachines(m.data?.data || []);
      setVendors(v.data?.data || []);
      setEcmList(ecm.data?.data || []);
    } catch (e) {
      console.error('References load error', e);
    }
  }, []);

  // ── Fetchers ─────────────────────────────────────────────────────────────
  const fetchHeaders = async (autoSelectId = null) => {
    setLoading(true);
    try {
      const res = await axios.get('/engineering/routing');
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
        setOperations([]);
      }
    } catch (e) {
      console.error('Fetch routing headers error:', e);
      notify.error('Failed to load Process Sheets');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReferences();
    fetchHeaders();
  }, [loadReferences]);

  const fetchRevisions = useCallback(async (headerId, autoSelectRevId = null) => {
    try {
      const res = await axios.get(`/engineering/routing/${headerId}/revisions`);
      const revs = res.data?.data || [];
      setRevisions(revs);
      if (revs.length > 0) {
        const target = autoSelectRevId
          ? revs.find(r => r._id === autoSelectRevId) || revs[0]
          : revs.find(r => r.approvalStatus === 'Approved') || revs[0];
        selectRevision(target);
      } else {
        setSelectedRevisionId(null);
        setOperations([]);
        setSelectedOperationId(null);
        setResources([]);
        setSubcontracting([]);
      }
    } catch (e) {
      console.error('Fetch routing revisions error:', e);
    }
  }, []);

  const fetchOperations = useCallback(async (revisionId, autoSelectOpId = null) => {
    try {
      const res = await axios.get(`/engineering/routing-revisions/${revisionId}/operations`);
      const ops = res.data?.data || [];
      setOperations(ops);
      if (ops.length > 0) {
        const target = autoSelectOpId
          ? ops.find(o => o._id === autoSelectOpId) || ops[0]
          : ops[0];
        selectOperation(target);
      } else {
        setSelectedOperationId(null);
        setResources([]);
        setSubcontracting([]);
      }
    } catch (e) {
      console.error('Fetch routing operations error:', e);
    }
  }, []);

  const fetchResources = useCallback(async (operationId) => {
    if (!operationId) { setResources([]); return; }
    try {
      const res = await axios.get(`/engineering/routing-operations/${operationId}/resources`);
      setResources(res.data?.data || []);
    } catch (e) {
      console.error('Fetch resources error:', e);
    }
  }, []);

  const fetchSubcontracting = useCallback(async (operationId) => {
    if (!operationId) { setSubcontracting([]); return; }
    try {
      const res = await axios.get(`/engineering/routing-operations/${operationId}/subcontracting`);
      setSubcontracting(res.data?.data || []);
    } catch (e) {
      console.error('Fetch subcontracting error:', e);
    }
  }, []);

  // ── Selection Handlers ────────────────────────────────────────────────────
  const selectHeader = (header) => {
    setSelectedHeaderId(header._id);
    fetchRevisions(header._id);
  };

  const selectRevision = (revision) => {
    setSelectedRevisionId(revision._id);
    fetchOperations(revision._id);
  };

  const selectOperation = (operation) => {
    setSelectedOperationId(operation._id);
    fetchResources(operation._id);
    if (operation.isSubcontracted) {
      fetchSubcontracting(operation._id);
    } else {
      setSubcontracting([]);
    }
  };

  // Currently selected objects
  const selectedHeader = useMemo(() => {
    return headers.find(h => h._id === selectedHeaderId) || null;
  }, [headers, selectedHeaderId]);

  const selectedRevision = useMemo(() => {
    return revisions.find(r => r._id === selectedRevisionId) || null;
  }, [revisions, selectedRevisionId]);

  const selectedOperation = useMemo(() => {
    return operations.find(o => o._id === selectedOperationId) || null;
  }, [operations, selectedOperationId]);

  // ── Filtered Process Sheets ───────────────────────────────────────────────
  const filteredHeaders = useMemo(() => {
    return headers.filter(h => {
      const matchSearch = searchTerm === '' ||
        (h.routingCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.routingName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.productId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.productId?.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchPlant = plantFilter === 'All' || (h.plantId?._id === plantFilter || h.plantId === plantFilter);
      const matchStatus = statusFilter === 'All' || h.status === statusFilter;
      return matchSearch && matchPlant && matchStatus;
    });
  }, [headers, searchTerm, plantFilter, statusFilter]);

  // Filtered operations in active revision
  const filteredOperations = useMemo(() => {
    return operations.filter(op => {
      if (outsideFilter && !op.isSubcontracted) return false;
      if (!operationSearch) return true;
      const term = operationSearch.toLowerCase();
      const desc = (op.operationDescription || '').toLowerCase();
      const wcName = (op.workCenterId?.name || '').toLowerCase();
      const mcName = (op.machineId?.name || '').toLowerCase();
      const seq = String(op.operationSequence);
      return desc.includes(term) || wcName.includes(term) || mcName.includes(term) || seq.includes(term);
    });
  }, [operations, operationSearch, outsideFilter]);

  // ── Telemetry & Cumulative Cycle Time ─────────────────────────────────────
  const telemetry = useMemo(() => {
    const totalSheets = headers.length;
    const activeSheets = headers.filter(h => h.status === 'Active').length;
    const defaultSheets = headers.filter(h => h.isDefaultRouting).length;
    const totalOps = operations.length;
    const totalSetup = operations.reduce((sum, op) => sum + (op.setupTime || 0), 0);
    const totalRun = operations.reduce((sum, op) => sum + (op.runTime || 0), 0);
    const totalMove = operations.reduce((sum, op) => sum + (op.moveTime || 0), 0);
    const totalCycle = operations.reduce((sum, op) => sum + (op.totalOperationTime || 0), 0);
    const subcontractedCount = operations.filter(op => op.isSubcontracted).length;

    // Bottleneck station (slowest operation on the line)
    const bottleneckOp = operations.length > 0
      ? operations.reduce((max, op) => (op.totalOperationTime || 0) > (max.totalOperationTime || 0) ? op : max, operations[0])
      : null;
    const bottleneckTime = bottleneckOp ? (bottleneckOp.totalOperationTime || 0) : 0;
    // Line Balancing Efficiency (Smoothness Index) = Total Work / (Stations * Bottleneck Time) * 100
    const balancingEfficiency = (totalOps > 0 && bottleneckTime > 0)
      ? Math.min(100, Math.round((totalCycle / (totalOps * bottleneckTime)) * 100))
      : 100;
    // Theoretical output per shift based on pacing station
    const shiftMinutes = shiftHours * 60;
    const outputPerShift = bottleneckTime > 0 ? Math.floor(shiftMinutes / bottleneckTime) : 0;

    return {
      totalSheets,
      activeSheets,
      defaultSheets,
      totalOps,
      totalSetup,
      totalRun,
      totalMove,
      totalCycle,
      subcontractedCount,
      bottleneckOp,
      bottleneckTime,
      balancingEfficiency,
      outputPerShift
    };
  }, [headers, operations, shiftHours]);

  // ── Process Step Icon Detector ───────────────────────────────────────────
  const getProcessIcon = (op) => {
    const desc = (op?.operationDescription || '').toLowerCase();
    const wc = (op?.workCenterId?.name || '').toLowerCase();
    if (op?.isSubcontracted) return Truck;
    if (op?.controlKey === 'Milestone' || /inspect|qc|cmm|check|quality|gauge/i.test(desc) || /inspect|qc/i.test(wc)) return ShieldCheck;
    if (/weld|spot|tig|mig|braz|robot/i.test(desc) || /weld/i.test(wc)) return Zap;
    if (/shear|blank|press|stamp|punch|bend|form/i.test(desc) || /press|stamp/i.test(wc)) return Layers;
    if (/cnc|mill|lathe|turn|drill|bore|machin/i.test(desc) || /machin/i.test(wc)) return Sliders;
    if (/paint|coat|plate|heat|treat|phosph|dip/i.test(desc)) return Sparkles;
    return Settings;
  };

  // ── Reorder Step (Move Up / Down) ─────────────────────────────────────────
  const moveStep = async (op, direction) => {
    const sorted = [...operations].sort((a, b) => a.operationSequence - b.operationSequence);
    const currentIndex = sorted.findIndex(o => o._id === op._id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const currentOp = sorted[currentIndex];
    const targetOp = sorted[targetIndex];

    try {
      setBusy(true);
      const currentSeq = currentOp.operationSequence;
      const targetSeq = targetOp.operationSequence;
      const safeTargetSeq = targetSeq === currentSeq ? (direction === 'up' ? currentSeq - 10 : currentSeq + 10) : targetSeq;

      await axios.put(`/engineering/routing-operations/${currentOp._id}`, {
        ...currentOp,
        workCenterId: currentOp.workCenterId?._id || currentOp.workCenterId,
        machineId: currentOp.machineId?._id || currentOp.machineId,
        operationSequence: safeTargetSeq
      });

      await axios.put(`/engineering/routing-operations/${targetOp._id}`, {
        ...targetOp,
        workCenterId: targetOp.workCenterId?._id || targetOp.workCenterId,
        machineId: targetOp.machineId?._id || targetOp.machineId,
        operationSequence: currentSeq
      });

      notify.success(`Operation moved ${direction}`);
      fetchOperations(selectedRevision._id, currentOp._id);
    } catch (err) {
      notify.error(err.response?.data?.message || `Failed to reorder operation`);
    } finally {
      setBusy(false);
    }
  };

  // ── Duplicate Step ────────────────────────────────────────────────────────
  const duplicateStep = (op) => {
    const maxSeq = Math.max(...operations.map(o => o.operationSequence || 0), 0);
    openModal('operation', {
      operationSequence: maxSeq + 10,
      operationDescription: `${op.operationDescription} (Copy)`,
      workCenterId: op.workCenterId?._id || op.workCenterId,
      machineId: op.machineId?._id || op.machineId,
      setupTime: op.setupTime || 0,
      runTime: op.runTime || 0,
      moveTime: op.moveTime || 0,
      timeUOM: op.timeUOM || 'Minutes',
      controlKey: op.controlKey || 'Standard',
      isSubcontracted: !!op.isSubcontracted
    });
  };

  // ── 1-Click Quick Status Transition for Revisions ────────────────────────
  const handleQuickStatusChange = async (revId, newStatus) => {
    try {
      await axios.put(`/engineering/routing-revisions/${revId}/status`, { status: newStatus });
      notify.success(`Routing revision status changed to ${newStatus}`);
      if (selectedHeader) fetchRevisions(selectedHeader._id, revId);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating revision status');
    }
  };

  // ── Generic Save ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const { type, data, editId } = modal;
    try {
      if (type === 'header') {
        if (editId) {
          await axios.put(`/engineering/routing/${editId}`, data);
          notify.success('Process sheet updated');
          fetchHeaders(editId);
        } else {
          const res = await axios.post('/engineering/routing', data);
          notify.success('New process sheet created');
          fetchHeaders(res.data?.data?._id);
        }
      } else if (type === 'revision') {
        if (editId) {
          await axios.put(`/engineering/routing-revisions/${editId}/status`, {
            status: data.approvalStatus
          });
          notify.success('Revision status updated');
        } else {
          const res = await axios.post(`/engineering/routing/${selectedHeader._id}/revisions`, {
            ...data,
            routingId: selectedHeader._id
          });
          notify.success('New revision created');
          fetchRevisions(selectedHeader._id, res.data?.data?._id);
          return;
        }
        fetchRevisions(selectedHeader._id, editId);
      } else if (type === 'operation') {
        const payload = {
          ...data,
          revisionId: selectedRevision._id
        };
        if (editId) {
          await axios.put(`/engineering/routing-operations/${editId}`, payload);
          notify.success('Process operation updated');
          fetchOperations(selectedRevision._id, editId);
        } else {
          const res = await axios.post(`/engineering/routing-revisions/${selectedRevision._id}/operations`, payload);
          notify.success('Process operation added to routing');
          fetchOperations(selectedRevision._id, res.data?.data?._id);
        }
      } else if (type === 'resource') {
        const payload = {
          ...data,
          operationId: selectedOperation._id
        };
        if (editId) {
          await axios.put(`/engineering/operation-resources/${editId}`, payload);
          notify.success('Tooling resource updated');
        } else {
          await axios.post(`/engineering/routing-operations/${selectedOperation._id}/resources`, payload);
          notify.success('Tooling resource attached');
        }
        fetchResources(selectedOperation._id);
      } else if (type === 'subcontracting') {
        const payload = {
          ...data,
          operationId: selectedOperation._id
        };
        if (editId) {
          await axios.put(`/engineering/subcontracting/${editId}`, payload);
          notify.success('Subcontracting detail updated');
        } else {
          await axios.post(`/engineering/routing-operations/${selectedOperation._id}/subcontracting`, payload);
          notify.success('Subcontracting processing configured');
        }
        fetchSubcontracting(selectedOperation._id);
      }
      setModal({ type: null, data: null, editId: null });
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Error saving routing record');
    }
  };

  // ── Generic Delete ────────────────────────────────────────────────────────
  const handleDelete = async (type, id) => {
    if (!await confirmAction(`Delete this ${type}? This action cannot be undone.`)) return;
    try {
      if (type === 'operation') {
        await axios.delete(`/engineering/routing-operations/${id}`);
        notify.success('Operation step removed');
        fetchOperations(selectedRevision._id);
      } else if (type === 'resource') {
        await axios.delete(`/engineering/operation-resources/${id}`);
        notify.success('Tooling resource removed');
        fetchResources(selectedOperation._id);
      } else if (type === 'subcontracting') {
        await axios.delete(`/engineering/subcontracting/${id}`);
        notify.success('Subcontracting detail removed');
        fetchSubcontracting(selectedOperation._id);
      }
    } catch (err) {
      notify.error(err.response?.data?.message || `Error deleting ${type}`);
    }
  };

  // ── Auto-generate Routing Code ────────────────────────────────────────────
  const generateRoutingCode = () => {
    return 'RTG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // ── Modal Helpers ─────────────────────────────────────────────────────────
  const openModal = (type, prefill = {}, editId = null) => {
    setModal({ type, data: { ...prefill }, editId });
  };

  const updateField = (field, value) => {
    setModal(m => ({
      ...m,
      data: { ...m.data, [field]: value }
    }));
  };

  // ── Export Routing Schedule to CSV ────────────────────────────────────────
  const exportRoutingCSV = () => {
    if (!selectedHeader || operations.length === 0) {
      notify.info('No operation sequence available to export for this process sheet');
      return;
    }
    const headersCsv = ['Step Seq', 'Description', 'Work Center', 'Machine', 'Setup Min', 'Run Min', 'Move Min', 'Total Min', 'Control Key', 'Subcontracted'];
    const rows = operations.map(op => [
      op.operationSequence,
      `"${(op.operationDescription || '').replace(/"/g, '""')}"`,
      `"${(op.workCenterId?.name || '').replace(/"/g, '""')}"`,
      `"${(op.machineId?.name || 'N/A').replace(/"/g, '""')}"`,
      op.setupTime || 0,
      op.runTime || 0,
      op.moveTime || 0,
      op.totalOperationTime || 0,
      op.controlKey,
      op.isSubcontracted ? 'Yes' : 'No'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headersCsv.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedHeader.routingCode}_Process_Flowline.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Process sheet routing schedule exported to CSV');
  };

  // ── Calibrate Sample Automotive Routing ───────────────────────────────────
  const calibrateSampleRouting = async () => {
    if (!selectedHeader || !selectedRevision) {
      notify.info('Select a process sheet and revision to calibrate');
      return;
    }
    try {
      setBusy(true);
      if (operations.length === 0 && workCenters.length > 0) {
        // Create initial 3 operations
        const wcPress = workCenters.find(w => /press|stamp/i.test(w.name)) || workCenters[0];
        const wcWeld = workCenters.find(w => /weld/i.test(w.name)) || workCenters[1] || workCenters[0];
        const wcQc = workCenters.find(w => /qc|quality|inspect/i.test(w.name)) || workCenters[0];

        await axios.post(`/engineering/routing-revisions/${selectedRevision._id}/operations`, {
          revisionId: selectedRevision._id,
          operationSequence: 10,
          operationDescription: 'Shear and blank strip layout on heavy mechanical press',
          workCenterId: wcPress._id,
          machineId: machines[0]?._id || null,
          setupTime: 25,
          runTime: 5.5,
          moveTime: 6,
          timeUOM: 'Minutes',
          controlKey: 'Standard',
          isSubcontracted: false
        });

        await axios.post(`/engineering/routing-revisions/${selectedRevision._id}/operations`, {
          revisionId: selectedRevision._id,
          operationSequence: 20,
          operationDescription: 'Progressive forming and flange bending with rotary weld fixture',
          workCenterId: wcWeld._id,
          machineId: machines[1]?._id || null,
          setupTime: 30,
          runTime: 12.0,
          moveTime: 8,
          timeUOM: 'Minutes',
          controlKey: 'Backflush',
          isSubcontracted: false
        });

        await axios.post(`/engineering/routing-revisions/${selectedRevision._id}/operations`, {
          revisionId: selectedRevision._id,
          operationSequence: 30,
          operationDescription: 'Final coordinate measuring (CMM) and dimensional verification',
          workCenterId: wcQc._id,
          machineId: null,
          setupTime: 5,
          runTime: 3.5,
          moveTime: 0,
          timeUOM: 'Minutes',
          controlKey: 'Milestone',
          isSubcontracted: false
        });

        fetchOperations(selectedRevision._id);
        notify.success('Seeded realistic automotive routing operations');
      } else {
        // Add sample tool or outside work if missing
        const firstOp = operations[0];
        if (firstOp && resources.length === 0) {
          await axios.post(`/engineering/routing-operations/${firstOp._id}/resources`, {
            operationId: firstOp._id,
            resourceType: 'Tool',
            resourceCode: 'DIE-STAMP-014',
            quantityRequired: 1
          });
          fetchResources(firstOp._id);
        }
        notify.success('Routing flowline calibrated');
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error calibrating routing sample');
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
      minHeight: '100%',
      gap: 10,
      paddingBottom: 32
    }}>

      {/* ── PRINT & ANIMATION STYLES ──────────────────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-traveler, #printable-traveler * {
            visibility: visible;
          }
          #printable-traveler {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
        }
      `}</style>

      {/* ── 1. UNIFIED TITANIUM & SLATE MES COMMAND BAR ───────────────── */}
      <RoutingCommandBar
        selectedHeader={selectedHeader}
        selectedRevision={selectedRevision}
        revisions={revisions}
        telemetry={telemetry}
        busy={busy}
        onSelectRevision={selectRevision}
        onQuickStatusChange={handleQuickStatusChange}
        onOpenModal={openModal}
        onCalibrate={calibrateSampleRouting}
        onExportCSV={exportRoutingCSV}
        onPrintTraveler={() => {
          setActiveTab('traveler');
          setTimeout(() => window.print(), 200);
        }}
      />

      {/* ── 2. DUAL-PANE MANUFACTURING WORKBENCH ─────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px minmax(0, 1fr)',
        gap: 12,
        alignItems: 'start'
      }}>

        {/* ── LEFT PANE: ROUTING SHEETS REGISTRY ──────────────────────────── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          position: 'sticky',
          top: 10,
          maxHeight: 'calc(100vh - 20px)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--surface-canvas)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PlayCircle size={14} color="#f43f5e" />
              <span style={{ fontWeight: 700, fontSize: 12.5 }}>Process Sheets</span>
            </div>
            <span style={{
              fontSize: 10.5,
              background: 'var(--bg-primary)',
              padding: '1px 6px',
              borderRadius: 10,
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}>
              {filteredHeaders.length} of {headers.length}
            </span>
          </div>

          {/* Search & Filters */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search sheets, parts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 24px 5px 26px',
                  fontSize: 11.5,
                  borderRadius: 4,
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
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: 2
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Plant & Status Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <select
                value={plantFilter}
                onChange={e => setPlantFilter(e.target.value)}
                style={{
                  padding: '3px 4px',
                  fontSize: 10.5,
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
                  padding: '3px 4px',
                  fontSize: 10.5,
                  borderRadius: 4,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Obsolete">Obsolete</option>
              </select>
            </div>
          </div>

          {/* Route Sheets Cards List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px', maxHeight: 'calc(100vh - 175px)' }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 11 }}>
                <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 6px', display: 'block' }} />
                Loading process sheets...
              </div>
            ) : filteredHeaders.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 11 }}>
                <PlayCircle size={20} style={{ opacity: 0.4, margin: '0 auto 6px', display: 'block' }} />
                No process sheets found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredHeaders.map(rtg => {
                  const isSelected = selectedHeaderId === rtg._id;
                  return (
                    <div
                      key={rtg._id}
                      onClick={() => selectHeader(rtg)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isSelected ? '#f43f5e' : 'var(--border-color)',
                        background: isSelected ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-primary)',
                        position: 'relative',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Active indicator bar */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          background: '#f43f5e',
                          borderRadius: '6px 0 0 6px'
                        }} />
                      )}

                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: 11,
                          color: isSelected ? '#f43f5e' : 'var(--text-primary)',
                          background: isSelected ? 'rgba(244, 63, 94, 0.14)' : 'var(--bg-secondary)',
                          padding: '1px 5px',
                          borderRadius: 3
                        }}>
                          {rtg.routingCode}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          {rtg.isDefaultRouting && (
                            <span style={{
                              fontSize: 9.5,
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#d97706',
                              padding: '1px 4px',
                              borderRadius: 3,
                              fontWeight: 600
                            }}>
                              Default
                            </span>
                          )}
                          <StatusBadge value={rtg.status} />
                        </div>
                      </div>

                      {/* Route Name */}
                      <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 3, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                        {rtg.routingName}
                      </div>

                      {/* Finished Part */}
                      <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <Box size={10} color="#f43f5e" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rtg.productId?.name || 'Unassigned Part'}
                        </span>
                      </div>

                      {/* Footer specs */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 10,
                        color: 'var(--text-secondary)',
                        paddingTop: 3,
                        borderTop: '1px dashed var(--border-color)'
                      }}>
                        <span>{rtg.plantId?.name || 'Plant'}</span>
                        <span>Lot: <strong>{rtg.baseQuantity} pcs</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: INTERACTIVE FLOWLINE STUDIO WORKBENCH ──────────── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border-color)'
        }}>
          {selectedHeader ? (
            <>
              {/* Segmented Flowline Navigation Tabs */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--surface-canvas)',
                padding: '0 12px',
                gap: 2,
                overflowX: 'auto',
                borderRadius: '8px 8px 0 0'
              }}>
                {[
                  { id: 'flowline', label: 'Flowline Pipeline', icon: PlayCircle, badge: operations.length },
                  { id: 'resources', label: 'Tooling & Labor', icon: Wrench, badge: resources.length },
                  { id: 'subcontracting', label: 'Outside Processing', icon: Truck, badge: subcontracting.length },
                  { id: 'takttime', label: 'Takt & Lot Simulator', icon: Calculator },
                  { id: 'traveler', label: 'Manufacturing Traveler', icon: FileText }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '9px 12px',
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 500,
                        borderBottom: isActive ? '2px solid #f43f5e' : '2px solid transparent',
                        color: isActive ? '#f43f5e' : 'var(--text-secondary)',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                      {tab.badge !== undefined && (
                        <span style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          borderRadius: 999,
                          background: isActive ? 'rgba(244, 63, 94, 0.18)' : 'var(--bg-primary)',
                          color: isActive ? '#f43f5e' : 'var(--text-secondary)',
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
              <div style={{ padding: '14px', background: 'var(--bg-primary)', borderRadius: '0 0 8px 8px' }}>

                {/* ── TAB 1: PROCESS STEPS & FLOWLINE (AUTOMOTIVE MES PIPELINE) ─ */}
                {activeTab === 'flowline' && (
                  <RoutingFlowlineTab
                    operations={operations}
                    filteredOperations={filteredOperations}
                    selectedOperationId={selectedOperationId}
                    selectedOperation={selectedOperation}
                    resources={resources}
                    subcontracting={subcontracting}
                    telemetry={telemetry}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    operationSearch={operationSearch}
                    setOperationSearch={setOperationSearch}
                    outsideFilter={outsideFilter}
                    setOutsideFilter={setOutsideFilter}
                    onSelectOperation={selectOperation}
                    onOpenModal={openModal}
                    onDelete={(id) => handleDelete('operation', id)}
                    onMoveStep={moveStep}
                    onDuplicateStep={duplicateStep}
                    onSwitchTab={setActiveTab}
                    getProcessIcon={getProcessIcon}
                  />
                )}

                {/* ── TAB 2: TOOLING & LABOR RESOURCES ──────────────────────── */}
                {activeTab === 'resources' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Guidance */}
                    <div style={{
                      padding: '10px 14px',
                      background: 'rgba(244, 63, 94, 0.08)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <Wrench size={16} color={FORGE.crimsonNeon} />
                      <div>
                        <strong>Tooling & Labor Skill Allocations:</strong> Attach specific stamping dies, welding fixtures, assembly jigs, or certified labor skills to this operation step.
                      </div>
                    </div>

                    {/* Step selector */}
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
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Active Operation Step:</span>
                        <select
                          value={selectedOperationId || ''}
                          onChange={e => {
                            const op = operations.find(o => o._id === e.target.value);
                            if (op) selectOperation(op);
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
                          {operations.map(op => (
                            <option key={op._id} value={op._id}>
                              Step #{op.operationSequence}: {op.operationDescription}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => openModal('resource', {
                          resourceType: 'Tool',
                          resourceCode: '',
                          quantityRequired: 1
                        })}
                        disabled={!selectedOperation}
                        className="btn btn-primary"
                        style={{
                          fontSize: 12,
                          padding: '5px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          background: `linear-gradient(135deg, ${FORGE.crimsonNeon} 0%, #be123c 100%)`
                        }}
                      >
                        <Plus size={13} /> Add Tooling / Resource
                      </button>
                    </div>

                    {/* Resources Table */}
                    <div style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: 'var(--bg-secondary)'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px' }}>Resource Type</th>
                            <th style={{ padding: '8px 10px' }}>Resource Code / Identifier</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Quantity Needed</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resources.length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No specialized tools, dies, or certified labor resources assigned to this step yet.
                              </td>
                            </tr>
                          ) : (
                            resources.map(res => (
                              <tr key={res._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                                  <span style={{
                                    fontSize: 11,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: res.resourceType === 'Tool' ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-primary)',
                                    color: res.resourceType === 'Tool' ? FORGE.crimsonNeon : 'var(--text-primary)'
                                  }}>
                                    {res.resourceType}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {res.resourceCode}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                  {res.quantityRequired}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                    <button
                                      onClick={() => openModal('resource', { ...res }, res._id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: 4 }}
                                      title="Edit resource"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete('resource', res._id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: 4 }}
                                      title="Delete resource"
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

                {/* ── TAB 3: OUTSIDE SUBCONTRACTING ─────────────────────────── */}
                {activeTab === 'subcontracting' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Guidance */}
                    <div style={{
                      padding: '10px 14px',
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.25)',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <Truck size={16} color="#9333ea" />
                      <div>
                        <strong>Outside Processing & Subcontracting:</strong> Specialized heat treatments, electroplating, or powder coating performed by approved third-party vendors.
                      </div>
                    </div>

                    {/* Step selector */}
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
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Active Operation Step:</span>
                        <select
                          value={selectedOperationId || ''}
                          onChange={e => {
                            const op = operations.find(o => o._id === e.target.value);
                            if (op) selectOperation(op);
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
                          {operations.map(op => (
                            <option key={op._id} value={op._id}>
                              Step #{op.operationSequence}: {op.operationDescription} {op.isSubcontracted ? '(Outside)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedOperation?.isSubcontracted && (
                        <button
                          onClick={() => openModal('subcontracting', {
                            leadTimeDays: 4,
                            standardCost: 10.0
                          })}
                          className="btn btn-primary"
                          style={{
                            fontSize: 12,
                            padding: '5px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: `linear-gradient(135deg, ${FORGE.crimsonNeon} 0%, #be123c 100%)`
                          }}
                        >
                          <Plus size={13} /> Add Subcontracting Details
                        </button>
                      )}
                    </div>

                    {!selectedOperation?.isSubcontracted ? (
                      <div style={{
                        padding: '32px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-secondary)',
                        borderRadius: 6,
                        border: '1px solid var(--border-color)'
                      }}>
                        <AlertCircle size={20} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--text-secondary)' }} />
                        This operation is currently marked as an internal in-house step.<br />
                        To attach outside vendor processing, edit this operation and enable <strong>"Sent outside for this step"</strong>.
                      </div>
                    ) : (
                      /* Subcontracting Table */
                      <div style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                              <th style={{ padding: '8px 10px' }}>Supplier / Vendor</th>
                              <th style={{ padding: '8px 10px' }}>Service Product Line</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Vendor Lead Time (Days)</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Standard Cost / Pc</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subcontracting.length === 0 ? (
                              <tr>
                                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                  No outside vendor details configured for this step yet. Click "Add Subcontracting Details" above.
                                </td>
                              </tr>
                            ) : (
                              subcontracting.map(sub => (
                                <tr key={sub._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '8px 10px' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                      {sub.vendorId?.name || '—'}
                                    </div>
                                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                      {sub.vendorId?.code}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                                    {sub.serviceItemId?.name || 'Standard Processing Service'}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                    {sub.leadTimeDays} days
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: FORGE.crimsonNeon }}>
                                    {fmtMoneyFull(sub.standardCost)}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                      <button
                                        onClick={() => openModal('subcontracting', {
                                          ...sub,
                                          vendorId: sub.vendorId?._id || sub.vendorId,
                                          serviceItemId: sub.serviceItemId?._id || sub.serviceItemId
                                        }, sub._id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: 4 }}
                                        title="Edit subcontracting"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDelete('subcontracting', sub._id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: 4 }}
                                        title="Delete subcontracting"
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
                    )}
                  </div>
                )}

                {/* ── TAB 4: TAKT-TIME & LOT SIMULATOR (LINE BALANCING STUDIO) ─ */}
                {activeTab === 'takttime' && (
                  <RoutingTaktStudio
                    operations={operations}
                    selectedHeader={selectedHeader}
                    simulatedBatchQty={simulatedBatchQty}
                    setSimulatedBatchQty={setSimulatedBatchQty}
                    targetTaktMinutes={targetTaktMinutes}
                    setTargetTaktMinutes={setTargetTaktMinutes}
                    shiftHours={shiftHours}
                    setShiftHours={setShiftHours}
                    telemetry={telemetry}
                  />
                )}

                {/* ── TAB 5: ROUTE TRAVELER CARD & AUDIT (PRINTABLE SHOP ROUTER) */}
                {activeTab === 'traveler' && (
                  <RoutingTravelerTab
                    selectedHeader={selectedHeader}
                    selectedRevision={selectedRevision}
                    operations={operations}
                    resources={resources}
                  />
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', padding: 32 }}>
              <PlayCircle size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Select a Process Sheet</h3>
              <p style={{ fontSize: 12, margin: '4px 0 0' }}>Click any process sheet on the left to inspect its flowline sequence, machine cycle times, and outside processing.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODALS: 100% COVERAGE FOR ALL 5 ROUTING ENTITIES                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* ── MODAL 1: ROUTING HEADER MODAL ─────────────────────────────────── */}
      <Modal
        isOpen={modal.type === 'header'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Process Sheet Header' : 'Create New Process Sheet'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Process Sheet Code *</label>
              <input
                className="input-field"
                required
                readOnly={!!modal.editId}
                value={modal.data?.routingCode || ''}
                onChange={e => updateField('routingCode', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Process Sheet Name *</label>
              <input
                className="input-field"
                required
                placeholder="e.g. Brake Pedal Bracket — Press / Weld"
                value={modal.data?.routingName || ''}
                onChange={e => updateField('routingName', e.target.value)}
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
                <option value="" disabled>Choose a product</option>
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
                id="isDefaultRouting"
                checked={!!modal.data?.isDefaultRouting}
                onChange={e => updateField('isDefaultRouting', e.target.checked)}
              />
              <label htmlFor="isDefaultRouting" className="input-label" style={{ margin: 0, cursor: 'pointer' }}>
                Set as Default Process Sheet for this product
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
              {busy ? 'Saving...' : (modal.editId ? 'Update Process Sheet' : 'Create Process Sheet')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: ROUTING REVISION MODAL ───────────────────────────────── */}
      <Modal
        isOpen={modal.type === 'revision'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Revision Approval Status' : 'Add Routing Revision'}
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
                <label className="input-label">Change Request (ECO)</label>
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
                <label className="input-label">Approval Status</label>
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
              {busy ? 'Saving...' : (modal.editId ? 'Update Status' : 'Add Revision')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 3: ROUTING OPERATION MODAL ──────────────────────────────── */}
      <Modal
        isOpen={modal.type === 'operation'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Process Operation' : 'Add Routing Operation Step'}
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
                value={modal.data?.operationSequence || ''}
                onChange={e => updateField('operationSequence', parseInt(e.target.value))}
              />
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Operation Description *</label>
              <input
                className="input-field"
                required
                placeholder="e.g. Blanking on 250T Power Press, Robotic MIG Welding"
                value={modal.data?.operationDescription || ''}
                onChange={e => updateField('operationDescription', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Work Centre Cell *</label>
              <select
                className="input-field"
                required={!modal.data?.isSubcontracted}
                value={modal.data?.workCenterId || ''}
                onChange={e => updateField('workCenterId', e.target.value)}
              >
                <option value="" disabled>Choose a work centre</option>
                {workCenters.map(w => (
                  <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Machine (Optional)</label>
              <select
                className="input-field"
                value={modal.data?.machineId || ''}
                onChange={e => updateField('machineId', e.target.value)}
              >
                <option value="">None / Manual Station</option>
                {machines.map(m => (
                  <option key={m._id} value={m._id}>{m.name} ({m.code || m.machineCode})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Setup Time (min)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                step="any"
                value={modal.data?.setupTime || 0}
                onChange={e => updateField('setupTime', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Run Time (min)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                step="any"
                value={modal.data?.runTime || 0}
                onChange={e => updateField('runTime', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Move / Queue Time (min)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                step="any"
                value={modal.data?.moveTime || 0}
                onChange={e => updateField('moveTime', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Time Unit</label>
              <select
                className="input-field"
                value={modal.data?.timeUOM || 'Minutes'}
                onChange={e => updateField('timeUOM', e.target.value)}
              >
                {['Minutes', 'Hours'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Operation Control Key</label>
              <select
                className="input-field"
                value={modal.data?.controlKey || 'Standard'}
                onChange={e => updateField('controlKey', e.target.value)}
              >
                {['Milestone', 'Backflush', 'Standard'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input
                type="checkbox"
                id="isSubcontracted"
                checked={!!modal.data?.isSubcontracted}
                onChange={e => updateField('isSubcontracted', e.target.checked)}
              />
              <label htmlFor="isSubcontracted" className="input-label" style={{ margin: 0, cursor: 'pointer' }}>
                Sent outside for this step (Subcontracted)
              </label>
            </div>

            {/* Computed total preview */}
            <div className="input-group" style={{
              background: 'var(--bg-tertiary)',
              padding: '10px 14px',
              borderRadius: 6,
              gridColumn: '1 / -1'
            }}>
              <label className="input-label">Computed Total Operation Cycle Time</label>
              <strong style={{ fontSize: 16, color: FORGE.crimsonNeon }}>
                {((parseFloat(modal.data?.setupTime) || 0) + (parseFloat(modal.data?.runTime) || 0) + (parseFloat(modal.data?.moveTime) || 0)).toFixed(2)} {modal.data?.timeUOM || 'Minutes'}
              </strong>
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
              {busy ? 'Saving...' : (modal.editId ? 'Update Operation' : 'Add Operation')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 4: OPERATION RESOURCE MODAL ─────────────────────────────── */}
      <Modal
        isOpen={modal.type === 'resource'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Tooling / Resource' : 'Attach Tooling or Resource to Step'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Type of Resource *</label>
              <select
                className="input-field"
                required
                value={modal.data?.resourceType || 'Tool'}
                onChange={e => updateField('resourceType', e.target.value)}
              >
                {['Labor Skill', 'Tool', 'Jig/Fixture', 'Mold'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Resource Code / Identifier *</label>
              <input
                className="input-field"
                required
                placeholder="e.g. DIE-BLK-001, JIG-WELD-014, SKL-PRESS-B"
                value={modal.data?.resourceCode || ''}
                onChange={e => updateField('resourceCode', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Quantity Needed *</label>
              <input
                type="number"
                className="input-field"
                required
                min="1"
                value={modal.data?.quantityRequired || 1}
                onChange={e => updateField('quantityRequired', parseInt(e.target.value))}
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
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : (modal.editId ? 'Update Resource' : 'Attach Resource')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 5: SUBCONTRACTING DETAIL MODAL ───────────────────────────── */}
      <Modal
        isOpen={modal.type === 'subcontracting'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Subcontracting Details' : 'Configure Outside Vendor Processing'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Approved Outside Supplier (Vendor) *</label>
              <select
                className="input-field"
                required
                value={modal.data?.vendorId || ''}
                onChange={e => updateField('vendorId', e.target.value)}
              >
                <option value="" disabled>Choose a supplier</option>
                {vendors.map(v => (
                  <option key={v._id} value={v._id}>{v.name} ({v.code})</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Service Item (Optional Purchase Order Item)</label>
              <select
                className="input-field"
                value={modal.data?.serviceItemId || ''}
                onChange={e => updateField('serviceItemId', e.target.value)}
              >
                <option value="">None / Custom Outside Processing</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Vendor Turnaround Lead Time (Days) *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0"
                value={modal.data?.leadTimeDays || 0}
                onChange={e => updateField('leadTimeDays', parseInt(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Standard Cost (₹ per piece) *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0"
                step="any"
                value={modal.data?.standardCost || 0}
                onChange={e => updateField('standardCost', parseFloat(e.target.value))}
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
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : (modal.editId ? 'Update Outside Work' : 'Save Outside Work')}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default RoutingMaster;