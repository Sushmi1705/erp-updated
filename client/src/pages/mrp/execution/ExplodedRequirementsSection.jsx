import React, { useState } from 'react';
import {
  GitMerge, Search, ShieldAlert, AlertTriangle,
  Layers, Package, Factory, ShoppingCart, Clock
} from 'lucide-react';

export const ExplodedRequirementsSection = ({
  requirements = [],
  selectedRun,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = requirements.filter(r => {
    const name = r.itemId?.name || '';
    const code = r.itemId?.code || '';
    const q = searchTerm.toLowerCase();
    const matchesSearch = name.toLowerCase().includes(q) || code.toLowerCase().includes(q);

    let matchesType = true;
    if (typeFilter === 'Production') matchesType = r.requirementType === 'Production';
    if (typeFilter === 'Procurement') matchesType = r.requirementType === 'Procurement';
    if (typeFilter === 'Expedited') matchesType = r.isExpedited;

    return matchesSearch && matchesType;
  });

  const getLevelBadge = (level) => {
    const colors = [
      { bg: 'rgba(56, 189, 248, 0.12)', color: '#0284c7', border: '1px solid rgba(56, 189, 248, 0.3)' }, // L0 Finished Part
      { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }, // L1 Sub-assembly
      { bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', border: '1px solid rgba(139, 92, 246, 0.3)' }, // L2 Component
      { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }  // L3 Raw Material
    ];
    const style = colors[Math.min(level, colors.length - 1)];
    return (
      <span style={{
        ...style,
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 700,
        fontFamily: 'monospace'
      }}>
        L{level}
      </span>
    );
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
      {/* Header Strip */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-secondary, #f8fafc)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706'
          }}>
            <GitMerge size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>
              Exploded BOM Net Requirements
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
              {selectedRun
                ? `Showing ${requirements.length} multi-level component requirements for Run ${selectedRun.runNo}`
                : 'Select an MRP calculation run above'}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-color, #cbd5e1)',
            borderRadius: '7px',
            padding: '4px 10px',
            minWidth: '200px'
          }}>
            <Search size={13} color="var(--text-secondary, #64748b)" />
            <input
              type="text"
              placeholder="Search component or code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                width: '100%',
                color: 'var(--text-primary, #1e293b)'
              }}
            />
          </div>

          {/* Type Filter Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['All', 'Production', 'Procurement', 'Expedited'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: typeFilter === t ? '1px solid #f59e0b' : '1px solid var(--border-color, #e2e8f0)',
                  background: typeFilter === t ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-primary, #ffffff)',
                  color: typeFilter === t ? '#b45309' : 'var(--text-secondary, #64748b)',
                  fontSize: '11px',
                  fontWeight: typeFilter === t ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {t === 'Expedited' ? '⚠️ Expedite' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advisory Bar */}
      <div style={{
        padding: '8px 20px',
        background: 'rgba(245, 158, 11, 0.05)',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        fontSize: '11px',
        color: 'var(--text-secondary, #64748b)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <ShieldAlert size={13} color="#d97706" />
        <span><strong>Engine Note:</strong> Quantities are determined through multi-level Bill of Materials explosion with point-in-time stock offsetting and cannot be edited by hand.</span>
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
              <th style={{ padding: '10px 14px', width: '90px' }}>BOM Level</th>
              <th style={{ padding: '10px 14px' }}>Requirement Channel</th>
              <th style={{ padding: '10px 14px' }}>Component Specification</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Net Quantity Needed</th>
              <th style={{ padding: '10px 14px' }}>Needed By Date</th>
              <th style={{ padding: '10px 18px', textAlign: 'center' }}>Lead Time Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Exploding multi-level BOM requirements...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  {requirements.length === 0 ? 'No requirements generated for this run.' : 'No components match your search filter.'}
                </td>
              </tr>
            ) : (
              filtered.map((req, idx) => {
                const isProduction = req.requirementType === 'Production';
                const isProcurement = req.requirementType === 'Procurement';
                const level = req.bomLevel || 0;

                return (
                  <tr
                    key={req._id || idx}
                    style={{
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      background: req.isExpedited ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!req.isExpedited) e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)';
                    }}
                    onMouseLeave={e => {
                      if (!req.isExpedited) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* BOM Level */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: `${level * 12}px` }} />
                        {getLevelBadge(level)}
                      </div>
                    </td>

                    {/* Channel */}
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: isProduction ? 'rgba(56, 189, 248, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                        color: isProduction ? '#0284c7' : '#7c3aed'
                      }}>
                        {isProduction ? <Factory size={12} /> : <ShoppingCart size={12} />}
                        {isProduction ? 'Production (Make)' : 'Procurement (Buy)'}
                      </span>
                    </td>

                    {/* Component */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                        {req.itemId?.name || 'Unnamed Component'}
                      </div>
                      <div style={{
                        display: 'inline-block',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: '#64748b',
                        background: 'rgba(100, 116, 139, 0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        marginTop: '2px'
                      }}>
                        {req.itemId?.code || '—'}
                      </div>
                    </td>

                    {/* Net Qty */}
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{
                        fontWeight: 800,
                        fontSize: '14px',
                        color: '#0f172a'
                      }}>
                        {(req.requiredQty ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Needed By Date */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="#94a3b8" />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                          {req.requirementDate ? new Date(req.requirementDate).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Lead Time Status */}
                    <td style={{ padding: '10px 18px', textAlign: 'center' }}>
                      {req.isExpedited ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.04em'
                        }}>
                          <AlertTriangle size={11} /> EXPEDITE
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          On Schedule
                        </span>
                      )}
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
