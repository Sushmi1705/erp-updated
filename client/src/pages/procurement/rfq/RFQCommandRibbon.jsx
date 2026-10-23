import React from 'react';
import { 
  FileText, ShieldAlert, Award, Clock, Users, Plus, 
  Sparkles, Printer, RefreshCw, Layers, TrendingDown, DollarSign
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const RFQCommandRibbon = ({
  rfqs = [],
  activePerspective,
  setActivePerspective,
  onAddNew,
  onPrintReport,
  onRefresh,
  loading = false
}) => {
  const totalRFQs = rfqs.length;
  const sealedCount = rfqs.filter(r => r.sourcingType === 'Sealed Bid').length;
  const openCount = totalRFQs - sealedCount;
  
  const totalBids = rfqs.reduce((sum, r) => sum + (r.bids?.length || 0), 0);
  const decisionReady = rfqs.filter(r => (r.bids?.length || 0) >= 2 && r.status !== 'Awarded' && r.status !== 'Cancelled').length;
  const awardedCount = rfqs.filter(r => r.status === 'Awarded').length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
      borderRadius: '12px',
      padding: '18px 22px',
      color: '#f8fafc',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      marginBottom: '18px',
      border: '1px solid rgba(99, 102, 241, 0.25)'
    }}>
      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            <Award size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{
                fontSize: '19px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                Strategic e-Sourcing & Supplier Bid Matrix (RFQ)
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.4)'
              }}>
                JAGGAER / Ariba Sourcing
              </span>
            </div>
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              margin: '3px 0 0 0'
            }}>
              Competitive quotation benchmarking, sealed bid vaults, multi-criteria auto-scoring (70% price + 30% lead time), and contract awards.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Print Bid Comparison */}
          <button
            onClick={onPrintReport}
            title="Print Sourcing Committee Bid Comparison Sheet"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '7px',
              transition: 'all 0.15s ease'
            }}
          >
            <Printer size={14} /> Bid Matrix Sheet
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              padding: '7px',
              borderRadius: '7px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.14)'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Create RFQ Button */}
          <button
            onClick={onAddNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              borderRadius: '7px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
            }}
          >
            <Plus size={15} /> Add Price Request (RFQ)
          </button>
        </div>
      </div>

      {/* Sourcing Telemetry Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        paddingTop: '16px'
      }}>
        {/* Metric 1: Total Sourcing Events */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sourcing Events
            </span>
            <Layers size={14} color="#818cf8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              {totalRFQs}
            </span>
            <span style={{ fontSize: '11px', color: '#a5b4fc' }}>
              ({openCount} Open, {sealedCount} Sealed)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Active supplier market tenders
          </div>
        </div>

        {/* Metric 2: Total Quotes In */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quotations Received
            </span>
            <FileText size={14} color="#38bdf8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>
              {totalBids}
            </span>
            <span style={{ fontSize: '11px', color: '#bae6fd' }}>
              bids recorded
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Across all competing vendors
          </div>
        </div>

        {/* Metric 3: Ready for Award */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: decisionReady > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Award Readiness
            </span>
            <Award size={14} color="#34d399" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: decisionReady > 0 ? '#34d399' : '#ffffff' }}>
              {decisionReady}
            </span>
            <span style={{ fontSize: '11px', color: decisionReady > 0 ? '#a7f3d0' : '#94a3b8' }}>
              events with ≥ 2 quotes
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Eligible for Purchase Order creation
          </div>
        </div>

        {/* Metric 4: Awarded Contracts */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contracts Awarded
            </span>
            <ShieldAlert size={14} color="#fbbf24" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24' }}>
              {awardedCount}
            </span>
            <span style={{ fontSize: '11px', color: '#fef08a' }}>
              PO contracts issued
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Transmitted to supplier factories
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFQCommandRibbon;
