import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

// Subcomponents
import { ConsolidationTelemetryBar } from './consolidation/ConsolidationTelemetryBar';
import { ConsolidationRunMatrix } from './consolidation/ConsolidationRunMatrix';
import { DemandFusionWaterfall } from './consolidation/DemandFusionWaterfall';
import { ConsolidationLinesTable } from './consolidation/ConsolidationLinesTable';
import { TraceabilityLedger } from './consolidation/TraceabilityLedger';
import { GenerateRunModal } from './consolidation/GenerateRunModal';
import { AdjustDemandModal } from './consolidation/AdjustDemandModal';
import { LockRunModal } from './consolidation/LockRunModal';

const DemandConsolidation = () => {
  // Submission lock state
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  // State
  const [runs, setRuns] = useState([]);
  const [lines, setLines] = useState([]);
  const [traceLinks, setTraceLinks] = useState([]);

  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [loadingTrace, setLoadingTrace] = useState(false);

  // Modal State
  const [modal, setModal] = useState({ type: null, data: null, editId: null, extra: null });

  // ── Load Initial Data ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchRuns();
  }, []);

  // ── Data Fetchers ──────────────────────────────────────────────────────────
  const fetchRuns = async (preferredRunId = null) => {
    setLoading(true);
    try {
      const res = await axios.get('/demand/consolidation-runs');
      const list = res.data.data || [];
      setRuns(list);

      if (list.length > 0) {
        const toSelect = preferredRunId
          ? list.find(r => r._id === preferredRunId) || list[0]
          : (selectedRun ? (list.find(r => r._id === selectedRun._id) || list[0]) : list[0]);

        setSelectedRun(toSelect);
        fetchLines(toSelect._id);
      } else {
        setSelectedRun(null);
        setLines([]);
        setTraceLinks([]);
      }
    } catch (e) {
      console.error('Fetch runs error', e);
      notify.error('Could not load consolidation runs.');
    }
    setLoading(false);
  };

  const fetchLines = useCallback(async (runId) => {
    setLoadingLines(true);
    try {
      const res = await axios.get(`/demand/consolidation-runs/${runId}/lines`);
      const data = res.data.data || [];
      setLines(data);
      if (data.length > 0) {
        setSelectedLine(data[0]);
        fetchTraceLinks(data[0]._id);
      } else {
        setSelectedLine(null);
        setTraceLinks([]);
      }
    } catch (e) {
      console.error('Fetch lines error', e);
    }
    setLoadingLines(false);
  }, []);

  const fetchTraceLinks = useCallback(async (lineId) => {
    setLoadingTrace(true);
    try {
      const res = await axios.get(`/demand/consolidation-lines/${lineId}/traceability`);
      setTraceLinks(res.data.data || []);
    } catch (e) {
      console.error('Fetch traceability error', e);
    }
    setLoadingTrace(false);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleRunSelect = (run) => {
    setSelectedRun(run);
    fetchLines(run._id);
  };

  const handleLineSelect = (line) => {
    setSelectedLine(line);
    fetchTraceLinks(line._id);
  };

  const openModal = (type, data = null, editId = null, extra = null) => {
    setModal({ type, data: data || {}, editId, extra });
  };

  const updateField = (field, value) => {
    setModal(prev => ({ ...prev, data: { ...prev.data, [field]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { type, data, editId } = modal;

    try {
      if (type === 'generate') {
        const res = await axios.post('/demand/consolidation-runs/generate', data);
        notify.success(res.data.message || 'Demand consolidation run synthesized successfully.');
        const newRunId = res.data.data?._id;
        fetchRuns(newRunId);
      } else if (type === 'edit-line') {
        await axios.put(`/demand/consolidation-lines/${editId}`, {
          manualAdjustmentQty: Number(data.manualAdjustmentQty)
        });
        notify.success('Manual demand adjustment updated.');
        if (selectedRun) fetchLines(selectedRun._id);
      } else if (type === 'update-status') {
        await axios.put(`/demand/consolidation-runs/${editId}/status`, { status: data.status });
        notify.success('Run permanently committed and locked for MRP.');
        fetchRuns(editId);
        setSelectedRun(prev => ({ ...prev, status: data.status }));
      }
      setModal({ type: null, data: null, editId: null, extra: null });
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error processing request.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      paddingBottom: '40px'
    }}>
      {/* ── 1. Top Convergence Telemetry Deck ── */}
      <ConsolidationTelemetryBar
        runs={runs}
        selectedRun={selectedRun}
        lines={lines}
        onOpenGenerateModal={() => openModal('generate', {
          period: '',
          targetHorizonStart: new Date().toISOString().split('T')[0],
          targetHorizonEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })}
        onRefresh={() => {
          fetchRuns(selectedRun?._id);
          if (selectedRun) fetchLines(selectedRun._id);
        }}
      />

      {/* ── 2. Master Consolidation Run Queue Matrix ── */}
      <ConsolidationRunMatrix
        runs={runs}
        selectedRun={selectedRun}
        onSelectRun={handleRunSelect}
        onOpenLockModal={(run) => openModal('update-status', { status: 'Consumed_By_MRP' }, run._id, run)}
        loading={loading}
        onOpenGenerateModal={() => openModal('generate', {
          period: '',
          targetHorizonStart: new Date().toISOString().split('T')[0],
          targetHorizonEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })}
      />

      {/* ── 3. Visual Demand Convergence Formula / Waterfall ── */}
      {selectedRun && (
        <DemandFusionWaterfall
          selectedRun={selectedRun}
          lines={lines}
          selectedLine={selectedLine}
        />
      )}

      {/* ── 4. Consolidated Part-by-Part Demand Lines Matrix ── */}
      {selectedRun && (
        <ConsolidationLinesTable
          lines={lines}
          selectedLine={selectedLine}
          onSelectLine={handleLineSelect}
          onOpenEditAdjustmentModal={(line) => openModal('edit-line', {
            manualAdjustmentQty: line.manualAdjustmentQty
          }, line._id, line)}
          selectedRun={selectedRun}
          loading={loadingLines}
        />
      )}

      {/* ── 5. Source Traceability & Consumption Ledger ── */}
      {selectedRun && (
        <TraceabilityLedger
          traceLinks={traceLinks}
          selectedLine={selectedLine}
          loading={loadingTrace}
        />
      )}

      {/* ── MODALS ── */}

      {/* Modal A: Generate Consolidation Run */}
      <GenerateRunModal
        isOpen={modal.type === 'generate'}
        onClose={() => setModal({ type: null, data: null, editId: null, extra: null })}
        onSubmit={e => runBusy(() => handleSubmit(e))}
        data={modal.data || {}}
        updateField={updateField}
        busy={busy}
      />

      {/* Modal B: Adjust Demand by Hand */}
      <AdjustDemandModal
        isOpen={modal.type === 'edit-line'}
        onClose={() => setModal({ type: null, data: null, editId: null, extra: null })}
        onSubmit={e => runBusy(() => handleSubmit(e))}
        data={modal.data || {}}
        updateField={updateField}
        line={modal.extra}
        busy={busy}
      />

      {/* Modal C: Lock Run for MRP */}
      <LockRunModal
        isOpen={modal.type === 'update-status'}
        onClose={() => setModal({ type: null, data: null, editId: null, extra: null })}
        onSubmit={e => runBusy(() => handleSubmit(e))}
        run={modal.extra || selectedRun}
        busy={busy}
      />
    </div>
  );
};

export default DemandConsolidation;
