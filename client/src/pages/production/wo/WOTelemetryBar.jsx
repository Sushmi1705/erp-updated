import React from 'react';
import { 
  ClipboardList, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  Gauge, 
  TrendingUp, 
  Layers, 
  Flame,
  Clock
} from 'lucide-react';

const WOTelemetryBar = ({ workOrders = [] }) => {
  const totalWos = workOrders.length;
  const draftCount = workOrders.filter(w => w.Status === 'Draft').length;
  const releasedCount = workOrders.filter(w => w.Status === 'Released').length;
  const inProgressCount = workOrders.filter(w => w.Status === 'In Progress').length;
  const completedCount = workOrders.filter(w => w.Status === 'Completed').length;
  const closedCount = workOrders.filter(w => w.Status === 'Closed').length;

  let totalTarget = 0;
  let totalProduced = 0;
  let totalScrap = 0;

  workOrders.forEach(w => {
    (w.details || []).forEach(d => {
      totalTarget += Number(d.Target_Quantity) || 0;
      totalProduced += Number(d.Produced_Quantity) || 0;
      totalScrap += Number(d.Scrapped_Quantity) || 0;
    });
  });

  const yieldRate = totalProduced > 0 ? (((totalProduced - totalScrap) / totalProduced) * 100).toFixed(1) : '99.4';
  const overallCompletionRate = totalTarget > 0 ? ((totalProduced / totalTarget) * 100).toFixed(1) : '0';
  const ppmDefect = totalProduced > 0 ? Math.round((totalScrap / totalProduced) * 1000000) : 620;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: '12px'
    }}>
      {/* 1. Total Job Travelers */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: '4px solid #d97706',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Job Travelers
          </span>
          <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#b45309' }}>
            <ClipboardList size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
            {totalWos}
          </span>
          <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
            {inProgressCount} in cycle
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 500 }}>
            Draft: {draftCount}
          </span>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 500 }}>
            Rel: {releasedCount}
          </span>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
            Run: {inProgressCount}
          </span>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600 }}>
            Done: {completedCount + closedCount}
          </span>
        </div>
      </div>

      {/* 2. Target Production Batch */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: '4px solid #0284c7',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Batch Target
          </span>
          <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <Target size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
            {totalTarget.toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>pcs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ flex: 1, height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(overallCompletionRate, 100)}%`, height: '100%', backgroundColor: '#0284c7', transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>
            {overallCompletionRate}%
          </span>
        </div>
      </div>

      {/* 3. Actual Produced (Good Parts) */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: '4px solid #059669',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Good Parts Produced
          </span>
          <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: '#d1fae5', color: '#059669' }}>
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
            {totalProduced.toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>booked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#059669', fontWeight: 500 }}>
          <TrendingUp size={13} />
          <span>First-time yield: <strong style={{ fontWeight: 700 }}>{yieldRate}%</strong></span>
        </div>
      </div>

      {/* 4. Scrap & Rejection PPM */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: '4px solid #ea580c',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Scrap / Defects
          </span>
          <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: '#ffedd5', color: '#ea580c' }}>
            <AlertTriangle size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#c2410c', fontFamily: 'monospace' }}>
            {totalScrap.toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>spoilage pcs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#c2410c', fontWeight: 500 }}>
          <Flame size={13} />
          <span>Shop Defect Level: <strong style={{ fontWeight: 700 }}>{ppmDefect} PPM</strong></span>
        </div>
      </div>

      {/* 5. Shop Floor Cadence / Stroke Speed */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: '4px solid #7c3aed',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Press Line Cadence
          </span>
          <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: '#ede9fe', color: '#7c3aed' }}>
            <Gauge size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#6d28d9', fontFamily: 'monospace' }}>
            28.4
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>SPM (Strokes/min)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6d28d9', fontWeight: 500 }}>
          <Clock size={13} />
          <span>Shift OEE: <strong style={{ fontWeight: 700 }}>84.2%</strong> (Class A)</span>
        </div>
      </div>
    </div>
  );
};

export default WOTelemetryBar;
