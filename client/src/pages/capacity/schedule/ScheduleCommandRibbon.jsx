import React from 'react';
import { 
  Calendar, CalendarDays, CalendarRange, Plus, Sparkles, Printer, RefreshCw, 
  Activity, AlertTriangle, CheckCircle2, Clock, Gauge, Layers, ShieldCheck, Flame
} from 'lucide-react';

const ScheduleCommandRibbon = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  schedules = [],
  workCenters = [],
  onAddNew,
  onAutoSequence,
  onPrintDispatch,
  onRefresh,
  loading = false
}) => {
  // Aggregate Metrics
  const totalJobs = schedules.length;
  const firmDispatched = schedules.filter(s => s.status === 'Firm/Released').length;
  const inProgress = schedules.filter(s => s.status === 'In-Progress').length;
  const completed = schedules.filter(s => s.status === 'Completed').length;
  const criticalCount = schedules.filter(s => s.priority === 'Critical' || s.priority === 'Expedite').length;

  const totalPlannedQty = schedules.reduce((sum, s) => sum + (Number(s.scheduledQuantity) || 0), 0);
  const totalProducedQty = schedules.reduce((sum, s) => sum + (Number(s.producedQuantity) || 0), 0);
  const progressPct = totalPlannedQty > 0 ? Math.round((totalProducedQty / totalPlannedQty) * 100) : (completed > 0 ? 100 : 0);

  // Compute estimated machine hours & average load
  const totalLoadHours = schedules.reduce((sum, s) => sum + (Number(s.runTimeHours) || 2) + (Number(s.setupTimeHours) || 0.5), 0);
  const totalCapacityHours = workCenters.reduce((sum, wc) => sum + ((Number(wc.baseDailyHours) || 8) * (Number(wc.shiftsPerDay) || 2)), 0) || 48;
  const overallLoadPct = Math.min(150, Math.round((totalLoadHours / totalCapacityHours) * 100));

  const isOverloaded = overallLoadPct > 100;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: '12px',
      padding: '18px 22px',
      color: '#f8fafc',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      marginBottom: '18px',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
          }}>
            <Activity size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{
                fontSize: '19px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                Automotive Production Scheduling & Dispatch
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.25)',
                color: '#93c5fd',
                border: '1px solid rgba(59, 130, 246, 0.4)'
              }}>
                Shop Floor MES
              </span>
            </div>
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              margin: '3px 0 0 0'
            }}>
              Master shift-by-shift machine loading, die changeover (SMED), and shop-floor dispatch list.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Timeline Type Switcher: Daily / Weekly / Monthly */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <button
              onClick={() => setActiveTab('Daily')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: activeTab === 'Daily' ? 600 : 500,
                background: activeTab === 'Daily' ? '#2563eb' : 'transparent',
                color: activeTab === 'Daily' ? '#ffffff' : '#94a3b8',
                borderRadius: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Calendar size={13} /> Daily Plan
            </button>
            <button
              onClick={() => setActiveTab('Weekly')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: activeTab === 'Weekly' ? 600 : 500,
                background: activeTab === 'Weekly' ? '#2563eb' : 'transparent',
                color: activeTab === 'Weekly' ? '#ffffff' : '#94a3b8',
                borderRadius: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <CalendarDays size={13} /> Weekly Cut
            </button>
            <button
              onClick={() => setActiveTab('Monthly')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: activeTab === 'Monthly' ? 600 : 500,
                background: activeTab === 'Monthly' ? '#2563eb' : 'transparent',
                color: activeTab === 'Monthly' ? '#ffffff' : '#94a3b8',
                borderRadius: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <CalendarRange size={13} /> Monthly MPS
            </button>
          </div>

          {/* SMED Optimizer */}
          <button
            onClick={onAutoSequence}
            title="Auto-sequence jobs by tooling to minimize die changeover downtime"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#ffffff',
              borderRadius: '7px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={14} /> SMED Optimizer
          </button>

          {/* Print Dispatch Plan */}
          <button
            onClick={onPrintDispatch}
            title="Print Shift Dispatch Work Orders"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '7px',
              transition: 'all 0.15s ease'
            }}
          >
            <Printer size={14} /> Shift Sheet
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              padding: '7px',
              borderRadius: '7px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.14)'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Add to Schedule */}
          <button
            onClick={onAddNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              borderRadius: '7px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Plus size={15} /> Add to Schedule
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        paddingTop: '16px'
      }}>
        {/* Metric 1: Total Scheduled */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Planned Jobs
            </span>
            <Layers size={14} color="#60a5fa" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff' }}>{totalJobs}</span>
            <span style={{ fontSize: '11px', color: '#38bdf8' }}>{totalPlannedQty.toLocaleString()} pcs</span>
          </div>
        </div>

        {/* Metric 2: Dispatched & Running */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Floor Execution
            </span>
            <Clock size={14} color="#34d399" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#34d399' }}>
              {inProgress + firmDispatched}
            </span>
            <span style={{ fontSize: '11px', color: '#a7f3d0' }}>
              ({firmDispatched} firm, {inProgress} running)
            </span>
          </div>
        </div>

        {/* Metric 3: Machine Capacity Utilization */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: isOverloaded ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fleet Load Rate
            </span>
            <Gauge size={14} color={isOverloaded ? '#f87171' : '#fbbf24'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{
              fontSize: '22px',
              fontWeight: 700,
              color: isOverloaded ? '#f87171' : (overallLoadPct > 80 ? '#fbbf24' : '#34d399')
            }}>
              {overallLoadPct}%
            </span>
            <span style={{ fontSize: '11px', color: isOverloaded ? '#fca5a5' : '#94a3b8' }}>
              {Math.round(totalLoadHours)}h / {Math.round(totalCapacityHours)}h
            </span>
          </div>
        </div>

        {/* Metric 4: Expedite / Critical */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Expedite Orders
            </span>
            <Flame size={14} color="#f97316" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: criticalCount > 0 ? '#fb923c' : '#ffffff' }}>
              {criticalCount}
            </span>
            <span style={{ fontSize: '11px', color: criticalCount > 0 ? '#fdba74' : '#64748b' }}>
              {criticalCount > 0 ? 'High Priority' : 'On Schedule'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCommandRibbon;
