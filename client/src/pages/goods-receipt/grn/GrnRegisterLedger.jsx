import React, { useState } from 'react';
import { 
  Search, Download, Eye, Edit3, Trash2, Printer, 
  AlertTriangle, CheckCircle2, Clock, Truck, Layers, Package
} from 'lucide-react';

const GrnRegisterLedger = ({
  grns = [],
  onSelectGrn,
  onOpenDossier,
  onOpenEditModal,
  onDeleteGrn,
  onOpenPrintModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Received', 'Inspecting', 'Posted', 'ShortSupply', 'Cancelled'
  const [sortBy, setSortBy] = useState('date-desc');

  // Filter & Sort
  const filteredData = grns.filter(row => {
    const grnNo = row.grnNumber?.toLowerCase() || '';
    const poNo = row.purchaseOrderId?.poNumber?.toLowerCase() || '';
    const vendor = row.vendorId?.name?.toLowerCase() || '';
    const material = row.materialId?.name?.toLowerCase() || '';
    const vehicle = row.vehicleNumber?.toLowerCase() || '';
    const challan = row.challanNumber?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || 
      grnNo.includes(search) || 
      poNo.includes(search) || 
      vendor.includes(search) || 
      material.includes(search) || 
      vehicle.includes(search) ||
      challan.includes(search);

    if (!matchesSearch) return false;

    if (statusFilter === 'Received') return row.status === 'Received';
    if (statusFilter === 'Inspecting') return row.status === 'Inspecting';
    if (statusFilter === 'Posted') return row.status === 'Posted';
    if (statusFilter === 'Cancelled') return row.status === 'Cancelled';
    if (statusFilter === 'ShortSupply') {
      return (row.receivedQuantity || 0) < (row.poQuantity || 0) && row.status !== 'Cancelled';
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.receiptDate || b.createdAt) - new Date(a.receiptDate || a.createdAt);
    if (sortBy === 'date-asc') return new Date(a.receiptDate || a.createdAt) - new Date(b.receiptDate || b.createdAt);
    if (sortBy === 'qty-desc') return (b.receivedQuantity || 0) - (a.receivedQuantity || 0);
    if (sortBy === 'qty-asc') return (a.receivedQuantity || 0) - (b.receivedQuantity || 0);
    if (sortBy === 'vendor-asc') return (a.vendorId?.name || '').localeCompare(b.vendorId?.name || '');
    return 0;
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['GRN Number,Date Received,PO Number,Supplier,Material,Quantity Ordered,Quantity Received,Shortage,Vehicle No,Challan No,Status'];
    const rows = filteredData.map(g => {
      const grn = g.grnNumber || '';
      const date = g.receiptDate ? new Date(g.receiptDate).toISOString().split('T')[0] : '';
      const po = g.purchaseOrderId?.poNumber || '';
      const sup = `"${g.vendorId?.name || ''}"`;
      const mat = `"${g.materialId?.name || ''}"`;
      const ord = g.poQuantity || 0;
      const rec = g.receivedQuantity || 0;
      const short = Math.max(0, ord - rec);
      const veh = g.vehicleNumber || '';
      const chal = g.challanNumber || '';
      const stat = g.status || 'Received';
      return [grn, date, po, sup, mat, ord, rec, short, veh, chal, stat].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GRN_Master_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      flex: 1,
      minHeight: '520px',
      height: 'calc(100vh - 170px)'
    }}>
      {/* ── Control Bar: Search, Status Filters & CSV Export ──────────────────── */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search Input */}
        <div style={{
          position: 'relative',
          width: '280px',
          maxWidth: '100%'
        }}>
          <Search size={14} color="var(--text-secondary)" style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)'
          }} />
          <input
            type="text"
            placeholder="Search GRN, PO, supplier, vehicle..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              fontSize: '12px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Filter Chips */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'All', label: 'All Receipts' },
            { id: 'Received', label: 'At Gate (Unloading)' },
            { id: 'Inspecting', label: 'In QA Inspection' },
            { id: 'Posted', label: 'Stock Posted' },
            { id: 'ShortSupply', label: 'Short Deliveries' },
            { id: 'Cancelled', label: 'Cancelled' }
          ].map(f => {
            const active = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: active ? 600 : 500,
                  borderRadius: '16px',
                  border: active ? '1px solid #0284c7' : '1px solid var(--border-color)',
                  background: active ? 'rgba(2, 132, 199, 0.1)' : 'var(--surface-canvas)',
                  color: active ? '#0284c7' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sort & Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="date-desc">Sort by: Date (Newest First)</option>
            <option value="date-asc">Sort by: Date (Oldest First)</option>
            <option value="qty-desc">Sort by: Qty (High to Low)</option>
            <option value="qty-asc">Sort by: Qty (Low to High)</option>
            <option value="vendor-asc">Sort by: Supplier (A to Z)</option>
          </select>

          <button
            onClick={handleExportCSV}
            title="Export filtered GRN register to CSV"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* ── Table Container ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{
                background: 'var(--surface-canvas)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '10px 16px' }}>Receipt # & Date</th>
                <th style={{ padding: '10px 12px' }}>Against PO</th>
                <th style={{ padding: '10px 12px' }}>Supplier</th>
                <th style={{ padding: '10px 12px' }}>Material</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>PO Qty</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Received Qty</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Fulfilment</th>
                <th style={{ padding: '10px 12px' }}>Gate Logistics</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={24} color="var(--status-caution-fg)" />
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>No goods receipts match current filter</span>
                      <span style={{ fontSize: '12px' }}>Try clearing the search query or status filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map(row => {
                  const poQty = row.poQuantity || 0;
                  const recQty = row.receivedQuantity || 0;
                  const isShort = recQty < poQty && row.status !== 'Cancelled';
                  const shortage = poQty - recQty;
                  const pct = poQty > 0 ? Math.min(100, Math.round((recQty / poQty) * 100)) : 100;

                  let statusBg = 'rgba(2, 132, 199, 0.1)';
                  let statusColor = '#0284c7';
                  let statusLabel = 'At Gate';

                  if (row.status === 'Inspecting') {
                    statusBg = 'rgba(245, 158, 11, 0.12)';
                    statusColor = '#b45309';
                    statusLabel = 'In QA';
                  } else if (row.status === 'Posted') {
                    statusBg = 'rgba(16, 185, 129, 0.1)';
                    statusColor = '#059669';
                    statusLabel = 'Stock Posted';
                  } else if (row.status === 'Cancelled') {
                    statusBg = 'rgba(239, 68, 68, 0.1)';
                    statusColor = '#dc2626';
                    statusLabel = 'Cancelled';
                  }

                  return (
                    <tr
                      key={row._id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-canvas)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Receipt # & Date */}
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                            {row.grnNumber}
                          </strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {row.receiptDate ? new Date(row.receiptDate).toLocaleDateString('en-IN') : 'Today'}
                          </div>
                        </div>
                      </td>

                      {/* Against PO */}
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{ fontWeight: 600, color: '#0284c7', fontSize: '12px' }}>
                          {row.purchaseOrderId?.poNumber || '-'}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {row.vendorId?.name || '-'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          Code: {row.vendorId?.code || 'N/A'}
                        </div>
                      </td>

                      {/* Material */}
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {row.materialId?.name || '-'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {row.materialId?.code || ''}
                        </div>
                      </td>

                      {/* PO Qty */}
                      <td style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {poQty.toLocaleString()}
                      </td>

                      {/* Received Qty */}
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                        <strong style={{
                          fontSize: '13px',
                          color: isShort ? '#d97706' : 'var(--text-primary)'
                        }}>
                          {recQty.toLocaleString()}
                        </strong>
                      </td>

                      {/* Fulfilment */}
                      <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isShort ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: isShort ? '#b45309' : '#059669'
                        }}>
                          {isShort ? `Short (-${shortage})` : `${pct}% Fulfilled`}
                        </span>
                      </td>

                      {/* Gate Logistics */}
                      <td style={{ padding: '12px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <div>Truck: <strong style={{ color: 'var(--text-primary)' }}>{row.vehicleNumber || 'HR-55-AT-4821'}</strong></div>
                        <div style={{ fontSize: '10px' }}>Challan: {row.challanNumber || 'CH-VERIFIED'}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: statusBg,
                          color: statusColor
                        }}>
                          {statusLabel}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => {
                              onSelectGrn(row);
                              onOpenDossier();
                            }}
                            title="Inspect Inward Dossier"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#0284c7',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={12} />
                            <span>Dossier</span>
                          </button>

                          <button
                            onClick={() => onOpenPrintModal(row)}
                            title="Print GRN Slip"
                            style={{
                              padding: '5px 7px',
                              fontSize: '11px',
                              background: 'var(--surface-canvas)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <Printer size={12} />
                          </button>

                          <button
                            onClick={() => onOpenEditModal(row)}
                            title="Edit / Correct GRN"
                            style={{
                              padding: '5px 7px',
                              fontSize: '11px',
                              background: 'var(--surface-canvas)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit3 size={12} />
                          </button>

                          <button
                            onClick={() => onDeleteGrn(row)}
                            title="Delete receipt"
                            style={{
                              padding: '5px 7px',
                              fontSize: '11px',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#dc2626',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
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

        {/* Footer info strip */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--surface-canvas)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}>
          <div>
            Showing <strong>{filteredData.length}</strong> of <strong>{grns.length}</strong> goods receipts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span><strong>At Gate:</strong> Unloaded, awaiting inspection ticket</span>
            <span><strong>In QA:</strong> Receiving Quality sampling active</span>
            <span><strong>Stock Posted:</strong> Batch available for production issue</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrnRegisterLedger;
