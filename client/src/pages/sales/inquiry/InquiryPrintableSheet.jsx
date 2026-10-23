import React from 'react';
import { Printer, X, ShieldCheck, Building, Package, Calendar } from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

export const InquiryPrintableSheet = ({
  inquiry,
  lineItems = [],
  followUps = [],
  onClose
}) => {
  if (!inquiry) return null;

  const totalQty = lineItems.reduce((acc, l) => acc + (Number(l.requestedQuantity) || 0), 0);
  const totalTargetVal = lineItems.reduce((acc, l) => acc + ((Number(l.requestedQuantity) || 0) * (Number(l.targetUnitPrice) || 0)), 0);

  let repName = 'Unassigned';
  if (inquiry.salesRepId) {
    if (typeof inquiry.salesRepId === 'object') {
      repName = `${inquiry.salesRepId.firstName || ''} ${inquiry.salesRepId.lastName || ''}`.trim() || inquiry.salesRepId.name || inquiry.salesRepId.email;
    } else {
      repName = inquiry.salesRepId;
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
        maxWidth: 900,
        maxHeight: '92vh',
        borderRadius: 10,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: '#0b132b',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={18} color="#00b4d8" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              Printable RFQ & Commercial Inquiry Dossier
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
                background: '#00b4d8',
                color: '#0b132b',
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
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div style={{
          padding: '30px 36px',
          overflowY: 'auto',
          fontSize: 12,
          lineHeight: 1.4
        }}>
          {/* Header Masthead */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0077b6',
            paddingBottom: 16,
            marginBottom: 20
          }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0b132b', letterSpacing: '-0.02em' }}>
                PRECISION AUTO COMPONENTS PVT LTD
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Plot 42, Automotive Industrial Corridor, Oragadam, Chennai - 600105
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                ISO/IATF 16949:2016 Certified • Commercial Engineering Division
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#0077b6',
                background: 'rgba(0, 180, 216, 0.1)',
                padding: '4px 10px',
                borderRadius: 4,
                display: 'inline-block'
              }}>
                CUSTOMER INQUIRY & RFQ
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: '#0b132b', marginTop: 4 }}>
                {inquiry.inquiryNumber}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                ||||| | |||| ||| ||||||| ||| ||||
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
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
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Customer</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{inquiry.customerId?.name || '—'}</div>
              {inquiry.customerId?.code && <div style={{ fontSize: 10.5, color: '#64748b' }}>Code: {inquiry.customerId.code}</div>}
            </div>

            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Inquiry Type</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{inquiry.inquiryType || 'Standard'}</div>
              <div style={{ fontSize: 10.5, color: '#64748b' }}>Win Prob: {inquiry.probabilityOfWin || 50}%</div>
            </div>

            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Commercial Lead</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{repName}</div>
              <div style={{ fontSize: 10.5, color: '#64748b' }}>Status: {inquiry.status}</div>
            </div>

            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Dates</div>
              <div style={{ fontSize: 11, color: '#0f172a' }}>Received: <strong>{new Date(inquiry.dateReceived).toLocaleDateString()}</strong></div>
              <div style={{ fontSize: 11, color: '#0f172a' }}>Due: <strong>{inquiry.targetQuotationDate ? new Date(inquiry.targetQuotationDate).toLocaleDateString() : 'N/A'}</strong></div>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Requested Part Specifications ({lineItems.length} lines)</span>
              <span style={{ fontSize: 12, color: '#0077b6' }}>Est. Total: {fmtMoneyFull(totalTargetVal)}</span>
            </div>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 11.5,
              border: '1px solid #e2e8f0'
            }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px', width: 40 }}>Seq</th>
                  <th style={{ padding: '6px 8px' }}>Customer Part #</th>
                  <th style={{ padding: '6px 8px' }}>OEM Ref #</th>
                  <th style={{ padding: '6px 8px' }}>Precision Equivalent SKU</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '6px 8px' }}>UOM</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Target Price</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Ext. Target</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((line, idx) => {
                  const lineExt = (Number(line.requestedQuantity) || 0) * (Number(line.targetUnitPrice) || 0);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>#{line.lineSequence || idx + 1}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>{line.customerPartNumber || '—'}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{line.oemPartNumber || '—'}</td>
                      <td style={{ padding: '6px 8px' }}>
                        {line.productId ? line.productId.name : <span style={{ color: '#d97706', fontWeight: 600 }}>Custom / APQP Part</span>}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{Number(line.requestedQuantity || 0).toLocaleString()}</td>
                      <td style={{ padding: '6px 8px' }}>{line.uomId?.abbreviation || 'NOS'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{line.targetUnitPrice ? fmtMoneyFull(line.targetUnitPrice) : '—'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{lineExt > 0 ? fmtMoneyFull(lineExt) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Follow-up Touchpoints Summary */}
          {followUps.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Commercial Follow-up Activity Log ({followUps.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {followUps.map((f, i) => (
                  <div key={i} style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: '#0077b6' }}>[{new Date(f.activityDate).toLocaleDateString()}] {f.method}:</span> {f.notes}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            marginTop: 40,
            paddingTop: 16,
            borderTop: '1px dashed #cbd5e1'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 40 }} />
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, fontWeight: 700, fontSize: 11 }}>
                PREPARED BY (SALES)
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Commercial Account Manager</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 40 }} />
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, fontWeight: 700, fontSize: 11 }}>
                FEASIBILITY GATE (APQP)
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Head of Engineering & Tooling</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 40 }} />
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, fontWeight: 700, fontSize: 11 }}>
                COMMERCIAL APPROVAL
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Vice President — Commercial</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryPrintableSheet;
