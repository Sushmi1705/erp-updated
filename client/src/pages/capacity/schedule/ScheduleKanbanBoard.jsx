import React from 'react';
import { 
  CheckCircle2, Clock, Play, ArrowRight, Wrench, ShieldCheck, 
  Flame, FileText, Plus, ChevronRight, AlertTriangle 
} from 'lucide-react';

const KANBAN_STAGES = [
  { id: 'Draft', title: 'Planned / Draft', color: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' },
  { id: 'Firm/Released', title: 'Firm / Dispatched', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)' },
  { id: 'In-Progress', title: 'Running / In-Progress', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)' },
  { id: 'Completed', title: 'Completed / QA', color: '#059669', bg: 'rgba(5, 150, 105, 0.08)' },
  { id: 'Cancelled', title: 'Cancelled / Hold', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)' }
];

const ScheduleKanbanBoard = ({
  schedules = [],
  activeTab,
  onSelectSchedule,
  onUpdateStatus,
  onConvertToWorkOrder,
  onAddNew
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '14px',
      alignItems: 'start'
    }}>
      {KANBAN_STAGES.map(stage => {
        const stageJobs = schedules.filter(s => s.status === stage.id);
        const stageQty = stageJobs.reduce((sum, s) => sum + (Number(s.scheduledQuantity) || 0), 0);

        return (
          <div
            key={stage.id}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '400px'
            }}
          >
            {/* Stage Column Header */}
            <div style={{
              padding: '12px 14px',
              background: stage.bg,
              borderBottom: `2px solid ${stage.color}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {stage.title}
                </span>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {stageQty.toLocaleString()} units total
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'var(--bg-primary)',
                color: stage.color,
                border: `1px solid ${stage.color}`
              }}>
                {stageJobs.length}
              </span>
            </div>

            {/* Stage Cards Container */}
            <div style={{
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: 1,
              overflowY: 'auto',
              maxHeight: '650px'
            }}>
              {stageJobs.length === 0 ? (
                <div style={{
                  padding: '30px 10px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontStyle: 'italic',
                  opacity: 0.6
                }}>
                  No jobs in {stage.title}
                </div>
              ) : (
                stageJobs.map(job => {
                  const isCritical = job.priority === 'Critical' || job.priority === 'Expedite';

                  return (
                    <div
                      key={job._id}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = stage.color;
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                      }}
                    >
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace'
                        }}>
                          Seq #{job.sequence || 10}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6'
                          }}>
                            {job.shift || 'Shift 1'}
                          </span>
                          {isCritical && (
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: '#ef4444',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <Flame size={9} /> {job.priority}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Name & Code */}
                      <div 
                        onClick={() => onSelectSchedule(job)}
                        style={{ cursor: 'pointer' }}
                      >
                        <h4 style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          margin: 0,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3
                        }}>
                          {job.productId?.name || 'Product'}
                        </h4>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {job.productId?.code || 'PRD'} • WC: {job.assignedWorkCenterId?.name || 'Work Center'}
                        </div>
                      </div>

                      {/* Details Strip */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        background: 'var(--bg-secondary)',
                        padding: '6px 8px',
                        borderRadius: '6px'
                      }}>
                        <div>
                          Qty: <strong style={{ color: 'var(--text-primary)' }}>{job.scheduledQuantity?.toLocaleString()}</strong>
                        </div>
                        {job.dieToolId && (
                          <div style={{ color: '#6366f1', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Wrench size={10} /> {job.dieToolId}
                          </div>
                        )}
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {new Date(job.targetDate).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Work Order Tag if generated */}
                      {job.workOrderNumber && (
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#059669',
                          background: '#ecfdf5',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FileText size={10} /> WO: {job.workOrderNumber}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '6px',
                        borderTop: '1px solid var(--border-color)',
                        marginTop: '2px'
                      }}>
                        <button
                          onClick={() => onSelectSchedule(job)}
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            background: 'transparent',
                            padding: '3px 6px'
                          }}
                        >
                          Details
                        </button>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          {stage.id === 'Draft' && (
                            <button
                              onClick={() => onUpdateStatus(job._id, 'Firm/Released')}
                              title="Firm this schedule and release dispatch to shop floor"
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#16a34a',
                                color: '#ffffff',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              Firm & Dispatch <ArrowRight size={11} />
                            </button>
                          )}

                          {stage.id === 'Firm/Released' && (
                            <>
                              {!job.workOrderNumber && (
                                <button
                                  onClick={() => onConvertToWorkOrder(job)}
                                  title="Generate Work Order for Shop Floor"
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    background: '#0284c7',
                                    color: '#ffffff',
                                    padding: '3px 6px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  + Gen WO
                                </button>
                              )}
                              <button
                                onClick={() => onUpdateStatus(job._id, 'In-Progress')}
                                title="Start Execution on Press"
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                Start <Play size={10} />
                              </button>
                            </>
                          )}

                          {stage.id === 'In-Progress' && (
                            <button
                              onClick={() => onUpdateStatus(job._id, 'Completed')}
                              title="Mark Production Completed"
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#059669',
                                color: '#ffffff',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              Complete <CheckCircle2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScheduleKanbanBoard;
