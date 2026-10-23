import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

// Modular Subcomponents
import { ForecastTelemetryBar } from './forecasting/ForecastTelemetryBar';
import { ForecastMatrixDeck } from './forecasting/ForecastMatrixDeck';
import { ForecastFlightDeck } from './forecasting/ForecastFlightDeck';
import { ForecastTrajectoryChart } from './forecasting/ForecastTrajectoryChart';
import { ForecastLinesSection } from './forecasting/ForecastLinesSection';
import { ForecastDualPanels } from './forecasting/ForecastDualPanels';
import { HistoricalSalesView } from './forecasting/HistoricalSalesView';
import { WhatIfSimulatorModal } from './forecasting/WhatIfSimulatorModal';

const DemandForecasting = () => {
  // Busy state lock for async submissions
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  // Reference Data
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [uoms, setUoms] = useState([]);

  // Forecast Headers
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Drilldown Selection State
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [lines, setLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [historyRefs, setHistoryRefs] = useState([]);
  const [adjustments, setAdjustments] = useState([]);

  // Views & Modals
  const [showHistorical, setShowHistorical] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);

  // Modal Controller State
  const [modal, setModal] = useState({
    type: null,
    data: null,
    editId: null
  });

  // ── 1. Load Master References ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [p, c, u] = await Promise.all([
          axios.get('/master/product').catch(() => ({ data: { data: [] } })),
          axios.get('/master/customer').catch(() => ({ data: { data: [] } })),
          axios.get('/master/uom').catch(() => ({ data: { data: [] } }))
        ]);
        setProducts(p.data?.data || []);
        setCustomers(c.data?.data || []);
        setUoms(u.data?.data || []);
      } catch (e) {
        console.error('References error', e);
      }
    })();
    fetchHeaders();
  }, []);

  // ── 2. Data Fetchers ───────────────────────────────────────────────────────
  const fetchHeaders = async (preferredId = null) => {
    setLoading(true);
    try {
      const res = await axios.get('/demand/forecasts');
      const list = res.data.data || [];
      setHeaders(list);

      // Auto-select first or preferred
      if (list.length > 0) {
        const toSelect = preferredId
          ? list.find(h => h._id === preferredId) || list[0]
          : (selectedHeader ? (list.find(h => h._id === selectedHeader._id) || list[0]) : list[0]);
        
        setSelectedHeader(toSelect);
        fetchLines(toSelect._id);
        fetchHistoryRefs(toSelect._id);
      } else {
        setSelectedHeader(null);
        setLines([]);
        setHistoryRefs([]);
      }
    } catch (e) {
      console.error('Fetch headers error', e);
      notify.error('Could not load forecasts.');
    }
    setLoading(false);
  };

  const fetchLines = useCallback(async (headerId) => {
    try {
      const res = await axios.get(`/demand/forecasts/${headerId}/lines`);
      const data = res.data.data || [];
      setLines(data);
      if (data.length > 0) {
        setSelectedLine(data[0]);
        fetchAdjustments(data[0]._id);
      } else {
        setSelectedLine(null);
        setAdjustments([]);
      }
    } catch (e) {
      console.error('Fetch lines error', e);
    }
  }, []);

  const fetchHistoryRefs = useCallback(async (headerId) => {
    try {
      const res = await axios.get(`/demand/forecasts/${headerId}/history`);
      setHistoryRefs(res.data.data || []);
    } catch (e) {
      console.error('Fetch history error', e);
    }
  }, []);

  const fetchAdjustments = useCallback(async (lineId) => {
    try {
      const res = await axios.get(`/demand/forecast-lines/${lineId}/adjustments`);
      setAdjustments(res.data.data || []);
    } catch (e) {
      console.error('Fetch adjustments error', e);
    }
  }, []);

  const fetchHistorical = async () => {
    setHistoricalLoading(true);
    try {
      const res = await axios.get('/demand/historical');
      setHistoricalData(res.data.data || []);
    } catch (e) {
      console.error('Fetch historical actuals error', e);
    }
    setHistoricalLoading(false);
  };

  // ── 3. Selection Handlers ──────────────────────────────────────────────────
  const handleSelectHeader = (row) => {
    setSelectedHeader(row);
    fetchLines(row._id);
    fetchHistoryRefs(row._id);
  };

  const handleSelectLine = (line) => {
    setSelectedLine(line);
    fetchAdjustments(line._id);
  };

  // ── 4. Quick Status Advance (Workflow Gatekeeper) ───────────────────────────
  const handleQuickAdvanceStatus = async (header, targetStatus) => {
    try {
      // Validate statistical algorithm baseline if advancing to Review or Finalized
      const isStat = ['Moving Average', 'Exponential Smoothing', 'ML-Prophet'].includes(header.algorithmUsed);
      if (isStat && (targetStatus === 'Pending Review' || targetStatus === 'Finalized')) {
        const histRes = await axios.get(`/demand/forecasts/${header._id}/history`);
        const count = histRes.data.data?.length || 0;
        if (count < 12) {
          notify.error(`Cannot advance to ${targetStatus}: ${header.algorithmUsed} requires at least 12 historical reference periods (Found ${count}).`);
          return;
        }
      }

      await axios.put(`/demand/forecasts/${header._id}`, { status: targetStatus });
      notify.success(`Forecast ${header.forecastNumber} updated to ${targetStatus}`);
      fetchHeaders(header._id);
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Status update failed.');
    }
  };

  // ── 5. What-If Batch Simulation Applicator ─────────────────────────────────
  const handleApplyWhatIfSimulation = async (percentage) => {
    if (!selectedHeader || isFinalized) return;
    const factor = 1 + percentage / 100;

    let appliedCount = 0;
    for (const line of lines) {
      const curFinal = Number(line.finalForecastQty) || 0;
      const simFinal = Math.round(curFinal * factor);
      const newManual = simFinal - (Number(line.systemCalculatedQty) || 0);

      try {
        await axios.put(`/demand/forecast-lines/${line._id}`, {
          manualAdjustedQty: newManual,
          finalForecastQty: simFinal,
          reasonCode: 'Market Trend',
          notes: `What-If Simulation (${percentage > 0 ? `+${percentage}%` : `${percentage}%`})`
        });
        appliedCount++;
      } catch (err) {
        console.error('Error updating simulated line:', err);
      }
    }

    notify.success(`Applied ${percentage > 0 ? `+${percentage}%` : `${percentage}%`} simulation across ${appliedCount} lines.`);
    fetchLines(selectedHeader._id);
    fetchHeaders(selectedHeader._id);
  };

  // ── 6. Save & Delete Handlers ──────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const { type, data, editId } = modal;

    try {
      if (type === 'header') {
        if (editId) {
          await axios.put(`/demand/forecasts/${editId}`, data);
          notify.success('Forecast specifications updated.');
        } else {
          await axios.post('/demand/forecasts', data);
          notify.success('Forecast model created.');
        }
        fetchHeaders(editId || undefined);
      } else if (type === 'line') {
        if (editId) {
          await axios.put(`/demand/forecast-lines/${editId}`, data);
          notify.success('Forecast bucket updated.');
        } else {
          await axios.post(`/demand/forecasts/${selectedHeader._id}/lines`, data);
          notify.success('Forecast bucket added.');
        }
        fetchLines(selectedHeader._id);
        fetchHeaders(selectedHeader._id);
      } else if (type === 'history') {
        await axios.post(`/demand/forecasts/${selectedHeader._id}/history`, data);
        notify.success('Historical baseline reference added.');
        fetchHistoryRefs(selectedHeader._id);
      }

      setModal({ type: null, data: null, editId: null });
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Error saving record');
    }
  };

  const handleDeleteLine = async (lineId) => {
    if (!await confirmAction('Delete this forecast line item?')) return;
    try {
      await axios.delete(`/demand/forecast-lines/${lineId}`);
      notify.success('Line item removed.');
      fetchLines(selectedHeader._id);
      fetchHeaders(selectedHeader._id);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error deleting line');
    }
  };

  const handleDeleteHistory = async (refId) => {
    if (!await confirmAction('Delete this historical training reference?')) return;
    try {
      await axios.delete(`/demand/history-refs/${refId}`);
      notify.success('Historical reference removed.');
      fetchHistoryRefs(selectedHeader._id);
    } catch (err) {
      notify.error('Could not delete history reference.');
    }
  };

  // ── 7. Modal Open Helpers ──────────────────────────────────────────────────
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
      data: {
        ...m.data,
        [field]: value
      }
    }));
  };

  const newFCNumber = () => 'FC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const isFinalized = selectedHeader?.status === 'Finalized';

  // ── 8. Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      paddingBottom: '40px'
    }}>
      {/* ── TOP TELEMETRY OBSERVATORY BAR ─────────────────────────────────── */}
      <ForecastTelemetryBar
        showHistorical={showHistorical}
        setShowHistorical={(val) => {
          setShowHistorical(val);
          if (val) fetchHistorical();
        }}
        headers={headers}
        lines={lines}
        onOpenCreateModal={() => openModal('header', {
          forecastNumber: newFCNumber(),
          forecastType: 'Product',
          algorithmUsed: 'Manual Entry',
          status: 'Draft',
          totalAdjustedQty: 0
        })}
        onRefresh={() => {
          fetchHeaders(selectedHeader?._id);
          if (showHistorical) fetchHistorical();
        }}
      />

      {/* ── MAIN VIEW: Projections Lab vs Historical Actuals ───────────────── */}
      {showHistorical ? (
        <HistoricalSalesView
          historicalData={historicalData}
          loading={historicalLoading}
        />
      ) : (
        <>
          {/* A. Master Forecast Portfolio Queue (Deck) */}
          <ForecastMatrixDeck
            headers={headers}
            selectedHeader={selectedHeader}
            onSelectHeader={handleSelectHeader}
            onOpenEditModal={(header) => openModal('header', {
              forecastNumber: header.forecastNumber,
              forecastType: header.forecastType,
              targetEntityId: header.targetEntityId,
              forecastPeriod: header.forecastPeriod,
              algorithmUsed: header.algorithmUsed,
              status: header.status
            }, header._id)}
            onOpenCreateModal={() => openModal('header', {
              forecastNumber: newFCNumber(),
              forecastType: 'Product',
              algorithmUsed: 'Manual Entry',
              status: 'Draft',
              totalAdjustedQty: 0
            })}
            onQuickAdvanceStatus={handleQuickAdvanceStatus}
            loading={loading}
            customers={customers}
            products={products}
          />

          {/* B. Selected Forecast Flight Deck Controls */}
          {selectedHeader && (
            <>
              <ForecastFlightDeck
                header={selectedHeader}
                lines={lines}
                historyRefs={historyRefs}
                isFinalized={isFinalized}
                onOpenAddLineModal={() => openModal('line', {
                  timeBucketDate: new Date().toISOString().split('T')[0],
                  systemCalculatedQty: 0,
                  manualAdjustedQty: 0,
                  finalForecastQty: 0,
                  confidenceScorePercentage: 95
                })}
                onOpenEditModal={(h) => openModal('header', {
                  forecastNumber: h.forecastNumber,
                  forecastType: h.forecastType,
                  targetEntityId: h.targetEntityId,
                  forecastPeriod: h.forecastPeriod,
                  algorithmUsed: h.algorithmUsed,
                  status: h.status
                }, h._id)}
                onAdvanceStatus={handleQuickAdvanceStatus}
                onOpenWhatIfModal={() => setIsWhatIfOpen(true)}
                customers={customers}
                products={products}
              />

              {/* C. Dynamic SVG Time-Series Trajectory & Confidence Envelope */}
              <ForecastTrajectoryChart
                lines={lines}
                forecastNumber={selectedHeader.forecastNumber}
                algorithm={selectedHeader.algorithmUsed}
              />

              {/* D. Monthly Time-Bucket Demand Items */}
              <ForecastLinesSection
                lines={lines}
                selectedLine={selectedLine}
                onSelectLine={handleSelectLine}
                onOpenEditLineModal={(row) => !isFinalized && openModal('line', {
                  timeBucketDate: row.timeBucketDate ? new Date(row.timeBucketDate).toISOString().split('T')[0] : '',
                  productId: row.productId?._id || row.productId,
                  uomId: row.uomId?._id || row.uomId,
                  systemCalculatedQty: row.systemCalculatedQty,
                  manualAdjustedQty: row.manualAdjustedQty,
                  finalForecastQty: row.finalForecastQty,
                  confidenceScorePercentage: row.confidenceScorePercentage,
                  reasonCode: row.reasonCode || '',
                  notes: row.notes || ''
                }, row._id)}
                onDeleteLine={handleDeleteLine}
                onOpenAddLineModal={() => openModal('line', {
                  timeBucketDate: new Date().toISOString().split('T')[0],
                  systemCalculatedQty: 0,
                  manualAdjustedQty: 0,
                  finalForecastQty: 0,
                  confidenceScorePercentage: 95
                })}
                isFinalized={isFinalized}
                forecastNumber={selectedHeader.forecastNumber}
                period={selectedHeader.forecastPeriod}
                products={products}
                uoms={uoms}
              />

              {/* E. Dual Panels: Historical Calibration Tray (Left) + Override Audit (Right) */}
              <ForecastDualPanels
                header={selectedHeader}
                historyRefs={historyRefs}
                adjustments={adjustments}
                selectedLine={selectedLine}
                onOpenAddHistoryModal={() => openModal('history', {
                  sourceModule: 'Sales Orders',
                  sourceRecordId: '',
                  historicalPeriodDate: new Date().toISOString().split('T')[0],
                  quantityConsumed: 0
                })}
                onDeleteHistory={handleDeleteHistory}
              />
            </>
          )}
        </>
      )}

      {/* ── 9. MODALS ──────────────────────────────────────────────────────── */}

      {/* Modal A: Forecast Header */}
      <Modal
        isOpen={modal.type === 'header'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Forecast Specifications' : 'Create Forecast Horizon Model'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div className="input-group">
              <label className="input-label">Forecast Number *</label>
              <input
                className="input-field"
                required
                readOnly
                value={modal.data?.forecastNumber || ''}
                onChange={e => updateField('forecastNumber', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Forecast Period * (e.g. Oct 2026 - Dec 2026)</label>
              <input
                className="input-field"
                required
                placeholder="e.g. Q4-2026 or Oct 2026 - Dec 2026"
                value={modal.data?.forecastPeriod || ''}
                onChange={e => updateField('forecastPeriod', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Forecast Scope *</label>
              <select
                className="input-field"
                required
                value={modal.data?.forecastType || 'Product'}
                onChange={e => updateField('forecastType', e.target.value)}
              >
                {['Customer', 'Product', 'Product Family', 'Region'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Predictive Algorithm *</label>
              <select
                className="input-field"
                required
                value={modal.data?.algorithmUsed || 'Manual Entry'}
                onChange={e => updateField('algorithmUsed', e.target.value)}
              >
                {['Moving Average', 'Exponential Smoothing', 'ML-Prophet', 'Manual Entry'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Target Entity Selectors */}
            {modal.data?.forecastType === 'Customer' && (
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Target Customer * (Active Customers)</label>
                <select
                  className="input-field"
                  required
                  value={modal.data?.targetEntityId || ''}
                  onChange={e => updateField('targetEntityId', e.target.value)}
                >
                  <option value="" disabled>Choose a customer</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            )}

            {modal.data?.forecastType === 'Product' && (
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Target Product * (Active Finished Parts)</label>
                <select
                  className="input-field"
                  required
                  value={modal.data?.targetEntityId || ''}
                  onChange={e => updateField('targetEntityId', e.target.value)}
                >
                  <option value="" disabled>Choose a product</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
            )}

            {(modal.data?.forecastType === 'Product Family' || modal.data?.forecastType === 'Region') && (
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Target Scope Identifier *</label>
                <input
                  className="input-field"
                  required
                  placeholder="e.g. REGION-SOUTH or FAMILY-MACHINED-SHAFTS"
                  value={modal.data?.targetEntityId || ''}
                  onChange={e => updateField('targetEntityId', e.target.value)}
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">MRP Lifecycle Status</label>
              <select
                className="input-field"
                value={modal.data?.status || 'Draft'}
                onChange={e => updateField('status', e.target.value)}
              >
                {['Draft', 'Calculating', 'Pending Review', 'Finalized', 'Obsolete'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {modal.data?.algorithmUsed && modal.data.algorithmUsed !== 'Manual Entry' && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '11px',
              color: '#b45309',
              lineHeight: 1.4
            }}>
              ⚠️ <strong>Statistical Baseline Mandate:</strong> {modal.data.algorithmUsed} requires at least 12 past periods fed via the Historical Calibration Tray before final consensus lock.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
              disabled={busy}
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', border: 'none' }}
            >
              {busy ? 'Saving…' : (modal.editId ? 'Update Specifications' : 'Create Horizon Model')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal B: Forecast Line Item */}
      <Modal
        isOpen={modal.type === 'line'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Monthly Demand Bucket' : 'Add Monthly Demand Bucket'}
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div className="input-group">
              <label className="input-label">Bucket Month *</label>
              <input
                type="date"
                className="input-field"
                required
                value={modal.data?.timeBucketDate || ''}
                onChange={e => updateField('timeBucketDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Product Component</label>
              <select
                className="input-field"
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
              <label className="input-label">System Baseline Quantity</label>
              <input
                type="number"
                className="input-field"
                min="0"
                step="any"
                value={modal.data?.systemCalculatedQty ?? 0}
                onChange={e => updateField('systemCalculatedQty', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Manual Adjustment (+ / - units)</label>
              <input
                type="number"
                className="input-field"
                step="any"
                value={modal.data?.manualAdjustedQty ?? 0}
                onChange={e => updateField('manualAdjustedQty', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Final Forecast Quantity * (Fed to MRP)</label>
              <input
                type="number"
                className="input-field"
                required
                min="0"
                step="any"
                value={modal.data?.finalForecastQty ?? 0}
                onChange={e => updateField('finalForecastQty', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confidence Score (%)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                max="100"
                step="any"
                value={modal.data?.confidenceScorePercentage ?? 95}
                onChange={e => updateField('confidenceScorePercentage', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Unit of Measure (UOM)</label>
              <select
                className="input-field"
                value={modal.data?.uomId || ''}
                onChange={e => updateField('uomId', e.target.value)}
              >
                <option value="" disabled>Choose a unit</option>
                {uoms.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.symbol})</option>
                ))}
              </select>
            </div>

            {/* Mandatory Override Reason when Final != System */}
            {modal.data?.finalForecastQty !== undefined &&
             modal.data?.systemCalculatedQty !== undefined &&
             parseFloat(modal.data.finalForecastQty) !== parseFloat(modal.data.systemCalculatedQty) && (
              <>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label" style={{ color: '#d97706', fontWeight: 600 }}>
                    Mandatory Override Reason * (Final quantity differs from system calculation)
                  </label>
                  <select
                    className="input-field"
                    required
                    value={modal.data?.reasonCode || ''}
                    onChange={e => updateField('reasonCode', e.target.value)}
                  >
                    <option value="" disabled>Choose an override justification</option>
                    {['Market Trend', 'Promotion', 'Customer Insight', 'Outlier Correction'].map(r => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Planner Override Notes</label>
                  <input
                    className="input-field"
                    placeholder="Rationale for overriding statistical baseline..."
                    value={modal.data?.notes || ''}
                    onChange={e => updateField('notes', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
              disabled={busy}
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', border: 'none' }}
            >
              {busy ? 'Saving…' : (modal.editId ? 'Update Bucket' : 'Add Monthly Bucket')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal C: History Reference */}
      <Modal
        isOpen={modal.type === 'history'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title="Feed Historical Reference Period"
      >
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div className="input-group">
              <label className="input-label">Source Module *</label>
              <select
                className="input-field"
                required
                value={modal.data?.sourceModule || 'Sales Orders'}
                onChange={e => updateField('sourceModule', e.target.value)}
              >
                {['Sales Orders', 'Shipments', 'Point of Sale', 'Manual Upload'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Source Record Number *</label>
              <input
                className="input-field"
                required
                placeholder="e.g. SO-2026-1001"
                value={modal.data?.sourceRecordId || ''}
                onChange={e => updateField('sourceRecordId', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Historical Period Date *</label>
              <input
                type="date"
                className="input-field"
                required
                value={modal.data?.historicalPeriodDate || ''}
                onChange={e => updateField('historicalPeriodDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Quantity Consumed *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0"
                step="any"
                value={modal.data?.quantityConsumed ?? 0}
                onChange={e => updateField('quantityConsumed', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
              disabled={busy}
              style={{ background: '#0891b2', border: 'none' }}
            >
              {busy ? 'Saving…' : 'Feed Training Reference'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal D: What-If Demand Surge / Dip Simulator */}
      <WhatIfSimulatorModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        header={selectedHeader}
        lines={lines}
        isFinalized={isFinalized}
        onApplySimulation={handleApplyWhatIfSimulation}
      />
    </div>
  );
};

export default DemandForecasting;