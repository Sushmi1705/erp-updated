import React from 'react';
import { ShoppingCart, CheckCircle2, Clock, Calendar, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';

export const PurchaseSuggestionsCard = ({
  suggestions = [],
  onConvert,
  busyId,
  loading = false
}) => {
  const isPast = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const getStatusPill = (row) => {
    if (row.status === 'Converted') {
      const docNo = row.referenceOrderId?.poNumber || 'PO Generated';
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: '#16a34a',
          fontSize: '11.5px',
          fontWeight: 700,
          background: 'rgba(22, 163, 74, 0.12)',
          border: '1px solid rgba(22, 163, 74, 0.25)',
          padding: '2px 8px',
          borderRadius: '6px'
        }}>
          <CheckCircle2 size={12} /> {docNo}
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
        color: '#0284c7',
        fontSize: '11px',
        fontWeight: 700,
        background: 'rgba(2, 132, 199, 0.1)',
        padding: '2px 8px',
        borderRadius: '6px'
      }}>
        Pending Release
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
        background: 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%)',
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
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0891b2'
          }}>
            <ShoppingCart size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '14.5px',
                fontWeight: 700,
                color: 'var(--text-primary, #1e293b)'
              }}>
                Purchase Suggestions ({suggestions.length})
              </h3>
              <span style={{
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#0e7490',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '6px'
              }}>
                Raw Material Requisitions
              </span>
            </div>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '11.5px',
              color: 'var(--text-secondary, #64748b)'
            }}>
              Automated supplier purchase orders generated using BOM explosions, stock snapshots, and MasterMaterial MOQs.
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
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Raw Material Item</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Action</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Quantity to Order</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Release By (Start)</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Needed At Dock</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Convert</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--text-secondary, #64748b)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={22} color="#16a34a" />
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>No purchase suggestions pending</span>
                    <span style={{ fontSize: '11.5px' }}>Raw material stocks and scheduled open PO receipts satisfy material demand.</span>
                  </div>
                </td>
              </tr>
            ) : (
              suggestions.map(row => {
                const isConverted = row.status === 'Converted';
                const isPending = row.status === 'Pending';
                const qty = Number(row.suggestedQty) || 0;
                const overdueStart = isPast(row.suggestedReleaseDate);

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
                          {row.itemId?.name || 'Raw Material Item'}
                        </span>
                        {row.itemId?.code && (
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: '#0891b2',
                            fontWeight: 600
                          }}>
                            {row.itemId.code}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '11.5px',
                        color: '#0f172a',
                        background: '#f1f5f9',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1'
                      }}>
                        {row.actionType}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <strong style={{
                        color: '#0284c7',
                        fontFamily: 'monospace',
                        fontSize: '13px'
                      }}>
                        {qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </td>

                    {/* Start By */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color={overdueStart && isPending ? '#dc2626' : '#64748b'} />
                        <span style={{
                          fontSize: '12px',
                          color: overdueStart && isPending ? '#dc2626' : '#334155',
                          fontWeight: overdueStart && isPending ? 700 : 500
                        }}>
                          {row.suggestedReleaseDate ? new Date(row.suggestedReleaseDate).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      {overdueStart && isPending && (
                        <span style={{ fontSize: '10.5px', color: '#dc2626', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                          Immediate PO Needed
                        </span>
                      )}
                    </td>

                    {/* Needed By */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', color: '#475569' }}>
                        {row.suggestedDueDate ? new Date(row.suggestedDueDate).toLocaleDateString() : '—'}
                      </span>
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
                          title="Generate official Purchase Order in ERP"
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
                          {busyId === row._id ? 'Creating PO…' : 'Create PO'}
                        </button>
                      ) : isConverted ? (
                        <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>
                          Order Active
                        </span>
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
