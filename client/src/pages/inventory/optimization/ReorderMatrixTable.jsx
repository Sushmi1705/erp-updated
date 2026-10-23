import React, { useState, useMemo } from 'react';
import { 
  Search, ChevronDown, ChevronRight, Layers, ArrowRight, 
  Shield, Edit3, ShoppingCart, AlertCircle, AlertTriangle, 
  ShieldAlert, CheckCircle2, Clock, Scale, Tag, ArrowUpDown, 
  ExternalLink, BarChart3, HelpCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReorderThresholdGauge from './ReorderThresholdGauge';

const ReorderMatrixTable = ({
  profiles = [],
  loading = false,
  onOpenProfileModal,
  onOpenParamModal
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [abcFilter, setAbcFilter] = useState('ALL'); // ALL, A, B, C
  const [healthFilter, setHealthFilter] = useState('ALL'); // ALL, REORDER, BREACH, HEALTHY
  const [riskFilter, setRiskFilter] = useState('ALL'); // ALL, Normal, Slow, Dead
  const [expandedRows, setExpandedRows] = useState({});
  const [sortField, setSortField] = useState('materialName');
  const [sortDirection, setSortDirection] = useState('asc');

  // Filtering
  const filteredData = useMemo(() => {
    return profiles.filter(p => {
      const mat = p.Material_ID || {};
      const matName = mat.name || '';
      const matCode = mat.code || '';
      const matGrade = mat.grade || '';
      const catName = p.categoryName || '';

      // Search match
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches = matName.toLowerCase().includes(query) ||
          matCode.toLowerCase().includes(query) ||
          matGrade.toLowerCase().includes(query) ||
          catName.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // ABC filter
      if (abcFilter !== 'ALL' && p.ABC_Class !== abcFilter) {
        return false;
      }

      // Health filter
      if (healthFilter === 'REORDER' && !p.isReorderTriggered) return false;
      if (healthFilter === 'BREACH' && !p.isSafetyBreached) return false;
      if (healthFilter === 'HEALTHY' && (p.isReorderTriggered || p.isSafetyBreached)) return false;

      // Risk filter
      if (riskFilter === 'Normal' && p.Dead_Stock_Risk !== 'Low Risk') return false;
      if (riskFilter === 'Slow' && p.Dead_Stock_Risk !== 'High Risk' && p.Dead_Stock_Risk !== 'Medium Risk') return false;
      if (riskFilter === 'Dead' && p.Dead_Stock_Risk !== 'Dead') return false;

      return true;
    }).sort((a, b) => {
      let valA, valB;
      if (sortField === 'materialName') {
        valA = a.Material_ID?.name || '';
        valB = b.Material_ID?.name || '';
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortField === 'reorderLevel') {
        valA = a.Reorder_Level || 0;
        valB = b.Reorder_Level || 0;
      } else if (sortField === 'safetyStock') {
        valA = a.Safety_Stock || 0;
        valB = b.Safety_Stock || 0;
      } else if (sortField === 'atp') {
        valA = a.atp || 0;
        valB = b.atp || 0;
      } else {
        valA = a[sortField] || 0;
        valB = b[sortField] || 0;
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [profiles, searchTerm, abcFilter, healthFilter, riskFilter, sortField, sortDirection]);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const next = {};
    filteredData.forEach(p => { next[p._id] = true; });
    setExpandedRows(next);
  };

  const collapseAll = () => {
    setExpandedRows({});
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Search & Filter Toolbar */}
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={15} 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} 
            />
            <input
              type="text"
              placeholder="Search by material name, part code, grade, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* ABC Class Filter Chips */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setAbcFilter('ALL')}
              style={{
                padding: '4px 9px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: abcFilter === 'ALL' ? '#b45309' : 'transparent',
                color: abcFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              All ABC
            </button>
            {['A', 'B', 'C'].map(cls => (
              <button
                key={cls}
                onClick={() => setAbcFilter(cls)}
                style={{
                  padding: '4px 9px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: abcFilter === cls ? '#b45309' : 'transparent',
                  color: abcFilter === cls ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                Class {cls}
              </button>
            ))}
          </div>

          {/* Health Filter Chips */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setHealthFilter('ALL')}
              style={{
                padding: '4px 9px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: healthFilter === 'ALL' ? '#0f172a' : 'transparent',
                color: healthFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              All States
            </button>
            <button
              onClick={() => setHealthFilter('REORDER')}
              style={{
                padding: '4px 9px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: healthFilter === 'REORDER' ? '#d97706' : 'transparent',
                color: healthFilter === 'REORDER' ? '#ffffff' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <AlertCircle size={11} />
              Reorder Due
            </button>
            <button
              onClick={() => setHealthFilter('BREACH')}
              style={{
                padding: '4px 9px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: healthFilter === 'BREACH' ? '#dc2626' : 'transparent',
                color: healthFilter === 'BREACH' ? '#ffffff' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <ShieldAlert size={11} />
              Deficit
            </button>
          </div>

          {/* Drawer Toggle */}
          <button
            onClick={Object.keys(expandedRows).length > 0 ? collapseAll : expandAll}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Layers size={13} />
            {Object.keys(expandedRows).length > 0 ? 'Collapse Details' : 'Expand All Thresholds'}
          </button>
        </div>
      </div>

      {/* Main Reorder Table */}
      <div 
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ width: '38px', padding: '12px 8px 12px 14px', textAlign: 'center' }}></th>
                <th 
                  onClick={() => handleSort('materialName')}
                  style={{ padding: '12px 14px', cursor: 'pointer', fontWeight: 600 }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Material & Specification
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Part Code</th>
                <th 
                  onClick={() => handleSort('atp')}
                  style={{ padding: '12px 14px', minWidth: '170px', cursor: 'pointer', fontWeight: 600 }}
                  title="Current Available-to-Promise vs Reorder Point (ROP) & Safety Stock zones"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Current Stock vs ROP Meter
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('reorderLevel')}
                  style={{ padding: '12px 14px', textAlign: 'right', cursor: 'pointer', fontWeight: 600 }}
                  title="When free stock falls to this figure, trigger a purchase requisition"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', width: '100%' }}>
                    Reorder Level (ROP)
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('safetyStock')}
                  style={{ padding: '12px 14px', textAlign: 'right', cursor: 'pointer', fontWeight: 600 }}
                  title="The non-negotiable minimum safety buffer kept for supply delays and demand surges"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', width: '100%' }}>
                    Safety Buffer
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>Set By Hand</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>Importance (ABC)</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>Movement Velocity</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>Last Checked</th>
                <th style={{ padding: '12px 14px 12px 8px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', border: '3px solid #b45309', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span>Loading material reorder policies and safety thresholds...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Layers size={32} color="var(--text-tertiary)" />
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                        No material profiles matching filters
                      </div>
                      <div style={{ fontSize: '12px', maxWidth: '420px' }}>
                        {searchTerm || abcFilter !== 'ALL' || healthFilter !== 'ALL'
                          ? 'Try clearing your search query or adjusting your ABC filters.'
                          : 'Click “Check All Materials” to calculate dynamic reorder levels or “Set Levels” to enter custom thresholds.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isExpanded = !!expandedRows[row._id];
                  const mat = row.Material_ID || {};
                  const isReorder = row.isReorderTriggered;
                  const isBreach = row.isSafetyBreached;

                  return (
                    <React.Fragment key={row._id || idx}>
                      <tr 
                        style={{
                          borderBottom: isExpanded ? 'none' : '1px solid var(--border-color)',
                          backgroundColor: isExpanded 
                            ? 'var(--bg-secondary)' 
                            : (idx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'),
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* Expand Toggle */}
                        <td style={{ padding: '12px 8px 12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleRow(row._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px',
                              cursor: 'pointer',
                              color: isExpanded ? '#b45309' : 'var(--text-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px'
                            }}
                            title={isExpanded ? 'Collapse policy details' : 'Expand full threshold formula & logistics parameters'}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>

                        {/* Material Description & Grade */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                            {mat.name || 'Unnamed Material'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            {mat.grade && (
                              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(180, 83, 9, 0.1)', color: '#b45309', fontWeight: 600 }}>
                                {mat.grade}
                              </span>
                            )}
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                              {row.categoryName}
                            </span>
                          </div>
                        </td>

                        {/* Part Code */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {mat.code || 'MAT-00X'}
                          </span>
                        </td>

                        {/* Current Stock vs ROP Meter */}
                        <td style={{ padding: '12px 14px' }}>
                          <ReorderThresholdGauge
                            atp={row.atp || 0}
                            reorderLevel={row.Reorder_Level || 0}
                            safetyStock={row.Safety_Stock || 0}
                            uom={row.uom || 'KG'}
                            isReorderTriggered={isReorder}
                            isSafetyBreached={isBreach}
                          />
                        </td>

                        {/* Reorder Level (ROP) */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                            {(row.Reorder_Level || 0).toLocaleString()}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                            {row.uom || 'KG'}
                          </span>
                        </td>

                        {/* Safety Stock */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <strong style={{ fontSize: '13px', color: '#b45309' }}>
                            {(row.Safety_Stock || 0).toLocaleString()}
                          </strong>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginLeft: '3px' }}>
                            {row.uom || 'KG'}
                          </span>
                        </td>

                        {/* Set by Hand (Manual Override) */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {row.Is_Manual_Override ? (
                            <span 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                padding: '3px 8px', 
                                borderRadius: '12px', 
                                backgroundColor: 'rgba(217, 119, 6, 0.1)', 
                                color: '#d97706', 
                                fontSize: '11px', 
                                fontWeight: 600 
                              }}
                              title="Set by hand: protected against automatic analysis overwrites"
                            >
                              <Shield size={12} />
                              Yes
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                              Auto (Rule)
                            </span>
                          )}
                        </td>

                        {/* ABC Classification */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '12px',
                              backgroundColor: row.ABC_Class === 'A' ? 'rgba(37, 99, 235, 0.12)' : row.ABC_Class === 'B' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                              color: row.ABC_Class === 'A' ? '#2563eb' : row.ABC_Class === 'B' ? '#d97706' : '#64748b',
                              border: `1px solid ${row.ABC_Class === 'A' ? 'rgba(37, 99, 235, 0.3)' : row.ABC_Class === 'B' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                            }}
                            title={row.ABC_Class === 'A' ? 'Class A: High-value critical stock (70% capital)' : row.ABC_Class === 'B' ? 'Class B: Moderate value (20% capital)' : 'Class C: Low value bulk parts (10% capital)'}
                          >
                            {row.ABC_Class || 'C'}
                          </span>
                        </td>

                        {/* Movement Velocity / Dead Stock Risk */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {row.Dead_Stock_Risk === 'Dead' ? (
                            <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', fontSize: '11px', fontWeight: 600 }} title="Not touched for longer than threshold — money is stuck">
                              Not Moving
                            </span>
                          ) : row.Dead_Stock_Risk === 'High Risk' ? (
                            <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontSize: '11px', fontWeight: 600 }} title="Barely issued lately — check before purchasing">
                              Slow Moving
                            </span>
                          ) : (
                            <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '11px', fontWeight: 600 }} title="Issued regularly on production lines">
                              Normal
                            </span>
                          )}
                        </td>

                        {/* Last Checked */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {row.Last_Analysis_Date ? new Date(row.Last_Analysis_Date).toLocaleDateString('en-IN') : 'Active Rule'}
                        </td>

                        {/* Quick Row Actions */}
                        <td style={{ padding: '12px 14px 12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => onOpenProfileModal(row)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-secondary)',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#b45309'; e.currentTarget.style.borderColor = '#b45309'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                              title="Edit reorder point & safety buffer"
                            >
                              <Edit3 size={11} />
                              <span>Edit</span>
                            </button>

                            {isReorder && (
                              <button
                                onClick={() => navigate('/purchasing/orders')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  background: '#b45309',
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="Reorder point breached! Raise purchase order"
                              >
                                <ShoppingCart size={11} />
                                <span>PO</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Threshold & Policy Workbench Drawer */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                          <td colSpan={11} style={{ padding: '12px 20px 16px 48px' }}>
                            <div 
                              style={{
                                backgroundColor: 'var(--bg-primary)',
                                borderRadius: '8px',
                                padding: '14px 16px',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Scale size={15} color="#b45309" />
                                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                                    Replenishment Policy & Threshold Specifications — {mat.name} ({mat.code})
                                  </span>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  Policy Status: <strong>{row.Is_Manual_Override ? 'Hand Override' : 'Automated ABC Rule'}</strong>
                                </span>
                              </div>

                              {/* Attributes Grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px' }}>
                                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Free ATP</div>
                                  <div style={{ fontSize: '15px', fontWeight: 700, color: isBreach ? '#dc2626' : (isReorder ? '#d97706' : '#059669'), marginTop: '2px' }}>
                                    {(row.atp || 0).toLocaleString()} {row.uom}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Gross on-hand: {(row.onHand || 0).toLocaleString()}</div>
                                </div>

                                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Reorder Threshold (ROP)</div>
                                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                                    {(row.Reorder_Level || 0).toLocaleString()} {row.uom}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Trigger for new purchase order</div>
                                </div>

                                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Safety Buffer Limit</div>
                                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#b45309', marginTop: '2px' }}>
                                    {(row.Safety_Stock || 0).toLocaleString()} {row.uom}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Absolute minimum inventory limit</div>
                                </div>

                                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Replenishment Lead Time</div>
                                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={14} color="#059669" />
                                    {mat.leadTimeDays || 7} Days
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>PO placement to store dock</div>
                                </div>

                                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Standard Unit Cost</div>
                                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                                    ₹{row.standardCost || 0} / {row.uom}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Valuation: {formatCurrency(row.valuation)}</div>
                                </div>
                              </div>

                              {/* Policy Formula Notice */}
                              <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: 'rgba(180, 83, 9, 0.08)', borderRadius: '6px', border: '1px solid rgba(180, 83, 9, 0.2)', fontSize: '11px', color: '#78350f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={14} color="#b45309" />
                                <span>
                                  <strong>IATF 16949 Policy Formula:</strong> ROP = (Daily Consumption × {mat.leadTimeDays || 7} Days Lead Time) + {row.Safety_Stock} {row.uom} Safety Buffer. Whenever ATP drops below {row.Reorder_Level} {row.uom}, the purchasing department is flagged for replenishment.
                                </span>
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
        <div 
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}
        >
          <div>
            Showing <strong>{filteredData.length}</strong> of <strong>{profiles.length}</strong> material reorder profiles
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              Healthy Buffer
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              Reorder Due (ROP)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              Safety Deficit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReorderMatrixTable;
