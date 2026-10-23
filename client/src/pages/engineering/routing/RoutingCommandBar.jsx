import React from 'react';
import {
  PlayCircle, Edit2, Sparkles, Download, Printer, Plus,
  GitBranch, Zap, Clock, Factory, Truck, Flame, ArrowUpRight,
  ShieldCheck, AlertTriangle
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

const MES = {
  headerBg: 'linear-gradient(135deg, #090d16 0%, #0f172a 45%, #1e293b 100%)',
  headerBorder: 'rgba(56, 189, 248, 0.22)',
  cyanNeon: '#06b6d4',
  cyanLight: '#38bdf8',
  amberFlame: '#f59e0b',
  rubyCritical: '#f43f5e',
  emeraldSuccess: '#10b981',
  slateDark: '#0f172a',
  slateMid: '#1e293b',
  slateLight: '#334155'
};

export const RoutingCommandBar = ({
  selectedHeader,
  selectedRevision,
  revisions,
  telemetry,
  busy,
  onSelectRevision,
  onQuickStatusChange,
  onOpenModal,
  onCalibrate,
  onExportCSV,
  onPrintTraveler
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* ── UNIFIED COMMAND BAR ────────────────────────────────────────── */}
      <div style={{
        background: MES.headerBg,
        borderRadius: 8,
        padding: '10px 16px',
        color: '#ffffff',
        border: `1px solid ${MES.headerBorder}`,
        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Left: Studio Branding & Active Sheet Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            borderRadius: 8,
            padding: '7px 9px',
            display: 'flex',
            alignItems: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 10px rgba(2, 132, 199, 0.45)',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            <PlayCircle size={18} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Flowline Studio
              </span>
              <span style={{ fontSize: 11, color: '#64748b' }}>•</span>
              {selectedHeader ? (
                <>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: 12,
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.45)',
                    padding: '2px 7px',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'inline-block',
                      boxShadow: '0 0 6px #10b981'
                    }} />
                    {selectedHeader.routingCode}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                    {selectedHeader.routingName}
                  </span>
                  <StatusBadge value={selectedHeader.status} />
                </>
              ) : (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Select a process sheet from the registry</span>
              )}
            </div>

            {selectedHeader && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#94a3b8', marginTop: 3, flexWrap: 'wrap' }}>
                <span>Part: <strong style={{ color: '#ffffff' }}>{selectedHeader.productId?.name} ({selectedHeader.productId?.code})</strong></span>
                <span>•</span>
                <span>Plant: <strong style={{ color: '#cbd5e1' }}>{selectedHeader.plantId?.name || 'Standard Plant'}</strong></span>
                <span>•</span>
                <span>Lot: <strong style={{ color: '#38bdf8' }}>{selectedHeader.baseQuantity} pcs</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Studio Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {selectedHeader && (
            <button
              onClick={() => onOpenModal('header', {
                ...selectedHeader,
                productId: selectedHeader.productId?._id || selectedHeader.productId,
                plantId: selectedHeader.plantId?._id || selectedHeader.plantId
              }, selectedHeader._id)}
              className="btn btn-secondary"
              style={{
                fontSize: 11.5,
                padding: '5px 9px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Edit process sheet header specifications"
            >
              <Edit2 size={12} /> Edit Sheet
            </button>
          )}

          <button
            onClick={onCalibrate}
            disabled={busy || !selectedHeader}
            className="btn btn-secondary"
            style={{
              fontSize: 11.5,
              padding: '5px 9px',
              background: 'rgba(2, 132, 199, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
            title="Auto-seed realistic automotive operations and tooling standards"
          >
            <Sparkles size={12} color="#38bdf8" /> Calibrate Line
          </button>

          <button
            onClick={onExportCSV}
            disabled={!selectedHeader || telemetry.totalOps === 0}
            className="btn btn-secondary"
            style={{
              fontSize: 11.5,
              padding: '5px 9px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Download size={12} /> Export CSV
          </button>

          <button
            onClick={onPrintTraveler}
            disabled={!selectedHeader}
            className="btn btn-secondary"
            style={{
              fontSize: 11.5,
              padding: '5px 9px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
            title="Print manufacturing shop floor traveler"
          >
            <Printer size={12} /> Print Traveler
          </button>

          <button
            onClick={() => onOpenModal('header', {
              routingCode: 'RTG-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
              baseQuantity: 100,
              isDefaultRouting: false,
              status: 'Active'
            })}
            className="btn btn-primary"
            style={{
              fontSize: 11.5,
              padding: '5px 11px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#ffffff',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Plus size={13} /> Add Process Sheet
          </button>
        </div>
      </div>

      {/* ── REVISIONS BAR & LIVE TELEMETRY HUD ───────────────────────────── */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: '6px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8
      }}>
        {/* Left: Revisions Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
            <GitBranch size={13} color="#0284c7" />
            <span>Revisions:</span>
          </div>

          {revisions.length === 0 ? (
            <span style={{ fontSize: 11, color: 'var(--status-caution-fg)' }}>No revisions yet.</span>
          ) : (
            revisions.map(rev => {
              const isRevSelected = selectedRevision?._id === rev._id;
              return (
                <div
                  key={rev._id}
                  onClick={() => onSelectRevision(rev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: isRevSelected ? 700 : 500,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isRevSelected ? '#0284c7' : 'var(--border-color)',
                    background: isRevSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-primary)',
                    color: isRevSelected ? '#0284c7' : 'var(--text-primary)'
                  }}
                >
                  <span>{rev.revisionCode}</span>
                  <span style={{
                    fontSize: 9.5,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: rev.approvalStatus === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                    color: rev.approvalStatus === 'Approved' ? '#059669' : 'var(--text-secondary)',
                    fontWeight: 700
                  }}>
                    {rev.approvalStatus}
                  </span>
                </div>
              );
            })
          )}

          <button
            onClick={() => onOpenModal('revision', {
              routingId: selectedHeader?._id,
              revisionCode: `v1.${revisions.length}`,
              validFromDate: new Date().toISOString().split('T')[0],
              approvalStatus: 'Draft'
            })}
            disabled={!selectedHeader}
            className="btn btn-secondary"
            style={{ fontSize: 10.5, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <Plus size={10} /> New Rev
          </button>

          {selectedRevision && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6, fontSize: 11 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
              <select
                value={selectedRevision.approvalStatus}
                onChange={e => onQuickStatusChange(selectedRevision._id, e.target.value)}
                style={{
                  padding: '2px 6px',
                  fontSize: 11,
                  borderRadius: 4,
                  border: '1px solid var(--border-color)',
                  background: selectedRevision.approvalStatus === 'Approved' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary)',
                  color: selectedRevision.approvalStatus === 'Approved' ? '#047857' : 'var(--text-primary)',
                  fontWeight: 700
                }}
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Obsolete">Obsolete</option>
              </select>

              {selectedRevision.ecoNumber && (
                <span style={{
                  fontSize: 10,
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  padding: '1px 6px',
                  borderRadius: 3,
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  fontWeight: 600
                }}>
                  ECO: {selectedRevision.ecoNumber?.changeNumber || 'Attached'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Takt Telemetry HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 7px',
            borderRadius: 4,
            background: 'rgba(2, 132, 199, 0.1)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            fontSize: 10.5
          }}>
            <Zap size={11} color="#0284c7" />
            <span style={{ color: 'var(--text-secondary)' }}>Cycle:</span>
            <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{telemetry.totalCycle.toFixed(1)}m</strong>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 7px',
            borderRadius: 4,
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            fontSize: 10.5
          }}>
            <Clock size={11} color="#f59e0b" />
            <span style={{ color: 'var(--text-secondary)' }}>Setup:</span>
            <strong style={{ color: '#d97706', fontFamily: 'monospace' }}>{telemetry.totalSetup}m</strong>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 7px',
            borderRadius: 4,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: 10.5
          }}>
            <Factory size={11} color="#059669" />
            <span style={{ color: 'var(--text-secondary)' }}>Run:</span>
            <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{telemetry.totalRun}m</strong>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 7px',
            borderRadius: 4,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            fontSize: 10.5
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Stations:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{telemetry.totalOps}</strong>
          </div>

          {telemetry.bottleneckOp && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              borderRadius: 4,
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              fontSize: 10.5
            }}>
              <Flame size={11} color="#f43f5e" />
              <span style={{ color: 'var(--text-secondary)' }}>Pacing:</span>
              <strong style={{ color: '#e11d48' }}>OP #{telemetry.bottleneckOp.operationSequence} ({telemetry.bottleneckTime.toFixed(1)}m)</strong>
            </div>
          )}

          {telemetry.subcontractedCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              borderRadius: 4,
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              fontSize: 10.5
            }}>
              <Truck size={11} color="#8b5cf6" />
              <span style={{ color: 'var(--text-secondary)' }}>Outside:</span>
              <strong style={{ color: '#8b5cf6' }}>{telemetry.subcontractedCount}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default RoutingCommandBar;
