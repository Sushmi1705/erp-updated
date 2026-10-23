import React, { useState } from 'react';
import {
  Package, Plus, Edit2, Trash2, Eye, EyeOff, Lock,
  AlertTriangle, DollarSign, TrendingUp, ShieldCheck
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

export const QuotationLinesTab = ({
  selectedRevision,
  lines = [],
  onOpenAddLineModal,
  onOpenEditLineModal,
  onDeleteLine
}) => {
  const [showInternalCosts, setShowInternalCosts] = useState(false);
  const isLocked = selectedRevision?.isLocked || ['Approved', 'Sent to Customer', 'Accepted'].includes(selectedRevision?.status);

  // Aggregates
  const totalQty = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
  const totalSubtotal = lines.reduce((acc, l) => acc + (Number(l.lineTotal) || 0), 0);
  const lowMarginLines = lines.filter(l => l.isBelowMarginThreshold);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── METRICS & ACTION STRIP ─────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)'
      }}>
        {/* Left: Summary Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              background: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={17} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Quoted Line Items
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                {lines.length} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>item{lines.length !== 1 ? 's' : ''} ({totalQty.toLocaleString()} units)</span>
              </div>
            </div>
          </div>

          <div style={{ height: 26, width: 1, background: 'var(--border-color)' }} />

          <div>
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Subtotal (Pre-Tax)
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
              {fmtMoneyFull(selectedRevision?.subTotal ?? totalSubtotal)}
            </div>
          </div>

          {lowMarginLines.length > 0 && (
            <>
              <div style={{ height: 26, width: 1, background: 'var(--border-color)' }} />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#d97706',
                fontSize: 11,
                fontWeight: 700
              }}>
                <AlertTriangle size={13} />
                <span>{lowMarginLines.length} Low Profit Line{lowMarginLines.length !== 1 ? 's' : ''} (&lt;15%)</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Eye Toggle for Confidential Costs & Add Line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowInternalCosts(!showInternalCosts)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 10px',
              borderRadius: 6,
              background: showInternalCosts ? 'rgba(0, 180, 216, 0.12)' : 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: showInternalCosts ? '#0077b6' : 'var(--text-secondary)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Toggle visibility of internal manufactured cost (never shown to customer)"
          >
            {showInternalCosts ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>{showInternalCosts ? 'Hide Internal Cost' : 'Show Internal Cost'}</span>
          </button>

          {!isLocked && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenAddLineModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 14px'
              }}
            >
              <Plus size={14} /> Add Quoted Line
            </button>
          )}
        </div>
      </div>

      {/* ── LINES TABLE ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {lines.length === 0 ? (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: 'rgba(245, 158, 11, 0.09)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={24} color="#d97706" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              No Quoted Line Items in this Version
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 440, margin: 0 }}>
              Add manufactured parts, custom components, tooling/mold fabrication costs, or NRE engineering charges to build this quotation version.
            </p>
            {!isLocked && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenAddLineModal}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}
              >
                <Plus size={13} /> Add First Line Item
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
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '10px 14px' }}>Charge Type</th>
                  <th style={{ padding: '10px 14px' }}>Product / Description</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Qty</th>
                  {showInternalCosts && (
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: '#94a3b8' }}>
                      Unit Cost (Internal)
                    </th>
                  )}
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Quoted Unit Price</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Discount %</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Line Total</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Profit Margin</th>
                  {!isLocked && <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const marginPct = line.grossMarginPct;
                  const isLowMargin = line.isBelowMarginThreshold;

                  return (
                    <tr
                      key={line._id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isLowMargin ? 'rgba(245, 158, 11, 0.03)' : 'transparent'
                      }}
                    >
                      {/* Charge Type */}
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          padding: '2px 7px',
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          background: line.lineType === 'Tooling Cost'
                            ? 'rgba(124, 58, 237, 0.12)'
                            : line.lineType === 'Custom Part'
                            ? 'rgba(0, 180, 216, 0.12)'
                            : 'var(--bg-secondary)',
                          color: line.lineType === 'Tooling Cost'
                            ? '#7c3aed'
                            : line.lineType === 'Custom Part'
                            ? '#0077b6'
                            : 'var(--text-primary)'
                        }}>
                          {line.lineType}
                        </span>
                      </td>

                      {/* Product / Description */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {line.productId?.name || line.description || '—'}
                        </div>
                        {line.productId?.code && (
                          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            [{line.productId.code}]
                          </div>
                        )}
                        {line.productId && line.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {line.description}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {Number(line.quantity).toLocaleString()} <span style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-secondary)' }}>{line.uomId?.abbreviation || 'NOS'}</span>
                      </td>

                      {/* Confidential Unit Cost */}
                      {showInternalCosts && (
                        <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#94a3b8' }}>
                          {fmtMoneyFull(line.unitCost || 0)}
                        </td>
                      )}

                      {/* Quoted Unit Price */}
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {fmtMoneyFull(line.unitPrice || 0)}
                      </td>

                      {/* Discount % */}
                      <td style={{ padding: '11px 14px', textAlign: 'right', color: line.lineDiscountPercentage > 0 ? '#d97706' : 'var(--text-secondary)' }}>
                        {line.lineDiscountPercentage ? `${line.lineDiscountPercentage}%` : '—'}
                      </td>

                      {/* Line Total */}
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                        {fmtMoneyFull(line.lineTotal || 0)}
                      </td>

                      {/* Profit Margin */}
                      <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                        {marginPct !== null && marginPct !== undefined ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: isLowMargin ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                            color: isLowMargin ? '#d97706' : '#059669'
                          }}>
                            {isLowMargin && <AlertTriangle size={11} />}
                            <span>{marginPct}%</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      {!isLocked && (
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            <button
                              type="button"
                              title="Edit line item"
                              onClick={() => onOpenEditLineModal(line)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                padding: 4
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              title="Delete line item"
                              onClick={() => onDeleteLine(line._id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--accent-danger)',
                                padding: 4
                              }}
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
  );
};

export default QuotationLinesTab;
