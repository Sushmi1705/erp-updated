import React, { useState, useMemo } from 'react';
import { 
  Search, ChevronDown, ChevronRight, Layers, ArrowRight, 
  ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Printer, 
  MapPin, Clock, FileText, CheckCircle2, AlertTriangle, 
  RotateCcw, Scale, Factory, Warehouse, Tag, ExternalLink 
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

const TXN_META = {
  'Material Issue': {
    label: 'Issue to Shop Floor',
    shortLabel: 'Shopfloor Issue',
    icon: Factory,
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#dc2626',
    border: 'rgba(239, 68, 68, 0.25)',
    arrow: '↳'
  },
  'Transfer': {
    label: 'Move Between Stores',
    shortLabel: 'Store Transfer',
    icon: Warehouse,
    bg: 'rgba(37, 99, 235, 0.1)',
    color: '#2563eb',
    border: 'rgba(37, 99, 235, 0.25)',
    arrow: '⇄'
  },
  'Adjustment': {
    label: 'Correction After Counting',
    shortLabel: 'Count Adjustment',
    icon: Scale,
    bg: 'rgba(217, 119, 6, 0.1)',
    color: '#d97706',
    border: 'rgba(217, 119, 6, 0.25)',
    arrow: '⚙'
  },
  'Return': {
    label: 'Return Back into Store',
    shortLabel: 'Shopfloor Return',
    icon: RotateCcw,
    bg: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
    border: 'rgba(16, 185, 129, 0.25)',
    arrow: '↰'
  }
};

const MovementLedgerTable = ({
  transactions = [],
  loading = false,
  activeType = 'ALL',
  onOpenVoucherModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Executed, Pending Approval, Draft, Reversed
  const [expandedRows, setExpandedRows] = useState({});

  // Filtering
  const filteredData = useMemo(() => {
    return transactions.filter(txn => {
      // Type match (if activeType !== 'ALL')
      if (activeType !== 'ALL' && txn.Txn_Type !== activeType) {
        return false;
      }

      // Status match
      if (statusFilter !== 'ALL' && txn.Status !== statusFilter) {
        return false;
      }

      // Search match
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesNumber = txn.Txn_Number && txn.Txn_Number.toLowerCase().includes(query);
        const matchesRef = txn.Ref_Doc_Number && txn.Ref_Doc_Number.toLowerCase().includes(query);
        const matchesRefType = txn.Ref_Doc_Type && txn.Ref_Doc_Type.toLowerCase().includes(query);
        
        // Search inside lines
        const matchesLine = txn.lines && txn.lines.some(l => 
          (l.Material_ID?.name && l.Material_ID.name.toLowerCase().includes(query)) ||
          (l.Material_ID?.code && l.Material_ID.code.toLowerCase().includes(query)) ||
          (l.Source_WH_ID?.name && l.Source_WH_ID.name.toLowerCase().includes(query)) ||
          (l.Dest_WH_ID?.name && l.Dest_WH_ID.name.toLowerCase().includes(query)) ||
          (l.batches && l.batches.some(b => b.Batch_Lot_Number && b.Batch_Lot_Number.toLowerCase().includes(query)))
        );

        return matchesNumber || matchesRef || matchesRefType || matchesLine;
      }

      return true;
    });
  }, [transactions, activeType, statusFilter, searchTerm]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={15} 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} 
            />
            <input
              type="text"
              placeholder="Search by movement # (e.g. INV-TXN-26), work order, part code, store..."
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
          {/* Status Filter Chips */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', padding: '3px', border: '1px solid var(--border-color)' }}>
            {['ALL', 'Executed', 'Pending Approval', 'Draft', 'Reversed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: statusFilter === st ? '#2563eb' : 'transparent',
                  color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
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
              gap: '5px'
            }}
          >
            <Layers size={13} />
            {Object.keys(expandedRows).length > 0 ? 'Collapse Items' : 'Expand All Items'}
          </button>
        </div>
      </div>

      {/* Main Movement Ledger Table */}
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
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Date and Time</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Movement Number</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Movement Category</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Against Document</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>Number of Items</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>Valuation</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 14px 12px 8px', textAlign: 'center', fontWeight: 600 }}>Voucher</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span>Loading stock movements ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Layers size={32} color="var(--text-tertiary)" />
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                        No stock movements found
                      </div>
                      <div style={{ fontSize: '12px', maxWidth: '420px' }}>
                        {searchTerm || statusFilter !== 'ALL' || activeType !== 'ALL'
                          ? 'Try resetting your search query or status filter.'
                          : 'Every time material leaves the store for the shop floor, moves between stores, or comes back, it is recorded here. Click “Record Stock Movement” to post a new one.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isExpanded = !!expandedRows[row._id];
                  const meta = TXN_META[row.Txn_Type] || {
                    label: row.Txn_Type,
                    shortLabel: row.Txn_Type,
                    icon: ArrowLeftRight,
                    bg: 'rgba(59, 130, 246, 0.1)',
                    color: '#2563eb',
                    border: 'rgba(59, 130, 246, 0.25)',
                    arrow: '⇄'
                  };
                  const Icon = meta.icon;
                  const lineCount = row.lines?.length || row.Total_Lines || 1;
                  const totalQty = row.totalQuantity || (row.lines ? row.lines.reduce((s, l) => s + (l.Quantity || 0), 0) : 0);

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
                              color: isExpanded ? '#2563eb' : 'var(--text-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px'
                            }}
                            title={isExpanded ? 'Collapse movement details' : `Expand ${lineCount} line items & batch lots`}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>

                        {/* Date and Time */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                            {new Date(row.Txn_Date || row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {new Date(row.Txn_Date || row.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </td>

                        {/* Movement Number */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span 
                            onClick={() => onOpenVoucherModal(row)}
                            style={{ 
                              fontFamily: 'monospace', 
                              fontWeight: 700, 
                              fontSize: '13px', 
                              color: '#2563eb',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              textUnderlineOffset: '2px'
                            }}
                            title="Click to view Material Issue Note / Transfer Voucher"
                          >
                            {row.Txn_Number}
                          </span>
                        </td>

                        {/* Movement Category with Directional Icon */}
                        <td style={{ padding: '12px 14px' }}>
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.border}`,
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            <Icon size={13} />
                            <span>{meta.label}</span>
                          </span>
                        </td>

                        {/* Against Which Document */}
                        <td style={{ padding: '12px 14px' }}>
                          {row.Ref_Doc_Number ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <FileText size={13} color="#2563eb" />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {row.Ref_Doc_Type}:
                              </span>
                              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                {row.Ref_Doc_Number}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              None (Manual Store Post)
                            </span>
                          )}
                        </td>

                        {/* Number of Items & Total Quantity */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                            {lineCount} {lineCount === 1 ? 'item' : 'items'}
                          </strong>
                          {totalQty > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {totalQty.toLocaleString()} units
                            </div>
                          )}
                        </td>

                        {/* Valuation */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
                            {formatCurrency(row.totalValuation)}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <StatusBadge value={row.Status} />
                        </td>

                        {/* Action Voucher Button */}
                        <td style={{ padding: '12px 14px 12px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => onOpenVoucherModal(row)}
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
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#2563eb'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                            title="Generate and print Material Issue Note (MIN)"
                          >
                            <Printer size={12} />
                            <span>Voucher</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Line-Item Workbench Drawer */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                          <td colSpan={9} style={{ padding: '12px 20px 16px 48px' }}>
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
                                  <Layers size={14} color="#2563eb" />
                                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                                    Movement Line Item Specification — {row.Txn_Number} ({meta.label})
                                  </span>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  Reference Document: <strong>{row.Ref_Doc_Type}: {row.Ref_Doc_Number || 'Manual'}</strong>
                                </span>
                              </div>

                              {row.lines && row.lines.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase' }}>
                                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Seq</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Part Description</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Part Code</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Quantity Moved</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Source Bay</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Destination Bay</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Tracked Batch / Lot</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Line Valuation</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.lines.map((line, lIdx) => (
                                      <tr key={line._id || lIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '6px 8px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                                          #{line.Line_Sequence || (lIdx + 1) * 10}
                                        </td>
                                        <td style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                          {line.Material_ID?.name || 'Raw Material Item'}
                                          {line.Material_ID?.grade && (
                                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '4px' }}>
                                              ({line.Material_ID.grade})
                                            </span>
                                          )}
                                        </td>
                                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                          {line.Material_ID?.code || 'MAT-00X'}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                                          {line.Quantity.toLocaleString()} {line.uom || 'KG'}
                                        </td>
                                        <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>
                                          {line.Source_WH_ID?.name || 'Central Raw Materials Warehouse'}
                                        </td>
                                        <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>
                                          {row.Txn_Type === 'Material Issue' 
                                            ? <span style={{ color: '#dc2626', fontWeight: 500 }}>Shopfloor Stamping Line (Dispatched)</span> 
                                            : (line.Dest_WH_ID?.name || 'N/A')}
                                        </td>
                                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                                          {line.batches && line.batches.length > 0
                                            ? line.batches.map(b => b.Batch_Lot_Number).join(', ')
                                            : 'BATCH-2026-AUT'}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                                          {formatCurrency(line.valuation)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px 0' }}>
                                  Movement recorded in store ledger. Click "MIN Voucher" to view printable dispatch docket.
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
            Showing <strong>{filteredData.length}</strong> of <strong>{transactions.length}</strong> stock movements
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              Executed
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              Pending Approval
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748b' }} />
              Draft
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              Reversed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementLedgerTable;
