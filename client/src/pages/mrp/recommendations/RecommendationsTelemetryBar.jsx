import React from 'react';
import {
  ShoppingCart, Hammer, CalendarClock, CheckCircle2,
  ExternalLink, Zap, ArrowUpRight, FileCheck, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RecommendationsTelemetryBar = ({
  mrpRuns = [],
  selectedRunId,
  onRunChange,
  recommendations = [],
  onBulkConvert,
  bulkConverting = false
}) => {
  const navigate = useNavigate();

  // Metrics derivation
  const purchaseSuggestions = recommendations.filter(
    r => r.suggestionCategory === 'Purchase' && r.actionType === 'Create New'
  );
  const productionSuggestions = recommendations.filter(
    r => r.suggestionCategory === 'Production' && r.actionType === 'Create New'
  );
  const reschedulingSuggestions = recommendations.filter(
    r => r.actionType !== 'Create New'
  );

  const pendingCount = recommendations.filter(r => r.status === 'Pending').length;
  const convertedCount = recommendations.filter(r => r.status === 'Converted').length;
  const totalCount = recommendations.length;
  const conversionRate = totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 100;

  const totalBuyUnits = purchaseSuggestions.reduce((sum, r) => sum + (Number(r.suggestedQty) || 0), 0);
  const totalMakeUnits = productionSuggestions.reduce((sum, r) => sum + (Number(r.suggestedQty) || 0), 0);

  const activeRun = mrpRuns.find(r => r._id === selectedRunId);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0b1329 0%, #0d213f 50%, #071527 100%)',
      borderRadius: '14px',
      border: '1px solid rgba(6, 182, 212, 0.35)',
      padding: '24px 26px',
      boxShadow: '0 12px 36px rgba(6, 182, 212, 0.12), 0 4px 16px rgba(0, 0, 0, 0.4)',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow Accent */}
      <div style={{
        position: 'absolute',
        top: '-70px',
        right: '-50px',
        width: '340px',
        height: '340px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 80%)',
        pointerEvents: 'none',
        filter: 'blur(35px)'
      }} />

      {/* Top Bar: Title, Run Selector & Bridges */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Title & Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(2, 132, 199, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
          }}>
            <Zap size={24} color="#ffffff" />
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
                Suggested Orders Synthesis Deck
              </h1>
              <span style={{
                background: 'rgba(6, 182, 212, 0.18)',
                border: '1px solid rgba(6, 182, 212, 0.5)',
                color: '#67e8f9',
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
                  background: '#06b6d4',
                  boxShadow: '0 0 8px #06b6d4'
                }} />
                MRP Order Generator
              </span>
            </div>
            <p style={{
              margin: '3px 0 0 0',
              fontSize: '12.5px',
              color: '#94a3b8'
            }}>
              Automated PO requisitions for raw materials, work orders for sub-assemblies, and open order rescheduling.
            </p>
          </div>
        </div>

        {/* Right Controls: Plan Run Selector & Bridges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Target Run Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Target Run:</span>
            <select
              value={selectedRunId}
              onChange={onRunChange}
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
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

          {/* Upstream Shortages Bridge */}
          <button
            type="button"
            onClick={() => navigate('/mrp/shortages')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#fca5a5',
              cursor: 'pointer'
            }}
          >
            Material Shortages <ExternalLink size={11} />
          </button>

          {/* Upstream MRP Execution Bridge */}
          <button
            type="button"
            onClick={() => navigate('/mrp/execution')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#fde68a',
              cursor: 'pointer'
            }}
          >
            Run Material Plan <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* 4 Telemetry Synthesis Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Card 1: Purchase Suggestions */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#67e8f9', fontWeight: 700 }}>
              Purchase Suggestions
            </span>
            <ShoppingCart size={15} color="#06b6d4" />
          </div>
          <div style={{ margin: '8px 0 4px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {purchaseSuggestions.length}
            </span>
            <span style={{ fontSize: '11.5px', color: '#67e8f9' }}>
              {totalBuyUnits.toLocaleString()} units to buy
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            New POs to cover raw material deficits
          </span>
        </div>

        {/* Card 2: Production Suggestions */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#93c5fd', fontWeight: 700 }}>
              Work Order Suggestions
            </span>
            <Hammer size={15} color="#3b82f6" />
          </div>
          <div style={{ margin: '8px 0 4px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {productionSuggestions.length}
            </span>
            <span style={{ fontSize: '11.5px', color: '#93c5fd' }}>
              {totalMakeUnits.toLocaleString()} units to make
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            New shop floor work orders for sub-assemblies
          </span>
        </div>

        {/* Card 3: Rescheduling Adjustments */}
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
              Order Adjustments
            </span>
            <CalendarClock size={15} color="#f59e0b" />
          </div>
          <div style={{ margin: '8px 0 4px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {reschedulingSuggestions.length}
            </span>
            <span style={{ fontSize: '11.5px', color: '#fbbf24' }}>
              Active modifications
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Date shifts, expedites & order cancellations
          </span>
        </div>

        {/* Card 4: Conversion Progress */}
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
              Conversion Velocity
            </span>
            <CheckCircle2 size={15} color="#10b981" />
          </div>
          <div style={{ margin: '8px 0 4px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {conversionRate}%
            </span>
            <span style={{ fontSize: '11.5px', color: '#34d399' }}>
              {convertedCount} of {totalCount} converted
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
              width: `${conversionRate}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #06b6d4, #10b981)'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};
