import React from 'react';
import { 
  PieChart, 
  Package, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  ShieldCheck,
  Coins,
  CheckCircle2
} from 'lucide-react';
import { fmtMoney, fmtMoneyFull, fmtQty } from '../../../utils/money';

const CategoryAssetDeck = ({
  categories = [],
  profiles = [],
  totalValuation = 0,
  onInspectMaterial
}) => {
  // Color palette for category cards
  const CATEGORY_THEMES = [
    { border: '#059669', badgeBg: 'rgba(5, 150, 105, 0.15)', badgeFg: '#065f46', bar: '#10b981' },
    { border: '#0284c7', badgeBg: 'rgba(2, 132, 199, 0.15)', badgeFg: '#0369a1', bar: '#38bdf8' },
    { border: '#7c3aed', badgeBg: 'rgba(124, 58, 237, 0.15)', badgeFg: '#6d28d9', bar: '#a78bfa' },
    { border: '#d97706', badgeBg: 'rgba(217, 119, 6, 0.15)', badgeFg: '#b45309', bar: '#f59e0b' },
    { border: '#e11d48', badgeBg: 'rgba(225, 29, 72, 0.15)', badgeFg: '#be123c', bar: '#fb7185' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Category Overview & Balance Sheet Disclosure Banner */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <PieChart size={18} color="#059669" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Balance Sheet Asset Classes & Capital Stratification
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '750px', lineHeight: '1.4' }}>
              Statutory breakdown of stores inventories in accordance with Ind AS 2 (Inventories) and Schedule III of the Companies Act, showing capital lock-up across Raw Materials, Finished Goods, and Consumables.
            </p>
          </div>

          <div style={{
            background: 'rgba(5, 150, 105, 0.08)',
            border: '1px solid #059669',
            borderRadius: '8px',
            padding: '8px 14px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>Total Plant Stores Asset</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#047857' }} title={fmtMoneyFull(totalValuation)}>
              {fmtMoney(totalValuation)}
            </div>
          </div>
        </div>

        {/* Global Proportional Capital Bar */}
        <div style={{ marginTop: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Capital Allocation Share:
          </div>
          <div style={{
            height: '18px',
            borderRadius: '6px',
            display: 'flex',
            overflow: 'hidden',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            {categories.map((cat, idx) => {
              const theme = CATEGORY_THEMES[idx % CATEGORY_THEMES.length];
              const share = cat.sharePct || (totalValuation > 0 ? (cat.activeValuation / totalValuation) * 100 : 0);
              if (share <= 0) return null;

              return (
                <div
                  key={cat.categoryName}
                  style={{
                    width: `${share}%`,
                    background: theme.bar,
                    height: '100%',
                    borderRight: idx < categories.length - 1 ? '1px solid rgba(255, 255, 255, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  title={`${cat.categoryName}: ${fmtMoney(cat.activeValuation)} (${Math.round(share)}%)`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {categories.map((cat, idx) => {
          const theme = CATEGORY_THEMES[idx % CATEGORY_THEMES.length];
          const share = cat.sharePct || (totalValuation > 0 ? (cat.activeValuation / totalValuation) * 100 : 0);
          const variance = cat.activeValuation - cat.standardValue;
          const isPositive = variance > 0;

          // Find top materials in this category
          const topMaterials = profiles
            .filter(p => p.categoryName === cat.categoryName)
            .sort((a, b) => b.fifoValue - a.fifoValue)
            .slice(0, 3);

          return (
            <div
              key={cat.categoryName}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              {/* Category Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: theme.badgeBg,
                      color: theme.badgeFg
                    }}>
                      Class #{idx + 1}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '6px 0 2px 0' }}>
                      {cat.categoryName}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {cat.materialCount} Tracked Material SKUs • {fmtQty(cat.totalQty)} total units
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {fmtMoney(cat.activeValuation)}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#047857' }}>
                      {share.toFixed(1)}% of Stores Capital
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    height: '6px',
                    borderRadius: '3px',
                    background: 'var(--bg-secondary)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(5, share))}%`,
                      height: '100%',
                      background: theme.bar,
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>

                {/* Benchmark Metrics Comparison */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginTop: '14px',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  fontSize: '11px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>FIFO Layer Total:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {fmtMoney(cat.fifoValue)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Standard Benchmark:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {fmtMoney(cat.standardValue)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top SKUs in Category */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Top Value Drivers in {cat.categoryName}:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {topMaterials.map((m) => (
                    <div
                      key={m._id}
                      onClick={() => onInspectMaterial(m)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#059669';
                        e.currentTarget.style.background = 'rgba(5, 150, 105, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.Material_ID?.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {fmtQty(m.onHand)} {m.uom} @ {fmtMoneyFull(m.standardCost)}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                          {fmtMoney(m.fifoValue)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {m.Primary_Valuation_Method}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryAssetDeck;
