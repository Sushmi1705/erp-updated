import React from 'react';
import { 
  Truck, CheckCircle2, Clock, ShieldCheck, 
  ArrowRight, FileText, Package, Check, RefreshCw
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const PIPELINE_COLUMNS = [
  { id: 'Pending', title: '1. Authorization & Approval', color: '#d97706', bg: 'rgba(245, 158, 11, 0.08)' },
  { id: 'Transmitted', title: '2. Supplier B2B / EDI', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)' },
  { id: 'In-Transit', title: '3. Inbound In-Transit (ASN)', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)' },
  { id: 'Delivered', title: '4. Delivered & Stores GRN', color: '#059669', bg: 'rgba(16, 185, 129, 0.08)' }
];

const POPipelineBoard = ({
  purchaseOrders = [],
  onSelectPo,
  onOpenWorkbench
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '14px',
      alignItems: 'start'
    }}>
      {PIPELINE_COLUMNS.map(col => {
        const colOrders = purchaseOrders.filter(po => {
          if (col.id === 'Delivered') return po.deliveryStatus === 'Delivered';
          if (col.id === 'In-Transit') return po.deliveryStatus === 'In-Transit';
          if (col.id === 'Transmitted') return po.approvalStatus === 'Approved' && po.deliveryStatus !== 'In-Transit' && po.deliveryStatus !== 'Delivered';
          if (col.id === 'Pending') return po.approvalStatus === 'Pending';
          return false;
        });

        const colValue = colOrders.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);

        return (
          <div
            key={col.id}
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '480px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            {/* Column Header */}
            <div style={{
              padding: '12px 14px',
              background: col.bg,
              borderBottom: `2px solid ${col.color}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {col.title}
                </span>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {colOrders.length} orders • {fmtMoneyFull(colValue)}
                </div>
              </div>

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'var(--surface-card)',
                color: col.color,
                border: `1px solid ${col.color}`
              }}>
                {colOrders.length}
              </span>
            </div>

            {/* Event Cards Container */}
            <div style={{
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: 1,
              overflowY: 'auto',
              maxHeight: '680px'
            }}>
              {colOrders.length === 0 ? (
                <div style={{
                  padding: '30px 10px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontStyle: 'italic',
                  opacity: 0.7
                }}>
                  No orders currently in this stage
                </div>
              ) : (
                colOrders.map(po => {
                  const firstLine = po.items?.[0] || {};

                  return (
                    <div
                      key={po._id}
                      style={{
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = col.color;
                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                      }}
                    >
                      {/* Top Bar: PO Number & Version */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          color: '#059669'
                        }}>
                          {po.poNumber}
                        </span>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: 'var(--surface-canvas)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          Rev {po.version || 1}
                        </span>
                      </div>

                      {/* Supplier & Material */}
                      <div 
                        onClick={() => {
                          onSelectPo(po);
                          onOpenWorkbench();
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <h4 style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          margin: 0,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3
                        }}>
                          {po.vendorId?.name || 'Supplier'}
                        </h4>

                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          marginTop: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Package size={11} />
                          {firstLine.materialId?.name || 'Raw Material Order'}
                          {firstLine.orderQty ? ` (${firstLine.orderQty} Qty)` : ''}
                        </div>
                      </div>

                      {/* Total Amount & Due Date Strip */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--surface-canvas)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Committed:</span>
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {fmtMoneyFull(po.totalAmount)}
                        </strong>
                      </div>

                      {/* Footer Actions */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '4px',
                        borderTop: '1px solid var(--border-color)',
                        fontSize: '11px'
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {po.paymentTerms || 'Net30'} • {po.incoterms || 'DDP'}
                        </span>

                        <button
                          onClick={() => {
                            onSelectPo(po);
                            onOpenWorkbench();
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#059669',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            cursor: 'pointer',
                            padding: '2px 4px'
                          }}
                        >
                          Fulfill <ArrowRight size={11} />
                        </button>
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

export default POPipelineBoard;
