import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, FileText, CheckCircle2, AlertCircle, Building2, Layers } from 'lucide-react';

const WOCreateModal = ({ 
  isOpen, 
  onClose, 
  productionPlans = [], 
  materials = [], 
  plants = [], 
  onSubmit, 
  busy 
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    Source_Plan_ID: '',
    Plant_ID: '',
    details: [
      {
        Material_ID: '',
        Target_Quantity: 1000,
        UOM_ID: '',
        BOM_Revision_ID: ''
      }
    ]
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Auto-select first plant if available
  useEffect(() => {
    if (plants.length > 0 && !formData.Plant_ID) {
      setFormData(prev => ({ ...prev, Plant_ID: plants[0]._id }));
    }
  }, [plants]);

  const handlePlanChange = (planId) => {
    const selectedPlan = productionPlans.find(p => p._id === planId);
    if (selectedPlan) {
      const autoPlant = selectedPlan.Plant_ID?._id || selectedPlan.Plant_ID || formData.Plant_ID;
      let autoDetails = [];

      if (selectedPlan.details && selectedPlan.details.length > 0) {
        autoDetails = selectedPlan.details.map(d => ({
          Material_ID: d.Material_ID?._id || d.Material_ID || '',
          Target_Quantity: Number(d.Target_Quantity) || 1000,
          UOM_ID: d.UOM_ID?._id || d.UOM_ID || '',
          BOM_Revision_ID: d.BOM_Revision_ID?._id || d.BOM_Revision_ID || ''
        }));
      } else {
        autoDetails = [{
          Material_ID: materials[0]?._id || '',
          Target_Quantity: 5000,
          UOM_ID: '',
          BOM_Revision_ID: ''
        }];
      }

      setFormData({
        ...formData,
        Source_Plan_ID: planId,
        Plant_ID: autoPlant,
        details: autoDetails
      });
    } else {
      setFormData(prev => ({ ...prev, Source_Plan_ID: planId }));
    }
  };

  const updateLineItem = (index, field, value) => {
    const nextDetails = [...formData.details];
    nextDetails[index] = { ...nextDetails[index], [field]: value };
    setFormData(prev => ({ ...prev, details: nextDetails }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      details: [
        ...prev.details,
        {
          Material_ID: materials[0]?._id || '',
          Target_Quantity: 1000,
          UOM_ID: '',
          BOM_Revision_ID: ''
        }
      ]
    }));
  };

  const removeLineItem = (index) => {
    if (formData.details.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.Source_Plan_ID) {
      return setErrorMsg('Please choose an approved production plan.');
    }
    if (!formData.Plant_ID) {
      return setErrorMsg('Please choose an automotive manufacturing plant.');
    }
    for (let i = 0; i < formData.details.length; i++) {
      const d = formData.details[i];
      if (!d.Material_ID) {
        return setErrorMsg(`Line #${i + 1}: Please select a material.`);
      }
      if (!d.Target_Quantity || d.Target_Quantity <= 0) {
        return setErrorMsg(`Line #${i + 1}: Target quantity must be greater than 0.`);
      }
    }
    setErrorMsg('');
    onSubmit(formData);
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
        maxWidth: '680px',
        maxHeight: '90vh',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(245, 158, 11, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
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
              <Plus size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                Release New Work Order (Job Traveler)
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                Generate shop-floor traveler from an Approved Production Plan
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
              padding: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Plan & Plant Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Source Production Plan *
              </label>
              <select
                required
                value={formData.Source_Plan_ID}
                onChange={(e) => handlePlanChange(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  backgroundColor: '#161e2c',
                  border: '1px solid #232d3f',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                <option value="" disabled>Choose an approved production plan</option>
                {productionPlans.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.Plan_Number} — {p.Plan_Type || 'Automotive Master'} ({p.Status})
                  </option>
                ))}
              </select>
              {productionPlans.length === 0 && (
                <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '4px' }}>
                  No approved plans found. Create one under Production → Production Plan.
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Manufacturing Plant *
              </label>
              <select
                required
                value={formData.Plant_ID}
                onChange={(e) => setFormData({ ...formData, Plant_ID: e.target.value })}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  backgroundColor: '#161e2c',
                  border: '1px solid #232d3f',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                <option value="" disabled>Choose manufacturing plant</option>
                {plants.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Part Lines Section */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #1e293b',
              paddingBottom: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Job Traveler Part Lines
              </span>
              <button
                type="button"
                onClick={addLineItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '4px',
                  color: '#fbbf24',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} /> Add Part Line
              </button>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {formData.details.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#121722',
                    border: '1px solid #232d3f',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: '1.8fr 1fr auto',
                    gap: '10px',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Material / Part Component *</label>
                    <select
                      required
                      value={row.Material_ID}
                      onChange={(e) => updateLineItem(idx, 'Material_ID', e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '2px',
                        padding: '6px 8px',
                        backgroundColor: '#161e2c',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                    >
                      <option value="" disabled>Choose material</option>
                      {materials.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.code || 'MAT'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Target Qty (pcs) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={row.Target_Quantity}
                      onChange={(e) => updateLineItem(idx, 'Target_Quantity', parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        marginTop: '2px',
                        padding: '6px 8px',
                        backgroundColor: '#161e2c',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div style={{ paddingTop: '16px' }}>
                    <button
                      type="button"
                      disabled={formData.details.length <= 1}
                      onClick={() => removeLineItem(idx)}
                      style={{
                        padding: '6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: formData.details.length <= 1 ? '#334155' : '#ef4444',
                        cursor: formData.details.length <= 1 ? 'not-allowed' : 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IATF Note banner */}
          <div style={{
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            color: '#22d3ee',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FileText size={15} />
            <span>
              Work orders automatically inherit BOM effectivity revisions and reserve staged coils in the shop warehouse.
            </span>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid #1e293b',
            paddingTop: '14px'
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
              disabled={busy || !formData.Source_Plan_ID}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                backgroundColor: '#f59e0b',
                border: 'none',
                color: '#0b0f17',
                fontSize: '12px',
                fontWeight: 700,
                cursor: busy || !formData.Source_Plan_ID ? 'not-allowed' : 'pointer',
                opacity: busy || !formData.Source_Plan_ID ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {busy ? 'Generating…' : (
                <>
                  <CheckCircle2 size={14} /> Generate Work Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WOCreateModal;
