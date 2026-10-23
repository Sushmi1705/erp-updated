import React from 'react';
import { 
  Users, 
  UserPlus, 
  Layers, 
  Sun, 
  Sunset, 
  Moon, 
  AlertTriangle, 
  CheckCircle2, 
  Award, 
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const DepartmentShiftRoster = ({
  periods = [],
  selectedPeriod,
  onSelectPeriod,
  onOpenPlanWorkforce
}) => {
  // Group periods by departmentId
  const deptMap = new Map();

  periods.forEach(p => {
    const dept = p.departmentId;
    if (!dept || !dept._id) return;
    const deptId = dept._id;

    if (!deptMap.has(deptId)) {
      deptMap.set(deptId, {
        department: dept,
        periods: []
      });
    }
    deptMap.get(deptId).periods.push(p);
  });

  const departmentList = Array.from(deptMap.values());

  const getShiftIcon = (shiftName) => {
    if (shiftName === 'Morning') return <Sun size={14} color="#f59e0b" />;
    if (shiftName === 'Evening') return <Sunset size={14} color="#06b6d4" />;
    return <Moon size={14} color="#8b5cf6" />;
  };

  const getStatusBadge = (status) => {
    if (status === 'Understaffed') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          borderRadius: '4px',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          fontSize: '10px',
          fontWeight: 700
        }}>
          Understaffed
        </span>
      );
    }
    if (status === 'Skill Constraint') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          borderRadius: '4px',
          background: 'rgba(168, 85, 247, 0.15)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          fontSize: '10px',
          fontWeight: 700
        }}>
          Skill Constraint
        </span>
      );
    }
    if (status === 'Overstaffed') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          borderRadius: '4px',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          fontSize: '10px',
          fontWeight: 600
        }}>
          Overstaffed
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 6px',
        borderRadius: '4px',
        background: 'rgba(16, 185, 129, 0.15)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        fontSize: '10px',
        fontWeight: 700
      }}>
        Optimal
      </span>
    );
  };

  if (departmentList.length === 0) {
    return (
      <div style={{
        background: 'rgba(10, 25, 30, 0.5)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '10px',
        padding: '36px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        No department workforce rosters found.
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: '16px'
    }}>
      {departmentList.map(({ department, periods: deptPeriods }) => {
        const totalHeadcount = deptPeriods.reduce((sum, p) => sum + (p.headcount || 0), 0);
        const totalAvail = deptPeriods.reduce((sum, p) => sum + (p.availableHrs || 0), 0);
        const totalPlanned = deptPeriods.reduce((sum, p) => sum + (p.plannedHrs || 0), 0);
        const netVar = totalAvail - totalPlanned;

        const hasDeficit = deptPeriods.some(p => p.status === 'Understaffed' || p.status === 'Skill Constraint');

        return (
          <div
            key={department._id}
            style={{
              background: 'linear-gradient(135deg, rgba(6, 44, 43, 0.85) 0%, rgba(10, 25, 30, 0.95) 100%)',
              border: hasDeficit
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative',
              boxShadow: hasDeficit
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
              background: hasDeficit
                ? 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)'
                : 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }} />

            {/* Header: Department & Total Headcount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: hasDeficit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: hasDeficit ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: hasDeficit ? '#f87171' : '#34d399',
                  flexShrink: 0
                }}>
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                      {department.name}
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
                      {department.code || 'DEPT'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Active Rosters: <strong style={{ color: '#cbd5e1' }}>{deptPeriods.length} Shifts</strong> • Total Headcount: <strong style={{ color: '#6ee7b7' }}>{totalHeadcount} Operators</strong>
                  </div>
                </div>
              </div>

              {/* Net Department Balance */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: netVar >= 0 ? '#34d399' : '#ef4444'
                }}>
                  {netVar >= 0 ? `+${netVar.toFixed(1)}h` : `${netVar.toFixed(1)}h`}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                  Net Variance
                </div>
              </div>
            </div>

            {/* Shift Tiles Deck */}
            <div style={{
              background: 'rgba(10, 25, 30, 0.6)',
              borderRadius: '8px',
              padding: '10px',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {deptPeriods.map(p => {
                const isSelected = selectedPeriod && selectedPeriod._id === p._id;
                const isShort = p.varianceHrs < 0 || p.status === 'Understaffed';

                return (
                  <div
                    key={p._id}
                    onClick={() => onSelectPeriod(p)}
                    style={{
                      cursor: 'pointer',
                      padding: '10px',
                      borderRadius: '6px',
                      background: isSelected
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(15, 23, 42, 0.5)',
                      border: isSelected
                        ? '1px solid #10b981'
                        : isShort
                        ? '1px solid rgba(239, 68, 68, 0.35)'
                        : '1px solid transparent',
                      transition: 'all 0.15s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)';
                    }}
                  >
                    {/* Shift & Headcount */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(51, 65, 85, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getShiftIcon(p.shiftName)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                            {p.shiftName} Shift
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            ({p.periodLabel})
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                          <strong style={{ color: '#cbd5e1' }}>{p.headcount}</strong> Operators • {p.standardShiftHours || 8}h Shift
                        </div>
                      </div>
                    </div>

                    {/* Hours Balance & Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#cbd5e1' }}>
                          {p.plannedHrs.toFixed(1)} / <strong>{p.availableHrs.toFixed(1)}h</strong>
                        </div>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: p.varianceHrs < 0 ? '#ef4444' : '#34d399',
                          marginTop: '1px'
                        }}>
                          {p.varianceHrs > 0 ? '+' : ''}{p.varianceHrs.toFixed(1)}h
                        </div>
                      </div>

                      {getStatusBadge(p.status)}

                      {/* Action trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPlanWorkforce(p);
                        }}
                        title="Adjust Headcount and Overtime"
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#6ee7b7',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          display: 'flex'
                        }}
                      >
                        <UserPlus size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DepartmentShiftRoster;
