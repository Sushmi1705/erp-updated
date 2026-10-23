import React from 'react';
import { Edit2, AlertCircle, ArrowRight } from 'lucide-react';
import Modal from '../../../components/common/Modal';

export const AdjustDemandModal = ({
  isOpen,
  onClose,
  onSubmit,
  data = {},
  updateField,
  line = null,
  busy = false
}) => {
  if (!isOpen) return null;

  const currentGross = Number(line?.totalGrossDemand) || 0;
  const currentAdjustment = Number(data.manualAdjustmentQty) || 0;
  const simulatedNet = currentGross + currentAdjustment;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Net Demand by Hand (Planner Override)"
    >
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Component Context */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Component Specification
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {line?.productId?.name || 'Finished Component'} ({line?.productId?.code || '—'})
            </div>
            <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px' }}>
              Period: {line?.periodName || '—'}
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', margin: 0, lineHeight: 1.5 }}>
            Total calculated demand (forecast + sales orders + buffer) cannot be altered directly. Use this field to apply a positive or negative manual adjustment that alters the final figure fed to MRP.
          </p>

          {/* Input */}
          <div className="input-group">
            <label className="input-label">Manual Adjustment Quantity (+ / - units)</label>
            <input
              type="number"
              className="input-field"
              required
              step="any"
              placeholder="e.g. 500 or -250"
              value={data.manualAdjustmentQty ?? ''}
              onChange={e => updateField('manualAdjustmentQty', e.target.value)}
            />
          </div>

          {/* Live Arithmetic Preview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            textAlign: 'center',
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Gross Total</div>
              <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                {currentGross.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Manual Delta</div>
              <div style={{
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: 'monospace',
                color: currentAdjustment > 0 ? '#0284c7' : currentAdjustment < 0 ? '#dc2626' : '#64748b'
              }}>
                {currentAdjustment > 0 ? `+${currentAdjustment.toLocaleString()}` : currentAdjustment.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#b45309', textTransform: 'uppercase', fontWeight: 700 }}>Final Net MRP</div>
              <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#b45309' }}>
                {simulatedNet.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none'
              }}
            >
              {busy ? 'Saving…' : 'Save Adjustment'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
