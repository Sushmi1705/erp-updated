import React from 'react';
import {
  Truck, Calendar, Plus, Edit2, Trash2, Lock,
  ChevronRight, CheckCircle2, Layers, AlertCircle, Box
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

export const OrderReleasesSection = ({
  selectedLine,
  schedules = [],
  selectedSchedule,
  onSelectSchedule,
  onOpenAddScheduleModal,
  onOpenEditScheduleModal,
  onDeleteSchedule,
  onAdvanceDispatchStatus,
  allocations = [],
  onOpenAddAllocationModal,
  onDeleteAllocation
}) => {
  if (!selectedLine) {
    return (
      <div style={{
        padding: '32px 20px',
        textAlign: 'center',
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          background: 'rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Truck size={22} color="#059669" />
        </div>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
          No Line Item Selected for Release Management
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 440, margin: 0 }}>
          Select an automotive component from the parts table above to configure staggered JIT delivery schedules and assign warehouse finished goods stock batches.
        </p>
      </div>
    );
  }

  const isLockedSchedule = sched => ['Picked', 'In Transit', 'Delivered'].includes(sched?.dispatchStatus);
  const totalScheduled = schedules.reduce((sum, s) => sum + (Number(s.scheduledQuantity) || 0), 0);
  const totalShipped = schedules.reduce((sum, s) => sum + (Number(s.shippedQuantity) || 0), 0);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 14
    }}>
      {/* ── LEFT: STAGGERED JIT DELIVERY RELEASES ────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={14} color="#059669" />
              <span>Delivery Releases & Staggered Drops</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              For {selectedLine.productId?.name || `Line #${selectedLine.lineSequence}`} ({totalScheduled} / {selectedLine.orderedQuantity} scheduled)
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddScheduleModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11.5,
              fontWeight: 700,
              padding: '4px 10px'
            }}
          >
            <Plus size={12} /> Add Release
          </button>
        </div>

        {/* Schedules Table */}
        {schedules.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
            No delivery releases created yet for this part.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 11.5
            }}>
              <thead>
                <tr style={{
                  background: 'var(--surface-canvas)',
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 10.5,
                  textTransform: 'uppercase'
                }}>
                  <th style={{ padding: '8px 10px' }}>Delivery Dates</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Scheduled</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Shipped</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Dispatch</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sched, idx) => {
                  const isSelected = selectedSchedule?._id === sched._id;
                  const locked = isLockedSchedule(sched);

                  return (
                    <tr
                      key={sched._id || idx}
                      onClick={() => onSelectSchedule(sched)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '9px 10px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          Due: {sched.requestedDeliveryDate ? new Date(sched.requestedDeliveryDate).toLocaleDateString() : '—'}
                        </div>
                        {sched.confirmedDeliveryDate && (
                          <div style={{ fontSize: 10.5, color: '#059669' }}>
                            Promised: {new Date(sched.confirmedDeliveryDate).toLocaleDateString()}
                          </div>
                        )}
                        {sched.shipToAddress && (
                          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
                            {sched.shipToAddress}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {Number(sched.scheduledQuantity).toLocaleString()}
                        {sched.isQuantityLocked && (
                          <span title="Quantity locked by dispatch progress" style={{ marginLeft: 4 }}>
                            <Lock size={10} color="var(--text-secondary)" />
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '9px 10px', textAlign: 'right', color: sched.shippedQuantity > 0 ? '#059669' : 'var(--text-secondary)' }}>
                        {Number(sched.shippedQuantity || 0).toLocaleString()}
                      </td>

                      <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                        <StatusBadge value={sched.dispatchStatus} />
                      </td>

                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }} onClick={e => e.stopPropagation()}>
                          {/* Advance dispatch status */}
                          {['Pending', 'Picked', 'In Transit'].includes(sched.dispatchStatus) && (
                            <button
                              type="button"
                              title={`Advance status`}
                              onClick={() => onAdvanceDispatchStatus(sched)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--accent-primary)',
                                padding: 2
                              }}
                            >
                              <Truck size={12} />
                            </button>
                          )}

                          {!locked && (
                            <>
                              <button
                                type="button"
                                title="Edit delivery release"
                                onClick={() => onOpenEditScheduleModal(sched)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2 }}
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                type="button"
                                title="Delete delivery release"
                                onClick={() => onDeleteSchedule(sched._id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: 2 }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            title="Select for Stock Allocation"
                            onClick={() => onSelectSchedule(sched)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: isSelected ? '#059669' : 'var(--text-secondary)',
                              padding: 2
                            }}
                          >
                            <ChevronRight size={13} />
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

      {/* ── RIGHT: INVENTORY STOCK BATCH ALLOCATION (ATP) ───────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={14} color="#0077b6" />
              <span>Finished Goods Stock Set Aside (ATP)</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {selectedSchedule ? (
                <span>For Release due {new Date(selectedSchedule.requestedDeliveryDate).toLocaleDateString()}</span>
              ) : (
                <span>Select a delivery release on the left</span>
              )}
            </div>
          </div>

          {selectedSchedule && !isLockedSchedule(selectedSchedule) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenAddAllocationModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                fontWeight: 700,
                padding: '4px 10px'
              }}
            >
              <Plus size={12} /> Set Stock Aside
            </button>
          )}
        </div>

        {/* Content */}
        {!selectedSchedule ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
            Click a delivery release on the left to see and assign stock batches.
          </div>
        ) : allocations.length === 0 ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              No stock batches allocated to this release yet.
            </p>
            {!isLockedSchedule(selectedSchedule) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onOpenAddAllocationModal}
                style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}
              >
                <Plus size={12} /> Assign Warehouse Batch
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 11.5
            }}>
              <thead>
                <tr style={{
                  background: 'var(--surface-canvas)',
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 10.5,
                  textTransform: 'uppercase'
                }}>
                  <th style={{ padding: '8px 10px' }}>Batch Number</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Allocated Qty</th>
                  <th style={{ padding: '8px 10px' }}>Allocation Date</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Reservation</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc, idx) => (
                  <tr key={alloc._id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      {alloc.inventoryBatchId?.batchNumber || alloc.inventoryBatchId || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                      {Number(alloc.allocatedQuantity).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {alloc.allocationDate ? new Date(alloc.allocationDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {alloc.isHardReserved ? (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 10,
                          fontSize: 10,
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669'
                        }}>
                          Hard Reserved
                        </span>
                      ) : (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 10,
                          fontSize: 10,
                          fontWeight: 600,
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)'
                        }}>
                          Soft Allocation
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <button
                        type="button"
                        title="Remove allocation"
                        onClick={() => onDeleteAllocation(alloc._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: 2 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderReleasesSection;
