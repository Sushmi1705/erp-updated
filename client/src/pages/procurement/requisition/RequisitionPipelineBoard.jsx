import React from 'react';
import { 
  Clock, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, 
  FileText, ShoppingCart, User, Building2, Package, Sparkles
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const PIPELINE_STAGES = [
  { id: 'Draft', title: 'Draft Requests', color: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' },
  { id: 'In_Approval', title: 'Pending Approval', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
  { id: 'Needs_CFO_Approval', title: 'CFO Budget Review', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
  { id: 'Approved', title: 'Approved & Ready', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
  { id: 'PO_Created', title: 'PO Sourced & Placed', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.08)' },
  { id: 'Rejected', title: 'Declined / Hold', color: '#991b1b', bg: 'rgba(153, 27, 27, 0.08)' }
];

const RequisitionPipelineBoard = ({
  requisitions = [],
  onSelectRequisition,
  onApproveStep,
  onConvertToPO,
  onOpenQuickBuy
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '14px',
      alignItems: 'start'
    }}>
      {PIPELINE_STAGES.map(stage => {
        const stageRequisitions = requisitions.filter(r => r.status === stage.id);
        const stageValue = stageRequisitions.reduce((sum, r) => sum + (Number(r.totalValue) || 0), 0);

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
              minHeight: '450px'
            }}
          >
            {/* Column Header */}
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
                  {fmtMoneyFull(stageValue)}
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
                {stageRequisitions.length}
              </span>
            </div>

            {/* Cards Container */}
            <div style={{
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: 1,
              overflowY: 'auto',
              maxHeight: '680px'
            }}>
              {stageRequisitions.length === 0 ? (
                <div style={{
                  padding: '30px 10px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontStyle: 'italic',
                  opacity: 0.6
                }}>
                  No requests in {stage.title}
                </div>
              ) : (
                stageRequisitions.map(pr => {
                  const itemsCount = pr.items?.length || 0;
                  const firstItem = pr.items?.[0]?.itemId?.name || pr.items?.[0]?.freeTextDesc || 'Material Item';
                  const pendingStep = pr.approvals?.find(a => a.status === 'Pending');

                  return (
                    <div
                      key={pr._id}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = stage.color;
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                      }}
                    >
                      {/* Top Bar: PR Number & Submission Date */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '11px',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {pr.prNumber}
                        </span>

                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {new Date(pr.submissionDate || pr.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>

                      {/* Department & First Item */}
                      <div 
                        onClick={() => onSelectRequisition(pr)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3
                        }}>
                          {firstItem} {itemsCount > 1 && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>+{itemsCount - 1} more</span>}
                        </div>

                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          marginTop: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Building2 size={11} />
                          {pr.costCenterId?.name || 'Manufacturing Plant'}
                        </div>
                      </div>

                      {/* Total Value & Items Strip */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--bg-secondary)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Order Value:</span>
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          {fmtMoneyFull(pr.totalValue)}
                        </strong>
                      </div>

                      {/* Approval Stepper Indicator */}
                      {pr.approvals && pr.approvals.length > 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Approvals:</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {pr.approvals.map((step, idx) => (
                              <div
                                key={step._id || idx}
                                title={`Step ${step.sequence}: ${step.comments} (${step.status})`}
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: step.status === 'Approved' ? '#10b981' : step.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                                }}
                              />
                            ))}
                          </div>
                          <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                            {pr.approvals.filter(a => a.status === 'Approved').length}/{pr.approvals.length}
                          </span>
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
                          onClick={() => onSelectRequisition(pr)}
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            background: 'transparent',
                            padding: '3px 6px',
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          {pendingStep && (stage.id === 'In_Approval' || stage.id === 'Needs_CFO_Approval') && (
                            <button
                              onClick={() => onApproveStep(pr._id, pendingStep._id, 'Approved')}
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#10b981',
                                color: '#ffffff',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <ShieldCheck size={11} /> Approve
                            </button>
                          )}

                          {stage.id === 'Approved' && (
                            <button
                              onClick={() => onConvertToPO(pr)}
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#0284c7',
                                color: '#ffffff',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              + Issue PO <ArrowRight size={11} />
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

export default RequisitionPipelineBoard;
