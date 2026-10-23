import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';

// Modular Subcomponents
import { RecommendationsTelemetryBar } from './recommendations/RecommendationsTelemetryBar';
import { RecommendationsFilterBar } from './recommendations/RecommendationsFilterBar';
import { PurchaseSuggestionsCard } from './recommendations/PurchaseSuggestionsCard';
import { ProductionSuggestionsCard } from './recommendations/ProductionSuggestionsCard';
import { ReschedulingSuggestionsCard } from './recommendations/ReschedulingSuggestionsCard';

const MrpRecommendations = () => {
  // Data State
  const [mrpRuns, setMrpRuns] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');

  // Loaders & Busy States
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [batchBusy, setBatchBusy] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Converted' | 'Dismissed'
  const [activeView, setActiveView] = useState('tri'); // 'tri' | 'purchase' | 'production' | 'reschedule'

  // Last Generated Order Banner
  const [lastGenerated, setLastGenerated] = useState(null);

  // ── 1. Initial Load ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRuns();
  }, []);

  // ── 2. Data Fetchers ───────────────────────────────────────────────────────
  const fetchRuns = async () => {
    try {
      const res = await axios.get('/mrp/run');
      const rawRuns = res.data.data || [];
      const runs = [...rawRuns].sort((a, b) => (b.runNo || '').localeCompare(a.runNo || ''));
      setMrpRuns(runs);

      if (runs.length > 0) {
        setSelectedRunId(runs[0]._id);
        fetchRecommendations(runs[0]._id);
      }
    } catch (err) {
      console.error('MRP Runs fetch error', err);
      notify.error('Could not load MRP runs.');
    }
  };

  const fetchRecommendations = async (runId) => {
    if (!runId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/mrp/recommendations?runId=${runId}`);
      setRecommendations(res.data.data || []);
    } catch (err) {
      console.error('Recommendations fetch error', err);
      notify.error('Could not load recommendations for selected run.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunChange = (e) => {
    const nextRunId = e.target.value;
    setSelectedRunId(nextRunId);
    fetchRecommendations(nextRunId);
  };

  // ── 3. Single Conversion Handler ──────────────────────────────────────────
  const convertAction = async (id) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await axios.post(`/mrp/recommendations/${id}/convert`);
      const resultData = res.data?.data;
      const docType = resultData?.generatedDocType || 'Order';
      const docNo = resultData?.generatedDocNumber || '';

      notify.success(`${docType} ${docNo ? docNo + ' ' : ''}generated and released into ERP successfully!`);
      if (docNo) {
        setLastGenerated({ docType, docNo, timestamp: new Date().toLocaleTimeString() });
      }

      await fetchRecommendations(selectedRunId);
    } catch (err) {
      console.error('Convert recommendation error', err);
      notify.error(err.response?.data?.message || 'Error converting recommendation into order.');
    } finally {
      setBusyId(null);
    }
  };

  // ── 4. Batch Conversion Handler ───────────────────────────────────────────
  const handleBatchConvert = async () => {
    const pendingItems = recommendations.filter(r => r.status === 'Pending');
    if (pendingItems.length === 0 || batchBusy) return;

    setBatchBusy(true);
    let successCount = 0;
    let failedCount = 0;

    for (const item of pendingItems) {
      try {
        await axios.post(`/mrp/recommendations/${item._id}/convert`);
        successCount++;
      } catch (err) {
        failedCount++;
      }
    }

    if (successCount > 0) {
      notify.success(`Batch Conversion Complete: ${successCount} order(s) successfully synthesized!`);
    }
    if (failedCount > 0) {
      notify.warn(`${failedCount} recommendation(s) could not be converted (missing supplier or parameter).`);
    }

    await fetchRecommendations(selectedRunId);
    setBatchBusy(false);
  };

  // ── 5. Filtering Logic ────────────────────────────────────────────────────
  const filteredRecommendations = recommendations.filter(r => {
    const name = r.itemId?.name || '';
    const code = r.itemId?.code || '';
    const action = r.actionType || '';
    const linked = r.referenceOrderId?.poNumber || r.referenceOrderId?.workOrderNumber || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      linked.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== 'All') {
      matchesStatus = r.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  const purchaseSuggestions = filteredRecommendations.filter(
    r => r.suggestionCategory === 'Purchase' && r.actionType === 'Create New'
  );
  const productionSuggestions = filteredRecommendations.filter(
    r => r.suggestionCategory === 'Production' && r.actionType === 'Create New'
  );
  const reschedulingSuggestions = filteredRecommendations.filter(
    r => r.actionType !== 'Create New'
  );

  const pendingCount = recommendations.filter(r => r.status === 'Pending').length;

  // ── 6. Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      paddingBottom: '40px'
    }}>
      {/* ── Top Order Synthesis Telemetry Deck ── */}
      <RecommendationsTelemetryBar
        mrpRuns={mrpRuns}
        selectedRunId={selectedRunId}
        onRunChange={handleRunChange}
        recommendations={recommendations}
        onBulkConvert={handleBatchConvert}
        bulkConverting={batchBusy}
      />

      {/* ── Generated Order Toast Banner ── */}
      {lastGenerated && (
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
            ⚡ <strong>ERP Document Generated:</strong> Official {lastGenerated.docType} <strong>{lastGenerated.docNo}</strong> created at {lastGenerated.timestamp} and registered into procurement/shop floor dispatch.
          </span>
          <button
            type="button"
            onClick={() => setLastGenerated(null)}
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

      {/* ── Search, Status & Stream Filter Deck ── */}
      <RecommendationsFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        activeView={activeView}
        setActiveView={setActiveView}
        pendingCount={pendingCount}
        onBatchConvert={handleBatchConvert}
        batchBusy={batchBusy}
      />

      {/* ── Main Order Streams ── */}
      {activeView === 'tri' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Dual: Purchase Suggestions (Buy) & Production Suggestions (Make) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '16px'
          }}>
            <PurchaseSuggestionsCard
              suggestions={purchaseSuggestions}
              onConvert={convertAction}
              busyId={busyId}
              loading={loading}
            />
            <ProductionSuggestionsCard
              suggestions={productionSuggestions}
              onConvert={convertAction}
              busyId={busyId}
              loading={loading}
            />
          </div>

          {/* Bottom: Rescheduling Adjustments Deck */}
          <ReschedulingSuggestionsCard
            suggestions={reschedulingSuggestions}
            onConvert={convertAction}
            busyId={busyId}
            loading={loading}
          />
        </div>
      ) : activeView === 'purchase' ? (
        <PurchaseSuggestionsCard
          suggestions={purchaseSuggestions}
          onConvert={convertAction}
          busyId={busyId}
          loading={loading}
        />
      ) : activeView === 'production' ? (
        <ProductionSuggestionsCard
          suggestions={productionSuggestions}
          onConvert={convertAction}
          busyId={busyId}
          loading={loading}
        />
      ) : (
        <ReschedulingSuggestionsCard
          suggestions={reschedulingSuggestions}
          onConvert={convertAction}
          busyId={busyId}
          loading={loading}
        />
      )}
    </div>
  );
};

export default MrpRecommendations;