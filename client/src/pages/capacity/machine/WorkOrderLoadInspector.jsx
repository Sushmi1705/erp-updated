import React, { useState } from 'react';
import { 
  Clock, 
  ArrowRightLeft, 
  Layers, 
  Copy, 
  Check, 
  X, 
  Factory, 
  Calendar, 
  Sparkles, 
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  Sliders
} from 'lucide-react';

const WorkOrderLoadInspector = ({
  selectedPeriod,
  loadDetails = [],
  loading = false,
  onClose,
  onOpenReschedule,
  onOpenOvertime
}) => {
  const [copiedId, setCopiedId] = useState(null);

  if (!selectedPeriod) return null;

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const workCenter = selectedPeriod.workCenterId;
  const isBottleneck = selectedPeriod.status === 'Bottleneck' || selectedPeriod.utilizationPct > 100;

  // Compute load breakdowns
  const totalLoads = loadDetails.length;
  const sumSetup = loadDetails.reduce((sum, l) => sum + (l.setupHours || 0), 0);
  const sumRun = loadDetails.reduce((sum, l) => sum + (l.runHours || 0), 0);
  const sumTotal = loadDetails.reduce((sum, l) => sum + (l.totalRequiredHours || 0), 0);
  const headroom = selectedPeriod.availableHrs - sumTotal;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
      border: isBottleneck ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(99, 102, 241, 0.35)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.35)',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      {/* Top Banner: Work Center, Period, Close */}
      <div style={{
        padding: '14px 20px',
        background: 'rgba(15, 23, 42, 0.85)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: isBottleneck ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isBottleneck ? '#f87171' : '#818cf8',
            border: isBottleneck ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)'
          }}>
            <Clock size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                Load Details & Dispatch Schedule
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#4f46e5',
                color: '#ffffff'
              }}>
                {selectedPeriod.periodLabel}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
              Machine Bay: <strong style={{ color: '#cbd5e1' }}>{workCenter?.name}</strong> ({workCenter?.code || 'WC'}) • Individual work order hours utilizing this machine.
            </p>
          </div>
        </div>

        {/* Action Pills and Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isBottleneck && (
            <button
              onClick={() => onOpenOvertime(selectedPeriod)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + Relieve with Overtime
            </button>
          )}

          <button
            onClick={onClose}
            title="Close load details view"
            style={{
              background: 'rgba(51, 65, 85, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Mini Diagnostic Strip for this Period */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        padding: '14px 20px',
        background: 'rgba(15, 23, 42, 0.5)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)'
      }}>
        <div style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Scheduled Work Orders</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {totalLoads} Orders
          </div>
        </div>

        <div style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Setup vs Run Time</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#cbd5e1', fontFamily: 'var(--font-mono, monospace)', marginTop: '4px' }}>
            <span style={{ color: '#a5b4fc' }}>{sumSetup.toFixed(1)}h</span> setup / <span style={{ color: '#38bdf8' }}>{sumRun.toFixed(1)}h</span> run
          </div>
        </div>

        <div style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Committed vs Installed</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: isBottleneck ? '#ef4444' : '#34d399', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {sumTotal.toFixed(1)} / {selectedPeriod.availableHrs.toFixed(1)} hrs
          </div>
        </div>

        <div style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Net Headroom Buffer</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 800,
            color: headroom < 0 ? '#ef4444' : '#38bdf8',
            fontFamily: 'var(--font-mono, monospace)',
            marginTop: '2px'
          }}>
            {headroom >= 0 ? `+${headroom.toFixed(1)} hrs` : `${headroom.toFixed(1)} hrs (Deficit)`}
          </div>
        </div>
      </div>

      {/* Work Orders Table */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
            Loading work order loads for {selectedPeriod.periodLabel}...
          </div>
        ) : loadDetails.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
              No Work Orders Loaded in {selectedPeriod.periodLabel}
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', maxWidth: '420px', marginInline: 'auto' }}>
              This work center has {selectedPeriod.availableHrs.toFixed(1)} machine hours 100% available for production scheduling.
            </p>
          </div>
        ) : (
          <table style={{
            width: '100%',
            minWidth: '780px',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                color: '#94a3b8',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '10px 16px', width: '25%' }}>Work Order ID</th>
                <th style={{ padding: '10px 14px', width: '20%' }}>Routing Operation</th>
                <th style={{ padding: '10px 14px', width: '12%', textAlign: 'right' }}>Setup (hrs)</th>
                <th style={{ padding: '10px 14px', width: '12%', textAlign: 'right' }}>Run (hrs)</th>
                <th style={{ padding: '10px 16px', width: '15%', textAlign: 'right' }}>Total Hours</th>
                <th style={{ padding: '10px 16px', width: '16%', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadDetails.map(load => {
                const woIdStr = String(load.workOrderId || '');
                const displayId = woIdStr.length > 8 ? `WO-${woIdStr.slice(-8).toUpperCase()}` : woIdStr;
                const sharePct = selectedPeriod.availableHrs > 0
                  ? ((load.totalRequiredHours || 0) / selectedPeriod.availableHrs) * 100
                  : 0;

                return (
                  <tr
                    key={load._id}
                    style={{
                      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Work Order ID */}
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#a5b4fc',
                          background: 'rgba(99, 102, 241, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}>
                          {displayId}
                        </span>
                        <button
                          onClick={() => handleCopy(woIdStr)}
                          title="Copy Full Work Order ID"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: copiedId === woIdStr ? '#34d399' : '#64748b',
                            padding: '2px',
                            display: 'flex'
                          }}
                        >
                          {copiedId === woIdStr ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Routing Operation */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(51, 65, 85, 0.6)',
                          color: '#cbd5e1'
                        }}>
                          Step {load.routingStepNo}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Primary Machine Cycle
                        </span>
                      </div>
                    </td>

                    {/* Setup Hours */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: '#cbd5e1' }}>
                        {(load.setupHours || 0).toFixed(1)}h
                      </span>
                    </td>

                    {/* Run Hours */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: '#cbd5e1' }}>
                        {(load.runHours || 0).toFixed(1)}h
                      </span>
                    </td>

                    {/* Total Hours & Share */}
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div>
                        <span style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#f1f5f9'
                        }}>
                          {(load.totalRequiredHours || 0).toFixed(1)} hrs
                        </span>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                          {sharePct.toFixed(1)}% of period
                        </div>
                      </div>
                    </td>

                    {/* Action: Move Period / Reschedule */}
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => onOpenReschedule(load)}
                        title="Simulate moving this job to another period"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          borderRadius: '6px',
                          padding: '4px 9px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'}
                      >
                        <ArrowRightLeft size={12} />
                        Move Period
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WorkOrderLoadInspector;
