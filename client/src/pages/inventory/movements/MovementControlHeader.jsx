import React from 'react';
import { 
  ArrowLeftRight, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  Download, Plus, Layers, Printer, ShieldCheck, 
  FileSpreadsheet, SlidersHorizontal, CheckCircle2, Factory, 
  RotateCcw, Scale, Warehouse
} from 'lucide-react';

const MovementControlHeader = ({
  activeType,
  setActiveType,
  summaryStats,
  onRefresh,
  loading,
  onOpenRecordModal,
  onExportCsv
}) => {
  const typeTabs = [
    {
      id: 'ALL',
      label: 'All Movements',
      subtitle: 'Complete chronological dispatch register',
      icon: ArrowLeftRight,
      color: '#3b82f6',
      badge: summaryStats.totalCount
    },
    {
      id: 'Material Issue',
      label: 'Shopfloor Issues',
      subtitle: 'Dispatches to Press & Assembly lines',
      icon: Factory,
      color: '#ef4444',
      badge: summaryStats.issueCount
    },
    {
      id: 'Transfer',
      label: 'Store Transfers',
      subtitle: 'Stock relocated between plant bays',
      icon: Warehouse,
      color: '#3b82f6',
      badge: summaryStats.transferCount
    },
    {
      id: 'Return',
      label: 'Shopfloor Returns',
      subtitle: 'Unconsumed lots returned to stores',
      icon: RotateCcw,
      color: '#10b981',
      badge: summaryStats.returnCount
    },
    {
      id: 'Adjustment',
      label: 'Count Corrections',
      subtitle: 'Reconciliations after cycle counting',
      icon: Scale,
      color: '#f59e0b',
      badge: summaryStats.adjustmentCount
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
      {/* Top Command Banner with Deep Cobalt & Titanium Theme */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
          borderRadius: '12px',
          padding: '20px 24px',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(30, 58, 138, 0.28)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle background radar circles */}
        <div 
          style={{
            position: 'absolute',
            right: '-30px',
            top: '-30px',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} 
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#60a5fa', boxShadow: '0 0 10px #60a5fa', animation: 'pulse 2s infinite' }} />
              STORES LOGISTICS RUNWAY • REAL-TIME DISPATCH STREAM
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '2px 0 6px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Stock Movements & Material Logistics Ledger
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '720px', lineHeight: 1.5 }}>
              Centralized register of material issues to production lines, inter-bay warehouse transfers, shopfloor returns, and physical cycle count adjustments with full lot traceability.
            </p>
          </div>

          {/* Action Button Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenRecordModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: '#ffffff',
                color: '#1e3a8a',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
            >
              <Plus size={16} color="#1e3a8a" />
              <span>Record Stock Movement</span>
            </button>

            <button
              onClick={onExportCsv}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              title="Download movement ledger as CSV"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
              title="Refresh stock movement ledger"
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Integrated Velocity Telemetry Bar */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          {/* Gauge 1: Total Movements */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Total Movements
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              {summaryStats.totalCount}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Audited transactions
            </div>
          </div>

          {/* Gauge 2: Shopfloor Issues */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Material Issues
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fb7185' }}>
              {summaryStats.issueCount} <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)' }}>({summaryStats.issueQuantity.toLocaleString()} kg)</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Issued to work orders
            </div>
          </div>

          {/* Gauge 3: Inter-Store Transfers */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Store Transfers
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#93c5fd' }}>
              {summaryStats.transferCount} <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)' }}>({summaryStats.transferQuantity.toLocaleString()} kg)</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Bay-to-bay relocations
            </div>
          </div>

          {/* Gauge 4: Shopfloor Returns */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Stock Returns
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#34d399' }}>
              {summaryStats.returnCount} <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)' }}>({summaryStats.returnQuantity.toLocaleString()} kg)</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Returned from shopfloor
            </div>
          </div>

          {/* Gauge 5: Count Adjustments */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Count Corrections
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fde047' }}>
              {summaryStats.adjustmentCount}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Cycle count adjustments
            </div>
          </div>

          {/* Gauge 6: Net Movement Valuation */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Total Throughput Value
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              {formatCurrency(summaryStats.totalValuation)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Materials dispatched/moved
            </div>
          </div>
        </div>
      </div>

      {/* Movement Category Filter Deck */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}
      >
        {typeTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeType === tab.id;

          return (
            <div
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveType(tab.id); }}
              style={{
                cursor: 'pointer',
                borderRadius: '10px',
                padding: '12px 14px',
                background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                border: isSelected ? '2px solid #2563eb' : '1px solid var(--border-color)',
                boxShadow: isSelected ? '0 4px 14px -2px rgba(37, 99, 235, 0.18)' : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#3b82f6';
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
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-tertiary)',
                      color: isSelected ? '#2563eb' : 'var(--text-secondary)'
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? '#1e40af' : 'var(--text-primary)' }}>
                    {tab.label}
                  </span>
                </div>

                <span 
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: isSelected ? '#2563eb' : 'var(--bg-tertiary)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  {tab.badge}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '38px', lineHeight: 1.3 }}>
                {tab.subtitle}
              </div>

              {isSelected && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '16px',
                    right: '16px',
                    height: '3px',
                    backgroundColor: '#2563eb',
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

export default MovementControlHeader;
