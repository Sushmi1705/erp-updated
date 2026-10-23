import React from 'react';
import { X, Printer, Building2, CheckCircle2 } from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const POPrintModal = ({
  isOpen,
  onClose,
  selectedPo
}) => {
  if (!isOpen || !selectedPo) return null;

  const vendor = selectedPo.vendorId || {};
  const items = selectedPo.items || [];
  const totalAmount = Number(selectedPo.totalAmount) || 0;
  const cgst = totalAmount * 0.09;
  const sgst = totalAmount * 0.09;
  const grandTotal = totalAmount + cgst + sgst;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '92vh',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Controls Bar */}
        <div style={{
          padding: '12px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={16} color="#059669" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Official Purchase Order Voucher — {selectedPo.poNumber} (Rev {selectedPo.version || 1})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Printer size={13} /> Print Document
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div style={{
          padding: '28px 36px',
          overflowY: 'auto',
          color: '#0f172a',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {/* Company & Document Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #059669',
            paddingBottom: '14px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '16px'
                }}>
                  P
                </div>
                <div>
                  <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    PRECISION AUTO COMPONENTS PVT LTD
                  </h1>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                    (Subsidiary: Laxmi Balaji Automotive Group)
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#475569', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                Plot 48-52, SIPCOT Industrial Complex, Phase II, Hosur, Tamil Nadu — 635126<br />
                GSTIN: <strong>33AABCP1234F1Z8</strong> • PAN: <strong>AABCP1234F</strong> • CIN: U29100TN2012PTC085412
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#059669',
                display: 'block',
                textTransform: 'uppercase'
              }}>
                Purchase Order Voucher
              </span>
              <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a', marginTop: '2px' }}>
                {selectedPo.poNumber}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Rev No: <strong>v{selectedPo.version || 1}</strong> • Date: <strong>{new Date(selectedPo.createdAt || Date.now()).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>

          {/* Supplier & Delivery Terms Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '16px',
            marginBottom: '18px',
            fontSize: '11.5px',
            lineHeight: 1.5
          }}>
            {/* Vendor Details */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Supplier (Vendor Partner):
              </span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{vendor.name || 'Certified Supplier Partner'}</strong>
              <div style={{ color: '#475569', marginTop: '2px' }}>
                Vendor Code: <strong>{vendor.code || 'VND-001'}</strong><br />
                GSTIN: <strong>{vendor.gstin || '33AAACB9876Q1Z2'}</strong><br />
                Address: {vendor.address || 'Industrial Estate, Ambattur, Chennai — 600058'}
              </div>
            </div>

            {/* Delivery & Commercial Details */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Commercial Delivery Terms:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px', color: '#334155' }}>
                <span>Payment Terms:</span> <strong>{selectedPo.paymentTerms || 'Net 30 Days'}</strong>
                <span>Incoterms:</span> <strong>{selectedPo.incoterms || 'DDP - Delivered Duty Paid'}</strong>
                <span>Delivery Plant:</span> <strong>Hosur Main Plant (Store #1)</strong>
                <span>Dispatch Mode:</span> <strong>Road Logistics / Truck Inbound</strong>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11.5px',
            marginBottom: '16px'
          }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '30px' }}>#</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Code & Description</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>HSN</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Ordered Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Rate (₹)</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Promised Date</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <strong style={{ color: '#0f172a' }}>{item.materialId?.name || 'Raw Material Item'}</strong>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Code: {item.materialId?.code || 'RM-RAW'}</div>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>7209</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                    {item.orderQty || item.quantity} MT
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {fmtMoneyFull(item.unitPrice)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>
                    {item.promisedDeliveryDate ? new Date(item.promisedDeliveryDate).toLocaleDateString() : 'Immediate'}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                    {fmtMoneyFull(item.total || (item.orderQty * item.unitPrice))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown & Calculations */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <div style={{ width: '280px', fontSize: '12px', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Subtotal (Net):</span>
                <strong style={{ fontFamily: 'monospace' }}>{fmtMoneyFull(totalAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>CGST @ 9%:</span>
                <strong style={{ fontFamily: 'monospace' }}>{fmtMoneyFull(cgst)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>SGST @ 9%:</span>
                <strong style={{ fontFamily: 'monospace' }}>{fmtMoneyFull(sgst)}</strong>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '2px solid #0f172a',
                paddingTop: '6px',
                marginTop: '4px',
                fontSize: '13px',
                color: '#0f172a'
              }}>
                <strong>Grand Total Payable:</strong>
                <strong style={{ color: '#059669', fontFamily: 'monospace', fontSize: '14px' }}>
                  {fmtMoneyFull(grandTotal)}
                </strong>
              </div>
            </div>
          </div>

          {/* Standard Terms & Conditions */}
          <div style={{
            fontSize: '10.5px',
            color: '#64748b',
            lineHeight: 1.45,
            borderTop: '1px solid #e2e8f0',
            paddingTop: '10px',
            marginBottom: '28px'
          }}>
            <strong>Terms & Conditions:</strong><br />
            1. All materials must conform to ISO/IATF 16949 quality specifications and include Mill Test Certificates (MTC).<br />
            2. Late delivery penalty: 0.5% per week of delay up to a maximum of 5% of order value.<br />
            3. Rejected goods will be held at supplier risk and must be lifted within 7 days of inspection notice.<br />
            4. This Purchase Order is electronically authorized and valid under Indian Information Technology Act.
          </div>

          {/* Signature Blocks */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            textAlign: 'center',
            fontSize: '11px',
            color: '#475569'
          }}>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px' }}>
              <strong>Prepared By</strong><br />
              <span style={{ fontSize: '10px' }}>Purchase Executive</span>
            </div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px' }}>
              <strong>Verified By</strong><br />
              <span style={{ fontSize: '10px' }}>Head of Supply Chain</span>
            </div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px' }}>
              <strong>Finance Concurrence</strong><br />
              <span style={{ fontSize: '10px' }}>Finance Controller</span>
            </div>
            <div style={{ borderTop: '1px solid #059669', paddingTop: '6px', color: '#059669' }}>
              <strong>Authorized Signatory</strong><br />
              <span style={{ fontSize: '10px', color: '#64748b' }}>Managing Director</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POPrintModal;
