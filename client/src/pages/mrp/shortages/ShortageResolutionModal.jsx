import React from 'react';
import { X, ShieldAlert, CheckCircle, FileText, ArrowRight, Clock } from 'lucide-react';

export const ShortageResolutionModal = ({
  isOpen,
  onClose,
  selectedItem,
  actionType,
  setActionType,
  referenceDocNo,
  setReferenceDocNo,
  onSubmit,
  busy = false
}) => {
  if (!isOpen) return null;

  const itemName = selectedItem?.itemId?.name || 'Constraint Item';
  const itemCode = selectedItem?.itemId?.code || '';
  const category = selectedItem?.shortageCategory || 'Deficit';
  const shortageQty = Number(selectedItem?.shortageQty) || 0;
  const severity = selectedItem?.severity || 'High';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-primary, #ffffff)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        border: '1px solid var(--border-color, #cbd5e1)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        animation: 'fadeInScale 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626'
            }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                Log Shortage Mitigation Action
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
                Update deficit containment and track in the audit resolution log
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              display: 'flex',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={onSubmit} style={{ padding: '24px' }}>
          {/* Target Item Context Pill */}
          <div style={{
            padding: '12px 14px',
            background: 'var(--bg-secondary, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
                {category}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: severity === 'Critical' ? '#dc2626' : '#d97706',
                background: severity === 'Critical' ? '#fee2e2' : '#fef3c7',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                {severity} Severity
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#1e293b' }}>
                  {itemName}
                </span>
                {itemCode && (
                  <span style={{
                    marginLeft: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11.5px',
                    color: '#64748b'
                  }}>
                    [{itemCode}]
                  </span>
                )}
              </div>
              {shortageQty > 0 && (
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#dc2626'
                }}>
                  Short: {shortageQty.toLocaleString()} units
                </span>
              )}
            </div>
          </div>

          {/* Action Type */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary, #1e293b)',
              marginBottom: '6px'
            }}>
              Mitigation Action Type *
            </label>
            <select
              required
              value={actionType}
              onChange={e => setActionType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-primary, #ffffff)',
                fontSize: '13px',
                color: 'var(--text-primary, #1e293b)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Expedite PO">Expedite PO — Request urgent supplier advance dispatch</option>
              <option value="Substitute Item">Substitute Item — Utilize engineering-approved alternate raw material</option>
              <option value="Delay Work Order">Delay Work Order — Reschedule downstream pressing / assembly line</option>
              <option value="Create Transfer">Create Transfer — Transfer buffer inventory from secondary plant/store</option>
            </select>
          </div>

          {/* Reference Doc Number */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary, #1e293b)',
              marginBottom: '6px'
            }}>
              Reference Document Number (Optional)
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--border-color, #cbd5e1)',
              borderRadius: '8px',
              padding: '8px 12px',
              gap: '8px',
              background: 'var(--bg-primary, #ffffff)'
            }}>
              <FileText size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="e.g. PO-2026-0044, WO-2026-0012, or TR-092"
                value={referenceDocNo}
                onChange={e => setReferenceDocNo(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  width: '100%',
                  color: 'var(--text-primary, #1e293b)'
                }}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
              Linking an active Purchase Order or Work Order ties this mitigation directly into ERP trace logs.
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '24px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-secondary, #f8fafc)',
                color: 'var(--text-secondary, #64748b)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}
            >
              {busy ? (
                <>
                  <Clock size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving Action…
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  Record Mitigation Action
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
