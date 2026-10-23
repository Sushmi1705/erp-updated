import React, { useState } from 'react';
import { 
  ArrowDownToLine, Search, Truck, Clock, CheckCircle2, 
  AlertCircle, Package, ArrowRight, Calendar, UserCheck
} from 'lucide-react';

const GrnPendingPoRunway = ({
  purchaseOrders = [],
  grns = [],
  onReceivePo
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate received quantities per PO
  const poReceivedMap = {};
  grns.forEach(g => {
    const pId = g.purchaseOrderId?._id || g.purchaseOrderId;
    if (pId && g.status !== 'Cancelled') {
      poReceivedMap[pId] = (poReceivedMap[pId] || 0) + (g.receivedQuantity || 0);
    }
  });

  // Filter POs
  const filteredPOs = purchaseOrders.filter(po => {
    const poNo = po.poNumber?.toLowerCase() || '';
    const vendor = (po.vendorId?.name || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || poNo.includes(search) || vendor.includes(search);
    return matchesSearch;
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      flex: 1,
      minHeight: '520px',
      height: 'calc(100vh - 170px)',
      overflowY: 'auto'
    }}>
      {/* ── Control Bar ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          position: 'relative',
          width: '320px',
          maxWidth: '100%'
        }}>
          <Search size={14} color="var(--text-secondary)" style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)'
          }} />
          <input
            type="text"
            placeholder="Search approved PO or supplier..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              fontSize: '12px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredPOs.length}</strong> active purchase contracts awaiting dock receiving
        </div>
      </div>

      {/* ── Runway Cards Grid ───────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '14px'
      }}>
        {filteredPOs.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: '40px',
            textAlign: 'center',
            background: 'var(--surface-card)',
            borderRadius: '8px',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-secondary)'
          }}>
            No pending purchase orders awaiting inward delivery.
          </div>
        ) : (
          filteredPOs.map(po => {
            const totalRec = poReceivedMap[po._id] || 0;
            // Get total ordered from items
            const totalOrd = (po.items || []).reduce((sum, item) => sum + (item.orderQty || item.quantity || 0), 0) || 1000;
            const remaining = Math.max(0, totalOrd - totalRec);
            const fulfillmentPct = totalOrd > 0 ? Math.min(100, Math.round((totalRec / totalOrd) * 100)) : 0;

            const isFulfilled = remaining === 0;

            return (
              <div
                key={po._id}
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#0284c7' }}>
                        {po.poNumber}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isFulfilled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                        color: isFulfilled ? '#059669' : '#0284c7'
                      }}>
                        {isFulfilled ? 'Fully Received' : 'Open Delivery'}
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {po.date ? new Date(po.date).toLocaleDateString('en-IN') : 'Recent'}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {po.vendorId?.name || 'Tata Steel Ltd'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Code: {po.vendorId?.code || 'SUP-01'} • Delivery Status: <strong>{po.deliveryStatus || 'In-Transit'}</strong>
                  </div>

                  {/* Quantity balance stats */}
                  <div style={{
                    background: 'var(--surface-canvas)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    fontSize: '11px',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Total Ordered</span>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {totalOrd.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Received So Far</span>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#059669' }}>
                        {totalRec.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Remaining Due</span>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: remaining > 0 ? '#d97706' : '#059669' }}>
                        {remaining.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: '5px',
                    background: 'var(--surface-canvas)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{
                      width: `${fulfillmentPct}%`,
                      height: '100%',
                      background: isFulfilled ? '#059669' : '#0284c7'
                    }} />
                  </div>
                </div>

                {/* Receive Action */}
                <button
                  onClick={() => onReceivePo(po)}
                  disabled={isFulfilled}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: isFulfilled ? 'var(--surface-canvas)' : '#0284c7',
                    color: isFulfilled ? 'var(--text-secondary)' : '#ffffff',
                    border: isFulfilled ? '1px solid var(--border-color)' : 'none',
                    borderRadius: '6px',
                    cursor: isFulfilled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <Truck size={14} />
                  <span>{isFulfilled ? 'All Material Received' : 'Receive Delivery at Gate'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GrnPendingPoRunway;
