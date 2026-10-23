import React from 'react';
import { Factory, PlusCircle, CheckCircle2, Clock, Calendar } from 'lucide-react';

export const ComponentShortagesCard = ({
  components = [],
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
          <Clock size={12} /> Action Taken
        </span>
      );
    }
    return (
      <span style={{
        color: '#dc2626',
        fontSize: '11.5px',
        fontWeight: 600,
        background: 'rgba(220, 38, 38, 0.08)',
        padding: '2px 8px',
        borderRadius: '6px'
      }}>
        Open Deficit
      </span>
    );
  };

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        background: 'var(--bg-secondary, #f8fafc)',
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
            background: 'rgba(14, 165, 233, 0.12)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7'
          }}>
            <Factory size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text-primary, #1e293b)'
              }}>
                Sub-Assemblies Short ({components.length})
              </h3>
              <span style={{
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#0284c7',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '6px'
              }}>
                Fabricated & Welded Assemblies
              </span>
            </div>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '11.5px',
              color: 'var(--text-secondary, #64748b)'
            }}>
              In-house manufactured sub-assemblies where downstream assembly lines will run out before completion.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Assemblies Table */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%',
          minWidth: '720px',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '12.5px'
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
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Sub-Assembly Item</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Required</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Available</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Deficit (Short)</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Assembly Depletion</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Severity</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Mitigate</th>
            </tr>
          </thead>
          <tbody>
            {components.length === 0 ? (
              <tr>
                <td colSpan={8} style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--text-secondary, #64748b)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={22} color="#16a34a" />
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>Zero sub-assembly deficits</span>
                    <span style={{ fontSize: '11.5px' }}>All in-house fabricated brackets, welded sub-assemblies, and stampings match schedule.</span>
                  </div>
                </td>
              </tr>
            ) : (
              components.map(row => {
                const isResolved = row.status === 'Resolved' || row.status?.includes('Resolved');
                const req = Number(row.requiredQty) || 0;
                const avail = Number(row.availableQty) || 0;
                const short = Number(row.shortageQty) || 0;
                const coverage = req > 0 ? Math.min(100, Math.round((avail / req) * 100)) : 100;
                const daysLeft = getDaysLeft(row.impactDate);

                return (
                  <tr
                    key={row._id}
                    style={{
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      background: isResolved ? 'rgba(240, 253, 244, 0.4)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Item */}
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                          {row.itemId?.name || 'Sub-Assembly Item'}
                        </span>
                        {row.itemId?.code && (
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: '#0284c7',
                            fontWeight: 600
                          }}>
                            {row.itemId.code}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Required */}
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#475569' }}>
                      {req.toLocaleString()}
                    </td>

                    {/* Available */}
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#059669', fontWeight: 600 }}>
                      {avail.toLocaleString()}
                    </td>

                    {/* Deficit / Short By & Coverage Meter */}
                    <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        <strong style={{
                          color: short > 0 ? '#dc2626' : '#16a34a',
                          fontFamily: 'monospace',
                          fontSize: '13px'
                        }}>
                          {short > 0 ? `-${short.toLocaleString()}` : '0.00'}
                        </strong>
                        {/* Mini Coverage Bar */}
                        <div style={{
                          width: '70px',
                          height: '4px',
                          background: '#fee2e2',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${coverage}%`,
                            height: '100%',
                            background: coverage > 60 ? '#10b981' : coverage > 25 ? '#0284c7' : '#ef4444'
                          }} />
                        </div>
                      </div>
                    </td>

                    {/* Runs Out On / Stockout Horizon */}
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="#64748b" />
                        <span style={{ fontSize: '12px', color: '#334155' }}>
                          {row.impactDate ? new Date(row.impactDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                      </div>
                      {daysLeft !== null && (
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: daysLeft <= 5 ? '#dc2626' : daysLeft <= 14 ? '#d97706' : '#64748b',
                          marginTop: '2px',
                          display: 'block'
                        }}>
                          {daysLeft < 0 ? `Exceeded (${Math.abs(daysLeft)}d ago)` : daysLeft === 0 ? 'Depleted Today ⚠️' : `Runs out in ${daysLeft} days`}
                        </span>
                      )}
                    </td>

                    {/* Severity */}
                    <td style={{ padding: '11px 14px' }}>
                      {getSeverityBadge(row.severity)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '11px 14px' }}>
                      {getStatusBadge(row.status)}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                      {isResolved ? (
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                          Resolved
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenResolution(row, 'Delay Work Order')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color, #cbd5e1)',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <PlusCircle size={12} color="#0284c7" /> Action
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
