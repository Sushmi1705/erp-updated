import React from 'react';
import {
  Wrench, AlertTriangle, CheckCircle2, XCircle, Clock,
  ShieldCheck, DollarSign, Calendar, FileText, Lock
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../../utils/money';

export const InquiryFeasibilityTab = ({
  selectedInquiry,
  selectedLine,
  feasibility,
  feasibilityForm = {},
  setFeasibilityForm,
  onSaveFeasibility,
  saving
}) => {
  const isLineLocked = !!selectedLine?.isLocked || !!selectedInquiry?.quotationId;

  if (!selectedLine) {
    return (
      <div style={{
        padding: '36px 20px',
        textAlign: 'center',
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          background: 'rgba(0, 180, 216, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Wrench size={24} color="#0077b6" />
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
          No Line Item Selected for APQP Feasibility
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 440, margin: 0 }}>
          Please select a line item from the <strong>Requested Parts</strong> tab or line item selector above to review tooling, manufacturing lead time, and APQP feasibility approval.
        </p>
      </div>
    );
  }

  const isCustomPart = !selectedLine.productId;

  const decisionOptions = [
    { value: 'Approved', label: 'Approved', desc: 'Feasible for production with current or new tooling', icon: CheckCircle2, color: '#059669', bg: 'rgba(16, 185, 129, 0.12)' },
    { value: 'Conditional', label: 'Conditional', desc: 'Feasible subject to tooling lead-time or customer spec concessions', icon: AlertTriangle, color: '#0077b6', bg: 'rgba(0, 180, 216, 0.12)' },
    { value: 'Pending', label: 'Pending', desc: 'Under review by Tooling & Engineering division', icon: Clock, color: '#d97706', bg: 'rgba(245, 158, 11, 0.12)' },
    { value: 'Rejected', label: 'Rejected', desc: 'Cannot be manufactured within tolerance or machinery constraints', icon: XCircle, color: '#dc2626', bg: 'rgba(244, 63, 94, 0.12)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── CONTEXT HEADER STRIP ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: 'rgba(0, 180, 216, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wrench size={18} color="#0077b6" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Engineering Check For:
              </span>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#0077b6',
                fontFamily: 'monospace',
                background: 'rgba(0, 180, 216, 0.12)',
                padding: '1px 6px',
                borderRadius: 4
              }}>
                {selectedLine.customerPartNumber || `Line #${selectedLine.lineSequence}`}
              </span>
              {selectedLine.productId ? (
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  (Catalog Part: <strong>{selectedLine.productId?.name}</strong>)
                </span>
              ) : (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#d97706',
                  background: 'rgba(245, 158, 11, 0.15)',
                  padding: '2px 8px',
                  borderRadius: 12
                }}>
                  Custom / New Development
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              APQP Gate 1 Manufacturing Feasibility: Assess tooling, machine capability, cycle time, and prototype lead time.
            </div>
          </div>
        </div>

        {/* Current status chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
            Gate Status:
          </span>
          <StatusBadge value={feasibility?.approvalStatus || feasibilityForm.approvalStatus || 'Pending'} />
        </div>
      </div>

      {/* ── RULE 1 FEASIBILITY GATE ALERT ───────────────────────────────── */}
      {isCustomPart ? (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 700, color: '#d97706' }}>
              Rule 1 Feasibility Gate Mandatory (Custom / Unlinked Part)
            </div>
            <p style={{ margin: '3px 0 0 0', color: 'var(--text-secondary)', fontSize: 12 }}>
              This part is not linked to an existing production catalog SKU. Precision ERP commercial policy mandates that all unlinked parts must have an <strong>Approved</strong> engineering feasibility check before this RFQ can be advanced to the <strong>Quoted</strong> stage.
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
            <strong>Catalog Component:</strong> Production parameters and standard tolerances are established. Review tooling or custom fixtures if high volume is requested.
          </div>
        </div>
      )}

      {/* ── DECISION SELECTOR CARDS ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Select Engineering Feasibility Decision
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10
        }}>
          {decisionOptions.map(opt => {
            const Icon = opt.icon;
            const isSelected = (feasibilityForm.approvalStatus || 'Pending') === opt.value;

            return (
              <div
                key={opt.value}
                onClick={() => {
                  if (!isLineLocked) {
                    setFeasibilityForm(f => ({ ...f, approvalStatus: opt.value }));
                  }
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-color)',
                  background: isSelected ? opt.bg : 'var(--surface-canvas)',
                  cursor: isLineLocked ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={16} color={opt.color} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: isSelected ? opt.color : 'var(--text-primary)' }}>
                      {opt.label}
                    </span>
                  </div>
                  {isSelected && (
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: opt.color }} />
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                  {opt.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TOOLING & LEAD TIME SPECIFICATIONS ──────────────────────────── */}
      <div style={{
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14
        }}>
          {/* Tooling Required Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: 6,
            border: '1px solid var(--border-color)'
          }}>
            <input
              type="checkbox"
              id="toolingReq"
              disabled={isLineLocked}
              checked={!!feasibilityForm.isToolingRequired}
              onChange={e => setFeasibilityForm(f => ({ ...f, isToolingRequired: e.target.checked }))}
              style={{ width: 17, height: 17, cursor: isLineLocked ? 'not-allowed' : 'pointer' }}
            />
            <label htmlFor="toolingReq" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', cursor: isLineLocked ? 'not-allowed' : 'pointer' }}>
              Special Tooling / Dies Required
            </label>
          </div>

          {/* Tooling Cost in ₹ */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Estimated Tooling & Mold Cost (₹)</span>
            </label>
            <input
              type="number"
              className="input-field"
              min="0"
              step="any"
              readOnly={isLineLocked}
              value={feasibilityForm.estimatedToolingCost ?? 0}
              onChange={e => setFeasibilityForm(f => ({
                ...f,
                estimatedToolingCost: parseFloat(e.target.value) || 0
              }))}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          {/* Estimated Lead Time Days */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Production Lead Time (Days)</span>
            </label>
            <input
              type="number"
              className="input-field"
              min="0"
              readOnly={isLineLocked}
              value={feasibilityForm.estimatedLeadTimeDays ?? 0}
              onChange={e => setFeasibilityForm(f => ({
                ...f,
                estimatedLeadTimeDays: parseInt(e.target.value) || 0
              }))}
            />
          </div>
        </div>

        {/* Engineering Notes */}
        <div className="input-group">
          <label className="input-label">
            Engineering & Manufacturing Assessment Notes
          </label>
          <textarea
            className="input-field"
            rows={3}
            readOnly={isLineLocked}
            placeholder="Document machine tonnage requirements, jig/fixture fabrication needs, raw material grade suitability, or special heat treatment steps…"
            value={feasibilityForm.engineeringNotes || ''}
            onChange={e => setFeasibilityForm(f => ({
              ...f,
              engineeringNotes: e.target.value
            }))}
          />
        </div>

        {/* Action Button Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {feasibility?.reviewedBy ? (
              <span>Last evaluated by: <strong>{feasibility.reviewedBy?.name || feasibility.reviewedBy}</strong></span>
            ) : (
              <span>Reviews are recorded on inquiry audit trail</span>
            )}
          </div>

          {!isLineLocked && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={onSaveFeasibility}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 700
              }}
            >
              <ShieldCheck size={16} />
              <span>{saving ? 'Saving Review…' : 'Save Engineering Feasibility Review'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InquiryFeasibilityTab;
