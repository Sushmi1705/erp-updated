import React from 'react';
import { 
  GitMerge, 
  Plus, 
  ShieldAlert, 
  Printer, 
  Download, 
  QrCode, 
  Clock, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Flame,
  Search,
  ScanLine
} from 'lucide-react';
import { fmtQty } from '../../../utils/money';

const TraceabilityControlHeader = ({
  summary = {},
  activeTab = 'matrix',
  onTabChange,
  onOpenRegisterModal,
  onOpenQuarantineModal,
  onOpenPrintModal,
  onExportCsv,
  selectedEntityForTree
}) => {
  const tabs = [
    {
      id: 'matrix',
      label: 'Batch & Heat Matrix',
      subtitle: 'Stores active lots & serials',
      icon: ScanLine,
      badge: `${summary.totalEntities || 0} Batches`
    },
    {
      id: 'tree',
      label: 'Bi-Directional Genealogy',
      subtitle: selectedEntityForTree ? selectedEntityForTree.Tracking_Number : 'Coil to customer trace',
      icon: GitMerge,
      badge: selectedEntityForTree ? 'Active Tree' : 'Interactive'
    },
    {
      id: 'shelflife',
      label: 'Shelf-Life & Expiry Radar',
      subtitle: 'Critical countdown & preservation',
      icon: Clock,
      badge: summary.expiringSoonEntities > 0 ? `${summary.expiringSoonEntities} Warning` : 'Protected'
    },
    {
      id: 'audit',
      label: 'Lifecycle Audit Ledger',
      subtitle: 'Chronological event stream',
      icon: History,
      badge: 'Audit Trail'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
      {/* High-Tech Indigo & Cyber Cyan Command Cockpit */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e293b 100%)',
        borderRadius: '12px',
        padding: '20px 24px',
        color: '#ffffff',
        boxShadow: '0 8px 24px -4px rgba(30, 27, 75, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative cyber grid lines */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: 'radial-gradient(circle at 85% 25%, rgba(6, 182, 212, 0.16) 0%, transparent 65%)',
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
                background: 'rgba(6, 182, 212, 0.2)',
                backdropFilter: 'blur(8px)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(6, 182, 212, 0.4)'
              }}>
                <Flame size={20} color="#22d3ee" />
              </div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Automotive Batch, Heat &amp; Serial Traceability Terminal
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'rgba(6, 182, 212, 0.25)',
                color: '#a5f3fc',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(6, 182, 212, 0.4)'
              }}>
                IATF 16949 § 8.5.2
              </span>
            </div>
            <p style={{
              fontSize: '13px',
              color: 'rgba(224, 231, 255, 0.9)',
              margin: 0,
              maxWidth: '720px',
              lineHeight: '1.45'
            }}>
              Bi-directional forward and backward traceability for steel coils, mill heat test certificates (MTC), stamping press runs, quality quarantine containment, and customer OEM dispatch lots.
            </p>
          </div>

          {/* Action Command Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={onExportCsv}
              title="Download traceability records as CSV"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
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
              Export Ledger
            </button>

            <button
              onClick={onOpenPrintModal}
              title="Print official IATF 16949 batch route traveler / QR certificate"
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
              <QrCode size={14} />
              Batch Traveler Tag
            </button>

            <button
              onClick={onOpenQuarantineModal}
              title="Trigger instant quality quarantine containment lock"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid #ef4444',
                color: '#fecaca',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; }}
            >
              <ShieldAlert size={14} color="#fca5a5" />
              Containment Lock
            </button>

            <button
              onClick={onOpenRegisterModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#06b6d4',
                border: '1px solid #22d3ee',
                color: '#083344',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#22d3ee'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#06b6d4'; }}
            >
              <Plus size={15} />
              + Register Batch / Heat
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
          {/* HUD 1: Tracked Entities */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.22)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(224, 231, 255, 0.8)', fontWeight: 500 }}>
                Monitored Entities
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(6, 182, 212, 0.25)', color: '#a5f3fc', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                Total
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {summary.totalEntities || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#a5f3fc', marginTop: '3px' }}>
              {summary.batchesCount || 0} Batches • {summary.lotsCount || 0} Lots
            </div>
          </div>

          {/* HUD 2: Traceable Volume */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.22)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(224, 231, 255, 0.8)', fontWeight: 500 }}>
                Total Stores Volume
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.25)', color: '#6ee7b7', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                Active Stock
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {fmtQty(summary.totalTrackedQty || 0)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(224, 231, 255, 0.8)' }}>units/kg</span>
            </div>
            <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '3px' }}>
              {summary.activeEntities || 0} Active Batches In Stores
            </div>
          </div>

          {/* HUD 3: Quarantine / Quality Containment */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.22)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: summary.quarantinedEntities > 0 ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(224, 231, 255, 0.8)', fontWeight: 500 }}>
                Quality Quarantine Hold
              </span>
              <ShieldAlert size={13} color={summary.quarantinedEntities > 0 ? '#ef4444' : '#94a3b8'} />
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 700,
              color: summary.quarantinedEntities > 0 ? '#fca5a5' : '#ffffff',
              letterSpacing: '-0.02em'
            }}>
              {summary.quarantinedEntities || 0}
            </div>
            <div style={{
              fontSize: '11px',
              color: summary.quarantinedEntities > 0 ? '#fca5a5' : 'rgba(224, 231, 255, 0.7)',
              marginTop: '3px'
            }}>
              {summary.quarantinedEntities > 0 ? 'IATF Nonconforming Hold' : 'Zero Containment Blocks'}
            </div>
          </div>

          {/* HUD 4: Shelf Life Risk */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.22)',
            borderRadius: '8px',
            padding: '12px 14px',
            border: summary.expiringSoonEntities > 0 ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(224, 231, 255, 0.8)', fontWeight: 500 }}>
                Expiring in &lt; 30 Days
              </span>
              <Clock size={13} color={summary.expiringSoonEntities > 0 ? '#f59e0b' : '#38bdf8'} />
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 700,
              color: summary.expiringSoonEntities > 0 ? '#fde68a' : '#ffffff',
              letterSpacing: '-0.02em'
            }}>
              {summary.expiringSoonEntities || 0}
            </div>
            <div style={{
              fontSize: '11px',
              color: summary.expiringSoonEntities > 0 ? '#fde68a' : 'rgba(224, 231, 255, 0.7)',
              marginTop: '3px'
            }}>
              {summary.expiredEntities || 0} Expired Batches
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
                border: isActive ? '2px solid #0891b2' : '1px solid var(--border-color)',
                background: isActive ? 'rgba(8, 145, 178, 0.08)' : 'var(--bg-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: isActive ? '0 4px 12px rgba(8, 145, 178, 0.12)' : 'none'
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
                background: isActive ? '#0891b2' : 'var(--bg-secondary)',
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
                    color: isActive ? '#0e7490' : 'var(--text-primary)',
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
                    background: isActive ? 'rgba(8, 145, 178, 0.2)' : 'var(--bg-tertiary)',
                    color: isActive ? '#0e7490' : 'var(--text-secondary)',
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

export default TraceabilityControlHeader;
