import React from 'react';
import { 
  Gauge, 
  Clock, 
  AlertOctagon, 
  Factory, 
  TrendingUp, 
  Zap, 
  ArrowUpRight,
  ShieldAlert,
  Percent
} from 'lucide-react';

const MachineFleetGauges = ({ periods = [], onQuickOvertime }) => {
  // Aggregate numbers
  const totalPeriods = periods.length;
  const totalAvailable = periods.reduce((sum, p) => sum + (p.availableHrs || 0), 0);
  const totalUtilized = periods.reduce((sum, p) => sum + (p.utilizedHrs || 0), 0);
  const netHeadroom = Math.max(0, totalAvailable - totalUtilized);
  const overallLoadPct = totalAvailable > 0 ? (totalUtilized / totalAvailable) * 100 : 0;

  // Work centers count
  const uniqueWorkCenters = new Map();
  periods.forEach(p => {
    if (p.workCenterId && p.workCenterId._id) {
      uniqueWorkCenters.set(p.workCenterId._id, p.workCenterId);
    }
  });
  const workCenterCount = uniqueWorkCenters.size;

  // Bottleneck periods
  const bottleneckPeriods = periods.filter(p => p.status === 'Bottleneck' || p.utilizationPct > 100);
  const topBottleneck = bottleneckPeriods.length > 0
    ? bottleneckPeriods.reduce((max, p) => p.utilizationPct > max.utilizationPct ? p : max, bottleneckPeriods[0])
    : null;

  // Average efficiency
  let avgEfficiency = 100;
  if (uniqueWorkCenters.size > 0) {
    let sumEff = 0;
    uniqueWorkCenters.forEach(wc => {
      sumEff += (wc.efficiencyRate ? wc.efficiencyRate * 100 : 100);
    });
    avgEfficiency = sumEff / uniqueWorkCenters.size;
  }

  // Load color tokens
  const getLoadColor = (pct) => {
    if (pct > 100) return '#ef4444'; // Red Overload
    if (pct >= 85) return '#f59e0b'; // Amber Warning
    if (pct >= 60) return '#10b981'; // Emerald Optimal
    return '#06b6d4'; // Cyan Underutilized
  };

  const loadColor = getLoadColor(overallLoadPct);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '14px'
    }}>
      {/* GAUGE 1: Overall Fleet Machine Load */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '10px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Accent Glow Strip */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${loadColor} 0%, rgba(99, 102, 241, 0.5) 100%)`
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fleet Machine Load
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: loadColor, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono, monospace)' }}>
                {overallLoadPct.toFixed(1)}%
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: overallLoadPct > 100 ? '#f87171' : overallLoadPct > 85 ? '#fbbf24' : '#34d399',
                background: overallLoadPct > 100 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                padding: '1px 6px',
                borderRadius: '6px'
              }}>
                {overallLoadPct > 100 ? 'OVERLOAD' : overallLoadPct > 85 ? 'HIGH LOAD' : 'NOMINAL'}
              </span>
            </div>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8'
          }}>
            <Gauge size={18} />
          </div>
        </div>

        {/* Precision Progress Bar */}
        <div style={{ marginTop: '12px' }}>
          <div style={{
            height: '6px',
            background: 'rgba(51, 65, 85, 0.5)',
            borderRadius: '3px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(overallLoadPct, 100)}%`,
              background: `linear-gradient(90deg, #6366f1 0%, ${loadColor} 100%)`,
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
            <span>Target Band: 65% - 85%</span>
            <span>100% Redline</span>
          </div>
        </div>
      </div>

      {/* GAUGE 2: Machine Hours Balance (Installed vs Booked) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '10px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Machine Hours Balance
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', fontFamily: 'var(--font-mono, monospace)' }}>
                {totalUtilized.toFixed(0)}
              </span>
              <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
                / {totalAvailable.toFixed(0)} hrs
              </span>
            </div>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <Clock size={18} />
          </div>
        </div>

        {/* Headroom summary */}
        <div style={{ marginTop: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 8px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '6px',
            fontSize: '11px'
          }}>
            <span style={{ color: '#94a3b8' }}>Buffer Headroom:</span>
            <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono, monospace)' }}>
              +{netHeadroom.toFixed(1)} hrs available
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
            <span>{totalPeriods} Active Periods</span>
            <span>CRP Net Pool</span>
          </div>
        </div>
      </div>

      {/* GAUGE 3: Critical Bottleneck Radar */}
      <div style={{
        background: bottleneckPeriods.length > 0
          ? 'linear-gradient(135deg, rgba(69, 10, 10, 0.6) 0%, rgba(30, 41, 59, 0.85) 100%)'
          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: bottleneckPeriods.length > 0
          ? '1px solid rgba(239, 68, 68, 0.4)'
          : '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '10px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: bottleneckPeriods.length > 0 ? '#ef4444' : '#10b981'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: bottleneckPeriods.length > 0 ? '#fca5a5' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bottleneck Sentinel
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{
                fontSize: '28px',
                fontWeight: 800,
                color: bottleneckPeriods.length > 0 ? '#ef4444' : '#10b981',
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-mono, monospace)'
              }}>
                {bottleneckPeriods.length}
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                {bottleneckPeriods.length === 1 ? 'Work Center Overloaded' : 'Centers Overloaded'}
              </span>
            </div>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: bottleneckPeriods.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
            border: bottleneckPeriods.length > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: bottleneckPeriods.length > 0 ? '#f87171' : '#34d399'
          }}>
            {bottleneckPeriods.length > 0 ? <AlertOctagon size={18} /> : <ShieldAlert size={18} />}
          </div>
        </div>

        {/* Top Bottleneck with Quick Overtime Action */}
        <div style={{ marginTop: '12px' }}>
          {topBottleneck ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '6px',
              fontSize: '11px',
              border: '1px solid rgba(239, 68, 68, 0.25)'
            }}>
              <span style={{ color: '#fca5a5', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '130px' }}>
                {topBottleneck.workCenterId?.name || 'Bottleneck'} ({topBottleneck.periodLabel})
              </span>
              <button
                onClick={() => onQuickOvertime(topBottleneck)}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Zap size={10} /> Relieve
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 8px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#34d399'
            }}>
              <span>All work centers running within capacity.</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
            <span>Auto-Bottleneck Lock</span>
            <span>Threshold: &gt;100%</span>
          </div>
        </div>
      </div>

      {/* GAUGE 4: Work Centers & Plant Fleet OEE */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '10px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Work Centers & Efficiency
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', fontFamily: 'var(--font-mono, monospace)' }}>
                {workCenterCount}
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                Machinery Centers
              </span>
            </div>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa'
          }}>
            <Factory size={18} />
          </div>
        </div>

        {/* Efficiency and Uptime info */}
        <div style={{ marginTop: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 8px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '6px',
            fontSize: '11px'
          }}>
            <span style={{ color: '#94a3b8' }}>Plant OEE Benchmark:</span>
            <strong style={{ color: '#a78bfa', fontFamily: 'var(--font-mono, monospace)' }}>
              {avgEfficiency.toFixed(1)}% Rating
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
            <span>Shift Planning: 24/7 Enabled</span>
            <span>Finite Scheduling</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineFleetGauges;
