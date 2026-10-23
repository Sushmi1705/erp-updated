import React from 'react';
import {
  Package, Building, Calendar, DollarSign, Clock, Lock,
  CheckCircle2, XCircle, ArrowRight, Printer, AlertTriangle,
  ZapOff, Edit2, Truck, Factory
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../../utils/money';

export const OrderFlightDeck = ({
  selectedOrder,
  onChangeStatus,
  onOpenEditOrderModal,
  onOpenPrintModal,
  linesCount = 0
}) => {
  if (!selectedOrder) return null;

  const statusFlow = ['Draft', 'Pending Approval', 'Approved', 'Processing', 'Partially Shipped', 'Completed'];
  const currentIndex = statusFlow.indexOf(selectedOrder.status);
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  const hasHold = selectedOrder.holdStatus && selectedOrder.holdStatus !== 'None';

  // Delivery commitment countdown
  const getDeliverySla = (commitDate) => {
    if (!commitDate) return { text: 'No delivery date promised', isOverdue: false };
    const target = new Date(commitDate);
    const now = new Date();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
    if (diffDays === 0) return { text: `Due for dispatch today!`, isOverdue: true };
    if (diffDays <= 5) return { text: `Dispatch due in ${diffDays}d`, isOverdue: false };
    return { text: `Promised for ${target.toLocaleDateString()} (${diffDays}d remaining)`, isOverdue: false };
  };

  const sla = getDeliverySla(selectedOrder.deliveryCommitmentDate);

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
      {/* ── TOP LINE: ORDER INFO & ACTIONS ──────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Left: Identifiers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontFamily: 'monospace',
            fontWeight: 800,
            fontSize: 16,
            color: '#059669',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            padding: '3px 10px',
            borderRadius: 6
          }}>
            {selectedOrder.orderNumber}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedOrder.customerId?.name || 'Customer Organization'}
              </span>
              <StatusBadge value={selectedOrder.status} />
              {hasHold && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(244, 63, 94, 0.15)',
                  color: '#dc2626'
                }}>
                  <ZapOff size={12} /> {selectedOrder.holdStatus}
                </span>
              )}
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>Customer PO: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{selectedOrder.customerPONumber || 'N/A'}</strong></span>
              <span>•</span>
              <span>Order Date: <strong>{new Date(selectedOrder.orderDate).toLocaleDateString()}</strong></span>
              <span>•</span>
              <span style={{ color: sla.isOverdue ? '#dc2626' : '#059669', fontWeight: 600 }}>
                {sla.text}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Print Dispatch Release Note */}
          <button
            type="button"
            onClick={onOpenPrintModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 6,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Printer size={13} color="#059669" /> Print Dispatch Note
          </button>

          {/* Edit Order */}
          <button
            type="button"
            onClick={() => onOpenEditOrderModal(selectedOrder)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 6,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Edit2 size={13} /> Edit Order
          </button>

          {/* Advance Status */}
          {nextStatus && !['Completed', 'Cancelled'].includes(selectedOrder.status) && !hasHold && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onChangeStatus(selectedOrder._id, nextStatus)}
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

          {/* Cancel */}
          {!['Completed', 'Cancelled'].includes(selectedOrder.status) && (
            <button
              type="button"
              onClick={() => onChangeStatus(selectedOrder._id, 'Cancelled')}
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
              <XCircle size={13} /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* ── HOLD WARNING STRIP ─────────────────────────────────────────── */}
      {hasHold && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          borderRadius: 6,
          fontSize: 12,
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>
            <strong>Order on Commercial Hold ({selectedOrder.holdStatus}):</strong> Production and delivery releases are frozen. Clear the credit or quality hold with the finance department before advancing this order.
          </span>
        </div>
      )}

      {/* ── PROGRESSION STEPPER ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
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
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: isCurrent ? 800 : 600,
                  whiteSpace: 'nowrap',
                  background: isCurrent ? 'rgba(16, 185, 129, 0.18)' : (isPassed ? 'rgba(16, 185, 129, 0.1)' : 'transparent'),
                  border: '1px solid',
                  borderColor: isCurrent ? '#10b981' : (isPassed ? 'rgba(16, 185, 129, 0.3)' : 'transparent'),
                  color: isCurrent ? '#059669' : (isPassed ? '#059669' : 'var(--text-secondary)')
                }}
              >
                {isPassed ? (
                  <CheckCircle2 size={12} color="#059669" />
                ) : isCurrent ? (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
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
    </div>
  );
};

export default OrderFlightDeck;
