import React from 'react';
import { 
  Activity, Settings, Plus, Printer, Download, 
  RefreshCw, ShieldAlert, AlertTriangle, Layers, 
  BarChart3, Clock, Scale, Sparkles, CheckCircle2, 
  TrendingUp, IndianRupee, ShieldCheck
} from 'lucide-react';

const OptimizationControlHeader = ({
  activePerspective,
  setActivePerspective,
  summaryStats,
  onRunAnalysis,
  analyzing,
  onOpenParamModal,
  onOpenProfileModal,
  onOpenPrintModal,
  onExportCsv,
  parameters,
  lastRunInfo
}) => {
  const perspectives = [
    {
      id: 'matrix',
      label: 'Master Reorder Matrix',
      subtitle: 'Dynamic ROP & safety threshold meters',
      icon: Scale,
      badge: `${summaryStats.totalCount} SKUs`
    },
    {
      id: 'pareto',
      label: 'ABC Pareto Capital Deck',
      subtitle: 'Capital allocation across Classes A, B, C',
      icon: BarChart3,
      badge: `${summaryStats.classACount} Class A`
    },
    {
      id: 'dormant',
      label: 'Slow & Dead Stock Radar',
      subtitle: 'Dormant inventory & capital recovery',
      icon: AlertTriangle,
      badge: summaryStats.deadStockCount > 0 ? `${summaryStats.deadStockCount} Alert` : '0 Clean'
    }
  ];

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Command Banner with Deep Amber & Titanium Theme */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)',
          borderRadius: '12px',
          padding: '20px 24px',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(120, 53, 15, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle radial glow */}
        <div 
          style={{
            position: 'absolute',
            right: '-30px',
            top: '-30px',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} 
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.14)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px', border: '1px solid rgba(255, 255, 255, 0.22)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fcd34d', boxShadow: '0 0 10px #fcd34d', animation: 'pulse 2s infinite' }} />
              IATF 16949 BUFFER POLICY & ABC PARETO RADAR • DYNAMIC REORDER SYSTEM
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '2px 0 6px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Reorder Levels & Inventory Optimization
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.88)', maxWidth: '720px', lineHeight: 1.5 }}>
              Precision buying rules for plant materials: automated Reorder Point (ROP) triggers, safety buffer thresholds, ABC Pareto capital stratification, and slow-moving inventory triage.
            </p>
          </div>

          {/* Action Button Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={onRunAnalysis}
              disabled={analyzing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: '#ffffff',
                color: '#78350f',
                fontWeight: 700,
                fontSize: '13px',
                cursor: analyzing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => { if (!analyzing) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; } }}
              onMouseLeave={(e) => { if (!analyzing) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; } }}
            >
              <Activity size={16} color="#78350f" style={{ animation: analyzing ? 'spin 1s linear infinite' : 'none' }} />
              <span>{analyzing ? 'Checking Materials...' : 'Check All Materials'}</span>
            </button>

            <button
              onClick={onOpenParamModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'}
              title="Configure ABC Pareto percentages and dead stock days"
            >
              <Settings size={15} />
              <span>Configure Rules</span>
            </button>

            <button
              onClick={onOpenProfileModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'}
              title="Manually set or override reorder point for a material"
            >
              <Plus size={15} />
              <span>Set Levels</span>
            </button>

            <button
              onClick={onOpenPrintModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'}
              title="Print official IATF 16949 material replenishment policy certificate"
            >
              <Printer size={15} />
              <span>Audit Policy</span>
            </button>

            <button
              onClick={onExportCsv}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'}
              title="Download reorder rules as CSV"
            >
              <Download size={15} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Integrated Optimization Telemetry Bar */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.18)'
          }}
        >
          {/* Gauge 1: Tracked Materials */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Materials Tracked
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              {summaryStats.totalCount} SKUs
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Active plant stock profiles
            </div>
          </div>

          {/* Gauge 2: Reorder Triggers */}
          <div 
            style={{ 
              background: summaryStats.reorderTriggerCount > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 0, 0, 0.15)', 
              borderRadius: '8px', 
              padding: '10px 14px', 
              border: summaryStats.reorderTriggerCount > 0 ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)' 
            }}
          >
            <div style={{ fontSize: '11px', color: summaryStats.reorderTriggerCount > 0 ? '#fef08a' : 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {summaryStats.reorderTriggerCount > 0 && <AlertTriangle size={13} color="#fde047" />}
              Reorder Triggers
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: summaryStats.reorderTriggerCount > 0 ? '#fef08a' : '#34d399' }}>
              {summaryStats.reorderTriggerCount} SKUs
            </div>
            <div style={{ fontSize: '11px', color: summaryStats.reorderTriggerCount > 0 ? '#fef9c3' : 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              {summaryStats.reorderTriggerCount > 0 ? 'ATP below reorder point' : 'All above reorder point'}
            </div>
          </div>

          {/* Gauge 3: Safety Breaches */}
          <div 
            style={{ 
              background: summaryStats.safetyBreachCount > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 0, 0, 0.15)', 
              borderRadius: '8px', 
              padding: '10px 14px', 
              border: summaryStats.safetyBreachCount > 0 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)' 
            }}
          >
            <div style={{ fontSize: '11px', color: summaryStats.safetyBreachCount > 0 ? '#fca5a5' : 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {summaryStats.safetyBreachCount > 0 && <ShieldAlert size={13} color="#f87171" />}
              Safety Deficits
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: summaryStats.safetyBreachCount > 0 ? '#fca5a5' : '#34d399' }}>
              {summaryStats.safetyBreachCount} SKUs
            </div>
            <div style={{ fontSize: '11px', color: summaryStats.safetyBreachCount > 0 ? '#fee2e2' : 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              {summaryStats.safetyBreachCount > 0 ? 'Critical buffer breach' : 'Safety buffers secure'}
            </div>
          </div>

          {/* Gauge 4: Class A Items */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Class A (Top Capital)
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#60a5fa' }}>
              {summaryStats.classACount} SKUs
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              ~{parameters.ABC_Class_A_Percentage || 70}% total store capital
            </div>
          </div>

          {/* Gauge 5: Slow / Dead Stock */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Dormant / Slow Risk
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: summaryStats.deadStockCount > 0 ? '#fde047' : '#34d399' }}>
              {summaryStats.deadStockCount} SKUs
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              &gt; {parameters.Dead_Stock_Threshold_Days || 180} days without issue
            </div>
          </div>

          {/* Gauge 6: Manual Overrides */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Manual Overrides
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              {summaryStats.manualOverrideCount} Set by Hand
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Protected against auto-resets
            </div>
          </div>
        </div>
      </div>

      {/* Perspective Station Switcher Cards */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px'
        }}
      >
        {perspectives.map((p) => {
          const Icon = p.icon;
          const isSelected = activePerspective === p.id;

          return (
            <div
              key={p.id}
              onClick={() => setActivePerspective(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActivePerspective(p.id); }}
              style={{
                cursor: 'pointer',
                borderRadius: '10px',
                padding: '14px 16px',
                background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                border: isSelected ? '2px solid #b45309' : '1px solid var(--border-color)',
                boxShadow: isSelected ? '0 4px 14px -2px rgba(180, 83, 9, 0.2)' : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#d97706';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? '#fef3c7' : 'var(--bg-tertiary)',
                      color: isSelected ? '#b45309' : 'var(--text-secondary)'
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? '#78350f' : 'var(--text-primary)' }}>
                    {p.label}
                  </span>
                </div>

                <span 
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: isSelected ? '#b45309' : 'var(--bg-tertiary)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  {p.badge}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '40px', lineHeight: 1.3 }}>
                {p.subtitle}
              </div>

              {isSelected && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '16px',
                    right: '16px',
                    height: '3px',
                    backgroundColor: '#b45309',
                    borderRadius: '3px 3px 0 0'
                  }} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OptimizationControlHeader;
