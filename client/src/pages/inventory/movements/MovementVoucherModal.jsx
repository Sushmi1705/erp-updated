import React from 'react';
import { X, Printer, ShieldCheck, FileText, CheckCircle2, Factory, Warehouse } from 'lucide-react';

const MovementVoucherModal = ({
  isOpen,
  onClose,
  transaction
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const txnDate = transaction.Txn_Date || transaction.createdAt || new Date();
  const formattedDate = new Date(txnDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = new Date(txnDate).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
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
          maxWidth: '860px',
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
            <FileText size={18} color="#60a5fa" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              Material Issue Note (MIN) & Internal Transfer Docket
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
                backgroundColor: '#2563eb',
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

        {/* Printable Voucher Body */}
        <div style={{ padding: '32px 40px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff', color: '#0f172a' }}>
          {/* Header & Letterhead */}
          <div style={{ borderBottom: '2px solid #1e3a8a', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
                PRECISION AUTO COMPONENTS PVT. LTD.
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Plant 1 • Sector 7 Industrial Area • IATF 16949:2016 Certified Internal Stores
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '10px' }}>
                MATERIAL ISSUE NOTE & INTERNAL TRANSFER DOCKET (MIN)
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
              <div><strong>Docket No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>{transaction.Txn_Number}</span></div>
              <div><strong>Date & Time:</strong> {formattedDate}, {formattedTime}</div>
              <div><strong>Category:</strong> {transaction.Txn_Type}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#059669', fontWeight: 600 }}>
                <ShieldCheck size={14} />
                <span>Status: {transaction.Status || 'Executed'}</span>
              </div>
            </div>
          </div>

          {/* Logistics Reference Box */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Reference Document</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {transaction.Ref_Doc_Number ? `${transaction.Ref_Doc_Type}: ${transaction.Ref_Doc_Number}` : 'Standalone Store Move'}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Movement Type</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e40af', marginTop: '2px' }}>
                {transaction.Txn_Type}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Total Line Valuation</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                {formatCurrency(transaction.totalValuation)}
              </div>
            </div>
          </div>

          {/* Lines Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1', textTransform: 'uppercase', color: '#475569' }}>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>Part Description</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>Part Code</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Quantity</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>From Store</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>To Store / Line</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>Batch / Heat Lot</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Valuation</th>
              </tr>
            </thead>
            <tbody>
              {transaction.lines && transaction.lines.length > 0 ? (
                transaction.lines.map((line, idx) => (
                  <tr key={line._id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 6px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 8px', fontWeight: 600, color: '#0f172a' }}>
                      {line.Material_ID?.name || 'Raw Material Item'}
                      {line.Material_ID?.grade && <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '4px' }}>({line.Material_ID.grade})</span>}
                    </td>
                    <td style={{ padding: '8px 8px', fontFamily: 'monospace', color: '#475569' }}>{line.Material_ID?.code || 'MAT-00X'}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {line.Quantity.toLocaleString()} {line.uom || 'KG'}
                    </td>
                    <td style={{ padding: '8px 8px', color: '#475569' }}>{line.Source_WH_ID?.name || 'Central Raw Materials Warehouse'}</td>
                    <td style={{ padding: '8px 8px', color: '#475569' }}>
                      {transaction.Txn_Type === 'Material Issue' ? 'Shopfloor Stamping Line #1' : (line.Dest_WH_ID?.name || 'N/A')}
                    </td>
                    <td style={{ padding: '8px 8px', fontFamily: 'monospace', color: '#059669', fontWeight: 600 }}>
                      {line.batches && line.batches.length > 0 ? line.batches.map(b => b.Batch_Lot_Number).join(', ') : 'BATCH-2026-AUT'}
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      {formatCurrency(line.valuation)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                    Standard stock movement logged in master ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Three-Tier Sign-off Verification Section */}
          <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', fontSize: '11px' }}>
            <div>
              <div style={{ color: '#64748b', marginBottom: '32px' }}>Issued & Dispatched By:</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                Store Keeper / Material Issuer
              </div>
              <div style={{ color: '#64748b' }}>Date: {formattedDate}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', marginBottom: '32px' }}>Received & Verified By:</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                Shopfloor Lead / Line Supervisor
              </div>
              <div style={{ color: '#64748b' }}>Date: {formattedDate}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', marginBottom: '32px' }}>Security / Gate Outward Stamp:</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                Plant Security Outward Gate Pass
              </div>
              <div style={{ color: '#64748b' }}>Time: {formattedTime}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementVoucherModal;
