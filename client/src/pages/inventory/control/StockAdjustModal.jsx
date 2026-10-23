import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle, AlertTriangle, Layers, Edit3, ArrowRight } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';

const StockAdjustModal = ({
  isOpen,
  onClose,
  preselectedItem,
  inventoryData = [],
  onSuccess
}) => {
  const { addToast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState('');
  const [countedQty, setCountedQty] = useState('');
  const [reason, setReason] = useState('Physical Cycle Count Discrepancy');
  const [referenceDoc, setReferenceDoc] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (preselectedItem) {
        setSelectedItemId(preselectedItem._id);
        setCountedQty(String(preselectedItem.Total_On_Hand || ''));
      } else if (inventoryData.length > 0) {
        setSelectedItemId(inventoryData[0]._id);
        setCountedQty(String(inventoryData[0].Total_On_Hand || ''));
      }
      setReferenceDoc(`CC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [isOpen, preselectedItem, inventoryData]);

  if (!isOpen) return null;

  const currentItem = inventoryData.find(i => i._id === selectedItemId) || preselectedItem || {};
  const currentOnHand = currentItem.Total_On_Hand || 0;
  const numCounted = parseFloat(countedQty);
  const isValidCount = !isNaN(numCounted) && numCounted >= 0;
  const adjustmentDelta = isValidCount ? numCounted - currentOnHand : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidCount) {
      setErrorMsg('Please enter a valid non-negative physical count quantity.');
      return;
    }

    if (adjustmentDelta === 0) {
      setErrorMsg('Physical count matches system on-hand exactly. No adjustment required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // Find material ID and warehouse ID
      const materialId = currentItem.materialId || currentItem._id;
      const warehouseId = currentItem.warehouseId;

      await axios.post('/inventory/transactions', {
        transactionType: 'Stock Adjustment',
        materialId,
        quantity: adjustmentDelta,
        sourceWarehouseId: warehouseId,
        referenceDocument: referenceDoc || 'Cycle Count Audit',
        notes: `Reason: ${reason}. Notes: ${notes || 'Physical cycle count reconciliation'}`
      });

      addToast({
        type: 'success',
        title: 'Stock Adjustment Recorded',
        message: `Successfully adjusted ${currentItem.Product_Name} by ${adjustmentDelta > 0 ? '+' : ''}${adjustmentDelta} ${currentItem.uom || 'KG'}.`
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Stock adjustment error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to record stock adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '20px'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '16px 20px',
            backgroundColor: '#065f46',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit3 size={18} color="#34d399" />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                Cycle Count Physical Stock Adjustment
              </h3>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
                IATF 16949 Physical Store Count Reconciliation
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select Material */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Selected Part / Material:
            </label>
            {preselectedItem ? (
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                  {currentItem.Product_Name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Code: {currentItem.Product_Code} • Store: {currentItem.Warehouse}
                </div>
              </div>
            ) : (
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  const found = inventoryData.find(i => i._id === e.target.value);
                  if (found) setCountedQty(String(found.Total_On_Hand || ''));
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                {inventoryData.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.Product_Name} ({item.Product_Code}) — {item.Warehouse}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Current vs Counted Comparison Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>System Book Qty</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {currentOnHand.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500 }}>{currentItem.uom || 'KG'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Physical Count</div>
              <input
                type="number"
                step="any"
                min="0"
                value={countedQty}
                onChange={(e) => setCountedQty(e.target.value)}
                placeholder="Counted"
                required
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  marginTop: '2px',
                  borderRadius: '4px',
                  border: '1px solid #059669',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Variance Delta</div>
              <div 
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  marginTop: '2px',
                  color: adjustmentDelta === 0 ? 'var(--text-secondary)' : (adjustmentDelta > 0 ? '#059669' : '#dc2626')
                }}
              >
                {isValidCount ? `${adjustmentDelta > 0 ? '+' : ''}${adjustmentDelta.toLocaleString()}` : '--'} <span style={{ fontSize: '11px', fontWeight: 500 }}>{currentItem.uom || 'KG'}</span>
              </div>
            </div>
          </div>

          {/* Reason Code */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Adjustment Reason:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="Physical Cycle Count Discrepancy">Physical Cycle Count Discrepancy</option>
              <option value="Production Scrap / Spoilage Variation">Production Scrap / Spoilage Variation</option>
              <option value="Incoming Inspection Sampling Loss">Incoming Inspection Sampling Loss</option>
              <option value="Reconciliation Correction">Reconciliation Correction</option>
              <option value="Damaged in Bay Handling">Damaged in Bay Handling</option>
            </select>
          </div>

          {/* Reference Doc & Remarks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Audit Ref #:
              </label>
              <input
                type="text"
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Storekeeper Notes:
              </label>
              <input
                type="text"
                placeholder="e.g. Rack A-10 physical verification"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !isValidCount || adjustmentDelta === 0}
              style={{
                padding: '9px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: adjustmentDelta === 0 ? 'var(--bg-tertiary)' : '#059669',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: submitting || !isValidCount || adjustmentDelta === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {submitting ? (
                <span>Posting Adjustment...</span>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Confirm Count Adjustment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustModal;
