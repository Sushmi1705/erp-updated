import React from 'react';
import { X, Printer, ShieldCheck, FileText, CheckCircle2, Scale, BarChart3 } from 'lucide-react';

const ReorderPrintModal = ({
  isOpen,
  onClose,
  profiles = [],
  parameters = {},
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
            <FileText size={18} color="#fde047" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              IATF 16949 Material Replenishment Policy & Safety Buffer Schedule
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
                backgroundColor: '#b45309',
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
          {/* Header & Letterhead */}
          <div style={{ borderBottom: '2px solid #78350f', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#78350f', letterSpacing: '-0.02em' }}>
                PRECISION AUTO COMPONENTS PVT. LTD.
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Plant 1 • Sector 7 Industrial Area • IATF 16949:2016 Certified Material Control
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '10px' }}>
                MATERIAL REPLENISHMENT POLICY & SAFETY STOCK THRESHOLD SCHEDULE
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
              <div><strong>Effective Date:</strong> {currentDate}</div>
              <div><strong>Document Ref:</strong> PAC-INV-ROP-{new Date().getFullYear()}-Q4</div>
              <div><strong>Service Target:</strong> {parameters.Default_Service_Level_Percent || 95}% Service Level</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#059669', fontWeight: 600 }}>
                <ShieldCheck size={14} />
                <span>Status: Approved Policy</span>
              </div>
            </div>
          </div>

          {/* Policy Parameters Box */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px', padding: '12px 16px', backgroundColor: '#fefce8', borderRadius: '8px', border: '1px solid #fef08a', fontSize: '12px' }}>
            <div>
              <div style={{ color: '#854d0e', fontSize: '10px', textTransform: 'uppercase' }}>Class A Target</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#78350f', marginTop: '2px' }}>
                {parameters.ABC_Class_A_Percentage || 70}% Capital Share
              </div>
            </div>
            <div>
              <div style={{ color: '#854d0e', fontSize: '10px', textTransform: 'uppercase' }}>Class B Target</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#78350f', marginTop: '2px' }}>
                {parameters.ABC_Class_B_Percentage || 20}% Capital Share
              </div>
            </div>
            <div>
              <div style={{ color: '#854d0e', fontSize: '10px', textTransform: 'uppercase' }}>Class C Target</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#78350f', marginTop: '2px' }}>
                {parameters.ABC_Class_C_Percentage || 10}% Capital Share
              </div>
            </div>
            <div>
              <div style={{ color: '#854d0e', fontSize: '10px', textTransform: 'uppercase' }}>Dead Stock Cutoff</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#78350f', marginTop: '2px' }}>
                {parameters.Dead_Stock_Threshold_Days || 180} Days Inactive
              </div>
            </div>
          </div>

          {/* Master Replenishment Policy Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1', textTransform: 'uppercase', color: '#475569' }}>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>Material Description</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>Code</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Free ATP</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Reorder Point (ROP)</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Safety Buffer</th>
                <th style={{ padding: '8px 8px', textAlign: 'center' }}>ABC Class</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Std Cost</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>Replenishment Rule</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((row, idx) => {
                const mat = row.Material_ID || {};
                const isReorder = row.isReorderTriggered;

                return (
                  <tr key={row._id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '7px 6px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '7px 8px', fontWeight: 600, color: '#0f172a' }}>
                      {mat.name}
                      {mat.grade && <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '4px' }}>({mat.grade})</span>}
                    </td>
                    <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: '#475569' }}>{mat.code}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: isReorder ? '#dc2626' : '#059669' }}>
                      {(row.atp || 0).toLocaleString()} {row.uom}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {(row.Reorder_Level || 0).toLocaleString()} {row.uom}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600, color: '#78350f' }}>
                      {(row.Safety_Stock || 0).toLocaleString()} {row.uom}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 800 }}>
                      Class {row.ABC_Class || 'C'}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: '#475569' }}>
                      ₹{row.standardCost || 0}
                    </td>
                    <td style={{ padding: '7px 8px', color: '#475569', fontSize: '10px' }}>
                      {row.ABC_Class === 'A' ? 'Weekly JIT Delivery' : row.ABC_Class === 'B' ? 'Fortnightly Batch PO' : 'Quarterly Bulk PO'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Three-Tier Approval Sign-off Blocks */}
          <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', fontSize: '11px' }}>
            <div>
              <div style={{ color: '#64748b', marginBottom: '32px' }}>Policy Formulated By:</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                Stores / Materials Planner
              </div>
              <div style={{ color: '#64748b' }}>Date: {currentDate}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', marginBottom: '32px' }}>Verified & Endorsed By:</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                Head of Procurement & Purchasing
              </div>
              <div style={{ color: '#64748b' }}>Date: {currentDate}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', marginBottom: '32px' }}>Approved By:</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                Plant Manager / Operations Director
              </div>
              <div style={{ color: '#64748b' }}>Date: {currentDate}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReorderPrintModal;
