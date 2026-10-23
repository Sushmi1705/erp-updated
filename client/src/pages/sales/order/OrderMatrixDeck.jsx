import React from 'react';
import {
  Package, Building, Calendar, DollarSign, Clock, Lock,
  CheckCircle, XCircle, ChevronRight, Edit2, AlertTriangle, ZapOff, Truck
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../../utils/money';

export const OrderMatrixDeck = ({
  orders = [],
  selectedOrder,
  onSelectOrder,
  onOpenEditOrderModal,
  onChangeStatus,
  loading
}) => {
  const statusFlow = ['Draft', 'Pending Approval', 'Approved', 'Processing', 'Partially Shipped', 'Completed'];
  const nextStat = s => statusFlow[statusFlow.indexOf(s) + 1];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-canvas)',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {/* Header Bar */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={15} color="#059669" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Confirmed Sales Orders Queue
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#059669',
            fontFamily: 'monospace'
          }}>
            {orders.length}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          Click an order to inspect parts, release schedules & inventory allocation
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
          Loading confirmed sales orders…
        </div>
      ) : orders.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
          No sales orders match your search and filter parameters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 430px)', minHeight: 180 }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 12
          }}>
            <thead>
              <tr style={{
                background: 'var(--surface-canvas)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '8px 12px' }}>Order Number</th>
                <th style={{ padding: '8px 12px' }}>Customer Account</th>
                <th style={{ padding: '8px 12px' }}>Customer PO #</th>
                <th style={{ padding: '8px 12px' }}>Order Date</th>
                <th style={{ padding: '8px 12px' }}>Promised Delivery</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Payable</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Commercial Hold</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Order Status</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((row, idx) => {
                const isSelected = selectedOrder?._id === row._id;
                const next = nextStat(row.status);
                const hasHold = row.holdStatus && row.holdStatus !== 'None';

                return (
                  <tr
                    key={row._id || idx}
                    onClick={() => onSelectOrder(row)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(16, 185, 129, 0.08)'
                        : idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Order Number */}
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: 12,
                        color: isSelected ? '#059669' : 'var(--text-primary)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-secondary)',
                        padding: '2px 7px',
                        borderRadius: 4
                      }}>
                        {row.orderNumber}
                      </span>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {row.customerId?.name || '—'}
                      </div>
                      {row.customerId?.code && (
                        <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          [{row.customerId.code}]
                        </div>
                      )}
                    </td>

                    {/* Customer PO # */}
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {row.customerPONumber || <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>

                    {/* Order Date */}
                    <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>
                      {row.orderDate ? new Date(row.orderDate).toLocaleDateString() : '—'}
                    </td>

                    {/* Promised Delivery */}
                    <td style={{ padding: '9px 12px' }}>
                      {row.deliveryCommitmentDate ? (
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {new Date(row.deliveryCommitmentDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>

                    {/* Total Payable */}
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#059669' }}>
                      {fmtMoneyFull(row.grandTotal || 0)}
                    </td>

                    {/* Commercial Hold */}
                    <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                      {hasHold ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 10.5,
                          fontWeight: 700,
                          background: 'rgba(244, 63, 94, 0.15)',
                          color: '#dc2626'
                        }}>
                          <ZapOff size={11} /> {row.holdStatus}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                      <StatusBadge value={row.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }} onClick={e => e.stopPropagation()}>
                        {/* Advance status */}
                        {next && !['Completed', 'Cancelled'].includes(row.status) && !hasHold && (
                          <button
                            type="button"
                            title={`Advance to ${next}`}
                            onClick={() => onChangeStatus(row._id, next)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--accent-success)',
                              padding: 3
                            }}
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}

                        {/* Cancel status */}
                        {!['Completed', 'Cancelled'].includes(row.status) && (
                          <button
                            type="button"
                            title="Cancel Order"
                            onClick={() => onChangeStatus(row._id, 'Cancelled')}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--accent-danger)',
                              padding: 3
                            }}
                          >
                            <XCircle size={14} />
                          </button>
                        )}

                        {/* Edit Header */}
                        <button
                          type="button"
                          title="Edit Sales Order"
                          onClick={() => onOpenEditOrderModal(row)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: 3
                          }}
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Inspect Chevron */}
                        <button
                          type="button"
                          title="Inspect Order Details"
                          onClick={() => onSelectOrder(row)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isSelected ? '#059669' : 'var(--text-secondary)',
                            padding: 3
                          }}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderMatrixDeck;
