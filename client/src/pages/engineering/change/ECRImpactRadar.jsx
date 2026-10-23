import React from 'react';
import {
  BarChart2, DollarSign, Layers, Sliders, Box, AlertTriangle,
  CheckCircle2, RefreshCw, Trash2, Wrench, ShieldAlert
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

export const ECRImpactRadar = ({
  selectedECR,
  impactForm,
  setImpactForm,
  onSaveImpact,
  saving
}) => {
  const isLocked = selectedECR?.isLocked;

  const dispositions = [
    {
      id: 'Use Existing',
      title: 'Use Existing Stock',
      subtitle: 'Deplete current inventory prior to revision cutover date',
      icon: CheckCircle2,
      color: '#059669',
      border: 'rgba(16, 185, 129, 0.35)',
      bg: 'rgba(16, 185, 129, 0.08)'
    },
    {
      id: 'Rework',
      title: 'Rework In-Stock Inventory',
      subtitle: 'Rework WIP & finished parts to conform to new specs',
      icon: Wrench,
      color: '#d97706',
      border: 'rgba(245, 158, 11, 0.35)',
      bg: 'rgba(245, 158, 11, 0.08)'
    },
    {
      id: 'Scrap',
      title: 'Immediate Scrap / Purge',
      subtitle: 'Quarantine and scrap obsolete stock due to safety/QC',
      icon: Trash2,
      color: '#dc2626',
      border: 'rgba(244, 63, 94, 0.35)',
      bg: 'rgba(244, 63, 94, 0.08)'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── TOP COST IMPACT & INVENTORY DISPOSITION CARDS ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {/* Cost Impact Card */}
        <div style={{
          background: 'var(--surface-canvas)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={16} color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Estimated Cost Impact
              </span>
            </div>
            <span style={{
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'monospace',
              color: (impactForm.costImpactEstimated || 0) < 0 ? '#059669' : '#d97706'
            }}>
              {fmtMoneyFull(impactForm.costImpactEstimated || 0)}
            </span>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
            Enter tooling modifications, scrap write-off costs, or recurring unit cost savings.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>₹</span>
            <input
              type="number"
              step="any"
              readOnly={isLocked}
              value={impactForm.costImpactEstimated || 0}
              onChange={e => setImpactForm(f => ({ ...f, costImpactEstimated: parseFloat(e.target.value) || 0 }))}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'monospace',
                borderRadius: 4,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* Current Disposition Summary Card */}
        <div style={{
          background: 'var(--surface-canvas)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <ShieldAlert size={16} color="#0284c7" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Inventory Disposition Policy
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
              Determines what the ERP does with active WIP and finished stock on the cutover date.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 5,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Selected Action:</span>
            <strong style={{
              fontSize: 12,
              color: impactForm.inventoryDisposition === 'Scrap' ? '#dc2626' : (impactForm.inventoryDisposition === 'Rework' ? '#d97706' : '#059669')
            }}>
              {impactForm.inventoryDisposition || 'Use Existing'}
            </strong>
          </div>
        </div>
      </div>

      {/* ── STOCK DISPOSITION STRATEGY SELECTOR ─────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          Select Active Stock Cutover Policy:
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {dispositions.map(d => {
            const isSelected = (impactForm.inventoryDisposition || 'Use Existing') === d.id;
            const Icon = d.icon;
            return (
              <div
                key={d.id}
                onClick={() => !isLocked && setImpactForm(f => ({ ...f, inventoryDisposition: d.id }))}
                style={{
                  padding: '12px 14px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: isSelected ? d.color : 'var(--border-color)',
                  background: isSelected ? d.bg : 'var(--bg-secondary)',
                  cursor: isLocked ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} color={d.color} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? d.color : 'var(--text-primary)' }}>
                    {d.title}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
                    {d.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TRIPLE IMPACT ANALYSIS DOSSIER ───────────────────────────────── */}
      <div style={{
        background: 'var(--surface-canvas)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
          Detailed Engineering Impact Notes (Product, BOM, Routing)
        </div>

        {/* 1. Product Impact */}
        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Box size={13} color="#7c3aed" />
            <span>Product Master & Drawing Tolerances Impact</span>
          </label>
          <textarea
            className="input-field"
            rows={2}
            readOnly={isLocked}
            placeholder="Specify drawing revisions, customer approval requirements, or critical dimension changes..."
            value={impactForm.productImpactNotes || ''}
            onChange={e => setImpactForm(f => ({ ...f, productImpactNotes: e.target.value }))}
          />
        </div>

        {/* 2. BOM Impact */}
        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={13} color="#0284c7" />
            <span>Parts List (BOM) & Raw Material Composition Impact</span>
          </label>
          <textarea
            className="input-field"
            rows={2}
            readOnly={isLocked}
            placeholder="Component additions, raw sheet metal grade substitutions, scrap allowance changes..."
            value={impactForm.bomImpactNotes || ''}
            onChange={e => setImpactForm(f => ({ ...f, bomImpactNotes: e.target.value }))}
          />
        </div>

        {/* 3. Routing Impact */}
        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={13} color="#d97706" />
            <span>Process Steps, Tooling & Machine Cycle Impact</span>
          </label>
          <textarea
            className="input-field"
            rows={2}
            readOnly={isLocked}
            placeholder="New stamping dies, CNC tool path updates, takt time adjustments, outside subcontracting changes..."
            value={impactForm.routingImpactNotes || ''}
            onChange={e => setImpactForm(f => ({ ...f, routingImpactNotes: e.target.value }))}
          />
        </div>

        {/* Save Button */}
        {!isLocked && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
            <button
              className="btn btn-primary"
              disabled={saving}
              onClick={onSaveImpact}
              style={{
                fontSize: 12,
                padding: '7px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)'
              }}
            >
              {saving ? 'Saving Impact Dossier...' : 'Save Impact Analysis'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ECRImpactRadar;
