import React from 'react';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, ArrowRight, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DeadStockRadar = ({
  profiles = [],
  parameters = {},
  onOpenProfileModal
}) => {
  const navigate = useNavigate();
  const thresholdDays = parameters.Dead_Stock_Threshold_Days || 180;

  // Filter dead & slow-moving stock
  const dormantItems = profiles.filter(
    p => p.Dead_Stock_Risk === 'Dead' || p.Dead_Stock_Risk === 'High Risk'
  );

  const totalDormantValuation = dormantItems.reduce((sum, p) => sum + (p.valuation || 0), 0);

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Banner */}
      <div 
        style={{
          backgroundColor: dormantItems.length > 0 ? '#fffbeb' : '#ecfdf5',
          borderRadius: '10px',
          padding: '16px 20px',
          border: dormantItems.length > 0 ? '1px solid #fde68a' : '1px solid #a7f3d0',
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
              backgroundColor: dormantItems.length > 0 ? '#fef3c7' : '#d1fae5',
              color: dormantItems.length > 0 ? '#b45309' : '#059669'
            }}
          >
            {dormantItems.length > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: dormantItems.length > 0 ? '#78350f' : '#065f46' }}>
              {dormantItems.length > 0 
                ? `Dormant & Slow-Moving Capital Radar (${dormantItems.length} Materials Flagged)`
                : `100% Active Inventory Velocity — Zero Dead Stock`}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: dormantItems.length > 0 ? '#92400e' : '#047857' }}>
              {dormantItems.length > 0
                ? `Materials with zero shopfloor consumption for longer than ${thresholdDays} days. Capital trapped: ${formatCurrency(totalDormantValuation)}.`
                : 'Every material has been touched and consumed in production within the configured activity threshold.'}
            </p>
          </div>
        </div>

        {dormantItems.length > 0 && (
          <button
            onClick={() => navigate('/quality/scrap')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: '#b45309',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>Review Scrap Management</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Cards Grid */}
      {dormantItems.length === 0 ? (
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
            Zero Dead Stock Detected
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', marginInline: 'auto' }}>
            All active raw materials, WIP buffers, and components are cycling through the press shop and assembly lines cleanly.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {dormantItems.map((item) => {
            const mat = item.Material_ID || {};
            const isDead = item.Dead_Stock_Risk === 'Dead';

            return (
              <div
                key={item._id}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '10px',
                  padding: '16px',
                  border: isDead ? '1px solid #fecdd3' : '1px solid #fde68a',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span 
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: isDead ? '#ffe4e6' : '#fef3c7',
                        color: isDead ? '#e11d48' : '#b45309',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {isDead ? 'Dead Stock' : 'Slow Moving'}
                    </span>
                    <h4 style={{ margin: '6px 0 2px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {mat.name || 'Unnamed Material'}
                    </h4>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {mat.code} • {item.categoryName}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626' }}>
                      {formatCurrency(item.valuation)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Trapped Capital
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '11px' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>Gross Stock</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(item.onHand || 0).toLocaleString()} {item.uom}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>Standard Cost</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{item.standardCost || 0}/{item.uom}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>Inactivity Period</div>
                    <div style={{ fontWeight: 600, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      &gt; {thresholdDays} Days
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>ABC Class</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Class {item.ABC_Class || 'C'}</div>
                  </div>
                </div>

                {/* Recommended Action */}
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'rgba(180, 83, 9, 0.06)', padding: '8px 10px', borderRadius: '6px' }}>
                  <strong>Recommendation:</strong> {isDead 
                    ? 'Review for supplier return, re-nesting in engineering blank layout, or scrap write-off.' 
                    : 'Check impending BOM usage before issuing new purchase orders.'}
                </div>

                {/* Quick Action */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => onOpenProfileModal(item)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Adjust Threshold
                  </button>
                  <button
                    onClick={() => navigate('/purchasing/orders')}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#b45309',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Purchase Audit
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

export default DeadStockRadar;
