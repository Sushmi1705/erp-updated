import React from 'react';
import { 
  Calendar, 
  Plus, 
  Settings, 
  Printer, 
  Download, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Clock, 
  Gauge, 
  Layers, 
  Factory,
  Check,
  Send,
  Sparkles
} from 'lucide-react';
import { fmtQty } from '../../../utils/money';

const PlanControlHeader = ({
  summary = {},
  activeTab = 'matrix',
  onTabChange,
  onOpenCreateModal,
  onOpenCapacityModal,
  onOpenPrintModal,
  onExportCsv,
  onSeedDummy,
  selectedPlanForDetails
}) => {
  const tabs = [
    {
      id: 'matrix',
      label: 'Master Schedule Cockpit',
      subtitle: 'Production plans & line items',
      icon: Layers,
      badge: `${summary.totalPlans || 0} Plans`
    },
    {
      id: 'timeline',
      label: 'Takt & Gantt Schedule',
      subtitle: selectedPlanForDetails ? selectedPlanForDetails.Plan_Number : 'Timeline & line cadence',
      icon: Clock,
      badge: selectedPlanForDetails ? `${selectedPlanForDetails.details?.length || 0} Lines` : 'Timeline'
    },
    {
      id: 'capacity',
      label: 'Rough-Cut Capacity Board',
      subtitle: 'Press & welding load balancing',
      icon: Gauge,
      badge: summary.validatedPlans > 0 ? 'Validated' : 'RCCP Check'
    },
    {
      id: 'wos',
      label: 'Shop Floor WO Dispatch',
      subtitle: 'Executed shop orders',
      icon: Factory,
      badge: `${summary.releasedPlans || 0} Released`
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
      {/* High-Tempo Midnight Slate & Crimson Flare Industrial Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)',
        borderRadius: '12px',
        padding: '20px 24px',
        color: '#ffffff',
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.4)',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: '5px solid #f43f5e'
      }}>
        {/* Decorative manufacturing grid flare */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(244, 63, 94, 0.16) 0%, transparent 60%)',
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
                background: 'rgba(244, 63, 94, 0.2)',
                backdropFilter: 'blur(8px)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(244, 63, 94, 0.4)'
              }}>
                <Flame size={20} color="#fb7185" />
              </div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Master Production Schedule (MPS) &amp; Takt Flight Deck
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'rgba(244, 63, 94, 0.25)',
                color: '#fecdd3',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(244, 63, 94, 0.4)'
              }}>
                IATF 16949 § 8.5.1
              </span>
            </div>
            <p style={{
              fontSize: '13px',
              color: 'rgba(226, 232, 240, 0.9)',
              margin: 0,
              maxWidth: '720px',
              lineHeight: '1.45'
            }}>
              Master Production Scheduling (MPS), Rough-Cut Capacity Planning (RCCP) across stamping press lines &amp; welding cells, line-by-line takt sequencing, and automated work order dispatch.
            </p>
          </div>

          {/* Action Command Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {onSeedDummy && (
              <button
                onClick={onSeedDummy}
                title="Populate demo Master Production Plans with part lines and scheduled work orders"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: '#fef3c7',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.32)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'; }}
              >
                <Sparkles size={14} color="#fcd34d" />
                Demo Data
              </button>
            )}

            <button
              onClick={onExportCsv}
              title="Download Master Production Schedule as CSV"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
            >
              <Download size={14} />
              Export Schedule
            </button>

            <button
              onClick={onOpenPrintModal}
              title="Print official IATF 16949 Master Production Schedule certificate"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.16)',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.26)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'; }}
            >
              <Printer size={14} />
              Print MPS Certificate
            </button>

            <button
              onClick={onOpenCapacityModal}
              title="Open plant work center load balancing and bottleneck analyzer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid #38bdf8',
                color: '#bae6fd',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.32)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; }}
            >
              <Gauge size={14} color="#7dd3fc" />
              RCCP Capacity Board
            </button>

            <button
              onClick={onOpenCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f43f5e',
                border: '1px solid #fb7185',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e11d48'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f43f5e'; }}
            >
              <Plus size={15} />
              + Add Production Plan
            </button>
          </div>
        </div>

        {/* Telemetry Radar HUD */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* Card 1: Active Plans */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.8)', fontWeight: 500 }}>
                Active Master Plans
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(244, 63, 94, 0.25)', color: '#fecdd3', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                Programs
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {summary.totalPlans || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#fecdd3', marginTop: '3px' }}>
              {summary.draftPlans || 0} Draft • {summary.approvedPlans || 0} Approved
            </div>
          </div>

          {/* Card 2: Scheduled Part Lines */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.8)', fontWeight: 500 }}>
                Scheduled Part Lines
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.25)', color: '#bae6fd', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                SKUs
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {summary.totalPartLines || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#bae6fd', marginTop: '3px' }}>
              Stamping &amp; Assembly Components
            </div>
          </div>

          {/* Card 3: Total Planned Units */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.8)', fontWeight: 500 }}>
                Planned Production Units
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.25)', color: '#6ee7b7', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                Volume
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#6ee7b7', letterSpacing: '-0.02em' }}>
              {fmtQty(summary.totalPlannedUnits || 0)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(226, 232, 240, 0.8)' }}>units</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.75)', marginTop: '3px' }}>
              Plant Program Target
            </div>
          </div>

          {/* Card 4: Rough-Cut Capacity Status */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.8)', fontWeight: 500 }}>
                Rough-Cut Capacity Check
              </span>
              <Activity size={13} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} color="#38bdf8" />
              {summary.validatedPlans || 0} Validated
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.75)', marginTop: '2px' }}>
              Work Centers Within 160h Limit
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
                border: isActive ? '2px solid #f43f5e' : '1px solid var(--border-color)',
                background: isActive ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: isActive ? '0 4px 12px rgba(244, 63, 94, 0.12)' : 'none'
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
                background: isActive ? '#f43f5e' : 'var(--bg-secondary)',
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
                    color: isActive ? '#e11d48' : 'var(--text-primary)',
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
                    background: isActive ? 'rgba(244, 63, 94, 0.2)' : 'var(--bg-tertiary)',
                    color: isActive ? '#e11d48' : 'var(--text-secondary)',
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

export default PlanControlHeader;
