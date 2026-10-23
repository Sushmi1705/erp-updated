import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';

// Modular Subcomponents
import { ShortageThreatRadar } from './shortages/ShortageThreatRadar';
import { ShortageFilterBar } from './shortages/ShortageFilterBar';
import { ProductionConstraintsCard } from './shortages/ProductionConstraintsCard';
import { RawMaterialShortagesCard } from './shortages/RawMaterialShortagesCard';
import { ComponentShortagesCard } from './shortages/ComponentShortagesCard';
import { ShortageResolutionModal } from './shortages/ShortageResolutionModal';

const ShortageAnalysis = () => {
  // Data State
  const [mrpRuns, setMrpRuns] = useState([]);
  const [shortages, setShortages] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');

  // Mode & Loaders
  const [loading, setLoading] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [busy, setBusy] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All'); // 'All' | 'Critical' | 'High' | 'Medium' | 'OpenOnly'
  const [activeView, setActiveView] = useState('tri'); // 'tri' | 'constraints' | 'raw' | 'components'

  // Resolution Modal State
  const [resolutionModal, setResolutionModal] = useState({
    isOpen: false,
    selectedItem: null,
    actionType: 'Expedite PO',
    referenceDocNo: ''
  });

  // ── 1. Initial Load ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRuns();
  }, []);

  // ── 2. Data Fetchers ───────────────────────────────────────────────────────
  const fetchRuns = async () => {
    try {
      const res = await axios.get('/mrp/run');
      const runs = res.data.data || [];
      setMrpRuns(runs);

      if (runs.length > 0) {
        setSelectedRunId(runs[0]._id);
        fetchShortages(runs[0]._id);
      }
    } catch (err) {
      console.error('MRP Runs fetch error', err);
      notify.error('Could not load MRP runs.');
    }
  };

  const fetchShortages = async (runId) => {
    if (!runId) return;
    setLoading(true);
    setIsLiveMode(false);
    try {
      const res = await axios.get(`/mrp/shortages?runId=${runId}`);
      setShortages(res.data.data || []);
    } catch (err) {
      console.error('Shortages fetch error', err);
      notify.error('Could not load shortages for selected run.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveShortages = async () => {
    if (!selectedRunId) return;
    setLoading(true);
    setIsLiveMode(true);
    try {
      const res = await axios.post('/mrp/shortages/refresh-live', {
        runId: selectedRunId
      });
      // Map live results back to uniform structure
      const mapped = (res.data.data || []).map(live => ({
        _id: live._id,
        itemId: live.itemId,
        shortageCategory: live.shortageCategory,
        requiredQty: live.requiredQty,
        availableQty: live.liveAvailableQty,
        shortageQty: live.liveShortageQty,
        severity: live.severity,
        status: live.status,
        isLive: true
      }));
      setShortages(mapped);
      notify.success('Live inventory balance recalculated against millisecond stock.');
    } catch (err) {
      console.error('Live Shortages fetch error', err);
      notify.error('Could not recalculate live shortages.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLive = () => {
    if (isLiveMode) {
      fetchShortages(selectedRunId);
    } else {
      fetchLiveShortages();
    }
  };

  const handleRunChange = (e) => {
    const nextRunId = e.target.value;
    setSelectedRunId(nextRunId);
    fetchShortages(nextRunId);
  };

  // ── 3. Action Mitigation Handler ──────────────────────────────────────────
  const handleOpenResolution = (item, defaultAction = 'Expedite PO') => {
    setResolutionModal({
      isOpen: true,
      selectedItem: item,
      actionType: defaultAction,
      referenceDocNo: ''
    });
  };

  const submitResolution = async (e) => {
    e.preventDefault();
    if (busy || !resolutionModal.selectedItem?._id) return;

    setBusy(true);
    try {
      await axios.post(`/mrp/shortages/${resolutionModal.selectedItem._id}/resolve`, {
        actionType: resolutionModal.actionType,
        referenceDocNo: resolutionModal.referenceDocNo
      });

      notify.success(`Mitigation action '${resolutionModal.actionType}' recorded successfully.`);

      setResolutionModal({
        isOpen: false,
        selectedItem: null,
        actionType: 'Expedite PO',
        referenceDocNo: ''
      });

      // Refresh appropriate view
      if (isLiveMode) {
        fetchLiveShortages();
      } else {
        fetchShortages(selectedRunId);
      }
    } catch (err) {
      console.error('Resolve shortage error', err);
      notify.error(err.response?.data?.message || 'Error recording mitigation action');
    } finally {
      setBusy(false);
    }
  };

  // ── 4. Filtering Logic ────────────────────────────────────────────────────
  const filteredShortages = shortages.filter(s => {
    const name = s.itemId?.name || '';
    const code = s.itemId?.code || '';
    const desc = s.constraintDetails?.description || '';
    const category = s.shortageCategory || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesSeverity = true;
    if (severityFilter === 'Critical') {
      matchesSeverity = s.severity === 'Critical';
    } else if (severityFilter === 'High') {
      matchesSeverity = s.severity === 'High';
    } else if (severityFilter === 'Medium') {
      matchesSeverity = s.severity === 'Medium';
    } else if (severityFilter === 'OpenOnly') {
      matchesSeverity = s.status === 'Open';
    }

    return matchesSearch && matchesSeverity;
  });

  const productionConstraints = filteredShortages.filter(s => s.shortageCategory === 'Production Constraint');
  const rawMaterialShortages = filteredShortages.filter(s => s.shortageCategory === 'Raw Material');
  const componentShortages = filteredShortages.filter(s => s.shortageCategory === 'Component');

  // ── 5. Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      paddingBottom: '40px'
    }}>
      {/* ── Top Threat Telemetry Radar ── */}
      <ShortageThreatRadar
        mrpRuns={mrpRuns}
        selectedRunId={selectedRunId}
        onRunChange={handleRunChange}
        isLiveMode={isLiveMode}
        onToggleLive={handleToggleLive}
        loading={loading}
        shortages={shortages}
      />

      {/* ── Search & Stream Filter Deck ── */}
      <ShortageFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        activeView={activeView}
        setActiveView={setActiveView}
        totalCount={shortages.length}
        filteredCount={filteredShortages.length}
      />

      {/* ── Main Deficit Views ── */}
      {activeView === 'tri' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top: Hard Production Bottlenecks */}
          <ProductionConstraintsCard
            constraints={productionConstraints}
            onOpenResolution={handleOpenResolution}
            loading={loading}
          />

          {/* Bottom Dual Grid: Raw Materials and Sub-Assemblies */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '16px'
          }}>
            <RawMaterialShortagesCard
              rawMaterials={rawMaterialShortages}
              onOpenResolution={handleOpenResolution}
              loading={loading}
            />
            <ComponentShortagesCard
              components={componentShortages}
              onOpenResolution={handleOpenResolution}
              loading={loading}
            />
          </div>
        </div>
      ) : activeView === 'constraints' ? (
        <ProductionConstraintsCard
          constraints={productionConstraints}
          onOpenResolution={handleOpenResolution}
          loading={loading}
        />
      ) : activeView === 'raw' ? (
        <RawMaterialShortagesCard
          rawMaterials={rawMaterialShortages}
          onOpenResolution={handleOpenResolution}
          loading={loading}
        />
      ) : (
        <ComponentShortagesCard
          components={componentShortages}
          onOpenResolution={handleOpenResolution}
          loading={loading}
        />
      )}

      {/* ── Mitigation Action Resolution Modal ── */}
      <ShortageResolutionModal
        isOpen={resolutionModal.isOpen}
        onClose={() => setResolutionModal(prev => ({ ...prev, isOpen: false }))}
        selectedItem={resolutionModal.selectedItem}
        actionType={resolutionModal.actionType}
        setActionType={val => setResolutionModal(prev => ({ ...prev, actionType: val }))}
        referenceDocNo={resolutionModal.referenceDocNo}
        setReferenceDocNo={val => setResolutionModal(prev => ({ ...prev, referenceDocNo: val }))}
        onSubmit={submitResolution}
        busy={busy}
      />
    </div>
  );
};

export default ShortageAnalysis;