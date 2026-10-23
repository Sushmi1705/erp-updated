import React from 'react';
import { 
  FileText, ShieldCheck, Award, Clock, Users, Plus, 
  Printer, RefreshCw, Lock, Sparkles, Layers, CheckCircle2
} from 'lucide-react';

const RFQHeaderBar = ({
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
      background: 'var(--surface-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      padding: '16px 20px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {/* ── Top Row: Title, Sourcing Badges & Actions ───────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Title & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)',
            flexShrink: 0
          }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Supplier Price Requests (RFQ)
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#2563eb',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                Sourcing & Bid Evaluation Studio
              </span>
            </div>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              margin: '3px 0 0 0'
            }}>
              Multi-vendor price inquiries, sealed tender vaults, commercial comparison & purchase order awards.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onPrintReport}
            title="Generate Comparative Quotation Statement (CQS)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              fontSize: '12px',
              fontWeight: 500,
              background: 'var(--surface-canvas)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <Printer size={14} color="var(--text-secondary)" />
            <span>Comparative Sheet (CQS)</span>
          </button>

          <button
            onClick={onRefresh}
            title="Refresh RFQs and quotations"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 11px',
              fontSize: '12px',
              background: 'var(--surface-canvas)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={onAddNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
              transition: 'background 0.15s'
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>New Price Request</span>
          </button>
        </div>
      </div>

      {/* ── Bottom Row: Clean Calm Metrics Strip & Perspective Pills ─────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-color)'
      }}>
        {/* Metric Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'var(--surface-canvas)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '12px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Sourcing Events:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalRFQs}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              ({openCount} Open, {sealedCount} Sealed)
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'var(--surface-canvas)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '12px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Quotations Logged:</span>
            <span style={{ fontWeight: 700, color: '#2563eb' }}>{totalBids}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(16, 185, 129, 0.08)',
            borderRadius: '6px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '12px'
          }}>
            <Award size={13} color="#059669" />
            <span style={{ color: '#047857', fontWeight: 500 }}>Evaluation Ready (≥2 quotes):</span>
            <span style={{ fontWeight: 700, color: '#047857' }}>{decisionReady}</span>
          </div>

          {awardedCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: '6px',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: '12px'
            }}>
              <CheckCircle2 size={13} color="#4f46e5" />
              <span style={{ color: '#4338ca', fontWeight: 500 }}>Contracts Awarded:</span>
              <span style={{ fontWeight: 700, color: '#4338ca' }}>{awardedCount}</span>
            </div>
          )}
        </div>

        {/* Perspective Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--surface-canvas)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActivePerspective('Studio')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Studio' ? 600 : 500,
              background: activePerspective === 'Studio' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Studio' ? '#2563eb' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: activePerspective === 'Studio' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Studio' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Award size={13} />
            <span>Comparative Studio</span>
          </button>

          <button
            onClick={() => setActivePerspective('Ledger')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Ledger' ? 600 : 500,
              background: activePerspective === 'Ledger' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Ledger' ? '#2563eb' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: activePerspective === 'Ledger' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Ledger' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={13} />
            <span>Tenders Directory</span>
          </button>

          <button
            onClick={() => setActivePerspective('Pipeline')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Pipeline' ? 600 : 500,
              background: activePerspective === 'Pipeline' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Pipeline' ? '#2563eb' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: activePerspective === 'Pipeline' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Pipeline' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={13} />
            <span>Lifecycle Pipeline</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RFQHeaderBar;
