import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { UserPlus, Users, Clock, Zap, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';

const PlanWorkforceModal = ({
  isOpen,
  onClose,
  period,
  periods = [],
  onSubmit,
  busy = false
}) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [newHeadcount, setNewHeadcount] = useState('');
  const [manualHoursAdjustment, setManualHoursAdjustment] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (period && period._id) {
      setSelectedPeriodId(period._id);
      setNewHeadcount(String(period.headcount || 0));
      setManualHoursAdjustment('0');
    } else if (periods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(periods[0]._id);
      setNewHeadcount(String(periods[0].headcount || 0));
      setManualHoursAdjustment('0');
    }
  }, [period, periods]);

  const activePeriod = periods.find(p => p._id === selectedPeriodId) || period;

  const PRESET_HOURS = [
    { label: '0h None', value: 0 },
    { label: '+4h Half Shift', value: 4 },
    { label: '+8h Full Shift', value: 8 },
    { label: '+16h Weekend Double', value: 16 },
    { label: '+24h Weekend Run', value: 24 }
  ];

  const PRESET_REASONS = [
    'Added Temporary Operators',
    'Weekend Overtime Shift',
    'Shift Re-allocation for Rush PO',
    'Cross-Department Assembly Support',
    'Scrap Rework Catch-up'
  ];

  // Mathematical Projection
  const numHeadcount = parseInt(newHeadcount, 10) || 0;
  const numExtraHours = parseFloat(manualHoursAdjustment) || 0;
  const shiftHours = activePeriod?.standardShiftHours || 8;
  const currentAvail = activePeriod?.availableHrs || 0;
  const currentPlanned = activePeriod?.plannedHrs || 0;
  const currentVar = activePeriod?.varianceHrs || 0;

  // New Available Hours: (headcount * shiftHours * 5 working days) + extra hours
  const projectedAvail = (numHeadcount * shiftHours * 5) + numExtraHours;
  const projectedVar = projectedAvail - currentPlanned;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPeriodId) return;

    onSubmit({
      periodId: selectedPeriodId,
      newHeadcount: numHeadcount,
      manualHoursAdjustment: numExtraHours,
      reason: reason || 'Workforce Adjustment'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Workforce & Headcount Allocation"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
          Adjust operator headcount to represent re-allocated shop floor workers, or inject extra hours for weekend overtime without changing base staff.
        </p>

        {/* Period Selector */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Target Department & Shift</label>
          <select
            className="input-field"
            value={selectedPeriodId}
            onChange={e => {
              const pId = e.target.value;
              setSelectedPeriodId(pId);
              const found = periods.find(p => p._id === pId);
              if (found) {
                setNewHeadcount(String(found.headcount || 0));
                setManualHoursAdjustment('0');
              }
            }}
            required
            style={{ width: '100%' }}
          >
            {periods.map(p => (
              <option key={p._id} value={p._id}>
                {p.departmentId?.name} — {p.shiftName} Shift ({p.periodLabel}) [Current: {p.headcount} Operators, Var: {p.varianceHrs > 0 ? '+' : ''}{p.varianceHrs.toFixed(1)}h]
              </option>
            ))}
          </select>
        </div>

        {/* Headcount Stepper */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>
            Assigned Operator Headcount <span style={{ color: 'var(--accent-danger)' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setNewHeadcount(String(Math.max(0, numHeadcount - 1)))}
              style={{ padding: '6px 14px', fontSize: '14px', fontWeight: 700 }}
            >
              -1
            </button>
            <input
              type="number"
              min="0"
              className="input-field"
              required
              value={newHeadcount}
              onChange={e => setNewHeadcount(e.target.value)}
              style={{ flex: 1, textAlign: 'center', fontSize: '15px', fontWeight: 700 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setNewHeadcount(String(numHeadcount + 1))}
              style={{ padding: '6px 14px', fontSize: '14px', fontWeight: 700 }}
            >
              +1
            </button>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Base capacity formula: {numHeadcount} operators × {shiftHours}h/shift × 5 working days = {numHeadcount * shiftHours * 5} hrs.
          </span>
        </div>

        {/* Extra Hours (Overtime) Quick Presets */}
        <div>
          <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Overtime & Shift Expansion (Manual Hours)
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {PRESET_HOURS.map(preset => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setManualHoursAdjustment(String(preset.value))}
                style={{
                  background: manualHoursAdjustment === String(preset.value) ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: manualHoursAdjustment === String(preset.value) ? '#ffffff' : 'var(--text-primary)',
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
          <input
            type="number"
            step="0.5"
            placeholder="Extra hours (e.g. 8.0)"
            className="input-field"
            value={manualHoursAdjustment}
            onChange={e => setManualHoursAdjustment(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Real-time Math Simulation Card */}
        {activePeriod && (
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
              Workforce Mathematical Projection
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Available Hours: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{currentAvail.toFixed(1)}h</strong>
                <ArrowRight size={12} style={{ margin: '0 6px', display: 'inline' }} />
                <strong style={{ color: 'var(--accent-success)' }}>{projectedAvail.toFixed(1)}h</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Variance: </span>
                <strong style={{ color: currentVar < 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                  {currentVar > 0 ? '+' : ''}{currentVar.toFixed(1)}h
                </strong>
                <ArrowRight size={12} style={{ margin: '0 6px', display: 'inline' }} />
                <strong style={{ color: projectedVar < 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                  {projectedVar > 0 ? '+' : ''}{projectedVar.toFixed(1)}h
                </strong>
              </div>
            </div>

            {projectedVar >= 0 && currentVar < 0 && (
              <div style={{ fontSize: '11px', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={13} />
                Short shift resolved! Roster variance converts from deficit to surplus (+{projectedVar.toFixed(1)}h).
              </div>
            )}
          </div>
        )}

        {/* Reason Presets */}
        <div>
          <label className="input-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Common Reasons
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PRESET_REASONS.map(pr => (
              <button
                key={pr}
                type="button"
                onClick={() => setReason(pr)}
                style={{
                  background: reason === pr ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-tertiary)',
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
            Operational Justification <span style={{ color: 'var(--accent-danger)' }}>*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Added 2 temporary operators for welding line"
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
            disabled={busy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={14} />
            {busy ? 'Saving Workforce Plan…' : 'Save Manpower Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PlanWorkforceModal;
