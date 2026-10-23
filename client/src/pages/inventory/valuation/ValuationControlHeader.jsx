import React from 'react';
import { 
  Calculator, 
  RefreshCw, 
  Printer, 
  Download, 
  Layers, 
  PieChart, 
  History, 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  IndianRupee,
  Coins,
  Scale
} from 'lucide-react';
import { fmtMoney, fmtMoneyFull } from '../../../utils/money';

const ValuationControlHeader = ({
  summary = {},
  activeTab = 'matrix',
  onTabChange,
  onCalculate,
  calculating = false,
  onExportCsv,
  onOpenPrintModal,
  selectedMaterialForLayers
}) => {
  const totalFifo = summary.Total_FIFO_Valuation || 0;
  const totalWac = summary.Total_WAC_Valuation || 0;
  const totalStd = summary.Total_Standard_Valuation || 0;
  const netVariance = summary.Net_Valuation_Variance || (totalFifo - totalStd);
  const isPositiveVariance = netVariance >= 0;

  const tabs = [
    {
      id: 'matrix',
      label: 'Valuation Matrix & Ledger',
      subtitle: 'Material balance sheet costing',
      icon: Scale,
      badge: `${summary.Total_Materials_Count || 0} SKUs`
    },
    {
      id: 'layers',
      label: 'FIFO Layer Ladder',
      subtitle: selectedMaterialForLayers ? selectedMaterialForLayers.code : 'Batch receipt cost drilldown',
      icon: Layers,
      badge: selectedMaterialForLayers ? 'Active Item' : 'Drilldown'
    },
    {
      id: 'categories',
      label: 'Asset Class Distribution',
      subtitle: 'Capital allocation by category',
      icon: PieChart,
      badge: 'Balance Sheet'
    },
    {
      id: 'runs',
      label: 'Statutory Run History',
      subtitle: 'Audit log & recalculation trail',
      icon: History,
      badge: 'Ind AS 2'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
      {/* Top Industrial Executive Command Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        borderRadius: '12px',
        padding: '20px 24px',
        color: '#ffffff',
        boxShadow: '0 8px 24px -4px rgba(6, 78, 59, 0.28)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background grid pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.18) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}>
                <Coins size={20} color="#a7f3d0" />
              </div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Stock Valuation & Cost Accounting Ledger
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'rgba(16, 185, 129, 0.25)',
                color: '#a7f3d0',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.4)'
              }}>
                Ind AS 2 / IATF 16949
              </span>
            </div>
            <p style={{
              fontSize: '13px',
              color: 'rgba(209, 250, 229, 0.9)',
              margin: 0,
              maxWidth: '680px',
              lineHeight: '1.45'
            }}>
              Statutory balance sheet asset costing, historical FIFO receipt cost layers, weighted average (WAC) blending, and material standard cost variance control for stores inventory.
            </p>
          </div>

          {/* Action Command Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={onExportCsv}
              title="Download accounting valuation schedule as CSV"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
            >
              <Download size={14} />
              Export Schedule
            </button>

            <button
              onClick={onOpenPrintModal}
              title="Open printable Ind AS 2 / GAAP statutory valuation certificate"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'; }}
            >
              <Printer size={14} />
              Valuation Certificate
            </button>

            <button
              onClick={onCalculate}
              disabled={calculating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#10b981',
                border: '1px solid #34d399',
                color: '#064e3b',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: calculating ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                opacity: calculating ? 0.75 : 1,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { if (!calculating) e.currentTarget.style.background = '#34d399'; }}
              onMouseLeave={(e) => { if (!calculating) e.currentTarget.style.background = '#10b981'; }}
            >
              <RefreshCw size={15} style={{ animation: calculating ? 'spin 1s linear infinite' : 'none' }} />
              {calculating ? 'Working Out Values...' : 'Work Out Stock Value'}
            </button>
          </div>
        </div>

        {/* Financial Telemetry HUD */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {/* Card 1: Balance Sheet Asset (FIFO) */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.22)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(209, 250, 229, 0.8)', fontWeight: 500 }}>
                Total FIFO Asset Value
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.25)', color: '#6ee7b7', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                Primary
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }} title={fmtMoneyFull(totalFifo)}>
              {fmtMoney(totalFifo)}
            </div>
            <div style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '3px' }}>
              {fmtMoneyFull(totalFifo)}
            </div>
          </div>

          {/* Card 2: Weighted Average Valuation (WAC) */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.22)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(209, 250, 229, 0.8)', fontWeight: 500 }}>
                WAC Blended Valuation
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(96, 165, 250, 0.25)', color: '#93c5fd', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                Average Rate
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }} title={fmtMoneyFull(totalWac)}>
              {fmtMoney(totalWac)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(209, 250, 229, 0.75)', marginTop: '3px' }}>
              {summary.Total_WAC_Tracked_Items || 0} SKUs on WAC
            </div>
          </div>

          {/* Card 3: Standard Benchmark & Variance */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.22)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(209, 250, 229, 0.8)', fontWeight: 500 }}>
                Std Cost Variance
              </span>
              <span style={{
                fontSize: '10px',
                background: isPositiveVariance ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 191, 36, 0.25)',
                color: isPositiveVariance ? '#a7f3d0' : '#fde68a',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                {isPositiveVariance ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {isPositiveVariance ? '+Gain' : '-Discount'}
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: isPositiveVariance ? '#a7f3d0' : '#fde68a', letterSpacing: '-0.02em' }}>
              {isPositiveVariance ? '+' : ''}{fmtMoney(netVariance)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(209, 250, 229, 0.75)', marginTop: '3px' }}>
              Benchmark: {fmtMoney(totalStd)}
            </div>
          </div>

          {/* Card 4: Audit Run Timestamp */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.22)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(209, 250, 229, 0.8)', fontWeight: 500 }}>
                Statutory Run Timestamp
              </span>
              <ShieldCheck size={13} color="#a7f3d0" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>
              {summary.Last_Global_Calculation ? new Date(summary.Last_Global_Calculation).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              }) : 'Current'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(209, 250, 229, 0.75)', marginTop: '2px' }}>
              {summary.Last_Global_Calculation ? new Date(summary.Last_Global_Calculation).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit'
              }) : 'Real-Time'} (Synchronized)
            </div>
          </div>
        </div>
      </div>

      {/* Perspective Navigation Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: isActive ? '2px solid #059669' : '1px solid var(--border-color)',
                background: isActive ? 'rgba(5, 150, 105, 0.08)' : 'var(--bg-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: isActive ? '0 4px 12px rgba(5, 150, 105, 0.12)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border-hover, #cbd5e1)';
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-primary)';
                }
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? '#059669' : 'var(--bg-secondary)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}>
                <Icon size={18} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: isActive ? '#047857' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {tab.label}
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isActive ? 'rgba(5, 150, 105, 0.2)' : 'var(--bg-tertiary)',
                    color: isActive ? '#065f46' : 'var(--text-secondary)',
                    flexShrink: 0
                  }}>
                    {tab.badge}
                  </span>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {tab.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ValuationControlHeader;
