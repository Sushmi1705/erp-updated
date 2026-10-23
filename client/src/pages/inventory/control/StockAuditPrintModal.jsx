import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck, FileText } from 'lucide-react';

const StockAuditPrintModal = ({
  isOpen,
  onClose,
  inventoryData = [],
  activeTabLabel = 'Raw Material',
  summaryStats = {}
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1060,
        padding: '20px'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          color: '#1e293b',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Top Control Bar (Hidden when printed) */}
        <div 
          className="no-print"
          style={{
            padding: '14px 20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#34d399" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              IATF 16949 Physical Stock Balance & Store Audit Sheet
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div style={{ padding: '32px 40px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff', color: '#0f172a' }}>
          {/* Company Letterhead */}
          <div style={{ borderBottom: '2px solid #065f46', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#065f46', letterSpacing: '-0.02em' }}>
                PRECISION AUTO COMPONENTS PVT. LTD.
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Plant 1 • Sector 7 Industrial Area • IATF 16949:2016 Certified Automotive Stores
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '10px' }}>
                PHYSICAL INVENTORY AUDIT CERTIFICATE & BALANCE SHEET
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
              <div><strong>Audit Date:</strong> {currentDate}</div>
              <div><strong>Category:</strong> {activeTabLabel}</div>
              <div><strong>Document Ref:</strong> PAC-INV-AUDIT-{new Date().getFullYear()}-01</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#059669', fontWeight: 600 }}>
                <ShieldCheck size={14} />
                <span>Verified Active Feed</span>
              </div>
            </div>
          </div>

          {/* Audit Metrics Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Active SKUs</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{summaryStats.totalItems || inventoryData.length}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Total Book Quantity</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{(summaryStats.totalOnHand || 0).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Committed Orders</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#d97706' }}>{(summaryStats.totalAllocated || 0).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Total Book Valuation</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{formatCurrency(summaryStats.totalValuation)}</div>
            </div>
          </div>

          {/* Stock Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1', textTransform: 'uppercase', color: '#475569' }}>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>Item Description</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>Part Code</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>Bay / Store</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Book Stock</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Free ATP</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Standard Cost</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Valuation</th>
                <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px' }}>Physical Count</th>
                <th style={{ padding: '8px 8px', textAlign: 'center', width: '60px' }}>Match?</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((row, idx) => (
                <tr key={row._id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 6px', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '7px 8px', fontWeight: 600, color: '#0f172a' }}>
                    {row.Product_Name}
                    {row.grade && <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '4px' }}>({row.grade})</span>}
                  </td>
                  <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: '#475569' }}>{row.Product_Code}</td>
                  <td style={{ padding: '7px 8px', color: '#475569' }}>{row.Warehouse}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {row.Total_On_Hand.toLocaleString()} {row.uom || 'KG'}
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600, color: row.Exception_Flag ? '#dc2626' : '#059669' }}>
                    {row.Available_to_Promise.toLocaleString()}
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', color: '#475569' }}>
                    ₹{row.standardCost || 0}
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                    {formatCurrency(row.valuation)}
                  </td>
                  {/* Empty Box for Auditor Physical Count */}
                  <td style={{ padding: '7px 8px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                    ____
                  </td>
                  {/* Verification Checkmark Box */}
                  <td style={{ padding: '7px 8px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                    [ &nbsp; ]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Auditor Sign-off Verification Section */}
          <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', fontSize: '11px' }}>
            <div>
              <div style={{ color: '#64748b', marginBottom: '32px' }}>Counted & Prepared By:</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                Store Keeper / Material Lead
              </div>
              <div style={{ color: '#64748b' }}>Date: {currentDate}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', marginBottom: '32px' }}>Physically Audited By:</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                Internal Quality Auditor (IATF 16949)
              </div>
              <div style={{ color: '#64748b' }}>Date: {currentDate}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', marginBottom: '32px' }}>Approved By:</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                Plant Manager / Materials Controller
              </div>
              <div style={{ color: '#64748b' }}>Date: {currentDate}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAuditPrintModal;
