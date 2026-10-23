import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { ArrowRightLeft, AlertTriangle, CheckCircle2, ArrowRight, Award, Clock, Zap } from 'lucide-react';

const SimulateLaborRescheduleModal = ({
  isOpen,
  onClose,
  load,
  selectedPeriod,
  periods = [],
  onSubmit,
  busy = false
}) => {
  const [newPeriodId, setNewPeriodId] = useState('');

  // Eligible target periods (different from current period)
  const eligiblePeriods = periods.filter(p => selectedPeriod && p._id !== selectedPeriod._id);

  useEffect(() => {
    if (eligiblePeriods.length > 0 && !newPeriodId) {
      setNewPeriodId(eligiblePeriods[0]._id);
    }
  }, [eligiblePeriods]);

  if (!load || !selectedPeriod) return null;

  const targetPeriod = periods.find(p => p._id === newPeriodId);
  const moveHours = load.requiredLaborHours || 0;

  // Source period projection
  const srcAvail = selectedPeriod.availableHrs || 0;
  const srcPlannedCurrent = selectedPeriod.plannedHrs || 0;
  const srcPlannedNew = Math.max(0, srcPlannedCurrent - moveHours);
  const srcVarNew = srcAvail - srcPlannedNew;

  // Target period projection
  const tgtAvail = targetPeriod ? (targetPeriod.availableHrs || 0) : 0;
  const tgtPlannedCurrent = targetPeriod ? (targetPeriod.plannedHrs || 0) : 0;
  const tgtPlannedNew = tgtPlannedCurrent + moveHours;
  const tgtVarNew = tgtAvail - tgtPlannedNew;
  const willCauseShortfall = tgtVarNew < 0;

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
      title="Simulate Rescheduling & Labor Shift Re-balancing"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
          Re-assign this Work Order labor routing step to another shift or period. The workforce engine immediately recalculates operator hour variances across both shifts.
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
              Moving Labor Routing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--accent-primary)' }}>
                WO-{woDisplay}
              </span>
              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                Step {load.routingStepNo}
              </span>
              {load.skillLevelRequired && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: load.skillLevelRequired === 'Expert' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(51, 65, 85, 0.5)',
                  color: load.skillLevelRequired === 'Expert' ? '#c084fc' : 'var(--text-secondary)'
                }}>
                  {load.skillLevelRequired}
                </span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Labor Hours Needed</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-warning)', fontFamily: 'var(--font-mono, monospace)' }}>
              {moveHours.toFixed(1)} hrs
            </div>
          </div>
        </div>

        {/* Target Shift Selector */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>
            Destination Shift / Department
          </label>
          {eligiblePeriods.length === 0 ? (
            <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '12px', color: 'var(--accent-danger)' }}>
              No other shift periods exist to re-allocate to.
            </div>
          ) : (
            <select
              className="input-field"
              required
              value={newPeriodId}
              onChange={e => setNewPeriodId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="" disabled>Choose target shift</option>
              {eligiblePeriods.map(p => (
                <option key={p._id} value={p._id}>
                  {p.departmentId?.name} — {p.shiftName} Shift ({p.periodLabel}) [Operators: {p.headcount}, Var: {p.varianceHrs > 0 ? '+' : ''}{p.varianceHrs.toFixed(1)}h]
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Dynamic Dual Shift Impact Preview */}
        {targetPeriod && (
          <div style={{
            background: 'var(--bg-tertiary)',
            border: willCauseShortfall ? '1px solid var(--accent-danger)' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              <Zap size={14} color="var(--accent-warning)" />
              Shift Balance Impact Analysis
            </div>

            {/* Source Shift Relieved */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Source: <strong>{selectedPeriod.departmentId?.name} ({selectedPeriod.shiftName})</strong>
              </span>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {selectedPeriod.varianceHrs > 0 ? '+' : ''}{selectedPeriod.varianceHrs.toFixed(1)}h
                </span>
                <ArrowRight size={12} style={{ margin: '0 6px', display: 'inline' }} />
                <strong style={{ color: srcVarNew < 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                  {srcVarNew > 0 ? '+' : ''}{srcVarNew.toFixed(1)}h
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--accent-success)', marginLeft: '4px' }}>
                  (-{moveHours.toFixed(1)}h relieved)
                </span>
              </div>
            </div>

            {/* Target Shift Loaded */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Target: <strong>{targetPeriod.departmentId?.name} ({targetPeriod.shiftName})</strong>
              </span>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {targetPeriod.varianceHrs > 0 ? '+' : ''}{targetPeriod.varianceHrs.toFixed(1)}h
                </span>
                <ArrowRight size={12} style={{ margin: '0 6px', display: 'inline' }} />
                <strong style={{ color: willCauseShortfall ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                  {tgtVarNew > 0 ? '+' : ''}{tgtVarNew.toFixed(1)}h
                </strong>
                <span style={{ fontSize: '11px', color: willCauseShortfall ? 'var(--accent-danger)' : 'var(--text-secondary)', marginLeft: '4px' }}>
                  (+{moveHours.toFixed(1)}h added)
                </span>
              </div>
            </div>

            {willCauseShortfall && (
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
                Warning: Moving this job will push {targetPeriod.departmentId?.name} ({targetPeriod.shiftName}) into an understaffed deficit ({tgtVarNew.toFixed(1)}h).
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
              background: willCauseShortfall ? 'var(--accent-danger)' : 'var(--accent-warning)',
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
            {busy ? 'Simulating & Moving…' : 'Execute Shift Move'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SimulateLaborRescheduleModal;
