import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { Calendar, Plus, Clock, Factory } from 'lucide-react';

const NewPeriodModal = ({
  isOpen,
  onClose,
  periods = [],
  onSubmit,
  busy = false
}) => {
  const [workCenterId, setWorkCenterId] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workingDays, setWorkingDays] = useState(5);
  const [dailyHours, setDailyHours] = useState(8);
  const [availableHrs, setAvailableHrs] = useState('');

  // Extract unique work centers from periods
  const workCenters = [];
  const seenWc = new Set();
  periods.forEach(p => {
    if (p.workCenterId && p.workCenterId._id && !seenWc.has(p.workCenterId._id)) {
      seenWc.add(p.workCenterId._id);
      workCenters.push(p.workCenterId);
    }
  });

  useEffect(() => {
    if (workCenters.length > 0 && !workCenterId) {
      setWorkCenterId(workCenters[0]._id);
      setDailyHours(workCenters[0].baseDailyHours || 8);
    }
  }, [workCenters]);

  // Suggest next period label
  useEffect(() => {
    if (periods.length > 0) {
      const weekNums = periods
        .map(p => {
          const match = (p.periodLabel || '').match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter(n => n > 0);
      const maxWeek = weekNums.length > 0 ? Math.max(...weekNums) : 36;
      setPeriodLabel(`WEEK ${maxWeek + 1}`);
    } else {
      setPeriodLabel('WEEK 37');
    }
  }, [periods]);

  // Recalculate available hours automatically
  useEffect(() => {
    const selWc = workCenters.find(w => w._id === workCenterId);
    const eff = selWc?.efficiencyRate || 1.0;
    const calc = workingDays * dailyHours * eff;
    setAvailableHrs(String(calc.toFixed(1)));
  }, [workCenterId, workingDays, dailyHours]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!workCenterId || !periodLabel) return;

    onSubmit({
      workCenterId,
      periodLabel,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      availableHrs: parseFloat(availableHrs) || 40
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Capacity Period"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
          Configure an upcoming production cycle or weekly capacity ledger block for finite CRP dispatch.
        </p>

        {/* Work Center */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Work Center Machine Bay <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
          <select
            className="input-field"
            required
            value={workCenterId}
            onChange={e => {
              setWorkCenterId(e.target.value);
              const sel = workCenters.find(w => w._id === e.target.value);
              if (sel?.baseDailyHours) setDailyHours(sel.baseDailyHours);
            }}
            style={{ width: '100%' }}
          >
            {workCenters.map(wc => (
              <option key={wc._id} value={wc._id}>
                {wc.name} ({wc.code}) — Base {wc.baseDailyHours || 8}h/day @ {((wc.efficiencyRate || 1) * 100).toFixed(0)}% OEE
              </option>
            ))}
          </select>
        </div>

        {/* Period Label */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Period Label / Sequence <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. WEEK 37"
            required
            value={periodLabel}
            onChange={e => setPeriodLabel(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Date Window */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600 }}>Start Date</label>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600 }}>End Date</label>
            <input
              type="date"
              className="input-field"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Hours Computation Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600 }}>Operating Days</label>
            <input
              type="number"
              min="1"
              max="7"
              className="input-field"
              value={workingDays}
              onChange={e => setWorkingDays(parseInt(e.target.value, 10) || 5)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600 }}>Hours Per Day</label>
            <input
              type="number"
              min="1"
              max="24"
              className="input-field"
              value={dailyHours}
              onChange={e => setDailyHours(parseFloat(e.target.value) || 8)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Calculated Total Available Hours */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>
            Calculated Available Machine Hours <span style={{ color: 'var(--accent-danger)' }}>*</span>
          </label>
          <input
            type="number"
            step="0.5"
            className="input-field"
            required
            value={availableHrs}
            onChange={e => setAvailableHrs(e.target.value)}
            style={{ width: '100%', fontWeight: 700, color: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Auto-calculated: {workingDays} days × {dailyHours} hrs/day × Work Center Efficiency. You can override if required.
          </span>
        </div>

        {/* Action Buttons */}
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
            <Plus size={14} />
            {busy ? 'Creating Period…' : 'Create Capacity Period'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewPeriodModal;
