import React from 'react';
import { Printer, X, ShieldCheck, Building, Package, Calendar, Award } from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

export const QuotationPrintModal = ({
  header,
  revision,
  lines = [],
  financials = [],
  onClose
}) => {
  if (!header || !revision) return null;

  const totalQty = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);

  let repName = 'Unassigned';
  if (header.salesRepId) {
    if (typeof header.salesRepId === 'object') {
      repName = `${header.salesRepId.firstName || ''} ${header.salesRepId.lastName || ''}`.trim() || header.salesRepId.name || header.salesRepId.email;
    } else {
      repName = header.salesRepId;
    }
  }

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
          background: '#07172c',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={18} color="#f59e0b" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              Formal Commercial Quotation Proposal (PDF Print)
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
                background: '#f59e0b',
                color: '#07172c',
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
            borderBottom: '2.5px solid #d97706',
            paddingBottom: 16,
            marginBottom: 20
          }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#07172c', letterSpacing: '-0.02em' }}>
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
                color: '#b45309',
                background: 'rgba(245, 158, 11, 0.12)',
                padding: '4px 10px',
                borderRadius: 4,
                display: 'inline-block'
              }}>
                COMMERCIAL QUOTATION
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: '#07172c', marginTop: 4 }}>
                {header.quotationNumber} — V{revision.revisionNumber}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Date: {new Date(revision.validFromDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Customer & Quote Details Grid */}
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
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Quotation To</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{header.customerId?.name || 'Customer'}</div>
              {header.customerId?.code && <div style={{ fontSize: 10.5, color: '#64748b' }}>Code: {header.customerId.code}</div>}
            </div>

            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Validity Period</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                {new Date(revision.validFromDate).toLocaleDateString()} to {new Date(revision.validToDate).toLocaleDateString()}
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b' }}>30 Days Net Validity</div>
            </div>

            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Commercial Lead</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{repName}</div>
              <div style={{ fontSize: 10.5, color: '#64748b' }}>Commercial Division</div>
            </div>

            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Reference</div>
              <div style={{ fontSize: 12, color: '#0f172a' }}>
                {header.inquiryId ? <strong>RFQ: {header.inquiryId.inquiryNumber}</strong> : 'Direct Commercial Offer'}
              </div>
              <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 700 }}>Status: {revision.status}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              Itemized Bill of Quantities & Prices ({lines.length} lines)
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
                  <th style={{ padding: '6px 8px' }}>Category</th>
                  <th style={{ padding: '6px 8px' }}>Description & Part Specification</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '6px 8px' }}>UOM</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Unit Price (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Disc %</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: '6px 8px', color: '#64748b' }}>{line.lineType}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ fontWeight: 700 }}>{line.productId?.name || line.description}</span>
                      {line.productId?.code && <span style={{ fontFamily: 'monospace', color: '#64748b', marginLeft: 6 }}>[{line.productId.code}]</span>}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{Number(line.quantity).toLocaleString()}</td>
                    <td style={{ padding: '6px 8px' }}>{line.uomId?.abbreviation || 'NOS'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtMoneyFull(line.unitPrice)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{line.lineDiscountPercentage ? `${line.lineDiscountPercentage}%` : '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmtMoneyFull(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Commercial Financials & Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '3fr 2fr',
            gap: 20,
            marginBottom: 24
          }}>
            {/* Payment & Banking Terms */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              padding: 12,
              fontSize: 11
            }}>
              <div style={{ fontWeight: 700, color: '#07172c', marginBottom: 4 }}>
                Commercial Terms & Bank Remittance Instructions
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, color: '#475569', lineHeight: 1.45 }}>
                <li>Price Validity: 30 days from issuance date.</li>
                <li>Delivery Terms: Ex-Works Oragadam plant / Standard transit packaging included.</li>
                <li>Payment Terms: Net 30 days from invoice dispatch.</li>
                <li>Bank: HDFC Bank Ltd • A/C No: 50200049281734 • IFSC: HDFC0001824</li>
              </ul>
            </div>

            {/* Calculations Box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 11.5
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmtMoneyFull(revision.subTotal || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Discounts:</span>
                <span style={{ fontFamily: 'monospace' }}>- {fmtMoneyFull(revision.totalDiscountAmount || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0077b6' }}>
                <span>GST Taxes:</span>
                <span style={{ fontFamily: 'monospace' }}>+ {fmtMoneyFull(revision.totalTaxAmount || 0)}</span>
              </div>
              <div style={{ height: 1, background: '#cbd5e1', margin: '3px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                <span>Grand Total (INR):</span>
                <span style={{ fontFamily: 'monospace', color: '#b45309' }}>{fmtMoneyFull(revision.grandTotal || 0)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 40,
            marginTop: 30,
            paddingTop: 16,
            borderTop: '1px dashed #cbd5e1'
          }}>
            <div>
              <div style={{ height: 40 }} />
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, fontWeight: 700, fontSize: 11 }}>
                FOR PRECISION AUTO COMPONENTS PVT LTD
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Authorized Commercial Signatory</div>
            </div>

            <div>
              <div style={{ height: 40 }} />
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, fontWeight: 700, fontSize: 11 }}>
                ACCEPTED & CONFIRMED BY CUSTOMER
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Authorized Signature & Corporate Stamp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPrintModal;
