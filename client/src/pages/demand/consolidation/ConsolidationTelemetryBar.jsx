import React from 'react';
import {
  Layers, RefreshCw, GitMerge, ShieldCheck, CheckCircle2,
  Lock, ArrowRight, TrendingUp, ShoppingBag, Zap, Activity
} from 'lucide-react';

export const ConsolidationTelemetryBar = ({
  runs = [],
  selectedRun,
  lines = [],
  onOpenGenerateModal,
  onRefresh
}) => {
  // Aggregate Metrics for selected run or overall
  const totalNetDemand = lines.reduce((sum, l) => sum + (Number(l.finalNetDemand) || 0), 0);
  const totalForecastDemand = lines.reduce((sum, l) => sum + (Number(l.forecastDemandQty) || 0), 0);
  const totalSalesOrderDemand = lines.reduce((sum, l) => sum + (Number(l.salesOrderQty) || 0), 0);
  const totalSafetyStock = lines.reduce((sum, l) => sum + (Number(l.safetyStockQty) || 0), 0);
  const totalManualAdjustment = lines.reduce((sum, l) => sum + (Number(l.manualAdjustmentQty) || 0), 0);

  const totalGross = totalForecastDemand + totalSalesOrderDemand + totalSafetyStock;
  const forecastShare = totalGross > 0 ? ((totalForecastDemand / totalGross) * 100).toFixed(0) : 0;
  const salesOrderShare = totalGross > 0 ? ((totalSalesOrderDemand / totalGross) * 100).toFixed(0) : 0;

  const isLocked = selectedRun?.status === 'Consumed_By_MRP';
  const completedCount = runs.filter(r => r.status === 'Completed').length;
  const consumedCount = runs.filter(r => r.status === 'Consumed_By_MRP').length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #080f24 0%, #0d1a3c 45%, #16244f 100%)',
      borderRadius: '14px',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      padding: '20px 24px',
      color: '#ffffff',
      boxShadow: '0 8px 32px rgba(8, 15, 36, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Gradient Radial */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '420px',
        height: '100%',
        background: 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.15) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 80%)',
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
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)'
          }}>
            <GitMerge size={24} color="#ffffff" />
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
                Combined Demand Convergence & MRP Bridge
              </h1>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Consensus Engine
              </span>
            </div>
            <p style={{
              margin: '4px 0 0',
              fontSize: '12px',
              color: '#94a3b8',
              lineHeight: 1.4
            }}>
              Unifies finalized customer forecasts and firm sales orders with automated double-count consumption to feed Material Planning (MRP).
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh Demand Runs"
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
            onClick={onOpenGenerateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.45)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <RefreshCw size={14} />
            Combine Demand Now
          </button>
        </div>
      </div>

      {/* Telemetry Chips Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Card 1: Total Unified Demand */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
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
            <span>Unified Net Demand (MRP)</span>
            <Zap size={14} color="#f59e0b" />
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            fontFamily: 'monospace'
          }}>
            {totalNetDemand.toLocaleString()} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>units</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Consolidated net demand feeding production schedule
          </div>
        </div>

        {/* Card 2: Demand Composition */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
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
            <span>Demand Composition</span>
            <Layers size={14} color="#38bdf8" />
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px'
          }}>
            <span style={{ color: '#38bdf8' }}>{salesOrderShare}% Orders</span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>/</span>
            <span style={{ color: '#fbbf24' }}>{forecastShare}% Forecast</span>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
            {totalSalesOrderDemand.toLocaleString()} firm orders • {totalForecastDemand.toLocaleString()} net forecast
          </div>
        </div>

        {/* Card 3: Forecast Consumption & Safety Stock */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
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
            <span>Safety Buffer & Adjustments</span>
            <ShieldCheck size={14} color="#10b981" />
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
            <span>+{totalSafetyStock.toLocaleString()}</span>
            <span style={{
              fontSize: '12px',
              color: totalManualAdjustment !== 0 ? (totalManualAdjustment > 0 ? '#38bdf8' : '#fb7185') : '#94a3b8',
              fontWeight: 500
            }}>
              ({totalManualAdjustment > 0 ? `+${totalManualAdjustment}` : totalManualAdjustment} Manual)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Buffer stock + planner overrides applied
          </div>
        </div>

        {/* Card 4: Run Lock & MRP Commitment Status */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: isLocked ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.25)',
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
            color: isLocked ? '#f87171' : '#34d399',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>MRP Gate Lock</span>
            {isLocked ? <Lock size={14} color="#ef4444" /> : <CheckCircle2 size={14} color="#10b981" />}
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isLocked ? (
              <span style={{ color: '#f87171' }}>Consumed by MRP</span>
            ) : (
              <span style={{ color: '#34d399' }}>Completed (Editable)</span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {runs.length} Runs recorded ({consumedCount} consumed, {completedCount} open)
          </div>
        </div>
      </div>
    </div>
  );
};
