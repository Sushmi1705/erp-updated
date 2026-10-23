import React, { useState } from 'react';
import {
  Archive, Search, ShieldAlert, CheckCircle2,
  AlertCircle, Package, ArrowUpRight, TrendingDown
} from 'lucide-react';

export const InventorySnapshotSection = ({
  snapshots = [],
  selectedRun,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [atpFilter, setAtpFilter] = useState('All');

  const filtered = snapshots.filter(s => {
    const name = s.itemId?.name || '';
    const code = s.itemId?.code || '';
    const q = searchTerm.toLowerCase();
    const matchesSearch = name.toLowerCase().includes(q) || code.toLowerCase().includes(q);

    const onHand = Number(s.onHandQty) || 0;
    const scheduled = Number(s.scheduledReceiptsQty) || 0;
    const allocated = Number(s.allocatedQty) || 0;
    const atp = onHand + scheduled - allocated;

    let matchesAtp = true;
    if (atpFilter === 'Positive') matchesAtp = atp >= 0;
    if (atpFilter === 'Deficit') matchesAtp = atp < 0;

    return matchesSearch && matchesAtp;
  });

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
            background: 'rgba(16, 185, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669'
          }}>
            <Archive size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>
              Frozen Point-in-Time Inventory Snapshot
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
              {selectedRun
                ? `Stock and supply figures frozen at run execution time for Run ${selectedRun.runNo}`
                : 'Select an MRP calculation run above'}
            </div>
          </div>
        </div>

        {/* Search & ATP Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-color, #cbd5e1)',
            borderRadius: '7px',
            padding: '4px 10px',
            minWidth: '180px'
          }}>
            <Search size={13} color="var(--text-secondary, #64748b)" />
            <input
              type="text"
              placeholder="Filter stock items..."
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

          <div style={{ display: 'flex', gap: '4px' }}>
            {['All', 'Positive', 'Deficit'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setAtpFilter(f)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: atpFilter === f ? '1px solid #10b981' : '1px solid var(--border-color, #e2e8f0)',
                  background: atpFilter === f ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary, #ffffff)',
                  color: atpFilter === f ? '#059669' : 'var(--text-secondary, #64748b)',
                  fontSize: '11px',
                  fontWeight: atpFilter === f ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {f === 'Positive' ? 'ATP Healthy' : f === 'Deficit' ? '⚠️ Shortage' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advisory Bar */}
      <div style={{
        padding: '8px 20px',
        background: 'rgba(16, 185, 129, 0.05)',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        fontSize: '11px',
        color: 'var(--text-secondary, #64748b)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <ShieldAlert size={13} color="#059669" />
        <span><strong>Frozen Ledger:</strong> The MRP calculation used these exact stock and scheduled receipt figures, preserved forever for auditability.</span>
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
              <th style={{ padding: '10px 14px' }}>Component Item</th>
              <th style={{ padding: '10px 14px' }}>Classification</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>On-Hand Stock</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>In-Transit POs</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Reserved Stock</th>
              <th style={{ padding: '10px 18px', textAlign: 'right' }}>Available to Promise (ATP)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading frozen inventory snapshots...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  {snapshots.length === 0 ? 'No inventory snapshots recorded for this run.' : 'No items match your filter.'}
                </td>
              </tr>
            ) : (
              filtered.map((s, idx) => {
                const onHand = Number(s.onHandQty) || 0;
                const scheduled = Number(s.scheduledReceiptsQty) || 0;
                const allocated = Number(s.allocatedQty) || 0;
                const atp = onHand + scheduled - allocated;

                return (
                  <tr
                    key={s._id || idx}
                    style={{
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      background: atp < 0 ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (atp >= 0) e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)';
                    }}
                    onMouseLeave={e => {
                      if (atp >= 0) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Component */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                        {s.itemId?.name || 'Unknown Item'}
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
                        {s.itemId?.code || '—'}
                      </div>
                    </td>

                    {/* Classification */}
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: s.itemModel === 'Material' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                        color: s.itemModel === 'Material' ? '#7c3aed' : '#0284c7'
                      }}>
                        {(s.itemModel || '').replace('Master', '')}
                      </span>
                    </td>

                    {/* On Hand */}
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {onHand.toLocaleString()}
                      </span>
                    </td>

                    {/* Scheduled */}
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{ color: '#0284c7', fontWeight: 600 }}>
                        {scheduled > 0 ? `+${scheduled.toLocaleString()}` : '0'}
                      </span>
                    </td>

                    {/* Allocated */}
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{ color: '#dc2626', fontWeight: 500 }}>
                        {allocated > 0 ? `-${allocated.toLocaleString()}` : '0'}
                      </span>
                    </td>

                    {/* ATP */}
                    <td style={{ padding: '10px 18px', textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '13px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-block',
                        background: atp >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: atp >= 0 ? '#059669' : '#dc2626'
                      }}>
                        {atp.toLocaleString()}
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
