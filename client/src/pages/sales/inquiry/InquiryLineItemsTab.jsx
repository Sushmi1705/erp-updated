import React from 'react';
import {
  Package, Plus, Edit2, Trash2, ChevronRight, Lock,
  AlertTriangle, CheckCircle, ShieldCheck, DollarSign, Layers
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../../utils/money';

export const InquiryLineItemsTab = ({
  selectedInquiry,
  lineItems = [],
  selectedLine,
  onSelectLine,
  onOpenAddLineModal,
  onOpenEditLineModal,
  onDeleteLine
}) => {
  const isQuotationLocked = !!selectedInquiry?.quotationId;

  // Aggregate computations
  const totalQty = lineItems.reduce((acc, l) => acc + (Number(l.requestedQuantity) || 0), 0);
  const totalTargetVal = lineItems.reduce((acc, l) => acc + ((Number(l.requestedQuantity) || 0) * (Number(l.targetUnitPrice) || 0)), 0);
  const unlinkedCount = lineItems.filter(l => !l.productId).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
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
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'rgba(0, 180, 216, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={17} color="#0077b6" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Parts Requested
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                {lineItems.length} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>item{lineItems.length !== 1 ? 's' : ''} ({totalQty.toLocaleString()} units)</span>
              </div>
            </div>
          </div>

          <div style={{ height: 26, width: 1, background: 'var(--border-color)' }} />

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Est. Target Order Value
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
              {fmtMoneyFull(totalTargetVal)}
            </div>
          </div>

          {unlinkedCount > 0 && (
            <>
              <div style={{ height: 26, width: 1, background: 'var(--border-color)' }} />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: 11.5,
                fontWeight: 600,
                color: '#d97706'
              }}>
                <AlertTriangle size={13} />
                <span>{unlinkedCount} Custom / APQP Line{unlinkedCount !== 1 ? 's' : ''}</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Add Line Button */}
        {!isQuotationLocked && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddLineModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: 6
            }}
          >
            <Plus size={15} />
            <span>Add Requested Part</span>
          </button>
        )}
      </div>

      {/* ── LINE ITEMS TABLE / LIST ──────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {lineItems.length === 0 ? (
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
              background: 'rgba(0, 180, 216, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={24} color="#0077b6" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              No Requested Parts in this Inquiry Yet
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 460, margin: 0 }}>
              Add the customer's requested part numbers, OEM cross-references, desired quantities, and target price per piece to commence commercial review.
            </p>
            {!isQuotationLocked && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenAddLineModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  marginTop: 6
                }}
              >
                <Plus size={14} /> Add First Part
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 12.5
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
                  <th style={{ padding: '10px 14px', width: 60 }}>Seq</th>
                  <th style={{ padding: '10px 14px' }}>Customer / OEM Part #</th>
                  <th style={{ padding: '10px 14px' }}>Internal Catalog Match</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Qty Asked</th>
                  <th style={{ padding: '10px 14px' }}>UOM</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Target Price</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Ext. Total</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Feasibility</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', minWidth: 110 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((line, idx) => {
                  const isSelected = selectedLine?._id === line._id;
                  const isCustom = !line.productId;
                  const lineTotal = (Number(line.requestedQuantity) || 0) * (Number(line.targetUnitPrice) || 0);

                  return (
                    <tr
                      key={line._id || idx}
                      onClick={() => onSelectLine(line)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: isSelected
                          ? 'rgba(0, 180, 216, 0.08)'
                          : idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Seq */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          background: isSelected ? 'rgba(0, 180, 216, 0.2)' : 'var(--bg-secondary)',
                          color: isSelected ? '#0077b6' : 'var(--text-primary)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 11
                        }}>
                          {line.lineSequence ? `#${line.lineSequence}` : `#${idx + 1}`}
                        </span>
                      </td>

                      {/* Customer / OEM Part # */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                          {line.customerPartNumber || '—'}
                        </div>
                        {line.oemPartNumber && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                            OEM Ref: <span style={{ fontFamily: 'monospace' }}>{line.oemPartNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Internal Catalog Match */}
                      <td style={{ padding: '12px 14px' }}>
                        {line.productId ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {line.productId.name || line.productId}
                            </div>
                            {line.productId.code && (
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                [{line.productId.code}]
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#d97706',
                            fontSize: 11,
                            fontWeight: 600
                          }}>
                            <AlertTriangle size={12} />
                            <span>New / Custom Part</span>
                          </div>
                        )}
                      </td>

                      {/* Qty Asked */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {(Number(line.requestedQuantity) || 0).toLocaleString()}
                      </td>

                      {/* UOM */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 11.5 }}>
                        {line.uomId?.abbreviation || line.uomId?.name || 'NOS'}
                      </td>

                      {/* Target Price */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {line.targetUnitPrice ? fmtMoneyFull(line.targetUnitPrice) : '—'}
                      </td>

                      {/* Ext. Total */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                        {lineTotal > 0 ? fmtMoneyFull(lineTotal) : '—'}
                      </td>

                      {/* Feasibility Indicator */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {isCustom ? (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: 'rgba(234, 88, 12, 0.12)',
                            color: '#c2410c'
                          }}>
                            Gate Required
                          </span>
                        ) : (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 10.5,
                            fontWeight: 600,
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#059669'
                          }}>
                            Catalog Item
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <StatusBadge value={line.lineStatus || 'Open'} />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            type="button"
                            title="Inspect Fitment & Feasibility"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLine(line);
                            }}
                            style={{
                              background: isSelected ? 'rgba(0, 180, 216, 0.25)' : 'rgba(0, 0, 0, 0.04)',
                              border: isSelected ? '1px solid #00b4d8' : '1px solid var(--border-color)',
                              borderRadius: 4,
                              padding: '4px 8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              color: isSelected ? '#0077b6' : 'var(--text-secondary)',
                              fontWeight: 600
                            }}
                          >
                            <span>Inspect</span>
                            <ChevronRight size={13} />
                          </button>

                          {!isQuotationLocked && !line.isLocked && (
                            <>
                              <button
                                type="button"
                                title="Edit Line Item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenEditLineModal(line);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-secondary)',
                                  padding: 4,
                                  borderRadius: 4
                                }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                title="Delete Line Item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteLine(line._id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--accent-danger)',
                                  padding: 4,
                                  borderRadius: 4
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}

                          {(isQuotationLocked || line.isLocked) && (
                            <span title="Line locked by generated quotation" style={{ color: 'var(--text-secondary)', padding: '0 4px' }}>
                              <Lock size={12} />
                            </span>
                          )}
                        </div>
                      </td>
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

export default InquiryLineItemsTab;
