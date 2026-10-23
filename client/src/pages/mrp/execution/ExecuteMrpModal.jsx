import React from 'react';
import { Cpu, Zap, AlertCircle, ShieldAlert, Layers, CheckCircle2 } from 'lucide-react';
import Modal from '../../../components/common/Modal';

export const ExecuteMrpModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedPeriod,
  setSelectedPeriod,
  consolidations = [],
  executing = false
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initialize Material Requirements Planning (MRP) Run"
    >
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Rules Card */}
          <div style={{
            padding: '16px 18px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            fontSize: '12px',
            color: '#334155',
            lineHeight: 1.6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#b45309', marginBottom: '8px' }}>
              <Cpu size={16} />
              <span>MRP Calculation Engine Execution Rules</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>
                <strong>BOM Strictness:</strong> Only active, "Approved" engineering BOM revisions are recursively exploded.
              </li>
              <li>
                <strong>Point-in-Time Freezing:</strong> Current physical inventory, allocated stock, and open purchase order receipts are snapshotted instantly.
              </li>
              <li>
                <strong>Dynamic Lead-Time Offsetting:</strong> Component needed-by dates are calculated backwards using Master Material vendor lead times. Past dates automatically raise an <strong>EXPEDITE</strong> warning beacon.
              </li>
              <li>
                <strong>Automated Downstream Synthesis:</strong> Generates shortages for Shortage Analysis and automated purchase/work order suggestions for Suggested Orders.
              </li>
            </ul>
          </div>

          {/* Period Selector */}
          <div className="input-group">
            <label className="input-label">Target Planning Horizon Period *</label>
            <select
              className="input-field"
              required
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
            >
              <option value="" disabled>Choose a combined-demand horizon period</option>
              {consolidations.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {consolidations.length === 0 && (
              <p style={{
                color: '#dc2626',
                fontSize: '11px',
                marginTop: '4px',
                lineHeight: 1.4
              }}>
                No combined demand periods found. Please run Combined Demand under Demand Planning first.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={executing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={executing || !selectedPeriod}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.45)',
                opacity: executing ? 0.7 : 1,
                cursor: executing ? 'progress' : 'pointer'
              }}
            >
              <Zap size={14} />
              {executing ? 'Executing Reactor…' : 'Start MRP Calculation Run'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
