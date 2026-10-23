import React from 'react';
import { Printer, X, Truck, Package, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

const GrnPrintModal = ({
  grn,
  onClose
}) => {
  if (!grn) return null;

  const po = grn.purchaseOrderId || {};
  const vendor = grn.vendorId || {};
  const material = grn.materialId || {};

  const poQty = grn.poQuantity || 0;
  const recQty = grn.receivedQuantity || 0;
  const isShortSupply = recQty < poQty && grn.status !== 'Cancelled';
  const shortage = Math.max(0, poQty - recQty);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          background: '#ffffff',
          color: '#1e293b',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Bar (Non-printable) */}
        <div 
          className="no-print"
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#0284c7" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              Goods Receipt Note (GRN) Print Preview
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div 
          id="printable-grn-slip"
          style={{
            padding: '36px 40px',
            overflowY: 'auto',
            flex: 1,
            fontSize: '12px',
            lineHeight: 1.5,
            color: '#0f172a'
          }}
        >
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-grn-slip, #printable-grn-slip * {
                visibility: visible;
              }
              #printable-grn-slip {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 15mm !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div style={{
            borderBottom: '2px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                PRECISION AUTO COMPONENTS PVT LTD
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                Plant 1: Sector 58, IMT Faridabad, Haryana - 121004 | IATF 16949:2016 Certified
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginTop: '6px' }}>
                GOODS RECEIPT NOTE (GRN) & INWARD GATE ENTRY PASS
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
              <div><strong>GRN Number:</strong> <span style={{ fontSize: '13px', color: '#0284c7' }}>{grn.grnNumber}</span></div>
              <div><strong>Receipt Date:</strong> {grn.receiptDate ? new Date(grn.receiptDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</div>
              <div><strong>Gate Pass #:</strong> {grn.gatePassNo || `GP-${grn.grnNumber?.slice(-4) || '9041'}`}</div>
            </div>
          </div>

          {/* ── Logistics & Supplier Two-Column Box ──────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '11px'
          }}>
            {/* Supplier & PO */}
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px', textTransform: 'uppercase' }}>
                Purchase Contract & Supplier
              </div>
              <div><span style={{ color: '#64748b' }}>Supplier: </span><strong>{vendor.name || 'Supplier N/A'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Vendor Code: </span><strong>{vendor.code || 'VND-001'}</strong></div>
              <div><span style={{ color: '#64748b' }}>GSTIN: </span><strong>{vendor.gstin || '06AABCT1332L1Z4'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Purchase Order #: </span><strong style={{ color: '#0284c7' }}>{po.poNumber || 'PO-2026-2003'}</strong></div>
            </div>

            {/* Inward Truck Logistics */}
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px', textTransform: 'uppercase' }}>
                Gate & Logistics Details
              </div>
              <div><span style={{ color: '#64748b' }}>Vehicle / Truck #: </span><strong>{grn.vehicleNumber || 'HR-55-AT-4821'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Delivery Challan #: </span><strong>{grn.challanNumber || 'CH-VERIFIED'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Transporter: </span><strong>{grn.transporterName || 'Dedicated Freight'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Unloading Bay: </span><strong>{grn.storageLocation || 'Dock A - Raw Material Inward Bay'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Packaging Status: </span><strong>{grn.packagingCondition || 'Good / Intact'}</strong></div>
            </div>
          </div>

          {/* ── Material & Quantity Verification Table ───────────────────────── */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase' }}>
              Material Verification & Inward Count
            </div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #cbd5e1',
              fontSize: '11px'
            }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Item Description</th>
                  <th style={{ padding: '8px 10px' }}>Item Code</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>PO Ordered Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Gate Received Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Variance / Shortage</th>
                  <th style={{ padding: '8px 10px' }}>QA Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{material.name || 'Raw Material Coil / Sheet'}</td>
                  <td style={{ padding: '10px' }}>{material.code || 'MAT-001'}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{poQty.toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: isShortSupply ? '#d97706' : '#0f172a' }}>
                    {recQty.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    {isShortSupply ? (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>-{shortage.toLocaleString()} (Short)</span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 600 }}>Exact Match</span>
                    )}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      fontWeight: 600,
                      color: grn.status === 'Posted' ? '#059669' : grn.status === 'Inspecting' ? '#d97706' : '#0284c7'
                    }}>
                      {grn.status === 'Posted' ? 'Passed Quality' : grn.status === 'Inspecting' ? 'Under Inspection' : 'Awaiting Inspection'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Storekeeper Gate Observations ───────────────────────────────── */}
          <div style={{
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '24px',
            fontSize: '11px',
            background: '#ffffff'
          }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
              Storekeeper Inward Remarks / Damage Assessment:
            </div>
            <div style={{ color: '#475569' }}>
              {grn.notes || 'Material received in physically sound condition without visible exterior container damage. Routed to Receiving Quality Assurance (RQA) for sampling inspection.'}
            </div>
          </div>

          {/* ── Three Signature Approval Blocks ─────────────────────────────── */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>
              Gate Clearance & Inward Verification Sign-Off
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              fontSize: '10px'
            }}>
              {[
                { title: 'Inward Storekeeper / Gate Clerk', role: 'Material Received By' },
                { title: 'Receiving Quality Inspector (RQA)', role: 'Quality Cleared By' },
                { title: 'Factory Security In-Charge', role: 'Gate Inward Verified' }
              ].map((sig, idx) => (
                <div key={idx} style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '10px',
                  height: '75px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#f8fafc'
                }}>
                  <div style={{ color: '#64748b' }}>{sig.role}:</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{sig.title}</div>
                    <div style={{ borderTop: '1px dashed #94a3b8', marginTop: '4px', paddingTop: '2px', color: '#94a3b8' }}>
                      Sign & Official Stamp
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrnPrintModal;
