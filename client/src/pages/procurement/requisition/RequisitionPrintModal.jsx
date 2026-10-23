import React from 'react';
import { Printer, X, ShieldCheck, CheckSquare, Building2, Package } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import { fmtMoneyFull } from '../../../utils/money';

const RequisitionPrintModal = ({
  isOpen,
  onClose,
  requisition,
  allRequisitions = []
}) => {
  const selectedPR = requisition || allRequisitions[0];

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  if (!selectedPR) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Purchase Requisition Voucher"
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
            Official internal requisition voucher for stores, department authorization, and audit logs.
          </span>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: '#0d9488',
              color: '#ffffff',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Printer size={14} /> Print Voucher
          </button>
        </div>

        {/* Printable Document Box */}
        <div id="printable-pr-voucher" style={{
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
                Plant Commercial & Stores Division • Chennai Manufacturing Facility
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                Internal Material Requisition & Authorization Voucher (IATF 16949 Compliant)
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                background: '#0d9488',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                MATERIAL REQUISITION
              </div>
              <div style={{ fontSize: '12px', color: '#0f172a', marginTop: '4px', fontWeight: 700 }}>
                {selectedPR.prNumber}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                Date: {currentDate}
              </div>
            </div>
          </div>

          {/* Department & Cost Center Meta */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '11px'
          }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Cost Center / Department:</span>
              <strong style={{ color: '#0f172a', fontSize: '12px' }}>
                {selectedPR.costCenterId?.name || 'Manufacturing Operations'}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Authorization Status:</span>
              <strong style={{ color: '#0d9488', fontSize: '12px' }}>
                {selectedPR.status?.replace(/_/g, ' ')}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Gross Expenditure:</span>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                {fmtMoneyFull(selectedPR.totalValue || 0)}
              </strong>
            </div>
          </div>

          {/* Table of Requisitioned Line Items */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            marginBottom: '20px'
          }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #94a3b8' }}>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>#</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Item Description / Material Code</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Suggested Vendor</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Required By</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>Quantity</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>Est. Rate (₹)</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>Line Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {(!selectedPR.items || selectedPR.items.length === 0) ? (
                <tr>
                  <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No items in this requisition.
                  </td>
                </tr>
              ) : (
                selectedPR.items.map((item, idx) => (
                  <tr key={item._id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1' }}>
                      <strong style={{ color: '#0f172a' }}>{item.itemId?.name || item.freeTextDesc}</strong>
                      {item.itemId?.code && <div style={{ fontSize: '9px', color: '#64748b' }}>Code: {item.itemId.code}</div>}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1' }}>
                      {item.supplierId?.name || 'Open Sourcing / RFQ'}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      {new Date(item.requiredDate).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700 }}>
                      {item.qty}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                      {fmtMoneyFull(item.unitPrice)}
                    </td>
                    <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700 }}>
                      {fmtMoneyFull(item.qty * item.unitPrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                <td colSpan="6" style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                  TOTAL ESTIMATED EXPENDITURE:
                </td>
                <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#0d9488', fontSize: '12px' }}>
                  {fmtMoneyFull(selectedPR.totalValue || 0)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures & Multi-Tier Matrix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '14px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px dashed #94a3b8',
            fontSize: '10px',
            color: '#334155'
          }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '22px' }}>1. Requisitioner:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>Plant Stores / User</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: '22px' }}>2. Department Manager:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>HOD Technical Approval</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: '22px' }}>3. Plant Commercial Dir:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>Operations Authorization</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: '22px' }}>4. Chief Financial Officer:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>Budget Gatekeeper (&gt; ₹10k)</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RequisitionPrintModal;
