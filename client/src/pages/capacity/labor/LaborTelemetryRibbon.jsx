import React from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  UserPlus, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  SlidersHorizontal,
  Award,
  Layers,
  Sun,
  Sunset,
  Moon,
  Sparkles
} from 'lucide-react';

const LaborTelemetryRibbon = ({
  viewMode,
  setViewMode,
  periods = [],
  onOpenPlanWorkforce,
  onOpenNewPeriod,
  onOpenSkillAudit,
  onRefresh,
  loading = false,
  statusFilter,
  setStatusFilter
}) => {
  // Aggregate numbers
  const totalPeriods = periods.length;
  const understaffedCount = periods.filter(p => p.status === 'Understaffed' || p.varianceHrs < 0).length;
  const skillConstraintCount = periods.filter(p => p.status === 'Skill Constraint').length;
  const optimalCount = periods.filter(p => p.status === 'Optimal').length;
  const overstaffedCount = periods.filter(p => p.status === 'Overstaffed').length;

  const totalHeadcount = periods.reduce((sum, p) => sum + (p.headcount || 0), 0);
  const totalAvailable = periods.reduce((sum, p) => sum + (p.availableHrs || 0), 0);
  const totalPlanned = periods.reduce((sum, p) => sum + (p.plannedHrs || 0), 0);
  const netVariance = totalAvailable - totalPlanned;

  // Export CSV Manifest
  const handleExportCSV = () => {
    if (!periods.length) return;
    const headers = ['Department', 'Code', 'Shift', 'Period', 'Operators (Headcount)', 'Hours Available', 'Hours Planned', 'Spare/Short (Variance)', 'Status'];
    const rows = periods.map(p => [
      `"${p.departmentId?.name || ''}"`,
      `"${p.departmentId?.code || ''}"`,
      `"${p.shiftName || ''}"`,
      `"${p.periodLabel || ''}"`,
      p.headcount || 0,
      (p.availableHrs || 0).toFixed(1),
      (p.plannedHrs || 0).toFixed(1),
      (p.varianceHrs || 0).toFixed(1),
      `"${p.status || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Manpower_Capacity_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6, 44, 43, 0.95) 0%, rgba(10, 25, 30, 0.98) 100%)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '12px',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.3), 0 2px 6px -1px rgba(16, 185, 129, 0.15)'
    }}>
      {/* Top Bar: Title, Engine Capsule, Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Title and Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            flexShrink: 0
          }}>
            <Users size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#ffffff'
              }}>
                Manpower Capacity & Shift Rostering
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#6ee7b7',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981'
                }} />
                Workforce Dynamic Engine
              </span>
            </div>
            <p style={{
              margin: '3px 0 0 0',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              Operator hours available against planned work order demand. Identifies short shifts, skill deficits, and overtime requirements.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Skill Matrix Audit */}
          <button
            onClick={onOpenSkillAudit}
            title="Audit Skill Level Coverage across Operations"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#cbd5e1',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)'}
          >
            <Award size={14} color="#a78bfa" />
            Skill Matrix Audit
          </button>

          {/* New Roster Period Button */}
          <button
            onClick={onOpenNewPeriod}
            title="Configure new department shift period"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#cbd5e1',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)'}
          >
            <Calendar size={14} color="#6ee7b7" />
            + Roster Shift Period
          </button>

          {/* Quick Workforce Planning */}
          <button
            onClick={() => onOpenPlanWorkforce(null)}
            title="Adjust Headcount and Overtime"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.4)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            <UserPlus size={14} />
            + Plan Manpower & Overtime
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title="Export Roster Manifest as CSV"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '7px 10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
          >
            <Download size={14} />
            Export
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh manpower periods ledger"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Bottom Sub-Ribbon: View Switcher Tabs & Quick Alerts */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(16, 185, 129, 0.15)'
      }}>
        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(10, 25, 30, 0.7)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <button
            onClick={() => setViewMode('ledger')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'ledger' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent',
              color: viewMode === 'ledger' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={13} />
            Master Manpower Ledger
          </button>

          <button
            onClick={() => setViewMode('roster')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'roster' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent',
              color: viewMode === 'roster' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <Users size={13} />
            Department Shift Bays
          </button>

          <button
            onClick={() => setViewMode('split')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'split' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent',
              color: viewMode === 'split' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <SlidersHorizontal size={13} />
            Tactical Labor Re-balancing
          </button>
        </div>

        {/* Quick Shift Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {understaffedCount > 0 && (
            <button
              onClick={() => setStatusFilter(statusFilter === 'Understaffed' ? 'All' : 'Understaffed')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: statusFilter === 'Understaffed' ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                color: statusFilter === 'Understaffed' ? '#ffffff' : '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              <AlertTriangle size={12} />
              {understaffedCount} Understaffed Shift{understaffedCount > 1 ? 's' : ''}
            </button>
          )}

          {skillConstraintCount > 0 && (
            <button
              onClick={() => setStatusFilter(statusFilter === 'Skill Constraint' ? 'All' : 'Skill Constraint')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: statusFilter === 'Skill Constraint' ? '#a855f7' : 'rgba(168, 85, 247, 0.15)',
                color: statusFilter === 'Skill Constraint' ? '#ffffff' : '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              <Award size={12} />
              {skillConstraintCount} Skill Constraint
            </button>
          )}

          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px 10px',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            Net Variance: <strong style={{ color: netVariance >= 0 ? '#34d399' : '#f87171' }}>
              {netVariance >= 0 ? `+${netVariance.toFixed(1)}h surplus` : `${netVariance.toFixed(1)}h deficit`}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaborTelemetryRibbon;
