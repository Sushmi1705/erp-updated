import React from 'react';
import { X, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const POInvoiceMatchModal = ({
  isOpen,
  onClose,
  invoiceData,
  setInvoiceData,
  onSave,
  saving,
  selectedPo
}) => {
  if (!isOpen || !selectedPo) return null;

  const currentItem = selectedPo.items?.[0] || {};
  const poQty = currentItem.orderQty || currentItem.quantity || 1;
  const poRate = currentItem.unitPrice || 0;
  const receivedQty = currentItem.receivedQty || 0;

  const invoicedQty = Number(invoiceData.invoicedQty) || poQty;
  const invoicedRate = Number(invoiceData.invoiceUnitPrice) || poRate;

  const isQtyMismatch = invoicedQty > receivedQty;
  const isRateMismatch = invoicedRate > poRate;
  const hasMismatch = isQtyMismatch || isRateMismatch;

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
        maxWidth: '540px',
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
              3-Way Matching & Bill Clearance
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Automated audit: Purchase Order vs Inward GRN vs Supplier Tax Bill.
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
          {/* Reference Banner */}
          <div style={{
            background: 'var(--surface-canvas)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '12px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Contract PO Rate:</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{fmtMoneyFull(poRate)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Physical GRN Received:</span>
              <strong style={{ color: '#059669' }}>{receivedQty} Units</strong>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Quantity Billed on Tax Invoice *
              </label>
              <input
                type="number"
                min="1"
                required
                value={invoiceData.invoicedQty || ''}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoicedQty: parseInt(e.target.value, 10) })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12.5px',
                  borderRadius: '6px',
                  border: isQtyMismatch ? '1.5px solid #dc2626' : '1px solid var(--border-color)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Rate per Unit on Invoice (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={invoiceData.invoiceUnitPrice || ''}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoiceUnitPrice: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12.5px',
                  borderRadius: '6px',
                  border: isRateMismatch ? '1.5px solid #dc2626' : '1px solid var(--border-color)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Verification Status Feedback */}
          {hasMismatch ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Tolerance Block Warning:</strong>
                {isQtyMismatch && <div>• Invoiced quantity ({invoicedQty}) exceeds stores received quantity ({receivedQty}).</div>}
                {isRateMismatch && <div>• Invoiced rate ({fmtMoneyFull(invoicedRate)}) exceeds agreed PO rate ({fmtMoneyFull(poRate)}).</div>}
                Payment will be placed on commercial hold.
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldCheck size={16} />
              <span><strong>3-Way Match Verified:</strong> Bill values match the purchase order and physical receipt exactly. Bill will be cleared for accounts payable.</span>
            </div>
          )}

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
                background: hasMismatch ? '#dc2626' : '#059669',
                color: '#ffffff',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Validating Match...' : 'Execute 3-Way Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default POInvoiceMatchModal;
