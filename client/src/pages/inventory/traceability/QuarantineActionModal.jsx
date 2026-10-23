import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

const QuarantineActionModal = ({
  isOpen,
  onClose,
  entity,
  allEntities = [],
  onUpdateStatus,
  updating = false
}) => {
  if (!isOpen) return null;

  const [selectedEntityId, setSelectedEntityId] = useState(entity?._id || allEntities[0]?._id || '');
  const [targetStatus, setTargetStatus] = useState('Quarantined');
  const [reason, setReason] = useState('Quality Nonconformance Containment Hold (IATF § 8.7)');

  useEffect(() => {
    if (entity) {
      setSelectedEntityId(entity._id);
      setTargetStatus(entity.Current_Status === 'Quarantined' ? 'Active' : 'Quarantined');
    }
  }, [entity]);

  const selectedEnt = allEntities.find(e => e._id === selectedEntityId) || entity;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEntityId) return;
    onUpdateStatus({
      id: selectedEntityId,
      status: targetStatus,
      reason
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        border: targetStatus === 'Quarantined' ? '2px solid #ef4444' : '2px solid #059669',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {targetStatus === 'Quarantined' ? <ShieldAlert size={18} color="#ef4444" /> : <ShieldCheck size={18} color="#059669" />}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {targetStatus === 'Quarantined' ? 'Quality Containment Quarantine Hold' : 'Release Batch to Active Stock'}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Enforces IATF 16949 Section 8.7 Control of Nonconforming Outputs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* Target Entity Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Select Batch / Heat:
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => {
                setSelectedEntityId(e.target.value);
                const ent = allEntities.find(x => x._id === e.target.value);
                if (ent) setTargetStatus(ent.Current_Status === 'Quarantined' ? 'Active' : 'Quarantined');
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {allEntities.map(e => (
                <option key={e._id} value={e._id}>
                  {e.Tracking_Number} ({e.Material_ID?.name || 'Material'}) — Currently: {e.Current_Status}
                </option>
              ))}
            </select>
          </div>

          {/* Action Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Containment Action:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setTargetStatus('Quarantined')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: targetStatus === 'Quarantined' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                  background: targetStatus === 'Quarantined' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary)',
                  color: targetStatus === 'Quarantined' ? '#dc2626' : 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Place on Quarantine
              </button>
              <button
                type="button"
                onClick={() => setTargetStatus('Active')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: targetStatus === 'Active' ? '2px solid #059669' : '1px solid var(--border-color)',
                  background: targetStatus === 'Active' ? 'rgba(5, 150, 105, 0.12)' : 'var(--bg-secondary)',
                  color: targetStatus === 'Active' ? '#047857' : 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Release to Active
              </button>
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Quality Investigation Reason / Containment Note:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Surface blister defect observed on coil edge; quarantined pending metallurgy lab hardness verification."
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                lineHeight: '1.4'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: targetStatus === 'Quarantined' ? '#dc2626' : '#059669',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: updating ? 'not-allowed' : 'pointer',
                opacity: updating ? 0.7 : 1
              }}
            >
              {updating ? 'Updating...' : targetStatus === 'Quarantined' ? 'Enforce Quarantine' : 'Confirm Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuarantineActionModal;
