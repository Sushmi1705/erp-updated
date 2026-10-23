import React from 'react';
import {
  Layers, Plus, Copy, Lock, AlertTriangle, ArrowRight,
  XCircle, Printer, Calendar, Clock, CheckCircle2, ShieldCheck
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../../utils/money';

export const QuotationRevisionNavigator = ({
  selectedHeader,
  revisions = [],
  selectedRevision,
  onSelectRevision,
  onOpenNewRevisionModal,
  onChangeRevisionStatus,
  onCloneRevision,
  onOpenPrintModal,
  linesTotalMarginFlag
}) => {
  if (!selectedHeader) return null;

  const statusFlow = ['Draft', 'Pending Approval', 'Approved', 'Sent to Customer', 'Accepted'];
  const currentIndex = selectedRevision ? statusFlow.indexOf(selectedRevision.status) : -1;
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  const isLocked = selectedRevision?.isLocked || ['Approved', 'Sent to Customer', 'Accepted'].includes(selectedRevision?.status);

  // Validity computation
  const getValidityDetails = (validTo) => {
    if (!validTo) return { text: 'Validity date not set', isExpired: false };
    const toDate = new Date(validTo);
    const now = new Date();
    const diffDays = Math.ceil((toDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `Expired by ${Math.abs(diffDays)}d`, isExpired: true };
    if (diffDays === 0) return { text: `Expires today!`, isExpired: true };
    return { text: `Valid for ${diffDays} more days`, isExpired: false };
  };

  const validity = selectedRevision ? getValidityDetails(selectedRevision.validToDate) : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: 'var(--surface-canvas)',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      padding: '14px 18px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* ── TOP BAR: QUOTATION & REVISION CAPSULES ──────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Left: Quote Identifier & Revisions Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: 'monospace',
            fontWeight: 800,
            fontSize: 16,
            color: '#b45309',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '3px 10px',
            borderRadius: 6
          }}>
            {selectedHeader.quotationNumber}
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedHeader.customerId?.name || 'Customer Organization'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Created: {new Date(selectedHeader.createdDate || selectedHeader.createdAt).toLocaleDateString()}</span>
              {selectedHeader.inquiryId && (
                <>
                  <span>•</span>
                  <span>Inquiry Ref: <strong style={{ color: '#0077b6' }}>{selectedHeader.inquiryId?.inquiryNumber}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: + New Version Button */}
        <button
          type="button"
          onClick={onOpenNewRevisionModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#d97706',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Plus size={14} /> Add New Version
        </button>
      </div>

      {/* ── HORIZONTAL REVISION VERSION SELECTOR CAPSULES ───────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        padding: '6px 0',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          paddingRight: 6
        }}>
          Revisions:
        </span>

        {revisions.map((rev) => {
          const isSelected = selectedRevision?._id === rev._id;
          const isRevLocked = rev.isLocked || ['Approved', 'Sent to Customer', 'Accepted'].includes(rev.status);

          return (
            <button
              key={rev._id}
              type="button"
              onClick={() => onSelectRevision(rev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 20,
                background: isSelected ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-secondary)',
                border: isSelected ? '1.5px solid #d97706' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: 12,
                color: isSelected ? '#b45309' : 'var(--text-primary)'
              }}>
                V{rev.revisionNumber}
              </span>

              <StatusBadge value={rev.status} />

              <span style={{
                fontFamily: 'monospace',
                fontSize: 11.5,
                fontWeight: 700,
                color: isSelected ? '#059669' : 'var(--text-primary)'
              }}>
                {fmtMoneyFull(rev.grandTotal || 0)}
              </span>

              {rev.marginTriggered && (
                <span title="Low profit margin warning (<15%)" style={{ color: '#d97706' }}>
                  <AlertTriangle size={12} />
                </span>
              )}

              {isRevLocked && (
                <span title="Locked version" style={{ color: 'var(--text-secondary)' }}>
                  <Lock size={11} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── SELECTED REVISION COMMERCIAL COCKPIT ────────────────────────── */}
      {selectedRevision && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingTop: 4
        }}>
          {/* Main Cockpit Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            background: 'var(--bg-secondary)',
            padding: '12px 16px',
            borderRadius: 6,
            border: '1px solid var(--border-color)'
          }}>
            {/* Left: Financial Totals */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Active Proposal
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Version {selectedRevision.revisionNumber}
                </div>
              </div>

              <div style={{ height: 26, width: 1, background: 'var(--border-color)' }} />

              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Net Total Payable
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>
                  {fmtMoneyFull(selectedRevision.grandTotal || 0)}
                </div>
              </div>

              <div style={{ height: 26, width: 1, background: 'var(--border-color)' }} />

              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Validity Period
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: validity?.isExpired ? '#dc2626' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} />
                  <span>{validity?.text}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    ({new Date(selectedRevision.validFromDate).toLocaleDateString()} – {new Date(selectedRevision.validToDate).toLocaleDateString()})
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Revision Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Print Quotation */}
              <button
                type="button"
                onClick={onOpenPrintModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'var(--surface-canvas)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Printer size={13} color="#d97706" /> Print Formal Quote
              </button>

              {/* Clone to new Draft */}
              <button
                type="button"
                onClick={() => onCloneRevision(selectedRevision._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'var(--surface-canvas)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Create a new draft version copied from this revision"
              >
                <Copy size={13} color="#0077b6" /> Clone to V{revisions.length + 1}
              </button>

              {/* Advance Status Button */}
              {!isLocked && nextStatus && selectedRevision.status !== 'Rejected' && selectedRevision.status !== 'Expired' && (
                <button
                  type="button"
                  onClick={() => onChangeRevisionStatus(selectedRevision._id, nextStatus)}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    padding: '6px 14px',
                    fontWeight: 700
                  }}
                >
                  <span>Advance to {nextStatus}</span>
                  <ArrowRight size={13} />
                </button>
              )}

              {/* Reject button */}
              {!['Rejected', 'Expired', 'Accepted'].includes(selectedRevision.status) && (
                <button
                  type="button"
                  onClick={() => onChangeRevisionStatus(selectedRevision._id, 'Rejected')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#dc2626',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <XCircle size={13} /> Reject
                </button>
              )}
            </div>
          </div>

          {/* Stepper Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'var(--surface-canvas)',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            overflowX: 'auto',
            gap: 6
          }}>
            {statusFlow.map((step, idx) => {
              const isPassed = currentIndex > idx;
              const isCurrent = currentIndex === idx;

              return (
                <React.Fragment key={step}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: isCurrent ? 800 : 600,
                      whiteSpace: 'nowrap',
                      background: isCurrent ? 'rgba(245, 158, 11, 0.15)' : (isPassed ? 'rgba(16, 185, 129, 0.1)' : 'transparent'),
                      border: '1px solid',
                      borderColor: isCurrent ? '#f59e0b' : (isPassed ? 'rgba(16, 185, 129, 0.3)' : 'transparent'),
                      color: isCurrent ? '#b45309' : (isPassed ? '#059669' : 'var(--text-secondary)')
                    }}
                  >
                    {isPassed ? (
                      <CheckCircle2 size={12} color="#059669" />
                    ) : isCurrent ? (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                    ) : (
                      <span style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>0{idx + 1}</span>
                    )}
                    <span>{step}</span>
                  </div>

                  {idx < statusFlow.length - 1 && (
                    <div style={{
                      height: 2,
                      width: 12,
                      background: isPassed ? '#059669' : 'var(--border-color)',
                      flexShrink: 0
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Warning / Lock Notice Badges */}
          {(linesTotalMarginFlag || selectedRevision.marginTriggered) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 6,
              fontSize: 12,
              color: '#d97706'
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>
                <strong>Margin Guardrail Triggered:</strong> One or more line items earn less than 15% profit margin. Under Precision commercial policy, this version requires managerial approval before it can be sent to the customer.
              </span>
            </div>
          )}

          {isLocked && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'rgba(100, 116, 139, 0.08)',
              border: '1px solid rgba(100, 116, 139, 0.25)',
              borderRadius: 6,
              fontSize: 11.5,
              color: 'var(--text-secondary)'
            }}>
              <Lock size={13} />
              <span>
                This version is locked ({selectedRevision.status}). To adjust prices, discounts, or terms, click <strong>Clone to V{revisions.length + 1}</strong> above to spawn a new editable draft.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuotationRevisionNavigator;
