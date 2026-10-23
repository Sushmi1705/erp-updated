import React from 'react';
import { 
  Microscope, Printer, RefreshCw, CheckCircle2, 
  AlertTriangle, Clock, Layers, ShieldAlert, Check, FileText
} from 'lucide-react';

const InspectionHeaderBar = ({
  inspections = [],
  activePerspective,
  setActivePerspective,
  onOpenPrintModal,
  onRefresh,
  loading = false
}) => {
  const totalCount = inspections.length;
  const pendingCount = inspections.filter(i => i.inspectionStatus === 'Pending' || i.inspectionStatus === 'In-Progress').length;
  const completedCount = inspections.filter(i => i.inspectionStatus === 'Completed').length;
  const holdCount = inspections.filter(i => i.inspectionStatus === 'Hold-Review').length;

  const totalInspected = inspections.reduce((sum, i) => sum + (i.inspectedQuantity || 0), 0);
  const totalAccepted = inspections.reduce((sum, i) => sum + (i.acceptedQuantity || 0), 0);
  const yieldPct = totalInspected > 0 ? ((totalAccepted / totalInspected) * 100).toFixed(1) : '100.0';

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
      {/* ── Top Row: Identity & Quick Action ─────────────────────────────────── */}
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
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
            flexShrink: 0
          }}>
            <Microscope size={17} />
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
                Receiving Quality Assurance (RQA) & Inward Testing
              </h1>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                IATF 16949 / Inward Lab
              </span>
            </div>
            <p style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              margin: '1px 0 0 0'
            }}>
              Material verification, sampling inspection, defect dispositioning & inventory clearance.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onOpenPrintModal}
            title="Print Inspection Release Certificate (COA)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 500,
              background: 'var(--surface-canvas)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Printer size={13} color="var(--text-secondary)" />
            <span>Release Certificate</span>
          </button>

          <button
            onClick={onRefresh}
            title="Refresh Inspection Queue"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              fontSize: '11.5px',
              background: 'var(--surface-canvas)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Bottom Row: Lab Metric Counters & Perspective Switcher ───────────── */}
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
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Total Jobs:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalCount}</span>
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
            <span style={{ color: '#b45309', fontWeight: 500 }}>Awaiting QA:</span>
            <span style={{ fontWeight: 700, color: '#b45309' }}>{pendingCount}</span>
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
            <span style={{ color: '#047857', fontWeight: 500 }}>Cleared (Good):</span>
            <span style={{ fontWeight: 700, color: '#047857' }}>{completedCount}</span>
          </div>

          {holdCount > 0 && (
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
              <span style={{ color: '#dc2626', fontWeight: 500 }}>On Hold:</span>
              <span style={{ fontWeight: 700, color: '#dc2626' }}>{holdCount}</span>
            </div>
          )}

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
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Pass Yield:</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>{yieldPct}%</span>
          </div>
        </div>

        {/* Perspective Switcher */}
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
            onClick={() => setActivePerspective('Workbench')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: activePerspective === 'Workbench' ? 600 : 500,
              background: activePerspective === 'Workbench' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Workbench' ? '#059669' : 'var(--text-secondary)',
              borderRadius: '5px',
              border: activePerspective === 'Workbench' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Workbench' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Microscope size={12} />
            <span>QA Test Bench</span>
          </button>

          <button
            onClick={() => setActivePerspective('Register')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: activePerspective === 'Register' ? 600 : 500,
              background: activePerspective === 'Register' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Register' ? '#059669' : 'var(--text-secondary)',
              borderRadius: '5px',
              border: activePerspective === 'Register' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Register' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Layers size={12} />
            <span>Audit Register</span>
          </button>

          <button
            onClick={() => setActivePerspective('NCR')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: activePerspective === 'NCR' ? 600 : 500,
              background: activePerspective === 'NCR' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'NCR' ? '#059669' : 'var(--text-secondary)',
              borderRadius: '5px',
              border: activePerspective === 'NCR' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'NCR' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <ShieldAlert size={12} />
            <span>Rejection Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InspectionHeaderBar;
