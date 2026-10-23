import React from 'react';
import { 
  Award, ShieldAlert, Star, RefreshCw, Printer, 
  CheckCircle2, AlertTriangle, Truck, Layers, FileText, Zap
} from 'lucide-react';

const PerformanceHeaderBar = ({
  scorecards = [],
  activePerspective,
  setActivePerspective,
  onPrintAudit,
  onRefresh,
  loading = false
}) => {
  const totalVendors = scorecards.length;
  const approvedCount = scorecards.filter(s => s.riskStatus === 'Approved').length;
  const probationCount = scorecards.filter(s => s.riskStatus === 'Probation').length;
  const blockedCount = scorecards.filter(s => s.riskStatus === 'Blocked').length;

  const avgOtif = totalVendors > 0 
    ? (scorecards.reduce((sum, s) => sum + (s.rollingOtifPct || 0), 0) / totalVendors).toFixed(1) 
    : '0';

  const avgPpm = totalVendors > 0
    ? Math.round(scorecards.reduce((sum, s) => sum + (s.rollingDefectPpm || 0), 0) / totalVendors)
    : 0;

  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      padding: '16px 20px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {/* ── Top Row: Title, Sourcing Badges & Actions ───────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Title & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
            flexShrink: 0
          }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Supplier Performance & Quality Rating
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                IATF 16949 & VDA 6.3 Vendor Scorecard
              </span>
            </div>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              margin: '3px 0 0 0'
            }}>
              Continuous delivery OTIF metrics, defect PPM tracking, risk classification & certificate compliance.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onPrintAudit}
            title="Generate VDA 6.3 / IATF 16949 Supplier Evaluation Audit Report"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              fontSize: '12px',
              fontWeight: 500,
              background: 'var(--surface-canvas)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <Printer size={14} color="var(--text-secondary)" />
            <span>Audit Report (VDA 6.3)</span>
          </button>

          <button
            onClick={onRefresh}
            title="Refresh Live Scorecards"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 11px',
              fontSize: '12px',
              background: 'var(--surface-canvas)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Bottom Row: Clean Calm Metrics Strip & Perspective Pills ─────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-color)'
      }}>
        {/* Metric Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'var(--surface-canvas)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '12px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Suppliers Rated:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalVendors}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(16, 185, 129, 0.08)',
            borderRadius: '6px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '12px'
          }}>
            <CheckCircle2 size={13} color="#059669" />
            <span style={{ color: '#047857', fontWeight: 500 }}>Approved (Tier-1):</span>
            <span style={{ fontWeight: 700, color: '#047857' }}>{approvedCount}</span>
          </div>

          {probationCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(245, 158, 11, 0.08)',
              borderRadius: '6px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '12px'
            }}>
              <AlertTriangle size={13} color="#d97706" />
              <span style={{ color: '#b45309', fontWeight: 500 }}>Under Probation:</span>
              <span style={{ fontWeight: 700, color: '#b45309' }}>{probationCount}</span>
            </div>
          )}

          {blockedCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.08)',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '12px'
            }}>
              <ShieldAlert size={13} color="#dc2626" />
              <span style={{ color: '#dc2626', fontWeight: 500 }}>Blocked / Expired:</span>
              <span style={{ fontWeight: 700, color: '#dc2626' }}>{blockedCount}</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'var(--surface-canvas)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '12px'
          }}>
            <Truck size={13} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Average OTIF:</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>{avgOtif}%</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'var(--surface-canvas)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '12px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Fleet Defect PPM:</span>
            <span style={{ fontWeight: 700, color: avgPpm > 1000 ? '#dc2626' : 'var(--text-primary)' }}>
              {avgPpm} PPM
            </span>
          </div>
        </div>

        {/* Perspective Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--surface-canvas)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActivePerspective('Studio')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Studio' ? 600 : 500,
              background: activePerspective === 'Studio' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Studio' ? '#059669' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: activePerspective === 'Studio' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Studio' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Award size={13} />
            <span>Scorecard Studio</span>
          </button>

          <button
            onClick={() => setActivePerspective('Ledger')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Ledger' ? 600 : 500,
              background: activePerspective === 'Ledger' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Ledger' ? '#059669' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: activePerspective === 'Ledger' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Ledger' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={13} />
            <span>Rating Matrix</span>
          </button>

          <button
            onClick={() => setActivePerspective('Simulator')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Simulator' ? 600 : 500,
              background: activePerspective === 'Simulator' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Simulator' ? '#059669' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: activePerspective === 'Simulator' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Simulator' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Zap size={13} />
            <span>Incident Simulator</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceHeaderBar;
