import React from 'react';
import { 
  Truck, Plus, Printer, RefreshCw, Layers, CheckCircle2, 
  AlertTriangle, Clock, ArrowDownToLine, Package, ShieldCheck
} from 'lucide-react';

const GrnHeaderBar = ({
  grns = [],
  activePerspective,
  setActivePerspective,
  onOpenCreateModal,
  onOpenPrintModal,
  onRefresh,
  loading = false
}) => {
  const totalCount = grns.length;
  const atGateCount = grns.filter(g => g.status === 'Received').length;
  const inspectingCount = grns.filter(g => g.status === 'Inspecting').length;
  const postedCount = grns.filter(g => g.status === 'Posted').length;
  const shortSupplyCount = grns.filter(g => (g.receivedQuantity || 0) < (g.poQuantity || 0) && g.status !== 'Cancelled').length;

  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '10px 16px',
      marginBottom: '10px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* ── Top Row: Station Identity & Primary Actions ───────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Identity & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
            flexShrink: 0
          }}>
            <Truck size={17} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Goods Received Notes (GRN) & Gate Inward
              </h1>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'rgba(2, 132, 199, 0.1)',
                color: '#0284c7',
                border: '1px solid rgba(2, 132, 199, 0.25)'
              }}>
                Gate 1 Receiving Dock
              </span>
            </div>
            <p style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              margin: '1px 0 0 0'
            }}>
              Inward logistics entry, truck verification, delivery challan audit & RQA inspection triggering.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenPrintModal}
            title="Print Inward Material Receipt Note (GRN)"
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
            <span>Print GRN Slip</span>
          </button>

          <button
            onClick={onRefresh}
            title="Refresh Inward Shipments"
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
            onClick={onOpenCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
              transition: 'all 0.15s'
            }}
          >
            <Plus size={15} />
            <span>Record Inward Receipt</span>
          </button>
        </div>
      </div>

      {/* ── Bottom Row: Inward Dock Metrics Strip & View Switcher ─────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-color)'
      }}>
        {/* Metric Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'var(--surface-canvas)',
            borderRadius: '5px',
            border: '1px solid var(--border-color)',
            fontSize: '11px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Total Inward:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalCount}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(2, 132, 199, 0.08)',
            borderRadius: '5px',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            fontSize: '11px'
          }}>
            <Truck size={12} color="#0284c7" />
            <span style={{ color: '#0369a1', fontWeight: 500 }}>At Gate:</span>
            <span style={{ fontWeight: 700, color: '#0369a1' }}>{atGateCount}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(245, 158, 11, 0.08)',
            borderRadius: '5px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            fontSize: '11px'
          }}>
            <Clock size={12} color="#d97706" />
            <span style={{ color: '#b45309', fontWeight: 500 }}>In QA:</span>
            <span style={{ fontWeight: 700, color: '#b45309' }}>{inspectingCount}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(16, 185, 129, 0.08)',
            borderRadius: '5px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '11px'
          }}>
            <CheckCircle2 size={12} color="#059669" />
            <span style={{ color: '#047857', fontWeight: 500 }}>Stock Posted:</span>
            <span style={{ fontWeight: 700, color: '#047857' }}>{postedCount}</span>
          </div>

          {shortSupplyCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(239, 68, 68, 0.08)',
              borderRadius: '5px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '11px'
            }}>
              <AlertTriangle size={12} color="#dc2626" />
              <span style={{ color: '#dc2626', fontWeight: 500 }}>Short Supply:</span>
              <span style={{ fontWeight: 700, color: '#dc2626' }}>{shortSupplyCount}</span>
            </div>
          )}
        </div>

        {/* View Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          background: 'var(--surface-canvas)',
          padding: '2px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActivePerspective('Dock')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: activePerspective === 'Dock' ? 600 : 500,
              background: activePerspective === 'Dock' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Dock' ? '#0284c7' : 'var(--text-secondary)',
              borderRadius: '5px',
              border: activePerspective === 'Dock' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Dock' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Truck size={12} />
            <span>Receiving Dock</span>
          </button>

          <button
            onClick={() => setActivePerspective('Ledger')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: activePerspective === 'Ledger' ? 600 : 500,
              background: activePerspective === 'Ledger' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Ledger' ? '#0284c7' : 'var(--text-secondary)',
              borderRadius: '5px',
              border: activePerspective === 'Ledger' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Ledger' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Layers size={12} />
            <span>Master Register</span>
          </button>

          <button
            onClick={() => setActivePerspective('ExpectedPO')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: activePerspective === 'ExpectedPO' ? 600 : 500,
              background: activePerspective === 'ExpectedPO' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'ExpectedPO' ? '#0284c7' : 'var(--text-secondary)',
              borderRadius: '5px',
              border: activePerspective === 'ExpectedPO' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'ExpectedPO' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <ArrowDownToLine size={12} />
            <span>Expected PO Runway</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrnHeaderBar;
