import React from 'react';
import { GitMerge, Plus, Minus, ArrowRight, ShieldCheck, CheckCircle2, Lock, Info } from 'lucide-react';

export const DemandFusionWaterfall = ({
  selectedRun,
  lines = [],
  selectedLine
}) => {
  if (!selectedRun) return null;

  // If a line is selected, show that line's exact numbers, otherwise show run totals
  const target = selectedLine || {
    forecastDemandQty: lines.reduce((s, l) => s + (Number(l.forecastDemandQty) || 0), 0),
    salesOrderQty: lines.reduce((s, l) => s + (Number(l.salesOrderQty) || 0), 0),
    safetyStockQty: lines.reduce((s, l) => s + (Number(l.safetyStockQty) || 0), 0),
    manualAdjustmentQty: lines.reduce((s, l) => s + (Number(l.manualAdjustmentQty) || 0), 0),
    finalNetDemand: lines.reduce((s, l) => s + (Number(l.finalNetDemand) || 0), 0),
    totalGrossDemand: lines.reduce((s, l) => s + (Number(l.totalGrossDemand) || 0), 0)
  };

  const fQty = Number(target.forecastDemandQty) || 0;
  const soQty = Number(target.salesOrderQty) || 0;
  const ssQty = Number(target.safetyStockQty) || 0;
  const manQty = Number(target.manualAdjustmentQty) || 0;
  const finalQty = Number(target.finalNetDemand) || (fQty + soQty + ssQty + manQty);

  const isLocked = selectedRun.status === 'Consumed_By_MRP';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1329 0%, #101e40 50%, #172a59 100%)',
      borderRadius: '12px',
      border: isLocked
        ? '1px solid rgba(239, 68, 68, 0.35)'
        : '1px solid rgba(245, 158, 11, 0.3)',
      padding: '16px 20px',
      color: '#ffffff',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Banner: Context */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitMerge size={16} color="#fbbf24" />
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>
            Consensus Convergence Formula {selectedLine ? `for ${selectedLine.productId?.name || 'Selected Part'}` : `for Run ${selectedRun.runNumber}`}
          </span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fde68a',
            fontWeight: 600
          }}>
            Double-Count Protection Active
          </span>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Info size={13} color="#38bdf8" />
          <span>Sales orders automatically consume forecast quantities to ensure 100% production accuracy.</span>
        </div>
      </div>

      {/* Waterfall Convergence Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* 1. Net Forecast Demand */}
        <div style={{
          flex: '1 1 140px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '8px',
          padding: '10px 14px',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ fontSize: '10px', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
            Net Forecast
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>
            {fQty.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            Unconsumed customer pull
          </div>
        </div>

        {/* Plus Sign */}
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={16} />
        </div>

        {/* 2. Firm Sales Orders */}
        <div style={{
          flex: '1 1 140px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '8px',
          padding: '10px 14px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ fontSize: '10px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
            Firm Sales Orders
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>
            {soQty.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            Committed PO releases
          </div>
        </div>

        {/* Plus Sign */}
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={16} />
        </div>

        {/* 3. Safety Stock Buffer */}
        <div style={{
          flex: '1 1 120px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '8px',
          padding: '10px 14px',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ fontSize: '10px', color: '#34d399', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
            Safety Buffer
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>
            {ssQty.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            Safety stock policy
          </div>
        </div>

        {/* Plus/Minus Sign */}
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={16} />
        </div>

        {/* 4. Planner Adjustment */}
        <div style={{
          flex: '1 1 130px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '8px',
          padding: '10px 14px',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ fontSize: '10px', color: '#f43f5e', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
            Planner Override
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 800,
            fontFamily: 'monospace',
            color: manQty > 0 ? '#38bdf8' : manQty < 0 ? '#fb7185' : '#cbd5e1'
          }}>
            {manQty > 0 ? `+${manQty.toLocaleString()}` : manQty.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            Manual adjustment
          </div>
        </div>

        {/* Arrow / Equals */}
        <div style={{
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px'
        }}>
          <ArrowRight size={20} />
        </div>

        {/* 5. Final Net MRP Demand */}
        <div style={{
          flex: '1 1 170px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%)',
          borderRadius: '8px',
          padding: '10px 16px',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)'
        }}>
          <div style={{ fontSize: '10px', color: '#fde68a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Final Net Demand (MRP)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>
            {finalQty.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500, color: '#fde68a' }}>units</span>
          </div>
          <div style={{ fontSize: '10px', color: '#e2e8f0' }}>
            Committed to BOM calculation
          </div>
        </div>
      </div>
    </div>
  );
};
