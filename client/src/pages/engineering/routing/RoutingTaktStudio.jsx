import React from 'react';
import {
  Calculator, Zap, Clock, Factory, Flame, TrendingUp, Sliders,
  CheckCircle2, AlertTriangle, ShieldCheck, PlayCircle
} from 'lucide-react';

export const RoutingTaktStudio = ({
  operations,
  selectedHeader,
  simulatedBatchQty,
  setSimulatedBatchQty,
  targetTaktMinutes,
  setTargetTaktMinutes,
  shiftHours,
  setShiftHours,
  telemetry
}) => {
  const baseQty = selectedHeader?.baseQuantity || 100;
  const maxStationTime = Math.max(...operations.map(o => o.totalOperationTime || 0), targetTaktMinutes, 60);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── TOP KPI TELEMETRY CARDS ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {/* Card 1: Line Balancing Efficiency */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          padding: '12px 14px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Balancing Efficiency
            </span>
            <TrendingUp size={14} color="#0284c7" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: telemetry.balancingEfficiency >= 80 ? '#059669' : '#d97706' }}>
              {telemetry.balancingEfficiency}%
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Smoothness Index</span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-primary)', overflow: 'hidden' }}>
            <div style={{
              width: `${telemetry.balancingEfficiency}%`,
              height: '100%',
              background: telemetry.balancingEfficiency >= 80 ? '#10b981' : '#f59e0b',
              borderRadius: 3
            }} />
          </div>
        </div>

        {/* Card 2: Pacing Bottleneck Station */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          padding: '12px 14px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Pacing Bottleneck
            </span>
            <Flame size={14} color="#e11d48" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#e11d48' }}>
              {telemetry.bottleneckOp ? `OP #${telemetry.bottleneckOp.operationSequence}` : '—'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              ({telemetry.bottleneckTime.toFixed(1)} min)
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {telemetry.bottleneckOp?.operationDescription || 'No operations on line'}
          </span>
        </div>

        {/* Card 3: Shift Capacity */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          padding: '12px 14px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Est. Shift Capacity
            </span>
            <Factory size={14} color="#059669" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#0284c7' }}>
              ~{telemetry.outputPerShift * baseQty}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>pcs / {shiftHours}h shift</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            ({telemetry.outputPerShift} complete production lots)
          </span>
        </div>

        {/* Card 4: Total Work Content */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          padding: '12px 14px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total Work Content
            </span>
            <Clock size={14} color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {(telemetry.totalCycle / 60).toFixed(2)}h
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>({telemetry.totalCycle.toFixed(1)} min/lot)</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Setup: {telemetry.totalSetup}m • Run: {telemetry.totalRun}m
          </span>
        </div>
      </div>

      {/* ── VISUAL LINE BALANCING BAR CHART ─────────────────────────────── */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={15} color="#0284c7" />
              Visual Assembly Line Balancing Graph
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>
              Station-by-station work content compared against the line Target Takt Time threshold.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }} /> Setup (SMED)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f43f5e' }} /> Run Time
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#0284c7' }} /> Transfer Move
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 2, borderTop: '2px dashed #e11d48' }} /> Target Takt ({targetTaktMinutes}m)
            </span>
          </div>
        </div>

        {/* Visual Bar Canvas */}
        <div style={{
          position: 'relative',
          height: 220,
          background: 'var(--surface-canvas)',
          borderRadius: 6,
          border: '1px solid var(--border-color)',
          padding: '24px 20px 30px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          gap: 16
        }}>
          {/* Target Takt Line Overlay */}
          <div style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: `${Math.min(90, Math.max(10, (targetTaktMinutes / maxStationTime) * 100))}%`,
            borderTop: '2px dashed #f43f5e',
            zIndex: 2,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <span style={{
              fontSize: 9.5,
              fontWeight: 800,
              fontFamily: 'monospace',
              background: '#f43f5e',
              color: '#ffffff',
              padding: '1px 6px',
              borderRadius: 3,
              transform: 'translateY(-50%)'
            }}>
              TARGET TAKT: {targetTaktMinutes} MIN
            </span>
          </div>

          {/* Station Vertical Bars */}
          {operations.map(op => {
            const opTotal = op.totalOperationTime || 0;
            const barHeightPct = maxStationTime > 0 ? (opTotal / maxStationTime * 100) : 0;
            const isOverTakt = opTotal > targetTaktMinutes;
            const isBottleneck = telemetry.bottleneckOp && telemetry.bottleneckOp._id === op._id;
            const setupPct = opTotal > 0 ? ((op.setupTime || 0) / opTotal * 100) : 0;
            const runPct = opTotal > 0 ? ((op.runTime || 0) / opTotal * 100) : 0;
            const movePct = opTotal > 0 ? ((op.moveTime || 0) / opTotal * 100) : 0;

            return (
              <div
                key={op._id}
                style={{
                  flex: 1,
                  maxWidth: 110,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  position: 'relative'
                }}
              >
                {/* Station Cycle Time Label on top of bar */}
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  marginBottom: 4,
                  color: isBottleneck ? '#e11d48' : 'var(--text-primary)'
                }}>
                  {opTotal.toFixed(1)}m
                </span>

                {/* Over Takt alert pill */}
                {isOverTakt && (
                  <span style={{
                    fontSize: 8.5,
                    fontWeight: 700,
                    background: 'rgba(244, 63, 94, 0.2)',
                    color: '#e11d48',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    padding: '0 4px',
                    borderRadius: 3,
                    marginBottom: 2
                  }}>
                    +{(opTotal - targetTaktMinutes).toFixed(1)}m
                  </span>
                )}

                {/* Stacked Vertical Bar */}
                <div style={{
                  width: '100%',
                  height: `${Math.max(8, barHeightPct)}%`,
                  borderRadius: '6px 6px 0 0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isBottleneck ? '2px solid #e11d48' : '1px solid var(--border-color)',
                  boxShadow: isBottleneck ? '0 0 10px rgba(244, 63, 94, 0.35)' : 'none',
                  transition: 'height 0.3s ease'
                }}>
                  <div style={{ height: `${movePct}%`, background: '#0284c7' }} title={`Move: ${op.moveTime}m`} />
                  <div style={{ height: `${runPct}%`, background: '#f43f5e' }} title={`Run: ${op.runTime}m`} />
                  <div style={{ height: `${setupPct}%`, background: '#f59e0b' }} title={`Setup: ${op.setupTime}m`} />
                </div>

                {/* Station Sequence Label at bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: -24,
                  fontSize: 10.5,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: isBottleneck ? '#e11d48' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}>
                  OP #{op.operationSequence}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SIMULATOR INTERACTIVE CONTROLS ───────────────────────────────── */}
      <div style={{
        padding: '14px 18px',
        background: 'var(--surface-canvas)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sliders size={16} color="#0284c7" />
          <div>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Work Order Batch & Takt Simulator Controls
            </h4>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Adjust parameters to project machine hours, lead times, and capacity loads.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Target Takt Time Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Target Takt:</span>
            <input
              type="number"
              min="1"
              value={targetTaktMinutes}
              onChange={e => setTargetTaktMinutes(Math.max(1, parseFloat(e.target.value) || 1))}
              style={{
                width: 75,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 4,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                textAlign: 'right'
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>min/lot</span>
          </div>

          {/* Shift Hours Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Shift:</span>
            <select
              value={shiftHours}
              onChange={e => setShiftHours(parseInt(e.target.value))}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 4,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value={8}>8 Hours (1 Shift)</option>
              <option value={16}>16 Hours (2 Shifts)</option>
              <option value={24}>24 Hours (3 Shifts / 24x7)</option>
            </select>
          </div>

          {/* Simulated Lot Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Simulated Lot:</span>
            <input
              type="number"
              min="1"
              step="10"
              value={simulatedBatchQty}
              onChange={e => setSimulatedBatchQty(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: 90,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 4,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                textAlign: 'right'
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>pcs</span>
          </div>
        </div>
      </div>

      {/* ── STATION-BY-STATION SIMULATION TABLE ─────────────────────────── */}
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        overflow: 'hidden',
        background: 'var(--bg-secondary)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', width: 65 }}>Step</th>
              <th style={{ padding: '8px 10px' }}>Operation Description</th>
              <th style={{ padding: '8px 10px' }}>Work Center</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Setup (Hours)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Run ({simulatedBatchQty} pcs)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Move (Hours)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Lot Time</th>
              <th style={{ padding: '8px 10px' }}>Line Status</th>
            </tr>
          </thead>
          <tbody>
            {operations.map(op => {
              const runPerPiece = (op.runTime || 0) / baseQty;
              const lotRunMinutes = runPerPiece * simulatedBatchQty;
              const lotSetupMinutes = op.setupTime || 0;
              const lotMoveMinutes = op.moveTime || 0;
              const totalLotMinutes = lotSetupMinutes + lotRunMinutes + lotMoveMinutes;
              const totalHours = (totalLotMinutes / 60).toFixed(2);
              const isBottleneck = telemetry.bottleneckOp && telemetry.bottleneckOp._id === op._id;
              const isOverTakt = (op.totalOperationTime || 0) > targetTaktMinutes;

              return (
                <tr key={op._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 800, fontFamily: 'monospace', color: '#0284c7' }}>
                    #{op.operationSequence}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {op.operationDescription}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    {op.workCenterId?.name || '—'}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {(lotSetupMinutes / 60).toFixed(2)} h
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {(lotRunMinutes / 60).toFixed(2)} h
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {(lotMoveMinutes / 60).toFixed(2)} h
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: isBottleneck ? '#e11d48' : '#0284c7' }}>
                    {totalHours} hrs
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    {isBottleneck ? (
                      <span style={{ fontSize: 10, background: 'rgba(244, 63, 94, 0.15)', color: '#e11d48', padding: '2px 7px', borderRadius: 3, fontWeight: 800 }}>
                        Pacing Bottleneck
                      </span>
                    ) : isOverTakt ? (
                      <span style={{ fontSize: 10, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', padding: '2px 7px', borderRadius: 3, fontWeight: 700 }}>
                        Over Takt
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>
                        ✓ Balanced
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default RoutingTaktStudio;
