import React from 'react';
import {
  GitPullRequest, CheckCircle, XCircle, ArrowRight, Lock,
  Clock, ShieldCheck, Flame, Edit2, Play, CheckCircle2
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const ECRFlightDeck = ({
  selectedECR,
  allApproved,
  approvals = [],
  onChangeStatus,
  onOpenEditModal,
  busy
}) => {
  if (!selectedECR) return null;

  const flow = ['Draft', 'Submitted', 'In Review', 'Approved', 'Implemented', 'Closed'];
  const currentIndex = flow.indexOf(selectedECR.status);
  const nextStatus = currentIndex >= 0 && currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;

  const approvedCount = approvals.filter(a => a.approvalStatus === 'Approved').length;

  return (
    <div style={{
      background: 'var(--surface-canvas)',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      padding: '14px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* ── TOP ROW: DOSSIER IDENTITY & METADATA ────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontFamily: 'monospace',
            fontWeight: 800,
            fontSize: 16,
            color: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '3px 10px',
            borderRadius: 6
          }}>
            {selectedECR.ecrNumber}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {selectedECR.title}
              </h2>
              <StatusBadge value={selectedECR.status} />
              {selectedECR.isLocked && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'rgba(244, 63, 94, 0.15)',
                  color: '#f43f5e',
                  border: '1px solid rgba(244, 63, 94, 0.3)'
                }}>
                  <Lock size={11} /> LOCKED (ECO ACTIVE)
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Category: <strong>{selectedECR.changeType}</strong> • Priority: <strong>{selectedECR.priority}</strong>
              {selectedECR.targetImplementationDate && (
                <span> • Cutover Target: <strong>{new Date(selectedECR.targetImplementationDate).toLocaleDateString()}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!selectedECR.isLocked && (
            <button
              onClick={() => onOpenEditModal('header', { ...selectedECR }, selectedECR._id)}
              className="btn btn-secondary"
              style={{ fontSize: 11.5, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Edit2 size={12} /> Edit Details
            </button>
          )}

          {/* Quick Reject Button */}
          {!selectedECR.isLocked && selectedECR.status !== 'Rejected' && selectedECR.status !== 'Closed' && (
            <button
              onClick={() => onChangeStatus(selectedECR._id, 'Rejected')}
              style={{
                fontSize: 11.5,
                padding: '5px 10px',
                borderRadius: 4,
                border: '1px solid rgba(244, 63, 94, 0.35)',
                background: 'rgba(244, 63, 94, 0.1)',
                color: '#dc2626',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <XCircle size={12} /> Reject ECR
            </button>
          )}

          {/* Special Authorize & Release ECO Button when all approvals done */}
          {!selectedECR.isLocked && selectedECR.status !== 'Approved' && allApproved && (
            <button
              onClick={() => onChangeStatus(selectedECR._id, 'Approved')}
              disabled={busy}
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 5,
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
              }}
            >
              <CheckCircle size={14} />
              <span>{busy ? 'Releasing ECO...' : 'Authorize & Release ECO'}</span>
            </button>
          )}

          {/* Regular Next Stage Button */}
          {!selectedECR.isLocked && nextStatus && nextStatus !== 'Approved' && (
            <button
              onClick={() => onChangeStatus(selectedECR._id, nextStatus)}
              disabled={busy}
              className="btn btn-primary"
              style={{
                fontSize: 11.5,
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span>Advance to {nextStatus}</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── INTERACTIVE LIFECYCLE PROGRESSION STEPPER ──────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--bg-secondary)',
        borderRadius: 6,
        border: '1px solid var(--border-color)',
        overflowX: 'auto',
        gap: 6
      }}>
        {flow.map((step, idx) => {
          const isPassed = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const isPending = currentIndex < idx;

          return (
            <React.Fragment key={step}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: isCurrent ? 800 : 600,
                  whiteSpace: 'nowrap',
                  background: isCurrent ? 'rgba(245, 158, 11, 0.18)' : (isPassed ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary)'),
                  border: '1px solid',
                  borderColor: isCurrent ? '#f59e0b' : (isPassed ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)'),
                  color: isCurrent ? '#d97706' : (isPassed ? '#059669' : 'var(--text-secondary)')
                }}
              >
                {isPassed ? (
                  <CheckCircle2 size={13} color="#059669" />
                ) : isCurrent ? (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                ) : (
                  <span style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>0{idx + 1}</span>
                )}
                <span>{step === 'Approved' ? 'Approved (ECO)' : step}</span>
              </div>

              {idx < flow.length - 1 && (
                <div style={{
                  height: 2,
                  width: 14,
                  background: isPassed ? '#059669' : 'var(--border-color)',
                  flexShrink: 0
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ECRFlightDeck;
