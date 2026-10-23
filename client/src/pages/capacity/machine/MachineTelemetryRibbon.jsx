import React from 'react';
import { 
  Factory, 
  Layers, 
  Calendar, 
  Clock, 
  PlusCircle, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  SlidersHorizontal,
  ShieldCheck,
  Cpu
} from 'lucide-react';

const MachineTelemetryRibbon = ({
  viewMode,
  setViewMode,
  periods = [],
  onOpenOvertime,
  onOpenNewPeriod,
  onOpenValidate,
  onRefresh,
  loading = false,
  statusFilter,
  setStatusFilter
}) => {
  // Compute high level telemetry
  const totalPeriods = periods.length;
  const bottleneckCount = periods.filter(p => p.status === 'Bottleneck' || p.utilizationPct > 100).length;
  const optimalCount = periods.filter(p => (p.status === 'Optimal' || (p.utilizationPct >= 70 && p.utilizationPct <= 100))).length;

  const totalAvailable = periods.reduce((sum, p) => sum + (p.availableHrs || 0), 0);
  const totalUtilized = periods.reduce((sum, p) => sum + (p.utilizedHrs || 0), 0);
  const overallFleetLoad = totalAvailable > 0 ? (totalUtilized / totalAvailable) * 100 : 0;

  // Export CSV Manifest
  const handleExportCSV = () => {
    if (!periods.length) return;
    const headers = ['Work Center', 'Code', 'Period', 'Start Date', 'End Date', 'Available Hours', 'Utilized Hours', 'Utilization %', 'Status'];
    const rows = periods.map(p => [
      `"${p.workCenterId?.name || ''}"`,
      `"${p.workCenterId?.code || ''}"`,
      `"${p.periodLabel || ''}"`,
      `"${p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : ''}"`,
      `"${p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : ''}"`,
      (p.availableHrs || 0).toFixed(1),
      (p.utilizedHrs || 0).toFixed(1),
      (p.utilizationPct || 0).toFixed(1) + '%',
      `"${p.status || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Machine_Capacity_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.25)',
      borderRadius: '12px',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.25), 0 2px 6px -1px rgba(99, 102, 241, 0.1)'
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
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            flexShrink: 0
          }}>
            <Cpu size={22} color="#ffffff" />
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
                Machine Capacity Planning
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.35)',
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
                CRP Real-Time Engine
              </span>
            </div>
            <p style={{
              margin: '3px 0 0 0',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              Finite machine hours telemetry against production load. Identifies work center bottlenecks before shop floor execution.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Validate Schedule Button */}
          <button
            onClick={onOpenValidate}
            title="Check Finite Scheduling Feasibility"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(51, 65, 85, 0.8)',
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
          >
            <ShieldCheck size={14} color="#38bdf8" />
            Feasibility Check
          </button>

          {/* New Period Button */}
          <button
            onClick={onOpenNewPeriod}
            title="Configure new scheduling period"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(51, 65, 85, 0.8)',
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
          >
            <Calendar size={14} color="#a5b4fc" />
            + New Period
          </button>

          {/* Quick Overtime Injection */}
          <button
            onClick={() => onOpenOvertime(null)}
            title="Inject Overtime or Shift Expansion"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            <PlusCircle size={14} />
            + Inject Overtime
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title="Export Capacity Manifest as CSV"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '7px 10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
          >
            <Download size={14} />
            Export
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh capacity periods ledger"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Bottom Sub-Ribbon: View Mode Switcher & Quick Health Radar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(148, 163, 184, 0.15)'
      }}>
        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid rgba(148, 163, 184, 0.2)'
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
              background: viewMode === 'ledger' ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'transparent',
              color: viewMode === 'ledger' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={13} />
            Period Timeline Ledger
          </button>

          <button
            onClick={() => setViewMode('grid')}
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
              background: viewMode === 'grid' ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <Factory size={13} />
            Work Center Machine Bays
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
              background: viewMode === 'split' ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'transparent',
              color: viewMode === 'split' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <SlidersHorizontal size={13} />
            Finite Load Balancing
          </button>
        </div>

        {/* Quick Bottleneck Alert Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {bottleneckCount > 0 ? (
            <button
              onClick={() => setStatusFilter(statusFilter === 'Bottleneck' ? 'All' : 'Bottleneck')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: statusFilter === 'Bottleneck' ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                color: statusFilter === 'Bottleneck' ? '#ffffff' : '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              <AlertTriangle size={12} />
              {bottleneckCount} Bottleneck{bottleneckCount > 1 ? 's' : ''} Active
              {statusFilter === 'Bottleneck' ? ' (Filtering)' : ' (Click to Filter)'}
            </button>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={12} />
              Zero Overloaded Centers
            </div>
          )}

          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            background: 'rgba(30, 41, 59, 0.6)',
            padding: '4px 10px',
            borderRadius: '20px',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            Fleet Load: <strong style={{ color: overallFleetLoad > 90 ? '#f87171' : overallFleetLoad > 75 ? '#fbbf24' : '#34d399' }}>{overallFleetLoad.toFixed(1)}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineTelemetryRibbon;
