import React, { useState } from 'react';
import {
  Search, Play, Lock, CheckCircle2, AlertCircle,
  ChevronRight, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const ConsolidationRunMatrix = ({
  runs = [],
  selectedRun,
  onSelectRun,
  onOpenLockModal,
  loading = false,
  onOpenGenerateModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredRuns = runs.filter(r => {
    const matchesSearch =
      (r.runNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.runType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.status || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
      {/* Search & Filter Header Strip */}
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
        {/* Search Input */}
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
            placeholder="Search run #, period, or type..."
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

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {['All', 'Completed', 'Consumed_By_MRP'].map(st => (
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
              {st === 'Consumed_By_MRP' ? 'Consumed by MRP' : st}
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
              <th style={{ padding: '12px 16px' }}>Run Number</th>
              <th style={{ padding: '12px 16px' }}>Execution Date</th>
              <th style={{ padding: '12px 16px' }}>Planning Horizon Window</th>
              <th style={{ padding: '12px 16px' }}>Run Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>MRP Status</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading combined demand runs...
                </td>
              </tr>
            ) : filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                    No demand consolidation runs found.
                  </div>
                  <button
                    type="button"
                    onClick={onOpenGenerateModal}
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
                    <RefreshCw size={13} /> Combine Demand Now
                  </button>
                </td>
              </tr>
            ) : (
              filteredRuns.map(r => {
                const isSelected = selectedRun?._id === r._id;
                const isConsumed = r.status === 'Consumed_By_MRP';

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
                    {/* Active Indicator Strip */}
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
                        {r.runNumber}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                        Consensus Snapshot
                      </div>
                    </td>

                    {/* Execution Date */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                        {formatDate(r.runDate)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                        {new Date(r.runDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Planning Horizon Window */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#0369a1' }}>
                        {formatDate(r.targetHorizonStart)} – {formatDate(r.targetHorizonEnd)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                        Target Planning Window
                      </div>
                    </td>

                    {/* Run Type */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: r.runType === 'Full Regeneration' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                        color: r.runType === 'Full Regeneration' ? '#b45309' : '#0284c7',
                        fontWeight: 600,
                        fontSize: '11px'
                      }}>
                        {r.runType || 'Net Change'}
                      </span>
                    </td>

                    {/* MRP Status */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {isConsumed ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          <Lock size={12} /> Consumed by MRP
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {!isConsumed && (
                          <button
                            type="button"
                            title="Lock and commit run to Material Requirements Planning (MRP)"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenLockModal(r);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#dc2626',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <Lock size={12} /> Lock for MRP
                          </button>
                        )}
                        <ChevronRight
                          size={15}
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
