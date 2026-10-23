import React from 'react';
import {
  TrendingUp, BarChart3, Plus, BrainCircuit, Activity,
  Sliders, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

export const ForecastTelemetryBar = ({
  showHistorical,
  setShowHistorical,
  headers = [],
  lines = [],
  onOpenCreateModal,
  onRefresh
}) => {
  // Aggregate Metrics
  const totalVolume = headers.reduce((sum, h) => sum + (Number(h.totalAdjustedQty) || 0), 0);
  const activeModelsCount = headers.length;
  
  // Algorithm breakdown
  const algoCounts = headers.reduce((acc, h) => {
    const algo = h.algorithmUsed || 'Manual Entry';
    acc[algo] = (acc[algo] || 0) + 1;
    return acc;
  }, {});

  // Confidence index from lines if available, or average ~92%
  const avgConfidence = lines.length > 0
    ? Math.round(lines.reduce((acc, l) => acc + (Number(l.confidenceScorePercentage) || 90), 0) / lines.length)
    : 92;

  // Finalized vs Review count
  const finalizedCount = headers.filter(h => h.status === 'Finalized').length;
  const pendingCount = headers.filter(h => h.status === 'Pending Review').length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #090d1f 0%, #12163b 45%, #1d1841 100%)',
      borderRadius: '14px',
      border: '1px solid rgba(139, 92, 246, 0.25)',
      padding: '20px 24px',
      color: '#fff',
      boxShadow: '0 8px 32px rgba(9, 13, 31, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Grid Wave */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '420px',
        height: '100%',
        background: 'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.18) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top Row: Title, Subtitle, Navigation Pills & Actions */}
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
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
          }}>
            <BrainCircuit size={24} color="#ffffff" />
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
                Demand Forecasting & Predictive Horizon Lab
              </h1>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.18)',
                color: '#22d3ee',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                AI & Time-Series Engine
              </span>
            </div>
            <p style={{
              margin: '4px 0 0',
              fontSize: '12px',
              color: '#94a3b8',
              lineHeight: 1.4
            }}>
              Multi-algorithm customer & product horizon projections with statistical confidence bounds, human overrides, and MRP consensus gates.
            </p>
          </div>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mode Switcher Pill */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '3px',
            display: 'flex',
            gap: '3px'
          }}>
            <button
              type="button"
              onClick={() => setShowHistorical(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: !showHistorical
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                  : 'transparent',
                color: !showHistorical ? '#ffffff' : '#94a3b8',
                fontWeight: !showHistorical ? 600 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: !showHistorical ? '0 2px 8px rgba(124, 58, 237, 0.4)' : 'none'
              }}
            >
              <TrendingUp size={14} />
              Projections & Lab
            </button>
            <button
              type="button"
              onClick={() => setShowHistorical(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: showHistorical
                  ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                  : 'transparent',
                color: showHistorical ? '#ffffff' : '#94a3b8',
                fontWeight: showHistorical ? 600 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: showHistorical ? '0 2px 8px rgba(6, 182, 212, 0.4)' : 'none'
              }}
            >
              <BarChart3 size={14} />
              Historical Actuals
            </button>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh Models"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
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

          {/* Create Forecast Button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.45)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={16} />
            Create Forecast
          </button>
        </div>
      </div>

      {/* Bottom Row: Live Mathematical Telemetry Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Card 1: Total Forecast Volume */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
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
            color: '#a78bfa',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>Total Horizon Demand</span>
            <Activity size={14} color="#8b5cf6" />
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            fontFamily: 'monospace'
          }}>
            {totalVolume.toLocaleString()} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>units</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Consensus net volume across all periods
          </div>
        </div>

        {/* Card 2: Active Models & Algorithms */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
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
            color: '#22d3ee',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>Active Forecasting Models</span>
            <BrainCircuit size={14} color="#06b6d4" />
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
            <span>{activeModelsCount}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>
              ({finalizedCount} Finalized, {pendingCount} In Review)
            </span>
          </div>
          <div style={{
            fontSize: '11px',
            color: '#cbd5e1',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span>Prophet: {algoCounts['ML-Prophet'] || 0}</span>
            <span>•</span>
            <span>Smoothing: {algoCounts['Exponential Smoothing'] || 0}</span>
            <span>•</span>
            <span>MA: {algoCounts['Moving Average'] || 0}</span>
          </div>
        </div>

        {/* Card 3: Model Confidence Index */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
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
            <span>Algorithmic Confidence</span>
            <ShieldCheck size={14} color="#10b981" />
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{avgConfidence}%</span>
            <span style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: avgConfidence >= 90 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: avgConfidence >= 90 ? '#34d399' : '#fbbf24',
              fontWeight: 600
            }}>
              {avgConfidence >= 90 ? 'High Accuracy' : 'Acceptable'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Gaussian confidence interval across bucket lines
          </div>
        </div>

        {/* Card 4: Consensus & MRP Status */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
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
            <span>MRP Gate Readiness</span>
            <CheckCircle2 size={14} color="#f59e0b" />
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
            <span>{finalizedCount} / {activeModelsCount}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>
              Locked for Material Run
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {pendingCount > 0 ? `⚠️ ${pendingCount} model(s) awaiting final consensus` : 'All models finalized for MRP generation'}
          </div>
        </div>
      </div>
    </div>
  );
};
