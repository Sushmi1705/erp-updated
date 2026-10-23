import React, { useState } from 'react';
import { 
  Search, Download, Microscope, Printer, CheckCircle2, 
  AlertTriangle, Clock, ShieldAlert, Package, Layers
} from 'lucide-react';

const InspectionRegisterLedger = ({
  inspections = [],
  onSelectInspection,
  onOpenWorkbench,
  onOpenPrintModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');

  // Filter & Sort
  const filteredData = inspections.filter(item => {
    const inspNo = item.inspectionNumber?.toLowerCase() || '';
    const grnNo = item.grnId?.grnNumber?.toLowerCase() || '';
    const matName = item.grnId?.materialId?.name?.toLowerCase() || '';
    const vendorName = item.grnId?.vendorId?.name?.toLowerCase() || '';
    const inspector = item.inspectorName?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || 
      inspNo.includes(search) || 
      grnNo.includes(search) || 
      matName.includes(search) || 
      vendorName.includes(search) ||
      inspector.includes(search);

    if (!matchesSearch) return false;

    if (statusFilter === 'Pending') return item.inspectionStatus === 'Pending';
    if (statusFilter === 'In-Progress') return item.inspectionStatus === 'In-Progress';
    if (statusFilter === 'Completed') return item.inspectionStatus === 'Completed';
    if (statusFilter === 'Hold-Review') return item.inspectionStatus === 'Hold-Review';
    if (statusFilter === 'Rejections') return (item.rejectedQuantity || 0) > 0;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.createdAt || b.inspectionDate) - new Date(a.createdAt || a.inspectionDate);
    if (sortBy === 'date-asc') return new Date(a.createdAt || a.inspectionDate) - new Date(b.createdAt || b.inspectionDate);
    if (sortBy === 'lot-desc') return (b.inspectedQuantity || 0) - (a.inspectedQuantity || 0);
    if (sortBy === 'rejected-desc') return (b.rejectedQuantity || 0) - (a.rejectedQuantity || 0);
    return 0;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['Inspection No,Date,GRN No,Supplier,Material,Lot Quantity,Accepted (Good),Rejected (Bad),On Hold,Yield %,Inspector,Status'];
    const rows = filteredData.map(i => {
      const ino = i.inspectionNumber || '';
      const date = i.inspectionDate ? new Date(i.inspectionDate).toISOString().split('T')[0] : '';
      const grn = i.grnId?.grnNumber || '';
      const sup = `"${i.grnId?.vendorId?.name || ''}"`;
      const mat = `"${i.grnId?.materialId?.name || ''}"`;
      const lot = i.inspectedQuantity || 0;
      const good = i.acceptedQuantity || 0;
      const bad = i.rejectedQuantity || 0;
      const hold = i.holdQuantity || 0;
      const yld = lot > 0 ? ((good / lot) * 100).toFixed(1) : '100';
      const insp = `"${i.inspectorName || ''}"`;
      const stat = i.inspectionStatus || 'Pending';

      return [ino, date, grn, sup, mat, lot, good, bad, hold, yld, insp, stat].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RQA_Inspection_Audit_Register_${new Date().toISOString().split('T')[0]}.csv`);
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
      {/* ── Control Bar: Search, Filters & Export ─────────────────────────────── */}
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
            placeholder="Search inspection, GRN, material..."
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

        {/* Filter Chips */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'All', label: 'All Jobs' },
            { id: 'Pending', label: 'Pending' },
            { id: 'In-Progress', label: 'In Test' },
            { id: 'Completed', label: 'Cleared' },
            { id: 'Hold-Review', label: 'On Hold' },
            { id: 'Rejections', label: 'Rejections Only' }
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
                  border: active ? '1px solid #059669' : '1px solid var(--border-color)',
                  background: active ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-canvas)',
                  color: active ? '#059669' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sorters & Export */}
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
            <option value="date-desc">Sort: Date (Newest)</option>
            <option value="date-asc">Sort: Date (Oldest)</option>
            <option value="lot-desc">Sort: Lot Size (High → Low)</option>
            <option value="rejected-desc">Sort: Rejections (High → Low)</option>
          </select>

          <button
            onClick={handleExportCSV}
            title="Export RQA register to CSV"
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
                <th style={{ padding: '10px 16px' }}>Inspection # & Date</th>
                <th style={{ padding: '10px 12px' }}>Against GRN</th>
                <th style={{ padding: '10px 12px' }}>Material</th>
                <th style={{ padding: '10px 12px' }}>Supplier</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Lot</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Accepted (Good)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rejected (Bad)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Hold</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Pass Yield</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={24} color="var(--status-caution-fg)" />
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>No inspection records match current filter</span>
                      <span style={{ fontSize: '12px' }}>Try clearing the search query or status filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map(row => {
                  const g = row.grnId || {};
                  const m = g.materialId || {};
                  const v = g.vendorId || {};

                  const lot = row.inspectedQuantity || 0;
                  const good = row.acceptedQuantity || 0;
                  const bad = row.rejectedQuantity || 0;
                  const hold = row.holdQuantity || 0;
                  const yieldPct = lot > 0 ? ((good / lot) * 100).toFixed(1) : '100.0';

                  let statusBg = 'rgba(245, 158, 11, 0.1)';
                  let statusColor = '#d97706';
                  let statusLabel = 'Pending';

                  if (row.inspectionStatus === 'In-Progress') {
                    statusBg = 'rgba(2, 132, 199, 0.1)';
                    statusColor = '#0284c7';
                    statusLabel = 'In Test';
                  } else if (row.inspectionStatus === 'Completed') {
                    statusBg = 'rgba(16, 185, 129, 0.1)';
                    statusColor = '#059669';
                    statusLabel = 'Cleared';
                  } else if (row.inspectionStatus === 'Hold-Review') {
                    statusBg = 'rgba(239, 68, 68, 0.1)';
                    statusColor = '#dc2626';
                    statusLabel = 'On Hold';
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
                      {/* Inspection # & Date */}
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                            {row.inspectionNumber}
                          </strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {row.inspectionDate ? new Date(row.inspectionDate).toLocaleDateString('en-IN') : 'Recent'}
                          </div>
                        </div>
                      </td>

                      {/* Against GRN */}
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{ fontWeight: 600, color: '#0284c7', fontSize: '12px' }}>
                          {g.grnNumber || '-'}
                        </span>
                      </td>

                      {/* Material */}
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {m.name || 'Raw Material'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {m.code || ''}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {v.name || 'Supplier'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          Code: {v.code || 'N/A'}
                        </div>
                      </td>

                      {/* Lot Size */}
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                          {lot.toLocaleString()}
                        </strong>
                      </td>

                      {/* Accepted */}
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                        {good.toLocaleString()}
                      </td>

                      {/* Rejected */}
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 600, color: bad > 0 ? '#dc2626' : 'var(--text-secondary)' }}>
                        {bad > 0 ? `-${bad.toLocaleString()}` : '0'}
                      </td>

                      {/* Hold */}
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 600, color: hold > 0 ? '#d97706' : 'var(--text-secondary)' }}>
                        {hold > 0 ? `${hold.toLocaleString()}` : '0'}
                      </td>

                      {/* Pass Yield % */}
                      <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: parseFloat(yieldPct) >= 95 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: parseFloat(yieldPct) >= 95 ? '#059669' : '#dc2626'
                        }}>
                          {yieldPct}%
                        </span>
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
                              onSelectInspection(row);
                              onOpenWorkbench();
                            }}
                            title="Open in Quality Test Bench"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <Microscope size={12} />
                            <span>Test</span>
                          </button>

                          <button
                            onClick={() => onOpenPrintModal(row)}
                            title="Print Release Certificate"
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info Strip */}
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
            Showing <strong>{filteredData.length}</strong> of <strong>{inspections.length}</strong> inspection jobs
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span><strong>Cleared:</strong> Quality approved for warehouse posting</span>
            <span><strong>On Hold:</strong> Quarantined pending metallurgical test</span>
            <span><strong>Rejected:</strong> To be returned to supplier under debit note</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionRegisterLedger;
