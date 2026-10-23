import React from 'react';
import { 
  Layers, Clock, AlertTriangle, CheckCircle2, ChevronRight, 
  Wrench, Flame, ArrowUpRight, Plus, User, FileText
} from 'lucide-react';

const SHIFT_NAMES = ['Shift 1', 'Shift 2', 'Shift 3'];

const ScheduleShiftMatrix = ({
  schedules = [],
  workCenters = [],
  onSelectSchedule,
  onAddNew,
  onQuickStatusChange
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '16px'
    }}>
      {workCenters.map(wc => {
        const wcJobs = schedules.filter(s => {
          const id = s.assignedWorkCenterId?._id || s.assignedWorkCenterId;
          return id === wc._id;
        });

        const totalHours = wcJobs.reduce((sum, s) => sum + (Number(s.runTimeHours) || 2) + (Number(s.setupTimeHours) || 0.5), 0);
        const capacityHours = (Number(wc.baseDailyHours) || 8) * (Number(wc.shiftsPerDay) || 2);
        const loadPct = capacityHours > 0 ? Math.round((totalHours / capacityHours) * 100) : 0;
        const isOverloaded = loadPct > 100;

        return (
          <div
            key={wc._id}
            style={{
              background: 'var(--bg-secondary)',
              border: isOverloaded ? '1px solid #ef4444' : '1px solid var(--border-color)',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            {/* Work Center Station Header */}
            <div style={{
              padding: '14px 16px',
              background: isOverloaded 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)' 
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {wc.name}
                  </h3>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)'
                  }}>
                    {wc.code}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Line: {wc.category || 'Press Line'} • Manning: {wc.manningLevel || 2} ops
                </div>
              </div>

              {/* Load Badge */}
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: isOverloaded ? '#fee2e2' : loadPct > 80 ? '#fef3c7' : '#dcfce7',
                  color: isOverloaded ? '#b91c1c' : loadPct > 80 ? '#b45309' : '#15803d',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isOverloaded && <AlertTriangle size={12} />}
                  {loadPct}% Load
                </span>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {totalHours.toFixed(1)}h / {capacityHours}h
                </div>
              </div>
            </div>

            {/* Shift Blocks */}
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {SHIFT_NAMES.map(shiftName => {
                const shiftJobs = wcJobs.filter(s => (s.shift || 'Shift 1') === shiftName);
                const shiftHours = shiftJobs.reduce((sum, s) => sum + (Number(s.runTimeHours) || 2) + (Number(s.setupTimeHours) || 0.5), 0);
                const isShiftOverloaded = shiftHours > 8.0;

                return (
                  <div
                    key={shiftName}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px 12px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                      paddingBottom: '6px',
                      borderBottom: '1px dashed var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} color="var(--accent-primary)" />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {shiftName}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          ({shiftJobs.length} {shiftJobs.length === 1 ? 'job' : 'jobs'})
                        </span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isShiftOverloaded ? '#ef4444' : 'var(--text-secondary)'
                      }}>
                        {shiftHours.toFixed(1)} / 8.0 hrs
                      </span>
                    </div>

                    {shiftJobs.length === 0 ? (
                      <div style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        fontStyle: 'italic',
                        opacity: 0.7
                      }}>
                        Shift available for loading
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {shiftJobs.map(job => {
                          const isCritical = job.priority === 'Critical' || job.priority === 'Expedite';

                          return (
                            <div
                              key={job._id}
                              onClick={() => onSelectSchedule(job)}
                              style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {job.productId?.name || 'Product'}
                                </span>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: job.status === 'Completed' ? '#dcfce7' : job.status === 'In-Progress' ? '#dbeafe' : job.status === 'Firm/Released' ? '#f0fdf4' : 'var(--bg-tertiary)',
                                  color: job.status === 'Completed' ? '#15803d' : job.status === 'In-Progress' ? '#1d4ed8' : job.status === 'Firm/Released' ? '#166534' : 'var(--text-secondary)'
                                }}>
                                  {job.status}
                                </span>
                              </div>

                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '4px',
                                fontSize: '11px',
                                color: 'var(--text-secondary)'
                              }}>
                                <div>
                                  Qty: <strong style={{ color: 'var(--text-primary)' }}>{job.scheduledQuantity?.toLocaleString()}</strong>
                                  {job.dieToolId && (
                                    <span style={{ marginLeft: '8px', color: '#6366f1' }}>
                                      Die: {job.dieToolId}
                                    </span>
                                  )}
                                </div>

                                {isCritical && (
                                  <span style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    color: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px'
                                  }}>
                                    <Flame size={10} /> {job.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

export default ScheduleShiftMatrix;
