import React from 'react';
import { 
  X, CheckCircle2, Clock, Play, AlertTriangle, ShieldCheck, 
  Wrench, FileText, User, Flame, Calendar, ArrowRight, Trash2, Edit
} from 'lucide-react';

const ScheduleDetailDrawer = ({
  schedule,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onConvertToWorkOrder
}) => {
  if (!isOpen || !schedule) return null;

  const isCritical = schedule.priority === 'Critical' || schedule.priority === 'Expedite';
  const totalHrs = ((Number(schedule.runTimeHours) || 2) + (Number(schedule.setupTimeHours) || 0.5)).toFixed(1);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '420px',
      maxWidth: '90vw',
      background: 'var(--bg-primary)',
      borderLeft: '1px solid var(--border-color)',
      boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.2)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.2s ease-out'
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)',
            fontWeight: 700
          }}>
            Shop Floor Job Dispatch Details
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Seq #{schedule.sequence || 10} • {schedule.shift || 'Shift 1'}
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Drawer Content Body */}
      <div style={{
        padding: '20px',
        overflowY: 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Product Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '14px'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Manufactured Product
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {schedule.productId?.name || 'Automotive Component'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Part Code: <strong>{schedule.productId?.code || 'PRD-001'}</strong>
          </div>
          {schedule.customerReference && (
            <div style={{
              marginTop: '8px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#d97706',
              fontSize: '11px',
              fontWeight: 600,
              display: 'inline-block'
            }}>
              OEM Customer: {schedule.customerReference}
            </div>
          )}
        </div>

        {/* Status & Priority Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 12px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {schedule.status}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 12px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Priority</div>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              color: isCritical ? '#ef4444' : 'var(--text-primary)',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {isCritical && <Flame size={14} />}
              {schedule.priority || 'Normal'}
            </div>
          </div>
        </div>

        {/* Operational Specs Grid */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Shop Floor & Tooling Parameters
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Planned Qty:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                {schedule.scheduledQuantity?.toLocaleString()} pcs
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Target Date:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {new Date(schedule.targetDate).toLocaleDateString()}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Work Center:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {schedule.assignedWorkCenterId?.name || '-'}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Manning Level:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {schedule.plannedOperators || 2} Operators
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Die / Tooling ID:</span>
              <div style={{ fontWeight: 600, color: '#6366f1' }}>
                {schedule.dieToolId || 'Standard Tooling'}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Total Machine Time:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {totalHrs} hrs ({schedule.setupTimeHours || 0.5}h setup)
              </div>
            </div>
          </div>
        </div>

        {/* Work Order Handshake Status */}
        <div style={{
          background: schedule.workOrderNumber ? 'rgba(5, 150, 105, 0.08)' : 'rgba(59, 130, 246, 0.08)',
          border: schedule.workOrderNumber ? '1px solid #10b981' : '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color={schedule.workOrderNumber ? '#10b981' : '#3b82f6'} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {schedule.workOrderNumber ? 'Work Order Released' : 'Ready for Shop Floor Work Order'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {schedule.workOrderNumber 
                  ? `Active execution token: ${schedule.workOrderNumber}`
                  : 'Convert this firm schedule into a Work Order to release Job Cards.'}
              </div>
            </div>
          </div>

          {!schedule.workOrderNumber && schedule.status === 'Firm/Released' && (
            <button
              onClick={() => onConvertToWorkOrder(schedule)}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '6px 12px',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Generate Work Order Now
            </button>
          )}
        </div>

        {/* Notes */}
        {schedule.notes && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
              Planner Notes
            </strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {schedule.notes}
            </p>
          </div>
        )}
      </div>

      {/* Drawer Action Footer */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Status Lifecycle Actions */}
        {schedule.status === 'Draft' && (
          <button
            onClick={() => onUpdateStatus(schedule._id, 'Firm/Released')}
            style={{
              padding: '9px 14px',
              background: '#16a34a',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={14} /> Firm Schedule & Generate Dispatch
          </button>
        )}

        {schedule.status === 'Firm/Released' && (
          <button
            onClick={() => onUpdateStatus(schedule._id, 'In-Progress')}
            style={{
              padding: '9px 14px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Play size={14} /> Start Execution on Shop Floor
          </button>
        )}

        {schedule.status === 'In-Progress' && (
          <button
            onClick={() => onUpdateStatus(schedule._id, 'Completed')}
            style={{
              padding: '9px 14px',
              background: '#059669',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={14} /> Mark Job Completed & Handover to QC
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => onEdit(schedule)}
            style={{
              padding: '7px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Edit size={12} /> Edit
          </button>

          <button
            onClick={() => onDelete(schedule._id)}
            style={{
              padding: '7px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailDrawer;
