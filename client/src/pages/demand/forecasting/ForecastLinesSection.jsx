import React from 'react';
import {
  Calendar, Layers, Edit2, Trash2, ChevronRight, Lock,
  Plus, AlertCircle, TrendingUp, TrendingDown, Check
} from 'lucide-react';

export const ForecastLinesSection = ({
  lines = [],
  selectedLine,
  onSelectLine,
  onOpenEditLineModal,
  onDeleteLine,
  onOpenAddLineModal,
  isFinalized = false,
  forecastNumber = '',
  period = '',
  products = [],
  uoms = []
}) => {
  // Helpers
  const getProductName = (line) => {
    if (line.productId?.name) return `${line.productId.name} (${line.productId.code || ''})`;
    const p = products.find(item => item._id === line.productId);
    return p ? `${p.name} (${p.code})` : 'Product Component';
  };

  const getUomSymbol = (line) => {
    if (line.uomId?.symbol) return line.uomId.symbol;
    const u = uoms.find(item => item._id === line.uomId);
    return u ? u.symbol : 'PCS';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div style={{
      background: 'var(--bg-primary, #ffffff)',
      borderRadius: '12px',
      border: '1px solid var(--border-color, #e2e8f0)',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Section Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-secondary, #f8fafc)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed'
          }}>
            <Calendar size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>
              Monthly Demand Buckets & Consensus Quantities
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
              {isFinalized
                ? 'Finalized for MRP — lines are strictly locked to protect production orders.'
                : 'Click any monthly bucket to audit manual hand overrides and reasons.'}
            </div>
          </div>
        </div>

        {/* Right Header Action */}
        {!isFinalized && (
          <button
            type="button"
            onClick={onOpenAddLineModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '7px',
              background: '#8b5cf6',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> Add Month Bucket
          </button>
        )}
      </div>

      {/* Lines Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '13px'
        }}>
          <thead>
            <tr style={{
              background: 'var(--bg-secondary, #f8fafc)',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              color: 'var(--text-secondary, #64748b)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '12px 18px', width: '36px' }}></th>
              <th style={{ padding: '12px 16px' }}>Planning Month</th>
              <th style={{ padding: '12px 16px' }}>Product Component</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>System Baseline</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Manual Adjustment</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Final Forecast Qty</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Confidence (%)</th>
              <th style={{ padding: '12px 16px' }}>Reason / Notes</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>UOM</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No forecast lines added for this model yet. Click "+ Add Month Bucket" above.
                </td>
              </tr>
            ) : (
              lines.map((l) => {
                const isSelected = selectedLine?._id === l._id;
                const sysQty = Number(l.systemCalculatedQty) || 0;
                const manualQty = Number(l.manualAdjustedQty) || 0;
                const finalQty = Number(l.finalForecastQty) || 0;
                const conf = Number(l.confidenceScorePercentage) || 95;

                // Divergence percentage
                const diff = finalQty - sysQty;
                const pctDiff = sysQty > 0 ? ((diff / sysQty) * 100).toFixed(1) : 0;

                return (
                  <tr
                    key={l._id}
                    onClick={() => onSelectLine(l)}
                    style={{
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Active indicator bar */}
                    <td style={{ padding: '12px 8px 12px 16px', textAlign: 'center' }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        borderRadius: '2px',
                        background: isSelected ? '#8b5cf6' : 'transparent',
                        margin: '0 auto'
                      }} />
                    </td>

                    {/* Month Bucket */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        fontWeight: 700,
                        color: isSelected ? '#7c3aed' : 'var(--text-primary, #0f172a)'
                      }}>
                        {formatDate(l.timeBucketDate)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                        {new Date(l.timeBucketDate).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Product */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                        {getProductName(l)}
                      </div>
                    </td>

                    {/* System Calculated Qty */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary, #475569)' }}>
                        {sysQty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Manual Adjustment */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {manualQty !== 0 ? (
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: manualQty > 0 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: manualQty > 0 ? '#0891b2' : '#dc2626'
                        }}>
                          {manualQty > 0 ? `+${manualQty}` : manualQty}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>0.00</span>
                      )}
                    </td>

                    {/* Final Forecast Qty */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '14px',
                        color: '#7c3aed',
                        background: 'rgba(139, 92, 246, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        {finalQty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </div>
                      {diff !== 0 && (
                        <div style={{
                          fontSize: '10px',
                          color: diff > 0 ? '#059669' : '#dc2626',
                          fontWeight: 600,
                          marginTop: '2px'
                        }}>
                          {diff > 0 ? `▲ +${pctDiff}%` : `▼ ${pctDiff}%`} vs Sys
                        </div>
                      )}
                    </td>

                    {/* Confidence Score */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '12px',
                          color: conf >= 90 ? '#059669' : conf >= 80 ? '#d97706' : '#dc2626'
                        }}>
                          {conf}%
                        </span>
                        <div style={{
                          width: '54px',
                          height: '5px',
                          borderRadius: '3px',
                          background: '#e2e8f0',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${conf}%`,
                            height: '100%',
                            background: conf >= 90 ? '#10b981' : conf >= 80 ? '#f59e0b' : '#ef4444'
                          }} />
                        </div>
                      </div>
                    </td>

                    {/* Reason / Notes */}
                    <td style={{ padding: '12px 16px' }}>
                      {l.reasonCode ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          fontWeight: 600,
                          fontSize: '11px',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          {l.reasonCode}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>Algorithmic Baseline</span>
                      )}
                    </td>

                    {/* Unit */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        background: 'var(--bg-secondary, #f1f5f9)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary, #475569)'
                      }}>
                        {getUomSymbol(l)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {!isFinalized ? (
                          <>
                            <button
                              type="button"
                              title="Edit Forecast Line"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditLineModal(l);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#6366f1',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              title="Delete Forecast Line"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLine(l._id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ) : (
                          <div title="Finalized line is locked" style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
                            <Lock size={13} />
                          </div>
                        )}
                        <ChevronRight
                          size={15}
                          color={isSelected ? '#8b5cf6' : 'var(--text-secondary, #94a3b8)'}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
