import React from 'react';
import {
  Cpu, Play, RefreshCw, GitMerge, AlertTriangle,
  CheckCircle2, Layers, ShieldAlert, Zap, Clock, Package
} from 'lucide-react';

export const MrpTelemetryBar = ({
  mrpRuns = [],
  selectedRun,
  requirements = [],
  snapshots = [],
  onOpenExecuteModal,
  onRefresh,
  executing = false
}) => {
  // Aggregate Metrics for selected run
  const totalReqCount = requirements.length;
  const productionCount = requirements.filter(r => r.requirementType === 'Production').length;
  const procurementCount = requirements.filter(r => r.requirementType === 'Procurement').length;
  const expeditedCount = requirements.filter(r => r.isExpedited).length;

  const maxBomLevel = requirements.length > 0
    ? Math.max(...requirements.map(r => r.bomLevel || 0))
    : 0;

  const totalSnapshots = snapshots.length;
  const deficitAtpCount = snapshots.filter(s => {
    const atp = (s.onHandQty || 0) + (s.scheduledReceiptsQty || 0) - (s.allocatedQty || 0);
    return atp < 0;
  }).length;

  const completedRuns = mrpRuns.filter(r => r.status === 'Completed').length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0d14 0%, #121824 45%, #1c2233 100%)',
      borderRadius: '14px',
      border: '1px solid rgba(245, 158, 11, 0.28)',
      padding: '20px 24px',
      color: '#ffffff',
      boxShadow: '0 8px 32px rgba(10, 13, 20, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Radial Glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '450px',
        height: '100%',
        background: 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.16) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(245, 158, 11, 0.45)'
          }}>
            <Cpu size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#ffffff'
              }}>
                Material Requirements Planning (MRP) Engine
              </h1>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.18)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                BOM Explosion Reactor
              </span>
            </div>
            <p style={{
              margin: '4px 0 0',
              fontSize: '12px',
              color: '#94a3b8',
              lineHeight: 1.4
            }}>
              Recursive multi-level BOM explosion, point-in-time stock freezing, and lead-time offset calculation generating work and purchase orders.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh MRP Runs"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                color: '#cbd5e1',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <RefreshCw size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenExecuteModal}
            disabled={executing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: executing ? 'wait' : 'pointer',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.5)',
              transition: 'transform 0.15s ease',
              opacity: executing ? 0.7 : 1
            }}
            onMouseEnter={e => !executing && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => !executing && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Zap size={15} />
            {executing ? 'Executing Reactor…' : 'Start New MRP Run'}
          </button>
        </div>
      </div>

      {/* Telemetry Metric Chips */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Card 1: Exploded Requirements */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#fbbf24',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>Net Exploded Items</span>
            <GitMerge size={14} color="#f59e0b" />
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px'
          }}>
            <span>{totalReqCount}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>
              ({productionCount} Make / {procurementCount} Buy)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
            Production work orders & purchase requirements
          </div>
        </div>

        {/* Card 2: BOM Explosion Depth */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#38bdf8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>BOM Explosion Depth</span>
            <Layers size={14} color="#38bdf8" />
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px'
          }}>
            <span>Level {maxBomLevel}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>
              Max Nesting Depth
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            L0 Finished Parts ➔ L{maxBomLevel} Raw Materials
          </div>
        </div>

        {/* Card 3: Expedited Lead Time Violations */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: expeditedCount > 0 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: expeditedCount > 0 ? '#f87171' : '#34d399',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>Lead-Time Violations</span>
            {expeditedCount > 0 ? <AlertTriangle size={14} color="#ef4444" /> : <CheckCircle2 size={14} color="#10b981" />}
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px'
          }}>
            <span style={{ color: expeditedCount > 0 ? '#f87171' : '#34d399' }}>
              {expeditedCount}
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>
              {expeditedCount > 0 ? 'Urgent Expedite Needed' : 'No Lead-Time Breaches'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Required date precedes procurement lead time
          </div>
        </div>

        {/* Card 4: Frozen Point-in-Time Inventory */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#34d399',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>Stock Snapshot Status</span>
            <Package size={14} color="#10b981" />
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px'
          }}>
            <span>{totalSnapshots}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>
              Items Frozen
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {deficitAtpCount > 0 ? `⚠️ ${deficitAtpCount} items in ATP deficit` : 'Stock & open purchase orders frozen'}
          </div>
        </div>
      </div>
    </div>
  );
};
