import React from 'react';
import { 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  ShieldCheck, 
  Calendar,
  FileCheck
} from 'lucide-react';

const ValuationRunHistoryDeck = ({ runs = [], onTriggerRun, calculating = false }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Audit Compliance Header Banner */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={18} color="#059669" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Statutory Valuation Audit Trail & Run History
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '720px' }}>
            Complies with Ind AS 2 & IATF 16949 requirements for inventory accounting control, period-end ledger reconciliation, and traceable cost layer recomputations.
          </p>
        </div>

        <button
          onClick={onTriggerRun}
          disabled={calculating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#059669',
            border: 'none',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: calculating ? 'not-allowed' : 'pointer',
            opacity: calculating ? 0.7 : 1
          }}
        >
          <History size={14} />
          {calculating ? 'Executing Run...' : 'Execute New Statutory Run'}
        </button>
      </div>

      {/* History Table */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
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
                <th style={{ padding: '12px 16px' }}>Run Reference</th>
                <th style={{ padding: '12px 14px' }}>Scope / Run Type</th>
                <th style={{ padding: '12px 14px' }}>Triggered By</th>
                <th style={{ padding: '12px 14px' }}>Execution Timestamp</th>
                <th style={{ padding: '12px 14px' }}>Duration</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                    <FileCheck size={32} color="var(--text-secondary)" style={{ marginBottom: '8px', opacity: 0.6 }} />
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>No Historic Statutory Valuation Runs Recorded</div>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>
                      Execute your first month-end valuation run using the button above.
                    </div>
                  </td>
                </tr>
              ) : (
                runs.map((run, idx) => {
                  const startTime = new Date(run.Run_Start_Time || run.createdAt);
                  const endTime = run.Run_End_Time ? new Date(run.Run_End_Time) : null;
                  const durationSec = endTime ? Math.max(1, Math.round((endTime - startTime) / 1000)) : null;

                  return (
                    <tr
                      key={run._id || idx}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      {/* Run ID */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#065f46',
                          background: 'rgba(5, 150, 105, 0.1)',
                          padding: '3px 7px',
                          borderRadius: '4px'
                        }}>
                          RUN-VAL-{String(run._id || idx).slice(-6).toUpperCase()}
                        </span>
                      </td>

                      {/* Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {run.Run_Type || 'System-Wide'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          All Active Materials
                        </div>
                      </td>

                      {/* Triggered By */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <User size={13} color="var(--text-secondary)" />
                          {run.Triggered_By?.name || 'System Admin'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '19px' }}>
                          {run.Triggered_By?.role || 'Administrator'}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {startTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {durationSec ? `${durationSec}s` : 'Active'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {run.Status === 'Success' ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#065f46',
                            background: 'rgba(5, 150, 105, 0.15)',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            <CheckCircle2 size={12} color="#059669" />
                            Audited & Saved
                          </span>
                        ) : run.Status === 'In Progress' ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#2563eb',
                            background: 'rgba(37, 99, 235, 0.15)',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            <Clock size={12} />
                            In Progress
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#b91c1c',
                            background: 'rgba(239, 68, 68, 0.15)',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            <AlertCircle size={12} />
                            Failed
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
    </div>
  );
};

export default ValuationRunHistoryDeck;
