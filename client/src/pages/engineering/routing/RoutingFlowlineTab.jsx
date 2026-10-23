import React from 'react';
import {
  Plus, Search, Edit2, Trash2, ArrowUp, ArrowDown, Copy,
  Truck, Factory, Sliders, CheckCircle2, ChevronDown, Wrench,
  Flame, ShieldCheck, Box, Clock, Zap
} from 'lucide-react';

export const RoutingFlowlineTab = ({
  operations,
  filteredOperations,
  selectedOperationId,
  selectedOperation,
  resources,
  subcontracting,
  telemetry,
  viewMode,
  setViewMode,
  operationSearch,
  setOperationSearch,
  outsideFilter,
  setOutsideFilter,
  onSelectOperation,
  onOpenModal,
  onDelete,
  onMoveStep,
  onDuplicateStep,
  onSwitchTab,
  getProcessIcon
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── SUB-TOOLBAR ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Filter stations, work centers..."
              value={operationSearch}
              onChange={e => setOperationSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px 6px 26px',
                fontSize: 12,
                borderRadius: 4,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('timeline')}
              style={{
                padding: '5px 10px',
                fontSize: 11.5,
                background: viewMode === 'timeline' ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-secondary)',
                color: viewMode === 'timeline' ? '#0284c7' : 'var(--text-secondary)',
                fontWeight: viewMode === 'timeline' ? 700 : 400,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Flowline Pods
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '5px 10px',
                fontSize: 11.5,
                background: viewMode === 'table' ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-secondary)',
                color: viewMode === 'table' ? '#0284c7' : 'var(--text-secondary)',
                fontWeight: viewMode === 'table' ? 700 : 400,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Matrix Table
            </button>
          </div>

          {/* Outside work checkbox filter */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={outsideFilter}
              onChange={e => setOutsideFilter(e.target.checked)}
            />
            Outside Subcontract Only
          </label>
        </div>

        <button
          onClick={() => onOpenModal('operation', {
            operationSequence: (operations.length + 1) * 10,
            operationDescription: '',
            setupTime: 15,
            runTime: 5.0,
            moveTime: 5,
            timeUOM: 'Minutes',
            controlKey: 'Standard',
            isSubcontracted: false
          })}
          className="btn btn-primary"
          style={{
            fontSize: 12,
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
          }}
        >
          <Plus size={13} /> Add Operation Step
        </button>
      </div>

      {/* ── VIEW MODE 1: TIMELINE FLOWLINE PODS ────────────────────────── */}
      {viewMode === 'timeline' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredOperations.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              No operations found in this revision. Click "Add Operation Step" or "Calibrate Line" to seed.
            </div>
          ) : (
            filteredOperations.map((op, idx) => {
              const isOpSelected = selectedOperationId === op._id;
              const isBottleneck = telemetry.bottleneckOp && telemetry.bottleneckOp._id === op._id;
              const totalTime = (op.totalOperationTime || 0).toFixed(1);
              const setupPct = op.totalOperationTime > 0 ? ((op.setupTime || 0) / op.totalOperationTime * 100) : 0;
              const runPct = op.totalOperationTime > 0 ? ((op.runTime || 0) / op.totalOperationTime * 100) : 0;
              const movePct = op.totalOperationTime > 0 ? ((op.moveTime || 0) / op.totalOperationTime * 100) : 0;
              const lineSharePct = telemetry.totalCycle > 0 ? ((op.totalOperationTime || 0) / telemetry.totalCycle * 100).toFixed(1) : 0;
              const hourlyRate = op.runTime > 0 ? Math.floor(60 / op.runTime) : 0;
              const StepIcon = getProcessIcon(op);

              return (
                <React.Fragment key={op._id}>
                  <div
                    onClick={() => onSelectOperation(op)}
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      gap: 14,
                      background: isOpSelected ? 'rgba(2, 132, 199, 0.05)' : 'var(--bg-secondary)',
                      border: '1px solid',
                      borderColor: isOpSelected ? '#0284c7' : (isBottleneck ? 'rgba(244, 63, 94, 0.45)' : 'var(--border-color)'),
                      borderRadius: 8,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      boxShadow: isOpSelected
                        ? '0 0 0 1px #0284c7, 0 4px 14px rgba(2, 132, 199, 0.12)'
                        : (isBottleneck ? '0 2px 10px rgba(244, 63, 94, 0.12)' : 'var(--shadow-sm)')
                    }}
                  >
                    {/* Left Sequence Pod with Reordering */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 70,
                      borderRight: '1px solid var(--border-color)',
                      paddingRight: 12,
                      gap: 4
                    }}>
                      {/* Reorder Arrows */}
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          disabled={idx === 0}
                          onClick={(e) => { e.stopPropagation(); onMoveStep(op, 'up'); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: idx === 0 ? 'default' : 'pointer',
                            opacity: idx === 0 ? 0.2 : 0.7,
                            padding: 2,
                            color: 'var(--text-secondary)'
                          }}
                          title="Move step up in sequence"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          disabled={idx === filteredOperations.length - 1}
                          onClick={(e) => { e.stopPropagation(); onMoveStep(op, 'down'); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: idx === filteredOperations.length - 1 ? 'default' : 'pointer',
                            opacity: idx === filteredOperations.length - 1 ? 0.2 : 0.7,
                            padding: 2,
                            color: 'var(--text-secondary)'
                          }}
                          title="Move step down in sequence"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isBottleneck ? 'rgba(244, 63, 94, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isBottleneck ? '#e11d48' : '#0284c7'
                      }}>
                        <StepIcon size={16} />
                      </div>

                      <span style={{
                        fontSize: 15,
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: isOpSelected ? '#0284c7' : 'var(--text-primary)'
                      }}>
                        OP #{op.operationSequence}
                      </span>
                    </div>

                    {/* Operation Details Center Pod */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                      {/* Top Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{op.operationDescription}</span>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {isBottleneck && (
                            <span style={{
                              fontSize: 10,
                              background: 'rgba(244, 63, 94, 0.15)',
                              color: '#e11d48',
                              border: '1px solid rgba(244, 63, 94, 0.35)',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <Flame size={11} /> PACING BOTTLENECK
                            </span>
                          )}

                          {op.controlKey === 'Milestone' && (
                            <span style={{
                              fontSize: 10,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#059669',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <ShieldCheck size={11} /> QC GATE
                            </span>
                          )}

                          {op.isSubcontracted && (
                            <span style={{
                              fontSize: 10,
                              background: 'rgba(139, 92, 246, 0.15)',
                              color: '#8b5cf6',
                              border: '1px solid rgba(139, 92, 246, 0.35)',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <Truck size={11} /> Outside Subcontract
                            </span>
                          )}

                          <span style={{
                            fontSize: 10,
                            background: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            padding: '2px 8px',
                            borderRadius: 4,
                            border: '1px solid var(--border-color)',
                            fontWeight: 600
                          }}>
                            {op.controlKey}
                          </span>
                        </div>
                      </div>

                      {/* Work Center & Equipment row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11.5, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Factory size={13} color="#0284c7" />
                          Work Center: <strong style={{ color: 'var(--text-primary)' }}>{op.workCenterId?.name || 'Unassigned'}</strong>
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: op.machineId ? '#10b981' : '#94a3b8',
                            display: 'inline-block'
                          }} />
                          Machine: <strong style={{ color: 'var(--text-primary)' }}>{op.machineId?.name || 'Any Available / Manual Station'}</strong>
                        </span>
                      </div>

                      {/* Takt-Time Load Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                        <div style={{
                          flex: 1,
                          height: 7,
                          background: 'var(--bg-primary)',
                          borderRadius: 4,
                          overflow: 'hidden',
                          display: 'flex',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div style={{ width: `${setupPct}%`, background: '#f59e0b' }} title={`Setup: ${op.setupTime}m`} />
                          <div style={{ width: `${runPct}%`, background: '#f43f5e' }} title={`Run: ${op.runTime}m`} />
                          <div style={{ width: `${movePct}%`, background: '#0284c7' }} title={`Move: ${op.moveTime}m`} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)', minWidth: 65, textAlign: 'right' }}>
                          {totalTime} min
                        </span>
                      </div>

                      {/* Telemetry Breakdown Strip */}
                      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                          Setup: <strong style={{ color: '#d97706' }}>{op.setupTime || 0}m</strong>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />
                          Run: <strong style={{ color: '#e11d48' }}>{op.runTime || 0}m</strong>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
                          Move: <strong style={{ color: '#0284c7' }}>{op.moveTime || 0}m</strong>
                        </span>
                        <span>•</span>
                        <span>Output: <strong style={{ color: 'var(--text-primary)' }}>~{hourlyRate} pcs/hr</strong></span>
                        <span>•</span>
                        <span>Load Share: <strong style={{ color: '#0284c7' }}>{lineSharePct}%</strong></span>
                      </div>

                      {/* Quick Tooling / Resource indicator strip */}
                      {isOpSelected && resources.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Wrench size={11} color="#0284c7" /> Tooling:
                          </span>
                          {resources.map(res => (
                            <span key={res._id} style={{
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              padding: '1px 6px',
                              borderRadius: 3,
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: 10
                            }}>
                              {res.resourceCode} ({res.quantityRequired}x)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Action Pod */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, paddingLeft: 8, borderLeft: '1px solid var(--border-color)' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateStep(op);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 5 }}
                        title="Duplicate operation step"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenModal('operation', {
                            ...op,
                            workCenterId: op.workCenterId?._id || op.workCenterId,
                            machineId: op.machineId?._id || op.machineId
                          }, op._id);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', padding: 5 }}
                        title="Edit operation parameters"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete('operation', op._id);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e11d48', padding: 5 }}
                        title="Delete operation step"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Flowline Station Transfer Conveyor Bridge */}
                  {idx < filteredOperations.length - 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '3px 0',
                      color: 'var(--text-secondary)'
                    }}>
                      <div style={{ height: 1, width: 36, background: 'var(--border-color)' }} />
                      <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'monospace' }}>
                        <ChevronDown size={11} color="#0284c7" />
                        Transfer: <strong>{op.moveTime || 0} min</strong> → Next Station OP #{filteredOperations[idx + 1]?.operationSequence}
                      </span>
                      <div style={{ height: 1, width: 36, background: 'var(--border-color)' }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}

          {/* Active Station Summary Footer */}
          {selectedOperation && (
            <div style={{
              marginTop: 10,
              padding: '10px 14px',
              background: 'rgba(2, 132, 199, 0.06)',
              borderRadius: 6,
              border: '1px solid rgba(2, 132, 199, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              flexWrap: 'wrap',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} color="#0284c7" />
                <span>
                  Active Station <strong>OP #{selectedOperation.operationSequence}: {selectedOperation.operationDescription}</strong>
                  {' '}• Tooling Attached: <strong>{resources.length}</strong>
                  {' '}• Outside Specs: <strong>{subcontracting.length}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onSwitchTab('resources')}
                  className="btn btn-secondary"
                  style={{ fontSize: 11, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Wrench size={11} /> Manage Tooling ({resources.length})
                </button>
                {selectedOperation.isSubcontracted && (
                  <button
                    onClick={() => onSwitchTab('subcontracting')}
                    className="btn btn-secondary"
                    style={{ fontSize: 11, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Truck size={11} /> Manage Subcontract ({subcontracting.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── VIEW MODE 2: MATRIX TABLE ─────────────────────────────────── */
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          overflow: 'hidden',
          background: 'var(--bg-secondary)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', width: 65 }}>Step</th>
                <th style={{ padding: '8px 10px' }}>Description</th>
                <th style={{ padding: '8px 10px' }}>Work Centre</th>
                <th style={{ padding: '8px 10px' }}>Machine</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Setup (min)</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Run (min)</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Move (min)</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (min)</th>
                <th style={{ padding: '8px 10px' }}>Control Key</th>
                <th style={{ padding: '8px 10px' }}>Outside?</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOperations.map(op => {
                const isOpSelected = selectedOperationId === op._id;
                return (
                  <tr
                    key={op._id}
                    onClick={() => onSelectOperation(op)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: isOpSelected ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ padding: '8px 10px', fontWeight: 800, fontFamily: 'monospace', color: '#0284c7' }}>
                      #{op.operationSequence}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {op.operationDescription}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {op.workCenterId?.name || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {op.machineId?.name || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {op.setupTime || 0}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {op.runTime || 0}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {op.moveTime || 0}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7' }}>
                      {op.totalOperationTime || 0}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {op.controlKey}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {op.isSubcontracted ? <span style={{ color: '#8b5cf6', fontWeight: 700 }}>Yes</span> : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateStep(op);
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
                          title="Duplicate"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenModal('operation', {
                              ...op,
                              workCenterId: op.workCenterId?._id || op.workCenterId,
                              machineId: op.machineId?._id || op.machineId
                            }, op._id);
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', padding: 4 }}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete('operation', op._id);
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e11d48', padding: 4 }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default RoutingFlowlineTab;
