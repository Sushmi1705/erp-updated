import React from 'react';
import { 
  Printer, 
  X, 
  ShieldCheck, 
  FileText, 
  Barcode, 
  QrCode, 
  CheckCircle2, 
  Cpu, 
  Flame, 
  Layers 
} from 'lucide-react';

const WOOfficialTravelerModal = ({ isOpen, onClose, workOrder }) => {
  if (!isOpen || !workOrder) return null;

  const detail = workOrder.details?.[0] || {};
  const targetQty = Number(detail.Target_Quantity) || 1000;
  const producedQty = Number(detail.Produced_Quantity) || 0;
  const scrappedQty = Number(detail.Scrapped_Quantity) || 0;
  const matName = detail.Material_ID?.name || 'Automotive Component';
  const matCode = detail.Material_ID?.code || 'MAT-AUTO';
  const matGrade = detail.Material_ID?.grade || 'IS 513 CR4 Standard';

  const handlePrint = () => {
    window.print();
  };

  const routingSteps = [
    {
      seq: 'OP 10',
      opName: 'Coil Slitting & Blanking',
      wc: 'WC-BLANK-01 (Shear/Decoiler)',
      spec: 'Tolerance ±0.2mm, Burr < 0.05mm',
      setupSign: 'M. Selvam (Setup)',
      qcStamp: 'QC-STAMP #04',
      status: producedQty > 0 ? 'Passed' : 'Pending'
    },
    {
      seq: 'OP 20',
      opName: 'Progressive Stamping & Piercing',
      wc: 'WC-PRESS-250T (Bay 1)',
      spec: 'Die Shut Height 450mm, Tonnage 210T',
      setupSign: 'R. Rajesh (Tooling)',
      qcStamp: 'QC-STAMP #09',
      status: producedQty > 0 ? 'Passed' : 'Pending'
    },
    {
      seq: 'OP 30',
      opName: 'Deep Draw & Edge Flanging',
      wc: 'WC-PRESS-150T (Bay 2)',
      spec: 'Draw Depth 38.5mm, Wall thinning < 12%',
      setupSign: 'K. Murugan (Press)',
      qcStamp: 'QC-STAMP #12',
      status: producedQty >= targetQty * 0.5 ? 'Passed' : (producedQty > 0 ? 'Active' : 'Pending')
    },
    {
      seq: 'OP 40',
      opName: 'Robotic MIG Weld Sub-Assembly',
      wc: 'WC-WELD-ROBOT (Bay 3)',
      spec: 'Weld Penetration > 85%, Zero Spatter',
      setupSign: 'P. Arumugam (Robotics)',
      qcStamp: 'NDT-WELD-OK',
      status: producedQty >= targetQty * 0.75 ? 'Passed' : 'Pending'
    },
    {
      seq: 'OP 50',
      opName: 'Cathodic Electro-Coat (CED)',
      wc: 'WC-SURFACE-CED (Tank 4)',
      spec: 'Coating Thickness 18-22μm, 720h Salt Spray',
      setupSign: 'V. Sundar (Chemical)',
      qcStamp: 'COAT-PASS',
      status: producedQty >= targetQty ? 'Passed' : 'Pending'
    },
    {
      seq: 'OP 60',
      opName: '100% CMM & Gauging Final QC',
      wc: 'WC-QA-LAB (CMM Station)',
      spec: '100% Critical Dimension Inspection',
      setupSign: 'S. Nathan (QA Head)',
      qcStamp: 'IATF-FINAL-CERT',
      status: workOrder.Status === 'Completed' || workOrder.Status === 'Closed' ? 'Certified' : 'Pending'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '92vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Top Bar */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#d97706" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Official Shop Floor Traveler Sheet — IATF 16949 / ISO 9001
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(217, 119, 6, 0.3)'
              }}
            >
              <Printer size={14} /> Print Traveler
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Sheet Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {/* Traveler Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                PRECISION AUTO COMPONENTS PVT LTD
              </div>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                Automotive Division — Plant 1 (Hosur Industrial Complex, Tamil Nadu)
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                IATF 16949:2016 Certified Tier-1 OEM Supplier • Document: LBAP-SOP-PROD-TRV-09
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{
                border: '2px solid #0f172a',
                padding: '4px 10px',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.08em',
                fontFamily: 'monospace',
                backgroundColor: '#f8fafc'
              }}>
                {workOrder.WO_Number}
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#0f172a', marginTop: '4px' }}>
                ||| | ||||| |||| ||| ||||| |||||||
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                Issued: {new Date(workOrder.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Specifications Matrix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '11px'
          }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Component / Part</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{matName}</div>
              <div style={{ fontFamily: 'monospace', color: '#0284c7', fontWeight: 600 }}>{matCode}</div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Raw Material Grade</span>
              <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{matGrade}</div>
              <div style={{ color: '#64748b', fontSize: '10px' }}>Heat Lot: HT-2026-X81</div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Order Target / Actual</span>
              <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px', fontFamily: 'monospace', fontSize: '13px' }}>
                {targetQty.toLocaleString()} pcs
              </div>
              <div style={{ color: producedQty >= targetQty ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                Made: {producedQty.toLocaleString()} • Scrap: {scrappedQty}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Master Plan & Status</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {workOrder.Source_Plan_ID?.Plan_Number || 'PP-2026-01'}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                marginTop: '2px',
                backgroundColor: workOrder.Status === 'Completed' ? '#dcfce7' : '#fef3c7',
                color: workOrder.Status === 'Completed' ? '#166534' : '#92400e'
              }}>
                {workOrder.Status} ({workOrder.Material_Status})
              </div>
            </div>
          </div>

          {/* Operation Routing Table */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#0f172a',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={14} color="#0284c7" />
              Shop Floor Manufacturing Routing & Quality Checkpoints
            </div>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              border: '1px solid #cbd5e1'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', color: '#1e293b', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1', width: '55px' }}>Op</th>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1' }}>Process Description</th>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1' }}>Work Center / Tool</th>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1' }}>Key Parameters</th>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1' }}>Tool Setter</th>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1', width: '90px' }}>QA Verification</th>
                </tr>
              </thead>
              <tbody>
                {routingSteps.map((step, idx) => (
                  <tr key={idx} style={{
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                  }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, fontFamily: 'monospace' }}>
                      {step.seq}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                      {step.opName}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>
                      {step.wc}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b', fontSize: '10px' }}>
                      {step.spec}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: '10px', fontFamily: 'monospace' }}>
                      {step.setupSign}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        backgroundColor: step.status === 'Certified' || step.status === 'Passed' ? '#dcfce7' : (step.status === 'Active' ? '#fef3c7' : '#f1f5f9'),
                        color: step.status === 'Certified' || step.status === 'Passed' ? '#166534' : (step.status === 'Active' ? '#92400e' : '#64748b'),
                        border: '1px solid currentColor'
                      }}>
                        {step.qcStamp}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Traceability Signatures Footer */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            borderTop: '2px solid #0f172a',
            paddingTop: '16px',
            marginTop: '20px'
          }}>
            <div style={{ border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                1. Production Supervisor
              </div>
              <div style={{ height: '35px', borderBottom: '1px solid #94a3b8', margin: '4px 0' }} />
              <div style={{ fontSize: '10px', color: '#334155' }}>Signature & Date Stamp</div>
            </div>

            <div style={{ border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                2. Quality Assurance Inspector
              </div>
              <div style={{ height: '35px', borderBottom: '1px solid #94a3b8', margin: '4px 0' }} />
              <div style={{ fontSize: '10px', color: '#334155' }}>CMM Inspection Acceptance Stamp</div>
            </div>

            <div style={{ border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                3. Finished Goods Warehouse Store
              </div>
              <div style={{ height: '35px', borderBottom: '1px solid #94a3b8', margin: '4px 0' }} />
              <div style={{ fontSize: '10px', color: '#334155' }}>Bin Putaway Receipt & QR Scan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WOOfficialTravelerModal;
