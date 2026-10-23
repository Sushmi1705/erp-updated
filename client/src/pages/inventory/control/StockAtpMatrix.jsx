import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ChevronDown, ChevronRight, SlidersHorizontal, 
  ShieldAlert, ShieldCheck, AlertCircle, ArrowUpDown, Layers, 
  MapPin, Clock, Tag, ExternalLink, Edit3, CheckCircle2, AlertTriangle, Eye
} from 'lucide-react';
import StockAtpGauge from './StockAtpGauge';

const StockAtpMatrix = ({
  inventoryData = [],
  loading = false,
  onOpenAdjustModal,
  activeTabLabel = 'Raw Material'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL'); // ALL, SHORTAGE, WARNING, OPTIMAL
  const [expandedRows, setExpandedRows] = useState({});
  const [sortField, setSortField] = useState('Product_Name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Extract unique warehouses
  const warehouses = useMemo(() => {
    const set = new Set();
    inventoryData.forEach(item => {
      if (item.Warehouse) {
        item.Warehouse.split(',').forEach(w => set.add(w.trim()));
      }
    });
    return Array.from(set).filter(Boolean);
  }, [inventoryData]);

  // Filtering and Sorting
  const filteredData = useMemo(() => {
    return inventoryData.filter(item => {
      // Search match
      const query = searchTerm.toLowerCase();
      const matchesSearch = !query || 
        (item.Product_Name && item.Product_Name.toLowerCase().includes(query)) ||
        (item.Product_Code && item.Product_Code.toLowerCase().includes(query)) ||
        (item.grade && item.grade.toLowerCase().includes(query)) ||
        (item.hsnCode && item.hsnCode.toLowerCase().includes(query)) ||
        (item.Warehouse && item.Warehouse.toLowerCase().includes(query));

      // Warehouse match
      const matchesWarehouse = warehouseFilter === 'ALL' || 
        (item.Warehouse && item.Warehouse.includes(warehouseFilter));

      // Health match
      let matchesHealth = true;
      if (healthFilter === 'SHORTAGE') {
        matchesHealth = item.Exception_Flag === true || item.stockHealth === 'SAFETY_BREACH' || item.stockHealth === 'CRITICAL_OUT';
      } else if (healthFilter === 'WARNING') {
        matchesHealth = item.stockHealth === 'REORDER_WARNING';
      } else if (healthFilter === 'OPTIMAL') {
        matchesHealth = !item.Exception_Flag && item.stockHealth === 'OPTIMAL';
      }

      return matchesSearch && matchesWarehouse && matchesHealth;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        valA = valA || 0;
        valB = valB || 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
    });
  }, [inventoryData, searchTerm, warehouseFilter, healthFilter, sortField, sortDirection]);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const next = {};
    filteredData.forEach(item => { next[item._id] = true; });
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={15} 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} 
            />
            <input
              type="text"
              placeholder="Search by part name, material code, grade, HSN..."
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
          {/* Warehouse Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Store:</span>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Warehouse Bays ({inventoryData.length})</option>
              {warehouses.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Health Filter Chips */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setHealthFilter('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: healthFilter === 'ALL' ? '#059669' : 'transparent',
                color: healthFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              All
            </button>
            <button
              onClick={() => setHealthFilter('SHORTAGE')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: healthFilter === 'SHORTAGE' ? '#dc2626' : 'transparent',
                color: healthFilter === 'SHORTAGE' ? '#ffffff' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldAlert size={12} />
              Shortage
            </button>
            <button
              onClick={() => setHealthFilter('WARNING')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: healthFilter === 'WARNING' ? '#d97706' : 'transparent',
                color: healthFilter === 'WARNING' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              Reorder Watch
            </button>
            <button
              onClick={() => setHealthFilter('OPTIMAL')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: healthFilter === 'OPTIMAL' ? '#10b981' : 'transparent',
                color: healthFilter === 'OPTIMAL' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              Healthy
            </button>
          </div>

          {/* Batch Drawer Toggles */}
          <button
            onClick={Object.keys(expandedRows).length > 0 ? collapseAll : expandAll}
            style={{
              padding: '6px 10px',
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
            {Object.keys(expandedRows).length > 0 ? 'Collapse Batches' : 'Expand All Batches'}
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
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
                  onClick={() => handleSort('Product_Name')}
                  style={{ padding: '12px 14px', cursor: 'pointer', fontWeight: 600 }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Item & Specification
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('Product_Code')}
                  style={{ padding: '12px 14px', cursor: 'pointer', fontWeight: 600 }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Part Code
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Store Location</th>
                <th 
                  onClick={() => handleSort('Total_On_Hand')}
                  style={{ padding: '12px 14px', textAlign: 'right', cursor: 'pointer', fontWeight: 600 }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', width: '100%' }}>
                    Gross On-Hand
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('Total_Allocated')}
                  style={{ padding: '12px 14px', textAlign: 'right', cursor: 'pointer', fontWeight: 600 }}
                  title="Committed to Work Orders or Sales Orders"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', width: '100%' }}>
                    Allocated
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('Available_to_Promise')}
                  style={{ padding: '12px 14px', minWidth: '170px', cursor: 'pointer', fontWeight: 600 }}
                  title="Available to Promise (On-Hand minus Allocated). Visualized with Safety Stock line."
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Free ATP Meter
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('Safety_Stock_Level')}
                  style={{ padding: '12px 14px', textAlign: 'right', cursor: 'pointer', fontWeight: 600 }}
                  title="IATF 16949 Minimum Safety Stock Buffer"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', width: '100%' }}>
                    Safety Buffer
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('valuation')}
                  style={{ padding: '12px 14px', textAlign: 'right', cursor: 'pointer', fontWeight: 600 }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', width: '100%' }}>
                    Valuation
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>Health</th>
                <th style={{ padding: '12px 14px 12px 8px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', border: '3px solid #059669', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span>Synchronizing live inventory store balances...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Layers size={32} color="var(--text-tertiary)" />
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                        No stock records matching criteria
                      </div>
                      <div style={{ fontSize: '12px', maxWidth: '400px' }}>
                        {searchTerm || warehouseFilter !== 'ALL' || healthFilter !== 'ALL'
                          ? 'Try resetting your search query or warehouse filter.'
                          : 'No inventory currently recorded in this category. Stock appears once received and put away.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isExpanded = !!expandedRows[row._id];
                  const hasBatches = row.batches && row.batches.length > 0;
                  const isShortage = row.Exception_Flag || row.stockHealth === 'SAFETY_BREACH' || row.stockHealth === 'CRITICAL_OUT';

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
                        {/* Expand Button Column */}
                        <td style={{ padding: '12px 8px 12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleRow(row._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px',
                              cursor: 'pointer',
                              color: isExpanded ? '#059669' : 'var(--text-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px'
                            }}
                            title={isExpanded ? 'Collapse batch breakdown' : `View ${row.batches?.length || 0} physical batch locations`}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>

                        {/* Part Name & Specs */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                            {row.Product_Name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                            {row.grade && (
                              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: 600 }}>
                                {row.grade}
                              </span>
                            )}
                            {row.hsnCode && (
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                HSN: {row.hsnCode}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Part Code */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {row.Product_Code}
                          </span>
                        </td>

                        {/* Warehouse Location */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)', fontSize: '12px' }}>
                            <MapPin size={13} color="#059669" />
                            <span>{row.Warehouse || 'Central Warehouse'}</span>
                          </div>
                        </td>

                        {/* Gross On Hand */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                            {row.Total_On_Hand.toLocaleString()}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                            {row.uom || 'KG'}
                          </span>
                        </td>

                        {/* Allocated / Committed */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span 
                            style={{ 
                              color: row.Total_Allocated > 0 ? '#d97706' : 'var(--text-secondary)', 
                              fontWeight: row.Total_Allocated > 0 ? 600 : 400 
                            }}
                            title="Set aside for active work orders or customer dispatch — unavailable for new commitments"
                          >
                            {row.Total_Allocated.toLocaleString()}
                          </span>
                        </td>

                        {/* Available to Promise (ATP) with Composite Visual Meter */}
                        <td style={{ padding: '12px 14px' }}>
                          <StockAtpGauge 
                            onHand={row.Total_On_Hand}
                            allocated={row.Total_Allocated}
                            atp={row.Available_to_Promise}
                            safetyStock={row.Safety_Stock_Level}
                            uom={row.uom}
                            isBreached={isShortage}
                          />
                        </td>

                        {/* Safety Stock Level */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {row.Safety_Stock_Level.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginLeft: '3px' }}>
                            {row.uom || 'KG'}
                          </span>
                        </td>

                        {/* Valuation */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
                            {formatCurrency(row.valuation)}
                          </div>
                          {row.standardCost > 0 && (
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                              @ ₹{row.standardCost}/{row.uom || 'kg'}
                            </div>
                          )}
                        </td>

                        {/* Health Status */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {isShortage ? (
                            <span 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                padding: '3px 8px', 
                                borderRadius: '12px', 
                                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                color: '#dc2626', 
                                fontSize: '11px', 
                                fontWeight: 600 
                              }}
                              title={`Deficit of ${(row.shortageQuantity || 0).toLocaleString()} ${row.uom || 'units'} below safety stock`}
                            >
                              <ShieldAlert size={12} />
                              Shortage
                            </span>
                          ) : row.stockHealth === 'REORDER_WARNING' ? (
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
                              title="Stock is approaching reorder threshold"
                            >
                              <AlertTriangle size={12} />
                              Reorder
                            </span>
                          ) : (
                            <span 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                padding: '3px 8px', 
                                borderRadius: '12px', 
                                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                                color: '#059669', 
                                fontSize: '11px', 
                                fontWeight: 600 
                              }}
                              title="Stock level is safe and above safety threshold"
                            >
                              <CheckCircle2 size={12} />
                              Healthy
                            </span>
                          )}
                        </td>

                        {/* Quick Row Actions */}
                        <td style={{ padding: '12px 14px 12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => onOpenAdjustModal(row)}
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
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#059669'; e.currentTarget.style.borderColor = '#059669'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                            title="Perform cycle count physical stock adjustment"
                          >
                            <Edit3 size={11} />
                            <span>Adjust</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Batch / Bin Drill-down Sub-Drawer */}
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Layers size={14} color="#059669" />
                                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                                    Physical Batch & Bay Rack Ledger — {row.Product_Name} ({row.Product_Code})
                                  </span>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  {hasBatches ? `${row.batches.length} active lots recorded` : 'Single aggregate lot in main store'}
                                </span>
                              </div>

                              {hasBatches ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase' }}>
                                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Batch / Heat #</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Store Bay / Rack</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Lot Available</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Allocated</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Net ATP</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Lot Status</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Inward Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.batches.map((batch, bIdx) => (
                                      <tr key={batch._id || bIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 600, color: '#059669' }}>
                                          {batch.batchNumber}
                                        </td>
                                        <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>
                                          {batch.warehouse} • <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{batch.bin}</span>
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                                          {batch.quantityAvailable.toLocaleString()} {row.uom}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#d97706' }}>
                                          {batch.allocatedQuantity.toLocaleString()} {row.uom}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                          {batch.atp.toLocaleString()} {row.uom}
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: batch.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)', color: batch.status === 'Active' ? '#059669' : '#d97706', fontWeight: 600 }}>
                                            {batch.status}
                                          </span>
                                        </td>
                                        <td style={{ padding: '6px 8px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                                          {batch.postingDate ? new Date(batch.postingDate).toLocaleDateString() : 'Active Stock'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px 0' }}>
                                  Aggregated in <strong>{row.Warehouse}</strong> with primary bin allocation. No separate batch split required for standard continuous coil.
                                </div>
                              )}
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

        {/* Footer Ledger Status */}
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
            Showing <strong>{filteredData.length}</strong> of <strong>{inventoryData.length}</strong> {activeTabLabel} items
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              Healthy ATP
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              Reorder Watch
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              Safety Shortage
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAtpMatrix;
