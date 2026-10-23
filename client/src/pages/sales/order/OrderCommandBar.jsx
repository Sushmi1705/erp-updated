import React from 'react';
import {
  Package, Plus, Search, Truck, DollarSign, CheckCircle2,
  AlertTriangle, Factory, Clock, ShieldAlert, Layers
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

export const OrderCommandBar = ({
  orders = [],
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onOpenCreateModal,
  loading
}) => {
  // Aggregate KPIs
  const totalOrders = orders.length;
  const openOrders = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status));
  const orderBookValue = openOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
  const shippedCount = orders.filter(o => o.status === 'Partially Shipped' || o.status === 'Completed').length;
  const onHoldCount = orders.filter(o => o.holdStatus && o.holdStatus !== 'None').length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: 'linear-gradient(135deg, #031811 0%, #07281c 45%, #0b3928 100%)',
      border: '1px solid rgba(16, 185, 129, 0.35)',
      borderRadius: 10,
      padding: '14px 18px',
      boxShadow: '0 4px 22px rgba(0, 0, 0, 0.32)',
      color: '#ffffff'
    }}>
      {/* ── TOP ROW: BRANDING & ACTION ───────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(16, 185, 129, 0.45)'
          }}>
            <Truck size={24} color="#031811" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Sales Orders & Delivery Fulfillment Command
              </h1>
              <span style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#6ee7b7',
                letterSpacing: '0.04em'
              }}>
                TIER-1 OEM CONTRACT FULFILLMENT & DISPATCH TOWER
              </span>
            </div>
            <p style={{
              fontSize: 12,
              color: '#94a3b8',
              margin: '3px 0 0 0',
              fontWeight: 400
            }}>
              Confirmed Customer POs, JIT Delivery Releases, Finished Goods Allocation & Shipping Execution
            </p>
          </div>
        </div>

        {/* Add Sales Order Button */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#031811',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(16, 185, 129, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Add Sales Order</span>
        </button>
      </div>

      {/* ── KPI TELEMETRY CARDS ─────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10
      }}>
        {/* Open Orders */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={17} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>
              Active Orders
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
              {openOrders.length} <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>/ {totalOrders} total</span>
            </div>
          </div>
        </div>

        {/* Order Book Value */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DollarSign size={17} color="#fbbf24" />
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>
              Active Order Book
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
              {fmtMoneyFull(orderBookValue)}
            </div>
          </div>
        </div>

        {/* Dispatches / Shipped */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'rgba(0, 180, 216, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Truck size={17} color="#00b4d8" />
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>
              Fulfillment Pipeline
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
              {shippedCount} <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Dispatches</span>
            </div>
          </div>
        </div>

        {/* Commercial / Credit Holds */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: onHoldCount > 0 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {onHoldCount > 0 ? (
              <ShieldAlert size={17} color="#f43f5e" />
            ) : (
              <CheckCircle2 size={17} color="#34d399" />
            )}
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>
              Commercial Hold Gates
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: onHoldCount > 0 ? '#f43f5e' : '#34d399' }}>
              {onHoldCount > 0 ? `${onHoldCount} Orders Blocked` : 'All Clear (0 Holds)'}
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER STRIP ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        paddingTop: 4
      }}>
        {/* Search Input */}
        <div style={{
          position: 'relative',
          flex: '1 1 280px',
          maxWidth: 380
        }}>
          <Search
            size={14}
            color="#94a3b8"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search order #, customer, customer PO #…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 6,
              padding: '6px 12px 6px 32px',
              fontSize: 12,
              color: '#ffffff',
              outline: 'none'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {['All', 'Draft', 'Approved', 'Processing', 'Partially Shipped', 'Completed', 'On Hold'].map(s => {
            const isSelected = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                style={{
                  background: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#031811' : '#cbd5e1',
                  border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: isSelected ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderCommandBar;
