import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';
import axios from 'axios';
import { ShieldCheck, AlertOctagon, CheckCircle2, Factory, Search } from 'lucide-react';

const ValidateScheduleModal = ({
  isOpen,
  onClose,
  periods = []
}) => {
  const [selectedWorkCenterId, setSelectedWorkCenterId] = useState('');
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  // Extract unique work centers and periods
  const workCenters = [];
  const seenWc = new Set();
  periods.forEach(p => {
    if (p.workCenterId && p.workCenterId._id && !seenWc.has(p.workCenterId._id)) {
      seenWc.add(p.workCenterId._id);
      workCenters.push(p.workCenterId);
    }
  });

  const periodLabels = Array.from(new Set(periods.map(p => p.periodLabel).filter(Boolean))).sort();

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!selectedWorkCenterId || !selectedPeriodLabel) return;

    setChecking(true);
    setResult(null);
    try {
      const res = await axios.get('/capacity/validate-scheduling', {
        params: {
          workCenterId: selectedWorkCenterId,
          periodLabel: selectedPeriodLabel
        }
      });
      setResult(res.data);
    } catch (err) {
      setResult({
        isValid: false,
        message: err.response?.data?.message || 'Error validating finite scheduling capacity'
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setResult(null);
        onClose();
      }}
      title="Finite Scheduling Feasibility Check"
    >
      <form onSubmit={handleValidate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
          Run an instant CRP verification check to verify if a work center has finite machine headroom available before releasing new work order routings to the floor.
        </p>

        {/* Work Center */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Work Center Machine</label>
          <select
            className="input-field"
            required
            value={selectedWorkCenterId}
            onChange={e => setSelectedWorkCenterId(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="" disabled>Select Work Center</option>
            {workCenters.map(wc => (
              <option key={wc._id} value={wc._id}>
                {wc.name} ({wc.code})
              </option>
            ))}
          </select>
        </div>

        {/* Period Label */}
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Scheduling Period</label>
          <select
            className="input-field"
            required
            value={selectedPeriodLabel}
            onChange={e => setSelectedPeriodLabel(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="" disabled>Select Target Period</option>
            {periodLabels.map(label => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Validation Result Box */}
        {result && (
          <div style={{
            padding: '14px',
            borderRadius: '8px',
            background: result.isValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: result.isValid ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 700,
              color: result.isValid ? 'var(--accent-success)' : 'var(--accent-danger)'
            }}>
              {result.isValid ? <CheckCircle2 size={18} /> : <AlertOctagon size={18} />}
              {result.isValid ? 'Scheduling Feasible: Capacity Available' : 'Scheduling Locked: Bottleneck Detected'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              {result.message}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setResult(null);
              onClose();
            }}
          >
            Close
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={checking || !selectedWorkCenterId || !selectedPeriodLabel}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Search size={14} />
            {checking ? 'Checking Capacity…' : 'Run Feasibility Check'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ValidateScheduleModal;
