import React from 'react';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Sun, 
  Sunset, 
  Moon, 
  Award, 
  TrendingUp, 
  Zap,
  ArrowRight,
  UserCheck
} from 'lucide-react';

const LaborShiftDiagnostics = ({
  periods = [],
  onQuickPlan,
  onOpenSkillAudit
}) => {
  // Aggregate numbers
  const totalHeadcount = periods.reduce((sum, p) => sum + (p.headcount || 0), 0);
  const totalAvailable = periods.reduce((sum, p) => sum + (p.availableHrs || 0), 0);
  const totalPlanned = periods.reduce((sum, p) => sum + (p.plannedHrs || 0), 0);
  const netVariance = totalAvailable - totalPlanned;

  // Breakdown by Shift
  const shiftCounts = { Morning: 0, Evening: 0, Night: 0 };
  const shiftHours = { Morning: 0, Evening: 0, Night: 0 };

  periods.forEach(p => {
    const s = p.shiftName;
    if (shiftCounts[s] !== undefined) {
      shiftCounts[s] += (p.headcount || 0);
      shiftHours[s] += (p.availableHrs || 0);
    }
  });

  const morningPct = totalHeadcount > 0 ? (shiftCounts.Morning / totalHeadcount) * 100 : 0;
  const eveningPct = totalHeadcount > 0 ? (shiftCounts.Evening / totalHeadcount) * 100 : 0;
  const nightPct = totalHeadcount > 0 ? (shiftCounts.Night / totalHeadcount) * 100 : 0;

  // Understaffed and Skill Constraints
  const understaffedPeriods = periods.filter(p => p.status === 'Understaffed' || p.varianceHrs < 0);
  const skillConstraintPeriods = periods.filter(p => p.status === 'Skill Constraint');

  const topShortfall = understaffedPeriods.length > 0
    ? understaffedPeriods.reduce((min, p) => p.varianceHrs < min.varianceHrs ? p : min, understaffedPeriods[0])
    : null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '14px'
    }}>
      {/* DIAGNOSTIC 1: Shift Distribution Spectrum */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 44, 43, 0.7) 0%, rgba(10, 25, 30, 0.85) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
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
              Shift Headcount Spectrum
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', fontFamily: 'var(--font-mono, monospace)' }}>
                {totalHeadcount}
              </span>
              <span style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: 600 }}>
                Active Operators On Duty
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
            <Users size={18} />
          </div>
        </div>

        {/* Multi-Shift Proportional Bar */}
        <div style={{ marginTop: '14px' }}>
          <div style={{
            height: '8px',
            background: 'rgba(51, 65, 85, 0.6)',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex'
          }}>
            <div style={{ width: `${morningPct}%`, background: '#f59e0b', title: `Morning: ${shiftCounts.Morning}` }} />
            <div style={{ width: `${eveningPct}%`, background: '#06b6d4', title: `Evening: ${shiftCounts.Evening}` }} />
            <div style={{ width: `${nightPct}%`, background: '#8b5cf6', title: `Night: ${shiftCounts.Night}` }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            fontSize: '11px',
            color: '#cbd5e1'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sun size={12} color="#f59e0b" /> Morning: <strong>{shiftCounts.Morning}</strong> ({morningPct.toFixed(0)}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sunset size={12} color="#06b6d4" /> Evening: <strong>{shiftCounts.Evening}</strong> ({eveningPct.toFixed(0)}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Moon size={12} color="#8b5cf6" /> Night: <strong>{shiftCounts.Night}</strong> ({nightPct.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* DIAGNOSTIC 2: Hours Capacity vs Demand Differential */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 44, 43, 0.7) 0%, rgba(10, 25, 30, 0.85) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
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
          background: netVariance >= 0
            ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
            : 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Workforce Hours Variance
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{
                fontSize: '28px',
                fontWeight: 800,
                color: netVariance >= 0 ? '#34d399' : '#ef4444',
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-mono, monospace)'
              }}>
                {netVariance >= 0 ? `+${netVariance.toFixed(1)}` : netVariance.toFixed(1)}
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                hrs Net Balance
              </span>
            </div>
          </div>

          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: netVariance >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: netVariance >= 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: netVariance >= 0 ? '#34d399' : '#f87171'
          }}>
            <Clock size={18} />
          </div>
        </div>

        {/* Planned vs Available Pill Strip */}
        <div style={{ marginTop: '14px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 10px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '6px',
            fontSize: '11px'
          }}>
            <span style={{ color: '#94a3b8' }}>
              Avail: <strong style={{ color: '#f1f5f9' }}>{totalAvailable.toFixed(1)}h</strong>
            </span>
            <span style={{ color: '#94a3b8' }}>
              Planned: <strong style={{ color: '#38bdf8' }}>{totalPlanned.toFixed(1)}h</strong>
            </span>
            <span style={{ color: understaffedPeriods.length > 0 ? '#f87171' : '#34d399', fontWeight: 700 }}>
              {understaffedPeriods.length} Short Shift{understaffedPeriods.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
            <span>Standard: 8.0h / Shift × 5 Days</span>
            <span>Overtime Injectable</span>
          </div>
        </div>
      </div>

      {/* DIAGNOSTIC 3: Skill Matrix Sentinel & Constraint Radar */}
      <div style={{
        background: skillConstraintPeriods.length > 0 || understaffedPeriods.length > 0
          ? 'linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(10, 25, 30, 0.85) 100%)'
          : 'linear-gradient(135deg, rgba(6, 44, 43, 0.7) 0%, rgba(10, 25, 30, 0.85) 100%)',
        border: skillConstraintPeriods.length > 0
          ? '1px solid rgba(168, 85, 247, 0.4)'
          : '1px solid rgba(16, 185, 129, 0.25)',
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
          background: skillConstraintPeriods.length > 0 ? '#a855f7' : '#10b981'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: skillConstraintPeriods.length > 0 ? '#d8b4fe' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Skill Matrix Sentinel
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{
                fontSize: '28px',
                fontWeight: 800,
                color: skillConstraintPeriods.length > 0 ? '#c084fc' : '#34d399',
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-mono, monospace)'
              }}>
                {skillConstraintPeriods.length}
              </span>
              <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
                {skillConstraintPeriods.length === 1 ? 'Expert Skill Bottleneck' : 'Skill Bottlenecks'}
              </span>
            </div>
          </div>

          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: skillConstraintPeriods.length > 0 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.15)',
            border: skillConstraintPeriods.length > 0 ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: skillConstraintPeriods.length > 0 ? '#c084fc' : '#34d399'
          }}>
            <Award size={18} />
          </div>
        </div>

        {/* Sentinel Action / Shortfall Resolution */}
        <div style={{ marginTop: '14px' }}>
          {topShortfall ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 10px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '6px',
              fontSize: '11px',
              border: '1px solid rgba(239, 68, 68, 0.25)'
            }}>
              <span style={{ color: '#fca5a5', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                {topShortfall.departmentId?.name} ({topShortfall.shiftName}): {topShortfall.varianceHrs.toFixed(1)}h
              </span>
              <button
                onClick={() => onQuickPlan(topShortfall)}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Zap size={10} /> Re-allocate
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 10px',
              background: 'rgba(16, 185, 129, 0.12)',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#34d399'
            }}>
              <span>100% of shifts staffed with qualified skill profiles.</span>
              <button
                onClick={onOpenSkillAudit}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6ee7b7',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '11px'
                }}
              >
                Audit
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
            <span>Skill Levels: Basic / Inter / Expert</span>
            <span>Roster Lock Enforcement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaborShiftDiagnostics;
