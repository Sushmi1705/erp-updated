import React from 'react';
import { Lock, AlertTriangle, ShieldAlert } from 'lucide-react';
import Modal from '../../../components/common/Modal';

export const LockRunModal = ({
  isOpen,
  onClose,
  onSubmit,
  run = null,
  busy = false
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lock Demand Run for MRP Explosion"
    >
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Warning Card */}
          <div style={{
            padding: '16px 18px',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <ShieldAlert size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>
                Irreversible Production Commitment Warning
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: 1.5 }}>
                Marking Run <strong>{run?.runNumber}</strong> as <strong>Consumed_By_MRP</strong> locks all gross and net demand figures permanently.
                <br /><br />
                Material Requirements Planning (MRP) will directly consume these quantities to explode Bills of Materials (BOMs), trigger work orders, and generate purchase requisitions. No further manual adjustments can be made to this snapshot.
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
                background: '#dc2626',
                borderColor: '#dc2626',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
              }}
            >
              {busy ? 'Locking Snapshot…' : 'Lock & Send to Material Planning'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
