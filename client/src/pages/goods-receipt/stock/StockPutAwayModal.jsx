import React, { useState, useEffect } from 'react';
import { 
  X, Warehouse, PackagePlus, CheckCircle2, AlertTriangle, 
  Barcode, MapPin, Hash, FileText, ArrowRight, ShieldCheck,
  Check, Sparkles, Box, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { notify } from '../../../utils/notify';

const StockPutAwayModal = ({
  isOpen,
  onClose,
  completedInspections = [],
  warehouses = [],
  preselectedLot = null,
  onSave,
  saving = false
}) => {
  const navigate = useNavigate();

  // Mode: 'inspection' (QA Cleared Lot) or 'direct' (Direct Spot / Stock Take)
  const [inductionMode, setInductionMode] = useState(
    completedInspections.length > 0 || preselectedLot ? 'inspection' : 'direct'
  );

  // Form State
  const [formData, setFormData] = useState({
    inspectionId: '',
    materialId: '',
    quantity: '',
    warehouseId: '',
    binLocation: 'Rack A1 - Bin 02',
    supplierBatchNo: '',
    notes: ''
  });

  const [materials, setMaterials] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);

  // Fetch materials for direct induction mode if needed
  useEffect(() => {
    if (isOpen) {
      axios.get('/materials?limit=100')
        .then(res => setMaterials(res.data.data || []))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const defaultWh = warehouses.length > 0 ? warehouses[0]._id : '';

      if (preselectedLot) {
        setInductionMode('inspection');
        setSelectedLot(preselectedLot);
        setFormData({
          inspectionId: preselectedLot._id,
          materialId: preselectedLot.grnId?.materialId?._id || '',
          quantity: preselectedLot.acceptedQuantity || preselectedLot.inspectedQuantity || '',
          warehouseId: defaultWh,
          binLocation: 'Rack A1 - Bay 02',
          supplierBatchNo: preselectedLot.grnId?.challanNumber || '',
          notes: ''
        });
      } else if (completedInspections.length > 0) {
        setInductionMode('inspection');
        const first = completedInspections[0];
        setSelectedLot(first);
        setFormData({
          inspectionId: first._id,
          materialId: first.grnId?.materialId?._id || '',
          quantity: first.acceptedQuantity || first.inspectedQuantity || '',
          warehouseId: defaultWh,
          binLocation: 'Rack A1 - Bay 02',
          supplierBatchNo: first.grnId?.challanNumber || '',
          notes: ''
        });
      } else {
        setInductionMode('direct');
        setSelectedLot(null);
        setFormData({
          inspectionId: '',
          materialId: materials.length > 0 ? materials[0]._id : '',
          quantity: '500',
          warehouseId: defaultWh,
          binLocation: 'Floor Bay 01',
          supplierBatchNo: 'SPOT-HEAT-2026',
          notes: 'Direct store induction'
        });
      }
    }
  }, [isOpen, preselectedLot, completedInspections, warehouses]);

  if (!isOpen) return null;

  const handleSelectLot = (lot) => {
    setSelectedLot(lot);
    setFormData(prev => ({
      ...prev,
      inspectionId: lot._id,
      materialId: lot.grnId?.materialId?._id || '',
      quantity: lot.acceptedQuantity || lot.inspectedQuantity || '',
      supplierBatchNo: lot.grnId?.challanNumber || prev.supplierBatchNo
    }));
  };

  const handleWarehouseSelect = (whId) => {
    setFormData(prev => ({ ...prev, warehouseId: whId }));
  };

  const handleQuickBin = (bin) => {
    setFormData(prev => ({ ...prev, binLocation: bin }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inductionMode === 'inspection') {
      if (!formData.inspectionId) {
        notify.error('Please select an approved quality inspection lot to induct.');
        return;
      }
    } else {
      if (!formData.materialId) {
        notify.error('Please select a material to induct.');
        return;
      }
      if (!formData.quantity || Number(formData.quantity) <= 0) {
        notify.error('Please enter a valid stock quantity.');
        return;
      }
    }

    if (!formData.warehouseId) {
      notify.error('Please select a destination warehouse store.');
      return;
    }

    onSave({
      ...formData,
      quantity: Number(formData.quantity)
    });
  };

  // Resolved display info
  const activeMaterial = inductionMode === 'inspection' 
    ? (selectedLot?.grnId?.materialId || {})
    : (materials.find(m => m._id === formData.materialId) || {});

  const matName = activeMaterial.name || selectedLot?.materialName || 'Inward Automotive Material';
  const matCode = activeMaterial.code || 'RAW-001';
  const matUom = activeMaterial.uom || 'units';
  const displayQty = inductionMode === 'inspection' 
    ? (selectedLot?.acceptedQuantity || selectedLot?.inspectedQuantity || 0)
    : (Number(formData.quantity) || 0);

  const selectedWarehouse = warehouses.find(w => w._id === formData.warehouseId) || warehouses[0] || {};

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '94vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        color: '#1e293b'
      }}>
        {/* ── Terminal Header ─────────────────────────────────────────── */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0f172a',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
            }}>
              <Warehouse size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Store Put-Away & Bin Induction
                </h2>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  background: 'rgba(2, 132, 199, 0.25)',
                  border: '1px solid rgba(2, 132, 199, 0.4)',
                  color: '#38bdf8',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  TERMINAL BAY 01
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                Book material into inventory bins, generate traceability batch tags, and capitalize ledger
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Mode Switcher Tab Ribbon ─────────────────────────────────── */}
        <div style={{
          display: 'flex',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '4px 16px',
          gap: '8px'
        }}>
          <button
            type="button"
            onClick={() => setInductionMode('inspection')}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: inductionMode === 'inspection' ? 700 : 500,
              background: inductionMode === 'inspection' ? '#ffffff' : 'transparent',
              color: inductionMode === 'inspection' ? '#0284c7' : '#64748b',
              border: inductionMode === 'inspection' ? '1px solid #cbd5e1' : 'none',
              borderBottom: inductionMode === 'inspection' ? '2px solid #0284c7' : 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={14} color={inductionMode === 'inspection' ? '#0284c7' : '#94a3b8'} />
            <span>QA-Cleared Inward Lots</span>
            {completedInspections.length > 0 && (
              <span style={{
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '1px 6px'
              }}>
                {completedInspections.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setInductionMode('direct')}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: inductionMode === 'direct' ? 700 : 500,
              background: inductionMode === 'direct' ? '#ffffff' : 'transparent',
              color: inductionMode === 'direct' ? '#0284c7' : '#64748b',
              border: inductionMode === 'direct' ? '1px solid #cbd5e1' : 'none',
              borderBottom: inductionMode === 'direct' ? '2px solid #0284c7' : 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} color={inductionMode === 'direct' ? '#0284c7' : '#94a3b8'} />
            <span>Direct Store Induction (Spot Material / Stock Take)</span>
          </button>
        </div>

        {/* ── Scrollable Modal Form Body ──────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{
          padding: '12px 18px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* 1. Inward Consignment Selection */}
          {inductionMode === 'inspection' ? (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                1. Select QA-Cleared Inward Consignment *
              </div>

              {completedInspections.length === 0 ? (
                <div style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    No Pending Inspection Lots in Staging Transit
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', maxWidth: '420px', margin: '4px auto 10px auto' }}>
                    All previous received consignments have already been put away into store bins. You can switch to Direct Store Induction or pass an inspection first.
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setInductionMode('direct')}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Use Direct Store Induction
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/receipt/inspection');
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '5px',
                        color: '#0f172a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Go to Inspect Received Goods</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {completedInspections.map(lot => {
                    const isSelected = formData.inspectionId === lot._id;
                    const lNum = lot.inspectionNumber || `QI-${lot._id.slice(-6)}`;
                    const lMat = lot.grnId?.materialId?.name || lot.materialName || 'Material';
                    const lCode = lot.grnId?.materialId?.code || 'RAW-001';
                    const lQty = lot.acceptedQuantity || lot.inspectedQuantity || 0;
                    const lVendor = lot.grnId?.vendorId?.name || 'Direct Supplier';
                    const lGrn = lot.grnId?.grnNumber || 'GRN-INWARD';

                    return (
                      <div
                        key={lot._id}
                        onClick={() => handleSelectLot(lot)}
                        style={{
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: '7px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.1s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isSelected ? '5px solid #0284c7' : '2px solid #cbd5e1',
                            background: '#ffffff'
                          }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                              {lMat}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {lNum} • Part: <strong style={{ fontFamily: 'monospace' }}>{lCode}</strong> • {lVendor} • {lGrn}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#047857' }}>
                            {lQty.toLocaleString()} units
                          </span>
                          <span style={{
                            display: 'block',
                            fontSize: '9px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: '#059669'
                          }}>
                            QA Cleared
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Direct Induction Material Selector */
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '12px'
            }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Select Material from Master *
                </label>
                <select
                  value={formData.materialId}
                  onChange={(e) => setFormData(prev => ({ ...prev, materialId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#0f172a',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Choose material...</option>
                  {materials.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.code}) — {m.category || 'Raw'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Induction Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="e.g. 500"
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#0f172a',
                    outline: 'none',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>
          )}

          {/* 2. Visual Warehouse Store Selector Tiles */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
              2. Destination Warehouse Store *
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '8px'
            }}>
              {warehouses.map(w => {
                const isSelected = formData.warehouseId === w._id;
                return (
                  <div
                    key={w._id}
                    onClick={() => handleWarehouseSelect(w._id)}
                    style={{
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      transition: 'border-color 0.1s ease',
                      boxShadow: isSelected ? '0 1px 3px rgba(2, 132, 199, 0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Warehouse size={13} color={isSelected ? '#0284c7' : '#64748b'} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#0369a1' : '#0f172a' }}>
                          {w.name}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 size={13} color="#0284c7" />}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      {w.type || 'General'} • {w.location || 'Plant Floor'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Bin Location & Supplier Traceability */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Bin Rack Picker */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Bin / Rack Coordinates
              </label>
              <input
                type="text"
                placeholder="e.g. Rack A2, Bin 04, Floor Bay 1"
                value={formData.binLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, binLocation: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#0f172a',
                  outline: 'none',
                  marginBottom: '6px'
                }}
              />
              {/* Quick Bin Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {['Rack A1 - Bay 02', 'Rack B2 - Shelf 1', 'Heavy Coil Staging', 'Floor Pallet P-04'].map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickBin(chip)}
                    style={{
                      fontSize: '9px',
                      fontWeight: 500,
                      background: formData.binLocation === chip ? '#e0f2fe' : '#f1f5f9',
                      color: formData.binLocation === chip ? '#0369a1' : '#475569',
                      border: formData.binLocation === chip ? '1px solid #38bdf8' : '1px solid #e2e8f0',
                      borderRadius: '3px',
                      padding: '2px 5px',
                      cursor: 'pointer'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Supplier Heat / Batch # */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Supplier Heat / Coil / Batch #
              </label>
              <input
                type="text"
                placeholder="e.g. HEAT-9942, COIL-008"
                value={formData.supplierBatchNo}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierBatchNo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#0f172a',
                  outline: 'none',
                  marginBottom: '6px'
                }}
              />
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                Recorded on warehouse bin passport for IATF 16949 audit trail.
              </div>
            </div>
          </div>

          {/* 4. Live Pallet / Bin Thermal Barcode Tag Simulation */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px 12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Automotive Pallet Tag • Real-Time Simulation
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#0284c7' }}>
                Auto-Generated Batch
              </span>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '5px',
              padding: '6px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', height: '18px', gap: '2px', alignItems: 'flex-end', marginBottom: '2px' }}>
                  {[3, 1, 4, 2, 2, 5, 2, 3, 4, 1, 3, 4, 2, 3, 5, 2, 4, 1, 3, 4].map((w, i) => (
                    <div key={i} style={{ width: `${w}px`, height: '100%', backgroundColor: '#0f172a' }} />
                  ))}
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>
                  BATCH-2026-AUTO
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px' }}>
                  {matName} • <span style={{ fontFamily: 'monospace' }}>{matCode}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#047857' }}>
                  {displayQty.toLocaleString()} {matUom}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#0284c7' }}>
                  {selectedWarehouse.name || 'Store Rack'}
                </div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>
                  {formData.binLocation || 'Bin Unassigned'}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Action Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            paddingTop: '6px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 500,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || (inductionMode === 'inspection' && !formData.inspectionId)}
              style={{
                padding: '8px 22px',
                fontSize: '12px',
                fontWeight: 700,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: saving || (inductionMode === 'inspection' && !formData.inspectionId) ? 'not-allowed' : 'pointer',
                opacity: saving || (inductionMode === 'inspection' && !formData.inspectionId) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
              }}
            >
              <PackagePlus size={15} />
              <span>{saving ? 'Inducting Material...' : 'Confirm Put-Away & Book to Store'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockPutAwayModal;
