import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Layers, 
  ArrowLeft, 
  Package, 
  Calendar, 
  Clock, 
  IndianRupee, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { fmtMoney, fmtMoneyFull, fmtQty } from '../../../utils/money';

const FifoLayerInspector = ({
  material,
  allProfiles = [],
  onSelectMaterial,
  onBackToMatrix
}) => {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mat = material?.Material_ID || material || {};
  const materialId = mat._id || material?._id;

  useEffect(() => {
    if (materialId) {
      fetchLayers(materialId);
    }
  }, [materialId]);

  const fetchLayers = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/inventory/v2/valuation/layers/${id}`);
      setLayers(res.data.data || []);
    } catch (err) {
      console.error('Error fetching FIFO layers', err);
      setError('Could not load FIFO receipt cost layers.');
    }
    setLoading(false);
  };

  const totalRemainingInLayers = layers.reduce((sum, l) => sum + (l.Remaining_Quantity || 0), 0);
  const totalLayerValuation = layers.reduce((sum, l) => sum + ((l.Remaining_Quantity || 0) * (l.Unit_Cost || 0)), 0);

  // Layer stack palette
  const LAYER_COLORS = [
    { border: '#059669', bg: 'rgba(5, 150, 105, 0.15)', text: '#065f46', bar: '#10b981' },
    { border: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)', text: '#0369a1', bar: '#38bdf8' },
    { border: '#7c3aed', bg: 'rgba(124, 58, 237, 0.15)', text: '#6d28d9', bar: '#a78bfa' },
    { border: '#d97706', bg: 'rgba(217, 119, 6, 0.15)', text: '#b45309', bar: '#f59e0b' },
    { border: '#e11d48', bg: 'rgba(225, 29, 72, 0.15)', text: '#be123c', bar: '#fb7185' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Navigation & SKU Selector Bar */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackToMatrix}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} /> Back to Master Matrix
          </button>

          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active SKU Audit Drilldown
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {mat.name || 'Select Material'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(5, 150, 105, 0.15)',
                color: '#065f46',
                padding: '2px 8px',
                borderRadius: '6px',
                fontFamily: 'monospace'
              }}>
                {mat.code || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* SKU Switcher Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Material:</span>
          <select
            value={materialId || ''}
            onChange={(e) => {
              const selected = allProfiles.find(p => (p.Material_ID?._id || p.Material_ID) === e.target.value);
              if (selected) onSelectMaterial(selected);
            }}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid #059669',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            {allProfiles.map(p => {
              const m = p.Material_ID || {};
              return (
                <option key={m._id || p._id} value={m._id || p._id}>
                  {m.name} ({m.code}) — {fmtQty(p.onHand)} {p.uom}
                </option>
              );
            })}
          </select>

          <button
            onClick={() => materialId && fetchLayers(materialId)}
            title="Refresh FIFO layers"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Material Financial Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '14px 16px'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Physical Stores Stock</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {fmtQty(material?.onHand || 0)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{material?.uom}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Available for Issue: {fmtQty(material?.available || 0)} {material?.uom}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid #059669',
          borderRadius: '10px',
          padding: '14px 16px',
          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.08)'
        }}>
          <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>Calculated FIFO Asset Total</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#047857', marginTop: '4px' }}>
            {fmtMoney(totalLayerValuation || material?.fifoValue || 0)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Active Layers: {layers.length} Inward Batches
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '14px 16px'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Weighted Average Cost (WAC)</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
            {fmtMoneyFull(material?.wacUnit || material?.standardCost || 0)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Total WAC Value: {fmtMoney(material?.wacValue || 0)}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '14px 16px'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Standard Cost Benchmark</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '4px' }}>
            {fmtMoneyFull(material?.standardCost || 0)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Variance: {material?.costVariance >= 0 ? '+' : ''}{fmtMoney(material?.costVariance || 0)} ({material?.costVariancePct || 0}%)
          </div>
        </div>
      </div>

      {/* Visual FIFO Cost Layer Ladder / Partition Bar */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '18px 20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#059669" />
              FIFO Cost Layer Ladder (Earliest Inwards First Out)
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Under Ind AS 2 & GAAP, issues are drawn from Layer #1 until depleted before progressing to Layer #2.
            </p>
          </div>

          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#065f46',
            background: 'rgba(5, 150, 105, 0.15)',
            padding: '3px 10px',
            borderRadius: '6px'
          }}>
            IATF 16949 Lot FIFO Traceability
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        {layers.length > 0 && totalRemainingInLayers > 0 ? (
          <div style={{ marginTop: '10px' }}>
            <div style={{
              height: '24px',
              borderRadius: '8px',
              display: 'flex',
              overflow: 'hidden',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              marginBottom: '10px'
            }}>
              {layers.map((layer, idx) => {
                const share = (layer.Remaining_Quantity / totalRemainingInLayers) * 100;
                const palette = LAYER_COLORS[idx % LAYER_COLORS.length];

                return (
                  <div
                    key={layer._id || idx}
                    style={{
                      width: `${share}%`,
                      background: palette.bar,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      position: 'relative',
                      borderRight: idx < layers.length - 1 ? '1px solid rgba(255, 255, 255, 0.4)' : 'none',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    title={`Layer #${idx + 1}: ${fmtQty(layer.Remaining_Quantity)} ${material?.uom} @ ₹${layer.Unit_Cost} (${Math.round(share)}%)`}
                  >
                    {share > 12 && `Layer #${idx + 1} (${Math.round(share)}%)`}
                  </div>
                );
              })}
            </div>

            {/* Quick Legend Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {layers.map((layer, idx) => {
                const palette = LAYER_COLORS[idx % LAYER_COLORS.length];
                const ageDays = Math.floor((new Date() - new Date(layer.Receipt_Date || Date.now())) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={layer._id || idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: palette.bg,
                      border: `1px solid ${palette.border}`,
                      fontSize: '11px'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: palette.bar }} />
                    <strong style={{ color: palette.text }}>Layer #{idx + 1}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {fmtQty(layer.Remaining_Quantity)} {material?.uom} @ {fmtMoneyFull(layer.Unit_Cost)} ({ageDays}d old)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '12px'
          }}>
            No active receipt layers. Stock is currently at 0 balance.
          </div>
        )}
      </div>

      {/* Layer Detail Ledger Table */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Batch Receipt Valuation Ledger
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Total Layer Valuation: <strong style={{ color: '#047857' }}>{fmtMoneyFull(totalLayerValuation)}</strong>
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)'
              }}>
                <th style={{ padding: '10px 16px' }}>Layer #</th>
                <th style={{ padding: '10px 14px' }}>Inward Date & Age</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Original Inward Qty</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Remaining Stores Qty</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Unit Acquisition Cost</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Layer Subtotal Asset</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>FIFO Issue Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    Loading receipt layers...
                  </td>
                </tr>
              ) : layers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                    <AlertCircle size={28} color="var(--text-secondary)" style={{ marginBottom: '6px', opacity: 0.7 }} />
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>No FIFO Layers Recorded Yet</div>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>
                      Click "Work Out Stock Value" to auto-build receipt layers from GRN transactions.
                    </div>
                  </td>
                </tr>
              ) : (
                layers.map((layer, index) => {
                  const palette = LAYER_COLORS[index % LAYER_COLORS.length];
                  const ageDays = Math.floor((new Date() - new Date(layer.Receipt_Date || Date.now())) / (1000 * 60 * 60 * 24));
                  const isPrimary = index === 0;
                  const layerVal = (layer.Remaining_Quantity || 0) * (layer.Unit_Cost || 0);

                  return (
                    <tr
                      key={layer._id || index}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isPrimary ? 'rgba(5, 150, 105, 0.04)' : 'transparent'
                      }}
                    >
                      {/* Layer # */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 700,
                          fontSize: '12px',
                          color: palette.text
                        }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: palette.bar }} />
                          Layer #{index + 1}
                        </span>
                      </td>

                      {/* Date & Age */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {new Date(layer.Receipt_Date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {ageDays} days in stores
                        </div>
                      </td>

                      {/* Original Inward Qty */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {fmtQty(layer.Original_Quantity)} {material?.uom}
                      </td>

                      {/* Remaining Qty */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                          {fmtQty(layer.Remaining_Quantity)}
                        </strong>{' '}
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{material?.uom}</span>
                      </td>

                      {/* Unit Cost */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {fmtMoneyFull(layer.Unit_Cost)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>per {material?.uom}</div>
                      </td>

                      {/* Layer Subtotal Asset */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#047857' }}>
                          {fmtMoneyFull(layerVal)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {totalLayerValuation > 0 ? `${Math.round((layerVal / totalLayerValuation) * 100)}% of SKU` : '0%'}
                        </div>
                      </td>

                      {/* FIFO Status */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isPrimary ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#065f46',
                            background: 'rgba(5, 150, 105, 0.15)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(5, 150, 105, 0.3)'
                          }}>
                            <CheckCircle2 size={12} color="#059669" />
                            Next Issue (FIFO #1)
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-tertiary)',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            Buffer Layer #{index + 1}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FifoLayerInspector;
