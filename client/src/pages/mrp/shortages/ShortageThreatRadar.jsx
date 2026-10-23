import React from 'react';
import {
  ShieldAlert, AlertTriangle, PackageX, Factory,
  RefreshCw, ExternalLink, Activity, CheckCircle2, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ShortageThreatRadar = ({
  mrpRuns = [],
  selectedRunId,
  onRunChange,
  isLiveMode,
  onToggleLive,
  loading,
  shortages = []
}) => {
  const navigate = useNavigate();

  // Metrics derivation
  const constraints = shortages.filter(s => s.shortageCategory === 'Production Constraint');
  const rawMaterials = shortages.filter(s => s.shortageCategory === 'Raw Material');
  const components = shortages.filter(s => s.shortageCategory === 'Component');

  const criticalCount = shortages.filter(s => s.severity === 'Critical').length;
  const highCount = shortages.filter(s => s.severity === 'High').length;
  const resolvedCount = shortages.filter(s => s.status === 'Resolved' || s.status?.includes('Resolved') || s.status === 'Action Taken').length;
  const totalCount = shortages.length;
  const mitigationRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  const totalRawDeficit = rawMaterials.reduce((sum, r) => sum + (Number(r.shortageQty) || 0), 0);
  const totalCompDeficit = components.reduce((sum, c) => sum + (Number(c.shortageQty) || 0), 0);

  const activeRun = mrpRuns.find(r => r._id === selectedRunId);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #111827 0%, #1e1b2e 50%, #18181b 100%)',
      borderRadius: '14px',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      padding: '24px 26px',
      boxShadow: '0 12px 36px rgba(220, 38, 38, 0.12), 0 4px 16px rgba(0, 0, 0, 0.4)',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Radar Grid Glow Accent */}
      <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-40px',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.05) 50%, transparent 80%)',
        pointerEvents: 'none',
        filter: 'blur(30px)'
      }} />

      {/* Top Bar: Title, Run Selector, Mode Toggle & Bridges */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
          }}>
            <ShieldAlert size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff'
              }}>
                Material Shortages Sentinel
              </h1>
              <span style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isLiveMode ? '#10b981' : '#ef4444',
                  boxShadow: isLiveMode ? '0 0 8px #10b981' : '0 0 8px #ef4444'
                }} />
                {isLiveMode ? 'Live Inventory Mode' : 'MRP Run Snapshot'}
              </span>
            </div>
            <p style={{
              margin: '3px 0 0 0',
              fontSize: '12.5px',
              color: '#94a3b8'
            }}>
              Early-warning supply threat radar, bottleneck constraints, and inventory runout containment.
            </p>
          </div>
        </div>

        {/* Right Controls: Plan Run Selector, Recalculate Button & Bridges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Run Selection Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Target Run:</span>
            <select
              value={selectedRunId}
              onChange={onRunChange}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '7px 12px',
                color: '#f8fafc',
                fontSize: '12.5px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'monospace',
                minWidth: '220px'
              }}
            >
              {mrpRuns.length === 0 ? (
                <option value="" disabled>No MRP runs available</option>
              ) : (
                mrpRuns.map(r => (
                  <option key={r._id} value={r._id} style={{ background: '#1e293b', color: '#fff' }}>
                    {r.runNo} — {r.targetPeriod} ({r.status})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Live Recalculate / Mode Switcher */}
          <button
            type="button"
            onClick={onToggleLive}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              border: isLiveMode ? '1px solid #10b981' : '1px solid rgba(239, 68, 68, 0.5)',
              background: isLiveMode
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%)',
              color: isLiveMode ? '#6ee7b7' : '#fca5a5'
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {isLiveMode ? 'Live Mode Active' : 'Recalculate Live Stock'}
          </button>

          {/* Direct Downstream / Upstream Bridges */}
          <button
            type="button"
            onClick={() => navigate('/mrp/recommendations')}
            title="Go to Suggested Orders to convert shortages into purchase or work orders"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid rgba(14, 165, 233, 0.4)',
              background: 'rgba(14, 165, 233, 0.12)',
              color: '#38bdf8',
              cursor: 'pointer'
            }}
          >
            <Zap size={13} /> Suggested Orders <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* Live Mode Notice Banner */}
      {isLiveMode && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#a7f3d0',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          position: 'relative',
          zIndex: 1
        }}>
          <span>
            ⚡ <strong>Live Millisecond Calculation Active:</strong> Shortage quantities reflect current physical stock, incoming POs, and allocations in real-time. Items whose deficits cleared via recent receipts are flagged as <em>Resolved (Math Cleared)</em>.
          </span>
          <button
            type="button"
            onClick={onToggleLive}
            style={{
              background: 'none',
              border: 'none',
              color: '#34d399',
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '11.5px'
            }}
          >
            Restore Snapshot
          </button>
        </div>
      )}

      {/* 4 Threat Telemetry Radar Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Card 1: Production Constraints */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fca5a5', fontWeight: 700 }}>
              Production Blockers
            </span>
            <AlertTriangle size={15} color="#ef4444" />
          </div>
          <div style={{ margin: '8px 0 4px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {constraints.length}
            </span>
            <span style={{ fontSize: '11.5px', color: '#f87171' }}>
              {constraints.length > 0 ? 'Active Constraints' : 'Clear Shop Floor'}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Capacity, missing BOMs & unapproved routings
          </span>
        </div>

        {/* Card 2: Raw Material Deficits */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fde68a', fontWeight: 700 }}>
              Raw Material Deficits
            </span>
            <PackageX size={15} color="#f59e0b" />
          </div>
          <div style={{ margin: '8px 0 4px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {rawMaterials.length}
            </span>
            <span style={{ fontSize: '11.5px', color: '#fbbf24' }}>
              {totalRawDeficit.toLocaleString()} units short
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Purchased coils, sheets & weld consumables
          </span>
        </div>

        {/* Card 3: Sub-Assemblies Short */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#bae6fd', fontWeight: 700 }}>
              Sub-Assemblies Short
            </span>
            <Factory size={15} color="#38bdf8" />
          </div>
          <div style={{ margin: '8px 0 4px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {components.length}
            </span>
            <span style={{ fontSize: '11.5px', color: '#38bdf8' }}>
              {totalCompDeficit.toLocaleString()} units short
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Fabricated pressings & welded brackets
          </span>
        </div>

        {/* Card 4: Mitigation Progress */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a7f3d0', fontWeight: 700 }}>
              Mitigation Progress
            </span>
            <CheckCircle2 size={15} color="#10b981" />
          </div>
          <div style={{ margin: '8px 0 4px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {mitigationRate}%
            </span>
            <span style={{ fontSize: '11.5px', color: '#34d399' }}>
              {resolvedCount} of {totalCount} actioned
            </span>
          </div>
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '4px'
          }}>
            <div style={{
              width: `${mitigationRate}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #34d399)'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};
