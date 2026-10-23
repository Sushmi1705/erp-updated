import React, { useState } from 'react';
import { Sliders, Sparkles, TrendingUp, TrendingDown, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import Modal from '../../../components/common/Modal';

export const WhatIfSimulatorModal = ({
  isOpen,
  onClose,
  header,
  lines = [],
  isFinalized = false,
  onApplySimulation
}) => {
  const [percentage, setPercentage] = useState(10);
  const [applying, setApplying] = useState(false);

  if (!isOpen) return null;

  // Presets
  const presets = [
    { label: 'OEM Festive Surge (+15%)', val: 15 },
    { label: 'High Demand Ramp (+25%)', val: 25 },
    { label: 'Supply Headwind (-10%)', val: -10 },
    { label: 'OEM Production Cut (-20%)', val: -20 },
    { label: 'Reset (0%)', val: 0 }
  ];

  // Calculations
  const factor = 1 + percentage / 100;
  const currentTotal = lines.reduce((acc, l) => acc + (Number(l.finalForecastQty) || 0), 0);
  const simulatedTotal = Math.round(currentTotal * factor);
  const netDelta = simulatedTotal - currentTotal;

  const handleApply = async () => {
    if (isFinalized || !onApplySimulation) return;
    setApplying(true);
    try {
      await onApplySimulation(percentage);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="What-If Demand Surge / Dip Simulation Studio"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Intro */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '10px',
          padding: '14px 18px',
          fontSize: '12px',
          color: '#334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>
            <Sparkles size={16} />
            <span>Simulate Market Shifts on {header?.forecastNumber}</span>
          </div>
          <div>
            Adjust the simulation slider below to stress-test your monthly planning horizon against supply chain shocks or OEM volume increases.
          </div>
        </div>

        {/* Preset Chips */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
            Quick Scenario Presets
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {presets.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPercentage(p.val)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: percentage === p.val ? '1px solid #7c3aed' : '1px solid #cbd5e1',
                  background: percentage === p.val ? 'rgba(139, 92, 246, 0.12)' : '#ffffff',
                  color: percentage === p.val ? '#6d28d9' : '#475569',
                  fontSize: '12px',
                  fontWeight: percentage === p.val ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Slider */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Custom Simulation Factor:
            </span>
            <span style={{
              fontSize: '16px',
              fontWeight: 800,
              fontFamily: 'monospace',
              color: percentage > 0 ? '#059669' : percentage < 0 ? '#dc2626' : '#64748b',
              padding: '2px 10px',
              borderRadius: '6px',
              background: percentage > 0 ? 'rgba(16, 185, 129, 0.1)' : percentage < 0 ? 'rgba(239, 68, 68, 0.1)' : '#f1f5f9'
            }}>
              {percentage > 0 ? `+${percentage}%` : `${percentage}%`}
            </span>
          </div>

          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={percentage}
            onChange={e => setPercentage(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#8b5cf6' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
            <span>-50% Heavy Contraction</span>
            <span>0% Baseline</span>
            <span>+50% Explosive Surge</span>
          </div>
        </div>

        {/* Live Impact Preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          textAlign: 'center'
        }}>
          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Current Baseline</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
              {currentTotal.toLocaleString()}
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Simulated Horizon</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' }}>
              {simulatedTotal.toLocaleString()}
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Net Volume Delta</div>
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: netDelta > 0 ? '#059669' : netDelta < 0 ? '#dc2626' : '#64748b'
            }}>
              {netDelta > 0 ? `+${netDelta.toLocaleString()}` : netDelta.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Breakdown table */}
        <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px' }}>Month</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Current Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Simulated Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Net Delta</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const cur = Number(l.finalForecastQty) || 0;
                const sim = Math.round(cur * factor);
                const d = sim - cur;
                return (
                  <tr key={l._id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                      {l.timeBucketDate ? new Date(l.timeBucketDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : `Month ${i+1}`}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {cur.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed' }}>
                      {sim.toLocaleString()}
                    </td>
                    <td style={{
                      padding: '8px 12px',
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: d > 0 ? '#059669' : d < 0 ? '#dc2626' : '#64748b'
                    }}>
                      {d > 0 ? `+${d.toLocaleString()}` : d.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          {!isFinalized ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={applying || percentage === 0}
              onClick={handleApply}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
              }}
            >
              {applying ? 'Applying Simulation…' : 'Apply Simulation to Lines'}
            </button>
          ) : (
            <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Finalized forecast is locked — simulations can only be previewed.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
