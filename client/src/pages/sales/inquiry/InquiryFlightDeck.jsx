import React from 'react';
import {
  FileText, Building, User, Clock, Lock, CheckCircle, XCircle,
  ArrowRight, Edit2, Award, AlertTriangle, ShieldCheck, CheckCircle2,
  Printer
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const InquiryFlightDeck = ({
  selectedInquiry,
  lineItems = [],
  onChangeStatus,
  onOpenEditModal,
  onOpenPrint,
  busy
}) => {
  if (!selectedInquiry) return null;

  const isLocked = !!selectedInquiry.quotationId;
  const statusFlow = ['New', 'Active', 'Feasibility Check', 'Quoted', 'Closed-Won'];
  const currentIndex = statusFlow.indexOf(selectedInquiry.status);
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;

  // Sales rep formatted name
  let repName = 'Unassigned';
  if (selectedInquiry.salesRepId) {
    if (typeof selectedInquiry.salesRepId === 'object') {
      repName = `${selectedInquiry.salesRepId.firstName || ''} ${selectedInquiry.salesRepId.lastName || ''}`.trim() || selectedInquiry.salesRepId.name || selectedInquiry.salesRepId.email || 'Sales Rep';
    } else {
      repName = selectedInquiry.salesRepId;
    }
  }

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
      {/* ── TOP LINE: INQUIRY IDENTIFIER, CUSTOMER & ACTIONS ────────────── */}
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
            color: '#0077b6',
            background: 'rgba(0, 180, 216, 0.12)',
            border: '1px solid rgba(0, 180, 216, 0.35)',
            padding: '3px 10px',
            borderRadius: 6
          }}>
            {selectedInquiry.inquiryNumber}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {selectedInquiry.customerId?.name || 'Customer'}
              </h2>
              {selectedInquiry.customerId?.code && (
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  ({selectedInquiry.customerId.code})
                </span>
              )}
              <StatusBadge value={selectedInquiry.status} />
              {isLocked && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'rgba(2, 132, 199, 0.12)',
                  color: '#0284c7',
                  border: '1px solid rgba(2, 132, 199, 0.3)'
                }}>
                  <Lock size={11} /> QUOTATION GENERATED (LOCKED)
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>Type: <strong>{selectedInquiry.inquiryType}</strong></span>
              <span>•</span>
              <span>Sales Rep: <strong>{repName}</strong></span>
              <span>•</span>
              <span>Recv: <strong>{new Date(selectedInquiry.dateReceived).toLocaleDateString()}</strong></span>
              <span>•</span>
              <span>Win Chance: <strong style={{ color: (selectedInquiry.probabilityOfWin || 0) >= 60 ? '#059669' : '#d97706' }}>{selectedInquiry.probabilityOfWin || 0}%</strong></span>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {onOpenPrint && (
            <button
              type="button"
              onClick={onOpenPrint}
              className="btn btn-secondary"
              style={{ fontSize: 11.5, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
              title="Print RFQ & Engineering Feasibility Dossier"
            >
              <Printer size={13} color="#0077b6" /> Print RFQ
            </button>
          )}

          {!isLocked && (
            <button
              onClick={() => onOpenEditModal('header', {
                ...selectedInquiry,
                customerId: selectedInquiry.customerId?._id || selectedInquiry.customerId,
                salesRepId: selectedInquiry.salesRepId?._id || selectedInquiry.salesRepId,
                contactPersonId: selectedInquiry.contactPersonId?._id || selectedInquiry.contactPersonId,
                dateReceived: selectedInquiry.dateReceived ? selectedInquiry.dateReceived.split('T')[0] : '',
                targetQuotationDate: selectedInquiry.targetQuotationDate ? selectedInquiry.targetQuotationDate.split('T')[0] : ''
              }, selectedInquiry._id)}
              className="btn btn-secondary"
              style={{ fontSize: 11.5, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Edit2 size={12} /> Edit Inquiry
            </button>
          )}

          {/* Advance status button */}
          {!isLocked && nextStatus && selectedInquiry.status !== 'Closed-Lost' && (
            <button
              onClick={() => onChangeStatus(selectedInquiry._id, nextStatus)}
              disabled={busy}
              className="btn btn-primary"
              style={{
                fontSize: 11.5,
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)'
              }}
            >
              <span>Advance to {nextStatus}</span>
              <ArrowRight size={12} />
            </button>
          )}

          {/* Mark Won button */}
          {selectedInquiry.status === 'Quoted' && (
            <button
              onClick={() => onChangeStatus(selectedInquiry._id, 'Closed-Won')}
              disabled={busy}
              style={{
                fontSize: 11.5,
                padding: '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Award size={13} />
              <span>Mark Won 🏆</span>
            </button>
          )}

          {/* Mark Lost button */}
          {selectedInquiry.status !== 'Closed-Lost' && selectedInquiry.status !== 'Closed-Won' && (
            <button
              onClick={() => onChangeStatus(selectedInquiry._id, 'Closed-Lost')}
              disabled={busy}
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
              <XCircle size={12} /> Close as Lost
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
        {statusFlow.map((step, idx) => {
          const isPassed = currentIndex > idx;
          const isCurrent = currentIndex === idx;

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
                  background: isCurrent ? 'rgba(0, 180, 216, 0.18)' : (isPassed ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary)'),
                  border: '1px solid',
                  borderColor: isCurrent ? '#00b4d8' : (isPassed ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)'),
                  color: isCurrent ? '#0077b6' : (isPassed ? '#059669' : 'var(--text-secondary)')
                }}
              >
                {isPassed ? (
                  <CheckCircle2 size={13} color="#059669" />
                ) : isCurrent ? (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00b4d8', display: 'inline-block' }} />
                ) : (
                  <span style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>0{idx + 1}</span>
                )}
                <span>{step}</span>
              </div>

              {idx < statusFlow.length - 1 && (
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

export default InquiryFlightDeck;
