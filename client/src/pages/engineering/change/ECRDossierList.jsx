import React from 'react';
import {
  Flame, Lock, Clock, AlertTriangle, ArrowRight, CheckCircle,
  XCircle, ChevronRight, Edit2, Package, Tag, FileText
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const ECRDossierList = ({
  headers = [],
  selectedECR,
  onSelectECR,
  onOpenEditModal,
  onChangeStatus,
  loading
}) => {
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent/Line-Down':
        return {
          bg: 'rgba(244, 63, 94, 0.15)',
          color: '#f43f5e',
          border: 'rgba(244, 63, 94, 0.35)',
          icon: Flame,
          label: 'LINE DOWN'
        };
      case 'High':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#d97706',
          border: 'rgba(245, 158, 11, 0.35)',
          icon: AlertTriangle,
          label: 'HIGH'
        };
      case 'Medium':
        return {
          bg: 'rgba(2, 132, 199, 0.12)',
          color: '#0284c7',
          border: 'rgba(2, 132, 199, 0.25)',
          icon: Clock,
          label: 'MEDIUM'
        };
      default:
        return {
          bg: 'rgba(100, 116, 139, 0.12)',
          color: '#64748b',
          border: 'rgba(100, 116, 139, 0.2)',
          icon: Clock,
          label: 'LOW'
        };
    }
  };

  const getChangeTypeColor = (type) => {
    switch (type) {
      case 'Cost Reduction': return { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' };
      case 'Material Replacement': return { bg: 'rgba(168, 85, 247, 0.12)', color: '#9333ea' };
      case 'Process': return { bg: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' };
      default: return { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706' };
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {/* List Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface-canvas)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={14} color="#f59e0b" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            ECR Registry Dossiers
          </span>
        </div>
        <span style={{
          fontSize: 10.5,
          fontWeight: 700,
          padding: '1px 6px',
          borderRadius: 4,
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#d97706'
        }}>
          {headers.length} Records
        </span>
      </div>

      {/* Cards Scroll Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        maxHeight: 'calc(100vh - 230px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
            Loading change requests...
          </div>
        ) : headers.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
            No engineering change requests match current filters.
          </div>
        ) : (
          headers.map(ecr => {
            const isSelected = selectedECR?._id === ecr._id;
            const prio = getPriorityStyle(ecr.priority);
            const PrioIcon = prio.icon;
            const typeColor = getChangeTypeColor(ecr.changeType);

            return (
              <div
                key={ecr._id}
                onClick={() => onSelectECR(ecr)}
                style={{
                  position: 'relative',
                  padding: '11px 13px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isSelected ? '#f59e0b' : 'var(--border-color)',
                  background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-primary)',
                  boxShadow: isSelected ? '0 0 0 1px rgba(245, 158, 11, 0.3), 0 2px 8px rgba(245, 158, 11, 0.1)' : 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Active Indicator Strip */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3.5,
                    background: '#f59e0b',
                    borderRadius: '6px 0 0 6px'
                  }} />
                )}

                {/* Top Line: ECR Number & Priority Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: 11.5,
                      color: isSelected ? '#d97706' : 'var(--text-primary)',
                      background: isSelected ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-secondary)',
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      {ecr.ecrNumber}
                    </span>
                    {ecr.isLocked && (
                      <span title="Locked on Approval (ECO Active)" style={{ display: 'flex', alignItems: 'center', color: '#f43f5e' }}>
                        <Lock size={12} />
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: prio.bg,
                      color: prio.color,
                      border: `1px solid ${prio.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}>
                      <PrioIcon size={10} />
                      {prio.label}
                    </span>
                    <StatusBadge value={ecr.status} />
                  </div>
                </div>

                {/* Title */}
                <div style={{
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                  marginBottom: 4
                }}>
                  {ecr.title}
                </div>

                {/* Reason Preview */}
                {ecr.reasonForChange && (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.35,
                    marginBottom: 7,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {ecr.reasonForChange}
                  </div>
                )}

                {/* Bottom Row: Change Type & Target Date */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 10.5,
                  paddingTop: 6,
                  borderTop: '1px dashed var(--border-color)',
                  color: 'var(--text-secondary)'
                }}>
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: 3,
                    background: typeColor.bg,
                    color: typeColor.color,
                    fontWeight: 600,
                    fontSize: 10
                  }}>
                    {ecr.changeType}
                  </span>

                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />
                    {ecr.targetImplementationDate ? new Date(ecr.targetImplementationDate).toLocaleDateString() : 'No date set'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ECRDossierList;
