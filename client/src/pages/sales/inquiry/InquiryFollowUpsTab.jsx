import React from 'react';
import {
  MessageSquare, Plus, Phone, Mail, Users, Globe,
  Calendar, Clock, Edit2, Trash2, AlertCircle, CheckCircle2
} from 'lucide-react';

export const InquiryFollowUpsTab = ({
  selectedInquiry,
  followUps = [],
  onOpenAddFollowUpModal,
  onOpenEditFollowUpModal,
  onDeleteFollowUp
}) => {
  const getMethodBadge = (method) => {
    switch (method) {
      case 'Email':
        return { icon: Mail, color: '#0077b6', bg: 'rgba(0, 180, 216, 0.12)' };
      case 'Phone':
        return { icon: Phone, color: '#d97706', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'Meeting':
        return { icon: Users, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' };
      case 'Customer Portal':
        return { icon: Globe, color: '#059669', bg: 'rgba(16, 185, 129, 0.12)' };
      default:
        return { icon: MessageSquare, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' };
    }
  };

  const getActionDueStatus = (dateStr) => {
    if (!dateStr) return null;
    const due = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `Overdue (${Math.abs(diff)}d ago)`, isUrgent: true, color: '#dc2626', bg: 'rgba(244, 63, 94, 0.12)' };
    if (diff === 0) return { label: `Due today!`, isUrgent: true, color: '#d97706', bg: 'rgba(245, 158, 11, 0.15)' };
    if (diff <= 3) return { label: `Due in ${diff}d`, isUrgent: true, color: '#0077b6', bg: 'rgba(0, 180, 216, 0.12)' };
    return { label: `Due ${due.toLocaleDateString()}`, isUrgent: false, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' };
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
            background: 'rgba(0, 180, 216, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={18} color="#0077b6" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Customer Communication & CRM Follow-up Log
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Track all touchpoints, client clarifications, quote submissions, and scheduled review milestones.
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenAddFollowUpModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: 6
          }}
        >
          <Plus size={14} /> Log Customer Contact
        </button>
      </div>

      {/* ── TIMELINE CONTAINER ─────────────────────────────────────────── */}
      {followUps.length === 0 ? (
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
            background: 'rgba(0, 180, 216, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={24} color="#0077b6" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            No Follow-up Touchpoints Logged Yet
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 440, margin: 0 }}>
            Keep everyone on the commercial and engineering team aligned by documenting telephone calls, customer meetings, email exchanges, and scheduled follow-up dates.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddFollowUpModal}
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}
          >
            <Plus size={13} /> Log First Interaction
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {followUps.map((item, idx) => {
            const badge = getMethodBadge(item.method);
            const Icon = badge.icon;
            const dueStatus = getActionDueStatus(item.nextActionDate);

            return (
              <div
                key={item._id || idx}
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
                {/* Header row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 10px',
                      borderRadius: 16,
                      background: badge.bg,
                      color: badge.color,
                      fontWeight: 700,
                      fontSize: 12
                    }}>
                      <Icon size={13} />
                      <span>{item.method}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      fontWeight: 600
                    }}>
                      <Calendar size={13} />
                      <span>{new Date(item.activityDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {dueStatus && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 10px',
                        borderRadius: 12,
                        background: dueStatus.bg,
                        color: dueStatus.color,
                        fontSize: 11,
                        fontWeight: 700
                      }}>
                        <Clock size={12} />
                        <span>Action Due: {dueStatus.label}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        title="Edit Touchpoint"
                        onClick={() => onOpenEditFollowUpModal(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          padding: 4
                        }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        title="Delete Touchpoint"
                        onClick={() => onDeleteFollowUp(item._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--accent-danger)',
                          padding: 4
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes content */}
                <div style={{
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {item.notes}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InquiryFollowUpsTab;
