import React from 'react';
import {
  Link2, Plus, Edit2, Trash2, Star, CheckCircle2,
  AlertCircle, ShieldCheck, Box, Tag
} from 'lucide-react';

export const InquiryCrossRefTab = ({
  selectedInquiry,
  selectedLine,
  crossRefs = [],
  onOpenAddCrossRefModal,
  onOpenEditCrossRefModal,
  onDeleteCrossRef
}) => {
  const isLineLocked = !!selectedLine?.isLocked || !!selectedInquiry?.quotationId;

  if (!selectedLine) {
    return (
      <div style={{
        padding: '36px 20px',
        textAlign: 'center',
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          background: 'rgba(0, 180, 216, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Link2 size={24} color="#0077b6" />
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
          No Line Item Selected
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 440, margin: 0 }}>
          Please select a line item from the <strong>Requested Parts</strong> tab or the line item selector above to view and configure internal cross-referencing and fitment.
        </p>
      </div>
    );
  }

  const primaryMatch = crossRefs.find(r => r.isPrimaryMatch);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── CONTEXT HEADER STRIP ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: 'rgba(0, 180, 216, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Link2 size={18} color="#0077b6" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Part Matching Context:
              </span>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#0077b6',
                fontFamily: 'monospace',
                background: 'rgba(0, 180, 216, 0.12)',
                padding: '1px 6px',
                borderRadius: 4
              }}>
                {selectedLine.customerPartNumber || `Line #${selectedLine.lineSequence}`}
              </span>
              {selectedLine.oemPartNumber && (
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  (OEM: <strong style={{ fontFamily: 'monospace' }}>{selectedLine.oemPartNumber}</strong>)
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Map customer part references to Precision Auto internal SKUs for quotation pricing and fitment guarantee.
            </div>
          </div>
        </div>

        {!isLineLocked && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddCrossRefModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: 6
            }}
          >
            <Plus size={14} /> Add Matching SKU
          </button>
        )}
      </div>

      {/* ── PRIMARY MATCH HIGHLIGHT HERO ─────────────────────────────────── */}
      {primaryMatch && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(0, 180, 216, 0.06) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 8,
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)'
            }}>
              <Star size={20} color="#ffffff" fill="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#059669', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 12 }}>
                  Primary Quotation Match ⭐
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0077b6' }}>
                  {primaryMatch.matchType}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                {primaryMatch.internalProductId?.name || primaryMatch.internalProductId}
                {primaryMatch.internalProductId?.code && (
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', marginLeft: 8 }}>
                    [{primaryMatch.internalProductId.code}]
                  </span>
                )}
              </div>
              {primaryMatch.fitmentNotes && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Fitment: {primaryMatch.fitmentNotes}
                </div>
              )}
            </div>
          </div>

          {!isLineLocked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onOpenEditCrossRefModal(primaryMatch)}
                style={{ fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Edit2 size={12} /> Edit Match
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ALL CROSS-REFERENCES TABLE ──────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            Configured Equivalent & Alternative Parts ({crossRefs.length})
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            For: {selectedLine.customerPartNumber || `Line #${selectedLine.lineSequence}`}
          </span>
        </div>

        {crossRefs.length === 0 ? (
          <div style={{
            padding: '28px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8
          }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
              No alternative parts mapped yet for this line.
            </p>
            {!isLineLocked && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onOpenAddCrossRefModal}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}
              >
                <Plus size={13} /> Add First Equivalent Part
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 12.5
            }}>
              <thead>
                <tr style={{
                  background: 'var(--surface-canvas)',
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase'
                }}>
                  <th style={{ padding: '8px 14px' }}>Internal Precision Part</th>
                  <th style={{ padding: '8px 14px' }}>Match Classification</th>
                  <th style={{ padding: '8px 14px', textAlign: 'center' }}>Primary</th>
                  <th style={{ padding: '8px 14px' }}>Fitment & Engineering Notes</th>
                  {!isLineLocked && <th style={{ padding: '8px 14px', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {crossRefs.map((ref, idx) => (
                  <tr
                    key={ref._id || idx}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: ref.isPrimaryMatch ? 'rgba(16, 185, 129, 0.04)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div>{ref.internalProductId?.name || ref.internalProductId}</div>
                      {ref.internalProductId?.code && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          [{ref.internalProductId.code}]
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: ref.matchType === 'Exact Match'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : ref.matchType === 'Form-Fit-Function'
                          ? 'rgba(0, 180, 216, 0.12)'
                          : 'rgba(245, 158, 11, 0.12)',
                        color: ref.matchType === 'Exact Match'
                          ? '#059669'
                          : ref.matchType === 'Form-Fit-Function'
                          ? '#0077b6'
                          : '#d97706'
                      }}>
                        {ref.matchType}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {ref.isPrimaryMatch ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          color: '#059669',
                          fontWeight: 700,
                          fontSize: 11
                        }}>
                          <Star size={13} fill="#059669" /> Yes
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                      {ref.fitmentNotes || '—'}
                    </td>
                    {!isLineLocked && (
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            type="button"
                            title="Edit match"
                            onClick={() => onOpenEditCrossRefModal(ref)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                              padding: 4
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            title="Delete match"
                            onClick={() => onDeleteCrossRef(ref._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--accent-danger)',
                              padding: 4
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryCrossRefTab;
