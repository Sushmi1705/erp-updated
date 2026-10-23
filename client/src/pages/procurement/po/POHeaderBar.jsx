import React from 'react';
import { 
  FileText, Plus, RefreshCw, Printer, Truck, CheckCircle2, 
  Clock, ShieldCheck, Layers, Award, DollarSign
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const POHeaderBar = ({
  purchaseOrders = [],
  activePerspective,
  setActivePerspective,
  selectedPo,
  onAddNew,
  onPrintVoucher,
  onRefresh,
  loading = false
}) => {
  const totalPOs = purchaseOrders.length;
  const totalCommitment = purchaseOrders.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);
  const pendingApprovalCount = purchaseOrders.filter(po => po.approvalStatus === 'Pending').length;
  const inTransitCount = purchaseOrders.filter(po => po.deliveryStatus === 'In-Transit').length;
  const deliveredCount = purchaseOrders.filter(po => po.deliveryStatus === 'Delivered').length;

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
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
            flexShrink: 0
          }}>
            <Truck size={20} />
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
                Purchase Orders (PO)
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                Procurement Contracts & Inbound Logistics Console
              </span>
            </div>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              margin: '3px 0 0 0'
            }}>
              Direct supplier contracts, B2B EDI transmission, inbound ASN shipments & 3-way invoice matching.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onPrintVoucher}
            title="Print Official Purchase Order Voucher"
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
            <span>Official PO Voucher</span>
          </button>

          <button
            onClick={onRefresh}
            title="Refresh Purchase Orders"
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
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
              transition: 'background 0.15s'
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Purchase Order</span>
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
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Purchase Orders:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalPOs}</span>
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
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Committed Spend:</span>
            <span style={{ fontWeight: 700, color: '#059669', fontFamily: 'var(--font-mono)' }}>
              {fmtMoneyFull(totalCommitment)}
            </span>
          </div>

          {pendingApprovalCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(245, 158, 11, 0.08)',
              borderRadius: '6px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '12px'
            }}>
              <Clock size={13} color="#d97706" />
              <span style={{ color: '#b45309', fontWeight: 500 }}>Awaiting Approval:</span>
              <span style={{ fontWeight: 700, color: '#b45309' }}>{pendingApprovalCount}</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(59, 130, 246, 0.08)',
            borderRadius: '6px',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            fontSize: '12px'
          }}>
            <Truck size={13} color="#2563eb" />
            <span style={{ color: '#1d4ed8', fontWeight: 500 }}>Inbound In-Transit:</span>
            <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{inTransitCount}</span>
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
            <CheckCircle2 size={13} color="#059669" />
            <span style={{ color: '#047857', fontWeight: 500 }}>Delivered & Stores GRN:</span>
            <span style={{ fontWeight: 700, color: '#047857' }}>{deliveredCount}</span>
          </div>
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
            onClick={() => setActivePerspective('Workbench')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Workbench' ? 600 : 500,
              background: activePerspective === 'Workbench' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Workbench' ? '#059669' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: activePerspective === 'Workbench' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Workbench' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={13} />
            <span>Fulfillment Workbench</span>
          </button>

          <button
            onClick={() => setActivePerspective('Ledger')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Ledger' ? 600 : 500,
              background: activePerspective === 'Ledger' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Ledger' ? '#059669' : 'var(--text-secondary)',
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
            <span>Orders Ledger</span>
          </button>

          <button
            onClick={() => setActivePerspective('Pipeline')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Pipeline' ? 600 : 500,
              background: activePerspective === 'Pipeline' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Pipeline' ? '#059669' : 'var(--text-secondary)',
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
            <span>Logistics Pipeline</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default POHeaderBar;
