import React, { useState, useEffect } from 'react';
import { 
  X, Truck, Package, AlertTriangle, ShieldCheck, 
  Trash2, CheckCircle2, FileText, ArrowRight, Check
} from 'lucide-react';

const GrnFormModal = ({
  isOpen,
  mode = 'create', // 'create' or 'edit'
  initialData = {},
  purchaseOrders = [],
  onClose,
  onSave,
  onDelete,
  saving = false
}) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (mode === 'edit') {
      setFormData({
        _id: initialData._id,
        grnNumber: initialData.grnNumber,
        purchaseOrderId: initialData.purchaseOrderId?._id || initialData.purchaseOrderId,
        poNumber: initialData.purchaseOrderId?.poNumber || 'N/A',
        vendorId: initialData.vendorId?._id || initialData.vendorId,
        vendorName: initialData.vendorId?.name || 'N/A',
        materialId: initialData.materialId?._id || initialData.materialId,
        materialName: initialData.materialId?.name || 'N/A',
        poQuantity: initialData.poQuantity || 0,
        receivedQuantity: initialData.receivedQuantity || 0,
        challanNumber: initialData.challanNumber || '',
        vehicleNumber: initialData.vehicleNumber || '',
        transporterName: initialData.transporterName || '',
        gatePassNo: initialData.gatePassNo || '',
        storageLocation: initialData.storageLocation || 'Dock A - Raw Material Bay',
        packagingCondition: initialData.packagingCondition || 'Good / Intact',
        status: initialData.status || 'Received',
        notes: initialData.notes || ''
      });
    } else {
      // Create mode
      const defaultPo = initialData?.purchaseOrderId ? 
        purchaseOrders.find(p => p._id === (initialData.purchaseOrderId?._id || initialData.purchaseOrderId)) : 
        purchaseOrders[0];

      if (defaultPo) {
        populateFromPo(defaultPo);
      } else {
        setFormData({
          storageLocation: 'Dock A - Raw Material Bay',
          packagingCondition: 'Good / Intact',
          vehicleNumber: 'HR-55-AT-4821',
          challanNumber: `CH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          gatePassNo: `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          transporterName: 'Dedicated Transport Fleet'
        });
      }
    }
  }, [isOpen, mode, initialData, purchaseOrders]);

  const populateFromPo = (po) => {
    const item = (po.items && po.items.length > 0) ? po.items[0] : null;
    const poQty = item ? (item.orderQty || item.quantity || 100) : (po.totalAmount ? 100 : 50);

    setFormData({
      purchaseOrderId: po._id,
      poNumber: po.poNumber,
      vendorId: po.vendorId?._id || po.vendorId,
      vendorName: po.vendorId?.name || 'Vendor',
      materialId: item ? (item.materialId?._id || item.materialId) : '',
      materialName: item?.materialId?.name || (item?.name || 'Raw Material Coil / Steel'),
      poQuantity: poQty,
      receivedQuantity: poQty,
      challanNumber: `CH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleNumber: 'HR-55-AT-4821',
      transporterName: 'VRL Logistics / SafeXpress',
      gatePassNo: `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      storageLocation: 'Dock A - Raw Material Bay',
      packagingCondition: 'Good / Intact',
      notes: ''
    });
  };

  const handlePOChange = (e) => {
    const poId = e.target.value;
    const po = purchaseOrders.find(p => p._id === poId);
    if (po) {
      populateFromPo(po);
    }
  };

  const handleMaterialChange = (e) => {
    const selectedMatId = e.target.value;
    const currentPo = purchaseOrders.find(p => p._id === formData.purchaseOrderId);
    if (currentPo && currentPo.items) {
      const line = currentPo.items.find(i => (i.materialId?._id || i.materialId) === selectedMatId);
      if (line) {
        setFormData(prev => ({
          ...prev,
          materialId: selectedMatId,
          materialName: line.materialId?.name || line.name || prev.materialName,
          poQuantity: line.orderQty || line.quantity || prev.poQuantity,
          receivedQuantity: line.orderQty || line.quantity || prev.receivedQuantity
        }));
      }
    }
  };

  if (!isOpen) return null;

  const poQty = Number(formData.poQuantity) || 0;
  const recQty = Number(formData.receivedQuantity) || 0;
  const isShortSupply = recQty < poQty;
  const isOverReceipt = recQty > poQty && poQty > 0;
  const shortageAmount = poQty - recQty;

  const currentPo = purchaseOrders.find(p => p._id === formData.purchaseOrderId);
  const poItems = currentPo?.items || [];

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '860px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* ── Modal Header (Compact) ────────────────────────────────────────── */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-canvas)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
              flexShrink: 0
            }}>
              <Truck size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {mode === 'create' ? 'Record Gate Inward Delivery (GRN)' : `Correct Goods Receipt: ${formData.grnNumber}`}
                </h2>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7'
                }}>
                  Gate 1 Dock
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Physical material reception, truck verification & automatic inspection job creation
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Form Body (2-Column Grid - No Double Scrollbars!) ───────── */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
          }}
          style={{
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            {/* ── LEFT COLUMN: PO CONTRACT & QUANTITY ───────────────────────── */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Box 1: PO & Material Reference */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  1. Purchase Contract
                </span>

                {mode === 'create' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Select Approved PO:
                    </label>
                    <select
                      required
                      value={formData.purchaseOrderId || ''}
                      onChange={handlePOChange}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" disabled>Choose a purchase order</option>
                      {purchaseOrders.map(po => (
                        <option key={po._id} value={po._id}>
                          {po.poNumber} — {po.vendorId?.name || 'Vendor'}
                        </option>
                      ))}
                    </select>

                    {poItems.length > 1 && (
                      <div style={{ marginTop: '8px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          Select Material Line Item:
                        </label>
                        <select
                          value={formData.materialId || ''}
                          onChange={handleMaterialChange}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            fontSize: '12px',
                            background: 'var(--surface-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {poItems.map((item, idx) => (
                            <option key={item._id || idx} value={item.materialId?._id || item.materialId}>
                              {item.materialId?.name || item.name || 'Material Item'} (Qty: {item.orderQty || item.quantity})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block' }}>PO Number</span>
                      <strong style={{ color: '#0284c7' }}>{formData.poNumber}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block' }}>Supplier</span>
                      <strong>{formData.vendorName}</strong>
                    </div>
                  </div>
                )}

                {formData.materialName && (
                  <div style={{
                    fontSize: '11px',
                    padding: '6px 10px',
                    background: 'var(--surface-card)',
                    borderRadius: '5px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Package size={13} color="#0284c7" />
                    <span>Material: <strong>{formData.materialName}</strong></span>
                  </div>
                )}
              </div>

              {/* Box 2: Quantity & Variance Verification */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  2. Quantity & Variance Verification
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      PO Ordered Qty
                    </label>
                    <input
                      type="number"
                      disabled
                      value={formData.poQuantity || 0}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      Gate Received Qty *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.receivedQuantity || ''}
                      onChange={e => setFormData({ ...formData, receivedQuantity: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: 'var(--surface-card)',
                        border: isOverReceipt ? '1px solid #dc2626' : isShortSupply ? '1px solid #d97706' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Variance Badge */}
                <div style={{
                  padding: '7px 10px',
                  borderRadius: '5px',
                  background: isOverReceipt ? 'rgba(239, 68, 68, 0.1)' : isShortSupply ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: isOverReceipt ? '1px solid rgba(239, 68, 68, 0.25)' : isShortSupply ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px'
                }}>
                  {isOverReceipt ? (
                    <>
                      <AlertTriangle size={13} color="#dc2626" />
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        Over-receipt error: Cannot exceed PO quantity ({poQty}).
                      </span>
                    </>
                  ) : isShortSupply ? (
                    <>
                      <AlertTriangle size={13} color="#d97706" />
                      <span style={{ color: '#b45309', fontWeight: 600 }}>
                        Short delivery: -{shortageAmount} units short of PO contract.
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} color="#059669" />
                      <span style={{ color: '#047857', fontWeight: 600 }}>
                        100% Full Delivery: Matches PO contract perfectly.
                      </span>
                    </>
                  )}
                </div>

                {mode === 'edit' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      Status Stage:
                    </label>
                    <select
                      value={formData.status || 'Received'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '11px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Received">Received — Material at factory gate</option>
                      <option value="Inspecting">Inspecting — Quality Assurance check active</option>
                      <option value="Posted">Posted — Moved into central warehouse</option>
                      <option value="Cancelled">Cancelled — Void receipt</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: GATE LOGISTICS & NOTES ───────────────────────── */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Box 3: Logistics Metadata */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  3. Inward Logistics & Truck Details
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      Challan / Invoice # *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CH-2026-9041"
                      value={formData.challanNumber || ''}
                      onChange={e => setFormData({ ...formData, challanNumber: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
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
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      Vehicle / Truck # *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HR-55-AT-4821"
                      value={formData.vehicleNumber || ''}
                      onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '11px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      Transporter / Carrier
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VRL Logistics"
                      value={formData.transporterName || ''}
                      onChange={e => setFormData({ ...formData, transporterName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
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
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      Gate Pass #
                    </label>
                    <input
                      type="text"
                      value={formData.gatePassNo || ''}
                      onChange={e => setFormData({ ...formData, gatePassNo: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '11px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      Unloading Bay
                    </label>
                    <select
                      value={formData.storageLocation || 'Dock A - Raw Material Bay'}
                      onChange={e => setFormData({ ...formData, storageLocation: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '11px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Dock A - Raw Material Bay">Dock A - Raw Material</option>
                      <option value="Dock B - Coil & Steel Yard">Dock B - Coil Yard</option>
                      <option value="Dock C - Bought-out Parts">Dock C - Bought-out</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      Packaging Check
                    </label>
                    <select
                      value={formData.packagingCondition || 'Good / Intact'}
                      onChange={e => setFormData({ ...formData, packagingCondition: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '11px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Good / Intact">Good / Intact</option>
                      <option value="Damaged Packaging">Damaged</option>
                      <option value="Seal Broken">Seal Broken</option>
                      <option value="Moisture Suspected">Moisture</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Box 4: Storekeeper Notes */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  4. Gate Observations
                </span>
                <textarea
                  rows={2}
                  placeholder="Note package damage, driver remarks, or quarantine instructions..."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '11px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Notice & Form Footer Actions ─────────────────────────────────── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={14} color="#0284c7" />
              <span>Saves gate receipt and automatically queues an RQA inspection job.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(formData);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#dc2626',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  background: 'var(--surface-canvas)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || isOverReceipt}
                style={{
                  padding: '6px 18px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: isOverReceipt ? 'var(--surface-canvas)' : '#0284c7',
                  color: isOverReceipt ? 'var(--text-secondary)' : '#ffffff',
                  border: isOverReceipt ? '1px solid var(--border-color)' : 'none',
                  borderRadius: '6px',
                  cursor: (saving || isOverReceipt) ? 'not-allowed' : 'pointer',
                  boxShadow: isOverReceipt ? 'none' : '0 2px 4px rgba(2, 132, 199, 0.25)'
                }}
              >
                {saving ? 'Saving...' : mode === 'create' ? 'Record Inward Receipt' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GrnFormModal;
