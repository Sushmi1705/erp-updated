import React from 'react';
import { 
  ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2, 
  Clock, Truck, ShoppingCart, RefreshCw, Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StockShortageWatch = ({
  inventoryData = [],
  onOpenAdjustModal,
  activeTabLabel = 'Raw Material'
}) => {
  const navigate = useNavigate();

  // Filter shortage items
  const shortageItems = inventoryData.filter(
    item => item.Exception_Flag === true || item.stockHealth === 'SAFETY_BREACH' || item.stockHealth === 'CRITICAL_OUT'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Alert Banner */}
      <div 
        style={{
          backgroundColor: shortageItems.length > 0 ? '#fff1f2' : '#ecfdf5',
          borderRadius: '10px',
          padding: '16px 20px',
          border: shortageItems.length > 0 ? '1px solid #fecdd3' : '1px solid #a7f3d0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: shortageItems.length > 0 ? '#ffe4e6' : '#d1fae5',
              color: shortageItems.length > 0 ? '#e11d48' : '#059669'
            }}
          >
            {shortageItems.length > 0 ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: shortageItems.length > 0 ? '#9f1239' : '#065f46' }}>
              {shortageItems.length > 0 
                ? `Safety Stock Buffer Breach Radar (${shortageItems.length} SKUs Alerted)`
                : `All ${activeTabLabel} Inventory Buffers Safe`}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: shortageItems.length > 0 ? '#be123c' : '#047857' }}>
              {shortageItems.length > 0
                ? 'These materials have Available-to-Promise stock below the IATF 16949 minimum safety buffer. Expedite procurement or production immediately to avoid press line stoppages.'
                : 'Current Available-to-Promise stock levels exceed the defined safety thresholds across all stores.'}
            </p>
          </div>
        </div>

        {shortageItems.length > 0 && (
          <button
            onClick={() => navigate('/purchasing/orders')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: '#e11d48',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ShoppingCart size={14} />
            <span>Open Purchase Orders</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Shortage Cards Grid */}
      {shortageItems.length === 0 ? (
        <div 
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '10px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <CheckCircle2 size={28} />
          </div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Zero Safety Buffer Breaches
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', marginInline: 'auto' }}>
            Every tracked {activeTabLabel} item currently maintains free Available-to-Promise volume strictly above the safety stock requirement.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {shortageItems.map((item) => {
            const deficit = item.shortageQuantity || Math.max(0, item.Safety_Stock_Level - item.Available_to_Promise);
            const deficitPct = item.Safety_Stock_Level > 0 
              ? Math.min(100, Math.round((deficit / item.Safety_Stock_Level) * 100)) 
              : 100;

            return (
              <div
                key={item._id}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '10px',
                  padding: '16px',
                  border: '1px solid #fecdd3',
                  boxShadow: '0 2px 8px rgba(225, 29, 72, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <AlertTriangle size={12} />
                      Safety Buffer Deficit
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {item.Product_Name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {item.Product_Code} • {item.grade || 'Standard'}
                    </div>
                  </div>

                  <span 
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#ffe4e6',
                      color: '#be123c',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    -{deficit.toLocaleString()} {item.uom || 'KG'}
                  </span>
                </div>

                {/* Progress Meter */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Free ATP: <strong style={{ color: '#e11d48' }}>{item.Available_to_Promise.toLocaleString()}</strong></span>
                    <span style={{ color: 'var(--text-secondary)' }}>Safety Target: <strong>{item.Safety_Stock_Level.toLocaleString()}</strong></span>
                  </div>
                  <div style={{ height: '6px', width: '100%', backgroundColor: '#fee2e2', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.max(5, 100 - deficitPct)}%`, 
                        backgroundColor: '#e11d48',
                        borderRadius: '3px'
                      }} 
                    />
                  </div>
                </div>

                {/* Logistics Attributes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', backgroundColor: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>Store Bay</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.Warehouse || 'Main Store'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>Lead Time</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} color="#059669" />
                      {item.leadTimeDays || 7} Days
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>Reorder Point</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.Reorder_Point?.toLocaleString() || item.Safety_Stock_Level.toLocaleString()} {item.uom || 'KG'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>Allocated</div>
                    <div style={{ fontWeight: 600, color: '#d97706' }}>{item.Total_Allocated.toLocaleString()} {item.uom || 'KG'}</div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => onOpenAdjustModal(item)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit3 size={12} />
                    <span>Count Audit</span>
                  </button>

                  <button
                    onClick={() => navigate('/purchasing/orders')}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Truck size={12} />
                    <span>Raise PO</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockShortageWatch;
