import React, { useState } from 'react';
import { 
  Search, ArrowUpDown, ShieldAlert, Clock, CheckCircle2, AlertTriangle, 
  Trash2, Eye, Award, Lock, FileText, Plus, ChevronRight, Check
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const RFQLedger = ({
  rfqs = [],
  onSelectRfq,
  onOpenCompare,
  onDeleteRfq,
  onAddNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState('submissionDeadline');
  const [sortOrder, setSortOrder] = useState('desc');

  const filtered = rfqs.filter(r => {
    const num = r.rfqNumber?.toLowerCase() || '';
    const title = r.title?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || num.includes(search) || title.includes(search);
    const matchesType = filterType === 'All' || r.sourcingType === filterType;
    
    let matchesStatus = true;
    if (filterStatus !== 'All') {
      if (filterStatus === 'Open') {
        matchesStatus = r.status === 'Open' || r.status === 'Published';
      } else {
        matchesStatus = r.status === filterStatus;
      }
    }

    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'submissionDeadline') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else if (sortField === 'title' || sortField === 'rfqNumber') {
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
            placeholder="Search RFQ number, material description, or scope..."
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="All">All Sourcing Protocols</option>
            <option value="Standard RFQ">Standard RFQ (Open)</option>
            <option value="Sealed Bid">Sealed Bid Vault</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open Market Tenders</option>
            <option value="Awarded">Awarded Contracts</option>
            <option value="Cancelled">Cancelled</option>
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
                onClick={() => toggleSort('rfqNumber')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  RFQ Number <ArrowUpDown size={11} />
                </div>
              </th>
              <th 
                style={{ padding: '10px 14px', cursor: 'pointer' }}
                onClick={() => toggleSort('title')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Sourcing Scope / Material Description <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '10px 14px' }}>Protocol</th>
              <th 
                style={{ padding: '10px 14px', cursor: 'pointer' }}
                onClick={() => toggleSort('submissionDeadline')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Closing Deadline <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '10px 14px' }}>Quotations</th>
              <th style={{ padding: '10px 14px' }}>Status</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No price requests found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map(row => {
                const bidsCount = row.bids?.length || 0;
                const isClosed = new Date(row.submissionDeadline) < new Date();
                const isSealed = row.sourcingType === 'Sealed Bid';
                const isAwarded = row.status === 'Awarded';

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
                    {/* RFQ Number */}
                    <td style={{ padding: '10px 14px' }}>
                      <span 
                        onClick={() => {
                          onSelectRfq(row);
                          onOpenCompare();
                        }}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          color: '#2563eb',
                          cursor: 'pointer'
                        }}
                      >
                        {row.rfqNumber}
                      </span>
                    </td>

                    {/* Sourcing Scope Title */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {row.requisitionId?.requisitionNumber ? `Against PR: ${row.requisitionId.requisitionNumber}` : 'Direct Procurement Sourcing'}
                      </div>
                    </td>

                    {/* Sourcing Protocol */}
                    <td style={{ padding: '10px 14px' }}>
                      {isSealed ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          <Lock size={10} /> Sealed Vault
                        </span>
                      ) : (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: 500
                        }}>
                          Open Tender
                        </span>
                      )}
                    </td>

                    {/* Closing Deadline */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ color: isClosed ? '#dc2626' : 'var(--text-primary)', fontWeight: 500 }}>
                        {new Date(row.submissionDeadline).toLocaleDateString()}
                      </div>
                      <span style={{ fontSize: '10.5px', color: isClosed ? '#dc2626' : 'var(--text-secondary)' }}>
                        {isClosed ? 'Closed' : 'Active'}
                      </span>
                    </td>

                    {/* Supplier Bids */}
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: bidsCount >= 2 ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-canvas)',
                        color: bidsCount >= 2 ? '#059669' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)'
                      }}>
                        {bidsCount} Quotes
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '10px 14px' }}>
                      {isAwarded ? (
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
                          <Check size={11} strokeWidth={3} /> Awarded
                        </span>
                      ) : (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: 500
                        }}>
                          {row.status || 'Open'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => {
                            onSelectRfq(row);
                            onOpenCompare();
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: '#2563eb',
                            color: '#ffffff',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Compare Quotes
                        </button>

                        {onDeleteRfq && !isAwarded && (
                          <button
                            onClick={() => onDeleteRfq(row._id)}
                            title="Delete Price Request"
                            style={{
                              padding: '4px 7px',
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

export default RFQLedger;
