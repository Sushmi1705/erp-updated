import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  PlusCircle, 
  Layers, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Factory,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

const PeriodCapacityLedger = ({
  periods = [],
  selectedPeriod,
  onSelectPeriod,
  onOpenOvertime,
  statusFilter,
  setStatusFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [workCenterFilter, setWorkCenterFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [sortBy, setSortBy] = useState('load-desc');

  // Extract unique work centers & periods for filters
  const uniqueWorkCenters = useMemo(() => {
    const map = new Map();
    periods.forEach(p => {
      if (p.workCenterId && p.workCenterId.name) {
        map.set(p.workCenterId.name, p.workCenterId.code || p.workCenterId.name);
      }
    });
    return Array.from(map.entries());
  }, [periods]);

  const uniquePeriods = useMemo(() => {
    const set = new Set();
    periods.forEach(p => {
      if (p.periodLabel) set.add(p.periodLabel);
    });
    return Array.from(set).sort();
  }, [periods]);

  // Filter and sort periods
  const filteredPeriods = useMemo(() => {
    return periods
      .filter(p => {
        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const wcName = p.workCenterId?.name?.toLowerCase() || '';
          const wcCode = p.workCenterId?.code?.toLowerCase() || '';
          const pLabel = p.periodLabel?.toLowerCase() || '';
          if (!wcName.includes(term) && !wcCode.includes(term) && !pLabel.includes(term)) {
            return false;
          }
        }

        // Work center filter
        if (workCenterFilter !== 'All' && p.workCenterId?.name !== workCenterFilter) {
          return false;
        }

        // Period filter
        if (periodFilter !== 'All' && p.periodLabel !== periodFilter) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'All') {
          if (statusFilter === 'Bottleneck' && p.status !== 'Bottleneck' && p.utilizationPct <= 100) return false;
          if (statusFilter === 'Optimal' && (p.status !== 'Optimal' && (p.utilizationPct < 60 || p.utilizationPct > 100))) return false;
          if (statusFilter === 'Underutilized' && p.status !== 'Underutilized' && p.utilizationPct >= 60) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'load-desc') return (b.utilizationPct || 0) - (a.utilizationPct || 0);
        if (sortBy === 'load-asc') return (a.utilizationPct || 0) - (b.utilizationPct || 0);
        if (sortBy === 'wc-asc') return (a.workCenterId?.name || '').localeCompare(b.workCenterId?.name || '');
        if (sortBy === 'period-asc') return (a.periodLabel || '').localeCompare(b.periodLabel || '');
        if (sortBy === 'date-asc') return new Date(a.startDate || 0) - new Date(b.startDate || 0);
        return 0;
      });
  }, [periods, searchTerm, workCenterFilter, periodFilter, statusFilter, sortBy]);

  const getStatusBadge = (status, pct) => {
    const isBottleneck = status === 'Bottleneck' || pct > 100;
    const isOptimal = (status === 'Optimal' || (pct >= 60 && pct <= 100)) && !isBottleneck;

    if (isBottleneck) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          fontSize: '11px',
          fontWeight: 700,
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 6px #ef4444'
          }} />
          Bottleneck
        </span>
      );
    }

    if (isOptimal) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          fontSize: '11px',
          fontWeight: 700,
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10b981'
          }} />
          Optimal
        </span>
      );
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'rgba(6, 182, 212, 0.15)',
        color: '#38bdf8',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#06b6d4'
        }} />
        Underutilized
      </span>
    );
  };

  const getBarColor = (pct) => {
    if (pct > 100) return 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)';
    if (pct >= 85) return 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)';
    if (pct >= 60) return 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)';
    return 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)';
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.25)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.2)'
    }}>
      {/* Header and Filter Toolbar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Title and Results count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <Factory size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                Master Capacity Ledger
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                Click any period row to inspect scheduled work order loads or inject overtime.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Showing <strong style={{ color: '#f1f5f9' }}>{filteredPeriods.length}</strong> of {periods.length} Periods
            </span>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={13} color="#94a3b8" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="load-desc">Utilization: High to Low</option>
                <option value="load-asc">Utilization: Low to High</option>
                <option value="wc-asc">Work Center (A-Z)</option>
                <option value="period-asc">Period Label</option>
                <option value="date-asc">Timeline Date Sequence</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            minWidth: '220px',
            flex: '1 1 220px',
            maxWidth: '320px'
          }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search Work Center or Period..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '6px',
                padding: '6px 10px 6px 30px',
                color: '#f1f5f9',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Work Center Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Center:</span>
            <button
              onClick={() => setWorkCenterFilter('All')}
              style={{
                background: workCenterFilter === 'All' ? '#4f46e5' : 'rgba(51, 65, 85, 0.5)',
                color: workCenterFilter === 'All' ? '#ffffff' : '#94a3b8',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              All
            </button>
            {uniqueWorkCenters.map(([wcName, wcCode]) => (
              <button
                key={wcName}
                onClick={() => setWorkCenterFilter(workCenterFilter === wcName ? 'All' : wcName)}
                style={{
                  background: workCenterFilter === wcName ? '#4f46e5' : 'rgba(51, 65, 85, 0.5)',
                  color: workCenterFilter === wcName ? '#ffffff' : '#cbd5e1',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {wcName}
              </button>
            ))}
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Status:</span>
            {['All', 'Bottleneck', 'Optimal', 'Underutilized'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st
                    ? (st === 'Bottleneck' ? '#ef4444' : st === 'Optimal' ? '#10b981' : st === 'Underutilized' ? '#06b6d4' : '#6366f1')
                    : 'rgba(51, 65, 85, 0.5)',
                  color: statusFilter === st ? '#ffffff' : '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Capacity Table with Horizontal Scroll Support */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%',
          minWidth: '850px',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '13px'
        }}>
          <thead>
            <tr style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#94a3b8',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '12px 16px', width: '22%' }}>Work Centre</th>
              <th style={{ padding: '12px 14px', width: '15%' }}>Period & Window</th>
              <th style={{ padding: '12px 14px', width: '13%', textAlign: 'right' }}>Hours Available</th>
              <th style={{ padding: '12px 14px', width: '12%', textAlign: 'right' }}>Hours Used</th>
              <th style={{ padding: '12px 16px', width: '20%' }}>Machine Load (%)</th>
              <th style={{ padding: '12px 14px', width: '10%', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px 16px', width: '8%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPeriods.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  No capacity periods match the selected filters. Try resetting the search or status filters.
                </td>
              </tr>
            ) : (
              filteredPeriods.map(row => {
                const isSelected = selectedPeriod && selectedPeriod._id === row._id;
                const isBottleneck = row.status === 'Bottleneck' || row.utilizationPct > 100;

                return (
                  <tr
                    key={row._id}
                    onClick={() => onSelectPeriod(row)}
                    style={{
                      borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                      background: isSelected
                        ? 'rgba(99, 102, 241, 0.16)'
                        : isBottleneck
                        ? 'rgba(239, 68, 68, 0.05)'
                        : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      boxShadow: isSelected ? 'inset 4px 0 0 #6366f1' : 'none'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(51, 65, 85, 0.35)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isBottleneck ? 'rgba(239, 68, 68, 0.05)' : 'transparent';
                      }
                    }}
                  >
                    {/* Work Center */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: isBottleneck ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isBottleneck ? '#f87171' : '#818cf8',
                          flexShrink: 0
                        }}>
                          <Factory size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f1f5f9' }}>
                            {row.workCenterId?.name || 'Work Center'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono, monospace)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'rgba(51, 65, 85, 0.7)',
                              color: '#cbd5e1'
                            }}>
                              {row.workCenterId?.code || 'WC'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              Eff: {((row.workCenterId?.efficiencyRate || 1.0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Period & Dates */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 700, color: '#f1f5f9' }}>
                          {row.periodLabel}
                        </span>
                        {row.startDate && row.endDate ? (
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={11} />
                            {new Date(row.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(row.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>5 Days Standard Shift</span>
                        )}
                      </div>
                    </td>

                    {/* Hours Available */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: '#34d399'
                      }}>
                        {(row.availableHrs || 0).toFixed(1)} hrs
                      </span>
                    </td>

                    {/* Hours Used */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: isBottleneck ? '#ef4444' : '#f1f5f9'
                      }}>
                        {(row.utilizedHrs || 0).toFixed(1)} hrs
                      </span>
                    </td>

                    {/* Machine Used (%) Bar */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          flex: 1,
                          height: '8px',
                          background: 'rgba(51, 65, 85, 0.5)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          {/* 100% Marker tick */}
                          <div style={{
                            position: 'absolute',
                            right: '0',
                            top: 0,
                            bottom: 0,
                            width: '2px',
                            background: 'rgba(255, 255, 255, 0.3)',
                            zIndex: 2
                          }} />
                          <div style={{
                            height: '100%',
                            width: `${Math.min(row.utilizationPct || 0, 100)}%`,
                            background: getBarColor(row.utilizationPct),
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono, monospace)',
                          minWidth: '48px',
                          textAlign: 'right',
                          color: isBottleneck ? '#ef4444' : row.utilizationPct > 80 ? '#f59e0b' : '#f1f5f9'
                        }}>
                          {(row.utilizationPct || 0).toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {getStatusBadge(row.status, row.utilizationPct)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {/* Overtime Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenOvertime(row);
                          }}
                          title="Inject Overtime Hours"
                          style={{
                            background: 'rgba(99, 102, 241, 0.2)',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            borderRadius: '6px',
                            padding: '5px',
                            cursor: 'pointer',
                            color: '#a5b4fc',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.4)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                        >
                          <PlusCircle size={14} />
                        </button>

                        {/* Inspect Loads Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPeriod(row);
                          }}
                          title="Inspect Work Order Loads"
                          style={{
                            background: isSelected ? '#4f46e5' : 'rgba(51, 65, 85, 0.6)',
                            border: '1px solid rgba(148, 163, 184, 0.25)',
                            borderRadius: '6px',
                            padding: '5px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                        >
                          <Layers size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Notes */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid rgba(148, 163, 184, 0.15)',
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={12} />
          <span>Finite CRP Engine: Work orders exceeding 100% capacity are locked against production dispatch.</span>
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <span><strong style={{ color: '#ef4444' }}>●</strong> Bottleneck &gt;100%</span>
          <span><strong style={{ color: '#10b981' }}>●</strong> Optimal 60-100%</span>
          <span><strong style={{ color: '#06b6d4' }}>●</strong> Underutilized &lt;60%</span>
        </div>
      </div>
    </div>
  );
};

export default PeriodCapacityLedger;
