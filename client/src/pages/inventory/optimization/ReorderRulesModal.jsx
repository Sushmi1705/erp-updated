import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Settings, AlertTriangle, CheckCircle2, BarChart3, Clock } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { notify } from '../../../utils/notify';

const ReorderRulesModal = ({
  isOpen,
  onClose,
  parameters = {},
  onSuccess
}) => {
  const { addToast } = useToast();
  const [classA, setClassA] = useState(70);
  const [classB, setClassB] = useState(20);
  const [classC, setClassC] = useState(10);
  const [deadDays, setDeadDays] = useState(180);
  const [serviceLevel, setServiceLevel] = useState(95);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setClassA(parameters.ABC_Class_A_Percentage || 70);
      setClassB(parameters.ABC_Class_B_Percentage || 20);
      setClassC(parameters.ABC_Class_C_Percentage || 10);
      setDeadDays(parameters.Dead_Stock_Threshold_Days || 180);
      setServiceLevel(parameters.Default_Service_Level_Percent || 95);
    }
  }, [isOpen, parameters]);

  if (!isOpen) return null;

  const totalShare = Number(classA) + Number(classB) + Number(classC);
  const isSumValid = totalShare === 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSumValid) {
      setErrorMsg(`ABC percentage shares must sum to exactly 100% (currently ${totalShare}%).`);
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      await axios.post('/inventory/v2/optimization/parameters', {
        ABC_Class_A_Percentage: Number(classA),
        ABC_Class_B_Percentage: Number(classB),
        ABC_Class_C_Percentage: Number(classC),
        Dead_Stock_Threshold_Days: Number(deadDays),
        Default_Service_Level_Percent: Number(serviceLevel)
      });

      addToast({
        type: 'success',
        title: 'Optimization Rules Updated',
        message: 'Successfully updated ABC Pareto parameters and dead stock thresholds.'
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Save rules error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update optimization parameters.';
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
          maxWidth: '560px',
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
            <Settings size={18} color="#fde047" />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                Inventory Optimization Parameters
              </h3>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Plant Working Capital Rules & Inactivity Thresholds
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
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: ABC Pareto Stratification */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={15} color="#b45309" />
                ABC Pareto Stratification Target (% Share of Value)
              </h4>
              <span style={{ fontSize: '11px', fontWeight: 700, color: isSumValid ? '#059669' : '#dc2626' }}>
                Total: {totalShare}% {isSumValid ? '✓' : '(Must be 100%)'}
              </span>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
              Controls the capital cutoffs used by the automated analysis algorithm to group plant materials.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Class A Share (%):
                </label>
                <input
                  type="number"
                  min="1"
                  max="98"
                  required
                  value={classA}
                  onChange={(e) => setClassA(e.target.value)}
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
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Top Capital SKUs</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Class B Share (%):
                </label>
                <input
                  type="number"
                  min="1"
                  max="98"
                  required
                  value={classB}
                  onChange={(e) => setClassB(e.target.value)}
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
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Moderate Value</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Class C Share (%):
                </label>
                <input
                  type="number"
                  min="1"
                  max="98"
                  required
                  value={classC}
                  onChange={(e) => setClassC(e.target.value)}
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
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Bulk Consumables</span>
              </div>
            </div>
          </div>

          {/* Section 2: Inactivity & Service Level Thresholds */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Dead Stock Limit (Days):
              </label>
              <input
                type="number"
                min="30"
                max="730"
                required
                value={deadDays}
                onChange={(e) => setDeadDays(e.target.value)}
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
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Flag stock dead after this period without issue</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Target Service Level (%):
              </label>
              <input
                type="number"
                min="80"
                max="99"
                required
                value={serviceLevel}
                onChange={(e) => setServiceLevel(e.target.value)}
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
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Stockout prevention confidence</span>
            </div>
          </div>

          {/* Notice */}
          <div 
            style={{
              backgroundColor: 'rgba(180, 83, 9, 0.08)',
              borderRadius: '8px',
              padding: '10px 12px',
              border: '1px solid rgba(180, 83, 9, 0.2)',
              fontSize: '11px',
              color: '#78350f',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <CheckCircle2 size={16} color="#b45309" style={{ flexShrink: 0 }} />
            <span>
              Updated rules take effect globally the next time you trigger <strong>"Check All Materials"</strong>. Manual override profiles are protected from automated reset.
            </span>
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
              disabled={saving || !isSumValid}
              style={{
                padding: '9px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#b45309',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saving || !isSumValid ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {saving ? 'Updating Parameters...' : 'Save Optimization Rules'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReorderRulesModal;
