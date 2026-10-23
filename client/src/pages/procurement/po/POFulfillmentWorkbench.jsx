import React, { useState } from 'react';
import { 
  Truck, CheckCircle2, XCircle, Clock, Send, FileText, 
  RefreshCw, AlertTriangle, Printer, Trash2, Search, X, 
  ArrowRight, ShieldCheck, ChevronRight, Package, Building2,
  DollarSign, Check, Calendar, Lock, AlertCircle
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const SENT_LABEL = {
  Not_Sent: 'Not sent',
  EDI_Sent: 'Sent',
  Acknowledged: 'Accepted'
};
const sentLabel = (s) => SENT_LABEL[s] || String(s || '').replace(/_/g, ' ');
const approvalLabel = (s) => (s === 'Pending' ? 'Pending approval' : s);

const POFulfillmentWorkbench = ({
  purchaseOrders = [],
  selectedPo,
  onSelectPo,
  onStatusUpdate,
  onAcknowledge,
  onASN,
  onMockGoodsReceipt,
  onOpenChangeOrderModal,
  onOpenInvoiceModal,
  onPrintVoucher,
  onDeletePo,
  onAddNew,
  busy
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('All'); // 'All', 'Pending', 'In-Transit', 'Delivered'

  // Auto-select first PO if none selected
  if (!selectedPo && purchaseOrders.length > 0) {
    onSelectPo(purchaseOrders[0]);
  }

  // Filter orders on left
  const filteredOrders = purchaseOrders.filter(po => {
    const num = po.poNumber?.toLowerCase() || '';
    const vendorName = po.vendorId?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    const matchesSearch = !search || num.includes(search) || vendorName.includes(search);

    let matchesFilter = true;
    if (filterStage === 'Pending') matchesFilter = po.approvalStatus === 'Pending';
    else if (filterStage === 'In-Transit') matchesFilter = po.deliveryStatus === 'In-Transit';
    else if (filterStage === 'Delivered') matchesFilter = po.deliveryStatus === 'Delivered';
    else if (filterStage === 'Approved') matchesFilter = po.approvalStatus === 'Approved';

    return matchesSearch && matchesFilter;
  });

  // Calculate lifecycle stage (1 to 5) for selected PO
  const getLifecycleStage = (po) => {
    if (!po) return 1;
    if (po.items?.[0]?.invoicedQty > 0) return 5; // 3-way match done
    if (po.deliveryStatus === 'Delivered') return 4; // Goods received
    if (po.deliveryStatus === 'In-Transit') return 3; // ASN truck on road
    if (po.transmissionStatus === 'Acknowledged') return 2.5;
    if (po.transmissionStatus === 'EDI_Sent' || po.approvalStatus === 'Approved') return 2; // Approved & sent
    return 1; // Pending
  };

  const currentStage = getLifecycleStage(selectedPo);

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      height: 'calc(100vh - 215px)',
      minHeight: '520px',
      overflow: 'hidden'
    }}>
      {/* ── LEFT PANEL: PURCHASE ORDERS QUEUE (340px) ───────────────────────── */}
      <div style={{
        width: '340px',
        flexShrink: 0,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Queue Control Header */}
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
              Purchase Orders Queue
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '10px',
              background: '#059669',
              color: '#ffffff'
            }}>
              {purchaseOrders.length}
            </span>
          </div>

          {/* Quick Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '5px 8px'
          }}>
            <Search size={13} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search PO # or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                width: '100%',
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <X size={12} color="var(--text-secondary)" cursor="pointer" onClick={() => setSearchTerm('')} />
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['All', 'Pending', 'In-Transit', 'Delivered'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilterStage(tab)}
                style={{
                  flex: 1,
                  padding: '3px 0',
                  fontSize: '11px',
                  fontWeight: filterStage === tab ? 600 : 500,
                  background: filterStage === tab ? '#059669' : 'transparent',
                  color: filterStage === tab ? '#ffffff' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable PO Cards List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filteredOrders.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
              No purchase orders found matching criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredOrders.map(po => {
                const isSelected = selectedPo?._id === po._id;
                const isPending = po.approvalStatus === 'Pending';
                const isApproved = po.approvalStatus === 'Approved';
                const isInTransit = po.deliveryStatus === 'In-Transit';
                const isDelivered = po.deliveryStatus === 'Delivered';
                const firstItem = po.items?.[0] || {};

                return (
                  <div
                    key={po._id}
                    onClick={() => onSelectPo(po)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #059669' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(5, 150, 105, 0.04)' : 'var(--surface-card)',
                      boxShadow: isSelected ? '0 1px 4px rgba(5, 150, 105, 0.12)' : 'none',
                      transition: 'all 0.12s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: PO Number, Version & Approval Pill */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '11.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: isSelected ? '#059669' : 'var(--text-primary)'
                        }}>
                          {po.poNumber}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '0 4px',
                          borderRadius: '3px',
                          background: 'var(--surface-canvas)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          v{po.version || 1}
                        </span>
                      </div>

                      {isApproved ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Check size={10} strokeWidth={3} /> Approved
                        </span>
                      ) : isPending ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Clock size={10} /> Pending
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626'
                        }}>
                          Rejected
                        </span>
                      )}
                    </div>

                    {/* Supplier Name */}
                    <div style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {po.vendorId?.name || 'Supplier'}
                    </div>

                    {/* Material Preview */}
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {firstItem.materialId?.name || 'Raw Material Order'}
                      {firstItem.orderQty ? ` • ${firstItem.orderQty} Units` : ''}
                    </div>

                    {/* Bottom Metadata: Total Amount & Logistics Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)'
                      }}>
                        {fmtMoneyFull(po.totalAmount)}
                      </span>

                      {isInTransit ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Truck size={10} /> In-Transit
                        </span>
                      ) : isDelivered ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <CheckCircle2 size={10} /> Delivered
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '10px',
                          color: 'var(--text-secondary)'
                        }}>
                          {sentLabel(po.transmissionStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: FULFILLMENT WORKBENCH & 3-WAY MATCH DOSSIER ────────── */}
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
        {selectedPo ? (
          <>
            {/* Dossier Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--surface-canvas)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: '#059669',
                    color: '#ffffff'
                  }}>
                    {selectedPo.poNumber}
                  </span>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--surface-card)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)'
                  }}>
                    Revision {selectedPo.version || 1}
                  </span>

                  <h2 style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {selectedPo.vendorId?.name}
                  </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span>Commercial Terms: <strong style={{ color: 'var(--text-primary)' }}>{selectedPo.paymentTerms || 'Net30'} • {selectedPo.incoterms || 'DDP'}</strong></span>
                  <span>Order Value: <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>{fmtMoneyFull(selectedPo.totalAmount)}</strong></span>
                  <span>Transmission: <strong style={{ color: 'var(--text-primary)' }}>{sentLabel(selectedPo.transmissionStatus)}</strong></span>
                  <span>Logistics: <strong style={{ color: 'var(--text-primary)' }}>{selectedPo.deliveryStatus || 'Not Scheduled'}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    const item = selectedPo.items?.[0] || {};
                    onOpenChangeOrderModal({
                      newQty: item.orderQty || item.quantity || 1,
                      newPrice: item.unitPrice || 0
                    });
                  }}
                  title="Create Change Order (Revise quantity or unit rate)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Revise Order</span>
                </button>

                <button
                  onClick={onPrintVoucher}
                  title="Print Official Purchase Order Voucher"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={13} />
                  <span>Print PO</span>
                </button>

                {onDeletePo && selectedPo.deliveryStatus !== 'Delivered' && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete purchase order ${selectedPo.poNumber}?`)) {
                        onDeletePo(selectedPo._id);
                      }
                    }}
                    title="Delete Purchase Order"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#dc2626',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Dossier Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* 1. Automotive Procurement Lifecycle Progress Ribbon */}
              <div style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}>
                {[
                  {
                    step: 1,
                    title: '1. Approval',
                    desc: selectedPo.approvalStatus === 'Approved' ? 'Authorized' : 'Pending Signoff',
                    done: selectedPo.approvalStatus === 'Approved',
                    isCurrent: selectedPo.approvalStatus === 'Pending'
                  },
                  {
                    step: 2,
                    title: '2. Supplier EDI',
                    desc: sentLabel(selectedPo.transmissionStatus),
                    done: selectedPo.transmissionStatus === 'Acknowledged' || selectedPo.transmissionStatus === 'EDI_Sent',
                    isCurrent: selectedPo.approvalStatus === 'Approved' && selectedPo.transmissionStatus !== 'Acknowledged'
                  },
                  {
                    step: 3,
                    title: '3. In-Transit ASN',
                    desc: selectedPo.deliveryStatus === 'In-Transit' ? 'Truck on Road' : selectedPo.deliveryStatus === 'Delivered' ? 'Delivered' : 'Awaiting Dispatch',
                    done: selectedPo.deliveryStatus === 'In-Transit' || selectedPo.deliveryStatus === 'Delivered',
                    isCurrent: selectedPo.transmissionStatus === 'Acknowledged' && selectedPo.deliveryStatus !== 'In-Transit' && selectedPo.deliveryStatus !== 'Delivered'
                  },
                  {
                    step: 4,
                    title: '4. Stores GRN',
                    desc: selectedPo.deliveryStatus === 'Delivered' ? 'Inward Booked' : 'Pending Gate Arrival',
                    done: selectedPo.deliveryStatus === 'Delivered',
                    isCurrent: selectedPo.deliveryStatus === 'In-Transit'
                  },
                  {
                    step: 5,
                    title: '5. 3-Way Match',
                    desc: (selectedPo.items?.[0]?.invoicedQty || 0) > 0 ? 'Bill Cleared' : 'Pending Invoice',
                    done: (selectedPo.items?.[0]?.invoicedQty || 0) > 0,
                    isCurrent: selectedPo.deliveryStatus === 'Delivered' && !((selectedPo.items?.[0]?.invoicedQty || 0) > 0)
                  }
                ].map((s) => {
                  const isDone = s.done;
                  const isCurrent = s.isCurrent;

                  return (
                    <div
                      key={s.step}
                      style={{
                        background: isDone 
                          ? 'rgba(16, 185, 129, 0.08)' 
                          : isCurrent 
                          ? 'var(--surface-card)' 
                          : 'transparent',
                        border: isDone 
                          ? '1px solid rgba(16, 185, 129, 0.3)' 
                          : isCurrent 
                          ? '1.5px solid #2563eb' 
                          : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minWidth: 0,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: isDone 
                          ? '#059669' 
                          : isCurrent 
                          ? '#2563eb' 
                          : 'var(--surface-card)',
                        color: (isDone || isCurrent) ? '#ffffff' : 'var(--text-secondary)',
                        border: (isDone || isCurrent) ? 'none' : '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {isDone ? <Check size={11} strokeWidth={3} /> : s.step}
                      </div>

                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isDone ? '#047857' : isCurrent ? '#1d4ed8' : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.2
                        }}>
                          {s.title}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: isDone ? '#059669' : isCurrent ? '#2563eb' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '1px'
                        }}>
                          {s.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. Line Items Table */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--surface-canvas)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Ordered Materials & Inventory Fulfillment Lines
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {selectedPo.items?.length || 0} line items
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item / Material</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Ordered Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Rate</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Line Total</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Promised Delivery</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Stores GRN</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Billed Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPo.items || []).map((li, idx) => (
                        <tr key={li._id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {li.materialId?.name || 'Raw Material Item'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              Code: {li.materialId?.code || 'RM-RAW'}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                            {li.orderQty || li.quantity}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            {fmtMoneyFull(li.unitPrice)}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {fmtMoneyFull(li.total || (li.orderQty * li.unitPrice))}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {li.promisedDeliveryDate ? new Date(li.promisedDeliveryDate).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: li.receivedQty > 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-canvas)',
                              color: li.receivedQty > 0 ? '#059669' : 'var(--text-secondary)',
                              border: '1px solid var(--border-color)'
                            }}>
                              {li.receivedQty || 0} / {li.orderQty || li.quantity}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: li.invoicedQty > 0 ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface-canvas)',
                              color: li.invoicedQty > 0 ? '#2563eb' : 'var(--text-secondary)',
                              border: '1px solid var(--border-color)'
                            }}>
                              {li.invoicedQty || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Operations Execution Command Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px'
              }}>
                {/* Workflow 1: Internal Authorization */}
                <div style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#059669" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Commercial Authorization
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    Approve purchase commitments before supplier transmission.
                  </p>

                  <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', gap: '8px' }}>
                    {selectedPo.approvalStatus === 'Pending' ? (
                      <>
                        <button
                          onClick={() => onStatusUpdate(selectedPo._id, 'Approved')}
                          disabled={!!busy}
                          style={{
                            flex: 1,
                            padding: '7px 0',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#059669',
                            color: '#ffffff',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: busy ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {busy === 'approve' ? 'Approving...' : '✓ Approve & Send to Supplier'}
                        </button>

                        <button
                          onClick={() => onStatusUpdate(selectedPo._id, 'Rejected')}
                          disabled={!!busy}
                          style={{
                            padding: '7px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#dc2626',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            cursor: busy ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <div style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        color: '#059669',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Check size={14} /> Approved & Transmitted via B2B EDI
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow 2: Supplier B2B & Logistics Tracking */}
                <div style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={16} color="#2563eb" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Inbound Logistics & ASN
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    Track vendor order acceptance and road dispatch notice (ASN).
                  </p>

                  <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={onAcknowledge}
                      disabled={!!busy || selectedPo.transmissionStatus !== 'EDI_Sent'}
                      style={{
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        background: selectedPo.transmissionStatus === 'Acknowledged' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-canvas)',
                        color: selectedPo.transmissionStatus === 'Acknowledged' ? '#059669' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: selectedPo.transmissionStatus === 'EDI_Sent' ? 'pointer' : 'default',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>1. Supplier Order Acceptance</span>
                      {selectedPo.transmissionStatus === 'Acknowledged' && <Check size={13} />}
                    </button>

                    <button
                      onClick={onASN}
                      disabled={!!busy || selectedPo.transmissionStatus !== 'Acknowledged' || selectedPo.deliveryStatus === 'In-Transit' || selectedPo.deliveryStatus === 'Delivered'}
                      style={{
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        background: selectedPo.deliveryStatus === 'In-Transit' || selectedPo.deliveryStatus === 'Delivered' ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface-canvas)',
                        color: selectedPo.deliveryStatus === 'In-Transit' || selectedPo.deliveryStatus === 'Delivered' ? '#2563eb' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: selectedPo.transmissionStatus === 'Acknowledged' && selectedPo.deliveryStatus !== 'In-Transit' && selectedPo.deliveryStatus !== 'Delivered' ? 'pointer' : 'default',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>2. Supplier Truck Dispatch (ASN)</span>
                      {(selectedPo.deliveryStatus === 'In-Transit' || selectedPo.deliveryStatus === 'Delivered') && <Check size={13} />}
                    </button>
                  </div>
                </div>

                {/* Workflow 3: Stores Receiving & 3-Way Match */}
                <div style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} color="#7c3aed" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Warehouse GRN & 3-Way Match
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    Inward stores goods receipt and automated invoice clearance check.
                  </p>

                  <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={onMockGoodsReceipt}
                      disabled={!!busy || selectedPo.deliveryStatus === 'Delivered' || selectedPo.transmissionStatus !== 'Acknowledged'}
                      style={{
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        background: selectedPo.deliveryStatus === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-canvas)',
                        color: selectedPo.deliveryStatus === 'Delivered' ? '#059669' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: selectedPo.deliveryStatus !== 'Delivered' && selectedPo.transmissionStatus === 'Acknowledged' ? 'pointer' : 'default',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>3. Inward Goods Receipt (GRN)</span>
                      {selectedPo.deliveryStatus === 'Delivered' && <Check size={13} />}
                    </button>

                    <button
                      onClick={() => {
                        const item = selectedPo.items?.[0] || {};
                        onOpenInvoiceModal({
                          invoicedQty: item.orderQty || item.quantity || 1,
                          invoiceUnitPrice: item.unitPrice || 0
                        });
                      }}
                      disabled={!!busy || selectedPo.deliveryStatus !== 'Delivered'}
                      style={{
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        background: (selectedPo.items?.[0]?.invoicedQty || 0) > 0 ? 'rgba(124, 58, 237, 0.1)' : '#059669',
                        color: (selectedPo.items?.[0]?.invoicedQty || 0) > 0 ? '#7c3aed' : '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: selectedPo.deliveryStatus === 'Delivered' ? 'pointer' : 'default',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>4. Verify 3-Way Match Bill</span>
                      {(selectedPo.items?.[0]?.invoicedQty || 0) > 0 && <Check size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            fontSize: '13px'
          }}>
            <Truck size={36} color="var(--text-secondary)" style={{ marginBottom: '10px' }} />
            <p>Select a purchase order on the left to inspect fulfillment and 3-way match.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default POFulfillmentWorkbench;
