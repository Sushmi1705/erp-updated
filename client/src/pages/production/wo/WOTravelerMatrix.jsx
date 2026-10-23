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
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            letterSpacing: '0.02em'
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
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd',
            letterSpacing: '0.02em'
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
            backgroundColor: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            letterSpacing: '0.02em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97706', display: 'inline-block' }} />
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
            backgroundColor: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            letterSpacing: '0.02em'
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
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            letterSpacing: '0.02em'
          }}>
            CLOSED
          </span>
        );
      default:
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: '#334155' }}>
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
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            fontWeight: 600
          }}>
            Pending Staging
          </span>
        );
      case 'Allocated':
        return (
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd',
            fontWeight: 600
          }}>
            Allocated / Staged
          </span>
        );
      case 'Partially Consumed':
        return (
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            fontWeight: 600
          }}>
            Partial Consumed
          </span>
        );
      case 'Consumed':
        return (
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            fontWeight: 600
          }}>
            100% Consumed
          </span>
        );
      default:
        return <span style={{ fontSize: '11px', color: '#64748b' }}>{status || 'Pending'}</span>;
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Search & Filters Command Bar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
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
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            width: '100%',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <Search size={15} color="#64748b" />
            <input
              type="text"
              placeholder="Search WO#, Plan#, Part name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0f172a',
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
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '2px', border: '1px solid #e2e8f0' }}>
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
                  backgroundColor: selectedStatus === st ? '#d97706' : 'transparent',
                  color: selectedStatus === st ? '#ffffff' : '#475569',
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
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#0f172a',
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
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
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
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #d97706', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Loading shop-floor job travelers...
                  </div>
                </td>
              </tr>
            ) : filteredWOs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  <Barcode size={32} style={{ margin: '0 auto 8px', opacity: 0.5, color: '#94a3b8' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>No Work Orders matching filter</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Generate a new work order from an approved plan or press "Seed Sample Work Orders" above.
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
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isExpanded ? '#fffbeb' : '#ffffff',
                      transition: 'background-color 0.15s ease'
                    }}>
                      {/* Expand Toggle */}
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleRow(wo._id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isExpanded ? '#d97706' : '#94a3b8',
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
                            color: '#0f172a',
                            fontSize: '13px'
                          }}>
                            {wo.WO_Number}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {wo.Plant_ID?.name || 'LBAP Hosur Unit 1'}
                        </div>
                      </td>

                      {/* Source Plan */}
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: '#0369a1',
                          fontWeight: 700,
                          backgroundColor: '#e0f2fe',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {wo.Source_Plan_ID?.Plan_Number || 'PP-2026-01'}
                        </span>
                      </td>

                      {/* Component / Material */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {detail.Material_ID?.name || 'Brake Pedal Bracket Blank'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          {detail.Material_ID?.code || 'MAT-BRK-01'} • {detail.Material_ID?.grade || 'IS 513 CR4'}
                        </div>
                      </td>

                      {/* Progress & Output */}
                      <td style={{ padding: '10px 12px', minWidth: '180px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>
                            {producedQty.toLocaleString()} / {targetQty.toLocaleString()} pcs
                          </span>
                          <span style={{
                            fontWeight: 700,
                            color: pct >= 100 ? '#059669' : (pct > 0 ? '#d97706' : '#64748b'),
                            fontFamily: 'monospace'
                          }}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(pct, 100)}%`,
                            height: '100%',
                            backgroundColor: pct >= 100 ? '#059669' : (pct > 0 ? '#d97706' : '#cbd5e1'),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        {scrapQty > 0 && (
                          <div style={{ fontSize: '10px', color: '#c2410c', marginTop: '2px', fontWeight: 600 }}>
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
                                padding: '4px 10px',
                                borderRadius: '4px',
                                backgroundColor: '#e0f2fe',
                                border: '1px solid #bae6fd',
                                color: '#0369a1',
                                fontSize: '11px',
                                fontWeight: 700,
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
                                padding: '4px 10px',
                                borderRadius: '4px',
                                backgroundColor: '#fef3c7',
                                border: '1px solid #fde68a',
                                color: '#92400e',
                                fontSize: '11px',
                                fontWeight: 700,
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
                                padding: '4px 10px',
                                borderRadius: '4px',
                                backgroundColor: '#dcfce7',
                                border: '1px solid #bbf7d0',
                                color: '#166534',
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
                                padding: '4px 10px',
                                borderRadius: '4px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #cbd5e1',
                                color: '#0284c7',
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
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
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
                                color: '#94a3b8',
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
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td colSpan={8} style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '16px' }}>
                            {/* Left: Component BOM Picklist */}
                            <div style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '12px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Boxes size={14} />
                                Component Picklist & Reservation
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{detail.Material_ID?.name || 'Raw Material Coil'}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Bin: BAY-A-RACK-03 • Lot: COIL-2026-X81</div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>{targetQty.toLocaleString()} pcs</div>
                                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Staged & Verified</div>
                                  </div>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                                  * Raw material issue posted under inventory ledger automatically upon first press stroke.
                                </div>
                              </div>
                            </div>

                            {/* Right: 6-Stage Manufacturing Routing */}
                            <div style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '12px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Cpu size={14} />
                                IATF 16949 Operation Routing Flow
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '11px' }}>
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
                                      backgroundColor: step.status === 'Done' || step.status === 'Certified' ? '#ecfdf5' : (step.status === 'Active' ? '#fef3c7' : '#f8fafc'),
                                      border: `1px solid ${step.status === 'Done' || step.status === 'Certified' ? '#a7f3d0' : (step.status === 'Active' ? '#fde68a' : '#e2e8f0')}`
                                    }}
                                  >
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{step.op}</div>
                                    <div style={{ color: '#475569', marginTop: '1px' }}>{step.title}</div>
                                    <div style={{
                                      fontWeight: 700,
                                      fontSize: '10px',
                                      marginTop: '2px',
                                      color: step.status === 'Done' || step.status === 'Certified' ? '#065f46' : (step.status === 'Active' ? '#92400e' : '#64748b')
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
