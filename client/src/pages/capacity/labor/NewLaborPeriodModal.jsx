import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { Calendar, Plus, Users, Clock, Sun, Sunset, Moon } from 'lucide-react';

const NewLaborPeriodModal = ({
  isOpen,
  onClose,
  periods = [],
  onSubmit,
  busy = false
}) => {
  const [departmentId, setDepartmentId] = useState('');
  const [shiftName, setShiftName] = useState('Morning');
  const [standardShiftHours, setStandardShiftHours] = useState(8);
  const [periodLabel, setPeriodLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [headcount, setHeadcount] = useState(10);

  // Extract unique departments from periods
  const departments = [];
  const seenDept = new Set();
  periods.forEach(p => {
    if (p.departmentId && p.departmentId._id && !seenDept.has(p.departmentId._id)) {
      seenDept.add(p.departmentId._id);
      departments.push(p.departmentId);
    }
  });

  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0]._id);
    }
  }, [departments]);

  // Suggest sequential week label
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

  // Calculate available hours: headcount * shiftHours * 5 days
  const availableHrs = (headcount || 0) * (standardShiftHours || 8) * 5;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!departmentId || !periodLabel || headcount < 0) return;

    onSubmit({
      departmentId,
      shiftName,
      standardShiftHours: parseFloat(standardShiftHours) || 8.0,
      periodLabel,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      headcount: parseInt(headcount, 10) || 0
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Roster New Manpower Shift Period"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
          Configure a new department shift cycle to assign scheduled workforce capacity for upcoming production runs.
        </p>

        {/* Department Selector */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Department <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
          <select
            className="input-field"
            required
            value={departmentId}
            onChange={e => setDepartmentId(e.target.value)}
            style={{ width: '100%' }}
          >
            {departments.map(d => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.code || 'DEPT'})
              </option>
            ))}
          </select>
        </div>

        {/* Shift Selector */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Shift Window <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {['Morning', 'Evening', 'Night'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setShiftName(s)}
                style={{
                  background: shiftName === s ? '#059669' : 'var(--bg-tertiary)',
                  color: shiftName === s ? '#ffffff' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {s === 'Morning' && <Sun size={13} />}
                {s === 'Evening' && <Sunset size={13} />}
                {s === 'Night' && <Moon size={13} />}
                {s} Shift
              </button>
            ))}
          </div>
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

        {/* Headcount and Standard Hours */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600 }}>
              Initial Headcount <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              className="input-field"
              required
              value={headcount}
              onChange={e => setHeadcount(parseInt(e.target.value, 10) || 0)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600 }}>Shift Length (Hours)</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="24"
              className="input-field"
              value={standardShiftHours}
              onChange={e => setStandardShiftHours(parseFloat(e.target.value) || 8.0)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Calculated Available Hours Banner */}
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-tertiary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Calculated Available Hours</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{headcount} operators × {standardShiftHours}h × 5 working days</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-success)', fontFamily: 'var(--font-mono, monospace)' }}>
            {availableHrs.toFixed(1)} hrs
          </div>
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
            disabled={busy || headcount < 1}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            {busy ? 'Creating Roster Period…' : 'Create Shift Period'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewLaborPeriodModal;
