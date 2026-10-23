import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  X, 
  Sun, 
  Sunset, 
  Moon, 
  Award, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';

const LaborLoadInspector = ({
  selectedPeriod,
  loadDetails = [],
  loading = false,
  onClose,
  onOpenReschedule,
  onOpenPlanWorkforce
}) => {
  const [copiedId, setCopiedId] = useState(null);

  if (!selectedPeriod) return null;

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const dept = selectedPeriod.departmentId;
  const isShort = selectedPeriod.varianceHrs < 0 || selectedPeriod.status === 'Understaffed';
  const isSkillConstraint = selectedPeriod.status === 'Skill Constraint';

  // Compute stats
  const totalLoads = loadDetails.length;
  const totalHours = loadDetails.reduce((sum, l) => sum + (l.requiredLaborHours || 0), 0);
  const expertLoads = loadDetails.filter(l => l.skillLevelRequired === 'Expert').length;
  const interLoads = loadDetails.filter(l => l.skillLevelRequired === 'Intermediate').length;
  const basicLoads = loadDetails.filter(l => l.skillLevelRequired === 'Basic' || !l.skillLevelRequired).length;

  const getShiftIcon = (shiftName) => {
    if (shiftName === 'Morning') return <Sun size={15} color="#f59e0b" />;
    if (shiftName === 'Evening') return <Sunset size={15} color="#06b6d4" />;
    return <Moon size={15} color="#8b5cf6" />;
  };

  const getSkillBadge = (level) => {
    if (level === 'Expert') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          background: 'rgba(168, 85, 247, 0.2)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.4)'
        }}>
          <Award size={12} />
          Expert Craftsman
        </span>
      );
    }
    if (level === 'Intermediate') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          background: 'rgba(6, 182, 212, 0.15)',
          color: '#38bdf8',
          border: '1px solid rgba(6, 182, 212, 0.35)'
        }}>
          <Wrench size={11} />
          Intermediate Technician
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        background: 'rgba(148, 163, 184, 0.15)',
        color: '#cbd5e1',
        border: '1px solid rgba(148, 163, 184, 0.3)'
      }}>
        <CheckCircle2 size={11} />
        Standard Operator
      </span>
    );
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6, 44, 43, 0.95) 0%, rgba(10, 25, 30, 0.98) 100%)',
      border: isShort
        ? '1px solid rgba(239, 68, 68, 0.4)'
        : isSkillConstraint
        ? '1px solid rgba(168, 85, 247, 0.4)'
        : '1px solid rgba(16, 185, 129, 0.35)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.35)',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      {/* Top Banner: Department, Shift, Actions */}
      <div style={{
        padding: '14px 20px',
        background: 'rgba(10, 25, 30, 0.9)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: isShort ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isShort ? '#f87171' : '#34d399',
            border: isShort ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
          }}>
            {getShiftIcon(selectedPeriod.shiftName)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                Labor Demand & Skill Assignment
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#059669',
                color: '#ffffff'
              }}>
                {selectedPeriod.shiftName} Shift ({selectedPeriod.periodLabel})
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
              Station: <strong style={{ color: '#cbd5e1' }}>{dept?.name}</strong> • Headcount: <strong style={{ color: '#6ee7b7' }}>{selectedPeriod.headcount} Operators</strong> • Required labor hours for scheduled shop floor orders.
            </p>
          </div>
        </div>

        {/* Action Pills & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isShort && (
            <button
              onClick={() => onOpenPlanWorkforce(selectedPeriod)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + Relieve Short Shift
            </button>
          )}

          <button
            onClick={onClose}
            title="Close labor loads inspector"
            style={{
              background: 'rgba(51, 65, 85, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Mini Diagnostic Strip for this Shift */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        padding: '14px 20px',
        background: 'rgba(10, 25, 30, 0.6)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Scheduled Work Orders</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {totalLoads} Orders
          </div>
        </div>

        <div style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Operator Hours</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#cbd5e1', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {totalHours.toFixed(1)} / {selectedPeriod.availableHrs.toFixed(1)} hrs
          </div>
        </div>

        <div style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Shift Balance Variance</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 800,
            color: selectedPeriod.varianceHrs < 0 ? '#ef4444' : '#34d399',
            fontFamily: 'var(--font-mono, monospace)',
            marginTop: '2px'
          }}>
            {selectedPeriod.varianceHrs > 0 ? '+' : ''}{selectedPeriod.varianceHrs.toFixed(1)} hrs
          </div>
        </div>

        <div style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Skill Profiles Required</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', marginTop: '4px', display: 'flex', gap: '6px' }}>
            <span style={{ color: '#c084fc' }}>{expertLoads} Expert</span> • <span style={{ color: '#38bdf8' }}>{interLoads} Inter</span> • <span style={{ color: '#94a3b8' }}>{basicLoads} Basic</span>
          </div>
        </div>
      </div>

      {/* Work Orders Table */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
            Loading labor orders for {selectedPeriod.departmentId?.name} ({selectedPeriod.shiftName})...
          </div>
        ) : loadDetails.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
              No Labor Work Orders Scheduled
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', maxWidth: '440px', marginInline: 'auto' }}>
              This shift currently has {selectedPeriod.availableHrs.toFixed(1)} operator hours 100% available for production scheduling.
            </p>
          </div>
        ) : (
          <table style={{
            width: '100%',
            minWidth: '780px',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{
                background: 'rgba(10, 25, 30, 0.9)',
                borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
                color: '#94a3b8',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '10px 16px', width: '25%' }}>Work Order</th>
                <th style={{ padding: '10px 14px', width: '22%' }}>Process Step</th>
                <th style={{ padding: '10px 14px', width: '15%', textAlign: 'right' }}>Hours Needed</th>
                <th style={{ padding: '10px 16px', width: '22%' }}>Skill Level Needed</th>
                <th style={{ padding: '10px 16px', width: '16%', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadDetails.map(load => {
                const woIdStr = String(load.workOrderId || '');
                const displayId = woIdStr.length > 8 ? `WO-${woIdStr.slice(-8).toUpperCase()}` : woIdStr;

                return (
                  <tr
                    key={load._id}
                    style={{
                      borderBottom: '1px solid rgba(16, 185, 129, 0.08)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Work Order ID */}
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#6ee7b7',
                          background: 'rgba(16, 185, 129, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          {displayId}
                        </span>
                        <button
                          onClick={() => handleCopy(woIdStr)}
                          title="Copy Full Work Order ID"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: copiedId === woIdStr ? '#34d399' : '#64748b',
                            padding: '2px',
                            display: 'flex'
                          }}
                        >
                          {copiedId === woIdStr ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Process Step */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(51, 65, 85, 0.6)',
                          color: '#cbd5e1'
                        }}>
                          Step {load.routingStepNo}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Primary Labor Routing
                        </span>
                      </div>
                    </td>

                    {/* Hours Needed */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#f1f5f9'
                      }}>
                        {(load.requiredLaborHours || 0).toFixed(1)} hrs
                      </span>
                    </td>

                    {/* Skill Level */}
                    <td style={{ padding: '10px 16px' }}>
                      {getSkillBadge(load.skillLevelRequired)}
                    </td>

                    {/* Action: Move Period / Reschedule */}
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => onOpenReschedule(load)}
                        title="Simulate moving this labor job to another shift or period"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          borderRadius: '6px',
                          padding: '4px 9px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'}
                      >
                        <ArrowRightLeft size={12} />
                        Move Shift
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LaborLoadInspector;
