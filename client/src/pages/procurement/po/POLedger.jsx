import React, { useState } from 'react';
import { 
  Search, ArrowUpDown, Truck, CheckCircle2, Clock, 
  Trash2, Eye, Printer, Check, RefreshCw
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const SENT_LABEL = {
  Not_Sent: 'Not sent',
  EDI_Sent: 'Sent',
  Acknowledged: 'Accepted'
};
const sentLabel = (s) => SENT_LABEL[s] || String(s || '').replace(/_/g, ' ');

const POLedger = ({
  purchaseOrders = [],
  onSelectPo,
  onOpenWorkbench,
  onPrintVoucher,
  onDeletePo,
  onAddNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApproval, setFilterApproval] = useState('All');
  const [filterDelivery, setFilterDelivery] = useState('All');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const filtered = purchaseOrders.filter(po => {
    const num = po.poNumber?.toLowerCase() || '';
    const vendorName = po.vendorId?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || num.includes(search) || vendorName.includes(search);
    const matchesApproval = filterApproval === 'All' || po.approvalStatus === filterApproval;
    const matchesDelivery = filterDelivery === 'All' || po.deliveryStatus === filterDelivery;

    return matchesSearch && matchesApproval && matchesDelivery;
  }).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'totalAmount') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else if (sortField === 'poNumber') {
      valA = String(valA || '');
      valB = String(valB || '');
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Control Bar */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--surface-canvas)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '6px 10px',
          minWidth: '280px',
          flex: 1
        }}>
          <Search size={14} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search PO number, supplier name, or part..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="All">All Approvals</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending Approval</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={filterDelivery}
            onChange={(e) => setFilterDelivery(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="All">All Logistics Stages</option>
            <option value="In-Transit">In-Transit (ASN)</option>
            <option value="Delivered">Delivered (GRN)</option>
            <option value="Not Scheduled">Not Scheduled</option>
          </select>
        </div>
      </div>

      {/* Grid Table */}
      <div style={{ overflowX: 'auto', minWidth: '100%' }}>
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
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <th 
                style={{ padding: '10px 14px', cursor: 'pointer' }}
                onClick={() => toggleSort('poNumber')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  PO Number <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '10px 14px' }}>Supplier / Vendor</th>
              <th style={{ padding: '10px 14px' }}>Material Scope</th>
              <th 
                style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer' }}
                onClick={() => toggleSort('totalAmount')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  Total Value <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '10px 14px' }}>Approval</th>
              <th style={{ padding: '10px 14px' }}>Sent to Supplier</th>
              <th style={{ padding: '10px 14px' }}>Logistics Delivery</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No purchase orders found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map(row => {
                const isApproved = row.approvalStatus === 'Approved';
                const isPending = row.approvalStatus === 'Pending';
                const isInTransit = row.deliveryStatus === 'In-Transit';
                const isDelivered = row.deliveryStatus === 'Delivered';
                const firstItem = row.items?.[0] || {};

                return (
                  <tr
                    key={row._id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-canvas)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* PO Number & Version */}
                    <td style={{ padding: '10px 14px' }}>
                      <div 
                        onClick={() => {
                          onSelectPo(row);
                          onOpenWorkbench();
                        }}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          color: '#059669'
                        }}>
                          {row.poNumber}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '0 4px',
                          borderRadius: '3px',
                          background: 'var(--surface-canvas)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          v{row.version || 1}
                        </span>
                      </div>
                    </td>

                    {/* Supplier */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.vendorId?.name || 'Supplier'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {row.vendorId?.code || 'VND-SUP'}
                      </div>
                    </td>

                    {/* Material Scope */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {firstItem.materialId?.name || 'Raw Material Order'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {firstItem.orderQty ? `${firstItem.orderQty} Units` : 'Direct Call-off'}
                      </div>
                    </td>

                    {/* Total Value */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                        {fmtMoneyFull(row.totalAmount)}
                      </strong>
                    </td>

                    {/* Approval Status */}
                    <td style={{ padding: '10px 14px' }}>
                      {isApproved ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Check size={11} strokeWidth={3} /> Approved
                        </span>
                      ) : isPending ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Clock size={11} /> Pending
                        </span>
                      ) : (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Sent to Supplier */}
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 500,
                        background: row.transmissionStatus === 'Acknowledged' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-canvas)',
                        color: row.transmissionStatus === 'Acknowledged' ? '#059669' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)'
                      }}>
                        {sentLabel(row.transmissionStatus)}
                      </span>
                    </td>

                    {/* Delivery Status */}
                    <td style={{ padding: '10px 14px' }}>
                      {isInTransit ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Truck size={11} /> In-Transit
                        </span>
                      ) : isDelivered ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <CheckCircle2 size={11} /> Delivered
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {row.deliveryStatus || 'Not Scheduled'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => {
                            onSelectPo(row);
                            onOpenWorkbench();
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: '#059669',
                            color: '#ffffff',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Fulfill Order
                        </button>

                        <button
                          onClick={() => {
                            onSelectPo(row);
                            onPrintVoucher();
                          }}
                          title="Print PO Voucher"
                          style={{
                            padding: '4px 6px',
                            fontSize: '11px',
                            background: 'var(--surface-canvas)',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer'
                          }}
                        >
                          <Printer size={12} />
                        </button>

                        {onDeletePo && !isDelivered && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete purchase order ${row.poNumber}?`)) {
                                onDeletePo(row._id);
                              }
                            }}
                            title="Delete Purchase Order"
                            style={{
                              padding: '4px 6px',
                              fontSize: '11px',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#dc2626',
                              borderRadius: '4px',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default POLedger;
