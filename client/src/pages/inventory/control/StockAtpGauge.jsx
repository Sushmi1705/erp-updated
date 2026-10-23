import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

const StockAtpGauge = ({ 
  onHand = 0, 
  allocated = 0, 
  atp = 0, 
  safetyStock = 0, 
  uom = 'KG',
  isBreached = false
}) => {
  // Determine scale maximum for the bar
  const maxVal = Math.max(onHand, safetyStock * 1.5, 100);
  const onHandPct = Math.min(100, Math.round((onHand / maxVal) * 100));
  const allocPct = Math.min(100, Math.round((allocated / maxVal) * 100));
  const atpPct = Math.max(0, onHandPct - allocPct);
  const safetyPct = Math.min(100, Math.round((safetyStock / maxVal) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
      {/* Top Value Line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span 
          style={{ 
            fontSize: '13px', 
            fontWeight: 700, 
            color: isBreached ? '#dc2626' : '#059669',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title={isBreached ? 'Free stock has fallen to or below the safety level — reorder immediately' : 'Stock level is healthy and ready to commit'}
        >
          {isBreached && <ShieldAlert size={12} color="#dc2626" />}
          {atp.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-secondary)' }}>{uom}</span>
        </span>

        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }} title="Safety Stock minimum buffer threshold">
          Safe: {safetyStock.toLocaleString()}
        </span>
      </div>

      {/* Visual Multi-Segment Bar */}
      <div 
        style={{ 
          position: 'relative', 
          height: '7px', 
          width: '100%', 
          backgroundColor: 'var(--bg-tertiary)', 
          borderRadius: '4px',
          overflow: 'hidden',
          display: 'flex'
        }}
        title={`On-Hand: ${onHand} | Allocated: ${allocated} | Free ATP: ${atp} | Safety Buffer: ${safetyStock}`}
      >
        {/* Free ATP segment (Emerald) */}
        <div 
          style={{ 
            height: '100%', 
            width: `${atpPct}%`, 
            backgroundColor: isBreached ? '#f87171' : '#10b981',
            transition: 'width 0.3s ease'
          }} 
        />
        
        {/* Allocated segment (Amber) */}
        <div 
          style={{ 
            height: '100%', 
            width: `${allocPct}%`, 
            backgroundColor: '#f59e0b',
            transition: 'width 0.3s ease'
          }} 
        />

        {/* Safety Stock Threshold Indicator Line */}
        {safetyPct > 0 && (
          <div 
            style={{
              position: 'absolute',
              left: `${safetyPct}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: '#dc2626',
              zIndex: 2,
              boxShadow: '0 0 4px rgba(220, 38, 38, 0.6)'
            }}
            title={`Safety Buffer Threshold: ${safetyStock} ${uom}`}
          />
        )}
      </div>

      {/* Micro Legend / Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)' }}>
        <span style={{ color: isBreached ? '#dc2626' : 'var(--text-secondary)' }}>
          {isBreached ? '⚠️ Deficit' : '✓ Buffer Safe'}
        </span>
        <span>
          Gross: {onHand.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default StockAtpGauge;
