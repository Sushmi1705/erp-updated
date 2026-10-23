import React from 'react';
import { CalendarClock, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';

export const ReschedulingSuggestionsCard = ({
  suggestions = [],
  onConvert,
  busyId,
  loading = false
}) => {
  const getActionBadge = (actionType) => {
    if (actionType === 'Cancel') {
      return (
        <span style={{
          color: '#dc2626',
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.25)',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 700
        }}>
          Cancel Order
        </span>
      );
    }
    if (actionType === 'Reschedule In') {
      return (
        <span style={{
          color: '#0284c7',
          background: 'rgba(2, 132, 199, 0.1)',
          border: '1px solid rgba(2, 132, 199, 0.25)',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 700
        }}>
          Reschedule In (Expedite)
        </span>
      );
    }
    return (
      <span style={{
        color: '#d97706',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700
      }}>
        {actionType || 'Reschedule Out'}
      </span>
    );
  };

  const getStatusPill = (row) => {
    if (row.status === 'Converted') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: '#16a34a',
          fontSize: '11.5px',
          fontWeight: 700,
          background: 'rgba(22, 163, 74, 0.12)',
          padding: '2px 8px',
          borderRadius: '6px'
        }}>
          <CheckCircle2 size={12} /> Converted
        </span>
      );
    }
    if (row.status === 'Dismissed') {
      return (
        <span style={{
          color: '#dc2626',
          fontSize: '11px',
          fontWeight: 600,
          background: 'rgba(220, 38, 38, 0.08)',
          padding: '2px 8px',
          borderRadius: '6px'
        }}>
          Dismissed (Invalidated)
        </span>
      );
    }
    return (
      <span style={{
        color: '#d97706',
        fontSize: '11px',
        fontWeight: 700,
        background: 'rgba(245, 158, 11, 0.1)',
        padding: '2px 8px',
        borderRadius: '6px'
      }}>
        Pending Action
      </span>
    );
  };

  return (
    <div style={{
      background: 'var(--bg-primary, #ffffff)',
      borderRadius: '12px',
      border: '1px solid var(--border-color, #e2e8f0)',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #fffbeb 0%, #f8fafc 100%)',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706'
          }}>
            <CalendarClock size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '14.5px',
                fontWeight: 700,
                color: 'var(--text-primary, #1e293b)'
              }}>
                Rescheduling & Adjustment Suggestions ({suggestions.length})
              </h3>
              <span style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#b45309',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '6px'
              }}>
                Open Order Date Shifts
              </span>
            </div>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '11.5px',
              color: 'var(--text-secondary, #64748b)'
            }}>
              Modifications recommended for already released POs and Work Orders to align with new BOM explosion dates.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%',
          minWidth: '780px',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '12.5px',
          tableLayout: 'auto'
        }}>
          <thead>
            <tr style={{
              background: '#f8fafc',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              color: 'var(--text-secondary, #64748b)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Item</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Linked Active Order</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Recommended Adjustment</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Adjusted Target Date</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--text-secondary, #64748b)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={22} color="#16a34a" />
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>All open orders aligned with schedule</span>
                    <span style={{ fontSize: '11.5px' }}>No order dates require expediting, postponing, or cancellation.</span>
                  </div>
                </td>
              </tr>
            ) : (
              suggestions.map(row => {
                const isConverted = row.status === 'Converted';
                const isPending = row.status === 'Pending';
                const linkedOrderNo = row.referenceOrderId?.poNumber || row.referenceOrderId?.workOrderNumber || 'ORDER-XX';

                return (
                  <tr
                    key={row._id}
                    style={{
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      background: isConverted ? 'rgba(240, 253, 244, 0.45)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Item */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                          {row.itemId?.name || 'Item'}
                        </span>
                        {row.itemId?.code && (
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: 'var(--text-secondary, #64748b)'
                          }}>
                            {row.itemId.code}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Linked Order */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontWeight: 600
                      }}>
                        {linkedOrderNo}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 16px' }}>
                      {getActionBadge(row.actionType)}
                    </td>

                    {/* New Date */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="#64748b" />
                        <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: 600 }}>
                          {row.suggestedReleaseDate ? new Date(row.suggestedReleaseDate).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 14px' }}>
                      {getStatusPill(row)}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => onConvert(row._id)}
                          disabled={busyId === row._id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: busyId === row._id ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <CheckCircle2 size={13} />
                          {busyId === row._id ? 'Updating…' : 'Apply Shift'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
