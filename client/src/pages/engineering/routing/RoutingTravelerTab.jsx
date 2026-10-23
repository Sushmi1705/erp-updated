import React from 'react';
import { Printer, ShieldCheck, PlayCircle, QrCode, CheckSquare, FileText } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const RoutingTravelerTab = ({
  selectedHeader,
  selectedRevision,
  operations,
  resources
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── PRINT & TRAVELER ACTIONS ───────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} color="#0284c7" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Official Automotive Manufacturing Shop Traveler & Route Card
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="btn btn-primary"
          style={{
            fontSize: 12,
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
          }}
        >
          <Printer size={13} /> Print Shop Traveler
        </button>
      </div>

      {/* ── PRINTABLE AUTOMOTIVE TRAVELER CARD ──────────────────────────── */}
      <div
        id="printable-traveler"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 8,
          border: '2px solid #0f172a',
          padding: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}
      >
        {/* Company Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #0f172a',
          paddingBottom: 12,
          marginBottom: 14
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a', textTransform: 'uppercase' }}>
              Precision Auto Components Pvt Ltd
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569', fontWeight: 600 }}>
              Automotive Pressings, Welded Sub-Assemblies & Precision Components
            </p>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0284c7', marginTop: 4, letterSpacing: '0.04em' }}>
              SHOP FLOOR MANUFACTURING TRAVELER & ROUTE SHEET
            </div>
          </div>

          {/* Barcode & Route Code Box */}
          <div style={{
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: '0.15em',
              background: '#f1f5f9',
              padding: '2px 8px',
              border: '1px solid #cbd5e1',
              borderRadius: 4
            }}>
              *{selectedHeader.routingCode}*
            </span>
            <div style={{
              letterSpacing: '3px',
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: 14,
              color: '#0f172a',
              marginTop: 2
            }}>
              ||| | || |||| | ||| || ||
            </div>
            <span style={{ fontSize: 10, color: '#64748b' }}>
              Revision: <strong>{selectedRevision?.revisionCode || 'v1.0'}</strong> ({selectedRevision?.approvalStatus || 'Draft'})
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          background: '#f8fafc',
          padding: '10px 14px',
          borderRadius: 6,
          border: '1px solid #e2e8f0',
          marginBottom: 16,
          fontSize: 11.5
        }}>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Part Number / Code</span>
            <strong style={{ color: '#0f172a', fontSize: 12 }}>{selectedHeader.productId?.code || 'PRD-AUTO'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Part Description</span>
            <strong style={{ color: '#0f172a', fontSize: 12 }}>{selectedHeader.productId?.name}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Manufacturing Plant</span>
            <strong style={{ color: '#0f172a', fontSize: 12 }}>{selectedHeader.plantId?.name || 'LBAP Hosur'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Standard Lot Size</span>
            <strong style={{ color: '#0f172a', fontSize: 12 }}>{selectedHeader.baseQuantity} PCS</strong>
          </div>

          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Work Order / Job #</span>
            <span style={{ color: '#475569', fontFamily: 'monospace' }}>WO-________-____</span>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Traveler Release Date</span>
            <strong style={{ color: '#0f172a' }}>{new Date().toLocaleDateString()}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Approval Status</span>
            <strong style={{ color: selectedRevision?.approvalStatus === 'Approved' ? '#059669' : '#d97706' }}>
              {selectedRevision?.approvalStatus || 'Draft'}
            </strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Inspection Milestones</span>
            <strong style={{ color: '#0f172a' }}>
              {operations.filter(o => o.controlKey === 'Milestone').length} Quality Gates
            </strong>
          </div>
        </div>

        {/* Shop Floor Sequential Routing Table */}
        <div style={{ border: '1px solid #0f172a', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                <th style={{ padding: '6px 8px', width: 45 }}>Op #</th>
                <th style={{ padding: '6px 8px' }}>Process Operation</th>
                <th style={{ padding: '6px 8px' }}>Work Center / Machine</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', width: 65 }}>Setup (m)</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', width: 65 }}>Run (m)</th>
                <th style={{ padding: '6px 8px', width: 100 }}>Tool / Die ID</th>
                <th style={{ padding: '6px 8px', width: 95 }}>Operator Sign</th>
                <th style={{ padding: '6px 8px', width: 95 }}>QC 1st Off Stamp</th>
                <th style={{ padding: '6px 8px', width: 65 }}>Qty Pass</th>
              </tr>
            </thead>
            <tbody>
              {operations.map(op => {
                const opTool = resources.find(r => r.operationId === op._id || r.operationId?._id === op._id);
                return (
                  <tr key={op._id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '8px', fontWeight: 900, fontFamily: 'monospace' }}>
                      {op.operationSequence}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {op.operationDescription}
                      </div>
                      {op.controlKey === 'Milestone' && (
                        <span style={{ fontSize: 9, color: '#059669', fontWeight: 800 }}>
                          [MANDATORY QA MILESTONE GATE]
                        </span>
                      )}
                      {op.isSubcontracted && (
                        <span style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 800 }}>
                          [OUTSIDE VENDOR SUBCONTRACT]
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 600 }}>{op.workCenterId?.name}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{op.machineId?.name || 'Manual / In-House'}</div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {op.setupTime || 0}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {op.runTime || 0}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: 10.5 }}>
                      {opTool?.resourceCode || '—'}
                    </td>
                    <td style={{ padding: '8px', borderLeft: '1px dashed #cbd5e1' }}>
                      <div style={{ height: 18, borderBottom: '1px dotted #94a3b8' }} />
                    </td>
                    <td style={{ padding: '8px', borderLeft: '1px dashed #cbd5e1' }}>
                      <div style={{ height: 18, borderBottom: '1px dotted #94a3b8' }} />
                    </td>
                    <td style={{ padding: '8px', borderLeft: '1px dashed #cbd5e1' }}>
                      <div style={{ height: 18, borderBottom: '1px dotted #94a3b8' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Traveler Sign-Off Footer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          borderTop: '1px solid #0f172a',
          paddingTop: 12,
          fontSize: 10.5,
          color: '#334155'
        }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 20 }}>Process Engineer Issued:</div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 3 }}>Signature & Date</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 20 }}>Production Supervisor:</div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 3 }}>Signature & Date</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 20 }}>QA Line Inspector:</div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 3 }}>Stamp & Signature</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 20 }}>Finished Goods Store Receipt:</div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 3 }}>Qty Received & Date</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RoutingTravelerTab;
