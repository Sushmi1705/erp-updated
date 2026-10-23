import React from 'react';
import {
  DollarSign, Plus, Edit2, Trash2, Receipt, Percent,
  TrendingDown, Truck, ShieldCheck, Tag
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

export const QuotationFinancialsTab = ({
  selectedRevision,
  financials = [],
  onOpenAddFinancialModal,
  onOpenEditFinancialModal,
  onDeleteFinancial
}) => {
  const isLocked = selectedRevision?.isLocked || ['Approved', 'Sent to Customer', 'Accepted'].includes(selectedRevision?.status);

  const getEntryBadge = (type) => {
    switch (type) {
      case 'Tax':
        return { icon: Receipt, color: '#0077b6', bg: 'rgba(0, 180, 216, 0.12)' };
      case 'Discount':
        return { icon: TrendingDown, color: '#059669', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'Shipping':
        return { icon: Truck, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' };
      case 'Surcharge':
        return { icon: Tag, color: '#d97706', bg: 'rgba(245, 158, 11, 0.12)' };
      default:
        return { icon: DollarSign, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' };
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '3fr 2fr',
      gap: 14
    }}>
      {/* ── LEFT: FINANCIAL ENTRIES TABLE ───────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {/* Strip Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'var(--surface-canvas)',
          borderRadius: 8,
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              GST Taxes, Freight & Commercial Adjustments
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Define statutory GST taxes, bulk discounts, handling fees, or shipping surcharges.
            </div>
          </div>

          {!isLocked && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenAddFinancialModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 12px'
              }}
            >
              <Plus size={14} /> Add Adjustment
            </button>
          )}
        </div>

        {/* Entries Table */}
        <div style={{
          background: 'var(--surface-canvas)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {financials.length === 0 ? (
            <div style={{
              padding: '32px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
                No taxes or adjustments configured for this revision yet.
              </p>
              {!isLocked && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onOpenAddFinancialModal}
                  style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}
                >
                  <Plus size={13} /> Add GST or Freight
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: 12
              }}>
                <thead>
                  <tr style={{
                    background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'uppercase'
                  }}>
                    <th style={{ padding: '10px 14px' }}>Type</th>
                    <th style={{ padding: '10px 14px' }}>Applies To</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Rate %</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount (₹)</th>
                    {!isLocked && <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {financials.map((entry, idx) => {
                    const badge = getEntryBadge(entry.entryType);
                    const Icon = badge.icon;

                    return (
                      <tr key={entry._id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color
                          }}>
                            <Icon size={12} />
                            <span>{entry.entryType}</span>
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {entry.quoteLineId ? 'Specific Line' : 'Entire Proposal'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>
                          {entry.ratePercentage ? `${entry.ratePercentage}%` : '—'}
                        </td>
                        <td style={{
                          padding: '10px 14px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: entry.entryType === 'Discount' ? '#059669' : 'var(--text-primary)'
                        }}>
                          {entry.entryType === 'Discount' ? '-' : '+'}{fmtMoneyFull(entry.calculatedAmount || 0)}
                        </td>
                        {!isLocked && (
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                              <button
                                type="button"
                                title="Edit adjustment"
                                onClick={() => onOpenEditFinancialModal(entry)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 3 }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                title="Delete adjustment"
                                onClick={() => onDeleteFinancial(entry._id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: 3 }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: SUMMARY COMMERCIAL CARD ──────────────────────────────── */}
      <div style={{
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        alignSelf: 'start'
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
          Commercial Financial Summary
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Subtotal (Pre-Tax):</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
              {fmtMoneyFull(selectedRevision?.subTotal || 0)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
            <span>Total Commercial Discounts:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              - {fmtMoneyFull(selectedRevision?.totalDiscountAmount || 0)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0077b6' }}>
            <span>Statutory Taxes (GST):</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              + {fmtMoneyFull(selectedRevision?.totalTaxAmount || 0)}
            </span>
          </div>

          <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Total Payable (INR):
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#b45309', fontFamily: 'monospace' }}>
              {fmtMoneyFull(selectedRevision?.grandTotal || 0)}
            </span>
          </div>
        </div>

        <div style={{
          padding: '10px 12px',
          background: 'var(--bg-secondary)',
          borderRadius: 6,
          border: '1px solid var(--border-color)',
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.4
        }}>
          <strong>GST & Indian Taxation Notice:</strong> Applicable taxes adhere to precision automotive component schedules. All quotes are subjected to standard credit evaluation and delivery milestones.
        </div>
      </div>
    </div>
  );
};

export default QuotationFinancialsTab;
