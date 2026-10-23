import React, { useState } from 'react';
import { 
  Search, Filter, ArrowUpDown, ChevronDown, CheckCircle2, Clock, 
  AlertTriangle, Wrench, Flame, FileText, Play, Edit, Trash2, ArrowRight,
  MoreVertical, ShieldCheck, Check
} from 'lucide-react';

const getStatusBadge = (status) => {
  switch (status) {
    case 'Completed':
      return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', icon: CheckCircle2 };
    case 'In-Progress':
      return { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe', icon: Play };
    case 'Firm/Released':
      return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', icon: ShieldCheck };
    case 'Draft':
      return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', icon: Clock };
    case 'Cancelled':
      return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca', icon: AlertTriangle };
    default:
      return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', icon: Clock };
  }
};

const ScheduleGridLedger = ({
  schedules = [],
  workCenters = [],
  onSelectSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onUpdateStatus,
  onConvertToWorkOrder,
  onAddNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWC, setFilterWC] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterShift, setFilterShift] = useState('All');
  const [sortField, setSortField] = useState('targetDate');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filtered & Sorted Schedules
  const filteredSchedules = schedules.filter(s => {
    const pName = s.productId?.name?.toLowerCase() || '';
    const pCode = s.productId?.code?.toLowerCase() || '';
    const wcName = s.assignedWorkCenterId?.name?.toLowerCase() || '';
    const woNum = s.workOrderNumber?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || pName.includes(search) || pCode.includes(search) || wcName.includes(search) || woNum.includes(search);
    const matchesWC = filterWC === 'All' || (s.assignedWorkCenterId?._id === filterWC || s.assignedWorkCenterId === filterWC);
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    const matchesShift = filterShift === 'All' || (s.shift || 'Shift 1') === filterShift;

    return matchesSearch && matchesWC && matchesStatus && matchesShift;
  }).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'targetDate') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else if (sortField === 'product') {
      valA = a.productId?.name || '';
      valB = b.productId?.name || '';
    } else if (sortField === 'quantity') {
      valA = a.scheduledQuantity || 0;
      valB = b.scheduledQuantity || 0;
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
      {/* Control Bar: Search & Multifaceted Filters */}
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
            placeholder="Search part name, code, work center, or WO#..."
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
          {/* Work Center Filter */}
          <select
            value={filterWC}
            onChange={(e) => setFilterWC(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="All">All Work Centers</option>
            {workCenters.map(wc => (
              <option key={wc._id} value={wc._id}>{wc.name}</option>
            ))}
          </select>

          {/* Shift Filter */}
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="All">All Shifts</option>
            <option value="Shift 1">Shift 1 (Morning)</option>
            <option value="Shift 2">Shift 2 (Evening)</option>
            <option value="Shift 3">Shift 3 (Night)</option>
            <option value="General">General Shift</option>
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
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Firm/Released">Firm / Dispatched</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table Structure */}
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
              <th style={{ padding: '12px 14px' }}>Seq / Shift</th>
              <th 
                style={{ padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => toggleSort('targetDate')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Planned For <ArrowUpDown size={11} />
                </div>
              </th>
              <th 
                style={{ padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => toggleSort('product')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Part Description <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '12px 14px' }}>Station / Work Center</th>
              <th 
                style={{ padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => toggleSort('quantity')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Planned Qty <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '12px 14px' }}>Die / Tooling</th>
              <th style={{ padding: '12px 14px' }}>Priority</th>
              <th style={{ padding: '12px 14px' }}>Dispatch Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No production schedules found matching criteria.
                </td>
              </tr>
            ) : (
              filteredSchedules.map(row => {
                const badge = getStatusBadge(row.status);
                const BadgeIcon = badge.icon;
                const isCritical = row.priority === 'Critical' || row.priority === 'Expedite';

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
                    {/* Seq / Shift */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '11px',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)'
                        }}>
                          #{row.sequence || 10}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: '#3b82f6',
                          fontWeight: 600
                        }}>
                          {row.shift || 'Shift 1'}
                        </span>
                      </div>
                    </td>

                    {/* Planned Date */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>
                        {new Date(row.targetDate).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {row.scheduleType} schedule
                      </div>
                    </td>

                    {/* Part Description */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.productId?.name || '-'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <span style={{ fontFamily: 'monospace' }}>{row.productId?.code || 'PRD'}</span>
                        {row.customerReference && (
                          <span style={{
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#d97706',
                            fontWeight: 600
                          }}>
                            {row.customerReference}
                          </span>
                        )}
                        {row.workOrderNumber && (
                          <span style={{
                            color: '#059669',
                            fontWeight: 600
                          }}>
                            WO: {row.workOrderNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Work Center */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {row.assignedWorkCenterId?.name || '-'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {row.assignedWorkCenterId?.code || 'WC'}
                      </div>
                    </td>

                    {/* Planned Qty */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {row.scheduledQuantity?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        Est: {((Number(row.runTimeHours) || 2) + (Number(row.setupTimeHours) || 0.5)).toFixed(1)} hrs
                      </div>
                    </td>

                    {/* Tooling / Die */}
                    <td style={{ padding: '12px 14px' }}>
                      {row.dieToolId ? (
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: '#4f46e5',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Wrench size={11} /> {row.dieToolId}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Standard</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '12px 14px' }}>
                      {isCritical ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Flame size={11} /> {row.priority}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {row.priority || 'Normal'}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`
                      }}>
                        <BadgeIcon size={12} />
                        {row.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {row.status === 'Draft' && (
                          <button
                            onClick={() => onUpdateStatus(row._id, 'Firm/Released')}
                            title="Firm schedule & generate dispatch"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#16a34a',
                              color: '#ffffff',
                              borderRadius: '4px',
                              border: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            Firm
                          </button>
                        )}

                        {row.status === 'Firm/Released' && !row.workOrderNumber && (
                          <button
                            onClick={() => onConvertToWorkOrder(row)}
                            title="Convert to Shop Floor Work Order"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#0284c7',
                              color: '#ffffff',
                              borderRadius: '4px',
                              border: 'none'
                            }}
                          >
                            + WO
                          </button>
                        )}

                        <button
                          onClick={() => onEditSchedule(row)}
                          title="Edit Schedule"
                          style={{
                            padding: '4px',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px',
                            border: 'none'
                          }}
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => onDeleteSchedule(row._id)}
                          title="Delete Schedule"
                          style={{
                            padding: '4px',
                            background: 'transparent',
                            color: '#ef4444',
                            borderRadius: '4px',
                            border: 'none'
                          }}
                        >
                          <Trash2 size={14} />
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
    </div>
  );
};

export default ScheduleGridLedger;
