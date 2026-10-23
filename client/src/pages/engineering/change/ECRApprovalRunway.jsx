import React from 'react';
import {
  UserCheck, Plus, CheckCircle, XCircle, Clock, Shield,
  AlertTriangle, Edit2, Trash2, Award, CheckCircle2, User
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const ECRApprovalRunway = ({
  selectedECR,
  approvals = [],
  onOpenApprovalModal,
  onSignApproval,
  onDeleteApproval,
  busy
}) => {
  const approvedCount = approvals.filter(a => a.approvalStatus === 'Approved').length;
  const rejectedCount = approvals.filter(a => a.approvalStatus === 'Rejected').length;
  const pendingCount = approvals.filter(a => a.approvalStatus === 'Pending').length;
  const totalCount = approvals.length;
  const progressPct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const isAllApproved = totalCount > 0 && approvedCount === totalCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── TOP RUNWAY HEADER & PROGRESS ─────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <UserCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                IATF 16949 Multi-Disciplinary Sign-Off Runway
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Required cross-functional approval chain (Quality, Production, Tooling & Design)
              </div>
            </div>
          </div>

          {!selectedECR.isLocked && (
            <button
              onClick={() => onOpenApprovalModal('approval', {
                approvalStep: approvals.length + 1,
                approvalStatus: 'Pending'
              })}
              className="btn btn-primary"
              style={{
                fontSize: 11.5,
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Plus size={13} /> Add Approval Gate
            </button>
          )}
        </div>

        {/* Runway Progress Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Sign-Off Completion: <strong style={{ color: isAllApproved ? '#059669' : '#d97706' }}>{approvedCount} of {totalCount} Gates Approved</strong>
              {rejectedCount > 0 && <span style={{ color: '#dc2626', marginLeft: 8 }}>• {rejectedCount} Rejected</span>}
            </span>
            <span style={{ fontFamily: 'monospace', color: isAllApproved ? '#059669' : '#d97706', fontWeight: 700 }}>
              {progressPct}% Completed
            </span>
          </div>

          <div style={{
            height: 8,
            borderRadius: 4,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            display: 'flex'
          }}>
            <div style={{
              width: `${progressPct}%`,
              background: isAllApproved ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Readiness Alert */}
        {isAllApproved ? (
          <div style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#047857',
            fontSize: 11.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle2 size={15} color="#059669" />
            <span>All approval gates secured! This change is ready for official ECO release and automated revision cutover.</span>
          </div>
        ) : (
          <div style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#b45309',
            fontSize: 11.5,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Clock size={15} color="#d97706" />
            <span>Awaiting sign-off from {pendingCount} pending department(s). ECR cannot be locked into an approved ECO until all gates pass.</span>
          </div>
        )}
      </div>

      {/* ── STATIONS CARDS LIST ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {approvals.length === 0 ? (
          <div style={{
            padding: 32,
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            border: '1px dashed var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: 12
          }}>
            No approval gates assigned yet. Click "Add Approval Gate" above to configure your cross-functional sign-off runway.
          </div>
        ) : (
          approvals.map((appr, idx) => {
            const isApproved = appr.approvalStatus === 'Approved';
            const isRejected = appr.approvalStatus === 'Rejected';
            const isPending = appr.approvalStatus === 'Pending';

            return (
              <div
                key={appr._id}
                style={{
                  background: isApproved ? 'rgba(16, 185, 129, 0.04)' : (isRejected ? 'rgba(244, 63, 94, 0.04)' : 'var(--bg-secondary)'),
                  border: '1px solid',
                  borderColor: isApproved ? 'rgba(16, 185, 129, 0.35)' : (isRejected ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-color)'),
                  borderRadius: 8,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Left: Step Tag & Role */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 55,
                    borderRight: '1px solid var(--border-color)',
                    paddingRight: 12
                  }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>GATE</span>
                    <span style={{
                      fontSize: 16,
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: isApproved ? '#059669' : (isRejected ? '#dc2626' : '#d97706')
                    }}>
                      0{appr.approvalStep}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                      }}>
                        {appr.requiredRole?.name || 'Department Role'}
                      </span>
                      <StatusBadge value={appr.approvalStatus} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={12} color="#64748b" />
                        {appr.assignedUserId?.name ? `${appr.assignedUserId.name} (${appr.assignedUserId.email})` : 'Unassigned Engineer'}
                      </span>
                      {appr.approvalDate && (
                        <span>• Signed: {new Date(appr.approvalDate).toLocaleString()}</span>
                      )}
                    </div>

                    {appr.comments && (
                      <div style={{
                        fontSize: 11,
                        color: 'var(--text-primary)',
                        marginTop: 6,
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        fontStyle: 'italic'
                      }}>
                        "{appr.comments}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Quick Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!selectedECR.isLocked && isPending && (
                    <>
                      <button
                        onClick={() => onSignApproval(appr._id, 'Approved')}
                        disabled={busy}
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          color: '#059669',
                          borderRadius: 5,
                          padding: '6px 12px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <CheckCircle size={13} />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => onSignApproval(appr._id, 'Rejected')}
                        disabled={busy}
                        style={{
                          background: 'rgba(244, 63, 94, 0.15)',
                          border: '1px solid rgba(244, 63, 94, 0.35)',
                          color: '#dc2626',
                          borderRadius: 5,
                          padding: '6px 12px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {!selectedECR.isLocked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
                      <button
                        onClick={() => onOpenApprovalModal('approval', {
                          ...appr,
                          requiredRole: appr.requiredRole?._id || appr.requiredRole,
                          assignedUserId: appr.assignedUserId?._id || appr.assignedUserId
                        }, appr._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          padding: 5
                        }}
                        title="Edit Gate"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={() => onDeleteApproval(appr._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--accent-danger)',
                          padding: 5
                        }}
                        title="Delete Gate"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ECRApprovalRunway;
