import React, { useState } from 'react';
import { 
  Clock, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, 
  Layers, Wrench, Flame, Zap, ArrowRight, User
} from 'lucide-react';

const SHIFTS = [
  { id: 'Shift 1', name: 'Shift 1 (06:00 - 14:00)', shortName: 'S1 Morning', hours: 8 },
  { id: 'Shift 2', name: 'Shift 2 (14:00 - 22:00)', shortName: 'S2 Evening', hours: 8 },
  { id: 'Shift 3', name: 'Shift 3 (22:00 - 06:00)', shortName: 'S3 Night', hours: 8 },
  { id: 'General', name: 'General Shift (09:00 - 17:30)', shortName: 'General', hours: 8.5 }
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return { bg: '#064e3b', border: '#059669', text: '#34d399', pill: '#047857' };
    case 'In-Progress':
      return { bg: '#1e3a8a', border: '#2563eb', text: '#93c5fd', pill: '#1d4ed8' };
    case 'Firm/Released':
      return { bg: '#14532d', border: '#16a34a', text: '#86efac', pill: '#15803d' };
    case 'Draft':
      return { bg: '#374151', border: '#4b5563', text: '#d1d5db', pill: '#4b5563' };
    case 'Cancelled':
      return { bg: '#450a0a', border: '#b91c1c', text: '#fca5a5', pill: '#991b1b' };
    default:
      return { bg: '#1f2937', border: '#374151', text: '#e5e7eb', pill: '#374151' };
  }
};

const ScheduleGanttTimeline = ({
  schedules = [],
  workCenters = [],
  onSelectSchedule,
  onAddNewForWorkCenter
}) => {
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('All');

  // Group schedules by Work Center
  const wcMap = {};
  workCenters.forEach(wc => {
    wcMap[wc._id] = {
      workCenter: wc,
      schedules: []
    };
  });

  schedules.forEach(sched => {
    const wcId = sched.assignedWorkCenterId?._id || sched.assignedWorkCenterId;
    if (wcMap[wcId]) {
      wcMap[wcId].schedules.push(sched);
    } else if (wcId) {
      // Fallback for unlisted work center
      wcMap[wcId] = {
        workCenter: sched.assignedWorkCenterId || { name: 'Work Center', code: 'WC' },
        schedules: [sched]
      };
    }
  });

  const displayShifts = selectedShiftFilter === 'All' 
    ? SHIFTS.filter(s => s.id !== 'General') 
    : SHIFTS.filter(s => s.id === selectedShiftFilter);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Timeline Controls & Filter Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        background: 'rgba(15, 23, 42, 0.4)',
        borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Work Center Shift Tracks & Job Execution Sequence
          </span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '10px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)'
          }}>
            {Object.keys(wcMap).length} Active Stations
          </span>
        </div>

        {/* Shift Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '4px' }}>Shift:</span>
          {['All', 'Shift 1', 'Shift 2', 'Shift 3'].map(sh => (
            <button
              key={sh}
              onClick={() => setSelectedShiftFilter(sh)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: selectedShiftFilter === sh ? 600 : 500,
                borderRadius: '6px',
                background: selectedShiftFilter === sh ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: selectedShiftFilter === sh ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {sh}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt Header Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `240px repeat(${displayShifts.length}, 1fr)`,
        background: 'var(--bg-tertiary)',
        borderBottom: '2px solid var(--border-color)',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-secondary)'
      }}>
        <div style={{ padding: '10px 16px', borderRight: '1px solid var(--border-color)' }}>
          Work Center / Machine Fleet
        </div>
        {displayShifts.map(shift => (
          <div 
            key={shift.id} 
            style={{ 
              padding: '10px 16px', 
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{shift.name}</span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>8h Nominal</span>
          </div>
        ))}
      </div>

      {/* Gantt Rows */}
      <div style={{ overflowX: 'auto', minWidth: '700px' }}>
        {Object.keys(wcMap).length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No work centers configured. Add work centers under Master Data → Work Centres.
          </div>
        ) : (
          Object.values(wcMap).map(({ workCenter, schedules: wcSchedules }) => {
            // Calculate total scheduled hours for this workcenter
            const wcTotalHours = wcSchedules.reduce((sum, s) => sum + (Number(s.runTimeHours) || 2) + (Number(s.setupTimeHours) || 0.5), 0);
            const nominalHours = (Number(workCenter.baseDailyHours) || 8) * (displayShifts.length);
            const utilizationPct = nominalHours > 0 ? Math.round((wcTotalHours / nominalHours) * 100) : 0;
            const isOverloaded = utilizationPct > 100;

            return (
              <div
                key={workCenter._id || workCenter.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `240px repeat(${displayShifts.length}, 1fr)`,
                  borderBottom: '1px solid var(--border-color)',
                  minHeight: '110px',
                  background: 'var(--bg-primary)',
                  transition: 'background 0.15s ease'
                }}
              >
                {/* Left Column: Work Center Info & Utilization */}
                <div style={{
                  padding: '14px 16px',
                  borderRight: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {workCenter.name}
                      </strong>
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>
                        {workCenter.code}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Category: {workCenter.category || 'Production Line'}
                    </div>
                  </div>

                  {/* Capacity Utilization Meter */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Shift Load</span>
                      <span style={{ fontWeight: 600, color: isOverloaded ? '#ef4444' : utilizationPct > 80 ? '#f59e0b' : '#10b981' }}>
                        {utilizationPct}% ({wcTotalHours.toFixed(1)}h / {nominalHours}h)
                      </span>
                    </div>
                    <div style={{
                      height: '5px',
                      borderRadius: '3px',
                      background: 'var(--bg-tertiary)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(utilizationPct, 100)}%`,
                        background: isOverloaded ? '#ef4444' : utilizationPct > 80 ? '#f59e0b' : '#10b981',
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Shift Columns */}
                {displayShifts.map((shift, shiftIdx) => {
                  // Filter schedules assigned to this shift (or distribute if not specified)
                  const shiftJobs = wcSchedules.filter(s => {
                    if (s.shift) return s.shift === shift.id;
                    // Default distribution fallback if shift isn't explicitly stored
                    const hash = (s.scheduledQuantity || 1) % displayShifts.length;
                    return hash === shiftIdx;
                  });

                  return (
                    <div
                      key={shift.id}
                      style={{
                        padding: '10px',
                        borderRight: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative',
                        background: shiftIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                      }}
                    >
                      {shiftJobs.length === 0 ? (
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px dashed var(--border-color)',
                          borderRadius: '8px',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          opacity: 0.6,
                          padding: '14px 8px',
                          textAlign: 'center'
                        }}>
                          No jobs allocated
                        </div>
                      ) : (
                        shiftJobs.map(job => {
                          const statusTheme = getStatusColor(job.status);
                          const isCritical = job.priority === 'Critical' || job.priority === 'Expedite';

                          return (
                            <div
                              key={job._id}
                              onClick={() => onSelectSchedule(job)}
                              style={{
                                background: statusTheme.bg,
                                border: `1px solid ${statusTheme.border}`,
                                borderRadius: '8px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.25)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                              }}
                            >
                              {/* Top Bar: Sequence & Priority */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    color: '#ffffff'
                                  }}>
                                    #{job.sequence || 10}
                                  </span>
                                  {isCritical && (
                                    <span style={{
                                      fontSize: '9px',
                                      fontWeight: 700,
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      background: '#b91c1c',
                                      color: '#ffffff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px'
                                    }}>
                                      <Flame size={9} /> {job.priority}
                                    </span>
                                  )}
                                </div>

                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: statusTheme.text
                                }}>
                                  {job.status}
                                </span>
                              </div>

                              {/* Product Name */}
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#ffffff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {job.productId?.name || 'Automotive Part'}
                              </div>

                              {/* Specs Row: Qty & Tooling */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.85)',
                                marginTop: '4px'
                              }}>
                                <div>
                                  <strong>{job.scheduledQuantity?.toLocaleString()}</strong> pcs
                                </div>

                                {job.dieToolId && (
                                  <div style={{
                                    fontSize: '10px',
                                    background: 'rgba(255,255,255,0.15)',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}>
                                    <Wrench size={9} /> {job.dieToolId}
                                  </div>
                                )}
                              </div>

                              {/* Progress bar if in progress or completed */}
                              {job.status === 'In-Progress' && (
                                <div style={{
                                  marginTop: '6px',
                                  height: '4px',
                                  background: 'rgba(0,0,0,0.3)',
                                  borderRadius: '2px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, Math.round(((job.producedQuantity || 0) / (job.scheduledQuantity || 1)) * 100))}%`,
                                    background: '#38bdf8'
                                  }} />
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ScheduleGanttTimeline;
