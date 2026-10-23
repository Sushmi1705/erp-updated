import React from 'react';
import {
  Lock, CheckCircle2, Clock, AlertTriangle, Play,
  Sliders, Plus, Edit2, ShieldAlert, Sparkles, BrainCircuit
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const ForecastFlightDeck = ({
  header,
  lines = [],
  historyRefs = [],
  isFinalized = false,
  onOpenAddLineModal,
  onOpenEditModal,
  onAdvanceStatus,
  onOpenWhatIfModal,
  customers = [],
  products = []
}) => {
  if (!header) return null;

  // Resolve entity name
  const getEntityName = () => {
    if (header.forecastType === 'Customer') {
      const c = customers.find(item => item._id === header.targetEntityId);
      return c ? `${c.name} (${c.code})` : 'Selected Customer';
    }
    if (header.forecastType === 'Product') {
      const p = products.find(item => item._id === header.targetEntityId);
      return p ? `${p.name} (${p.code})` : 'Selected Product';
    }
    return String(header.targetEntityId || '—');
  };

  // Human override calculation
  const totalSystemQty = lines.reduce((acc, l) => acc + (Number(l.systemCalculatedQty) || 0), 0);
  const totalFinalQty = lines.reduce((acc, l) => acc + (Number(l.finalForecastQty) || 0), 0);
  const netOverride = totalFinalQty - totalSystemQty;

  // Historical reference status
  const isStatModel = ['Moving Average', 'Exponential Smoothing', 'ML-Prophet'].includes(header.algorithmUsed);
  const historyCount = historyRefs.length;
  const historySufficient = !isStatModel || historyCount >= 12;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0e122b 0%, #171d42 50%, #1e1744 100%)',
      borderRadius: '14px',
      border: isFinalized
        ? '1px solid rgba(16, 185, 129, 0.4)'
        : '1px solid rgba(139, 92, 246, 0.35)',
      padding: '20px 24px',
      color: '#ffffff',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Glow Corner */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '320px',
        height: '100%',
        background: isFinalized
          ? 'radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
          : 'radial-gradient(circle at 90% 10%, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header Info & Actions Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left: Model Identifiers */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '3px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              {header.forecastNumber}
            </span>
            <StatusBadge value={header.status} />
            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.25)',
              color: '#c4b5fd',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              fontWeight: 600
            }}>
              {header.algorithmUsed}
            </span>
          </div>

          <div style={{
            marginTop: '8px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span>Target: <strong style={{ color: '#ffffff' }}>{getEntityName()}</strong></span>
            <span style={{ color: '#64748b' }}>•</span>
            <span>Horizon: <strong style={{ color: '#22d3ee' }}>{header.forecastPeriod || '—'}</strong></span>
            <span style={{ color: '#64748b' }}>•</span>
            <span>Scope: <strong style={{ color: '#cbd5e1' }}>{header.forecastType}</strong></span>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* What-If Simulator Button */}
          <button
            type="button"
            onClick={onOpenWhatIfModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              color: '#22d3ee',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sliders size={14} />
            What-If Simulator
          </button>

          {/* Edit Header button */}
          <button
            type="button"
            onClick={() => onOpenEditModal(header)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <Edit2 size={13} /> Edit Header
          </button>

          {/* Add Line button (if not finalized) */}
          {!isFinalized && (
            <button
              type="button"
              onClick={onOpenAddLineModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
              }}
            >
              <Plus size={14} /> Add Month Bucket
            </button>
          )}

          {/* Status Advance button */}
          {header.status === 'Draft' && (
            <button
              type="button"
              onClick={() => onAdvanceStatus(header, 'Pending Review')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#f59e0b',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Submit for Consensus Review
            </button>
          )}

          {header.status === 'Pending Review' && (
            <button
              type="button"
              onClick={() => onAdvanceStatus(header, 'Finalized')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                background: '#10b981',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <CheckCircle2 size={14} /> Finalize for MRP Run
            </button>
          )}
        </div>
      </div>

      {/* Lock or Status Advisory Banner */}
      {isFinalized ? (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: '#6ee7b7'
        }}>
          <Lock size={15} color="#10b981" />
          <span>
            <strong>Finalized & Locked for MRP:</strong> These monthly quantities are formally committed to Material Planning. Bucket adjustments and deletions are locked to guarantee production scheduling integrity.
          </span>
        </div>
      ) : !historySufficient ? (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: '#fca5a5'
        }}>
          <AlertTriangle size={15} color="#ef4444" />
          <span>
            <strong>Statistical Baseline Insufficient:</strong> {header.algorithmUsed} requires at least 12 past periods. Current model has <strong>{historyCount} / 12</strong>. Please feed past periods in the calibration panel below before final consensus.
          </span>
        </div>
      ) : (
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: '#c4b5fd'
        }}>
          <Sparkles size={15} color="#8b5cf6" />
          <span>
            <strong>Active Simulation State:</strong> Adjust monthly quantities, calibrate past historical periods, or run What-If surge scenarios. Overrides will be audited with mandatory reason codes.
          </span>
        </div>
      )}

      {/* Quick Summary Metric Badges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        marginTop: '4px'
      }}>
        {/* Total Final Volume */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.45)',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Consensus Net Demand</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
            {(header.totalAdjustedQty || totalFinalQty || 0).toLocaleString()} <span style={{ fontSize: '11px', color: '#94a3b8' }}>units</span>
          </div>
        </div>

        {/* Monthly Buckets */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.45)',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Planning Buckets</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#22d3ee' }}>
            {lines.length} Months Defined
          </div>
        </div>

        {/* Training Baseline */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.45)',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Training Periods</div>
          <div style={{
            fontSize: '16px',
            fontWeight: 700,
            color: historySufficient ? '#34d399' : '#f87171'
          }}>
            {historyCount} / 12 {historySufficient ? '✓' : '⚠️'}
          </div>
        </div>

        {/* Net Human Override */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.45)',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Net Manual Override</div>
          <div style={{
            fontSize: '16px',
            fontWeight: 700,
            color: netOverride > 0 ? '#38bdf8' : netOverride < 0 ? '#fb7185' : '#94a3b8'
          }}>
            {netOverride > 0 ? `+${netOverride.toLocaleString()}` : netOverride.toLocaleString()} units
          </div>
        </div>
      </div>
    </div>
  );
};
