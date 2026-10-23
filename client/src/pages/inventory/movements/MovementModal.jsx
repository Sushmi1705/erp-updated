import React, { useState } from 'react';
import axios from 'axios';
import { 
  X, Plus, Trash2, ShieldAlert, CheckCircle, 
  ArrowLeftRight, Factory, Warehouse, RotateCcw, 
  Scale, AlertTriangle, FileText, CheckCircle2 
} from 'lucide-react';
import { notify } from '../../../utils/notify';
import { useToast } from '../../../components/common/Toast';

const TXN_TYPES = [
  {
    id: 'Material Issue',
    label: 'Issue to Shop Floor',
    subtitle: 'Issue raw materials or parts to work order on press / weld shop',
    icon: Factory,
    requiresDest: false
  },
  {
    id: 'Transfer',
    label: 'Move Between Stores',
    subtitle: 'Relocate inventory between plant bays and buffer locations',
    icon: Warehouse,
    requiresDest: true
  },
  {
    id: 'Adjustment',
    label: 'Correction After Counting',
    subtitle: 'Reconcile physical cycle count audit discrepancies',
    icon: Scale,
    requiresDest: false
  },
  {
    id: 'Return',
    label: 'Return Back into Store',
    subtitle: 'Return unconsumed offcuts or WIP parts back to stores',
    icon: RotateCcw,
    requiresDest: false
  }
];

const MovementModal = ({
  isOpen,
  onClose,
  materials = [],
  warehouses = [],
  onSuccess
}) => {
  const { addToast } = useToast();
  const [txnType, setTxnType] = useState('Material Issue');
  const [refDocType, setRefDocType] = useState('Work Order');
  const [refDocNumber, setRefDocNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([
    { Material_ID: '', Quantity: '', Source_WH_ID: '', Dest_WH_ID: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAddLine = () => {
    // Default source warehouse from first warehouse if available
    const defaultWh = warehouses.length > 0 ? warehouses[0]._id : '';
    setLines(prev => [
      ...prev,
      { Material_ID: '', Quantity: '', Source_WH_ID: defaultWh, Dest_WH_ID: '' }
    ]);
  };

  const handleRemoveLine = (index) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const selectedTypeConfig = TXN_TYPES.find(t => t.id === txnType) || TXN_TYPES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!lines || lines.length === 0) {
      setErrorMsg('Please specify at least one material line.');
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!l.Material_ID) {
        setErrorMsg(`Line #${i + 1}: Please select a material.`);
        return;
      }
      const qty = parseFloat(l.Quantity);
      if (isNaN(qty) || qty <= 0) {
        setErrorMsg(`Line #${i + 1}: Quantity must be greater than zero.`);
        return;
      }
      if (['Material Issue', 'Transfer'].includes(txnType) && !l.Source_WH_ID) {
        setErrorMsg(`Line #${i + 1}: Please select a source warehouse.`);
        return;
      }
      if (txnType === 'Transfer') {
        if (!l.Dest_WH_ID) {
          setErrorMsg(`Line #${i + 1}: Please select a destination warehouse.`);
          return;
        }
        if (l.Source_WH_ID === l.Dest_WH_ID) {
          setErrorMsg(`Line #${i + 1}: Source and destination warehouses cannot be identical.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        Txn_Type: txnType,
        Ref_Doc_Type: refDocType,
        Ref_Doc_Number: refDocType === 'None' ? '' : refDocNumber,
        lines: lines.map(l => ({
          Material_ID: l.Material_ID,
          Quantity: Number(l.Quantity),
          Source_WH_ID: l.Source_WH_ID || (warehouses[0]?._id || null),
          Dest_WH_ID: txnType === 'Material Issue' ? null : (l.Dest_WH_ID || null)
        }))
      };

      const res = await axios.post('/inventory/v2/transactions', payload);

      addToast({
        type: 'success',
        title: 'Stock Movement Executed',
        message: `Successfully posted ${res.data.data?.Txn_Number || 'movement'} with ${lines.length} items.`
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Record movement error:', err);
      const msg = err.response?.data?.message || err.message || 'Could not record stock movement.';
      setErrorMsg(msg);
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
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
          maxWidth: '860px',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '16px 22px',
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowLeftRight size={18} color="#60a5fa" />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                Record Stock Movement
              </h3>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Plant 1 Stores Dispatch, Inter-Store Transfer & Return Terminal
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Movement Type Selector Cards */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              1. What kind of stock movement is this?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {TXN_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = txnType === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => setTxnType(t.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-secondary)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#2563eb' : 'var(--bg-tertiary)', color: isSelected ? '#ffffff' : 'var(--text-secondary)' }}>
                        <Icon size={14} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '12px', color: isSelected ? '#1e40af' : 'var(--text-primary)' }}>
                        {t.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.3, marginTop: '2px' }}>
                      {t.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Reference Document Linkage */}
          <div style={{ padding: '14px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              2. Reference Document & Order Linkage
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Document Type:
                </label>
                <select
                  value={refDocType}
                  onChange={(e) => setRefDocType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                >
                  <option value="Work Order">Work Order (Shopfloor Production)</option>
                  <option value="Purchase Order">Purchase Order (PO)</option>
                  <option value="Sales Order">Sales Order (Customer Order)</option>
                  <option value="None">None (Standalone Store Movement)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Document Reference Number:
                </label>
                <input
                  type="text"
                  placeholder={refDocType === 'Work Order' ? 'e.g. WO-2026-3005' : refDocType === 'Purchase Order' ? 'e.g. PO-2026-1029' : 'e.g. STO-2026-0044'}
                  value={refDocNumber}
                  onChange={(e) => setRefDocNumber(e.target.value)}
                  disabled={refDocType === 'None'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: refDocType === 'None' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Material Line Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                3. Materials & Quantities Moved ({lines.length} Line{lines.length > 1 ? 's' : ''})
              </label>

              <button
                type="button"
                onClick={handleAddLine}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #2563eb',
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  color: '#2563eb',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} />
                <span>Add Material Line</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lines.map((line, index) => {
                const selectedMat = materials.find(m => m._id === line.Material_ID);

                return (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2.5fr 1.2fr 2fr 2fr auto',
                      gap: '8px',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {/* Material Select */}
                    <div>
                      <select
                        required
                        value={line.Material_ID}
                        onChange={(e) => updateLine(index, 'Material_ID', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      >
                        <option value="" disabled>Choose material</option>
                        {materials.map(m => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.code})
                          </option>
                        ))}
                      </select>
                      {selectedMat && (
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Standard: ₹{selectedMat.standardCost || 0} • {selectedMat.grade || 'Std Grade'}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        placeholder="Qty"
                        required
                        value={line.Quantity}
                        onChange={(e) => updateLine(index, 'Quantity', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Source Warehouse */}
                    <div>
                      <select
                        required={['Material Issue', 'Transfer'].includes(txnType)}
                        value={line.Source_WH_ID}
                        onChange={(e) => updateLine(index, 'Source_WH_ID', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      >
                        <option value="" disabled>From store</option>
                        {warehouses.map(w => (
                          <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Destination Warehouse */}
                    <div>
                      <select
                        disabled={txnType === 'Material Issue'}
                        required={txnType === 'Transfer'}
                        value={txnType === 'Material Issue' ? '' : line.Dest_WH_ID}
                        onChange={(e) => updateLine(index, 'Dest_WH_ID', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: txnType === 'Material Issue' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      >
                        <option value="" disabled>
                          {txnType === 'Material Issue' ? 'Shopfloor Line' : 'To store'}
                        </option>
                        {warehouses.map(w => (
                          <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Delete Line */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(index)}
                      disabled={lines.length === 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: lines.length === 1 ? 'var(--text-tertiary)' : '#dc2626',
                        cursor: lines.length === 1 ? 'not-allowed' : 'pointer',
                        padding: '4px'
                      }}
                      title="Remove this line"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Operational Ledger Notice */}
          <div 
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.06)',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <CheckCircle2 size={18} color="#2563eb" style={{ flexShrink: 0 }} />
            <div>
              <strong>Audit Ledger Rule:</strong> Upon submission, stock on hand in the source store is deducted atomically and a system batch tracking number is assigned. This entry becomes an immutable record in compliance with IATF 16949 storekeeper standards.
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {saving ? 'Posting Movement...' : 'Confirm & Execute Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovementModal;
