import React from 'react';
import {
  Clock, GitBranch, CheckCircle2, ShoppingBag, TrendingUp,
  ShieldCheck, FileText, ArrowRight, Layers
} from 'lucide-react';

export const TraceabilityLedger = ({
  traceLinks = [],
  selectedLine,
  loading = false
}) => {
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
            background: 'rgba(56, 189, 248, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7'
          }}>
            <GitBranch size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>
              Source Traceability & Consumption Ledger
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
              {selectedLine
                ? `Originating customer orders and forecasts for: ${selectedLine.productId?.name || 'Selected Part'}`
                : 'Select a demand line above to audit its originating sources and consumption.'}
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FileText size={28} color="#94a3b8" style={{ marginBottom: '8px' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)', fontSize: '13px' }}>
            No Demand Component Selected
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px', maxWidth: '320px' }}>
            Click on any finished component row in the Consolidated Demand Lines table above to trace every contributing sales order and forecast document.
          </div>
        </div>
      ) : loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          Auditing source traceability links...
        </div>
      ) : traceLinks.length === 0 ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--text-secondary, #64748b)'
        }}>
          <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 8px', display: 'block' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)', fontSize: '13px' }}>
            Direct Production Schedule
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px' }}>
            This demand line was added via manual planner entry or initial base policy.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{
                background: 'var(--bg-secondary, #f8fafc)',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                color: 'var(--text-secondary, #64748b)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '12px 20px' }}>Source Channel</th>
                <th style={{ padding: '12px 16px' }}>Originating Record #</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Contributed Volume</th>
                <th style={{ padding: '12px 20px', textAlign: 'center' }}>Forecast Consumption Status</th>
              </tr>
            </thead>
            <tbody>
              {traceLinks.map((t, idx) => {
                const isSO = t.sourceType === 'Sales_Order';
                const isFC = t.sourceType === 'Forecast';

                return (
                  <tr
                    key={t._id || idx}
                    style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}
                  >
                    {/* Source Type */}
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: isSO ? 'rgba(56, 189, 248, 0.12)' : isFC ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: isSO ? '#0284c7' : isFC ? '#b45309' : '#059669',
                        fontWeight: 600,
                        fontSize: '12px'
                      }}>
                        {isSO ? <ShoppingBag size={13} /> : isFC ? <TrendingUp size={13} /> : <ShieldCheck size={13} />}
                        {isSO ? 'Firm Sales Order' : isFC ? 'Customer Forecast' : 'Safety Buffer'}
                      </span>
                    </td>

                    {/* Source Record */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '12px',
                        color: 'var(--text-primary, #0f172a)'
                      }}>
                        {t.sourceRecordId || '—'}
                      </span>
                    </td>

                    {/* Contributed Qty */}
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                      {(t.contributedQty || 0).toLocaleString()} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>units</span>
                    </td>

                    {/* Consumption Status */}
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      {t.isConsumed ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          <CheckCircle2 size={13} /> Consumed by Customer SO
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: '#0284c7',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          Unconsumed Active Demand
                        </span>
                      )}
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
