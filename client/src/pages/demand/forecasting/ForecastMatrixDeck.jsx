import React, { useState } from 'react';
import {
  Search, Filter, ChevronRight, Edit2, CheckCircle2,
  Clock, BrainCircuit, Activity, Lock, ArrowUpRight, Plus
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const ForecastMatrixDeck = ({
  headers = [],
  selectedHeader,
  onSelectHeader,
  onOpenEditModal,
  onOpenCreateModal,
  onQuickAdvanceStatus,
  loading = false,
  customers = [],
  products = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [algoFilter, setAlgoFilter] = useState('All');

  // Customer & Product lookup helpers
  const getEntityName = (header) => {
    if (header.forecastType === 'Customer') {
      const c = customers.find(item => item._id === header.targetEntityId);
      return c ? `${c.name} (${c.code})` : 'Target Customer';
    }
    if (header.forecastType === 'Product') {
      const p = products.find(item => item._id === header.targetEntityId);
      return p ? `${p.name} (${p.code})` : 'Target Product';
    }
    return String(header.targetEntityId || '—');
  };

  // Filtered Headers
  const filteredHeaders = headers.filter(h => {
    const matchesSearch =
      (h.forecastNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.forecastPeriod || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.algorithmUsed || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEntityName(h).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || h.status === statusFilter;
    const matchesAlgo = algoFilter === 'All' || h.algorithmUsed === algoFilter;

    return matchesSearch && matchesStatus && matchesAlgo;
  });

  const getAlgoBadge = (algo) => {
    switch (algo) {
      case 'ML-Prophet':
        return {
          bg: 'rgba(139, 92, 246, 0.12)',
          color: '#7c3aed',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          label: 'ML-Prophet',
          icon: BrainCircuit
        };
      case 'Exponential Smoothing':
        return {
          bg: 'rgba(6, 182, 212, 0.12)',
          color: '#0891b2',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          label: 'Exp Smoothing',
          icon: Activity
        };
      case 'Moving Average':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          label: 'Moving Avg',
          icon: Clock
        };
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          color: '#d97706',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          label: 'Manual Entry',
          icon: Edit2
        };
    }
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
      {/* Control Strip: Search & Filter Tabs */}
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
        {/* Left: Search input */}
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
            placeholder="Search forecast #, customer, product, period..."
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

        {/* Right: Status Filter Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          {['All', 'Draft', 'Pending Review', 'Finalized'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: statusFilter === st ? '1px solid #8b5cf6' : '1px solid var(--border-color, #e2e8f0)',
                background: statusFilter === st ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-primary, #ffffff)',
                color: statusFilter === st ? '#6d28d9' : 'var(--text-secondary, #64748b)',
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

      {/* Model Queue Table */}
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
              <th style={{ padding: '12px 18px', width: '40px' }}></th>
              <th style={{ padding: '12px 16px' }}>Forecast Model #</th>
              <th style={{ padding: '12px 16px' }}>Scope & Target Entity</th>
              <th style={{ padding: '12px 16px' }}>Planning Horizon</th>
              <th style={{ padding: '12px 16px' }}>Statistical Engine</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Consensus Volume</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>MRP Status</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading forecast portfolio...
                </td>
              </tr>
            ) : filteredHeaders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
                    No forecast models found matching your criteria.
                  </div>
                  <button
                    type="button"
                    onClick={onOpenCreateModal}
                    style={{
                      marginTop: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      background: '#8b5cf6',
                      color: '#ffffff',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} /> Create First Model
                  </button>
                </td>
              </tr>
            ) : (
              filteredHeaders.map(h => {
                const isSelected = selectedHeader?._id === h._id;
                const algoStyle = getAlgoBadge(h.algorithmUsed);
                const AlgoIcon = algoStyle.icon;

                return (
                  <tr
                    key={h._id}
                    onClick={() => onSelectHeader(h)}
                    style={{
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(139, 92, 246, 0.08)'
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
                    {/* Selection Indicator Strip */}
                    <td style={{ padding: '12px 8px 12px 16px', textAlign: 'center' }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        borderRadius: '2px',
                        background: isSelected ? '#8b5cf6' : 'transparent',
                        margin: '0 auto'
                      }} />
                    </td>

                    {/* Forecast Model # */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: isSelected ? '#7c3aed' : 'var(--text-primary, #0f172a)'
                      }}>
                        {h.forecastNumber}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                        Scope: {h.forecastType}
                      </div>
                    </td>

                    {/* Target Entity */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                        {getEntityName(h)}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        display: 'inline-block',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: h.forecastType === 'Customer' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: h.forecastType === 'Customer' ? '#2563eb' : '#059669',
                        fontWeight: 500,
                        marginTop: '2px'
                      }}>
                        {h.forecastType} Level
                      </div>
                    </td>

                    {/* Planning Horizon */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                        {h.forecastPeriod || '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                        Rolling Horizon
                      </div>
                    </td>

                    {/* Statistical Engine */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: algoStyle.bg,
                        color: algoStyle.color,
                        border: algoStyle.border,
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        <AlgoIcon size={12} />
                        {algoStyle.label}
                      </span>
                    </td>

                    {/* Consensus Volume */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        color: 'var(--text-primary, #0f172a)'
                      }}>
                        {(h.totalAdjustedQty || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                        units
                      </div>
                    </td>

                    {/* MRP Status Badge */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <StatusBadge value={h.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {/* Quick Status Advance */}
                        {h.status === 'Draft' && (
                          <button
                            type="button"
                            title="Submit for Review"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickAdvanceStatus(h, 'Pending Review');
                            }}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              background: 'rgba(245, 158, 11, 0.1)',
                              color: '#d97706',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Review
                          </button>
                        )}
                        {h.status === 'Pending Review' && (
                          <button
                            type="button"
                            title="Finalize Model for MRP"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickAdvanceStatus(h, 'Finalized');
                            }}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#059669',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Finalize
                          </button>
                        )}

                        {/* Edit Header */}
                        <button
                          type="button"
                          title="Edit Forecast Specifications"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditModal(h);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary, #64748b)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Chevron Select */}
                        <div style={{
                          color: isSelected ? '#8b5cf6' : 'var(--text-secondary, #94a3b8)',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <ChevronRight size={15} />
                        </div>
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
