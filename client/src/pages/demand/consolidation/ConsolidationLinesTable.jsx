import React, { useState } from 'react';
import {
  Package, Search, Edit2, ChevronRight, Lock,
  TrendingUp, CheckCircle, Info, Layers
} from 'lucide-react';

export const ConsolidationLinesTable = ({
  lines = [],
  selectedLine,
  onSelectLine,
  onOpenEditAdjustmentModal,
  selectedRun,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isLocked = selectedRun?.status === 'Consumed_By_MRP';

  const filteredLines = lines.filter(l => {
    const name = l.productId?.name || '';
    const code = l.productId?.code || '';
    const period = l.periodName || '';
    const q = searchTerm.toLowerCase();
    return name.toLowerCase().includes(q) || code.toLowerCase().includes(q) || period.toLowerCase().includes(q);
  });

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
      {/* Header Strip */}
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
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706'
          }}>
            <Package size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>
              Consolidated Part-by-Part Demand Lines
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
              {selectedRun
                ? `Showing ${lines.length} finished components for Run ${selectedRun.runNumber}. Click any line to audit source traceability.`
                : 'Select a consolidation run above to view line-item demand.'}
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-primary, #ffffff)',
          border: '1px solid var(--border-color, #cbd5e1)',
          borderRadius: '7px',
          padding: '5px 10px',
          minWidth: '240px'
        }}>
          <Search size={14} color="var(--text-secondary, #64748b)" />
          <input
            type="text"
            placeholder="Filter components by code or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '12px',
              width: '100%',
              color: 'var(--text-primary, #1e293b)'
            }}
          />
        </div>
      </div>

      {/* Table */}
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
              <th style={{ padding: '10px 10px', width: '28px' }}></th>
              <th style={{ padding: '10px 12px' }}>Component Specification</th>
              <th style={{ padding: '10px 12px' }}>Horizon Period</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Net Forecast</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Firm Sales Orders</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Safety Stock</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Gross Demand</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Manual Override</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Final Net Demand</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', width: '70px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading consolidated lines...
                </td>
              </tr>
            ) : filteredLines.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  {lines.length === 0 ? 'No demand lines in this run.' : 'No components match your filter.'}
                </td>
              </tr>
            ) : (
              filteredLines.map(line => {
                const isSelected = selectedLine?._id === line._id;
                const fQty = Number(line.forecastDemandQty) || 0;
                const soQty = Number(line.salesOrderQty) || 0;
                const ssQty = Number(line.safetyStockQty) || 0;
                const gross = Number(line.totalGrossDemand) || (fQty + soQty + ssQty);
                const manual = Number(line.manualAdjustmentQty) || 0;
                const finalNet = Number(line.finalNetDemand) || (gross + manual);

                return (
                  <tr
                    key={line._id}
                    onClick={() => onSelectLine(line)}
                    style={{
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Active Indicator Bar */}
                    <td style={{ padding: '12px 8px 12px 16px', textAlign: 'center' }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        borderRadius: '2px',
                        background: isSelected ? '#f59e0b' : 'transparent',
                        margin: '0 auto'
                      }} />
                    </td>

                    {/* Component */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, color: isSelected ? '#b45309' : 'var(--text-primary, #0f172a)' }}>
                        {line.productId?.name || 'Unnamed Product'}
                      </div>
                      <div style={{
                        display: 'inline-block',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: '#0284c7',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        marginTop: '2px'
                      }}>
                        {line.productId?.code || '—'}
                      </div>
                    </td>

                    {/* Period */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-primary, #334155)'
                      }}>
                        {line.periodName || '—'}
                      </span>
                    </td>

                    {/* Net Forecast */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{ color: '#d97706', fontWeight: 600 }}>
                        {fQty.toLocaleString()}
                      </span>
                    </td>

                    {/* Firm Sales Orders */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{ color: '#0284c7', fontWeight: 600 }}>
                        {soQty.toLocaleString()}
                      </span>
                    </td>

                    {/* Safety Stock */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{ color: '#059669', fontWeight: 500 }}>
                        {ssQty.toLocaleString()}
                      </span>
                    </td>

                    {/* Total Gross Demand */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                        {gross.toLocaleString()}
                      </span>
                    </td>

                    {/* Manual Override */}
                    <td
                      style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}
                      onClick={(e) => {
                        if (!isLocked) {
                          e.stopPropagation();
                          onOpenEditAdjustmentModal(line);
                        }
                      }}
                      title={!isLocked ? "Click to adjust demand by hand" : "Locked for MRP"}
                    >
                      {manual !== 0 ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: manual > 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: manual > 0 ? '#0284c7' : '#dc2626',
                          fontWeight: 700,
                          cursor: !isLocked ? 'pointer' : 'default',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {manual > 0 ? `+${manual.toLocaleString()}` : manual.toLocaleString()}
                          {!isLocked && <Edit2 size={10} />}
                        </span>
                      ) : (
                        <span style={{
                          color: '#94a3b8',
                          cursor: !isLocked ? 'pointer' : 'default',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          0 {!isLocked && <Edit2 size={10} style={{ opacity: 0.5 }} />}
                        </span>
                      )}
                    </td>

                    {/* Final Net Demand (MRP) */}
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '13px',
                        color: '#b45309',
                        background: 'rgba(245, 158, 11, 0.12)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        {finalNet.toLocaleString()}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {!isLocked ? (
                          <button
                            type="button"
                            title="Adjust demand by hand"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditAdjustmentModal(line);
                            }}
                            style={{
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '4px',
                              color: '#d97706',
                              cursor: 'pointer',
                              padding: '4px 6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            <Edit2 size={11} /> Edit
                          </button>
                        ) : (
                          <div title="Run is locked for MRP - no manual adjustments allowed" style={{ color: '#dc2626' }}>
                            <Lock size={12} />
                          </div>
                        )}

                        <ChevronRight
                          size={15}
                          color={isSelected ? '#f59e0b' : 'var(--text-secondary, #94a3b8)'}
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
