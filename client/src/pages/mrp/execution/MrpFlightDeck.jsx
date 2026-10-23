import React from 'react';
import {
  Cpu, GitMerge, Archive, AlertTriangle, ArrowRight,
  ExternalLink, Layers, ShieldCheck, CheckCircle2, ShoppingBag, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../../components/common/StatusBadge';

export const MrpFlightDeck = ({
  selectedRun,
  requirements = [],
  snapshots = [],
  activeView = 'split',
  setActiveView
}) => {
  const navigate = useNavigate();

  if (!selectedRun) return null;

  const totalReqs = requirements.length;
  const expeditedCount = requirements.filter(r => r.isExpedited).length;
  const productionCount = requirements.filter(r => r.requirementType === 'Production').length;
  const procurementCount = requirements.filter(r => r.requirementType === 'Procurement').length;

  const maxBomLevel = requirements.length > 0
    ? Math.max(...requirements.map(r => r.bomLevel || 0))
    : 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0e121b 0%, #151b27 50%, #1d2537 100%)',
      borderRadius: '14px',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      padding: '20px 24px',
      color: '#ffffff',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Element */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '320px',
        height: '100%',
        background: 'radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.16) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Top Row: Run Identifiers & Downstream Module Links */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left: Identifiers */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '3px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              {selectedRun.runNo}
            </span>
            <StatusBadge value={selectedRun.status} />
            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              fontWeight: 600
            }}>
              Target Period: {selectedRun.targetPeriod}
            </span>
          </div>

          <div style={{
            marginTop: '8px',
            fontSize: '13px',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span>Execution Mode: <strong style={{ color: '#38bdf8' }}>Full Regeneration</strong></span>
            <span style={{ color: '#64748b' }}>•</span>
            <span>Run Date: <strong style={{ color: '#ffffff' }}>{new Date(selectedRun.runDate).toLocaleString()}</strong></span>
            <span style={{ color: '#64748b' }}>•</span>
            <span>BOM Depth: <strong style={{ color: '#fde68a' }}>Level {maxBomLevel}</strong></span>
          </div>
        </div>

        {/* Right: Downstream Bridges & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Downstream Bridge 1: Shortages */}
          <button
            type="button"
            onClick={() => navigate('/mrp/shortages')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: expeditedCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              border: expeditedCount > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.16)',
              color: expeditedCount > 0 ? '#fca5a5' : '#cbd5e1',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <AlertTriangle size={13} color={expeditedCount > 0 ? '#ef4444' : '#94a3b8'} />
            <span>Material Shortages</span>
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </button>

          {/* Downstream Bridge 2: Suggested Orders */}
          <button
            type="button"
            onClick={() => navigate('/mrp/recommendations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingBag size={13} />
            <span>Suggested Orders</span>
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </button>

          {/* View Switcher Pill */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '3px',
            display: 'flex',
            gap: '3px'
          }}>
            <button
              type="button"
              onClick={() => setActiveView('split')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeView === 'split' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                color: activeView === 'split' ? '#fbbf24' : '#94a3b8',
                fontSize: '11px',
                fontWeight: activeView === 'split' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              Dual View
            </button>
            <button
              type="button"
              onClick={() => setActiveView('reqs')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeView === 'reqs' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                color: activeView === 'reqs' ? '#fbbf24' : '#94a3b8',
                fontSize: '11px',
                fontWeight: activeView === 'reqs' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              Exploded BOM Only
            </button>
            <button
              type="button"
              onClick={() => setActiveView('snaps')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeView === 'snaps' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                color: activeView === 'snaps' ? '#fbbf24' : '#94a3b8',
                fontSize: '11px',
                fontWeight: activeView === 'snaps' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              Stock Snapshot Only
            </button>
          </div>
        </div>
      </div>

      {/* Quick Status Advisory Pill */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: '8px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12px',
        color: '#fde68a'
      }}>
        <Cpu size={15} color="#f59e0b" />
        <span>
          <strong>Calculation Engine Output:</strong> BOM Explosion exploded <strong>{totalReqs} total component requirements</strong> ({productionCount} factory work orders, {procurementCount} supplier purchase requisitions). Quantities are locked to ensure MRP scheduling determinism.
        </span>
      </div>
    </div>
  );
};
