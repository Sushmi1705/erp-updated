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
      badgeColor: '#475569',
      bgColor: '#f1f5f9',
      borderColor: '#e2e8f0',
      hint: 'Awaiting die mounting & line setup'
    },
    {
      id: 'Released',
      title: 'Staged on Floor',
      badgeColor: '#0369a1',
      bgColor: '#e0f2fe',
      borderColor: '#bae6fd',
      hint: 'Raw coil staged at press bay'
    },
    {
      id: 'In Progress',
      title: 'Active In-Cycle',
      badgeColor: '#92400e',
      bgColor: '#fef3c7',
      borderColor: '#fde68a',
      hint: 'Strokes running, cadence live'
    },
    {
      id: 'Completed',
      title: 'Putaway Ready',
      badgeColor: '#166534',
      bgColor: '#dcfce7',
      borderColor: '#bbf7d0',
      hint: '100% produced, CMM passed'
    },
    {
      id: 'Closed',
      title: 'Cost Reconciled',
      badgeColor: '#64748b',
      bgColor: '#f8fafc',
      borderColor: '#e2e8f0',
      hint: 'Audited & locked to General Ledger'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, minmax(260px, 1fr))',
      gap: '14px',
      overflowX: 'auto',
      paddingBottom: '12px'
    }}>
      {columns.map(col => {
        const colWOs = workOrders.filter(w => w.Status === col.id);

        return (
          <div
            key={col.id}
            style={{
              backgroundColor: '#f8fafc',
              border: `1px solid ${col.borderColor}`,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '520px',
              maxHeight: '75vh',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
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
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                    {col.title}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    color: col.badgeColor,
                    fontFamily: 'monospace',
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    {colWOs.length}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
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
                  padding: '36px 10px',
                  textAlign: 'center',
                  color: '#94a3b8',
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
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
                        transition: 'transform 0.1s ease, border-color 0.15s ease'
                      }}
                    >
                      {/* Card Top: WO Number & Plan */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '12px',
                          color: '#0f172a'
                        }}>
                          {wo.WO_Number}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          color: '#0369a1',
                          backgroundColor: '#e0f2fe',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          fontWeight: 600
                        }}>
                          {wo.Source_Plan_ID?.Plan_Number || 'PP-2026-01'}
                        </span>
                      </div>

                      {/* Part Name & Grade */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                          {detail.Material_ID?.name || 'Automotive Component'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                          {detail.Material_ID?.code || 'MAT-AUTO'}
                        </div>
                      </div>

                      {/* Progress Gauge */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                          <span style={{ color: '#64748b', fontFamily: 'monospace' }}>
                            {producedQty.toLocaleString()} / {targetQty.toLocaleString()} pcs
                          </span>
                          <span style={{
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            color: pct >= 100 ? '#059669' : (pct > 0 ? '#d97706' : '#64748b')
                          }}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ height: '5px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(pct, 100)}%`,
                            height: '100%',
                            backgroundColor: pct >= 100 ? '#059669' : (pct > 0 ? '#d97706' : '#cbd5e1'),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {/* Scrap or Material Pill */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                        <span style={{
                          color: wo.Material_Status === 'Consumed' ? '#059669' : (wo.Material_Status === 'Allocated' ? '#0284c7' : '#d97706'),
                          fontWeight: 600
                        }}>
                          ● {wo.Material_Status || 'Pending'}
                        </span>
                        {scrapQty > 0 && (
                          <span style={{ color: '#c2410c', fontWeight: 600 }}>
                            {scrapQty} scrap
                          </span>
                        )}
                      </div>

                      {/* Card Action Row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '8px',
                        marginTop: '4px'
                      }}>
                        <button
                          onClick={() => onOpenTravelerModal(wo)}
                          title="View Official Traveler Sheet"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 500
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
                                backgroundColor: '#e0f2fe',
                                border: '1px solid #bae6fd',
                                color: '#0369a1',
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
                                backgroundColor: '#fef3c7',
                                border: '1px solid #fde68a',
                                color: '#92400e',
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
                                backgroundColor: '#dcfce7',
                                border: '1px solid #bbf7d0',
                                color: '#166534',
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
