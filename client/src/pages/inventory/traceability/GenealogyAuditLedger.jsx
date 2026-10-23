import React, { useState } from 'react';
import { 
  History, 
  GitMerge, 
  ShieldAlert, 
  ArrowRight, 
  Building2, 
  Clock, 
  Tag, 
  CheckCircle2, 
  Filter
} from 'lucide-react';

const ACTION_THEMES = {
  'Creation': { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.3)' },
  'Quality Hold': { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
  'Transfer': { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', border: 'rgba(37, 99, 235, 0.3)' },
  'Consumption': { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)', border: 'rgba(124, 58, 237, 0.3)' },
  'Adjustment': { color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.3)' }
};

const GenealogyAuditLedger = ({
  logs = [],
  loading = false,
  onInspectEntity
}) => {
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'ALL' && log.Action_Type !== filterAction) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header and Filter Bar */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} color="#0891b2" />
            Batch Lifecycle Audit Ledger (Immutable Event Log)
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Traceable event log recording every receipt, movement, quality containment, and consumption action.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter Event:</span>
          {['ALL', 'Creation', 'Quality Hold', 'Transfer', 'Consumption'].map(act => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: filterAction === act ? '1px solid #0891b2' : '1px solid var(--border-color)',
                background: filterAction === act ? 'rgba(8, 145, 178, 0.15)' : 'var(--bg-secondary)',
                color: filterAction === act ? '#0e7490' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
            <thead>
              <tr style={{
                background: 'var(--bg-secondary)',
                borderBottom: '2px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)'
              }}>
                <th style={{ padding: '12px 16px' }}>Event Timestamp</th>
                <th style={{ padding: '12px 14px' }}>Lifecycle Event</th>
                <th style={{ padding: '12px 14px' }}>Batch / Heat Number</th>
                <th style={{ padding: '12px 14px' }}>Material SKU</th>
                <th style={{ padding: '12px 14px' }}>Location / Movement</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Trace Link</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                    Loading lifecycle audit events...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No genealogy events recorded for this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const ent = log.Entity_ID || {};
                  const theme = ACTION_THEMES[log.Action_Type] || ACTION_THEMES['Creation'];
                  const date = new Date(log.Transaction_Date || log.createdAt);

                  return (
                    <tr
                      key={log._id || idx}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Action Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: theme.bg,
                          color: theme.color,
                          border: `1px solid ${theme.border}`
                        }}>
                          {log.Action_Type === 'Quality Hold' && <ShieldAlert size={11} />}
                          {log.Action_Type === 'Creation' && <CheckCircle2 size={11} />}
                          {log.Action_Type}
                        </span>
                      </td>

                      {/* Batch Identifier */}
                      <td style={{ padding: '12px 14px' }}>
                        <strong style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)' }}>
                          {ent.Tracking_Number || 'Unknown Batch'}
                        </strong>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {ent.Tracking_Type || 'Batch'}
                        </div>
                      </td>

                      {/* Material */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {ent.Material_ID?.name || 'Material'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          Grade: {ent.Material_ID?.grade || 'Standard'}
                        </div>
                      </td>

                      {/* Movement */}
                      <td style={{ padding: '12px 14px' }}>
                        {log.Source_WH_ID && log.Dest_WH_ID ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)' }}>
                            <span>{log.Source_WH_ID.name}</span>
                            <ArrowRight size={12} color="#0891b2" />
                            <strong>{log.Dest_WH_ID.name}</strong>
                          </div>
                        ) : log.Dest_WH_ID ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                            Stored in: <strong>{log.Dest_WH_ID.name}</strong>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Central Stores</span>
                        )}
                      </td>

                      {/* Link */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => ent._id && onInspectEntity(ent)}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#0891b2',
                            background: 'transparent',
                            border: '1px solid #0891b2',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          View Batch
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GenealogyAuditLedger;
