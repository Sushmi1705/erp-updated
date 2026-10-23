import React, { useState } from 'react';
import {
  UserCheck, Plus, CheckCircle, XCircle, RefreshCw,
  Trash2, ShieldCheck, Clock, AlertTriangle, User
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const QuotationApprovalsTab = ({
  selectedRevision,
  approvals = [],
  onOpenAddApprovalModal,
  onActionApproval,
  onDeleteApproval
}) => {
  const [activeNotesId, setActiveNotesId] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const isLocked = selectedRevision?.isLocked || ['Approved', 'Sent to Customer', 'Accepted'].includes(selectedRevision?.status);

  const approvedCount = approvals.filter(a => a.actionTaken === 'Approved').length;

  const handleAction = (approvalId, action) => {
    onActionApproval(approvalId, action, decisionNotes);
    setActiveNotesId(null);
    setDecisionNotes('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── HEADER STRIP ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCheck size={18} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Commercial Approval Chain & Executive Sign-off
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              {approvedCount} of {approvals.length} designated role(s) have approved this revision.
            </div>
          </div>
        </div>

        {!isLocked && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddApprovalModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 14px'
            }}
          >
            <Plus size={14} /> Add Approver Role
          </button>
        )}
      </div>

      {/* ── APPROVAL CARDS ─────────────────────────────────────────────── */}
      {approvals.length === 0 ? (
        <div style={{
          padding: '36px 20px',
          textAlign: 'center',
          background: 'var(--surface-canvas)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCheck size={24} color="#d97706" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            No Approvers Configured for this Revision
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 440, margin: 0 }}>
            Establish accountability by assigning managerial or finance roles that must review and clear this proposal before release.
          </p>
          {!isLocked && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenAddApprovalModal}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}
            >
              <Plus size={13} /> Add First Approver Role
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {approvals.map((appr, idx) => {
            const hasDecided = !!appr.actionTaken;
            const isEditingNotes = activeNotesId === appr._id;

            return (
              <div
                key={appr._id || idx}
                style={{
                  background: 'var(--surface-canvas)',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  {/* Role & Person */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      background: appr.actionTaken === 'Approved'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : appr.actionTaken === 'Rejected'
                        ? 'rgba(244, 63, 94, 0.15)'
                        : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {appr.actionTaken === 'Approved' ? (
                        <CheckCircle size={16} color="#059669" />
                      ) : appr.actionTaken === 'Rejected' ? (
                        <XCircle size={16} color="#dc2626" />
                      ) : (
                        <Clock size={16} color="#d97706" />
                      )}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                        {appr.approverRoleId?.name || 'Approver Role'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        Assigned: <strong>{appr.approverUserId?.name || 'Any user in role'}</strong>
                        {appr.actionAt && (
                          <span style={{ marginLeft: 8 }}>
                            • Decided on {new Date(appr.actionAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Decision Status or Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {hasDecided ? (
                      <StatusBadge value={appr.actionTaken} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleAction(appr._id, 'Approved')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            borderRadius: 4,
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#059669',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAction(appr._id, 'Rejected')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            borderRadius: 4,
                            border: '1px solid rgba(244, 63, 94, 0.35)',
                            background: 'rgba(244, 63, 94, 0.12)',
                            color: '#dc2626',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <XCircle size={13} /> Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingNotes) {
                              handleAction(appr._id, 'Requested Changes');
                            } else {
                              setActiveNotesId(appr._id);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            borderRadius: 4,
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#d97706',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <RefreshCw size={13} /> Request Changes
                        </button>
                      </div>
                    )}

                    {!isLocked && (
                      <button
                        type="button"
                        title="Remove approver"
                        onClick={() => onDeleteApproval(appr._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes input or display */}
                {isEditingNotes && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6 }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Add explanation for requesting changes…"
                      value={decisionNotes}
                      onChange={e => setDecisionNotes(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => setActiveNotesId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => handleAction(appr._id, 'Requested Changes')}
                      >
                        Submit Changes Request
                      </button>
                    </div>
                  </div>
                )}

                {appr.approvalNotes && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 4,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                  }}>
                    "{appr.approvalNotes}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuotationApprovalsTab;
