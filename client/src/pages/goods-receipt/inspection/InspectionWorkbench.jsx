import React, { useState, useEffect } from 'react';
import { 
  Microscope, CheckCircle2, AlertTriangle, Clock, 
  Search, ShieldAlert, Check, FileText, ArrowRight, 
  Printer, UserCheck, Package, RotateCcw, AlertCircle
} from 'lucide-react';
import { notify } from '../../../utils/notify';

const InspectionWorkbench = ({
  inspections = [],
  selectedInspection,
  onSelectInspection,
  onSaveInspection,
  onOpenPrintModal,
  onNavigateToStock,
  saving = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Pending', 'In-Progress', 'Completed', 'Hold-Review'

  // Workbench Form state
  const [activeData, setActiveData] = useState({});

  useEffect(() => {
    if (selectedInspection) {
      setActiveData({
        ...selectedInspection,
        acceptedQuantity: selectedInspection.acceptedQuantity || 0,
        rejectedQuantity: selectedInspection.rejectedQuantity || 0,
        holdQuantity: selectedInspection.holdQuantity || 0,
        inspectorName: selectedInspection.inspectorName === 'Unassigned' ? '' : (selectedInspection.inspectorName || 'RQA Inspector 1'),
        inspectionStatus: selectedInspection.inspectionStatus || 'Pending',
        defectCategory: selectedInspection.defectCategory || 'None',
        aqlStandard: selectedInspection.aqlStandard || 'MIL-STD-105E Level II (AQL 0.65)',
        sampleSize: selectedInspection.sampleSize || Math.min(125, selectedInspection.inspectedQuantity || 50),
        remarks: selectedInspection.remarks || ''
      });
    }
  }, [selectedInspection]);

  // Filter queue
  const filteredQueue = inspections.filter(item => {
    const inspNo = item.inspectionNumber?.toLowerCase() || '';
    const grnNo = item.grnId?.grnNumber?.toLowerCase() || '';
    const matName = item.grnId?.materialId?.name?.toLowerCase() || '';
    const vendorName = item.grnId?.vendorId?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || 
      inspNo.includes(search) || 
      grnNo.includes(search) || 
      matName.includes(search) || 
      vendorName.includes(search);

    if (!matchesSearch) return false;

    if (statusFilter === 'Pending') return item.inspectionStatus === 'Pending';
    if (statusFilter === 'In-Progress') return item.inspectionStatus === 'In-Progress';
    if (statusFilter === 'Completed') return item.inspectionStatus === 'Completed';
    if (statusFilter === 'Hold-Review') return item.inspectionStatus === 'Hold-Review';

    return true;
  });

  // Auto-select first item if none selected
  if (!selectedInspection && filteredQueue.length > 0) {
    onSelectInspection(filteredQueue[0]);
  }

  const grn = activeData.grnId || {};
  const vendor = grn.vendorId || {};
  const material = grn.materialId || {};

  const totalLot = activeData.inspectedQuantity || 0;
  const good = Number(activeData.acceptedQuantity) || 0;
  const bad = Number(activeData.rejectedQuantity) || 0;
  const hold = Number(activeData.holdQuantity) || 0;

  const currentSum = good + bad + hold;
  const isBalanced = currentSum === totalLot;
  const balanceDelta = totalLot - currentSum;

  const goodPct = totalLot > 0 ? Math.round((good / totalLot) * 100) : 0;
  const badPpm = totalLot > 0 ? Math.round((bad / totalLot) * 1000000) : 0;

  // Preset Handlers
  const handlePresetFullPass = () => {
    setActiveData(prev => ({
      ...prev,
      acceptedQuantity: totalLot,
      rejectedQuantity: 0,
      holdQuantity: 0,
      defectCategory: 'None',
      inspectionStatus: 'Completed',
      remarks: prev.remarks || '100% Visual and dimensional check passed without non-conformance.'
    }));
  };

  const handlePresetQuarantine = () => {
    setActiveData(prev => ({
      ...prev,
      acceptedQuantity: 0,
      rejectedQuantity: 0,
      holdQuantity: totalLot,
      inspectionStatus: 'Hold-Review',
      remarks: prev.remarks || 'Material lot quarantined pending concession / metallurgical laboratory report.'
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeData.inspectionStatus === 'Completed' && !isBalanced) {
      notify.error(`The numbers do not balance. Good (${good}) + Bad (${bad}) + Hold (${hold}) = ${currentSum}, but lot size is ${totalLot}. Balance the counts before marking Completed.`);
      return;
    }
    onSaveInspection(activeData);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
      minWidth: 0
    }}>
      {/* ── LEFT PANEL: INWARD LOTS QUEUE (340px sticky) ───────────────────────── */}
      <div style={{
        width: '330px',
        flexShrink: 0,
        position: 'sticky',
        top: '8px',
        maxHeight: 'calc(100vh - 140px)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Header & Filter Controls */}
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-canvas)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Inward QA Job Queue
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '10px',
              background: 'rgba(5, 150, 105, 0.1)',
              color: '#059669'
            }}>
              {filteredQueue.length} tickets
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={13} color="var(--text-secondary)" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search QI#, GRN, material, supplier..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px 5px 28px',
                fontSize: '11px',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'All', label: 'All Jobs' },
              { id: 'Pending', label: 'Pending' },
              { id: 'In-Progress', label: 'In Test' },
              { id: 'Completed', label: 'Cleared' },
              { id: 'Hold-Review', label: 'On Hold' }
            ].map(f => {
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: active ? 700 : 500,
                    borderRadius: '12px',
                    border: active ? '1px solid #059669' : '1px solid var(--border-color)',
                    background: active ? 'rgba(5, 150, 105, 0.12)' : 'var(--surface-card)',
                    color: active ? '#059669' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Lots Queue */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredQueue.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
              No inspection tickets match current filter.
            </div>
          ) : (
            filteredQueue.map(item => {
              const isSelected = activeData._id === item._id;
              const g = item.grnId || {};
              const v = g.vendorId || {};
              const m = g.materialId || {};

              let statusBg = 'rgba(245, 158, 11, 0.1)';
              let statusColor = '#d97706';
              let statusLabel = 'Pending QA';

              if (item.inspectionStatus === 'In-Progress') {
                statusBg = 'rgba(2, 132, 199, 0.1)';
                statusColor = '#0284c7';
                statusLabel = 'In Test';
              } else if (item.inspectionStatus === 'Completed') {
                statusBg = 'rgba(16, 185, 129, 0.1)';
                statusColor = '#059669';
                statusLabel = 'Cleared';
              } else if (item.inspectionStatus === 'Hold-Review') {
                statusBg = 'rgba(239, 68, 68, 0.1)';
                statusColor = '#dc2626';
                statusLabel = 'On Hold';
              }

              return (
                <div
                  key={item._id}
                  onClick={() => onSelectInspection(item)}
                  style={{
                    padding: '10px 12px',
                    marginBottom: '6px',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--surface-canvas)' : 'transparent',
                    border: isSelected ? '1px solid #059669' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.12s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                      {item.inspectionNumber}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: statusBg,
                      color: statusColor
                    }}>
                      {statusLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {m.name || 'Raw Material Lot'}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {v.name || 'Supplier'} • GRN: <strong>{g.grnNumber || 'N/A'}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Lot: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.inspectedQuantity || 0} units</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', fontSize: '10px' }}>
                      {item.acceptedQuantity > 0 && (
                        <span style={{ color: '#059669', fontWeight: 600 }}>+{item.acceptedQuantity} Good</span>
                      )}
                      {item.rejectedQuantity > 0 && (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>-{item.rejectedQuantity} Bad</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: ACTIVE QA TEST BENCH ───────────────────── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {activeData._id ? (
          <>
            {/* Workbench Top Bar */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--surface-canvas)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '6px',
                  background: 'rgba(5, 150, 105, 0.1)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                  flexShrink: 0
                }}>
                  <Microscope size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {activeData.inspectionNumber}
                    </h2>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: activeData.inspectionStatus === 'Completed' ? 'rgba(16, 185, 129, 0.1)' :
                                  activeData.inspectionStatus === 'Hold-Review' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: activeData.inspectionStatus === 'Completed' ? '#059669' :
                             activeData.inspectionStatus === 'Hold-Review' ? '#dc2626' : '#d97706'
                    }}>
                      Stage: {activeData.inspectionStatus}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Against GRN: <strong>{grn.grnNumber || 'N/A'}</strong> • PO: <strong>{grn.purchaseOrderId?.poNumber || 'PO-CONTRACT'}</strong> • Supplier: <strong>{vendor.name || 'Vendor'}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onOpenPrintModal(activeData)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={13} />
                  <span>Release Certificate</span>
                </button>

                {activeData.inspectionStatus === 'Completed' && (
                  <button
                    type="button"
                    onClick={onNavigateToStock}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                    }}
                  >
                    <Package size={13} />
                    <span>Move Into Stock</span>
                  </button>
                )}
              </div>
            </div>

            {/* Test Bench Form Body */}
            <form 
              onSubmit={handleSubmit}
              style={{
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* 1. Lot Metadata & Material Overview Strip */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block', textTransform: 'uppercase' }}>Material Description</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{material.name || 'Raw Material Coil / Sheet'}</strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Code: {material.code || 'MAT-001'}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block', textTransform: 'uppercase' }}>Supplier Partner</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{vendor.name || 'Supplier'}</strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>GSTIN: {vendor.gstin || '06AABCT1332L1Z4'}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block', textTransform: 'uppercase' }}>Truck & Gate Pass</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{grn.vehicleNumber || 'HR-55-AT-4821'}</strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Pass: {grn.gatePassNo || 'GP-VERIFIED'}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block', textTransform: 'uppercase' }}>Inspection Standard</span>
                  <strong style={{ color: '#059669' }}>{activeData.aqlStandard || 'MIL-STD-105E (AQL 0.65)'}</strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Sample: {activeData.sampleSize || 125} pcs</div>
                </div>
              </div>

              {/* 2. Tri-Disposition Testing Gauges (Good / Bad / Hold) */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Tri-Disposition Disposition Meter (Lot Size: {totalLot.toLocaleString()} units)
                  </div>

                  {/* Preset Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handlePresetFullPass}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#059669',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      100% Pass (Zero Defect)
                    </button>

                    <button
                      type="button"
                      onClick={handlePresetQuarantine}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#dc2626',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Quarantine Entire Lot
                    </button>
                  </div>
                </div>

                {/* 3 Interactive Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                  {/* Accepted (Good) */}
                  <div style={{
                    background: 'var(--surface-card)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} />
                      <span>1. Accepted (Good Stock) *</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={totalLot}
                      value={activeData.acceptedQuantity ?? 0}
                      onChange={e => setActiveData({ ...activeData, acceptedQuantity: Math.max(0, parseInt(e.target.value) || 0) })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '15px',
                        fontWeight: 700,
                        background: 'var(--surface-canvas)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: '#059669',
                        outline: 'none'
                      }}
                    />
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Conforms to spec • Eligible for store posting ({goodPct}%)
                    </div>
                  </div>

                  {/* Rejected (Bad) */}
                  <div style={{
                    background: 'var(--surface-card)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={13} />
                      <span>2. Rejected (Defective) *</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={totalLot}
                      value={activeData.rejectedQuantity ?? 0}
                      onChange={e => setActiveData({ ...activeData, rejectedQuantity: Math.max(0, parseInt(e.target.value) || 0) })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '15px',
                        fontWeight: 700,
                        background: 'var(--surface-canvas)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: bad > 0 ? '#dc2626' : 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Non-conforming parts • {badPpm.toLocaleString()} PPM rate
                    </div>
                  </div>

                  {/* On Hold */}
                  <div style={{
                    background: 'var(--surface-card)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      <span>3. On Hold (Quarantine) *</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={totalLot}
                      value={activeData.holdQuantity ?? 0}
                      onChange={e => setActiveData({ ...activeData, holdQuantity: Math.max(0, parseInt(e.target.value) || 0) })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '15px',
                        fontWeight: 700,
                        background: 'var(--surface-canvas)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: hold > 0 ? '#d97706' : 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Borderline deviation • Awaiting concession
                    </div>
                  </div>
                </div>

                {/* Mathematical Balance Bar */}
                <div style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  background: isBalanced ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: isBalanced ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isBalanced ? (
                      <>
                        <CheckCircle2 size={14} color="#059669" />
                        <span style={{ color: '#047857', fontWeight: 600 }}>
                          Sum Balances Perfectly: Good ({good}) + Bad ({bad}) + Hold ({hold}) = {currentSum} / {totalLot} units accounted for.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} color="#dc2626" />
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>
                          Unbalanced Lot Count: Current sum is {currentSum} ({balanceDelta > 0 ? `-${balanceDelta} missing` : `+${Math.abs(balanceDelta)} excess`}). Must equal {totalLot} to complete.
                        </span>
                      </>
                    )}
                  </div>
                  <strong style={{ color: isBalanced ? '#059669' : '#dc2626' }}>
                    {isBalanced ? '100% Balanced' : 'Action Required'}
                  </strong>
                </div>
              </div>

              {/* 3. Automotive Defect Categorization & Inspector Sign-off Grid */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                fontSize: '11px'
              }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Defect Classification
                  </label>
                  <select
                    value={activeData.defectCategory || 'None'}
                    onChange={e => setActiveData({ ...activeData, defectCategory: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      fontSize: '11px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="None">None (Zero Defect)</option>
                    <option value="Dimensional Variation">Dimensional / Thickness Out of Tolerance</option>
                    <option value="Surface Rust / Oxidation">Surface Rust / Pitting / Scratches</option>
                    <option value="Burr / Sharp Edges">Burr / Sharp Flash on Edges</option>
                    <option value="Hardness Out of Spec">Hardness / Tensile Spec Breach</option>
                    <option value="Thread / Pitch Flaw">Thread / Pitch Flaw</option>
                    <option value="Packaging Rupture">Packaging Moisture / Seal Rupture</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Certified Inspector Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar (RQA-1)"
                    value={activeData.inspectorName || ''}
                    onChange={e => setActiveData({ ...activeData, inspectorName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      fontSize: '11px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Quality Disposition Stage *
                  </label>
                  <select
                    value={activeData.inspectionStatus || 'Pending'}
                    onChange={e => setActiveData({ ...activeData, inspectionStatus: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      fontSize: '11px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Pending">Pending — Waiting for QA testing</option>
                    <option value="In-Progress">In-Progress — Laboratory test active</option>
                    <option value="Completed">Completed — Cleared (Ready for Store)</option>
                    <option value="Hold-Review">Hold-Review — Concession Review Required</option>
                  </select>
                </div>
              </div>

              {/* 4. Laboratory Remarks / Concession Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Laboratory Remarks & Root Cause Observations:
                </label>
                <textarea
                  rows={2}
                  placeholder="Record micrometer/CMM readings, surface roughness, heat number, or reason for scrap/hold..."
                  value={activeData.remarks || ''}
                  onChange={e => setActiveData({ ...activeData, remarks: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '11px',
                    background: 'var(--surface-canvas)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              {/* 5. Submit Action Strip */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-color)',
                marginTop: 'auto'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Clearance grants inventory authorization. Rejected units trigger supplier rejection debit note.
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '7px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>{saving ? 'Saving Result...' : 'Save Inspection Result'}</span>
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '12px' }}>
            Select an inspection job from the queue to start testing.
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionWorkbench;
