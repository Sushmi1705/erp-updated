import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Layers, 
  Gauge, 
  Timer, 
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Box
} from 'lucide-react';
import { fmtQty } from '../../../utils/money';

const TaktTimelineStudio = ({
  plans = [],
  selectedPlan = null,
  onSelectPlan,
  onOpenCreateModal
}) => {
  // If no plan selected, default to first available
  const activePlan = selectedPlan || plans[0] || null;

  // Calculate timeline date span
  const timelineInfo = useMemo(() => {
    if (!activePlan || !activePlan.details || activePlan.details.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
        days: 14,
        dateList: []
      };
    }

    let minDate = new Date();
    let maxDate = new Date();
    let validDates = false;

    activePlan.details.forEach(d => {
      if (d.Planned_Start_Date) {
        const s = new Date(d.Planned_Start_Date);
        if (!validDates || s < minDate) minDate = s;
        validDates = true;
      }
      if (d.Planned_End_Date) {
        const e = new Date(d.Planned_End_Date);
        if (!validDates || e > maxDate) maxDate = e;
        validDates = true;
      }
    });

    if (!validDates) {
      minDate = new Date();
      maxDate = new Date(minDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    // Add 1 day buffer to start and end
    const start = new Date(minDate);
    start.setDate(start.getDate() - 1);
    const end = new Date(maxDate);
    end.setDate(end.getDate() + 2);

    const diffDays = Math.max(7, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const dateList = [];
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dateList.push(d);
    }

    return {
      startDate: start,
      endDate: end,
      days: diffDays,
      dateList
    };
  }, [activePlan]);

  // Overall Plan Metrics
  const metrics = useMemo(() => {
    if (!activePlan || !activePlan.details) {
      return { totalUnits: 0, totalLines: 0, avgTaktSec: 0, unitsPerShift: 0, scheduledDays: 1 };
    }
    const totalUnits = activePlan.details.reduce((sum, d) => sum + (d.Target_Quantity || 0), 0);
    const totalLines = activePlan.details.length;
    const scheduledDays = Math.max(1, timelineInfo.days - 3);
    const availableHours = scheduledDays * 16; // 2 shifts of 8 hours
    const availableSec = availableHours * 3600;
    const avgTaktSec = totalUnits > 0 ? Math.round((availableSec / totalUnits) * 10) / 10 : 0;
    const unitsPerShift = totalUnits > 0 ? Math.round(totalUnits / (scheduledDays * 2)) : 0;

    return {
      totalUnits,
      totalLines,
      avgTaktSec,
      unitsPerShift,
      scheduledDays,
      availableHours
    };
  }, [activePlan, timelineInfo]);

  if (!plans.length) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <Box size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No Production Plans Available</h3>
        <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Create a production plan first to view its timeline and takt cadence.
        </p>
        <button onClick={onOpenCreateModal} className="btn btn-primary" style={{ backgroundColor: '#e11d48', borderColor: '#e11d48' }}>
          Create Production Plan
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Flight Plan Selector & Cadence Dashboard */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '12px',
        padding: '20px 24px',
        color: '#ffffff',
        border: '1px solid #334155',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '16px'
        }}>
          {/* Plan Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={20} color="#fb7185" />
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                Active Production Plan Timeline
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                <select
                  value={activePlan?._id || ''}
                  onChange={(e) => {
                    const found = plans.find(p => p._id === e.target.value);
                    if (found && onSelectPlan) onSelectPlan(found);
                  }}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {plans.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.Plan_Number} — {p.Plan_Type} ({p.details?.length || 0} lines)
                    </option>
                  ))}
                </select>
                <span style={{
                  fontSize: '12px',
                  backgroundColor: 'rgba(244, 63, 94, 0.25)',
                  color: '#fecdd3',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  fontWeight: 600
                }}>
                  {activePlan?.Status}
                </span>
              </div>
            </div>
          </div>

          {/* Plant & Priority Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>PLANT</span>
              <strong>{activePlan?.Plant_ID?.name || 'LBAP Hosur'}</strong>
            </div>
            <div style={{ height: '24px', width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <div>
              <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>PRIORITY</span>
              <span style={{ color: activePlan?.Priority === 'Urgent' ? '#f43f5e' : '#38bdf8', fontWeight: 600 }}>
                {activePlan?.Priority}
              </span>
            </div>
            <div style={{ height: '24px', width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <div>
              <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>ROUGH-CUT CAPACITY</span>
              <span style={{ color: activePlan?.Capacity_Status === 'Validated' ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                {activePlan?.Capacity_Status || 'Unchecked'}
              </span>
            </div>
          </div>
        </div>

        {/* Industrial Takt Cadence Metrics HUD */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* Metric 1: Total Units */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
              <Layers size={13} color="#f43f5e" />
              Target Volume
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: '#ffffff' }}>
              {fmtQty(metrics.totalUnits)} <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8' }}>parts</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              across {metrics.totalLines} scheduled line{metrics.totalLines === 1 ? '' : 's'}
            </div>
          </div>

          {/* Metric 2: Takt Tempo */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
              <Timer size={13} color="#38bdf8" />
              Calculated Takt Time
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: '#38bdf8' }}>
              {metrics.avgTaktSec}s <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8' }}>/ unit</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              continuous single-piece line rhythm
            </div>
          </div>

          {/* Metric 3: Shift Target */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
              <TrendingUp size={13} color="#34d399" />
              Shift Run Rate
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: '#34d399' }}>
              {fmtQty(metrics.unitsPerShift)} <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8' }}>/ shift</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              2 shifts · 8.0 net working hrs
            </div>
          </div>

          {/* Metric 4: Scheduled Window */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
              <Calendar size={13} color="#fbbf24" />
              Schedule Window
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: '#fbbf24' }}>
              {metrics.scheduledDays} <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8' }}>working days</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {metrics.availableHours} plant production hours
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Gantt Timeline Board */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Part Line Sequencing &amp; Execution Gantt
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Visual duration timeline across calendar days. Sequences are worked on shop floor in ascending order.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#e11d48' }} /> Stamping &amp; Pressing
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#38bdf8' }} /> Robotic Welding
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#10b981' }} /> E-Coat Surface Finish
            </span>
          </div>
        </div>

        {/* Timeline Visual Container (Single natural scroll container for wide grids) */}
        <div style={{
          overflowX: 'auto',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ minWidth: `${Math.max(800, timelineInfo.dateList.length * 60 + 260)}px` }}>
            {/* Header Dates Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `260px repeat(${timelineInfo.dateList.length}, minmax(50px, 1fr))`,
              backgroundColor: 'rgba(15, 23, 42, 0.04)',
              borderBottom: '2px solid var(--border-color)',
              fontWeight: 600,
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ padding: '10px 14px', borderRight: '1px solid var(--border-color)' }}>
                Part Line Specification
              </div>
              {timelineInfo.dateList.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    style={{
                      padding: '8px 4px',
                      textAlign: 'center',
                      borderRight: '1px solid rgba(0,0,0,0.05)',
                      backgroundColor: isToday ? 'rgba(244, 63, 94, 0.1)' : isWeekend ? 'rgba(0,0,0,0.02)' : 'transparent',
                      color: isToday ? '#e11d48' : isWeekend ? 'var(--text-muted)' : 'var(--text-secondary)'
                    }}
                  >
                    <div>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                    <div style={{ fontWeight: isToday ? 700 : 500 }}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>

            {/* Part Line Rows */}
            {activePlan?.details?.map((line, idx) => {
              const lineStart = new Date(line.Planned_Start_Date);
              const lineEnd = new Date(line.Planned_End_Date);

              // Calculate start column offset and span
              const startIdx = timelineInfo.dateList.findIndex(
                d => d.toDateString() === lineStart.toDateString()
              );
              const endIdx = timelineInfo.dateList.findIndex(
                d => d.toDateString() === lineEnd.toDateString()
              );

              const colStart = startIdx >= 0 ? startIdx + 2 : 2;
              const colSpan = endIdx >= startIdx && startIdx >= 0 ? (endIdx - startIdx + 1) : 1;

              // Color palette cycling for visual distinction
              const colors = [
                { bg: 'linear-gradient(90deg, #e11d48, #f43f5e)', border: '#be123c', text: '#ffffff' },
                { bg: 'linear-gradient(90deg, #0284c7, #38bdf8)', border: '#0369a1', text: '#ffffff' },
                { bg: 'linear-gradient(90deg, #059669, #34d399)', border: '#047857', text: '#ffffff' },
                { bg: 'linear-gradient(90deg, #7c3aed, #a78bfa)', border: '#6d28d9', text: '#ffffff' },
                { bg: 'linear-gradient(90deg, #ea580c, #fb923c)', border: '#c2410c', text: '#ffffff' }
              ];
              const colorTheme = colors[idx % colors.length];

              return (
                <div
                  key={line._id || idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `260px repeat(${timelineInfo.dateList.length}, minmax(50px, 1fr))`,
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: idx % 2 === 0 ? 'var(--bg-primary)' : 'rgba(15, 23, 42, 0.01)',
                    alignItems: 'center',
                    minHeight: '52px'
                  }}
                >
                  {/* Left Column: Line info */}
                  <div style={{
                    padding: '8px 14px',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.06)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '11px',
                      color: '#0f172a'
                    }}>
                      #{line.Line_Sequence_Number || (idx + 1) * 10}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }} title={line.Material_ID?.name}>
                        {line.Material_ID?.name || 'Raw Component'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {fmtQty(line.Target_Quantity)} units · {line.Material_ID?.grade || 'Std'}
                      </div>
                    </div>
                  </div>

                  {/* Gantt Bar Area */}
                  <div style={{
                    gridColumn: `${colStart} / span ${Math.max(1, colSpan)}`,
                    padding: '6px 4px',
                    zIndex: 1
                  }}>
                    <div style={{
                      background: colorTheme.bg,
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: colorTheme.text,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'default',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }} title={`Run Duration: ${line.Planned_Start_Date} to ${line.Planned_End_Date} (${fmtQty(line.Target_Quantity)} pcs)`}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fmtQty(line.Target_Quantity)} pcs
                      </span>
                      <span style={{ fontSize: '10px', opacity: 0.9 }}>
                        {colSpan}d
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shift Schedule Reference */}
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(15, 23, 42, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Plant Shift Windows:</span>
            <span style={{ color: 'var(--text-secondary)' }}>Shift 1: 06:00 - 14:30 (Stamping)</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--text-secondary)' }}>Shift 2: 14:30 - 23:00 (Welding &amp; Surface)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            Net available runtime: 16.0 productive hours per calendar day
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaktTimelineStudio;
