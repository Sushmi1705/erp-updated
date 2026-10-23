import React, { useState } from 'react';
import { BarChart3, TrendingUp, Search, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

export const HistoricalSalesView = ({
  historicalData = [],
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Aggregates
  const totalQty = historicalData.reduce((sum, r) => sum + (Number(r.totalHistoricalQuantity) || 0), 0);
  const totalValue = historicalData.reduce((sum, r) => sum + (Number(r.totalHistoricalValue) || 0), 0);
  const totalOrders = historicalData.reduce((sum, r) => sum + (Number(r.orderCount) || 0), 0);

  // Filtered
  const filtered = historicalData.filter(r =>
    (r.productCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxQty = Math.max(...historicalData.map(r => Number(r.totalHistoricalQuantity) || 0), 1);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Historical Telemetry Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {/* Total Quantity */}
        <div style={{
          background: 'var(--bg-primary, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          padding: '16px 20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--text-secondary, #64748b)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>Total Units Invoiced</span>
            <Package size={15} color="#0891b2" />
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--text-primary, #0f172a)',
            fontFamily: 'monospace'
          }}>
            {totalQty.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
            Realized demand from confirmed customer orders
          </div>
        </div>

        {/* Total Invoiced Value */}
        <div style={{
          background: 'var(--bg-primary, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          padding: '16px 20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--text-secondary, #64748b)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>Realized Order Value</span>
            <DollarSign size={15} color="#10b981" />
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#059669',
            fontFamily: 'monospace'
          }}>
            {fmtMoneyFull(totalValue)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
            Cumulative revenue across finished parts
          </div>
        </div>

        {/* Total Orders Dispatched */}
        <div style={{
          background: 'var(--bg-primary, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          padding: '16px 20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--text-secondary, #64748b)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>Sales Order Batches</span>
            <ShoppingCart size={15} color="#8b5cf6" />
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#7c3aed',
            fontFamily: 'monospace'
          }}>
            {totalOrders}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
            Approved, dispatched, and delivered lines
          </div>
        </div>
      </div>

      {/* Historical Table Container */}
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
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          background: 'var(--bg-secondary, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0891b2'
            }}>
              <BarChart3 size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>
                Realized Sales Volume & Actuals Baseline
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                Aggregated from customer sales orders in Approved, In Production, Dispatched, or Invoiced states.
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-color, #cbd5e1)',
            borderRadius: '8px',
            padding: '6px 12px',
            minWidth: '260px'
          }}>
            <Search size={15} color="var(--text-secondary, #64748b)" />
            <input
              type="text"
              placeholder="Search product code or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
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
                <th style={{ padding: '12px 20px' }}>Part Code</th>
                <th style={{ padding: '12px 16px' }}>Product Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Quantity Sold</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Volume Share</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Order Count</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Realized Order Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No historical sales actuals found in the database.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const qty = Number(r.totalHistoricalQuantity) || 0;
                  const sharePct = ((qty / maxQty) * 100).toFixed(0);

                  return (
                    <tr
                      key={r.productId || idx}
                      style={{
                        borderBottom: '1px solid var(--border-color, #f1f5f9)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#0891b2',
                          background: 'rgba(6, 182, 212, 0.08)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {r.productCode || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                        {r.productName || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                        {qty.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '80px',
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${sharePct}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #06b6d4 0%, #8b5cf6 100%)'
                            }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b', minWidth: '28px', textAlign: 'right' }}>
                            {sharePct}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: '#7c3aed',
                          fontWeight: 600,
                          fontSize: '12px'
                        }}>
                          {r.orderCount || 0}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#059669', fontSize: '14px' }}>
                        {fmtMoneyFull(r.totalHistoricalValue)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
