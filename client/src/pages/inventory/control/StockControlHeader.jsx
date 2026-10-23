import React from 'react';
import { 
  Database, Settings, Package, Boxes, RefreshCw, 
  Download, Printer, PlusCircle, AlertTriangle, 
  Layers, ShieldCheck, CheckCircle2, IndianRupee, ArrowUpRight
} from 'lucide-react';

const StockControlHeader = ({
  activeTab,
  setActiveTab,
  summaryStats,
  onRefresh,
  loading,
  onOpenAdjustModal,
  onOpenPrintModal,
  onExportCsv
}) => {
  const tabs = [
    {
      id: 'RAW_MATERIAL',
      label: 'Raw Materials',
      subtitle: 'Coils, Sheets, Bars & Tool Steel',
      icon: Database,
      tag: 'Primary Feedstock'
    },
    {
      id: 'WIP',
      label: 'Half-Made Parts (WIP)',
      subtitle: 'Press blanks, stamped lots, in-transit',
      icon: Settings,
      tag: 'Shopfloor Buffers'
    },
    {
      id: 'FINISHED_GOOD',
      label: 'Finished Goods',
      subtitle: 'OEM brackets, pedal assemblies, stampings',
      icon: Package,
      tag: 'Dispatch-Ready'
    },
    {
      id: 'SPARE_PART',
      label: 'Spare Parts & Tooling',
      subtitle: 'Press dies, MIG wire, consumables',
      icon: Boxes,
      tag: 'Crib & Maintenance'
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
      {/* Top Telemetry & Control Bar */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
          borderRadius: '12px',
          padding: '20px 24px',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(6, 78, 59, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle background industrial pattern */}
        <div 
          style={{
            position: 'absolute',
            right: '-20px',
            top: '-20px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} 
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', boxShadow: '0 0 10px #34d399', animation: 'pulse 2s infinite' }} />
              STORES INVENTORY FLIGHT DECK • REAL-TIME ATP
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '2px 0 6px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Stock on Hand & Available-to-Promise (ATP)
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '720px', lineHeight: 1.5 }}>
              Continuous physical store monitoring, order reservation netting, and real-time Available-to-Promise calculations for plant production scheduling and dispatch commitments.
            </p>
          </div>

          {/* Action Button Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenAdjustModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: '#ffffff',
                color: '#065f46',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
            >
              <PlusCircle size={16} color="#065f46" />
              <span>Record Count Adjustment</span>
            </button>

            <button
              onClick={onOpenPrintModal}
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
              title="Generate IATF 16949 Physical Stock Audit Balance Sheet"
            >
              <Printer size={15} />
              <span>Audit Sheet</span>
            </button>

            <button
              onClick={onExportCsv}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
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
              title="Download stock on hand register as CSV"
            >
              <Download size={15} />
              <span>CSV</span>
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
              title="Refresh inventory feeds"
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Live Integrated Telemetry Gauges */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          {/* Gauge 1: Tracked SKUs */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Tracked SKUs
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              {summaryStats.totalItems}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Active in this category
            </div>
          </div>

          {/* Gauge 2: Physical On-Hand */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Gross On-Hand
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              {summaryStats.totalOnHand.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Physically in store bays
            </div>
          </div>

          {/* Gauge 3: Order Allocated */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Order Allocated
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24' }}>
              {summaryStats.totalAllocated.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Committed to WOs / SOs
            </div>
          </div>

          {/* Gauge 4: Net Free to Promise (ATP) */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Net Free ATP
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#34d399' }}>
              {summaryStats.totalAtp.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Available to promise
            </div>
          </div>

          {/* Gauge 5: Total Book Valuation */}
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500, marginBottom: '4px' }}>
              Store Valuation
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              {formatCurrency(summaryStats.totalValuation)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Standard cost basis
            </div>
          </div>

          {/* Gauge 6: Critical Shortages */}
          <div 
            style={{ 
              background: summaryStats.shortageCount > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 0, 0, 0.15)', 
              borderRadius: '8px', 
              padding: '10px 14px', 
              border: summaryStats.shortageCount > 0 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ fontSize: '11px', color: summaryStats.shortageCount > 0 ? '#fca5a5' : 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {summaryStats.shortageCount > 0 && <AlertTriangle size={13} color="#f87171" />}
              Safety Shortages
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: summaryStats.shortageCount > 0 ? '#fca5a5' : '#34d399' }}>
              {summaryStats.shortageCount} SKUs
            </div>
            <div style={{ fontSize: '11px', color: summaryStats.shortageCount > 0 ? '#fee2e2' : 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              {summaryStats.shortageCount > 0 ? 'Buffer breach detected' : 'All buffers satisfied'}
            </div>
          </div>
        </div>
      </div>

      {/* Segment Station Switcher (Tactile Automotive Cards) */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px'
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab(tab.id); }}
              style={{
                cursor: 'pointer',
                borderRadius: '10px',
                padding: '14px 16px',
                background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                border: isSelected ? '2px solid #059669' : '1px solid var(--border-color)',
                boxShadow: isSelected ? '0 4px 14px -2px rgba(5, 150, 105, 0.18)' : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#10b981';
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? '#ecfdf5' : 'var(--bg-tertiary)',
                      color: isSelected ? '#059669' : 'var(--text-secondary)'
                    }}
                  >
                    <Icon size={17} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? '#065f46' : 'var(--text-primary)' }}>
                      {tab.label}
                    </div>
                  </div>
                </div>

                <span 
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: isSelected ? '#059669' : 'var(--bg-tertiary)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  {tab.tag}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, paddingLeft: '42px' }}>
                {tab.subtitle}
              </div>

              {isSelected && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '20px',
                    right: '20px',
                    height: '3px',
                    backgroundColor: '#059669',
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

export default StockControlHeader;
