import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Sliders, 
  Layers, 
  Clock, 
  Flame, 
  ShieldCheck, 
  ArrowRight,
  Factory,
  RefreshCw,
  Box
} from 'lucide-react';
import { fmtQty } from '../../../utils/money';
import { notify } from '../../../utils/notify';

const CapacityBoardView = ({
  plans = [],
  selectedPlan = null,
  onSelectPlan,
  onValidateCapacity,
  busy = false
}) => {
  const activePlan = selectedPlan || plans[0] || null;
  const [capacityData, setCapacityData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activePlan?._id) {
      fetchCapacityBreakdown(activePlan._id);
    }
  }, [activePlan?._id]);

  const fetchCapacityBreakdown = async (planId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/production/v2/production-plan/${planId}/capacity`);
      if (res.data?.success) {
        setCapacityData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching capacity breakdown', err);
    } finally {
      setLoading(false);
    }
  };

  const workCenters = capacityData?.workCenters || [
    {
      id: 'WC-PR-400T',
      name: 'WC-PR-400T (Press Line 04 - 400T Progressive Die)',
      category: 'Stamping Press',
      standardTaktPPH: 120,
      requiredHours: 48.5,
      availableHours: 160,
      utilizationPct: 30,
      status: 'Optimal',
      isBottleneck: false
    },
    {
      id: 'WC-BL-250T',
      name: 'WC-BL-250T (Blanking & Coil Slitting Line)',
      category: 'Coil Blanking',
      standardTaktPPH: 180,
      requiredHours: 32.3,
      availableHours: 160,
      utilizationPct: 20,
      status: 'Optimal',
      isBottleneck: false
    },
    {
      id: 'WC-WL-ABB02',
      name: 'WC-WL-ABB02 (Robotic MIG Seam Welding Cell)',
      category: 'Sub-Assembly Welding',
      standardTaktPPH: 90,
      requiredHours: 64.7,
      availableHours: 160,
      utilizationPct: 40,
      status: 'Optimal',
      isBottleneck: false
    },
    {
      id: 'WC-EC-SURF',
      name: 'WC-EC-SURF (Cathodic Electrodeposition E-Coat Line)',
      category: 'Surface Treatment',
      standardTaktPPH: 200,
      requiredHours: 29.1,
      availableHours: 160,
      utilizationPct: 18,
      status: 'Optimal',
      isBottleneck: false
    }
  ];

  const isValidated = activePlan?.Capacity_Status === 'Validated';
  const hasBottleneck = workCenters.some(wc => wc.isBottleneck || wc.utilizationPct > 85);

  if (!plans.length) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <Box size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No Plans Available for RCCP Capacity Analysis</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
          Add a production plan to perform rough-cut machine loading and bottleneck simulation.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        padding: '20px 24px',
        color: '#ffffff',
        border: '1px solid #1e293b',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Gauge size={20} color="#fb7185" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                Rough-Cut Capacity Planning (RCCP) Engine
              </h2>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Machine load simulation across key automotive work centers vs 160h standard month capacity
              </div>
            </div>
          </div>
        </div>

        {/* Plan Selector & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>PLAN:</span>
            <select
              value={activePlan?._id || ''}
              onChange={(e) => {
                const found = plans.find(p => p._id === e.target.value);
                if (found && onSelectPlan) onSelectPlan(found);
              }}
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {plans.map(p => (
                <option key={p._id} value={p._id}>
                  {p.Plan_Number} ({p.details?.length || 0} lines)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => activePlan?._id && fetchCapacityBreakdown(activePlan._id)}
            disabled={loading}
            className="btn btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderColor: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Refresh capacity simulation"
          >
            <RefreshCw size={12} className={loading ? 'spinner' : ''} />
            Recalculate
          </button>

          {/* Direct Validation Button */}
          {!isValidated ? (
            <button
              onClick={() => onValidateCapacity(activePlan?._id)}
              disabled={busy}
              className="btn btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                backgroundColor: '#059669',
                borderColor: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={14} />
              Validate &amp; Confirm Capacity
            </button>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              <ShieldCheck size={14} />
              Capacity Validated
            </div>
          )}
        </div>
      </div>

      {/* Bottleneck Alert Banner if applicable */}
      {hasBottleneck ? (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={20} color="#dc2626" />
          <div style={{ flex: 1, fontSize: '13px', color: '#991b1b' }}>
            <strong>Bottleneck Alert:</strong> High capacity utilization (&gt;85%) detected on key stamping or welding work centers. Consider leveling the schedule across additional shifts or staggering batch start dates.
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <div style={{ fontSize: '13px', color: '#065f46' }}>
            <strong>Capacity Balanced:</strong> All critical work centers operate within safety thresholds (&lt;85% utilization). Plant production plan is executable as scheduled.
          </div>
        </div>
      )}

      {/* 4 Work Center Capacity Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {workCenters.map((wc) => {
          const util = wc.utilizationPct || 0;
          const isOver = util > 95;
          const isWarning = util > 80 && !isOver;
          const barColor = isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

          return (
            <div
              key={wc.id}
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top Accent Stripe */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: barColor
              }} />

              {/* Work Center Title & Category */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-muted)'
                  }}>
                    {wc.category}
                  </span>
                  {wc.isBottleneck ? (
                    <span style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      color: '#dc2626',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700
                    }}>
                      BOTTLENECK
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#059669',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700
                    }}>
                      BALANCED
                    </span>
                  )}
                </div>
                <h4 style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {wc.name}
                </h4>
              </div>

              {/* Progress Utilization Gauge Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Capacity Loading</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: barColor }}>
                    {util}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    width: `${Math.min(100, util)}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: '4px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>

              {/* Work Center Detailed Specs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                backgroundColor: 'var(--bg-secondary)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Required Load</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{wc.requiredHours} hrs</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Available Hours</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{wc.availableHours} hrs / mo</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Standard Takt</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{wc.standardTaktPPH} pcs / hr</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Load Headroom</span>
                  <strong style={{ color: '#059669' }}>
                    {Math.max(0, Math.round((wc.availableHours - wc.requiredHours) * 10) / 10)} hrs left
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CapacityBoardView;
