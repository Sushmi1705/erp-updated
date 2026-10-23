import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Shield, AlertTriangle, CheckCircle2, Scale } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { notify } from '../../../utils/notify';

const ReorderProfileModal = ({
  isOpen,
  onClose,
  preselectedRow,
  materials = [],
  onSuccess
}) => {
  const { addToast } = useToast();
  const [materialId, setMaterialId] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [safetyStock, setSafetyStock] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (preselectedRow) {
        const mId = preselectedRow.Material_ID?._id || preselectedRow.Material_ID;
        setMaterialId(mId || '');
        setReorderLevel(String(preselectedRow.Reorder_Level || ''));
        setSafetyStock(String(preselectedRow.Safety_Stock || ''));
      } else if (materials.length > 0) {
        setMaterialId(materials[0]._id);
        setReorderLevel(String(materials[0].Reorder_Point || materials[0].reorderLevel || 1000));
        setSafetyStock(String(materials[0].Safety_Stock_Level || materials[0].minStock || 500));
      }
    }
  }, [isOpen, preselectedRow, materials]);

  if (!isOpen) return null;

  const selectedMaterial = materials.find(m => m._id === materialId) || preselectedRow?.Material_ID || {};
  const numReorder = parseFloat(reorderLevel) || 0;
  const numSafety = parseFloat(safetyStock) || 0;
  const isValid = numReorder >= numSafety && numReorder >= 0 && numSafety >= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!materialId) {
      setErrorMsg('Please select a material.');
      return;
    }
    if (numReorder < numSafety) {
      setErrorMsg('Reorder Level must be greater than or equal to Safety Stock buffer.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      await axios.post('/inventory/v2/optimization/profile', {
        Material_ID: materialId,
        Reorder_Level: numReorder,
        Safety_Stock: numSafety
      });

      addToast({
        type: 'success',
        title: 'Reorder Levels Saved',
        message: `Updated reorder policy for ${selectedMaterial.name || 'material'}. Marked as hand override.`
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Save reorder profile error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save reorder profile.';
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
          maxWidth: '520px',
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
            backgroundColor: '#78350f',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={18} color="#fde047" />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                Material Reorder & Safety Thresholds
              </h3>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
                IATF 16949 Material Replenishment Parameter Override
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

          {/* Material Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Target Material:
            </label>
            {preselectedRow ? (
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                  {selectedMaterial.name || 'Selected Material'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Code: {selectedMaterial.code || 'MAT-00X'} • Category: {preselectedRow.categoryName || 'Raw Material'}
                </div>
              </div>
            ) : (
              <select
                value={materialId}
                onChange={(e) => {
                  setMaterialId(e.target.value);
                  const found = materials.find(m => m._id === e.target.value);
                  if (found) {
                    setReorderLevel(String(found.Reorder_Point || found.reorderLevel || 1000));
                    setSafetyStock(String(found.Safety_Stock_Level || found.minStock || 500));
                  }
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
                {materials.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Threshold Inputs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Reorder Point (ROP):
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                placeholder="e.g. 3000"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                When ATP drops here, purchase is triggered
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Safety Stock Buffer:
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={safetyStock}
                onChange={(e) => setSafetyStock(e.target.value)}
                placeholder="e.g. 1500"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                Minimum floor to absorb supplier delay
              </span>
            </div>
          </div>

          {/* Hand Override Notice */}
          <div 
            style={{
              backgroundColor: 'rgba(217, 119, 6, 0.08)',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid rgba(217, 119, 6, 0.2)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <Shield size={18} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <strong>Manual Override Protection:</strong> Saving will mark this material as "Set by Hand", protecting these limits against being overwritten during automatic global ABC Pareto runs.
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
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
              disabled={saving || !isValid}
              style={{
                padding: '9px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#b45309',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saving || !isValid ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {saving ? 'Saving...' : 'Save Reorder Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReorderProfileModal;
