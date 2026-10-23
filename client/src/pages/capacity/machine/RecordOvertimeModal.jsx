import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { PlusCircle, Clock, Zap, AlertTriangle, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react';

const RecordOvertimeModal = ({
  isOpen,
  onClose,
  period,
  periods = [],
  onSubmit,
  busy = false
}) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [additionalHours, setAdditionalHours] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (period && period._id) {
      setSelectedPeriodId(period._id);
    } else if (periods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(periods[0]._id);
    }
  }, [period, periods]);

  const activePeriod = periods.find(p => p._id === selectedPeriodId) || period;

  // Preset options
  const PRESET_HOURS = [
    { label: '+4h Half Shift', value: 4 },
    { label: '+8h Full Shift', value: 8 },
    { label: '+16h Double Shift', value: 16 },
    { label: '+24h Weekend Run', value: 24 }
  ];

  const PRESET_REASONS = [
    'Weekend Overtime Shift',
    'Added 3rd Shift Extension',
    'Rush Customer Delivery PO',
    'Die Maintenance Catch-up',
    'Unplanned Scrap Rework Recovery'
  ];

  // Mathematical Projection
  const numHours = parseFloat(additionalHours) || 0;
  const currentAvail = activePeriod ? activePeriod.availableHrs : 0;
  const currentUsed = activePeriod ? activePeriod.utilizedHrs : 0;
  const currentPct = activePeriod ? activePeriod.utilizationPct : 0;

  const projectedAvail = currentAvail + numHours;
  const projectedPct = projectedAvail > 0 ? (currentUsed / projectedAvail) * 100 : 0;
  const pctDrop = Math.max(0, currentPct - projectedPct);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPeriodId || numHours <= 0) return;
    onSubmit({
      periodId: selectedPeriodId,
      additionalHours: numHours,
      reason: reason || 'Capacity Injection'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inject Machine Overtime & Shift Expansion"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
          Injecting overtime or adding a temporary machine shift expands available operating hours and clears work center bottlenecks.
        </p>

        {/* Period Selector (if opened without specific period or to allow switching) */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Target Work Center & Period</label>
          <select
            className="input-field"
            value={selectedPeriodId}
            onChange={e => setSelectedPeriodId(e.target.value)}
            required
            style={{ width: '100%' }}
          >
            {periods.map(p => (
              <option key={p._id} value={p._id}>
                {p.workCenterId?.name} ({p.workCenterId?.code}) — {p.periodLabel} [Current Load: {p.utilizationPct.toFixed(1)}%]
              </option>
            ))}
          </select>
        </div>

        {/* Quick Hour Presets */}
        <div>
          <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Quick Shift Increments
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_HOURS.map(preset => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setAdditionalHours(String(preset.value))}
                style={{
                  background: additionalHours === String(preset.value) ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: additionalHours === String(preset.value) ? '#ffffff' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Hours Input */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>
            Extra Machine Hours Needed <span style={{ color: 'var(--accent-danger)' }}>*</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            placeholder="e.g. 8.0"
            className="input-field"
            required
            value={additionalHours}
            onChange={e => setAdditionalHours(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Real-time Math Simulation Card */}
        {numHours > 0 && activePeriod && (
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)' }}>
              <Zap size={14} />
              Real-Time Impact Simulation
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Available Hours: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{currentAvail.toFixed(1)}h</strong>
                <ArrowRight size={12} style={{ margin: '0 6px', display: 'inline' }} />
                <strong style={{ color: 'var(--accent-success)' }}>{projectedAvail.toFixed(1)}h (+{numHours.toFixed(1)}h)</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Load: </span>
                <strong style={{ color: currentPct > 100 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>{currentPct.toFixed(1)}%</strong>
                <ArrowRight size={12} style={{ margin: '0 6px', display: 'inline' }} />
                <strong style={{ color: projectedPct > 100 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>{projectedPct.toFixed(1)}%</strong>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingDown size={13} />
              Utilization drops by <strong>-{pctDrop.toFixed(1)}%</strong>
              {projectedPct <= 100 && currentPct > 100 && ' (Clears Bottleneck!)'}
            </div>
          </div>
        )}

        {/* Reason Presets */}
        <div>
          <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Common Justifications
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PRESET_REASONS.map(pr => (
              <button
                key={pr}
                type="button"
                onClick={() => setReason(pr)}
                style={{
                  background: reason === pr ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                  color: reason === pr ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Input */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>
            Operational Reason / Justification <span style={{ color: 'var(--accent-danger)' }}>*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Weekend Shift Expansion"
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Dialog Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || numHours <= 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={14} />
            {busy ? 'Injecting Hours…' : 'Inject Overtime Hours'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordOvertimeModal;
