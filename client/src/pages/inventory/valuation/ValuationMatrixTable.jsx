import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Settings2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Tag, 
  Package, 
  Calculator,
  ArrowRight
} from 'lucide-react';
import { fmtMoney, fmtMoneyFull, fmtQty } from '../../../utils/money';

const METHOD_LABEL = {
  FIFO: { name: 'FIFO', desc: 'First In, First Out', color: '#047857', bg: 'rgba(5, 150, 105, 0.1)' },
  WAC: { name: 'WAC', desc: 'Weighted Average Cost', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' },
  Standard: { name: 'Standard', desc: 'Standard Fixed Cost', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' }
};

const ValuationMatrixTable = ({
  profiles = [],
  loading = false,
  onInspectLayers,
  onEditPolicy,
  onCalculate
}) => {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [varianceFilter, setVarianceFilter] = useState('ALL');
  const [stockOnly, setStockOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Extract distinct categories
  const categories = Array.from(new Set(profiles.map(p => p.categoryName || 'General'))).filter(Boolean);

  // Filter profiles
  const filteredProfiles = profiles.filter(p => {
    const mat = p.Material_ID || {};
    const nameMatch = (mat.name || '').toLowerCase().includes(search.toLowerCase()) ||
                      (mat.code || '').toLowerCase().includes(search.toLowerCase()) ||
                      (p.categoryName || '').toLowerCase().includes(search.toLowerCase());

    if (!nameMatch) return false;

    if (methodFilter !== 'ALL' && p.Primary_Valuation_Method !== methodFilter) return false;
    if (categoryFilter !== 'ALL' && p.categoryName !== categoryFilter) return false;

    if (varianceFilter === 'GAIN' && (p.costVariance <= 0)) return false;
    if (varianceFilter === 'DISCOUNT' && (p.costVariance >= 0)) return false;
    if (varianceFilter === 'PAR' && (p.costVariance !== 0)) return false;

    if (stockOnly && (p.onHand <= 0)) return false;

    return true;
  });

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
    }}>
      {/* Filtering & Search Command Toolbar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '7px 12px',
            width: '100%',
            maxWidth: '340px'
          }}>
            <Search size={15} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search by SKU name, code, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '13px',
                color: 'var(--text-primary)'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  padding: '2px 4px'
                }}
              >
                Clear
              </button>
            )}
          </div>

          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            marginLeft: '6px',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={stockOnly}
              onChange={(e) => setStockOnly(e.target.checked)}
              style={{ accentColor: '#059669', cursor: 'pointer' }}
            />
            In-Stock SKUs Only
          </label>
        </div>

        {/* Filter Badges & Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Method Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Costing:</span>
            {['ALL', 'FIFO', 'WAC', 'Standard'].map(m => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: methodFilter === m ? '1px solid #059669' : '1px solid var(--border-color)',
                  background: methodFilter === m ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-primary)',
                  color: methodFilter === m ? '#047857' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease'
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Variance Filter */}
          <select
            value={varianceFilter}
            onChange={(e) => setVarianceFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Variances</option>
            <option value="GAIN">+ Premium Variance (FIFO &gt; Std)</option>
            <option value="DISCOUNT">- Discount Variance (FIFO &lt; Std)</option>
            <option value="PAR">0 At Par (FIFO == Std)</option>
          </select>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
          <thead>
            <tr style={{
              background: 'var(--bg-secondary)',
              borderBottom: '2px solid var(--border-color)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)'
            }}>
              <th style={{ padding: '12px 14px', width: '36px' }}></th>
              <th style={{ padding: '12px 14px' }}>Material SKU</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Physical Stores Stock</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Costing Basis</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Standard Cost Ref</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Calculated FIFO Asset</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Weighted Avg Cost</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Cost Variance</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #059669', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Calculating valuation ledger...
                  </div>
                </td>
              </tr>
            ) : filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
                  <Package size={36} color="var(--text-secondary)" style={{ marginBottom: '8px', opacity: 0.6 }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No Materials Match Filters</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Try resetting search or filters, or click "Work Out Stock Value" to refresh.</div>
                </td>
              </tr>
            ) : (
              filteredProfiles.map((row) => {
                const isExpanded = expandedId === row._id;
                const mat = row.Material_ID || {};
                const methodInfo = METHOD_LABEL[row.Primary_Valuation_Method] || METHOD_LABEL.FIFO;
                const variance = row.costVariance || 0;
                const isPositive = variance > 0;
                const isZero = variance === 0;

                return (
                  <React.Fragment key={row._id}>
                    <tr
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid var(--border-color)',
                        background: isExpanded ? 'rgba(5, 150, 105, 0.04)' : 'transparent',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Expand Toggle */}
                      <td style={{ padding: '12px 8px 12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleExpand(row._id)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title="Click to view costing details and FIFO layers"
                        >
                          {isExpanded ? <ChevronDown size={16} color="#059669" /> : <ChevronRight size={16} />}
                        </button>
                      </td>

                      {/* Material Info */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              onClick={() => toggleExpand(row._id)}
                              style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                hover: { textDecoration: 'underline' }
                              }}
                            >
                              {mat.name || 'Unnamed Material'}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              background: 'var(--bg-tertiary)',
                              color: 'var(--text-secondary)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              fontFamily: 'monospace'
                            }}>
                              {mat.code || '-'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <span>{row.categoryName}</span>
                            <span>•</span>
                            <span>Grade: {row.grade}</span>
                          </div>
                        </div>
                      </td>

                      {/* Physical Stock */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: row.onHand > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {fmtQty(row.onHand)} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>{row.uom}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Avail: {fmtQty(row.available)} {row.uom}
                        </div>
                      </td>

                      {/* Costing Basis Badge */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => onEditPolicy(row)}
                          title={`Click to change costing method (Currently: ${methodInfo.desc})`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: methodInfo.bg,
                            border: `1px solid ${methodInfo.color}`,
                            color: methodInfo.color,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'transform 0.1s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          <Tag size={11} />
                          {methodInfo.name}
                        </button>
                      </td>

                      {/* Standard Cost Ref */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {fmtMoney(row.standardValue)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          @{fmtMoneyFull(row.standardCost)}/{row.uom}
                        </div>
                      </td>

                      {/* Calculated FIFO Asset */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: row.Primary_Valuation_Method === 'FIFO' ? '#047857' : 'var(--text-primary)'
                        }}>
                          {fmtMoney(row.fifoValue)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {row.onHand > 0 ? `@${fmtMoneyFull(Math.round(row.fifoValue / row.onHand * 100) / 100)}/${row.uom}` : 'Zero Stock'}
                        </div>
                      </td>

                      {/* Weighted Avg Cost */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: row.Primary_Valuation_Method === 'WAC' ? '#2563eb' : 'var(--text-primary)'
                        }}>
                          {fmtMoney(row.wacValue)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          @{fmtMoneyFull(row.wacUnit)}/{row.uom}
                        </div>
                      </td>

                      {/* Cost Variance */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {isZero ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-tertiary)',
                            padding: '2px 7px',
                            borderRadius: '5px'
                          }}>
                            <Minus size={11} /> At Par
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: isPositive ? '#065f46' : '#92400e',
                              background: isPositive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              border: `1px solid ${isPositive ? 'rgba(5, 150, 105, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`
                            }}>
                              {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {isPositive ? '+' : ''}{fmtMoney(variance)}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {row.costVariancePct > 0 ? `+${row.costVariancePct}%` : `${row.costVariancePct}%`} vs Std
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => onInspectLayers(row)}
                            title="Drilldown into FIFO receipt cost layers for this material"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              border: '1px solid #059669',
                              background: 'rgba(5, 150, 105, 0.08)',
                              color: '#047857',
                              cursor: 'pointer'
                            }}
                          >
                            <Layers size={12} />
                            Layers
                          </button>

                          <button
                            onClick={() => onEditPolicy(row)}
                            title="Edit costing method & standard rate"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-primary)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            <Settings2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Policy & Variance Drawer */}
                    {isExpanded && (
                      <tr style={{ background: 'rgba(5, 150, 105, 0.04)', borderBottom: '1px solid var(--border-color)' }}>
                        <td colSpan={9} style={{ padding: '16px 24px 20px 48px' }}>
                          <div style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid #059669',
                            borderRadius: '10px',
                            padding: '16px 20px',
                            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.08)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#047857' }}>
                                  Valuation Triangulation & Accounting Disclosures: {mat.name} ({mat.code})
                                </span>
                                <span style={{ fontSize: '11px', background: 'rgba(5, 150, 105, 0.15)', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                  Active Method: {row.Primary_Valuation_Method}
                                </span>
                              </div>

                              <button
                                onClick={() => onInspectLayers(row)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#047857',
                                  background: 'rgba(5, 150, 105, 0.1)',
                                  border: '1px solid #059669',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                View Detailed FIFO Receipt Layer Stack <ArrowRight size={13} />
                              </button>
                            </div>

                            {/* 3-Way Comparative Cards */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                              gap: '12px',
                              marginBottom: '14px'
                            }}>
                              {/* Option 1: Standard Costing */}
                              <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                border: row.Primary_Valuation_Method === 'Standard' ? '2px solid #7c3aed' : '1px solid var(--border-color)',
                                background: row.Primary_Valuation_Method === 'Standard' ? 'rgba(124, 58, 237, 0.05)' : 'var(--bg-secondary)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                                  Standard Cost (Fixed Standard)
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                  {fmtMoney(row.standardValue)}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Fixed Base: {fmtMoneyFull(row.standardCost)} per {row.uom}
                                </div>
                              </div>

                              {/* Option 2: FIFO (First In First Out) */}
                              <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                border: row.Primary_Valuation_Method === 'FIFO' ? '2px solid #059669' : '1px solid var(--border-color)',
                                background: row.Primary_Valuation_Method === 'FIFO' ? 'rgba(5, 150, 105, 0.08)' : 'var(--bg-secondary)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                                  FIFO (Historical Receipt Layers)
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#047857', marginTop: '4px' }}>
                                  {fmtMoney(row.fifoValue)}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Ind AS 2 standard: Oldest stock costed out first
                                </div>
                              </div>

                              {/* Option 3: WAC (Weighted Average) */}
                              <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                border: row.Primary_Valuation_Method === 'WAC' ? '2px solid #2563eb' : '1px solid var(--border-color)',
                                background: row.Primary_Valuation_Method === 'WAC' ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-secondary)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                                  WAC (Rolling Weighted Average)
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                                  {fmtMoney(row.wacValue)}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Effective Rate: {fmtMoneyFull(row.wacUnit)} per {row.uom}
                                </div>
                              </div>
                            </div>

                            {/* Accounting Notes & Variance Explanation */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              paddingTop: '8px',
                              borderTop: '1px solid var(--border-color)',
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              <div>
                                <strong>Valuation Variance Analysis:</strong>{' '}
                                {isZero ? (
                                  'Current receipt costs match standard master rate exactly. Zero purchase price variance.'
                                ) : isPositive ? (
                                  `Receipt acquisition cost is higher than master standard rate by ${fmtMoneyFull(variance)} (+${row.costVariancePct}%). Reflects raw material price inflation.`
                                ) : (
                                  `Receipt acquisition cost is lower than master standard rate by ${fmtMoneyFull(Math.abs(variance))} (${row.costVariancePct}%). Procurement volume discount realized.`
                                )}
                              </div>
                              <div>
                                Last calculated: {row.Last_Calculated ? new Date(row.Last_Calculated).toLocaleString('en-IN') : 'Synchronized'}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary Bar */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          Showing <strong>{filteredProfiles.length}</strong> of <strong>{profiles.length}</strong> active materials
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Total Stores Inventory: <strong>{fmtQty(filteredProfiles.reduce((s, p) => s + p.onHand, 0))} units</strong></span>
          <span>Filtered FIFO Asset Value: <strong style={{ color: '#047857' }}>{fmtMoney(filteredProfiles.reduce((s, p) => s + p.fifoValue, 0))}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default ValuationMatrixTable;
