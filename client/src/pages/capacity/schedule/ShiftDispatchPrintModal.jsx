import React from 'react';
import { Printer, X, CheckSquare, Factory, ShieldCheck } from 'lucide-react';
import Modal from '../../../components/common/Modal';

const ShiftDispatchPrintModal = ({
  isOpen,
  onClose,
  schedules = [],
  activeTab = 'Daily'
}) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shop Floor Shift Dispatch & Job Card Run Sheet"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Print Action Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Print-ready dispatch schedule for work center supervisor and machine operators.
          </span>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Printer size={14} /> Print Run Sheet
          </button>
        </div>

        {/* Printable Document Box */}
        <div id="printable-shift-sheet" style={{
          background: '#ffffff',
          color: '#0f172a',
          padding: '24px',
          borderRadius: '8px',
          border: '2px solid #cbd5e1',
          fontFamily: 'Inter, sans-serif'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '16px',
            borderBottom: '2px solid #0f172a',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                PRECISION AUTO COMPONENTS PVT LTD
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                Tier-1 Automotive Press & Assembly Plant • Chennai Facility
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                ISO/IATF 16949 Certified Quality Management System
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                background: '#0f172a',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                DISPATCH RUN SHEET
              </div>
              <div style={{ fontSize: '11px', color: '#334155', marginTop: '4px', fontWeight: 600 }}>
                Date: {currentDate}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                Doc Series: PAC-MES-DSP-{new Date().getFullYear()}
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            marginBottom: '20px'
          }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #94a3b8' }}>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Seq</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Work Center</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Product / Part Description</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Die / Tool ID</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Shift</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>Target Qty</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>WO Ref</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Actual / OK</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Reject</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Sign</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No jobs currently scheduled on this sheet.
                  </td>
                </tr>
              ) : (
                schedules.map((item, idx) => (
                  <tr key={item._id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>
                      #{item.sequence || (idx + 1) * 10}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1' }}>
                      <strong style={{ color: '#0f172a' }}>{item.assignedWorkCenterId?.name || '-'}</strong>
                      <div style={{ fontSize: '9px', color: '#64748b' }}>{item.assignedWorkCenterId?.code}</div>
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1' }}>
                      <strong style={{ color: '#0f172a' }}>{item.productId?.name || '-'}</strong>
                      <div style={{ fontSize: '9px', color: '#64748b' }}>
                        {item.productId?.code} {item.customerReference ? `• [${item.customerReference}]` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600, color: '#4338ca' }}>
                      {item.dieToolId || 'Standard'}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      {item.shift || 'Shift 1'}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700, fontSize: '12px' }}>
                      {item.scheduledQuantity?.toLocaleString()}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px' }}>
                      {item.workOrderNumber || '—'}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      ______
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      ______
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      ______
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Supervisor Sign-Off & Verification Footer */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '20px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px dashed #94a3b8',
            fontSize: '11px',
            color: '#334155'
          }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '24px' }}>Shift In-Charge / Supervisor:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '80%' }}></div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Name & Employee ID</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: '24px' }}>Tool Room / Die Verification:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '80%' }}></div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Die Stroke & Sharpness Check</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: '24px' }}>Production Planning (PPC Manager):</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '80%' }}></div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Dispatch Release Authorization</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShiftDispatchPrintModal;
