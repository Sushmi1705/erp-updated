import React, { useState } from 'react';
import { 
  Search, ArrowUpDown, ShieldCheck, Clock, CheckCircle2, AlertTriangle, 
  Trash2, Eye, FileText, ArrowRight, Building2, User, ChevronDown
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const STATUS_CONFIG = {
  Draft: { label: 'Draft Request', bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', icon: Clock },
  In_Approval: { label: 'Pending Approval', bg: '#fef3c7', text: '#b45309', border: '#fde68a', icon: Clock },
  Needs_CFO_Approval: { label: 'CFO Budget Gate', bg: '#fee2e2', text: '#b91c1c', border: '#fecaca', icon: AlertTriangle },
  Approved: { label: 'Approved & Sourcing', bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', icon: ShieldCheck },
  PO_Created: { label: 'PO Created', bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', icon: CheckCircle2 },
  Rejected: { label: 'Declined', bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: AlertTriangle }
};

const RequisitionOperationsLedger = ({
  requisitions = [],
  departments = [],
  onSelectRequisition,
  onApproveStep,
  onConvertToPO,
  onDeleteRequisition
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState('submissionDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const filtered = requisitions.filter(r => {
    const prNum = r.prNumber?.toLowerCase() || '';
    const deptName = r.costCenterId?.name?.toLowerCase() || '';
    const firstItem = (r.items?.[0]?.itemId?.name || r.items?.[0]?.freeTextDesc || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || prNum.includes(search) || deptName.includes(search) || firstItem.includes(search);
    const matchesDept = filterDept === 'All' || (r.costCenterId?._id === filterDept || r.costCenterId === filterDept);
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;

    return matchesSearch && matchesDept && matchesStatus;
  }).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'submissionDate') {
      valA = new Date(valA || a.createdAt).getTime();
      valB = new Date(valB || b.createdAt).getTime();
    } else if (sortField === 'totalValue') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else if (sortField === 'prNumber') {
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
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
    }}>
      {/* Control Bar */}
      <div style={{
        padding: '14px 18px',
        background: 'var(--bg-primary)',
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
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '6px 12px',
          minWidth: '260px',
          flex: 1
        }}>
          <Search size={15} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search PR#, material item, or department..."
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
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '11px' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="All">All Cost Centers / Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="All">All Sourcing Statuses</option>
            <option value="Draft">Draft</option>
            <option value="In_Approval">Pending Approval</option>
            <option value="Needs_CFO_Approval">CFO Budget Gate</option>
            <option value="Approved">Approved & Sourcing</option>
            <option value="PO_Created">PO Created</option>
            <option value="Rejected">Declined</option>
          </select>
        </div>
      </div>

      {/* Grid Ledger Table */}
      <div style={{ overflowX: 'auto', minWidth: '100%' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '12px'
        }}>
          <thead>
            <tr style={{
              background: 'var(--bg-tertiary)',
              borderBottom: '2px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <th 
                style={{ padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => toggleSort('prNumber')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  PR Number <ArrowUpDown size={11} />
                </div>
              </th>
              <th 
                style={{ padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => toggleSort('submissionDate')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Date Raised <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '12px 14px' }}>Department / Cost Center</th>
              <th style={{ padding: '12px 14px' }}>Requested Materials</th>
              <th 
                style={{ padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => toggleSort('totalValue')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Total Value <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '12px 14px' }}>Multi-Tier Approvals</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No purchase requisitions found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map(row => {
                const statusCfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.Draft;
                const StatusIcon = statusCfg.icon;
                const itemsCount = row.items?.length || 0;
                const firstItemName = row.items?.[0]?.itemId?.name || row.items?.[0]?.freeTextDesc || 'Material Item';
                const pendingStep = row.approvals?.find(a => a.status === 'Pending');

                return (
                  <tr
                    key={row._id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* PR Number */}
                    <td style={{ padding: '12px 14px' }}>
                      <div 
                        onClick={() => onSelectRequisition(row)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '11px',
                          color: 'var(--accent-primary)',
                          background: 'var(--bg-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)'
                        }}>
                          {row.prNumber}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 500 }}>
                        {new Date(row.submissionDate || row.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>

                    {/* Department / Cost Center */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.costCenterId?.name || 'Plant Manufacturing'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={10} /> {row.costCenterId?.code || 'CC-PROD'}
                      </div>
                    </td>

                    {/* Requested Materials Summary */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {firstItemName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {itemsCount > 1 ? `+${itemsCount - 1} other item${itemsCount > 2 ? 's' : ''}` : '1 item'} • {row.items?.reduce((s, i) => s + (Number(i.qty) || 0), 0)} units total
                      </div>
                    </td>

                    {/* Total Value */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {fmtMoneyFull(row.totalValue)}
                      </div>
                      {row.totalValue > 10000 && (
                        <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>
                          * CFO Sign-off Gate
                        </span>
                      )}
                    </td>

                    {/* Multi-Tier Approvals Stepper */}
                    <td style={{ padding: '12px 14px' }}>
                      {(!row.approvals || row.approvals.length === 0) ? (
                        <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={12} /> Auto-Approved
                        </span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {row.approvals.map((step, idx) => (
                            <span
                              key={step._id || idx}
                              title={`Step ${step.sequence}: ${step.comments} (${step.status})`}
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: step.status === 'Approved' ? '#dcfce7' : step.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                color: step.status === 'Approved' ? '#15803d' : step.status === 'Rejected' ? '#b91c1c' : '#b45309',
                                border: step.status === 'Pending' ? '1px solid #fde68a' : 'none'
                              }}
                            >
                              T{step.sequence}: {step.status === 'Pending' ? 'Pending' : step.status}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: statusCfg.bg,
                        color: statusCfg.text,
                        border: `1px solid ${statusCfg.border}`
                      }}>
                        <StatusIcon size={12} />
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {pendingStep && (
                          <button
                            onClick={() => onApproveStep(row._id, pendingStep._id, 'Approved')}
                            title="Approve this requisition step"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#10b981',
                              color: '#ffffff',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                        )}

                        {row.status === 'Approved' && (
                          <button
                            onClick={() => onConvertToPO(row)}
                            title="Issue Purchase Order"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#0284c7',
                              color: '#ffffff',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            + Issue PO
                          </button>
                        )}

                        <button
                          onClick={() => onSelectRequisition(row)}
                          title="View Requisition Details"
                          style={{
                            padding: '4px',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        {row.status !== 'PO_Created' && (
                          <button
                            onClick={() => onDeleteRequisition(row._id)}
                            title="Cancel / Delete Requisition"
                            style={{
                              padding: '4px',
                              background: 'transparent',
                              color: '#ef4444',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
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

export default RequisitionOperationsLedger;
