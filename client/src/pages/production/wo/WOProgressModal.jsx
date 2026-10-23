import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, AlertTriangle, ArrowRight, X, Sparkles, Layers } from 'lucide-react';

const WOProgressModal = ({ isOpen, onClose, workOrder, onSubmit, busy }) => {
  if (!isOpen || !workOrder) return null;

  const detail = workOrder.details?.[0] || {};
  const targetQty = Number(detail.Target_Quantity) || 1000;
  const currentProduced = Number(detail.Produced_Quantity) || 0;
  const maxAllowed = Math.round(targetQty * 1.05);

  const [producedVal, setProducedVal] = useState(currentProduced);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setProducedVal(currentProduced);
    setErrorMsg('');
  }, [workOrder, currentProduced]);

  const handleValChange = (val) => {
    const num = Number(val);
    setProducedVal(val);
    if (num > maxAllowed) {
      setErrorMsg(`Blocked: Value exceeds 5% over-production ceiling (${maxAllowed.toLocaleString()} pcs max).`);
    } else if (num < 0) {
      setErrorMsg('Produced quantity cannot be negative.');
    } else {
      setErrorMsg('');
    }
  };

  const addIncrement = (inc) => {
    const next = Math.min(Number(producedVal || 0) + inc, maxAllowed);
    handleValChange(next);
  };

  const fillTarget = () => {
    handleValChange(targetQty);
  };

  const newProgressPct = targetQty > 0 ? Math.min(Math.round(((Number(producedVal) || 0) / targetQty) * 100), 105) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalVal = Number(producedVal);
    if (isNaN(finalVal) || finalVal < 0) {
      return setErrorMsg('Please enter a valid quantity.');
    }
    if (finalVal > maxAllowed) {
      return setErrorMsg(`Value exceeds 5% tolerance ceiling (${maxAllowed.toLocaleString()} pcs max).`);
    }
    onSubmit(workOrder._id, finalVal);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Target size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Log Produced Parts — {workOrder.WO_Number}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                Automotive Shift Output Booking & Cycle Tally
              </p>
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Part Spec Card */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Part Material</span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {detail.Material_ID?.name || 'Automotive Component'}
              </div>
              <div style={{ fontSize: '11px', color: '#0284c7', fontFamily: 'monospace', fontWeight: 600 }}>
                {detail.Material_ID?.code || 'PART-AUTO'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Target Order Qty</span>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px', fontFamily: 'monospace' }}>
                {targetQty.toLocaleString()} pcs
              </div>
              <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>
                Max ceiling (+5%): {maxAllowed.toLocaleString()} pcs
              </div>
            </div>
          </div>

          {/* Current vs New Progress Comparison */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#475569' }}>Produced so far: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{currentProduced.toLocaleString()} pcs</strong></span>
              <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>New Progress: <strong style={{ fontFamily: 'monospace' }}>{newProgressPct}%</strong></span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${Math.min(targetQty > 0 ? (currentProduced / targetQty) * 100 : 0, 100)}%`,
                backgroundColor: '#94a3b8',
                opacity: 0.5
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${Math.min(newProgressPct, 100)}%`,
                backgroundColor: newProgressPct >= 100 ? '#059669' : '#d97706',
                transition: 'width 0.2s ease'
              }} />
            </div>
          </div>

          {/* Input Field with Quick Increments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
              Cumulative Produced Quantity (Total pieces made so far) *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                min="0"
                max={maxAllowed}
                value={producedVal}
                onChange={(e) => handleValChange(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  backgroundColor: '#ffffff',
                  border: errorMsg ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#0f172a',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={fillTarget}
                style={{
                  padding: '0 16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#0284c7',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Target (100%)
              </button>
            </div>

            {/* Quick Increment Shortcuts */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              {[100, 250, 500, 1000].map(inc => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => addIncrement(inc)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  +{inc.toLocaleString()}
                </button>
              ))}
            </div>

            {errorMsg ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
                <AlertTriangle size={13} />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Note: Entering a value ≥ target automatically promotes Work Order status to Completed.
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '14px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !!errorMsg}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                backgroundColor: '#d97706',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: busy || !!errorMsg ? 'not-allowed' : 'pointer',
                opacity: busy || !!errorMsg ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(217, 119, 6, 0.25)'
              }}
            >
              {busy ? 'Updating…' : (
                <>
                  <CheckCircle2 size={14} /> Update Output
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WOProgressModal;
