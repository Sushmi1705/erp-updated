import React, { useRef } from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, Award } from 'lucide-react';

const InspectionPrintModal = ({
  inspection,
  onClose
}) => {
  const printAreaRef = useRef(null);

  if (!inspection) return null;

  const handlePrint = () => {
    window.print();
  };

  const matCode = inspection.grnId?.materialId?.code || 'RAW-AUTO';
  const matName = inspection.grnId?.materialId?.name || 'Inward Automotive Component';
  const matUom = inspection.grnId?.materialId?.uom || 'PCS';
  const vendorName = inspection.grnId?.vendorId?.name || 'Direct Supplier';
  const vendorCode = inspection.grnId?.vendorId?.code || 'VEND-DIR';
  const vendorGstin = inspection.grnId?.vendorId?.gstin || '27AABCP1234F1Z8';
  const grnNo = inspection.grnId?.grnNumber || 'GRN-INWARD';
  const poNo = inspection.grnId?.purchaseOrderId?.poNumber || 'PO-ATTACHED';
  const inspNo = inspection.inspectionNumber || 'QI-AUTO';
  const inspDate = inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');

  const totalLot = inspection.inspectedQuantity || 0;
  const accepted = inspection.acceptedQuantity || 0;
  const rejected = inspection.rejectedQuantity || 0;
  const hold = inspection.holdQuantity || 0;

  const passPct = totalLot > 0 ? ((accepted / totalLot) * 100).toFixed(1) : '100.0';
  const ppm = totalLot > 0 ? Math.round((rejected / totalLot) * 1000000) : 0;

  const isAllPassed = rejected === 0 && hold === 0 && inspection.inspectionStatus === 'Completed';
  const isHold = hold > 0 || inspection.inspectionStatus === 'Hold-Review';
  const isRejected = rejected > 0;

  let verdictTitle = 'RELEASED FOR PRODUCTION STORE';
  let verdictColor = '#059669';
  let verdictBg = 'rgba(5, 150, 105, 0.08)';

  if (isRejected && accepted === 0) {
    verdictTitle = 'LOT REJECTED — RETURN TO VENDOR (RTV)';
    verdictColor = '#dc2626';
    verdictBg = 'rgba(239, 68, 68, 0.08)';
  } else if (isRejected) {
    verdictTitle = 'PARTIAL REJECTION — CONDITIONAL RELEASE';
    verdictColor = '#ea580c';
    verdictBg = 'rgba(234, 88, 12, 0.08)';
  } else if (isHold) {
    verdictTitle = 'QUARANTINE / UNDER MRB INVESTIGATION';
    verdictColor = '#b45309';
    verdictBg = 'rgba(245, 158, 11, 0.08)';
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      {/* Container Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        color: '#1e293b'
      }}>
        {/* Action Header (hidden on print) */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#059669" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              Quality Inspection & Material Release Certificate
            </span>
            <span style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              background: '#e2e8f0',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {inspNo}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Content */}
        <div 
          ref={printAreaRef}
          style={{
            padding: '24px 30px',
            overflowY: 'auto',
            background: '#ffffff',
            fontSize: '12px',
            lineHeight: '1.45',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {/* Certificate Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '14px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                PRECISION AUTO COMPONENTS PVT. LTD.
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                Plant: Plot 42-45, Automotive Ancillary Zone, Chakan MIDC, Pune - 410501
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                IATF 16949:2016 Certified • Receiving Quality Assurance (RQA) Directorate
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#059669',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                RQA Release Sheet
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                Cert Ref: <strong>{inspNo}</strong>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                Date: {inspDate}
              </div>
            </div>
          </div>

          {/* Reference Meta Ribbon */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Inspection Job</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{inspNo}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Inward GRN Ref</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{grnNo}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Purchase Order</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{poNo}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Lead Inspector</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{inspection.inspectorName || 'RQA Inspector 1'}</div>
            </div>
          </div>

          {/* Consignment & Vendor Information Table */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <tbody>
              <tr style={{ background: '#f1f5f9' }}>
                <th colSpan="2" style={{ padding: '6px 10px', fontSize: '11px', textAlign: 'left', color: '#334155', fontWeight: 700 }}>
                  Supplier Consignment Details
                </th>
                <th colSpan="2" style={{ padding: '6px 10px', fontSize: '11px', textAlign: 'left', color: '#334155', fontWeight: 700 }}>
                  Material Technical Specification
                </th>
              </tr>
              <tr>
                <td style={{ padding: '6px 10px', fontSize: '11px', color: '#64748b', width: '20%', borderBottom: '1px solid #e2e8f0' }}>Vendor Name:</td>
                <td style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: '#0f172a', width: '30%', borderBottom: '1px solid #e2e8f0' }}>{vendorName}</td>
                <td style={{ padding: '6px 10px', fontSize: '11px', color: '#64748b', width: '20%', borderBottom: '1px solid #e2e8f0' }}>Material / Part:</td>
                <td style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: '#0f172a', width: '30%', borderBottom: '1px solid #e2e8f0' }}>{matName}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 10px', fontSize: '11px', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Vendor Code / GST:</td>
                <td style={{ padding: '6px 10px', fontSize: '11px', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>{vendorCode} • {vendorGstin}</td>
                <td style={{ padding: '6px 10px', fontSize: '11px', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Internal Part Code:</td>
                <td style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', borderBottom: '1px solid #e2e8f0' }}>{matCode}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 10px', fontSize: '11px', color: '#64748b' }}>AQL Sampling Plan:</td>
                <td style={{ padding: '6px 10px', fontSize: '11px', color: '#0f172a' }}>{inspection.aqlStandard || 'MIL-STD-105E Level II (AQL 0.65)'}</td>
                <td style={{ padding: '6px 10px', fontSize: '11px', color: '#64748b' }}>Lot / Heat # Batch:</td>
                <td style={{ padding: '6px 10px', fontSize: '11px', color: '#0f172a' }}>{inspection.grnId?.batchNumber || 'LOT-2026-INW'}</td>
              </tr>
            </tbody>
          </table>

          {/* Tri-Disposition Breakdown Table */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: '6px' }}>
              Verification & Tri-Disposition Results
            </div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #cbd5e1'
            }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '6px 10px', fontSize: '11px', textAlign: 'left', color: '#475569' }}>Disposition Metric</th>
                  <th style={{ padding: '6px 10px', fontSize: '11px', textAlign: 'right', color: '#475569' }}>Quantity ({matUom})</th>
                  <th style={{ padding: '6px 10px', fontSize: '11px', textAlign: 'right', color: '#475569' }}>Proportion %</th>
                  <th style={{ padding: '6px 10px', fontSize: '11px', textAlign: 'left', color: '#475569' }}>Store Routing Action</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>Total Consignment Received</td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 700, textAlign: 'right', color: '#0f172a' }}>{totalLot}</td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', textAlign: 'right', color: '#64748b' }}>100.0%</td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', color: '#64748b' }}>Inward Gate Staging</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(16, 185, 129, 0.04)' }}>
                  <td style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 600, color: '#047857' }}>
                    Accepted (Good Quality)
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 700, textAlign: 'right', color: '#047857' }}>
                    {accepted}
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', textAlign: 'right', fontWeight: 600, color: '#047857' }}>
                    {passPct}%
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', color: '#047857', fontWeight: 500 }}>
                    Move to Main Stores / Bin Placement
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: rejected > 0 ? 'rgba(239, 68, 68, 0.04)' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 600, color: rejected > 0 ? '#b91c1c' : '#64748b' }}>
                    Rejected (Non-Conforming)
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 700, textAlign: 'right', color: rejected > 0 ? '#b91c1c' : '#64748b' }}>
                    {rejected}
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', textAlign: 'right', color: rejected > 0 ? '#b91c1c' : '#64748b' }}>
                    {totalLot > 0 ? ((rejected / totalLot) * 100).toFixed(1) : '0.0'}% ({ppm} PPM)
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', color: rejected > 0 ? '#b91c1c' : '#64748b' }}>
                    {rejected > 0 ? 'RTV Segregation / Debit Note Due' : 'None'}
                  </td>
                </tr>
                <tr style={{ background: hold > 0 ? 'rgba(245, 158, 11, 0.04)' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 600, color: hold > 0 ? '#b45309' : '#64748b' }}>
                    On Hold (MRB Review)
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 700, textAlign: 'right', color: hold > 0 ? '#b45309' : '#64748b' }}>
                    {hold}
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', textAlign: 'right', color: hold > 0 ? '#b45309' : '#64748b' }}>
                    {totalLot > 0 ? ((hold / totalLot) * 100).toFixed(1) : '0.0'}%
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '11px', color: hold > 0 ? '#b45309' : '#64748b' }}>
                    {hold > 0 ? 'Yellow Quarantine Bin Staging' : 'None'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Disposition Verdict Banner */}
          <div style={{
            background: verdictBg,
            border: `1px solid ${verdictColor}`,
            borderRadius: '6px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Official Disposition Verdict</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: verdictColor, marginTop: '2px' }}>
                {verdictTitle}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
              <div>Sampling Tested: <strong>{inspection.sampleSize || Math.min(125, totalLot)} units</strong></div>
              <div>Defect Class: <strong>{inspection.defectCategory || 'None'}</strong></div>
            </div>
          </div>

          {/* Defect Analysis & Observations */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '28px',
            background: '#ffffff'
          }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
              Inspector Quality Notes & Technical Observations
            </div>
            <div style={{ fontSize: '11px', color: '#1e293b', minHeight: '32px' }}>
              {inspection.remarks || '100% Visual and dimensional sampling verified against engineering drawing tolerances. Material satisfies inward hardness and metallurgical acceptance criteria.'}
            </div>
          </div>

          {/* Three-Tier Official Signatures */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            paddingTop: '16px',
            borderTop: '1px dashed #cbd5e1'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '36px' }}></div>
              <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px', fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>
                {inspection.inspectorName || 'RQA Inspector 1'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Receiving Quality Inspector</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '36px' }}></div>
              <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px', fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>
                QA Lab Head / Manager
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Quality Assurance Manager</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '36px' }}></div>
              <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px', fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>
                Stores In-Charge
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Material Custody Acceptance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionPrintModal;
