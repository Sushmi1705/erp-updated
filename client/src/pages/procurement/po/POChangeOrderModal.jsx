import React from 'react';
import { X, RefreshCw, AlertTriangle } from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const POChangeOrderModal = ({
  isOpen,
  onClose,
  changeOrderData,
  setChangeOrderData,
  onSave,
  saving,
  selectedPo
}) => {
  if (!isOpen || !selectedPo) return null;

  const currentItem = selectedPo.items?.[0] || {};
  const oldQty = currentItem.orderQty || currentItem.quantity || 1;
  const oldPrice = currentItem.unitPrice || 0;
  const oldTotal = oldQty * oldPrice;

  const newQty = Number(changeOrderData.newQty) || oldQty;
  const newPrice = Number(changeOrderData.newPrice) || oldPrice;
  const newTotal = newQty * newPrice;
  const totalIncreased = newTotal > oldTotal;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--surface-card)',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface-canvas)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Create Change Order — {selectedPo.poNumber}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Creates Revision v{(selectedPo.version || 1) + 1} with formal commercial amendment.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {totalIncreased && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '6px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '12px',
              color: '#b45309'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Commercial Re-Approval Triggered:</strong> The amended total ({fmtMoneyFull(newTotal)}) is higher than the previous commitment ({fmtMoneyFull(oldTotal)}). This order will be paused and reset to Pending Approval.
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Revised Quantity (Current: {oldQty})
              </label>
              <input
                type="number"
                min="1"
                required
                value={changeOrderData.newQty || ''}
                onChange={(e) => setChangeOrderData({ ...changeOrderData, newQty: parseInt(e.target.value, 10) })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12.5px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Revised Rate per Unit (Current: {fmtMoneyFull(oldPrice)})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={changeOrderData.newPrice || ''}
                onChange={(e) => setChangeOrderData({ ...changeOrderData, newPrice: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12.5px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Variance Breakdown */}
          <div style={{
            background: 'var(--surface-canvas)',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Previous Commitment:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{fmtMoneyFull(oldTotal)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>New Amended Value:</span>
              <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>{fmtMoneyFull(newTotal)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '4px' }}>
              <span style={{ fontWeight: 600 }}>Variance / Difference:</span>
              <strong style={{ color: totalIncreased ? '#dc2626' : '#059669', fontFamily: 'var(--font-mono)' }}>
                {totalIncreased ? `+ ${fmtMoneyFull(newTotal - oldTotal)}` : `- ${fmtMoneyFull(oldTotal - newTotal)}`}
              </strong>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
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
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: '#059669',
                color: '#ffffff',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Processing Revision...' : 'Save Change Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default POChangeOrderModal;
