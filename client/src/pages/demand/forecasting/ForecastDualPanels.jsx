import React from 'react';
import {
  History, Edit2, AlertCircle, Plus, Trash2,
  Calendar, Layers, CheckCircle2, User, FileText
} from 'lucide-react';

export const ForecastDualPanels = ({
  header,
  historyRefs = [],
  adjustments = [],
  selectedLine,
  onOpenAddHistoryModal,
  onDeleteHistory,
  formatDate
}) => {
  const isStatAlgo = ['Moving Average', 'Exponential Smoothing', 'ML-Prophet'].includes(header?.algorithmUsed);
  const historyCount = historyRefs.length;
  const isSufficient = !isStatAlgo || historyCount >= 12;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: '16px'
    }}>
      {/* ── LEFT PANEL: Historical Calibration Tray (12-Period Training Data) ── */}
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
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0891b2'
            }}>
              <History size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>
                Historical Calibration Baseline
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                {historyCount} / 12 training periods fed for statistical accuracy
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAddHistoryModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 12px',
              borderRadius: '6px',
              background: '#0891b2',
              color: '#ffffff',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={13} /> Feed Past Period
          </button>
        </div>

        {/* 12-Slot Training Progress Gauge */}
        <div style={{
          padding: '12px 18px',
          background: 'rgba(15, 23, 42, 0.02)',
          borderBottom: '1px solid var(--border-color, #f1f5f9)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '11px'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
              12-Period Training Rack
            </span>
            <span style={{
              fontWeight: 700,
              color: isSufficient ? '#059669' : '#dc2626'
            }}>
              {historyCount} / 12 Slots {isSufficient ? '✓' : '(Deficient)'}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '4px'
          }}>
            {Array.from({ length: 12 }).map((_, idx) => {
              const isFilled = idx < historyCount;
              return (
                <div
                  key={idx}
                  title={`Period Slot #${idx + 1}: ${isFilled ? 'Trained' : 'Empty'}`}
                  style={{
                    height: '8px',
                    borderRadius: '2px',
                    background: isFilled
                      ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                      : '#e2e8f0',
                    boxShadow: isFilled ? '0 1px 4px rgba(6, 182, 212, 0.4)' : 'none'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Warning if statistical model and < 12 */}
        {isStatAlgo && historyCount < 12 && (
          <div style={{
            margin: '12px 18px 0',
            padding: '10px 12px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={14} color="#d97706" style={{ flexShrink: 0 }} />
            <span>
              <strong>Training data requirement:</strong> Feed at least {12 - historyCount} more past period(s) for {header?.algorithmUsed} before running automated calculations.
            </span>
          </div>
        )}

        {/* History Table */}
        <div style={{ overflowX: 'auto', flex: 1, padding: '12px 0' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                color: 'var(--text-secondary, #64748b)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '8px 18px', textAlign: 'left' }}>Source Module</th>
                <th style={{ padding: '8px 14px', textAlign: 'left' }}>Record #</th>
                <th style={{ padding: '8px 14px', textAlign: 'left' }}>Period Date</th>
                <th style={{ padding: '8px 14px', textAlign: 'right' }}>Quantity Consumed</th>
                <th style={{ padding: '8px 18px', textAlign: 'right', width: '30px' }}></th>
              </tr>
            </thead>
            <tbody>
              {historyRefs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No historical reference periods linked to this forecast.
                  </td>
                </tr>
              ) : (
                historyRefs.map(ref => (
                  <tr
                    key={ref._id}
                    style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}
                  >
                    <td style={{ padding: '8px 18px', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                      {ref.sourceModule}
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: 'monospace', color: '#0891b2' }}>
                      {ref.sourceRecordId}
                    </td>
                    <td style={{ padding: '8px 14px', color: 'var(--text-secondary, #64748b)' }}>
                      {ref.historicalPeriodDate ? new Date(ref.historicalPeriodDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                      {(ref.quantityConsumed || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '8px 18px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => onDeleteHistory(ref._id)}
                        title="Delete reference"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RIGHT PANEL: Changes Made By Hand (Override Audit Ledger) ── */}
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
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed'
            }}>
              <Edit2 size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>
                Manual Override Audit Ledger
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                {selectedLine
                  ? `Audit trail for ${new Date(selectedLine.timeBucketDate).toLocaleDateString()}`
                  : 'Select a monthly bucket above to audit manual changes'}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {!selectedLine ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-secondary, #64748b)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={24} color="#94a3b8" style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)', fontSize: '13px' }}>
              No Monthly Bucket Selected
            </div>
            <div style={{ fontSize: '11px', marginTop: '4px', maxWidth: '280px' }}>
              Click on any row in the Monthly Demand Buckets table above to view all manual adjustments, reason codes, and planner notes.
            </div>
          </div>
        ) : adjustments.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-secondary, #64748b)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={24} color="#10b981" style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)', fontSize: '13px' }}>
              Pure Algorithmic Baseline
            </div>
            <div style={{ fontSize: '11px', marginTop: '4px', maxWidth: '280px' }}>
              No manual overrides have been made to this month. The quantity strictly matches the system calculation.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', flex: 1, padding: '12px 0' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-color, #e2e8f0)',
                  color: 'var(--text-secondary, #64748b)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <th style={{ padding: '8px 18px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '8px 14px', textAlign: 'left' }}>Reason Code</th>
                  <th style={{ padding: '8px 14px', textAlign: 'right' }}>Adjustment Flow</th>
                  <th style={{ padding: '8px 18px', textAlign: 'left' }}>Planner Notes</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map(adj => {
                  const prev = Number(adj.previousQty) || 0;
                  const next = Number(adj.newQty) || 0;
                  const delta = next - prev;

                  return (
                    <tr
                      key={adj._id}
                      style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}
                    >
                      <td style={{ padding: '8px 18px', color: 'var(--text-secondary, #64748b)' }}>
                        {adj.adjustmentDate ? new Date(adj.adjustmentDate).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          fontWeight: 600,
                          fontSize: '11px',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          {adj.reasonCode}
                        </span>
                      </td>
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                        <span style={{ color: '#94a3b8' }}>{prev.toLocaleString()}</span>
                        <span style={{ margin: '0 6px', color: '#6366f1' }}>➔</span>
                        <strong style={{ color: '#0f172a' }}>{next.toLocaleString()}</strong>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: delta > 0 ? '#059669' : '#dc2626'
                        }}>
                          {delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '8px 18px', color: 'var(--text-primary, #1e293b)' }}>
                        {adj.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
