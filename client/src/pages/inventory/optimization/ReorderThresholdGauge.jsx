import React from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

const ReorderThresholdGauge = ({
  atp = 0,
  reorderLevel = 0,
  safetyStock = 0,
  uom = 'KG',
  isReorderTriggered = false,
  isSafetyBreached = false
}) => {
  // Max scale calculation for the bar
  const maxVal = Math.max(atp, reorderLevel * 1.6, safetyStock * 2, 100);
  
  const safetyPct = Math.min(100, Math.round((safetyStock / maxVal) * 100));
  const reorderPct = Math.min(100, Math.round((reorderLevel / maxVal) * 100));
  const atpPct = Math.min(100, Math.round((atp / maxVal) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '155px' }}>
      {/* Current ATP vs Reorder Point */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span 
          style={{ 
            fontSize: '13px', 
            fontWeight: 700, 
            color: isSafetyBreached ? '#dc2626' : (isReorderTriggered ? '#d97706' : '#059669'),
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title={isSafetyBreached 
            ? 'Critical: Stock below safety threshold' 
            : (isReorderTriggered ? 'Action: Reorder point triggered! Raise PO' : 'Stock healthy above reorder point')}
        >
          {isSafetyBreached && <ShieldAlert size={12} color="#dc2626" />}
          {isReorderTriggered && !isSafetyBreached && <AlertCircle size={12} color="#d97706" />}
          {!isReorderTriggered && <CheckCircle2 size={12} color="#059669" />}
          {atp.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-secondary)' }}>{uom}</span>
        </span>

        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }} title="Reorder trigger threshold">
          ROP: <strong>{reorderLevel.toLocaleString()}</strong>
        </span>
      </div>

      {/* Multi-Zone Gauge Meter */}
      <div 
        style={{ 
          position: 'relative', 
          height: '7px', 
          width: '100%', 
          backgroundColor: '#e2e8f0', 
          borderRadius: '4px',
          overflow: 'hidden'
        }}
        title={`Safety: ${safetyStock} | Reorder: ${reorderLevel} | Current ATP: ${atp} ${uom}`}
      >
        {/* Safety Zone (Red) */}
        <div 
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${safetyPct}%`,
            backgroundColor: 'rgba(239, 68, 68, 0.3)'
          }}
        />

        {/* Reorder Buffer Zone (Amber) */}
        <div 
          style={{
            position: 'absolute',
            left: `${safetyPct}%`,
            top: 0,
            bottom: 0,
            width: `${Math.max(0, reorderPct - safetyPct)}%`,
            backgroundColor: 'rgba(245, 158, 11, 0.3)'
          }}
        />

        {/* Current ATP Fill Bar */}
        <div 
          style={{ 
            height: '100%', 
            width: `${atpPct}%`, 
            backgroundColor: isSafetyBreached ? '#ef4444' : (isReorderTriggered ? '#f59e0b' : '#10b981'),
            transition: 'width 0.3s ease',
            borderRadius: '4px'
          }} 
        />

        {/* Vertical Reorder Threshold Marker */}
        {reorderPct > 0 && (
          <div 
            style={{
              position: 'absolute',
              left: `${reorderPct}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: '#b45309',
              zIndex: 3
            }}
          />
        )}
      </div>

      {/* Bottom Status Subtext */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
        <span style={{ color: isSafetyBreached ? '#dc2626' : (isReorderTriggered ? '#d97706' : '#059669'), fontWeight: 600 }}>
          {isSafetyBreached ? '⚠️ Deficit Alert' : (isReorderTriggered ? '⚡ Reorder Due' : '✓ Safe Buffer')}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Safe: {safetyStock.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default ReorderThresholdGauge;
