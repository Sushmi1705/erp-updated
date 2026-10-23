import React from 'react';
import { 
  Factory, 
  PlusCircle, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge
} from 'lucide-react';

const WorkCenterFleetMatrix = ({
  periods = [],
  selectedPeriod,
  onSelectPeriod,
  onOpenOvertime
}) => {
  // Group periods by workCenterId
  const workCenterMap = new Map();

  periods.forEach(period => {
    const wc = period.workCenterId;
    if (!wc || !wc._id) return;
    const wcId = wc._id;

    if (!workCenterMap.has(wcId)) {
      workCenterMap.set(wcId, {
        workCenter: wc,
        periods: []
      });
    }
    workCenterMap.get(wcId).periods.push(period);
  });

  const workCentersList = Array.from(workCenterMap.values());

  const getLoadBadgeColor = (pct) => {
    if (pct > 100) return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.35)' };
    if (pct >= 85) return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' };
    if (pct >= 60) return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.35)' };
    return { bg: 'rgba(6, 182, 212, 0.15)', text: '#38bdf8', border: 'rgba(6, 182, 212, 0.35)' };
  };

  const getBarGradient = (pct) => {
    if (pct > 100) return 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)';
    if (pct >= 85) return 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)';
    if (pct >= 60) return 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)';
    return 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)';
  };

  if (workCentersList.length === 0) {
    return (
      <div style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '10px',
        padding: '36px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        No Work Center machine telemetry available.
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: '16px'
    }}>
      {workCentersList.map(({ workCenter, periods: wcPeriods }) => {
        // Calculate totals for this work center
        const totalAvail = wcPeriods.reduce((sum, p) => sum + (p.availableHrs || 0), 0);
        const totalUsed = wcPeriods.reduce((sum, p) => sum + (p.utilizedHrs || 0), 0);
        const avgLoad = totalAvail > 0 ? (totalUsed / totalAvail) * 100 : 0;
        const hasBottleneck = wcPeriods.some(p => p.status === 'Bottleneck' || p.utilizationPct > 100);

        // Sort periods chronologically
        const sortedPeriods = [...wcPeriods].sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));

        return (
          <div
            key={workCenter._id}
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: hasBottleneck
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative',
              boxShadow: hasBottleneck
                ? '0 6px 20px -2px rgba(239, 68, 68, 0.15)'
                : '0 6px 20px -2px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Top Indicator Strip */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: hasBottleneck
                ? 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)'
                : 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }} />

            {/* Header: Work Center Info & Master Load */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: hasBottleneck ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  border: hasBottleneck ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: hasBottleneck ? '#f87171' : '#818cf8',
                  flexShrink: 0
                }}>
                  <Factory size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                      {workCenter.name}
                    </h3>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(51, 65, 85, 0.7)',
                      color: '#94a3b8',
                      fontFamily: 'var(--font-mono, monospace)',
                      border: '1px solid rgba(148, 163, 184, 0.2)'
                    }}>
                      {workCenter.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '10px' }}>
                    <span>Base: {workCenter.baseDailyHours || 8} hrs/day</span>
                    <span>•</span>
                    <span>Efficiency: {((workCenter.efficiencyRate || 1.0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Average Load Dial Pill */}
              <div style={{
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end'
              }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: avgLoad > 100 ? '#ef4444' : avgLoad > 85 ? '#f59e0b' : '#10b981'
                }}>
                  {avgLoad.toFixed(1)}%
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                  Aggregated Load
                </span>
              </div>
            </div>

            {/* Multi-Period Timeline Miniature Bars */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                paddingBottom: '6px'
              }}>
                <span>Period Schedule ({sortedPeriods.length} Weeks)</span>
                <span>Used / Avail Hrs</span>
              </div>

              {sortedPeriods.map(p => {
                const isSelected = selectedPeriod && selectedPeriod._id === p._id;
                const pColor = getLoadBadgeColor(p.utilizationPct);
                const isBottleneck = p.status === 'Bottleneck' || p.utilizationPct > 100;

                return (
                  <div
                    key={p._id}
                    onClick={() => onSelectPeriod(p)}
                    style={{
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '6px',
                      background: isSelected
                        ? 'rgba(99, 102, 241, 0.2)'
                        : 'rgba(30, 41, 59, 0.4)',
                      border: isSelected
                        ? '1px solid #6366f1'
                        : isBottleneck
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid transparent',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(51, 65, 85, 0.4)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>
                          {p.periodLabel}
                        </span>
                        {isBottleneck && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: '#ef4444',
                            color: '#ffffff'
                          }}>
                            OVERLOAD
                          </span>
                        )}
                        {isSelected && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: '#4f46e5',
                            color: '#ffffff'
                          }}>
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#cbd5e1' }}>
                          <strong style={{ color: isBottleneck ? '#f87171' : '#f1f5f9' }}>{p.utilizedHrs.toFixed(1)}</strong> / {p.availableHrs.toFixed(1)}h
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono, monospace)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: pColor.bg,
                          color: pColor.text,
                          border: `1px solid ${pColor.border}`
                        }}>
                          {p.utilizationPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Mini Load Progress Bar */}
                    <div style={{
                      height: '5px',
                      background: 'rgba(51, 65, 85, 0.6)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(p.utilizationPct, 100)}%`,
                        background: getBarGradient(p.utilizationPct),
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Bay Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '6px'
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Total: <strong style={{ color: '#f1f5f9' }}>{totalUsed.toFixed(1)}h</strong> / {totalAvail.toFixed(1)}h
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Add Overtime Button */}
                <button
                  onClick={() => onOpenOvertime(sortedPeriods[0])}
                  title={`Inject Overtime for ${workCenter.name}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                >
                  <PlusCircle size={12} />
                  + Overtime
                </button>

                {/* Inspect Details Button */}
                <button
                  onClick={() => onSelectPeriod(sortedPeriods[0])}
                  title="Inspect Work Order Loads"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(51, 65, 85, 0.6)',
                    color: '#f1f5f9',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                >
                  <Layers size={12} />
                  Inspect Jobs
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WorkCenterFleetMatrix;
