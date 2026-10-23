import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  UserPlus, 
  Layers, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Sun, 
  Sunset, 
  Moon, 
  Award, 
  Info,
  ChevronRight
} from 'lucide-react';

const MasterLaborLedger = ({
  periods = [],
  selectedPeriod,
  onSelectPeriod,
  onOpenPlanWorkforce,
  statusFilter,
  setStatusFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [shiftFilter, setShiftFilter] = useState('All');
  const [sortBy, setSortBy] = useState('shortfall-first');

  // Extract unique departments for filters
  const uniqueDepartments = useMemo(() => {
    const map = new Map();
    periods.forEach(p => {
      if (p.departmentId && p.departmentId.name) {
        map.set(p.departmentId.name, p.departmentId.code || p.departmentId.name);
      }
    });
    return Array.from(map.entries());
  }, [periods]);

  // Filter and sort periods
  const filteredPeriods = useMemo(() => {
    return periods
      .filter(p => {
        // Search
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const dName = p.departmentId?.name?.toLowerCase() || '';
          const dCode = p.departmentId?.code?.toLowerCase() || '';
          const sName = p.shiftName?.toLowerCase() || '';
          const pLabel = p.periodLabel?.toLowerCase() || '';
          if (!dName.includes(term) && !dCode.includes(term) && !sName.includes(term) && !pLabel.includes(term)) {
            return false;
          }
        }

        // Department filter
        if (deptFilter !== 'All' && p.departmentId?.name !== deptFilter) {
          return false;
        }

        // Shift filter
        if (shiftFilter !== 'All' && p.shiftName !== shiftFilter) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'All') {
          if (statusFilter === 'Understaffed' && p.status !== 'Understaffed' && p.varianceHrs >= 0) return false;
          if (statusFilter === 'Skill Constraint' && p.status !== 'Skill Constraint') return false;
          if (statusFilter === 'Optimal' && p.status !== 'Optimal') return false;
          if (statusFilter === 'Overstaffed' && p.status !== 'Overstaffed') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'shortfall-first') return (a.varianceHrs || 0) - (b.varianceHrs || 0);
        if (sortBy === 'surplus-first') return (b.varianceHrs || 0) - (a.varianceHrs || 0);
        if (sortBy === 'headcount-desc') return (b.headcount || 0) - (a.headcount || 0);
        if (sortBy === 'dept-asc') return (a.departmentId?.name || '').localeCompare(b.departmentId?.name || '');
        if (sortBy === 'shift-asc') return (a.shiftName || '').localeCompare(b.shiftName || '');
        return 0;
      });
  }, [periods, searchTerm, deptFilter, shiftFilter, statusFilter, sortBy]);

  const getShiftCapsule = (shiftName) => {
    if (shiftName === 'Morning') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 8px',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontSize: '11px',
          fontWeight: 700
        }}>
          <Sun size={12} color="#f59e0b" />
          Morning (06:00 - 14:00)
        </span>
      );
    }
    if (shiftName === 'Evening') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 8px',
          borderRadius: '12px',
          background: 'rgba(6, 182, 212, 0.15)',
          color: '#38bdf8',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          fontSize: '11px',
          fontWeight: 700
        }}>
          <Sunset size={12} color="#06b6d4" />
          Evening (14:00 - 22:00)
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        borderRadius: '12px',
        background: 'rgba(139, 92, 246, 0.15)',
        color: '#c084fc',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        fontSize: '11px',
        fontWeight: 700
      }}>
        <Moon size={12} color="#8b5cf6" />
        Night (22:00 - 06:00)
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'Understaffed') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.4)',
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
          Understaffed
        </span>
      );
    }
    if (status === 'Skill Constraint') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(168, 85, 247, 0.15)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          fontSize: '11px',
          fontWeight: 700,
          whiteSpace: 'nowrap'
        }}>
          <Award size={12} />
          Skill Constraint
        </span>
      );
    }
    if (status === 'Overstaffed') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          fontSize: '11px',
          fontWeight: 600,
          whiteSpace: 'nowrap'
        }}>
          Overstaffed
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
        background: 'rgba(16, 185, 129, 0.15)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        fontSize: '11px',
        fontWeight: 700,
        whiteSpace: 'nowrap'
      }}>
        <CheckCircle2 size={12} />
        Optimal
      </span>
    );
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6, 44, 43, 0.85) 0%, rgba(10, 25, 30, 0.95) 100%)',
      border: '1px solid rgba(16, 185, 129, 0.25)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.25)'
    }}>
      {/* Header and Filter Toolbar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
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
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <Users size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                Master Manpower Roster Ledger
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                Click any shift row to inspect work order operations and re-balance operator allocation.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Showing <strong style={{ color: '#f1f5f9' }}>{filteredPeriods.length}</strong> of {periods.length} Shift Rosters
            </span>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={13} color="#94a3b8" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: 'rgba(10, 25, 30, 0.7)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="shortfall-first">Shortfall / Deficit First</option>
                <option value="surplus-first">Most Surplus First</option>
                <option value="headcount-desc">Highest Headcount</option>
                <option value="dept-asc">Department (A-Z)</option>
                <option value="shift-asc">Shift Sequence</option>
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
              placeholder="Search Department or Shift..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(10, 25, 30, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '6px',
                padding: '6px 10px 6px 30px',
                color: '#f1f5f9',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Department Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Dept:</span>
            <button
              onClick={() => setDeptFilter('All')}
              style={{
                background: deptFilter === 'All' ? '#059669' : 'rgba(51, 65, 85, 0.5)',
                color: deptFilter === 'All' ? '#ffffff' : '#94a3b8',
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
            {uniqueDepartments.map(([dName, dCode]) => (
              <button
                key={dName}
                onClick={() => setDeptFilter(deptFilter === dName ? 'All' : dName)}
                style={{
                  background: deptFilter === dName ? '#059669' : 'rgba(51, 65, 85, 0.5)',
                  color: deptFilter === dName ? '#ffffff' : '#cbd5e1',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {dName}
              </button>
            ))}
          </div>

          {/* Shift Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Shift:</span>
            {['All', 'Morning', 'Evening', 'Night'].map(shift => (
              <button
                key={shift}
                onClick={() => setShiftFilter(shiftFilter === shift ? 'All' : shift)}
                style={{
                  background: shiftFilter === shift ? '#0d9488' : 'rgba(51, 65, 85, 0.5)',
                  color: shiftFilter === shift ? '#ffffff' : '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {shift}
              </button>
            ))}
          </div>

          {/* Status Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Status:</span>
            {['All', 'Understaffed', 'Skill Constraint', 'Optimal', 'Overstaffed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st
                    ? (st === 'Understaffed' ? '#ef4444' : st === 'Skill Constraint' ? '#a855f7' : st === 'Overstaffed' ? '#f59e0b' : '#10b981')
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

      {/* Table with Horizontal Scroll Support */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%',
          minWidth: '880px',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '13px'
        }}>
          <thead>
            <tr style={{
              background: 'rgba(10, 25, 30, 0.85)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#94a3b8',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '12px 16px', width: '18%' }}>Department</th>
              <th style={{ padding: '12px 14px', width: '18%' }}>Shift</th>
              <th style={{ padding: '12px 12px', width: '10%' }}>Period</th>
              <th style={{ padding: '12px 14px', width: '11%', textAlign: 'center' }}>Operators</th>
              <th style={{ padding: '12px 14px', width: '12%', textAlign: 'right' }}>Hours Available</th>
              <th style={{ padding: '12px 14px', width: '12%', textAlign: 'right' }}>Hours Planned</th>
              <th style={{ padding: '12px 14px', width: '14%', textAlign: 'right' }}>Spare / Short (hrs)</th>
              <th style={{ padding: '12px 14px', width: '13%', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px 16px', width: '8%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPeriods.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  No manpower capacity periods match the selected filters.
                </td>
              </tr>
            ) : (
              filteredPeriods.map(row => {
                const isSelected = selectedPeriod && selectedPeriod._id === row._id;
                const isShort = row.varianceHrs < 0 || row.status === 'Understaffed';

                return (
                  <tr
                    key={row._id}
                    onClick={() => onSelectPeriod(row)}
                    style={{
                      borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
                      background: isSelected
                        ? 'rgba(16, 185, 129, 0.18)'
                        : isShort
                        ? 'rgba(239, 68, 68, 0.05)'
                        : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      boxShadow: isSelected ? 'inset 4px 0 0 #10b981' : 'none'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(51, 65, 85, 0.35)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isShort ? 'rgba(239, 68, 68, 0.05)' : 'transparent';
                      }
                    }}
                  >
                    {/* Department */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: isShort ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isShort ? '#f87171' : '#34d399',
                          flexShrink: 0
                        }}>
                          <Users size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f1f5f9' }}>
                            {row.departmentId?.name || 'Department'}
                          </div>
                          <span style={{
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono, monospace)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'rgba(51, 65, 85, 0.6)',
                            color: '#cbd5e1'
                          }}>
                            {row.departmentId?.code || 'DEPT'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Shift */}
                    <td style={{ padding: '12px 14px' }}>
                      {getShiftCapsule(row.shiftName)}
                    </td>

                    {/* Period */}
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ fontWeight: 700, color: '#f1f5f9' }}>
                        {row.periodLabel}
                      </span>
                    </td>

                    {/* Operators */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: '#6ee7b7'
                      }}>
                        {row.headcount || 0}
                      </span>
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

                    {/* Hours Planned */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: isShort ? '#ef4444' : '#f1f5f9'
                      }}>
                        {(row.plannedHrs || 0).toFixed(1)} hrs
                      </span>
                    </td>

                    {/* Spare or Short Variance */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: row.varianceHrs < 0 ? '#ef4444' : '#34d399',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {row.varianceHrs < 0 && <AlertTriangle size={12} />}
                        {row.varianceHrs > 0 ? '+' : ''}{(row.varianceHrs || 0).toFixed(1)} hrs
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {getStatusBadge(row.status)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {/* Plan Workforce Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPlanWorkforce(row);
                          }}
                          title="Plan Manpower & Overtime"
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: '6px',
                            padding: '5px',
                            cursor: 'pointer',
                            color: '#6ee7b7',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <UserPlus size={14} />
                        </button>

                        {/* Inspect Loads Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPeriod(row);
                          }}
                          title="Inspect Labor Orders"
                          style={{
                            background: isSelected ? '#059669' : 'rgba(51, 65, 85, 0.6)',
                            border: '1px solid rgba(148, 163, 184, 0.25)',
                            borderRadius: '6px',
                            padding: '5px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
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
        borderTop: '1px solid rgba(16, 185, 129, 0.15)',
        background: 'rgba(10, 25, 30, 0.7)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={12} />
          <span>Workforce Formula: Headcount × Standard Shift Hours (8.0h) × 5 Working Days + Overtime Hours.</span>
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <span><strong style={{ color: '#ef4444' }}>●</strong> Understaffed (Deficit)</span>
          <span><strong style={{ color: '#a855f7' }}>●</strong> Skill Constraint</span>
          <span><strong style={{ color: '#10b981' }}>●</strong> Optimal</span>
          <span><strong style={{ color: '#f59e0b' }}>●</strong> Overstaffed (&gt;20% idle buffer)</span>
        </div>
      </div>
    </div>
  );
};

export default MasterLaborLedger;
