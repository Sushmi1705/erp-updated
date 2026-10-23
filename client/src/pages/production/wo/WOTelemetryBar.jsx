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
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '12px',
      marginBottom: '18px'
    }}>
      {/* 1. Total Job Travelers */}
      <div style={{
        backgroundColor: '#121722',
        border: '1px solid #232d3f',
        borderLeft: '4px solid #f59e0b',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Job Travelers
          </span>
          <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <ClipboardList size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
            {totalWos}
          </span>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 500 }}>
            {inProgressCount} active in cycle
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#94a3b8' }}>
            Draft: {draftCount}
          </span>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            Rel: {releasedCount}
          </span>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            Run: {inProgressCount}
          </span>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            Done: {completedCount + closedCount}
          </span>
        </div>
      </div>

      {/* 2. Target Production Batch */}
      <div style={{
        backgroundColor: '#121722',
        border: '1px solid #232d3f',
        borderLeft: '4px solid #06b6d4',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Batch Target
          </span>
          <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
            <Target size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
            {totalTarget.toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>pcs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ flex: 1, height: '5px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(overallCompletionRate, 100)}%`, height: '100%', backgroundColor: '#06b6d4', transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#22d3ee', fontFamily: 'monospace' }}>
            {overallCompletionRate}%
          </span>
        </div>
      </div>

      {/* 3. Actual Produced (Good Parts) */}
      <div style={{
        backgroundColor: '#121722',
        border: '1px solid #232d3f',
        borderLeft: '4px solid #10b981',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Good Parts Produced
          </span>
          <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
            {totalProduced.toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>booked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981' }}>
          <TrendingUp size={13} />
          <span>First-time yield: <strong>{yieldRate}%</strong></span>
        </div>
      </div>

      {/* 4. Scrap & Rejection PPM */}
      <div style={{
        backgroundColor: '#121722',
        border: '1px solid #232d3f',
        borderLeft: '4px solid #f97316',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scrap / Defects
          </span>
          <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }}>
            <AlertTriangle size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#fb923c', fontFamily: 'monospace' }}>
            {totalScrap.toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>spoilage pcs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fb923c' }}>
          <Flame size={13} />
          <span>Shop Defect Level: <strong>{ppmDefect} PPM</strong></span>
        </div>
      </div>

      {/* 5. Shop Floor Cadence / Stroke Speed */}
      <div style={{
        backgroundColor: '#121722',
        border: '1px solid #232d3f',
        borderLeft: '4px solid #a855f7',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Press Line Cadence
          </span>
          <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
            <Gauge size={16} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#c084fc', fontFamily: 'monospace' }}>
            28.4
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>SPM (Strokes/min)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#c084fc' }}>
          <Clock size={13} />
          <span>Shift OEE: <strong>84.2%</strong> (Class A)</span>
        </div>
      </div>
    </div>
  );
};

export default WOTelemetryBar;
