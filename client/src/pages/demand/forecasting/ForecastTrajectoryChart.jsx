import React, { useState } from 'react';
import { TrendingUp, Activity, HelpCircle, Layers, Eye } from 'lucide-react';

export const ForecastTrajectoryChart = ({ lines = [], forecastNumber = '', algorithm = '' }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!lines || lines.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-primary, #ffffff)',
        borderRadius: '12px',
        border: '1px dashed rgba(139, 92, 246, 0.3)',
        padding: '32px 20px',
        textAlign: 'center',
        color: 'var(--text-secondary, #64748b)'
      }}>
        <TrendingUp size={28} color="#8b5cf6" style={{ margin: '0 auto 10px', display: 'block' }} />
        <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
          No Horizon Buckets Defined
        </div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          Add monthly forecast line items to visualize the statistical projection trajectory and confidence envelope.
        </div>
      </div>
    );
  }

  // Sort lines by date
  const sortedLines = [...lines].sort((a, b) => new Date(a.timeBucketDate) - new Date(b.timeBucketDate));

  // Determine chart dimensions & scale
  const width = 800;
  const height = 220;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max quantity for scaling (with 15% headroom)
  const maxQty = Math.max(
    ...sortedLines.map(l => Math.max(Number(l.systemCalculatedQty) || 0, Number(l.finalForecastQty) || 0)),
    100
  ) * 1.15;

  const minQty = 0;

  // Coordinate mappers
  const getX = (index) => {
    if (sortedLines.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (sortedLines.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    const clamped = Math.max(0, Number(val) || 0);
    return paddingTop + chartHeight - (clamped / maxQty) * chartHeight;
  };

  // Build SVG Path strings
  const systemPoints = sortedLines.map((l, i) => `${getX(i)},${getY(l.systemCalculatedQty)}`);
  const finalPoints = sortedLines.map((l, i) => `${getX(i)},${getY(l.finalForecastQty)}`);

  const systemPath = `M ${systemPoints.join(' L ')}`;
  const finalPath = `M ${finalPoints.join(' L ')}`;

  // Confidence area polygon (upper & lower bounds)
  const upperPoints = sortedLines.map((l, i) => {
    const conf = (l.confidenceScorePercentage || 95) / 100;
    const margin = (1 - conf) * (l.systemCalculatedQty || 0);
    return `${getX(i)},${getY((l.systemCalculatedQty || 0) + margin)}`;
  });

  const lowerPoints = [...sortedLines].reverse().map((l, idx) => {
    const i = sortedLines.length - 1 - idx;
    const conf = (l.confidenceScorePercentage || 95) / 100;
    const margin = (1 - conf) * (l.systemCalculatedQty || 0);
    return `${getX(i)},${getY(Math.max(0, (l.systemCalculatedQty || 0) - margin))}`;
  });

  const confidenceAreaPath = `M ${upperPoints.join(' L ')} L ${lowerPoints.join(' L ')} Z`;

  // Format month label
  const formatMonth = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div style={{
      background: 'var(--bg-primary, #ffffff)',
      borderRadius: '12px',
      border: '1px solid var(--border-color, #e2e8f0)',
      padding: '16px 20px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      position: 'relative'
    }}>
      {/* Chart Header & Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={16} color="#8b5cf6" />
          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>
            Demand Horizon Trajectory & Confidence Envelope
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
            ({algorithm || 'Prediction Model'})
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: 'rgba(139, 92, 246, 0.2)', border: '1px dashed #8b5cf6', borderRadius: '2px' }} />
            <span style={{ color: 'var(--text-secondary, #64748b)' }}>Confidence Band</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '14px', height: '3px', background: '#06b6d4', borderRadius: '2px' }} />
            <span style={{ color: 'var(--text-secondary, #64748b)' }}>System Model</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '14px', height: '3px', background: '#8b5cf6', borderRadius: '2px' }} />
            <span style={{ color: '#7c3aed', fontWeight: 600 }}>Final Consensus</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}
        >
          <defs>
            <linearGradient id="confidenceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = Math.round(minQty + maxQty * ratio);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--border-color, #e2e8f0)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-secondary, #94a3b8)"
                  fontFamily="monospace"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Confidence Envelope Shading */}
          <path d={confidenceAreaPath} fill="url(#confidenceGrad)" />

          {/* System Calculated Curve (Cyan) */}
          <path
            d={systemPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeDasharray="5 4"
          />

          {/* Final Consensus Curve (Violet) */}
          <path
            d={finalPath}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="3.5"
            filter="url(#glow)"
          />

          {/* Data Points */}
          {sortedLines.map((l, i) => {
            const cx = getX(i);
            const cyFinal = getY(l.finalForecastQty);
            const cySys = getY(l.systemCalculatedQty);
            const isHovered = hoveredPoint?.index === i;

            return (
              <g key={i}>
                {/* Vertical guideline */}
                <line
                  x1={cx}
                  y1={paddingTop}
                  x2={cx}
                  y2={paddingTop + chartHeight}
                  stroke={isHovered ? '#8b5cf6' : 'rgba(226, 232, 240, 0.6)'}
                  strokeWidth={isHovered ? 1.5 : 1}
                  strokeDasharray={isHovered ? 'none' : '2 2'}
                />

                {/* X-axis Month Label */}
                <text
                  x={cx}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isHovered ? 700 : 500}
                  fill={isHovered ? '#7c3aed' : 'var(--text-secondary, #64748b)'}
                >
                  {formatMonth(l.timeBucketDate)}
                </text>

                {/* System Point (Cyan circle) */}
                <circle
                  cx={cx}
                  cy={cySys}
                  r={isHovered ? 5 : 4}
                  fill="#ffffff"
                  stroke="#06b6d4"
                  strokeWidth="2"
                />

                {/* Final Point (Violet Diamond/Circle) */}
                <circle
                  cx={cx}
                  cy={cyFinal}
                  r={isHovered ? 7 : 5.5}
                  fill="#8b5cf6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                  onMouseEnter={() => setHoveredPoint({ line: l, index: i, cx, cy: cyFinal })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: `${(hoveredPoint.cx / width) * 100}%`,
            top: '20px',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.94)',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '11px',
            pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}>
            <div style={{ fontWeight: 700, color: '#22d3ee', marginBottom: '4px' }}>
              {formatMonth(hoveredPoint.line.timeBucketDate)}
            </div>
            <div>Final Consensus: <strong style={{ color: '#c4b5fd' }}>{(hoveredPoint.line.finalForecastQty || 0).toLocaleString()}</strong> units</div>
            <div>System Baseline: <span>{(hoveredPoint.line.systemCalculatedQty || 0).toLocaleString()}</span> units</div>
            <div>Confidence: <span>{hoveredPoint.line.confidenceScorePercentage || 95}%</span></div>
            {hoveredPoint.line.reasonCode && (
              <div style={{ marginTop: '2px', color: '#fbbf24' }}>
                Override Reason: {hoveredPoint.line.reasonCode}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
