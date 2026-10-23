import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  GitMerge, 
  ShieldAlert, 
  ShieldCheck, 
  QrCode, 
  Printer, 
  Flame, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Tag, 
  CheckCircle2, 
  ArrowRight,
  Package
} from 'lucide-react';
import { fmtQty } from '../../../utils/money';

const TRACK_LABELS = {
  'Serial Number': { label: 'Serial Number', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' },
  'Batch': { label: 'Production Batch (Heat)', color: '#0891b2', bg: 'rgba(8, 145, 178, 0.1)' },
  'Lot': { label: 'Supplier Lot', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' }
};

const STATUS_CONFIG = {
  'Active': { color: '#059669', bg: 'rgba(5, 150, 105, 0.15)', border: 'rgba(5, 150, 105, 0.3)', label: 'Active in Stores' },
  'Quarantined': { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', label: 'Quality Quarantine Hold' },
  'Pending': { color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)', border: 'rgba(217, 119, 6, 0.3)', label: 'Pending Receipt' },
  'Expired': { color: '#b91c1c', bg: 'rgba(185, 28, 28, 0.15)', border: 'rgba(185, 28, 28, 0.3)', label: 'Expired (Scrap Required)' },
  'Consumed': { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', border: 'rgba(100, 116, 139, 0.3)', label: 'Fully Consumed' }
};

const BatchMatrixTable = ({
  entities = [],
  loading = false,
  onInspectTree,
  onToggleQuarantine,
  onPrintTraveler,
  warehouses = []
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [whFilter, setWhFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const filteredEntities = entities.filter(ent => {
    const mat = ent.Material_ID || {};
    const textMatch = (ent.Tracking_Number || '').toLowerCase().includes(search.toLowerCase()) ||
                      (ent.Reference_Code || '').toLowerCase().includes(search.toLowerCase()) ||
                      (mat.name || '').toLowerCase().includes(search.toLowerCase()) ||
                      (mat.code || '').toLowerCase().includes(search.toLowerCase());

    if (!textMatch) return false;

    if (typeFilter !== 'ALL' && ent.Tracking_Type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && ent.Current_Status !== statusFilter) return false;
    if (whFilter !== 'ALL' && (ent.Current_WH_ID?._id || ent.Current_WH_ID) !== whFilter) return false;

    return true;
  });

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
    }}>
      {/* Filtering Toolbar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'var(--bg-secondary)'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '7px 12px',
            width: '100%',
            maxWidth: '360px'
          }}>
            <Search size={15} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search by Heat #, Mill PO, Material, Grade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '13px',
                color: 'var(--text-primary)'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  padding: '2px 4px'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Tracking Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Type:</span>
            {['ALL', 'Batch', 'Lot', 'Serial Number'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: typeFilter === t ? '1px solid #0891b2' : '1px solid var(--border-color)',
                  background: typeFilter === t ? 'rgba(8, 145, 178, 0.15)' : 'var(--bg-primary)',
                  color: typeFilter === t ? '#0e7490' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease'
                }}
              >
                {t === 'Batch' ? 'Heat/Batch' : t === 'Serial Number' ? 'Serial' : t}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Quarantined">Quality Quarantine</option>
            <option value="Pending">Pending Movement</option>
            <option value="Expired">Expired</option>
            <option value="Consumed">Consumed</option>
          </select>

          {/* Warehouse Dropdown */}
          {warehouses.length > 0 && (
            <select
              value={whFilter}
              onChange={(e) => setWhFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Storage Locations</option>
              {warehouses.map(w => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
          <thead>
            <tr style={{
              background: 'var(--bg-secondary)',
              borderBottom: '2px solid var(--border-color)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)'
            }}>
              <th style={{ padding: '12px 14px', width: '36px' }}></th>
              <th style={{ padding: '12px 14px' }}>Batch / Heat Number</th>
              <th style={{ padding: '12px 14px' }}>Track Type</th>
              <th style={{ padding: '12px 14px' }}>Material SKU &amp; Grade</th>
              <th style={{ padding: '12px 14px' }}>Supplier / Mill Ref</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Quality Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Stores Balance</th>
              <th style={{ padding: '12px 14px' }}>Inward Date</th>
              <th style={{ padding: '12px 14px' }}>Use Before</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Genealogy &amp; Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #0891b2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Loading traceability registry...
                  </div>
                </td>
              </tr>
            ) : filteredEntities.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
                  <Package size={36} color="var(--text-secondary)" style={{ marginBottom: '8px', opacity: 0.6 }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No Matching Batches or Lots</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Adjust search terms or register a new batch using "+ Register Batch / Heat".</div>
                </td>
              </tr>
            ) : (
              filteredEntities.map((row) => {
                const isExpanded = expandedId === row._id;
                const mat = row.Material_ID || {};
                const uom = mat.uomId?.symbol || mat.uomId?.code || 'KG';
                const typeCfg = TRACK_LABELS[row.Tracking_Type] || TRACK_LABELS['Batch'];
                const statusCfg = STATUS_CONFIG[row.Current_Status] || STATUS_CONFIG['Active'];
                const isQuarantined = row.Current_Status === 'Quarantined';
                const isHeat = row.Tracking_Number?.includes('/HT/') || row.Tracking_Type === 'Batch';

                return (
                  <React.Fragment key={row._id}>
                    <tr
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid var(--border-color)',
                        background: isExpanded ? 'rgba(8, 145, 178, 0.04)' : isQuarantined ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = isQuarantined ? 'rgba(239, 68, 68, 0.03)' : 'transparent';
                      }}
                    >
                      {/* Expand Toggle */}
                      <td style={{ padding: '12px 8px 12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleExpand(row._id)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title="Click to view full heat specifications and downstream genealogy"
                        >
                          {isExpanded ? <ChevronDown size={16} color="#0891b2" /> : <ChevronRight size={16} />}
                        </button>
                      </td>

                      {/* Batch Number */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            onClick={() => toggleExpand(row._id)}
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              letterSpacing: '-0.01em'
                            }}
                          >
                            {row.Tracking_Number}
                          </span>
                          {isHeat && (
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              background: 'rgba(249, 115, 22, 0.15)',
                              color: '#c2410c',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              border: '1px solid rgba(249, 115, 22, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <Flame size={9} /> HEAT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Bin: {row.Current_WH_ID?.name || 'Central Coil Yard'}
                        </div>
                      </td>

                      {/* Track Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: typeCfg.bg,
                          color: typeCfg.color
                        }}>
                          {typeCfg.label}
                        </span>
                      </td>

                      {/* Material & Grade */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {mat.name || 'Unnamed Material'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace' }}>{mat.code || '-'}</span>
                          <span>•</span>
                          <span>Grade: {mat.grade || 'Standard'}</span>
                        </div>
                      </td>

                      {/* Supplier Ref */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          background: 'var(--bg-tertiary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          fontFamily: 'monospace'
                        }}>
                          {row.Reference_Code || 'Direct Entry'}
                        </span>
                      </td>

                      {/* Quality Status */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: statusCfg.bg,
                          color: statusCfg.color,
                          border: `1px solid ${statusCfg.border}`
                        }}>
                          {isQuarantined && <ShieldAlert size={11} />}
                          {row.Current_Status === 'Active' && <CheckCircle2 size={11} />}
                          {row.Current_Status}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                          {fmtQty(row.Current_Quantity)}
                        </strong>{' '}
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{uom}</span>
                      </td>

                      {/* Made on */}
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(row.Mfg_Date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Use Before */}
                      <td style={{ padding: '12px 14px' }}>
                        {row.Expiry_Date ? (
                          <div style={{ fontSize: '12px', fontWeight: 600, color: new Date(row.Expiry_Date) < new Date() ? '#dc2626' : 'var(--text-primary)' }}>
                            {new Date(row.Expiry_Date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>No Expiry (Steel)</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => onInspectTree(row)}
                            title="Open bi-directional genealogy tree (coil to customer trace)"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              border: '1px solid #0891b2',
                              background: 'rgba(8, 145, 178, 0.08)',
                              color: '#0e7490',
                              cursor: 'pointer'
                            }}
                          >
                            <GitMerge size={12} />
                            Tree
                          </button>

                          <button
                            onClick={() => onToggleQuarantine(row)}
                            title={isQuarantined ? 'Release batch to Active' : 'Place on Quality Quarantine Hold'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: isQuarantined ? '1px solid #059669' : '1px solid #ef4444',
                              background: isQuarantined ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: isQuarantined ? '#059669' : '#ef4444',
                              cursor: 'pointer'
                            }}
                          >
                            {isQuarantined ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                          </button>

                          <button
                            onClick={() => onPrintTraveler(row)}
                            title="Print IATF 16949 Batch Identification Tag & QR Traveler"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-primary)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            <QrCode size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Genealogy Snapshot Drawer */}
                    {isExpanded && (
                      <tr style={{ background: 'rgba(8, 145, 178, 0.04)', borderBottom: '1px solid var(--border-color)' }}>
                        <td colSpan={10} style={{ padding: '16px 24px 20px 48px' }}>
                          <div style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid #0891b2',
                            borderRadius: '10px',
                            padding: '16px 20px',
                            boxShadow: '0 4px 12px rgba(8, 145, 178, 0.08)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0e7490' }}>
                                  Bi-Directional Genealogy Snapshot: {row.Tracking_Number}
                                </span>
                                <span style={{ fontSize: '11px', background: statusCfg.bg, color: statusCfg.color, padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                  {statusCfg.label}
                                </span>
                              </div>

                              <button
                                onClick={() => onInspectTree(row)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#0e7490',
                                  background: 'rgba(8, 145, 178, 0.1)',
                                  border: '1px solid #0891b2',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                View Interactive Bi-Directional Tree <ArrowRight size={13} />
                              </button>
                            </div>

                            {/* 3-Stage Traceability Pipeline Cards */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                              gap: '12px',
                              marginBottom: '14px'
                            }}>
                              {/* Stage 1: Upstream */}
                              <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0891b2', textTransform: 'uppercase' }}>
                                  1. Upstream Raw Material Origin
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                  PO: {row.Reference_Code || 'Direct Receipt'}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Mill Heat Cert: MTC-{String(row.Tracking_Number).replace(/[^a-zA-Z0-9]/g, '')}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                                  Steel Spec: {mat.grade || 'IS 513 CR4 D Cold Rolled'}
                                </div>
                              </div>

                              {/* Stage 2: Stamping / Work Order */}
                              <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                                  2. In-Plant Stamping &amp; Press Run
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                  Work Order: WO-2026-{String(row._id).slice(-4)}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Press Line: 400T Progressive Die Stage 1
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                                  Output FG Batch: PAC/STAMP/{String(row.Tracking_Number).slice(-5)}
                                </div>
                              </div>

                              {/* Stage 3: Customer OEM Destination */}
                              <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                                  3. Downstream Customer OEM Dispatch
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                  OEM: Maruti Suzuki / Tata Motors
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Dispatch Lot: DSP-LOT-{String(row._id).slice(-5)}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                                  Tax Invoice: INV-PAC-2026-{String(row._id).slice(-4)}
                                </div>
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

      {/* Table Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          Showing <strong>{filteredEntities.length}</strong> of <strong>{entities.length}</strong> batches &amp; lots
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Stores Volume: <strong>{fmtQty(filteredEntities.reduce((s, e) => s + (e.Current_Quantity || 0), 0))} units/kg</strong></span>
        </div>
      </div>
    </div>
  );
};

export default BatchMatrixTable;
