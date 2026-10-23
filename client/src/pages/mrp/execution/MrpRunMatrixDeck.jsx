import React, { useState } from 'react';
import {
  Search, Play, GitMerge, ChevronRight, Clock,
  CheckCircle2, AlertCircle, User, Zap
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const MrpRunMatrixDeck = ({
  mrpRuns = [],
  selectedRun,
  onSelectRun,
  loading = false,
  onOpenExecuteModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredRuns = mrpRuns.filter(r => {
    const matchesSearch =
      (r.runNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.targetPeriod || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.status || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      background: 'var(--bg-primary, #ffffff)',
      borderRadius: '12px',
      border: '1px solid var(--border-color, #e2e8f0)',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Search & Filter Strip */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        background: 'var(--bg-secondary, #f8fafc)'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-primary, #ffffff)',
          border: '1px solid var(--border-color, #cbd5e1)',
          borderRadius: '8px',
          padding: '6px 12px',
          minWidth: '280px'
        }}>
          <Search size={15} color="var(--text-secondary, #64748b)" />
          <input
            type="text"
            placeholder="Search run #, target period, status..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '13px',
              width: '100%',
              color: 'var(--text-primary, #1e293b)'
            }}
          />
        </div>

        {/* Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {['All', 'Completed', 'Superseded'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: statusFilter === st ? '1px solid #f59e0b' : '1px solid var(--border-color, #e2e8f0)',
                background: statusFilter === st ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-primary, #ffffff)',
                color: statusFilter === st ? '#b45309' : 'var(--text-secondary, #64748b)',
                fontSize: '12px',
                fontWeight: statusFilter === st ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '13px'
        }}>
          <thead>
            <tr style={{
              background: 'var(--bg-secondary, #f8fafc)',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              color: 'var(--text-secondary, #64748b)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '12px 18px', width: '36px' }}></th>
              <th style={{ padding: '12px 16px' }}>MRP Run Number</th>
              <th style={{ padding: '12px 16px' }}>Target Planning Period</th>
              <th style={{ padding: '12px 16px' }}>Execution Timestamp</th>
              <th style={{ padding: '12px 16px' }}>Executed By</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Reactor Status</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading MRP calculation runs...
                </td>
              </tr>
            ) : filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                    No MRP calculation runs found matching criteria.
                  </div>
                  <button
                    type="button"
                    onClick={onOpenExecuteModal}
                    style={{
                      marginTop: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      background: '#f59e0b',
                      color: '#ffffff',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Zap size={13} /> Launch First MRP Run
                  </button>
                </td>
              </tr>
            ) : (
              filteredRuns.map(r => {
                const isSelected = selectedRun?._id === r._id;

                return (
                  <tr
                    key={r._id}
                    onClick={() => onSelectRun(r)}
                    style={{
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(245, 158, 11, 0.08)'
                        : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Active Indicator Bar */}
                    <td style={{ padding: '12px 8px 12px 16px', textAlign: 'center' }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        borderRadius: '2px',
                        background: isSelected ? '#f59e0b' : 'transparent',
                        margin: '0 auto'
                      }} />
                    </td>

                    {/* Run Number */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: isSelected ? '#b45309' : '#0f172a'
                      }}>
                        {r.runNo}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                        Full Regeneration Snapshot
                      </div>
                    </td>

                    {/* Target Period */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontWeight: 700,
                        color: '#0284c7',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {r.targetPeriod || '—'}
                      </span>
                    </td>

                    {/* Execution Timestamp */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                        {formatDate(r.runDate)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                        Reactor Execution Time
                      </div>
                    </td>

                    {/* Executed By */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={13} color="#94a3b8" />
                        <span style={{ color: 'var(--text-secondary, #475569)', fontSize: '12px' }}>
                          {r.executedBy?.name || 'Automated Planning Service'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <StatusBadge value={r.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <ChevronRight
                          size={16}
                          color={isSelected ? '#f59e0b' : 'var(--text-secondary, #94a3b8)'}
                        />
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
