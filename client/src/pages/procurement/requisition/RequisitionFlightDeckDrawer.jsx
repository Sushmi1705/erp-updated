import React from 'react';
import { 
  X, CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  ShoppingCart, Building2, User, FileText, ArrowRight, Trash2, 
  Package, Printer, DollarSign, Send
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const RequisitionFlightDeckDrawer = ({
  requisition,
  isOpen,
  onClose,
  onApproveStep,
  onConvertToPO,
  onConvertToRFQ,
  onDelete,
  onPrintVoucher
}) => {
  if (!isOpen || !requisition) return null;

  const totalValue = requisition.totalValue || 0;
  const items = requisition.items || [];
  const approvals = requisition.approvals || [];
  const pendingStep = approvals.find(a => a.status === 'Pending');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '520px',
      maxWidth: '92vw',
      background: 'var(--bg-primary)',
      borderLeft: '1px solid var(--border-color)',
      boxShadow: '-8px 0 28px rgba(0, 0, 0, 0.25)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.2s ease-out'
    }}>
      {/* Header */}
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
            Purchase Requisition Dossier
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {requisition.prNumber}
            </h2>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(20, 184, 166, 0.15)',
              color: '#0d9488'
            }}>
              {requisition.status?.replace(/_/g, ' ')}
            </span>
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
        {/* Cost Center & Spend Summary */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '14px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cost Center / Department</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {requisition.costCenterId?.name || 'Manufacturing Operations'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Code: {requisition.costCenterId?.code || 'CC-PROD'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Requisition Value</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0d9488', marginTop: '2px' }}>
              {fmtMoneyFull(totalValue)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Raised on: {new Date(requisition.submissionDate || requisition.createdAt).toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>

        {/* Line Items Breakdown Table */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Requested Items ({items.length})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Total: {items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0)} units
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item, idx) => (
              <div
                key={item._id || idx}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                    {item.itemId?.name || item.freeTextDesc || 'Industrial Material'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Supplier: <strong>{item.supplierId?.name || 'Open Sourcing'}</strong> • Needed by: {new Date(item.requiredDate).toLocaleDateString('en-IN')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                    {item.qty} × {fmtMoneyFull(item.unitPrice)}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#0d9488', marginTop: '2px' }}>
                    = {fmtMoneyFull(item.qty * item.unitPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Tier Approval Chain */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Approval Routing Workflow
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {approvals.length === 0 ? 'Exempt' : `${approvals.filter(a => a.status === 'Approved').length} of ${approvals.length} Approved`}
            </span>
          </div>

          {approvals.length === 0 ? (
            <div style={{
              padding: '10px 12px',
              borderRadius: '6px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={14} color="#059669" />
              Auto-Approved: Requisition value is below the management approval threshold.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {approvals.map(step => (
                <div
                  key={step._id}
                  style={{
                    background: 'var(--bg-primary)',
                    border: step.status === 'Pending' ? '1px solid #fde68a' : '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Tier {step.sequence} Authorization
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {step.comments}
                    </div>
                    {step.actionTimestamp && (
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Decided on: {new Date(step.actionTimestamp).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: step.status === 'Approved' ? '#dcfce7' : step.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                      color: step.status === 'Approved' ? '#15803d' : step.status === 'Rejected' ? '#b91c1c' : '#b45309'
                    }}>
                      {step.status}
                    </span>

                    {step.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <button
                          onClick={() => onApproveStep(requisition._id, step._id, 'Approved')}
                          style={{
                            padding: '3px 8px',
                            background: '#10b981',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onApproveStep(requisition._id, step._id, 'Rejected')}
                          style={{
                            padding: '3px 8px',
                            background: '#ef4444',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sourcing Automation & PO Status */}
        {requisition.status === 'Approved' && (
          <div style={{
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid #38bdf8',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#0284c7" />
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block' }}>
                  Requisition Fully Approved
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  This requisition is fully authorized. You can immediately create a Purchase Order or request RFQ quotations.
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => onConvertToPO(requisition)}
                style={{
                  padding: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <DollarSign size={13} /> Generate Purchase Order
              </button>

              <button
                onClick={() => onConvertToRFQ(requisition)}
                style={{
                  padding: '8px',
                  background: '#6366f1',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Send size={13} /> Send to Sourcing (RFQ)
              </button>
            </div>
          </div>
        )}

        {requisition.status === 'PO_Created' && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '12px 14px',
            color: '#065f46',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="#10b981" />
            <div>
              <strong>Purchase Order Active</strong>
              <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                Requisition has been successfully converted into an official supplier Purchase Order.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Action Footer */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => onPrintVoucher(requisition)}
          style={{
            padding: '7px 12px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Printer size={13} /> Print Slip
        </button>

        {requisition.status !== 'PO_Created' && (
          <button
            onClick={() => onDelete(requisition._id)}
            style={{
              padding: '7px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Trash2 size={13} /> Cancel PR
          </button>
        )}
      </div>
    </div>
  );
};

export default RequisitionFlightDeckDrawer;
