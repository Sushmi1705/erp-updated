import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';

// Modular Subcomponents
import { MrpTelemetryBar } from './execution/MrpTelemetryBar';
import { MrpRunMatrixDeck } from './execution/MrpRunMatrixDeck';
import { MrpFlightDeck } from './execution/MrpFlightDeck';
import { ExplodedRequirementsSection } from './execution/ExplodedRequirementsSection';
import { InventorySnapshotSection } from './execution/InventorySnapshotSection';
import { ExecuteMrpModal } from './execution/ExecuteMrpModal';

const MrpExecution = () => {
  // Data State
  const [mrpRuns, setMrpRuns] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [consolidations, setConsolidations] = useState([]);

  // Loaders
  const [loading, setLoading] = useState(false);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Selection & UI State
  const [selectedRun, setSelectedRun] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [activeView, setActiveView] = useState('split'); // 'split' | 'reqs' | 'snaps'

  // ── 1. Initial Load ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRuns();
    fetchDependencies();
  }, []);

  // ── 2. Fetchers ────────────────────────────────────────────────────────────
  const fetchDependencies = async () => {
    try {
      const res = await axios.get('/demand/consolidation-runs');
      const runs = res.data.data || [];
      const periods = [...new Set(runs.map(c => c.targetHorizonStart ? new Date(c.targetHorizonStart).toISOString().slice(0, 7) : ''))].filter(Boolean);
      const uniquePeriods = periods.length > 0
        ? periods
        : ['Q1-2026', 'Q2-2026', 'Q3-2026', 'Q4-2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'];

      setConsolidations(uniquePeriods);
      setSelectedPeriod(prev => prev || uniquePeriods[0]);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };

  const fetchRuns = async (preferredId = null) => {
    setLoading(true);
    try {
      const res = await axios.get('/mrp/run');
      const list = res.data.data || [];
      setMrpRuns(list);

      if (list.length > 0) {
        const toSelect = preferredId
          ? list.find(r => r._id === preferredId) || list[0]
          : (selectedRun ? (list.find(r => r._id === selectedRun._id) || list[0]) : list[0]);

        handleRunSelect(toSelect);
      } else {
        setSelectedRun(null);
        setRequirements([]);
        setSnapshots([]);
      }
    } catch (err) {
      console.error('MRP Runs fetch error', err);
      notify.error('Could not load MRP runs.');
    }
    setLoading(false);
  };

  const handleRunSelect = (run) => {
    setSelectedRun(run);
    fetchRequirements(run._id);
    fetchSnapshots(run._id);
  };

  const fetchRequirements = async (runId) => {
    setLoadingReqs(true);
    try {
      const res = await axios.get(`/mrp/requirements?runId=${runId}`);
      setRequirements(res.data.data || []);
    } catch (err) {
      console.error('Requirements fetch error', err);
    }
    setLoadingReqs(false);
  };

  const fetchSnapshots = async (runId) => {
    setLoadingSnaps(true);
    try {
      const res = await axios.get(`/mrp/snapshots?runId=${runId}`);
      setSnapshots(res.data.data || []);
    } catch (err) {
      console.error('Snapshots fetch error', err);
    }
    setLoadingSnaps(false);
  };

  // ── 3. Execute Engine Run ──────────────────────────────────────────────────
  const handleExecute = async (e) => {
    e.preventDefault();
    if (executing || !selectedPeriod) return;

    setExecuting(true);
    try {
      const res = await axios.post('/mrp/run/execute', {
        period: selectedPeriod
      });

      setIsModalOpen(false);
      const newRun = res.data?.data;
      const runNo = newRun?.runNo || 'MRP Run';

      notify.success(`MRP Engine run ${runNo} executed successfully! Generated requirements and stock snapshot.`);
      setLastRun(runNo);

      await fetchRuns(newRun?._id);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error executing MRP Run');
    } finally {
      setExecuting(false);
    }
  };

  // ── 4. Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      paddingBottom: '40px'
    }}>
      {/* ── Top Industrial Telemetry Reactor ── */}
      <MrpTelemetryBar
        mrpRuns={mrpRuns}
        selectedRun={selectedRun}
        requirements={requirements}
        snapshots={snapshots}
        onOpenExecuteModal={() => setIsModalOpen(true)}
        onRefresh={() => {
          fetchRuns(selectedRun?._id);
        }}
        executing={executing}
      />

      {/* ── Calculation Finished Toast Banner ── */}
      {lastRun && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 18px',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          fontSize: '13px'
        }}>
          <span>
            ⚡ <strong>MRP Calculation Complete:</strong> Snapshot <strong>{lastRun}</strong> generated. Exploded requirements, inventory snapshots, and suggested purchase/work orders are now active.
          </span>
          <button
            type="button"
            onClick={() => setLastRun(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#059669',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Master MRP Calculation Run Queue ── */}
      <MrpRunMatrixDeck
        mrpRuns={mrpRuns}
        selectedRun={selectedRun}
        onSelectRun={handleRunSelect}
        loading={loading}
        onOpenExecuteModal={() => setIsModalOpen(true)}
      />

      {/* ── Selected Run Flight Deck & Downstream Bridges ── */}
      {selectedRun && (
        <>
          <MrpFlightDeck
            selectedRun={selectedRun}
            requirements={requirements}
            snapshots={snapshots}
            activeView={activeView}
            setActiveView={setActiveView}
          />

          {/* ── Main Output: Exploded BOM & Inventory Snapshot Views ── */}
          {activeView === 'split' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
              gap: '16px'
            }}>
              {/* Exploded BOM Tree */}
              <ExplodedRequirementsSection
                requirements={requirements}
                selectedRun={selectedRun}
                loading={loadingReqs}
              />

              {/* Point-in-Time Inventory Snapshot */}
              <InventorySnapshotSection
                snapshots={snapshots}
                selectedRun={selectedRun}
                loading={loadingSnaps}
              />
            </div>
          ) : activeView === 'reqs' ? (
            <ExplodedRequirementsSection
              requirements={requirements}
              selectedRun={selectedRun}
              loading={loadingReqs}
            />
          ) : (
            <InventorySnapshotSection
              snapshots={snapshots}
              selectedRun={selectedRun}
              loading={loadingSnaps}
            />
          )}
        </>
      )}

      {/* ── Launch Engine Modal ── */}
      <ExecuteMrpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleExecute}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        consolidations={consolidations}
        executing={executing}
      />
    </div>
  );
};

export default MrpExecution;