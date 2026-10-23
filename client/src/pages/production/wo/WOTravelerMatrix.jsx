import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Play, 
  Send, 
  FileText, 
  Printer, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Boxes, 
  Cpu, 
  Barcode, 
  ArrowUpRight 
} from 'lucide-react';

const WOTravelerMatrix = ({ 
  workOrders = [], 
  isLoading = false,
  onUpdateProgress,
  onRelease,
  onCloseWO,
  onDeleteWO,
  onOpenTravelerModal,
  onAllocateMaterial,
  plants = [],
  busyId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPlant, setSelectedPlant] = useState('All');
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const filteredWOs = workOrders.filter(w => {
    const matchesSearch = 
      (w.WO_Number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.Source_Plan_ID?.Plan_Number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.details?.[0]?.Material_ID?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.details?.[0]?.Material_ID?.code || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'All' || w.Status === selectedStatus;
    const matchesPlant = selectedPlant === 'All' || (w.Plant_ID?._id || w.Plant_ID) === selectedPlant;

    return matchesSearch && matchesStatus && matchesPlant;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return (
          <span style={{
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            border: '1px solid #334155',
            letterSpacing: '0.03em'
          }}>
            DRAFT
          </span>
        );
      case 'Released':
        return (
          <span style={{
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            color: '#22d3ee',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            letterSpacing: '0.03em'
          }}>
            RELEASED
          </span>
        );
      case 'In Progress':
        return (
          <span style={{
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            letterSpacing: '0.03em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block', boxShadow: '0 0 6px #f59e0b' }} />
            IN PROGRESS
          </span>
        );
      case 'Completed':
        return (
          <span style={{
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            letterSpacing: '0.03em'
          }}>
            COMPLETED
          </span>
        );
      case 'Closed':
        return (
          <span style={{
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: 'rgba(100, 116, 139, 0.15)',
            color: '#94a3b8',
            border: '1px solid #334155',
            letterSpacing: '0.03em'
          }}>
            CLOSED
          </span>
        );
      default:
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: '#cbd5e1' }}>
            {status}
          </span>
        );
    }
  };

  const getMatStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontWeight: 600
          }}>
            Pending Staging
          </span>
        );
      case 'Allocated':
        return (
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            color: '#22d3ee',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            fontWeight: 600
          }}>
            Allocated / Staged
          </span>
        );
      case 'Partially Consumed':
        return (
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontWeight: 600
          }}>
            Partial Consumed
          </span>
        );
      case 'Consumed':
        return (
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontWeight: 600
          }}>
            100% Consumed
          </span>
        );
      default:
        return <span style={{ fontSize: '10px', color: '#94a3b8' }}>{status || 'Pending'}</span>;
    }
  };

  return (
    <div style={{
      backgroundColor: '#121722',
      border: '1px solid #232d3f',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Search & Filters Command Bar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1e293b',
        backgroundColor: '#161e2c',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left: Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#0f141c',
            border: '1px solid #232d3f',
            borderRadius: '6px',
            width: '100%'
          }}>
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search WO#, Plan#, Part name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '12px',
                width: '100%',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Right: Stage Pills & Plant Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Status Pills */}
          <div style={{ display: 'flex', backgroundColor: '#0f141c', borderRadius: '6px', padding: '2px', border: '1px solid #232d3f' }}>
            {['All', 'Draft', 'Released', 'In Progress', 'Completed', 'Closed'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: selectedStatus === st ? 700 : 500,
                  backgroundColor: selectedStatus === st ? '#f59e0b' : 'transparent',
                  color: selectedStatus === st ? '#0b0f17' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Plant Dropdown */}
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            style={{
              padding: '6px 10px',
              backgroundColor: '#0f141c',
              border: '1px solid #232d3f',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '11px',
              outline: 'none'
            }}
          >
            <option value="All">All Plants</option>
            {plants.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0d1117', color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
              <th style={{ width: '36px', padding: '10px 8px' }}></th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Work Order / Traveler</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Source Plan</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Component / Part</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Progress & Output</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Material Status</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Stage</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Loading shop-floor job travelers...
                  </div>
                </td>
              </tr>
            ) : filteredWOs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  <Barcode size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>No Work Orders matching filter</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Generate a new work order from an approved plan or press "Seed Demo Data" above.
                  </div>
                </td>
              </tr>
            ) : (
              filteredWOs.map(wo => {
                const detail = wo.details?.[0] || {};
                const targetQty = Number(detail.Target_Quantity) || 1000;
                const producedQty = Number(detail.Produced_Quantity) || 0;
                const scrapQty = Number(detail.Scrapped_Quantity) || 0;
                const pct = wo.Overall_Progress_Percentage || (targetQty > 0 ? (producedQty / targetQty) * 100 : 0);
                const isExpanded = expandedRows.has(wo._id);

                return (
                  <React.Fragment key={wo._id}>
                    <tr style={{
                      borderBottom: '1px solid #1e293b',
                      backgroundColor: isExpanded ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}>
                      {/* Expand Toggle */}
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleRow(wo._id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isExpanded ? '#f59e0b' : '#64748b',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </td>

                      {/* Work Order Number & Plant */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#f8fafc',
                            fontSize: '13px'
                          }}>
                            {wo.WO_Number}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                          {wo.Plant_ID?.name || 'LBAP Hosur Unit 1'}
                        </div>
                      </td>

                      {/* Source Plan */}
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: '#38bdf8',
                          fontWeight: 600,
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {wo.Source_Plan_ID?.Plan_Number || 'PP-2026-01'}
                        </span>
                      </td>

                      {/* Component / Material */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>
                          {detail.Material_ID?.name || 'Brake Pedal Bracket Blank'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                          {detail.Material_ID?.code || 'MAT-BRK-01'} • {detail.Material_ID?.grade || 'IS 513 CR4'}
                        </div>
                      </td>

                      {/* Progress & Output */}
                      <td style={{ padding: '10px 12px', minWidth: '180px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 600 }}>
                            {producedQty.toLocaleString()} / {targetQty.toLocaleString()} pcs
                          </span>
                          <span style={{
                            fontWeight: 700,
                            color: pct >= 100 ? '#34d399' : (pct > 0 ? '#fbbf24' : '#94a3b8'),
                            fontFamily: 'monospace'
                          }}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ height: '5px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(pct, 100)}%`,
                            height: '100%',
                            backgroundColor: pct >= 100 ? '#10b981' : (pct > 0 ? '#f59e0b' : '#334155'),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        {scrapQty > 0 && (
                          <div style={{ fontSize: '10px', color: '#f97316', marginTop: '2px' }}>
                            Scrap: {scrapQty} pcs ({((scrapQty / (producedQty || 1)) * 100).toFixed(1)}%)
                          </div>
                        )}
                      </td>

                      {/* Material Status */}
                      <td style={{ padding: '10px 12px' }}>
                        {getMatStatusBadge(wo.Material_Status)}
                      </td>

                      {/* Work Order Stage */}
                      <td style={{ padding: '10px 12px' }}>
                        {getStatusBadge(wo.Status)}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {/* Release Action (Draft only) */}
                          {wo.Status === 'Draft' && (
                            <button
                              onClick={() => onRelease(wo._id)}
                              disabled={busyId === `rel-${wo._id}`}
                              title="Release to Shop Floor"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                                border: '1px solid rgba(6, 182, 212, 0.4)',
                                color: '#22d3ee',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Play size={12} /> Release
                            </button>
                          )}

                          {/* Log Output (Released or In Progress) */}
                          {['Released', 'In Progress'].includes(wo.Status) && (
                            <button
                              onClick={() => onUpdateProgress(wo)}
                              title="Log Produced Quantity"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                color: '#fbbf24',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <CheckCircle2 size={12} /> Output
                            </button>
                          )}

                          {/* Close Work Order (Completed only) */}
                          {wo.Status === 'Completed' && (
                            <button
                              onClick={() => onCloseWO(wo._id)}
                              disabled={busyId === `close-${wo._id}`}
                              title="Close Work Order (Lock Materials & Cost)"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#34d399',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Lock size={12} /> Close WO
                            </button>
                          )}

                          {/* Material Allocation shortcut */}
                          {wo.Material_Status === 'Pending' && (
                            <button
                              onClick={() => onAllocateMaterial(wo)}
                              title="Allocate Raw Material"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                color: '#38bdf8',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Boxes size={12} /> Allocate
                            </button>
                          )}

                          {/* View Traveler Sheet */}
                          <button
                            onClick={() => onOpenTravelerModal(wo)}
                            title="View Official IATF Job Traveler"
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#161e2c',
                              border: '1px solid #232d3f',
                              color: '#94a3b8',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            <FileText size={13} />
                          </button>

                          {/* Delete Action (Draft/Released only) */}
                          {['Draft', 'Released'].includes(wo.Status) && (
                            <button
                              onClick={() => onDeleteWO(wo._id)}
                              title="Delete Work Order"
                              style={{
                                padding: '4px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Routing & Picklist Drawer */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#0d1117' }}>
                        <td colSpan={8} style={{ padding: '16px 20px', borderBottom: '1px solid #232d3f' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
                            {/* Left: Component BOM Picklist */}
                            <div style={{
                              backgroundColor: '#121722',
                              border: '1px solid #232d3f',
                              borderRadius: '6px',
                              padding: '12px'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Boxes size={14} />
                                Component Picklist & Reservation
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#161e2c', borderRadius: '4px' }}>
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{detail.Material_ID?.name || 'Raw Material Coil'}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>Bin: BAY-A-RACK-03 • Lot: COIL-2026-X81</div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>{targetQty.toLocaleString()} pcs</div>
                                    <div style={{ fontSize: '10px', color: '#10b981' }}>Staged & Verified</div>
                                  </div>
                                </div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                                  * Raw material issue posted under inventory ledger automatically upon first press stroke.
                                </div>
                              </div>
                            </div>

                            {/* Right: 6-Stage Manufacturing Routing */}
                            <div style={{
                              backgroundColor: '#121722',
                              border: '1px solid #232d3f',
                              borderRadius: '6px',
                              padding: '12px'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Cpu size={14} />
                                IATF 16949 Operation Routing Flow
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10px' }}>
                                {[
                                  { op: 'OP 10', title: 'Shear / Blanking', status: producedQty > 0 ? 'Done' : 'Ready' },
                                  { op: 'OP 20', title: 'Stamping 250T', status: producedQty > 0 ? 'Active' : 'Queued' },
                                  { op: 'OP 30', title: 'Hydraulic Piercing', status: producedQty >= targetQty * 0.5 ? 'Done' : 'Queued' },
                                  { op: 'OP 40', title: 'Robotic Weld Cell', status: producedQty >= targetQty * 0.75 ? 'Done' : 'Queued' },
                                  { op: 'OP 50', title: 'Cathodic E-Coat', status: pct >= 100 ? 'Done' : 'Queued' },
                                  { op: 'OP 60', title: 'Final CMM Inspection', status: wo.Status === 'Completed' ? 'Certified' : 'Queued' }
                                ].map((step, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      padding: '6px 8px',
                                      borderRadius: '4px',
                                      backgroundColor: step.status === 'Done' || step.status === 'Certified' ? 'rgba(16, 185, 129, 0.1)' : (step.status === 'Active' ? 'rgba(245, 158, 11, 0.12)' : '#161e2c'),
                                      border: `1px solid ${step.status === 'Done' || step.status === 'Certified' ? 'rgba(16, 185, 129, 0.3)' : (step.status === 'Active' ? 'rgba(245, 158, 11, 0.3)' : '#232d3f')}`
                                    }}
                                  >
                                    <div style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>{step.op}</div>
                                    <div style={{ color: '#cbd5e1', marginTop: '1px' }}>{step.title}</div>
                                    <div style={{
                                      fontWeight: 600,
                                      fontSize: '9px',
                                      marginTop: '2px',
                                      color: step.status === 'Done' || step.status === 'Certified' ? '#34d399' : (step.status === 'Active' ? '#fbbf24' : '#64748b')
                                    }}>
                                      {step.status}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WOTravelerMatrix;
