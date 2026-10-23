import React from 'react';
import { 
  ShoppingCart, ShieldCheck, AlertTriangle, Clock, CheckCircle2, 
  FileText, Sparkles, Printer, RefreshCw, Layers, ArrowUpRight, Plus, 
  Building2, DollarSign, PackageCheck
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const HIGHER_APPROVAL_LIMIT = 10000;

const RequisitionCommandRibbon = ({
  requisitions = [],
  departments = [],
  mrpSuggestions = [],
  activePerspective,
  setActivePerspective,
  onOpenQuickBuy,
  onOpenMRPShortages,
  onPrintVoucher,
  onRefresh,
  loading = false
}) => {
  // Aggregate Metrics
  const totalCount = requisitions.length;
  const totalValue = requisitions.reduce((sum, r) => sum + (Number(r.totalValue) || 0), 0);
  
  const pendingApprovals = requisitions.filter(r => r.status === 'In_Approval' || r.status === 'Needs_CFO_Approval').length;
  const cfoAlerts = requisitions.filter(r => r.status === 'Needs_CFO_Approval' || (r.totalValue > HIGHER_APPROVAL_LIMIT && r.status !== 'Approved' && r.status !== 'PO_Created')).length;
  const approvedReady = requisitions.filter(r => r.status === 'Approved').length;
  const poCreated = requisitions.filter(r => r.status === 'PO_Created').length;

  const sourcedRatePct = totalCount > 0 ? Math.round((poCreated / totalCount) * 100) : 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #092c3e 0%, #0d1b2a 100%)',
      borderRadius: '12px',
      padding: '18px 22px',
      color: '#f8fafc',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      marginBottom: '18px',
      border: '1px solid rgba(20, 184, 166, 0.2)'
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
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.4)'
          }}>
            <ShoppingCart size={22} color="#ffffff" />
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
                Material Requisitions & e-Procurement Gateway
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(20, 184, 166, 0.25)',
                color: '#5eead4',
                border: '1px solid rgba(20, 184, 166, 0.4)'
              }}>
                Coupa / Ariba Style
              </span>
            </div>
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              margin: '3px 0 0 0'
            }}>
              Guided internal buying, multi-tier budget authorization, MRP shortages pull, and automated PO generation.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* MRP Shortages Converter */}
          {mrpSuggestions.length > 0 && (
            <button
              onClick={onOpenMRPShortages}
              title="Convert pending MRP Purchase recommendations into requisitions"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                borderRadius: '7px',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={14} /> MRP Shortages ({mrpSuggestions.length})
            </button>
          )}

          {/* Print Voucher */}
          <button
            onClick={onPrintVoucher}
            title="Print Requisition Summary Voucher"
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
            <Printer size={14} /> Print Voucher
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

          {/* Create PR Button */}
          <button
            onClick={onOpenQuickBuy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              color: '#ffffff',
              borderRadius: '7px',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)'
            }}
          >
            <Plus size={15} /> Add Purchase Request
          </button>
        </div>
      </div>

      {/* Spend & Approval Telemetry Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        paddingTop: '16px'
      }}>
        {/* Metric 1: Total Requisition Spend Pipeline */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Requisition Value
            </span>
            <DollarSign size={14} color="#2dd4bf" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              {fmtMoneyFull(totalValue)}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#5eead4', marginTop: '2px' }}>
            Across {totalCount} total request orders
          </div>
        </div>

        {/* Metric 2: Pending Tier Approvals */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              In Approval Routing
            </span>
            <Clock size={14} color="#facc15" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: pendingApprovals > 0 ? '#facc15' : '#ffffff' }}>
              {pendingApprovals}
            </span>
            <span style={{ fontSize: '11px', color: '#fde047' }}>
              ({approvedReady} already approved)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Manager & Director review queues
          </div>
        </div>

        {/* Metric 3: High-Value CFO Budget Gate (> ₹10k) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: cfoAlerts > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Executive Budget Alert
            </span>
            <AlertTriangle size={14} color={cfoAlerts > 0 ? '#f87171' : '#34d399'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: cfoAlerts > 0 ? '#f87171' : '#ffffff' }}>
              {cfoAlerts}
            </span>
            <span style={{ fontSize: '11px', color: cfoAlerts > 0 ? '#fca5a5' : '#a7f3d0' }}>
              {cfoAlerts > 0 ? `> ${fmtMoneyFull(HIGHER_APPROVAL_LIMIT)}` : 'Within Budget'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Mandatory CFO sign-off gatekeeper
          </div>
        </div>

        {/* Metric 4: Sourced to PO Fulfillment */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PO Conversion Index
            </span>
            <PackageCheck size={14} color="#38bdf8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>
              {poCreated}
            </span>
            <span style={{ fontSize: '11px', color: '#bae6fd' }}>
              ({sourcedRatePct}% conversion)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Dispatched to external vendors
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitionCommandRibbon;
