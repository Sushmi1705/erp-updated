import React, { useState } from 'react';
import { X, Plus, Sparkles, AlertCircle, ShieldCheck, Check } from 'lucide-react';

const TRACK_OPTIONS = [
  { value: 'Batch', label: 'Production Batch / Steel Mill Heat (one production run)', desc: 'Coil or billet heat sharing identical metallurgy & mill cert.' },
  { value: 'Lot', label: 'Supplier Lot (one supplier delivery)', desc: 'Delivery shipment of hardware, fasteners, or welding wire.' },
  { value: 'Serial Number', label: 'Serial Number (individual item tracking)', desc: 'Single serialized part (locks quantity to 1).' }
];

const BatchRegisterModal = ({
  isOpen,
  onClose,
  onRegister,
  materials = [],
  warehouses = [],
  saving = false
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    Tracking_Number: '',
    Tracking_Type: 'Batch',
    Material_ID: materials[0]?._id || '',
    Reference_Code: '',
    Mfg_Date: new Date().toISOString().split('T')[0],
    Expiry_Date: '',
    Current_WH_ID: warehouses[0]?._id || '',
    Current_Quantity: 1000,
    Current_Status: 'Active'
  });

  const handleGenerateHeatNumber = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const rand = Math.floor(10000 + Math.random() * 90000);
    const prefixes = ['PAC/HT', 'JSW/HT', 'TATA/HT', 'SAIL/HT'];
    const pfx = prefixes[Math.floor(Math.random() * prefixes.length)];
    setFormData(prev => ({
      ...prev,
      Tracking_Number: `${pfx}/${year}/${rand}`
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister({
      ...formData,
      Current_Quantity: formData.Tracking_Type === 'Serial Number' ? 1 : Number(formData.Current_Quantity) || 0
    });
  };

  const selectedMaterial = materials.find(m => m._id === formData.Material_ID);
  const isSteel = selectedMaterial?.categoryName?.toLowerCase().includes('steel') || selectedMaterial?.name?.toLowerCase().includes('coil');

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
        maxWidth: '640px',
        maxHeight: '92vh',
        boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
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
              Register Automotive Batch, Heat or Serial Lot
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Complies with IATF 16949 § 8.5.2 material origin identification requirements.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {/* Tracking Type */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Tracking Classification:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {TRACK_OPTIONS.map(opt => {
                  const isSelected = formData.Tracking_Type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, Tracking_Type: opt.value })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #0891b2' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(8, 145, 178, 0.1)' : 'var(--bg-secondary)',
                        color: isSelected ? '#0e7490' : 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease'
                      }}
                    >
                      <strong style={{ fontSize: '12px', display: 'block' }}>{opt.value}</strong>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                        {opt.value === 'Batch' ? 'Mill Heat / Coil' : opt.value === 'Lot' ? 'Delivery Lot' : 'Single Item'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Batch / Heat Number */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Batch / Heat Number (Required):
                </label>
                <button
                  type="button"
                  onClick={handleGenerateHeatNumber}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: 'none',
                    background: 'none',
                    color: '#0891b2',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={12} /> Auto-Generate Heat #
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. TATA/HT/26/44117 or JSW/HT/26/72841"
                value={formData.Tracking_Number}
                onChange={e => setFormData({ ...formData, Tracking_Number: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Material */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Material SKU:
              </label>
              <select
                required
                value={formData.Material_ID}
                onChange={e => setFormData({ ...formData, Material_ID: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              >
                <option value="" disabled>Select Material</option>
                {materials.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.code}) — {m.grade || 'Standard'}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier / Mill PO Ref */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Supplier Mill PO / Tag:
              </label>
              <input
                type="text"
                placeholder="e.g. PO-2026-2003"
                value={formData.Reference_Code}
                onChange={e => setFormData({ ...formData, Reference_Code: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* Initial Stores Quantity */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Stores Initial Quantity ({selectedMaterial?.uomId?.symbol || 'units'}):
              </label>
              <input
                type="number"
                min="1"
                disabled={formData.Tracking_Type === 'Serial Number'}
                value={formData.Tracking_Type === 'Serial Number' ? 1 : formData.Current_Quantity}
                onChange={e => setFormData({ ...formData, Current_Quantity: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Current Storage Location */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Storage Location / Bay:
              </label>
              <select
                value={formData.Current_WH_ID}
                onChange={e => setFormData({ ...formData, Current_WH_ID: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              >
                <option value="">Select Warehouse Bin</option>
                {warehouses.map(w => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Manufacturing / Inward Date */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Inward / Production Date:
              </label>
              <input
                type="date"
                required
                value={formData.Mfg_Date}
                onChange={e => setFormData({ ...formData, Mfg_Date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Use Before / Expiry (Optional):
              </label>
              <input
                type="date"
                value={formData.Expiry_Date}
                onChange={e => setFormData({ ...formData, Expiry_Date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                Leave empty for durable steel coils with indefinite shelf life.
              </span>
            </div>
          </div>

          {/* IATF Note */}
          <div style={{
            background: 'rgba(8, 145, 178, 0.08)',
            border: '1px solid rgba(8, 145, 178, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginTop: '16px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldCheck size={16} color="#0891b2" />
            Batch registered will immediately receive an IATF 16949 Route Traveler Tag and enter the active stores stock.
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
                background: '#0891b2',
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
              {saving ? 'Registering...' : 'Register Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchRegisterModal;
