import React from 'react';
import { X, Printer, QrCode, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { fmtQty } from '../../../utils/money';

const BatchTravelerPrintModal = ({
  isOpen,
  onClose,
  entity
}) => {
  if (!isOpen || !entity) return null;

  const mat = entity.Material_ID || {};
  const trackingNumber = entity.Tracking_Number || 'PAC/HT/26/00000';
  const uom = mat.uomId?.symbol || mat.uomId?.code || 'KG';

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
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1060,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '90vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Top Bar */}
        <div style={{
          padding: '12px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#0891b2" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              IATF 16949 Batch Identification Tag &amp; Route Traveler
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0891b2',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={13} /> Print Traveler Tag
            </button>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div style={{
          padding: '28px 36px',
          overflowY: 'auto',
          flex: 1,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {/* Card Border representing official physical bin tag */}
          <div style={{
            border: '2px solid #0f172a',
            borderRadius: '8px',
            padding: '20px'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '14px',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  PRECISION AUTO COMPONENTS PVT. LTD.
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  Automotive Pressings &amp; Welded Assemblies • IATF 16949 Certified
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  Sanand Plant 1, Gujarat
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>
                  ROUTE TRAVELER TAG
                </span>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Tag Ref: PAC/TRV/{String(entity._id).slice(-6).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Central Barcode Mock & Primary Heat Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '16px',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Batch / Mill Heat Number
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'monospace', color: '#0f172a', letterSpacing: '0.02em', marginTop: '2px' }}>
                  {trackingNumber}
                </div>

                {/* Simulated High-Density 1D Barcode */}
                <div style={{
                  height: '34px',
                  background: 'repeating-linear-gradient(90deg, #0f172a 0px, #0f172a 2px, transparent 2px, transparent 4px, #0f172a 4px, #0f172a 7px, transparent 7px, transparent 9px)',
                  margin: '8px 0',
                  borderRadius: '2px'
                }} />

                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                  {mat.name || 'Material Item'}
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  SKU Code: <strong>{mat.code || '-'}</strong> • Steel Spec: <strong>{mat.grade || 'IS 513 CR4 D'}</strong>
                </div>
              </div>

              {/* QR Mock Box */}
              <div style={{
                border: '1px dashed #94a3b8',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                background: '#f8fafc'
              }}>
                <QrCode size={56} color="#0f172a" />
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#475569', marginTop: '4px' }}>
                  SCAN FOR 2D IATF TRAVELER
                </div>
              </div>
            </div>

            {/* Tag Specifications Matrix */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              marginBottom: '16px',
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '11px'
            }}>
              <div>
                <span style={{ color: '#64748b' }}>Stores Quantity:</span>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                  {fmtQty(entity.Current_Quantity)} {uom}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>Supplier Mill Ref:</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  {entity.Reference_Code || 'Direct Receipt'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>Inward Date:</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  {new Date(entity.Mfg_Date).toLocaleDateString('en-IN')}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>Quality Status:</span>
                <div style={{ fontWeight: 800, color: entity.Current_Status === 'Quarantined' ? '#dc2626' : '#059669' }}>
                  {entity.Current_Status}
                </div>
              </div>
            </div>

            {/* Process Traveler Routing Sequence */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: '6px' }}>
                Manufacturing Process Routing Checklist:
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '4px 6px', textAlign: 'left' }}>Seq</th>
                    <th style={{ padding: '4px 6px', textAlign: 'left' }}>Process Stage</th>
                    <th style={{ padding: '4px 6px', textAlign: 'left' }}>Work Center / Tool</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Operator Sign</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px 6px' }}>10</td>
                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>Raw Material Inward &amp; MTC Inspection</td>
                    <td style={{ padding: '4px 6px' }}>Stores Receiving Gate</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>PASSED</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>Stores In-Charge</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px 6px' }}>20</td>
                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>Progressive Stamping &amp; Blanking</td>
                    <td style={{ padding: '4px 6px' }}>Press 400T Line 4</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>ROUTED</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>Line Supervisor</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px 6px' }}>30</td>
                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>Robotic MIG Seam Welding</td>
                    <td style={{ padding: '4px 6px' }}>Welding Cell 02</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: '#64748b' }}>SCHEDULED</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>Welding Lead</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px' }}>40</td>
                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>Final Pre-Dispatch Inspection (PDI)</td>
                    <td style={{ padding: '4px 6px' }}>Quality QA Gate</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: '#64748b' }}>PENDING</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>QA Inspector</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quality Stamp Block */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
              marginTop: '18px',
              paddingTop: '14px',
              borderTop: '1px solid #cbd5e1'
            }}>
              <div>
                <div style={{ height: '30px', borderBottom: '1px dashed #94a3b8', marginBottom: '4px' }} />
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>Stores Authorized Issuer</div>
              </div>

              <div>
                <div style={{ height: '30px', borderBottom: '1px dashed #94a3b8', marginBottom: '4px' }} />
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>Quality Assurance Inspector Stamp</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchTravelerPrintModal;
