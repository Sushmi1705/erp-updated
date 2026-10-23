import React from 'react';
import { X, Printer, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import { fmtMoney, fmtMoneyFull, fmtQty } from '../../../utils/money';

const ValuationCertificateModal = ({
  isOpen,
  onClose,
  summary = {},
  categories = [],
  profiles = []
}) => {
  if (!isOpen) return null;

  const totalFifo = summary.Total_FIFO_Valuation || 0;
  const totalWac = summary.Total_WAC_Valuation || 0;
  const totalStd = summary.Total_Standard_Valuation || 0;
  const netVariance = summary.Net_Valuation_Variance || (totalFifo - totalStd);

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
        maxWidth: '850px',
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
            <ShieldCheck size={16} color="#059669" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Statutory Inventory Valuation Schedule (Ind AS 2 / IATF 16949)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={13} /> Print Certificate
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

        {/* Printable Certificate Document Content */}
        <div style={{
          padding: '28px 36px',
          overflowY: 'auto',
          flex: 1,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {/* Company & Document Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                PRECISION AUTO COMPONENTS PVT. LTD.
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                Plant 1: Plot 42-45, GIDC Sanand Industrial Estate, Ahmedabad - 382110
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                CIN: U29253GJ2012PTC071234 • IATF 16949:2016 Certified Tier-1 Automotive Manufacturer
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#047857',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '3px 8px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                STATUTORY AUDIT SCHEDULE
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                Doc Ref: PAC/VAL/AUDIT/2026-M10
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                As-at Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Certificate Title */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Schedule of Stores & Inventory Valuation
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Prepared in compliance with Indian Accounting Standard (Ind AS) 2: Inventories and Schedule III of the Companies Act, 2013
            </p>
          </div>

          {/* Key Totals Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '20px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Balance Sheet FIFO Value</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#047857', marginTop: '3px' }}>
                {fmtMoneyFull(totalFifo)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>WAC Blended Equivalent</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb', marginTop: '3px' }}>
                {fmtMoneyFull(totalWac)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Standard Cost Benchmark</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#475569', marginTop: '3px' }}>
                {fmtMoneyFull(totalStd)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Net Holding Variance</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: netVariance >= 0 ? '#047857' : '#d97706', marginTop: '3px' }}>
                {netVariance >= 0 ? '+' : ''}{fmtMoneyFull(netVariance)}
              </div>
            </div>
          </div>

          {/* Statutory Disclosure Note */}
          <div style={{
            fontSize: '11px',
            color: '#475569',
            lineHeight: '1.45',
            background: '#f1f5f9',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '20px',
            borderLeft: '3px solid #059669'
          }}>
            <strong>Accounting Policy Disclosure (Note 1):</strong> Inventories of Raw Materials, Consumables, and Purchased Components are valued at the lower of cost and net realizable value. Cost is computed on a First-in, First-out (FIFO) basis derived from actual purchase tax invoices and goods receipt vouchers. Stores receipts without active batches are verified against master standard rates.
          </div>

          {/* Category Breakdown Table */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase' }}>
              Annexure A: Inventory Breakdown by Asset Class
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Asset Class / Category</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>SKU Count</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Physical Volume</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Standard Cost Total</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>FIFO Asset Total</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Share of Total</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.categoryName} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{cat.categoryName}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{cat.materialCount}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtQty(cat.totalQty)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtMoneyFull(cat.standardValue)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#047857' }}>{fmtMoneyFull(cat.fifoValue)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{cat.sharePct ? `${cat.sharePct}%` : '0%'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #0f172a', fontWeight: 800 }}>
                  <td style={{ padding: '10px 10px' }}>Total Stores Inventory</td>
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>{profiles.length}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right' }}>{fmtQty(profiles.reduce((s, p) => s + p.onHand, 0))}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right' }}>{fmtMoneyFull(totalStd)}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#047857' }}>{fmtMoneyFull(totalFifo)}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right' }}>100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Verification & Sign-off Blocks */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            marginTop: '36px',
            paddingTop: '20px',
            borderTop: '1px solid #cbd5e1'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px', borderBottom: '1px dashed #94a3b8', marginBottom: '8px' }} />
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Stores In-Charge</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Physical Count & Batch Verification</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px', borderBottom: '1px dashed #94a3b8', marginBottom: '8px' }} />
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Cost Accountant</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>FIFO Layer & Rate Reconciliation</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px', borderBottom: '1px dashed #94a3b8', marginBottom: '8px' }} />
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Chief Financial Officer</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Statutory Audit Approval</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuationCertificateModal;
