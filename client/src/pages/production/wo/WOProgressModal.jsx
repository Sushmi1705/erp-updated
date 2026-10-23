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
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0f141c',
        border: '1px solid #f59e0b',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(245, 158, 11, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#161e2c',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Target size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                Log Produced Parts — {workOrder.WO_Number}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
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
            backgroundColor: '#121824',
            border: '1px solid #232d3f',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Part Material</span>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginTop: '2px' }}>
                {detail.Material_ID?.name || 'Automotive Component'}
              </div>
              <div style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>
                {detail.Material_ID?.code || 'PART-AUTO'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target Order Qty</span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', marginTop: '2px', fontFamily: 'monospace' }}>
                {targetQty.toLocaleString()} pcs
              </div>
              <div style={{ fontSize: '10px', color: '#10b981' }}>
                Max ceiling (+5%): {maxAllowed.toLocaleString()} pcs
              </div>
            </div>
          </div>

          {/* Current vs New Progress Comparison */}
          <div style={{
            backgroundColor: '#121824',
            border: '1px solid #232d3f',
            borderRadius: '8px',
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Produced so far: <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>{currentProduced.toLocaleString()} pcs</strong></span>
              <span style={{ fontSize: '11px', color: '#22d3ee' }}>New Progress: <strong style={{ fontFamily: 'monospace' }}>{newProgressPct}%</strong></span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${Math.min(targetQty > 0 ? (currentProduced / targetQty) * 100 : 0, 100)}%`,
                backgroundColor: '#3b82f6',
                opacity: 0.6
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${Math.min(newProgressPct, 100)}%`,
                backgroundColor: newProgressPct >= 100 ? '#10b981' : '#f59e0b',
                transition: 'width 0.2s ease'
              }} />
            </div>
          </div>

          {/* Input Field with Quick Increments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
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
                  padding: '10px 14px',
                  backgroundColor: '#161e2c',
                  border: errorMsg ? '1px solid #ef4444' : '1px solid #f59e0b',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '16px',
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
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#38bdf8',
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
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  +{inc.toLocaleString()}
                </button>
              ))}
            </div>

            {errorMsg ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
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
            borderTop: '1px solid #1e293b',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
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
                backgroundColor: '#f59e0b',
                border: 'none',
                color: '#0b0f17',
                fontSize: '12px',
                fontWeight: 700,
                cursor: busy || !!errorMsg ? 'not-allowed' : 'pointer',
                opacity: busy || !!errorMsg ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
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
