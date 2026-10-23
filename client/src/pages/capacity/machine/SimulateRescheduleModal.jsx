import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { ArrowRightLeft, AlertTriangle, CheckCircle2, ArrowRight, Clock, Zap } from 'lucide-react';

const SimulateRescheduleModal = ({
  isOpen,
  onClose,
  load,
  selectedPeriod,
  periods = [],
  onSubmit,
  busy = false
}) => {
  const [newPeriodId, setNewPeriodId] = useState('');

  // Filter available target periods: same work center, different period
  const eligiblePeriods = periods.filter(p => 
    selectedPeriod && 
    p._id !== selectedPeriod._id && 
    p.workCenterId?._id === selectedPeriod.workCenterId?._id
  );

  useEffect(() => {
    if (eligiblePeriods.length > 0 && !newPeriodId) {
      setNewPeriodId(eligiblePeriods[0]._id);
    }
  }, [eligiblePeriods]);

  if (!load || !selectedPeriod) return null;

  const targetPeriod = periods.find(p => p._id === newPeriodId);
  const moveHours = load.totalRequiredHours || 0;

  // Source period projection
  const srcAvail = selectedPeriod.availableHrs || 1;
  const srcUsedCurrent = selectedPeriod.utilizedHrs || 0;
  const srcUsedNew = Math.max(0, srcUsedCurrent - moveHours);
  const srcPctNew = (srcUsedNew / srcAvail) * 100;

  // Target period projection
  const tgtAvail = targetPeriod ? (targetPeriod.availableHrs || 1) : 1;
  const tgtUsedCurrent = targetPeriod ? (targetPeriod.utilizedHrs || 0) : 0;
  const tgtUsedNew = tgtUsedCurrent + moveHours;
  const tgtPctNew = (tgtUsedNew / tgtAvail) * 100;
  const willCauseBottleneck = tgtPctNew > 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPeriodId) return;
    onSubmit({
      loadId: load._id,
      newPeriodId
    });
  };

  const woDisplay = String(load.workOrderId || '').slice(-8).toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate Rescheduling & Finite Load Re-balancing"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
          Move this Work Order operation to another scheduling period. The CRP event bus immediately recalculates load and bottleneck status across both periods.
        </p>

        {/* Selected Job Card */}
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Moving Work Order
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--accent-primary)' }}>
                WO-{woDisplay}
              </span>
              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                Step {load.routingStepNo}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Machine Load Needed</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-warning)', fontFamily: 'var(--font-mono, monospace)' }}>
              {moveHours.toFixed(1)} hrs
            </div>
          </div>
        </div>

        {/* Target Period Selector */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>
            Target Destination Period (Same Work Center: {selectedPeriod.workCenterId?.name})
          </label>
          {eligiblePeriods.length === 0 ? (
            <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '12px', color: 'var(--accent-danger)' }}>
              No other scheduling periods exist for this work center. Create a new period first before rescheduling.
            </div>
          ) : (
            <select
              className="input-field"
              required
              value={newPeriodId}
              onChange={e => setNewPeriodId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="" disabled>Choose target period</option>
              {eligiblePeriods.map(p => (
                <option key={p._id} value={p._id}>
                  {p.periodLabel} {p.startDate ? `(${new Date(p.startDate).toLocaleDateString()})` : ''} — Current Load: {p.utilizationPct.toFixed(1)}% [Avail: {p.availableHrs.toFixed(1)}h]
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Dynamic Dual Period Impact Preview */}
        {targetPeriod && (
          <div style={{
            background: 'var(--bg-tertiary)',
            border: willCauseBottleneck ? '1px solid var(--accent-danger)' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              <Zap size={14} color="var(--accent-warning)" />
              Finite Scheduling Impact Analysis
            </div>

            {/* Source Period Relieved */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Source: <strong>{selectedPeriod.periodLabel}</strong>
              </span>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{selectedPeriod.utilizationPct.toFixed(1)}%</span>
                <ArrowRight size={12} style={{ margin: '0 6px', display: 'inline' }} />
                <strong style={{ color: 'var(--accent-success)' }}>{srcPctNew.toFixed(1)}%</strong>
                <span style={{ fontSize: '11px', color: 'var(--accent-success)', marginLeft: '4px' }}>
                  (-{moveHours.toFixed(1)}h relieved)
                </span>
              </div>
            </div>

            {/* Target Period Loaded */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Target: <strong>{targetPeriod.periodLabel}</strong>
              </span>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{targetPeriod.utilizationPct.toFixed(1)}%</span>
                <ArrowRight size={12} style={{ margin: '0 6px', display: 'inline' }} />
                <strong style={{ color: willCauseBottleneck ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                  {tgtPctNew.toFixed(1)}%
                </strong>
                <span style={{ fontSize: '11px', color: willCauseBottleneck ? 'var(--accent-danger)' : 'var(--text-secondary)', marginLeft: '4px' }}>
                  (+{moveHours.toFixed(1)}h added)
                </span>
              </div>
            </div>

            {willCauseBottleneck && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--accent-danger)',
                fontSize: '11px',
                fontWeight: 600
              }}>
                <AlertTriangle size={14} />
                Warning: Moving this job will cause {targetPeriod.periodLabel} to exceed 100% and become a bottleneck.
              </div>
            )}
          </div>
        )}

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
            className="btn"
            disabled={busy || !newPeriodId || eligiblePeriods.length === 0}
            style={{
              background: willCauseBottleneck ? 'var(--accent-danger)' : 'var(--accent-warning)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowRightLeft size={14} />
            {busy ? 'Simulating & Re-calculating…' : 'Execute Job Move'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SimulateRescheduleModal;
