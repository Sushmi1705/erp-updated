import React from 'react';
import { X, Plus, AlertCircle, ShoppingCart } from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const POCreateModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  saving,
  rfqs = [],
  vendors = [],
  materials = []
}) => {
  if (!isOpen) return null;

  const handleRfqSelect = (e) => {
    const rfqId = e.target.value;
    const rfq = rfqs.find(r => r._id === rfqId);
    if (rfq) {
      const winningQuote = rfq.bids?.find(q => q.status === 'Awarded') || rfq.receivedQuotations?.find(q => q.selected);
      const lineItem = rfq.items?.[0] || {};
      if (winningQuote) {
        setFormData({
          ...formData,
          rfqId: rfqId,
          vendorId: winningQuote.vendorId?._id || winningQuote.vendorId,
          items: [{
            materialId: lineItem.materialId?._id || rfq.materialId,
            quantity: lineItem.requestedQty || rfq.quantity || 1,
            unitPrice: winningQuote.offeredUnitPrice || winningQuote.quoteAmount || 0,
            scheduledDeliveryDate: new Date(Date.now() + (winningQuote.offeredLeadTimeDays || winningQuote.leadTimeDays || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }]
        });
      }
    } else {
      setFormData({
        ...formData,
        rfqId: '',
        vendorId: '',
        items: [{}]
      });
    }
  };

  const currentItem = formData.items?.[0] || {};
  const estimatedTotal = (Number(currentItem.quantity) || 0) * (Number(currentItem.unitPrice) || 0);

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
        maxWidth: '680px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
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
              Raise New Purchase Order (PO)
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Direct supplier contract commitment, line items, commercial payment terms & incoterms.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSave} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Copy from RFQ option */}
          <div style={{
            background: 'var(--surface-canvas)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Copy from an Awarded Price Request (Optional)
            </label>
            <select
              value={formData.rfqId || ''}
              onChange={handleRfqSelect}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">-- Direct Manual Order (Type supplier and rates myself) --</option>
              {rfqs.map(r => (
                <option key={r._id} value={r._id}>
                  {r.rfqNumber}: {r.title} (Awarded Supplier: {r.bids?.find(q => q.status === 'Awarded')?.vendorId?.name || 'Partner'})
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Supplier / Vendor *
            </label>
            <select
              required
              value={formData.vendorId || ''}
              onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
              disabled={!!formData.rfqId}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12.5px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="" disabled>-- Select certified supplier --</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>
                  {v.name} ({v.vendorCode || 'VND'})
                </option>
              ))}
            </select>
          </div>

          {/* Commercial Terms Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Payment Terms *
              </label>
              <select
                required
                value={formData.paymentTerms || 'Net30'}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="Net30">Net 30 Days after bill</option>
                <option value="Net45">Net 45 Days after bill</option>
                <option value="Net60">Net 60 Days after bill</option>
                <option value="Due on Receipt">Due on Goods Receipt</option>
                <option value="Advance">100% Advance Payment</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Incoterms (Freight & Risk) *
              </label>
              <select
                required
                value={formData.incoterms || 'DDP'}
                onChange={(e) => setFormData({ ...formData, incoterms: e.target.value })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="DDP">DDP - Delivered Duty Paid (At Plant Gate)</option>
                <option value="FOB">FOB - Free on Board (Buyer Arranges Freight)</option>
                <option value="EXW">EXW - Ex-Works (Collect at Supplier Factory)</option>
                <option value="CIF">CIF - Cost, Insurance and Freight</option>
              </select>
            </div>
          </div>

          {/* Material Scope & Quantities */}
          <div style={{
            background: 'var(--surface-canvas)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Order Line Item Details
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Material / Component Part *
                </label>
                <select
                  required
                  value={currentItem.materialId || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    items: [{ ...currentItem, materialId: e.target.value }]
                  })}
                  disabled={!!formData.rfqId}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="" disabled>-- Select part from inventory master --</option>
                  {materials.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.code || 'MAT'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Order Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 50"
                  value={currentItem.quantity || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    items: [{ ...currentItem, quantity: parseInt(e.target.value, 10) }]
                  })}
                  disabled={!!formData.rfqId}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Unit Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 62500"
                  value={currentItem.unitPrice || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    items: [{ ...currentItem, unitPrice: parseFloat(e.target.value) }]
                  })}
                  disabled={!!formData.rfqId}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Promised Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  value={currentItem.scheduledDeliveryDate || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    items: [{ ...currentItem, scheduledDeliveryDate: e.target.value }]
                  })}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Estimated Total Calculation */}
            {estimatedTotal > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-color)',
                fontSize: '12px'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Contract Payable:</span>
                <strong style={{ fontSize: '14px', color: '#059669', fontFamily: 'var(--font-mono)' }}>
                  {fmtMoneyFull(estimatedTotal)}
                </strong>
              </div>
            )}
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
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
              }}
            >
              {saving ? 'Creating Order...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default POCreateModal;
