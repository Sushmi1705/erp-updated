import React from 'react';
import { 
  Play, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  FileText, 
  AlertTriangle, 
  Boxes, 
  Cpu, 
  Sparkles 
} from 'lucide-react';

const WOKanbanBoard = ({ 
  workOrders = [], 
  onAdvanceStatus, 
  onUpdateProgress, 
  onCloseWO, 
  onOpenTravelerModal,
  onRelease
}) => {
  const columns = [
    {
      id: 'Draft',
      title: 'Tooling & Setup',
      badgeColor: '#94a3b8',
      bgColor: 'rgba(100, 116, 139, 0.08)',
      borderColor: '#334155',
      hint: 'Awaiting die mounting & line setup'
    },
    {
      id: 'Released',
      title: 'Staged on Floor',
      badgeColor: '#22d3ee',
      bgColor: 'rgba(6, 182, 212, 0.08)',
      borderColor: 'rgba(6, 182, 212, 0.3)',
      hint: 'Raw coil staged at press bay'
    },
    {
      id: 'In Progress',
      title: 'Active In-Cycle',
      badgeColor: '#fbbf24',
      bgColor: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      hint: 'Strokes running, cadence live'
    },
    {
      id: 'Completed',
      title: 'Putaway Ready',
      badgeColor: '#34d399',
      bgColor: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      hint: '100% produced, CMM passed'
    },
    {
      id: 'Closed',
      title: 'Cost Reconciled',
      badgeColor: '#64748b',
      bgColor: 'rgba(30, 41, 59, 0.4)',
      borderColor: '#1e293b',
      hint: 'Audited & locked to General Ledger'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, minmax(260px, 1fr))',
      gap: '12px',
      overflowX: 'auto',
      paddingBottom: '12px'
    }}>
      {columns.map(col => {
        const colWOs = workOrders.filter(w => w.Status === col.id);

        return (
          <div
            key={col.id}
            style={{
              backgroundColor: '#121722',
              border: `1px solid ${col.borderColor}`,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '520px',
              maxHeight: '75vh',
              overflow: 'hidden'
            }}
          >
            {/* Column Header */}
            <div style={{
              padding: '12px 14px',
              backgroundColor: col.bgColor,
              borderBottom: `1px solid ${col.borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
                    {col.title}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: '#0f141c',
                    color: col.badgeColor,
                    fontFamily: 'monospace'
                  }}>
                    {colWOs.length}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                  {col.hint}
                </div>
              </div>
            </div>

            {/* Column Cards Container */}
            <div style={{
              padding: '10px',
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {colWOs.length === 0 ? (
                <div style={{
                  padding: '30px 10px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '11px',
                  fontStyle: 'italic'
                }}>
                  No job cards in this stage
                </div>
              ) : (
                colWOs.map(wo => {
                  const detail = wo.details?.[0] || {};
                  const targetQty = Number(detail.Target_Quantity) || 1000;
                  const producedQty = Number(detail.Produced_Quantity) || 0;
                  const scrapQty = Number(detail.Scrapped_Quantity) || 0;
                  const pct = wo.Overall_Progress_Percentage || (targetQty > 0 ? (producedQty / targetQty) * 100 : 0);

                  return (
                    <div
                      key={wo._id}
                      style={{
                        backgroundColor: '#161e2c',
                        border: '1px solid #232d3f',
                        borderRadius: '6px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        transition: 'transform 0.1s ease, border-color 0.15s ease'
                      }}
                    >
                      {/* Card Top: WO Number & Plan */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '12px',
                          color: '#f8fafc'
                        }}>
                          {wo.WO_Number}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          color: '#38bdf8',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}>
                          {wo.Source_Plan_ID?.Plan_Number || 'PP-2026-01'}
                        </span>
                      </div>

                      {/* Part Name & Grade */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                          {detail.Material_ID?.name || 'Automotive Component'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                          {detail.Material_ID?.code || 'MAT-AUTO'}
                        </div>
                      </div>

                      {/* Progress Gauge */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                          <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                            {producedQty.toLocaleString()} / {targetQty.toLocaleString()} pcs
                          </span>
                          <span style={{
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            color: pct >= 100 ? '#34d399' : (pct > 0 ? '#fbbf24' : '#94a3b8')
                          }}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ height: '4px', backgroundColor: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(pct, 100)}%`,
                            height: '100%',
                            backgroundColor: pct >= 100 ? '#10b981' : (pct > 0 ? '#f59e0b' : '#334155'),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {/* Scrap or Material Pill */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                        <span style={{
                          color: wo.Material_Status === 'Consumed' ? '#34d399' : (wo.Material_Status === 'Allocated' ? '#22d3ee' : '#fbbf24'),
                          fontWeight: 600
                        }}>
                          ● {wo.Material_Status || 'Pending'}
                        </span>
                        {scrapQty > 0 && (
                          <span style={{ color: '#fb923c', fontWeight: 600 }}>
                            {scrapQty} scrap
                          </span>
                        )}
                      </div>

                      {/* Card Action Row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #1e293b',
                        paddingTop: '8px',
                        marginTop: '4px'
                      }}>
                        <button
                          onClick={() => onOpenTravelerModal(wo)}
                          title="View Official Traveler Sheet"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FileText size={12} /> Traveler
                        </button>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          {wo.Status === 'Draft' && (
                            <button
                              onClick={() => onRelease(wo._id)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                color: '#22d3ee',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Play size={10} /> Release
                            </button>
                          )}

                          {['Released', 'In Progress'].includes(wo.Status) && (
                            <button
                              onClick={() => onUpdateProgress(wo)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                color: '#fbbf24',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <CheckCircle2 size={10} /> Log Output
                            </button>
                          )}

                          {wo.Status === 'Completed' && (
                            <button
                              onClick={() => onCloseWO(wo._id)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#34d399',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Lock size={10} /> Close WO
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WOKanbanBoard;
