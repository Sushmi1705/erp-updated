import React from 'react';
import {
  FileText, Building, User, Clock, Lock, Target, AlertTriangle,
  Award, TrendingUp, Calendar, ChevronRight
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const InquiryDossierList = ({
  headers = [],
  selectedInquiry,
  onSelectInquiry,
  loading
}) => {
  const getWinStyle = (prob, status) => {
    if (status === 'Closed-Won') return { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', label: 'WON 🏆' };
    if (status === 'Closed-Lost') return { bg: 'rgba(244, 63, 94, 0.12)', color: '#dc2626', label: 'LOST' };
    if (prob >= 70) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', label: `${prob}% WIN` };
    if (prob >= 40) return { bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706', label: `${prob}% WIN` };
    return { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748b', label: `${prob}% WIN` };
  };

  const getDueDateLabel = (dateStr) => {
    if (!dateStr) return { text: 'No due date', isUrgent: false };
    const due = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)}d`, isUrgent: true };
    if (diffDays === 0) return { text: `Due today!`, isUrgent: true };
    if (diffDays <= 3) return { text: `Due in ${diffDays}d`, isUrgent: true };
    return { text: due.toLocaleDateString(), isUrgent: false };
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {/* Dossier Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface-canvas)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Building size={14} color="#00b4d8" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            Customer Inquiry Dossiers
          </span>
        </div>
        <span style={{
          fontSize: 10.5,
          fontWeight: 700,
          padding: '1px 6px',
          borderRadius: 4,
          background: 'rgba(0, 180, 216, 0.15)',
          color: '#00b4d8'
        }}>
          {headers.length} Records
        </span>
      </div>

      {/* Cards Scroll Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        maxHeight: 'calc(100vh - 230px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
            Loading inquiries...
          </div>
        ) : headers.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
            No customer inquiries found matching filters.
          </div>
        ) : (
          headers.map(inq => {
            const isSelected = selectedInquiry?._id === inq._id;
            const win = getWinStyle(inq.probabilityOfWin || 0, inq.status);
            const due = getDueDateLabel(inq.targetQuotationDate);

            // Sales rep name
            let repName = 'Unassigned';
            if (inq.salesRepId) {
              if (typeof inq.salesRepId === 'object') {
                repName = `${inq.salesRepId.firstName || ''} ${inq.salesRepId.lastName || ''}`.trim() || inq.salesRepId.name || inq.salesRepId.email || 'Sales Rep';
              } else {
                repName = inq.salesRepId;
              }
            }

            return (
              <div
                key={inq._id}
                onClick={() => onSelectInquiry(inq)}
                style={{
                  position: 'relative',
                  padding: '11px 13px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isSelected ? '#00b4d8' : 'var(--border-color)',
                  background: isSelected ? 'rgba(0, 180, 216, 0.08)' : 'var(--bg-primary)',
                  boxShadow: isSelected ? '0 0 0 1px rgba(0, 180, 216, 0.35), 0 2px 8px rgba(0, 180, 216, 0.15)' : 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Active Indicator Strip */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3.5,
                    background: '#00b4d8',
                    borderRadius: '6px 0 0 6px'
                  }} />
                )}

                {/* Top Line: Inquiry Number & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: 11.5,
                      color: isSelected ? '#0077b6' : 'var(--text-primary)',
                      background: isSelected ? 'rgba(0, 180, 216, 0.18)' : 'var(--bg-secondary)',
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      {inq.inquiryNumber}
                    </span>
                    {inq.quotationId && (
                      <span title="Locked (Quotation Generated)" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                        <Lock size={12} />
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: win.bg,
                      color: win.color,
                      border: '1px solid currentColor'
                    }}>
                      {win.label}
                    </span>
                    <StatusBadge value={inq.status} />
                  </div>
                </div>

                {/* Customer Name */}
                <div style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  lineHeight: 1.25,
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <Building size={13} color="#00b4d8" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inq.customerId?.name || 'Unassigned Customer'}
                  </span>
                </div>

                {/* Salesperson & Type */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={11} /> {repName}
                  </span>
                  <span style={{
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: 'var(--bg-secondary)',
                    fontWeight: 600,
                    fontSize: 10
                  }}>
                    {inq.inquiryType}
                  </span>
                </div>

                {/* Bottom Row: Date Received & Target Quote Due */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 10.5,
                  paddingTop: 5,
                  borderTop: '1px dashed var(--border-color)',
                  color: 'var(--text-secondary)'
                }}>
                  <span>Recv: {new Date(inq.dateReceived).toLocaleDateString()}</span>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    color: due.isUrgent ? '#dc2626' : 'var(--text-secondary)',
                    fontWeight: due.isUrgent ? 700 : 400
                  }}>
                    <Clock size={11} />
                    Quote Due: {due.text}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InquiryDossierList;
