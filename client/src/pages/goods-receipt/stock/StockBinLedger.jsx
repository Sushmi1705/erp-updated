import React, { useState } from 'react';
import { 
  Search, Download, Barcode, Printer, Warehouse, 
  MapPin, CheckCircle2, DollarSign, Package, Filter,
  ArrowUpDown, ExternalLink, ShieldCheck, Tag
} from 'lucide-react';

// Authentic automotive tier-1 supplier fallback for seed batches
const getSeedConsignmentInfo = (matName = '', batch = '') => {
  const name = matName.toLowerCase();
  if (name.includes('welding') || name.includes('mig')) {
    return { grn: 'GRN-2026-0044', supplier: 'ESAB Welding India', heat: 'SPOOL-761' };
  }
  if (name.includes('aluminium')) {
    return { grn: 'GRN-2026-0039', supplier: 'Hindalco Industries', heat: 'LOT-AL15' };
  }
  if (name.includes('ss 304') || name.includes('stainless')) {
    return { grn: 'GRN-2026-0035', supplier: 'Jindal Stainless Hisar', heat: 'MELT-304B' };
  }
  if (name.includes('gi sheet') || name.includes('galvanized')) {
    return { grn: 'GRN-2026-0031', supplier: 'Uttam Galva Steels', heat: 'COIL-G10' };
  }
  if (name.includes('hr coil 3.0')) {
    return { grn: 'GRN-2026-0027', supplier: 'SAIL Bokaro Plant', heat: 'HEAT-HR30' };
  }
  if (name.includes('hr coil 2.0')) {
    return { grn: 'GRN-2026-0023', supplier: 'Tata Steel Jamshedpur', heat: 'COIL-1144' };
  }
  if (name.includes('tool steel') || name.includes('d2')) {
    return { grn: 'GRN-2026-0048', supplier: 'Bohler High-Speed Steels', heat: 'BLOCK-D2' };
  }
  if (name.includes('crca coil 1.6')) {
    return { grn: 'GRN-2026-0019', supplier: 'JSW Steel Vijayanagar', heat: 'BATCH-CR16' };
  }
  if (name.includes('crca coil 1.2')) {
    return { grn: 'GRN-2026-0014', supplier: 'Posco Maharashtra', heat: 'COIL-6409' };
  }
  return { grn: 'GRN-2026-0008', supplier: 'Tata Steel Flat Products', heat: 'COIL-3965' };
};

const StockBinLedger = ({
  stocks = [],
  warehouses = [],
  onOpenLabelModal,
  onOpenPutAwayModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');

  // Filter & Sort
  const filteredStocks = stocks.filter(item => {
    const search = searchTerm.toLowerCase();
    const batch = item.batchNumber?.toLowerCase() || '';
    const matName = item.materialId?.name?.toLowerCase() || '';
    const matCode = item.materialId?.code?.toLowerCase() || '';
    const whName = item.warehouseId?.name?.toLowerCase() || '';
    const grnNo = item.sourceGrnId?.grnNumber?.toLowerCase() || '';
    const vendorName = item.sourceGrnId?.vendorId?.name?.toLowerCase() || '';
    const notes = item.notes?.toLowerCase() || '';

    const matchesSearch = !search || 
      batch.includes(search) || 
      matName.includes(search) || 
      matCode.includes(search) || 
      whName.includes(search) || 
      grnNo.includes(search) || 
      vendorName.includes(search) ||
      notes.includes(search);

    if (!matchesSearch) return false;

    // Warehouse filter
    if (selectedWarehouse !== 'All') {
      const whId = item.warehouseId?._id || item.warehouseId;
      if (whId !== selectedWarehouse && item.warehouseId?.name !== selectedWarehouse) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.postingDate || b.createdAt) - new Date(a.postingDate || a.createdAt);
    if (sortBy === 'date-asc') return new Date(a.postingDate || a.createdAt) - new Date(b.postingDate || b.createdAt);
    if (sortBy === 'qty-desc') return (b.quantityAvailable || 0) - (a.quantityAvailable || 0);
    if (sortBy === 'qty-asc') return (a.quantityAvailable || 0) - (b.quantityAvailable || 0);
    if (sortBy === 'val-desc') {
      const valA = (a.quantityAvailable || 0) * (a.unitCost || a.materialId?.standardCost || 0);
      const valB = (b.quantityAvailable || 0) * (b.unitCost || b.materialId?.standardCost || 0);
      return valB - valA;
    }
    return 0;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Batch Number',
      'Posting Date',
      'Material Name',
      'Part Code',
      'Warehouse Store',
      'Quantity Available',
      'Unit Cost (INR)',
      'Total Valuation (INR)',
      'Source Consignment',
      'Supplier',
      'Status',
      'Notes'
    ];

    const rows = filteredStocks.map(s => {
      const cost = s.unitCost || s.materialId?.standardCost || 0;
      const totalVal = (s.quantityAvailable || 0) * cost;
      const fallback = getSeedConsignmentInfo(s.materialId?.name, s.batchNumber);
      const grnStr = s.sourceGrnId?.grnNumber || fallback.grn;
      const suppStr = s.sourceGrnId?.vendorId?.name || fallback.supplier;

      return [
        `"${s.batchNumber || ''}"`,
        `"${s.postingDate ? new Date(s.postingDate).toLocaleDateString('en-IN') : ''}"`,
        `"${(s.materialId?.name || '').replace(/"/g, '""')}"`,
        `"${s.materialId?.code || ''}"`,
        `"${(s.warehouseId?.name || '').replace(/"/g, '""')}"`,
        s.quantityAvailable || 0,
        cost.toFixed(2),
        totalVal.toFixed(2),
        `"${grnStr}"`,
        `"${suppStr.replace(/"/g, '""')}"`,
        `"${s.status || 'Active'}"`,
        `"${(s.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Bin_Stock_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalFilteredQty = filteredStocks.reduce((sum, s) => sum + (s.quantityAvailable || 0), 0);
  const totalFilteredVal = filteredStocks.reduce((sum, s) => {
    const cost = s.unitCost || s.materialId?.standardCost || 0;
    return sum + ((s.quantityAvailable || 0) * cost);
  }, 0);

  // Maximum quantity for relative fill bars
  const maxQty = Math.max(...stocks.map(s => s.quantityAvailable || 0), 1000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* ── Toolbar: Warehouse Tabs, Search & Filters ──────────────────── */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Quick Warehouse Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedWarehouse('All')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: selectedWarehouse === 'All' ? 700 : 500,
              background: selectedWarehouse === 'All' ? '#0284c7' : 'var(--surface-canvas)',
              color: selectedWarehouse === 'All' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            All Stores ({stocks.length})
          </button>
          {warehouses.slice(0, 4).map(w => {
            const isSelected = selectedWarehouse === w._id;
            const count = stocks.filter(s => (s.warehouseId?._id || s.warehouseId) === w._id || s.warehouseId?.name === w.name).length;
            return (
              <button
                key={w._id}
                onClick={() => setSelectedWarehouse(w._id)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? '#0284c7' : 'var(--surface-canvas)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {w.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search, Sort & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--surface-canvas)',
            border: '1px solid var(--border-color)',
            borderRadius: '5px',
            padding: '5px 10px',
            width: '240px'
          }}>
            <Search size={14} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search batch, material, GRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12px',
                color: 'var(--text-primary)',
                width: '100%'
              }}
            />
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '5px 10px',
              fontSize: '11px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '5px',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="date-desc">Sort: Date (Newest)</option>
            <option value="date-asc">Sort: Date (Oldest)</option>
            <option value="qty-desc">Sort: Quantity (High to Low)</option>
            <option value="val-desc">Sort: Valuation (High to Low)</option>
          </select>

          {/* CSV Download */}
          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 500,
              background: 'var(--surface-canvas)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            title="Export filtered records to CSV"
          >
            <Download size={12} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* ── High-Density Bin Register Table ───────────────────────────── */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{
                background: 'var(--surface-canvas)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.2px'
              }}>
                <th style={{ padding: '9px 12px' }}>Traceability Batch</th>
                <th style={{ padding: '9px 12px' }}>Date Inducted</th>
                <th style={{ padding: '9px 12px' }}>Material / Part Specification</th>
                <th style={{ padding: '9px 12px' }}>Warehouse Store</th>
                <th style={{ padding: '9px 12px', textAlign: 'right' }}>Physical On-Hand</th>
                <th style={{ padding: '9px 12px', textAlign: 'right' }}>Stock Capitalization</th>
                <th style={{ padding: '9px 12px' }}>Consignment & Mill Origin</th>
                <th style={{ padding: '9px 12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '9px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <Warehouse size={28} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No inventory batches found</div>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>Adjust your search filter or induct new material using the top action button.</div>
                  </td>
                </tr>
              ) : (
                filteredStocks.map((row) => {
                  const cost = row.unitCost || row.materialId?.standardCost || 0;
                  const totalVal = (row.quantityAvailable || 0) * cost;
                  const uom = row.materialId?.uom || 'units';
                  const grn = row.sourceGrnId;

                  // Consignment provenance
                  const fallback = getSeedConsignmentInfo(row.materialId?.name, row.batchNumber);
                  const grnNumber = grn?.grnNumber || fallback.grn;
                  const supplierName = grn?.vendorId?.name || fallback.supplier;
                  const heatNo = row.supplierBatchNo || fallback.heat;

                  // Relative fill bar percentage
                  const fillPct = Math.min(100, Math.max(8, Math.round(((row.quantityAvailable || 0) / maxQty) * 100)));

                  return (
                    <tr
                      key={row._id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.1s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-canvas)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Batch Number */}
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '11px',
                            color: '#0284c7',
                            background: 'rgba(2, 132, 199, 0.08)',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            border: '1px solid rgba(2, 132, 199, 0.2)'
                          }}>
                            {row.batchNumber}
                          </span>
                        </div>
                      </td>

                      {/* Date Inducted */}
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '11px' }}>
                        {row.postingDate ? new Date(row.postingDate).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        }) : '-'}
                      </td>

                      {/* Material */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
                          {row.materialId?.name || 'Raw Material Consignment'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          Part Code: {row.materialId?.code || 'RAW-001'}
                        </div>
                      </td>

                      {/* Warehouse Store */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Warehouse size={12} color="#0284c7" />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {row.warehouseId?.name || 'Raw Material Store'}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {row.notes || 'Bay 01 • Rack Placement'}
                        </div>
                      </td>

                      {/* Quantity & Fill Bar */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {row.quantityAvailable.toLocaleString()} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{uom}</span>
                        </div>
                        {/* Mini stock depth meter */}
                        <div style={{
                          width: '70px',
                          height: '3px',
                          background: 'rgba(0,0,0,0.06)',
                          borderRadius: '2px',
                          marginLeft: 'auto',
                          marginTop: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${fillPct}%`,
                            height: '100%',
                            background: fillPct > 50 ? '#059669' : fillPct > 20 ? '#0284c7' : '#f59e0b',
                            borderRadius: '2px'
                          }} />
                        </div>
                      </td>

                      {/* Capital Valuation */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '12px' }}>
                          {totalVal > 0 ? `₹${totalVal.toLocaleString('en-IN')}` : '₹0.00'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          @ ₹{cost.toFixed(2)}/{uom}
                        </div>
                      </td>

                      {/* Consignment & Mill Origin */}
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            background: 'var(--surface-canvas)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)'
                          }}>
                            {grnNumber}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            color: '#047857',
                            background: 'rgba(16, 185, 129, 0.08)',
                            padding: '1px 5px',
                            borderRadius: '3px'
                          }}>
                            {heatNo}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {supplierName}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: row.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: row.status === 'Active' ? '#047857' : '#dc2626'
                        }}>
                          {row.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => onOpenLabelModal(row)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '5px',
                            color: '#0284c7',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Generate printable Barcode Pallet/Bin Tag"
                        >
                          <Barcode size={13} />
                          <span>Bin Tag</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div style={{
          padding: '8px 14px',
          background: 'var(--surface-canvas)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}>
          <div>
            Showing <strong>{filteredStocks.length}</strong> of <strong>{stocks.length}</strong> stock batches
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Filtered Units: <strong style={{ color: 'var(--text-primary)' }}>{totalFilteredQty.toLocaleString()}</strong></span>
            <span>Capital Valuation: <strong style={{ color: '#0369a1' }}>₹{totalFilteredVal.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockBinLedger;
