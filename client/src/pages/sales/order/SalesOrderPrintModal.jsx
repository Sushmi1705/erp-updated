import React from 'react';
import { Printer, X, Truck, Package, Building, Calendar, ShieldCheck } from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

export const SalesOrderPrintModal = ({
  order,
  lines = [],
  onClose
}) => {
  if (!order) return null;

  const totalQty = lines.reduce((acc, l) => acc + (Number(l.orderedQuantity) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1200,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#ffffff',
        color: '#1e293b',
        width: '100%',
        maxWidth: 920,
        maxHeight: '94vh',
        borderRadius: 10,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Controls Bar (Excluded during print) */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: '#031811',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={18} color="#10b981" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              Sales Order & Delivery Dispatch Specification (PDF Print)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#10b981',
                color: '#031811',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div style={{
          padding: '32px 38px',
          overflowY: 'auto',
          fontSize: 12,
          lineHeight: 1.45
        }}>
          {/* Masthead */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2.5px solid #059669',
            paddingBottom: 16,
            marginBottom: 20
          }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#031811', letterSpacing: '-0.02em' }}>
                PRECISION AUTO COMPONENTS PVT LTD
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Plot 42, Automotive Industrial Corridor, Oragadam, Chennai - 600105, Tamil Nadu, India
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                GSTIN: 33AAACP8912K1ZV • CIN: U29299TN2015PTC098765 • ISO/IATF 16949:2016 Certified
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#059669',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '4px 10px',
                borderRadius: 4,
                display: 'inline-block'
              }}>
                SALES ORDER SPECIFICATION
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: '#031811', marginTop: 4 }}>
                {order.orderNumber}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Date: {new Date(order.orderDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: 14,
            marginBottom: 20
          }}>
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Customer Account</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{order.customerId?.name || 'Customer'}</div>
              {order.customerId?.code && <div style={{ fontSize: 10.5, color: '#64748b' }}>Code: {order.customerId.code}</div>}
            </div>

            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Customer PO Reference</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                {order.customerPONumber || 'N/A'}
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b' }}>Order Date: {new Date(order.orderDate).toLocaleDateString()}</div>
            </div>

            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Delivery Commitment</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                {order.deliveryCommitmentDate ? new Date(order.deliveryCommitmentDate).toLocaleDateString() : 'To Be Scheduled'}
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b' }}>Status: {order.status}</div>
            </div>

            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Commercial Hold Gate</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: order.holdStatus !== 'None' ? '#dc2626' : '#059669' }}>
                {order.holdStatus !== 'None' ? `On Hold: ${order.holdStatus}` : 'Active & Approved'}
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b' }}>Fulfillment Ready</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Contracted Automotive Part Specifications ({lines.length} lines)</span>
              <span style={{ fontSize: 12, color: '#059669' }}>Total Ordered: {totalQty.toLocaleString()} Units</span>
            </div>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 11.5,
              border: '1px solid #e2e8f0'
            }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px', width: 35 }}>#</th>
                  <th style={{ padding: '6px 8px' }}>Component Description</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Qty Ordered</th>
                  <th style={{ padding: '6px 8px' }}>UOM</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Unit Price (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Line Total (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Fulfillment</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>ATP Status</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>#{line.lineSequence || idx + 1}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ fontWeight: 700 }}>{line.productId?.name || '—'}</span>
                      {line.productId?.code && <span style={{ fontFamily: 'monospace', color: '#64748b', marginLeft: 6 }}>[{line.productId.code}]</span>}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{Number(line.orderedQuantity).toLocaleString()}</td>
                    <td style={{ padding: '6px 8px' }}>{line.uomId?.name || line.uomId?.abbreviation || 'NOS'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtMoneyFull(line.unitPrice)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmtMoneyFull(line.lineTotal)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: '#64748b' }}>{line.fulfillmentType}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600 }}>{line.atpStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total & Logistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '3fr 2fr',
            gap: 20,
            marginBottom: 24
          }}>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              padding: 12,
              fontSize: 11
            }}>
              <div style={{ fontWeight: 700, color: '#031811', marginBottom: 4 }}>
                Automotive Transit & Quality Delivery Notes
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, color: '#475569', lineHeight: 1.45 }}>
                <li>Parts packaged with VCI anti-corrosion polybags on standardized wooden pallets.</li>
                <li>Material Test Certificate (MTC) and dimensional inspection reports attached with consignment.</li>
                <li>Transporter: _____________________ • Vehicle No: _____________________</li>
              </ul>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 6
            }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Net Order Commitment</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>
                {fmtMoneyFull(order.grandTotal || 0)}
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b' }}>Total Payable (Inclusive of adjustments)</div>
            </div>
          </div>

          {/* Signatures */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            marginTop: 30,
            paddingTop: 16,
            borderTop: '1px dashed #cbd5e1'
          }}>
            <div>
              <div style={{ height: 40 }} />
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, fontWeight: 700, fontSize: 11 }}>
                COMMERCIAL ACCOUNT DESK
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Order Verified</div>
            </div>

            <div>
              <div style={{ height: 40 }} />
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, fontWeight: 700, fontSize: 11 }}>
                STORES & DISPATCH CONTROLLER
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Stock Allocated & Released</div>
            </div>

            <div>
              <div style={{ height: 40 }} />
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, fontWeight: 700, fontSize: 11 }}>
                CUSTOMER STORES RECEIPT
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Gate Entry & Verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderPrintModal;
