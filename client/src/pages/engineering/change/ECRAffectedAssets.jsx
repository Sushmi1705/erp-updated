import React from 'react';
import {
  Package, Plus, Edit2, Trash2, ArrowRight, Layers, Sliders,
  Box, FileText, CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react';

export const ECRAffectedAssets = ({
  selectedECR,
  affectedItems = [],
  onOpenAffectedModal,
  onDeleteAffected
}) => {
  const getItemIcon = (type) => {
    switch (type) {
      case 'BOM': return Layers;
      case 'Routing': return Sliders;
      case 'Product Master': return Box;
      default: return FileText;
    }
  };

  const getItemTypeBadge = (type) => {
    switch (type) {
      case 'BOM':
        return { bg: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', label: 'PARTS LIST (BOM)' };
      case 'Routing':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', label: 'PROCESS SHEET (ROUTING)' };
      case 'Product Master':
        return { bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', label: 'PRODUCT MASTER' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748b', label: 'ENGINEERING DOC' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── GUIDANCE & ACTION BAR ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: '12px 16px',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'rgba(2, 132, 199, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7'
          }}>
            <Package size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              Affected Parts, BOMs & Process Sheets
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Automated revision rollover occurs when ECR status reaches Approved (ECO Active).
            </div>
          </div>
        </div>

        {!selectedECR.isLocked && (
          <button
            onClick={() => onOpenAffectedModal('affected', {
              itemType: 'BOM',
              currentRevisionCode: 'v1.0'
            })}
            className="btn btn-primary"
            style={{
              fontSize: 11.5,
              padding: '5px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
            }}
          >
            <Plus size={13} /> Add Affected Item
          </button>
        )}
      </div>

      {/* ── ASSETS MATRIX TABLE ─────────────────────────────────────────── */}
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--bg-secondary)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '9px 12px' }}>Target Asset Type</th>
              <th style={{ padding: '9px 12px' }}>Asset Identifier & Name</th>
              <th style={{ padding: '9px 12px' }}>Revision Evolution</th>
              <th style={{ padding: '9px 12px' }}>Concurrency Lock</th>
              <th style={{ padding: '9px 12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {affectedItems.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No BOMs, Routings, or Products attached to this change request yet. Click "Add Affected Item" above.
                </td>
              </tr>
            ) : (
              affectedItems.map(item => {
                const Icon = getItemIcon(item.itemType);
                const badge = getItemTypeBadge(item.itemType);

                // Determine asset name
                let assetCode = '—';
                let assetName = 'Unassigned';
                if (item.itemType === 'BOM') {
                  assetCode = item.bomId?.bomCode || 'BOM';
                  assetName = item.bomId?.bomName || 'BOM Header';
                } else if (item.itemType === 'Routing') {
                  assetCode = item.routingId?.routingCode || 'RTG';
                  assetName = item.routingId?.routingName || 'Routing Header';
                } else if (item.itemType === 'Product Master') {
                  assetCode = item.productId?.code || 'PART';
                  assetName = item.productId?.name || 'Product Master Record';
                }

                return (
                  <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {/* Column 1: Type */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: badge.bg,
                        color: badge.color
                      }}>
                        <Icon size={12} />
                        {badge.label}
                      </span>
                    </td>

                    {/* Column 2: Code & Name */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)', fontSize: 12 }}>
                        {assetCode}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {assetName}
                      </div>
                    </td>

                    {/* Column 3: Revision Evolution */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 5, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {item.currentRevisionCode || 'v1.0'}
                        </span>
                        <ArrowRight size={11} color="#64748b" />
                        {item.newRevisionCode ? (
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#059669',
                            background: 'rgba(16, 185, 129, 0.15)',
                            padding: '1px 5px',
                            borderRadius: 3
                          }}>
                            {item.newRevisionCode} (ECO Active)
                          </span>
                        ) : (
                          <span style={{ fontSize: 10.5, color: '#f59e0b', fontStyle: 'italic' }}>
                            Auto on Approval
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Concurrency Lock */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 10.5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#059669'
                      }}>
                        <CheckCircle2 size={12} />
                        <span>Exclusive ECR Lock</span>
                      </span>
                    </td>

                    {/* Column 5: Actions */}
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {!selectedECR.isLocked ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            onClick={() => onOpenAffectedModal('affected', {
                              ...item,
                              bomId: item.bomId?._id || item.bomId,
                              routingId: item.routingId?._id || item.routingId,
                              productId: item.productId?._id || item.productId
                            }, item._id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: 4 }}
                            title="Edit Affected Item"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteAffected(item._id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: 4 }}
                            title="Delete Affected Item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Locked</span>
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

export default ECRAffectedAssets;
