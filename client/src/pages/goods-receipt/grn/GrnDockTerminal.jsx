import React, { useState } from 'react';
import { 
  Truck, Package, Search, CheckCircle2, Clock, AlertTriangle, 
  Layers, Printer, Edit3, Trash2, ArrowRight, ShieldCheck, 
  FileText, Check, AlertCircle, ChevronRight, X
} from 'lucide-react';

const GrnDockTerminal = ({
  grns = [],
  selectedGrn,
  onSelectGrn,
  onOpenEditModal,
  onDeleteGrn,
  onOpenPrintModal,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Received', 'Inspecting', 'Posted', 'ShortSupply'

  // Filter GRN list
  const filteredGrns = grns.filter(g => {
    const grnNo = g.grnNumber?.toLowerCase() || '';
    const poNo = g.purchaseOrderId?.poNumber?.toLowerCase() || '';
    const vendor = g.vendorId?.name?.toLowerCase() || '';
    const material = g.materialId?.name?.toLowerCase() || '';
    const vehicle = g.vehicleNumber?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || 
      grnNo.includes(search) || 
      poNo.includes(search) || 
      vendor.includes(search) || 
      material.includes(search) || 
      vehicle.includes(search);

    if (!matchesSearch) return false;

    if (statusFilter === 'Received') return g.status === 'Received';
    if (statusFilter === 'Inspecting') return g.status === 'Inspecting';
    if (statusFilter === 'Posted') return g.status === 'Posted';
    if (statusFilter === 'ShortSupply') {
      return (g.receivedQuantity || 0) < (g.poQuantity || 0) && g.status !== 'Cancelled';
    }

    return true;
  });

  // Auto-select first item if none selected
  if (!selectedGrn && filteredGrns.length > 0) {
    onSelectGrn(filteredGrns[0]);
  }

  const grn = selectedGrn || filteredGrns[0];
  const poQty = grn?.poQuantity || 0;
  const recQty = grn?.receivedQuantity || 0;
  const isShortSupply = recQty < poQty;
  const shortageAmount = poQty - recQty;
  const fulfillmentPct = poQty > 0 ? Math.min(100, Math.round((recQty / poQty) * 100)) : 100;

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      height: 'calc(100vh - 170px)',
      minHeight: '520px',
      overflow: 'hidden'
    }}>
      {/* ── LEFT PANEL: INCOMING DELIVERIES QUEUE (360px) ───────────────────── */}
      <div style={{
        width: '360px',
        flexShrink: 0,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Tray Header & Search */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-canvas)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Inward Truck Queue
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '10px',
              background: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7'
            }}>
              {filteredGrns.length} shipments
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={13} color="var(--text-secondary)" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search GRN, PO, supplier, vehicle..."
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
              { id: 'All', label: 'All' },
              { id: 'Received', label: 'At Gate' },
              { id: 'Inspecting', label: 'QA Check' },
              { id: 'Posted', label: 'Posted' },
              { id: 'ShortSupply', label: 'Short' }
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
                    border: active ? '1px solid #0284c7' : '1px solid var(--border-color)',
                    background: active ? 'rgba(2, 132, 199, 0.12)' : 'var(--surface-card)',
                    color: active ? '#0284c7' : 'var(--text-secondary)',
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

        {/* Deliveries Scroll List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredGrns.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
              No inward receipts match your search.
            </div>
          ) : (
            filteredGrns.map(item => {
              const isSelected = grn?._id === item._id;
              const isShort = (item.receivedQuantity || 0) < (item.poQuantity || 0) && item.status !== 'Cancelled';

              let statusBg = 'rgba(2, 132, 199, 0.08)';
              let statusColor = '#0284c7';
              let statusLabel = 'At Gate';

              if (item.status === 'Inspecting') {
                statusBg = 'rgba(245, 158, 11, 0.1)';
                statusColor = '#d97706';
                statusLabel = 'In QA';
              } else if (item.status === 'Posted') {
                statusBg = 'rgba(16, 185, 129, 0.1)';
                statusColor = '#059669';
                statusLabel = 'Posted';
              } else if (item.status === 'Cancelled') {
                statusBg = 'rgba(239, 68, 68, 0.1)';
                statusColor = '#dc2626';
                statusLabel = 'Void';
              }

              return (
                <div
                  key={item._id}
                  onClick={() => onSelectGrn(item)}
                  style={{
                    padding: '10px 12px',
                    marginBottom: '6px',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--surface-canvas)' : 'transparent',
                    border: isSelected ? '1px solid #0284c7' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.12s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                      {item.grnNumber}
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
                    {item.vendorId?.name || 'Unknown Supplier'}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {item.materialId?.name || 'Raw Material'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: 700, color: isShort ? '#d97706' : 'var(--text-primary)' }}>
                        {item.receivedQuantity} units
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>/ {item.poQuantity}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isShort && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#dc2626',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '1px 4px',
                          borderRadius: '3px'
                        }}>
                          Short
                        </span>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {item.receiptDate ? new Date(item.receiptDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: INWARD RECEIVING DOSSIER (65% width) ───────────────── */}
      <div style={{
        flex: 1,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {grn ? (
          <>
            {/* Dossier Header */}
            <div style={{
              padding: '14px 20px',
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
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  flexShrink: 0
                }}>
                  <Package size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {grn.grnNumber}
                    </h2>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: grn.status === 'Posted' ? 'rgba(16, 185, 129, 0.1)' :
                                  grn.status === 'Inspecting' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                      color: grn.status === 'Posted' ? '#059669' :
                             grn.status === 'Inspecting' ? '#d97706' : '#0284c7'
                    }}>
                      Status: {grn.status || 'Received'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Received on {grn.receiptDate ? new Date(grn.receiptDate).toLocaleString('en-IN') : 'Today'} • Gate Pass: <strong>{grn.gatePassNo || `GP-${grn.grnNumber.slice(-4)}`}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => onOpenPrintModal(grn)}
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
                  <span>Print Slip</span>
                </button>

                <button
                  onClick={() => onOpenEditModal(grn)}
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
                  <Edit3 size={13} />
                  <span>Correct GRN</span>
                </button>

                <button
                  onClick={() => onDeleteGrn(grn)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    color: '#dc2626',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Scrollable Dossier Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* 1. Gate Logistics & Vehicle Metadata Card */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block' }}>Delivery Challan / Invoice #</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{grn.challanNumber || 'CH-AUTO-VERIFIED'}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block' }}>Vehicle / Truck Number</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{grn.vehicleNumber || 'HR-55-AT-4821'}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block' }}>Transporter / Carrier</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{grn.transporterName || 'VRL Logistics / Dedicated Truck'}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block' }}>Unloading Receiving Bay</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{grn.storageLocation || 'Dock A - Raw Material Inward Bay'}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block' }}>Packaging Condition</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: grn.packagingCondition?.includes('Damaged') ? '#dc2626' : '#059669'
                  }}>
                    <ShieldCheck size={12} />
                    {grn.packagingCondition || 'Good / Intact'}
                  </span>
                </div>
              </div>

              {/* 2. Supplier & Purchase Order Reference */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                fontSize: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>
                    Supplier Details
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {grn.vendorId?.name || 'Tata Steel Ltd'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                    Code: {grn.vendorId?.code || 'VND-001'} • GSTIN: {grn.vendorId?.gstin || '06AABCT1332L1Z4'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>
                    Purchase Order Contract
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>
                    {grn.purchaseOrderId?.poNumber || 'PO-2026-2003'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                    Terms: {grn.purchaseOrderId?.paymentTerms || 'Net30'} • Status: {grn.purchaseOrderId?.deliveryStatus || 'In-Transit'}
                  </div>
                </div>
              </div>

              {/* 3. Inward Quantity & Shortage Variance Gauge */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Material Delivery & Variance Check: {grn.materialId?.name || 'Raw Material'}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isShortSupply ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: isShortSupply ? '#b45309' : '#047857'
                  }}>
                    {isShortSupply ? `Short Delivery: -${shortageAmount} units` : '100% Full Fulfilment'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ background: 'var(--surface-card)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Contract PO Qty</span>
                    <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{poQty.toLocaleString()}</strong>
                  </div>

                  <div style={{ background: 'var(--surface-card)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Inward Gate Received</span>
                    <strong style={{ fontSize: '16px', color: isShortSupply ? '#d97706' : '#059669' }}>
                      {recQty.toLocaleString()}
                    </strong>
                  </div>

                  <div style={{ background: 'var(--surface-card)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Fulfilment %</span>
                    <strong style={{ fontSize: '16px', color: fulfillmentPct < 100 ? '#d97706' : '#059669' }}>
                      {fulfillmentPct}%
                    </strong>
                  </div>
                </div>

                {/* Fulfilment Progress Bar */}
                <div style={{
                  height: '6px',
                  background: 'var(--surface-card)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    width: `${fulfillmentPct}%`,
                    height: '100%',
                    background: fulfillmentPct < 100 ? '#d97706' : '#059669'
                  }} />
                </div>
              </div>

              {/* 4. Three-Stage Lifecycle Flow */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Goods Receipt Operational Pipeline
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '11px' }}>
                  {/* Step 1: Gate Inward */}
                  <div style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#047857', fontWeight: 700 }}>
                      <CheckCircle2 size={13} />
                      <span>1. Gate Receipt</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                      Material accepted at dock & GRN logged
                    </span>
                  </div>

                  {/* Step 2: Quality Inspection */}
                  <div style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: grn.status === 'Posted' ? 'rgba(16, 185, 129, 0.08)' :
                                grn.status === 'Inspecting' ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface-card)',
                    border: grn.status === 'Posted' ? '1px solid rgba(16, 185, 129, 0.25)' :
                            grn.status === 'Inspecting' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: grn.status === 'Posted' ? '#047857' : grn.status === 'Inspecting' ? '#b45309' : 'var(--text-secondary)',
                      fontWeight: 700
                    }}>
                      <Clock size={13} />
                      <span>2. RQA Inspection</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                      {grn.status === 'Posted' ? 'Passed quality clearance' : 'Sampling & CMM check pending'}
                    </span>
                  </div>

                  {/* Step 3: Warehouse Stock */}
                  <div style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: grn.status === 'Posted' ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface-card)',
                    border: grn.status === 'Posted' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: grn.status === 'Posted' ? '#047857' : 'var(--text-secondary)',
                      fontWeight: 700
                    }}>
                      <Package size={13} />
                      <span>3. Stock Placement</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                      {grn.status === 'Posted' ? 'Batch posted into central store' : 'Awaiting QA clearance'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Notes & Remarks */}
              {grn.notes && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--surface-canvas)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Storekeeper Gate Notes:</strong>
                  <span style={{ color: 'var(--text-primary)' }}>{grn.notes}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            Select an inward receipt from the queue to inspect details.
          </div>
        )}
      </div>
    </div>
  );
};

export default GrnDockTerminal;
