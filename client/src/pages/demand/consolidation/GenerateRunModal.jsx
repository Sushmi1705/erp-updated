import React from 'react';
import { RefreshCw, GitMerge, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import Modal from '../../../components/common/Modal';

export const GenerateRunModal = ({
  isOpen,
  onClose,
  onSubmit,
  data = {},
  updateField,
  busy = false
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Execute Demand Consolidation Run"
    >
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Explanation Alert */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            padding: '14px 18px',
            fontSize: '12px',
            color: '#334155',
            lineHeight: 1.5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>
              <GitMerge size={16} />
              <span>Consensus Demand Synthesis Engine</span>
            </div>
            <div>
              This process aggregates all <strong>Finalized Forecasts</strong> and <strong>Approved Sales Orders</strong> matching your target horizon into a unified net demand figure per finished part.
              <br />
              Where sales orders cover existing forecast commitments, they automatically consume the forecast to prevent double-counting.
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Planning Period Name * (e.g. Q4-2026 or Oct 2026 - Dec 2026)</label>
              <input
                type="text"
                className="input-field"
                required
                placeholder="e.g. Q4-2026 or Oct 2026 - Dec 2026"
                value={data.period || ''}
                onChange={e => updateField('period', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Horizon Start Date *</label>
              <input
                type="date"
                className="input-field"
                required
                value={data.targetHorizonStart || ''}
                onChange={e => updateField('targetHorizonStart', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Horizon End Date *</label>
              <input
                type="date"
                className="input-field"
                required
                value={data.targetHorizonEnd || ''}
                onChange={e => updateField('targetHorizonEnd', e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
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
                border: 'none',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
              }}
            >
              {busy ? 'Consolidating…' : 'Synthesize Consensus Demand'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
