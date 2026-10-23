import React, { useState, useEffect } from 'react';
import { X, Tag, Calculator, ShieldCheck, Check } from 'lucide-react';
import { fmtMoney, fmtMoneyFull, fmtQty } from '../../../utils/money';

const ValuationMethodModal = ({
  isOpen,
  onClose,
  profile,
  onSave,
  saving = false
}) => {
  if (!isOpen || !profile) return null;

  const mat = profile.Material_ID || {};
  const [method, setMethod] = useState(profile.Primary_Valuation_Method || 'FIFO');
  const [stdCost, setStdCost] = useState(profile.Standard_Cost_Ref || mat.standardCost || 0);

  useEffect(() => {
    if (profile) {
      setMethod(profile.Primary_Valuation_Method || 'FIFO');
      setStdCost(profile.Standard_Cost_Ref || mat.standardCost || 0);
    }
  }, [profile]);

  const onHand = profile.onHand || 0;
  const numStdCost = Number(stdCost) || 0;
  const simulatedStdVal = onHand * numStdCost;
  const simulatedActiveVal = method === 'WAC' 
    ? (profile.wacValue || onHand * (profile.wacUnit || numStdCost))
    : method === 'Standard'
      ? simulatedStdVal
      : (profile.fifoValue || onHand * numStdCost);

  const simulatedVariance = simulatedActiveVal - simulatedStdVal;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      Material_ID: mat._id || profile._id,
      Primary_Valuation_Method: method,
      Standard_Cost_Ref: numStdCost
    });
  };

  const methods = [
    {
      id: 'FIFO',
      name: 'First In, First Out (FIFO)',
      badge: 'Statutory Ind AS 2',
      desc: 'Oldest stock receipts are accounted as issued first. Balance sheet valuation reflects latest market replacement costs.',
      color: '#059669',
      bg: 'rgba(5, 150, 105, 0.08)'
    },
    {
      id: 'WAC',
      name: 'Weighted Average Cost (WAC)',
      badge: 'Rolling Average',
      desc: 'Smoothes price fluctuations by re-averaging unit cost after each goods receipt. Ideal for high-turnover fasteners and fluids.',
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.08)'
    },
    {
      id: 'Standard',
      name: 'Standard Costing',
      badge: 'Engineering BOM Standard',
      desc: 'Fixed cost benchmark established by product costing. All acquisition differences flow to Purchase Price Variance (PPV).',
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.08)'
    }
  ];

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
      zIndex: 1050,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Configure Costing Basis & Valuation Method
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {mat.name} ({mat.code}) • {profile.categoryName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* Method Selector Cards */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              Select Valuation Method:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {methods.map((m) => {
                const isSelected = method === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    style={{
                      border: isSelected ? `2px solid ${m.color}` : '1px solid var(--border-color)',
                      background: isSelected ? m.bg : 'var(--bg-secondary)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: isSelected ? `5px solid ${m.color}` : '2px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      marginTop: '2px',
                      flexShrink: 0
                    }} />

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '13px', color: isSelected ? m.color : 'var(--text-primary)' }}>
                          {m.name}
                        </strong>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--bg-tertiary)',
                          color: isSelected ? m.color : 'var(--text-secondary)'
                        }}>
                          {m.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '3px 0 0 0', lineHeight: '1.35' }}>
                        {m.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Standard Cost Reference Input */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Standard Cost Reference (₹ per {profile.uom}):
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 12px',
              background: 'var(--bg-secondary)'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '6px' }}>₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={stdCost}
                onChange={(e) => setStdCost(e.target.value)}
                required
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Used as the fixed master benchmark for Purchase Price Variance (PPV) calculations.
            </div>
          </div>

          {/* Simulated Impact Box */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Stores Stock</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {fmtQty(onHand)} {profile.uom}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Asset Value</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#047857', marginTop: '2px' }}>
                {fmtMoney(simulatedActiveVal)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Variance vs Std</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: simulatedVariance >= 0 ? '#047857' : '#d97706',
                marginTop: '2px'
              }}>
                {simulatedVariance >= 0 ? '+' : ''}{fmtMoney(simulatedVariance)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#059669',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={14} />
              {saving ? 'Saving Policy...' : 'Save Costing Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ValuationMethodModal;
