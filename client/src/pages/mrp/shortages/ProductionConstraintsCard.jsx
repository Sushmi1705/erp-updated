import React from 'react';
import { AlertTriangle, PlusCircle, CheckCircle2, Clock, Wrench } from 'lucide-react';

export const ProductionConstraintsCard = ({
  constraints = [],
  onOpenResolution,
  loading = false
}) => {
  const getSeverityBadge = (severity) => {
    const config = {
      Critical: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
      High: { bg: '#fffbeb', border: '#fcd34d', text: '#d97706' },
      Medium: { bg: '#fefce8', border: '#fef08a', text: '#ca8a04' },
      Low: { bg: '#f8fafc', border: '#cbd5e1', text: '#64748b' }
    };
    const c = config[severity] || config.Low;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text
      }}>
        {severity}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'Resolved' || status?.includes('Resolved')) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: '#16a34a',
          fontSize: '11.5px',
          fontWeight: 700,
          background: 'rgba(22, 163, 74, 0.1)',
          padding: '2px 8px',
          borderRadius: '6px'
        }}>
          <CheckCircle2 size={12} /> {status}
        </span>
      );
    }
    if (status === 'Action Taken') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: '#2563eb',
          fontSize: '11.5px',
          fontWeight: 700,
          background: 'rgba(37, 99, 235, 0.1)',
          padding: '2px 8px',
          borderRadius: '6px'
        }}>
          <Clock size={12} /> Action In Progress
        </span>
      );
    }
    return (
      <span style={{
        color: '#dc2626',
        fontSize: '11.5px',
        fontWeight: 700,
        background: 'rgba(220, 38, 38, 0.08)',
        padding: '2px 8px',
        borderRadius: '6px',
        border: '1px solid rgba(220, 38, 38, 0.2)'
      }}>
        ● Unresolved Open
      </span>
    );
  };

  const getConstraintTypePill = (type) => {
    return (
      <span style={{
        fontSize: '11px',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: '6px',
        background: '#f1f5f9',
        border: '1px solid #cbd5e1',
        color: '#334155'
      }}>
        {type || 'Shop Floor Bottleneck'}
      </span>
    );
  };

  return (
    <div style={{
      background: 'var(--bg-primary, #ffffff)',
      borderRadius: '12px',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      overflow: 'hidden',
      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.06)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Card Header */}
      <div style={{
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)',
        borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
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
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626'
          }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '14.5px',
                fontWeight: 700,
                color: '#991b1b'
              }}>
                Production Bottlenecks & Hard Constraints ({constraints.length})
              </h3>
              {constraints.length > 0 && (
                <span style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  CRITICAL
                </span>
              )}
            </div>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '11.5px',
              color: '#b45309'
            }}>
              Direct capacity limits, unreleased engineering routings, and unapproved BOM revisions blocking work orders.
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '11.5px',
          color: '#78716c',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid #fed7aa'
        }}>
          MRP Halts Until Cleared
        </span>
      </div>

      {/* Constraints Table */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%',
          minWidth: '920px',
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
              <th style={{ padding: '10px 16px', fontWeight: 600, width: '190px' }}>Impacted Assembly</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, width: '150px' }}>Constraint Type</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, minWidth: '320px' }}>Engineering Description & Shift Bottleneck</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, width: '90px' }}>Severity</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, width: '140px' }}>Status</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, width: '130px', textAlign: 'right' }}>Mitigation</th>
            </tr>
          </thead>
          <tbody>
            {constraints.length === 0 ? (
              <tr>
                <td colSpan={6} style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--text-secondary, #64748b)',
                  background: '#fafafa'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={24} color="#16a34a" />
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>No active production bottlenecks</span>
                    <span style={{ fontSize: '11.5px' }}>All machine capacities, engineering BOMs, and work center routings are operational.</span>
                  </div>
                </td>
              </tr>
            ) : (
              constraints.map(row => {
                const isResolved = row.status === 'Resolved' || row.status?.includes('Resolved');
                return (
                  <tr
                    key={row._id}
                    style={{
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      transition: 'background 0.15s ease',
                      background: isResolved ? 'rgba(240, 253, 244, 0.4)' : 'transparent'
                    }}
                  >
                    {/* Item */}
                    <td style={{ padding: '12px 16px', width: '190px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                          {row.itemId?.name || 'Unspecified Assembly'}
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

                    {/* Constraint Type */}
                    <td style={{ padding: '12px 16px', width: '150px' }}>
                      {getConstraintTypePill(row.constraintDetails?.constraintType)}
                    </td>

                    {/* Description */}
                    <td style={{
                      padding: '12px 16px',
                      minWidth: '320px',
                      maxWidth: '460px',
                      whiteSpace: 'normal'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#334155',
                        lineHeight: '1.45',
                        display: 'block',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word'
                      }}>
                        {row.constraintDetails?.description || 'Press capacity deficit or engineering constraint'}
                      </span>
                    </td>

                    {/* Severity */}
                    <td style={{ padding: '12px 16px', width: '90px' }}>
                      {getSeverityBadge(row.severity)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px', width: '140px' }}>
                      {getStatusBadge(row.status)}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 16px', width: '130px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isResolved ? (
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                          Resolved
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenResolution(row)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(220, 38, 38, 0.4)',
                            background: 'rgba(220, 38, 38, 0.08)',
                            color: '#b91c1c',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <PlusCircle size={13} /> Record Action
                        </button>
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
