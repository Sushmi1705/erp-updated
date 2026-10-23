import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Zap, Truck, CheckCircle2, AlertTriangle, ShieldAlert,
  ArrowRight, RefreshCw, Star, Info, ShieldCheck, Check,
  Clock, AlertCircle, History, RotateCcw
} from 'lucide-react';
import { notify } from '../../../utils/notify';

const getGrade = (score) => {
  if (score >= 90) return { grade: 'Grade A', label: 'Preferred Tier-1', color: '#059669', bg: 'rgba(16, 185, 129, 0.1)' };
  if (score >= 75) return { grade: 'Grade B', label: 'Standard Approved', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' };
  return { grade: 'Grade C', label: 'At-Risk / Watchlist', color: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)' };
};

const IncidentSimulatorLab = ({
  scorecards = [],
  vendors = [],
  selectedScorecard,
  onSelectScorecard,
  onFireMockEvent,
  onRefresh,
  firing
}) => {
  const [selectedVendorId, setSelectedVendorId] = useState(
    selectedScorecard?.vendorId?._id || selectedScorecard?.vendorId || (vendors[0]?._id || '')
  );

  // Event 1: Late delivery
  const [lateDays, setLateDays] = useState(2);

  // Event 2: QA failure
  const [totalChecked, setTotalChecked] = useState(100);
  const [defectCount, setDefectCount] = useState(4);

  // Event logs for the selected vendor
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Update selected vendor if prop changes
  useEffect(() => {
    if (selectedScorecard) {
      const vid = selectedScorecard.vendorId?._id || selectedScorecard.vendorId;
      if (vid && vid !== selectedVendorId) {
        setSelectedVendorId(vid);
      }
    }
  }, [selectedScorecard]);

  // Fetch logs whenever selected vendor changes
  useEffect(() => {
    if (selectedVendorId) {
      fetchLogs(selectedVendorId);
    }
  }, [selectedVendorId]);

  const fetchLogs = async (vendorId) => {
    setLoadingLogs(true);
    try {
      const res = await axios.get(`/procurement/performance/events/${vendorId}`);
      setLogs(res.data?.data || []);
    } catch (err) {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleVendorChange = (id) => {
    setSelectedVendorId(id);
    const found = scorecards.find(s => (s.vendorId?._id || s.vendorId) === id);
    if (found && onSelectScorecard) {
      onSelectScorecard(found);
    }
  };

  // Re-instate / Unblock vendor
  const handleReinstate = async () => {
    if (!selectedVendorId) return;
    try {
      await axios.put(`/procurement/performance/${selectedVendorId}/status`, {
        riskStatus: 'Approved',
        notes: 'Certificate audited & renewed. Reinstated to active supplier roster.'
      });
      notify.success('Supplier certificate renewed and status restored to Approved!');
      await onRefresh();
      fetchLogs(selectedVendorId);
    } catch (err) {
      notify.error('Could not reinstate supplier');
    }
  };

  // Find active scorecard
  const currentCard = scorecards.find(s => (s.vendorId?._id || s.vendorId) === selectedVendorId);
  const currentScore = currentCard?.currentOverallScore || 0;
  const currentOtif = currentCard?.rollingOtifPct || 0;
  const currentPpm = currentCard?.rollingDefectPpm || 0;
  const isBlocked = currentCard?.riskStatus === 'Blocked';
  const isProbation = currentCard?.riskStatus === 'Probation';
  const grade = getGrade(currentScore);

  // Live calculator previews
  const simulatedPpm = totalChecked > 0 ? Math.round((defectCount / totalChecked) * 1000000) : 0;
  const deliveryPenalty = Math.min(100, lateDays * 5);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      flex: 1,
      minHeight: '520px',
      height: 'calc(100vh - 215px)',
      overflowY: 'auto',
      paddingRight: '4px',
      paddingBottom: '24px'
    }}>
      {/* ── Top Bar: Supplier Selection & Live Score Preview Strip ──────────── */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            flexShrink: 0
          }}>
            <Zap size={18} />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
              marginBottom: '4px'
            }}>
              Select Supplier for Incident Simulation:
            </label>
            <select
              value={selectedVendorId}
              onChange={e => handleVendorChange(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                minWidth: '280px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {vendors.map(v => (
                <option key={v._id} value={v._id}>
                  {v.name} ({v.code || 'SUP'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Scorecard Preview Card */}
        {currentCard && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '8px 16px',
            background: 'var(--surface-canvas)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Current Score
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '15px' }}>
                <Star size={14} fill="#d97706" color="#d97706" />
                <span>{currentScore.toFixed(1)} / 100</span>
              </div>
            </div>

            <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                OTIF Delivery
              </div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: currentOtif >= 90 ? '#059669' : '#d97706' }}>
                {currentOtif.toFixed(1)}%
              </div>
            </div>

            <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Defect PPM
              </div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: currentPpm > 1000 ? '#dc2626' : 'var(--text-primary)' }}>
                {currentPpm} PPM
              </div>
            </div>

            <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Status
              </div>
              {isBlocked ? (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>Blocked</span>
              ) : isProbation ? (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309' }}>Probation</span>
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>Approved</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Grid: 3 Interactive Simulation Labs + Audit Trail ───────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {/* ── Simulation Card 1: Goods Receipt Late Arrival ──────────────────── */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                background: 'rgba(217, 119, 6, 0.1)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(217, 119, 6, 0.25)'
              }}>
                <Truck size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Late Material Delivery
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Warehouse Inward Goods Receipt
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '8px 0 14px 0' }}>
              Simulates a delayed delivery that arrived past the PO due date. Reduces the rolling OTIF score by 5% per day late.
            </p>

            {/* Input & Presets */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Days Delayed Beyond PO Schedule:
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={lateDays}
                  onChange={e => setLateDays(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '90px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: 'var(--surface-canvas)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 5, 10].map(d => (
                    <button
                      key={d}
                      onClick={() => setLateDays(d)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: lateDays === d ? 700 : 500,
                        background: lateDays === d ? 'rgba(217, 119, 6, 0.15)' : 'var(--surface-canvas)',
                        color: lateDays === d ? '#d97706' : 'var(--text-secondary)',
                        border: lateDays === d ? '1px solid #d97706' : '1px solid var(--border-color)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated Penalty Preview */}
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Calculated OTIF Deduction:</span>
              <strong style={{ color: '#d97706' }}>-{lateDays * 5}% OTIF</strong>
            </div>
          </div>

          <button
            onClick={() => onFireMockEvent('mock-goods-receipt', {
              vendorId: selectedVendorId,
              isLate: true,
              daysLate: lateDays
            })}
            disabled={!selectedVendorId || !!firing}
            style={{
              width: '100%',
              padding: '9px 14px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: (!selectedVendorId || !!firing) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            {firing === 'mock-goods-receipt' ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Recording Goods Receipt...</span>
              </>
            ) : (
              <>
                <Truck size={14} />
                <span>Record Late Inward Receipt</span>
              </>
            )}
          </button>
        </div>

        {/* ── Simulation Card 2: QA Inspection Rejection ─────────────────────── */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}>
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  QA Inward Batch Rejection
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Receiving Quality Assurance (RQA)
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '8px 0 14px 0' }}>
              Simulates defective components caught at sampling or 100% CMM inspection. Escalates PPM rating and quality penalty.
            </p>

            {/* Inputs: Checked vs Defective */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Sample Checked:
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalChecked}
                  onChange={e => setTotalChecked(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: 'var(--surface-canvas)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Defects Found:
                </label>
                <input
                  type="number"
                  min="1"
                  value={defectCount}
                  onChange={e => setDefectCount(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: 'var(--surface-canvas)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Defect Presets */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
              {[
                { checked: 100, defects: 2, label: '2% Rejection' },
                { checked: 200, defects: 10, label: '5% Rejection' },
                { checked: 50, defects: 5, label: '10% Critical' }
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTotalChecked(p.checked);
                    setDefectCount(p.defects);
                  }}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    fontSize: '10px',
                    fontWeight: (totalChecked === p.checked && defectCount === p.defects) ? 700 : 500,
                    background: (totalChecked === p.checked && defectCount === p.defects) ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-canvas)',
                    color: (totalChecked === p.checked && defectCount === p.defects) ? '#dc2626' : 'var(--text-secondary)',
                    border: (totalChecked === p.checked && defectCount === p.defects) ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Simulated PPM Preview */}
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Batch Defect Rate:</span>
              <strong style={{ color: '#dc2626' }}>{simulatedPpm.toLocaleString()} PPM</strong>
            </div>
          </div>

          <button
            onClick={() => onFireMockEvent('mock-qa-inspection', {
              vendorId: selectedVendorId,
              defectCount,
              totalChecked
            })}
            disabled={!selectedVendorId || !!firing}
            style={{
              width: '100%',
              padding: '9px 14px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: (!selectedVendorId || !!firing) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            {firing === 'mock-qa-inspection' ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Logging QA Rejection...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Record Quality Rejection</span>
              </>
            )}
          </button>
        </div>

        {/* ── Simulation Card 3: ISO/IATF Certificate Expiry & Blocking ───────── */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}>
                <ShieldAlert size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Compliance & ISO Certificate Expiry
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Statutory & Quality System Compliance
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '8px 0 14px 0' }}>
              Expires the supplier's ISO 9001 / IATF 16949 certificate. The vendor is immediately <strong>Blocked</strong>, and purchase order placement is automatically locked until audit clearance.
            </p>

            <div style={{
              padding: '10px 12px',
              borderRadius: '6px',
              background: isBlocked ? 'rgba(239, 68, 68, 0.08)' : 'var(--surface-canvas)',
              border: isBlocked ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)',
              marginBottom: '12px',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Certificate Status:</span>
                <strong style={{ color: isBlocked ? '#dc2626' : '#059669' }}>
                  {isBlocked ? 'EXPIRED (PO Locked)' : 'ACTIVE (IATF 16949 Valid)'}
                </strong>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                Penalty: -100 Compliance Score & immediate risk escalation to Blocked.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => onFireMockEvent('mock-cert-expiration', {
                vendorId: selectedVendorId
              })}
              disabled={!selectedVendorId || isBlocked || !!firing}
              style={{
                width: '100%',
                padding: '9px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: isBlocked ? 'var(--surface-canvas)' : '#dc2626',
                color: isBlocked ? 'var(--text-secondary)' : '#ffffff',
                border: isBlocked ? '1px solid var(--border-color)' : 'none',
                borderRadius: '6px',
                cursor: (!selectedVendorId || isBlocked || !!firing) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {firing === 'mock-cert-expiration' ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Locking Supplier...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={14} />
                  <span>{isBlocked ? 'Certificate Already Expired' : 'Expire Certificate & Auto-Block'}</span>
                </>
              )}
            </button>

            {isBlocked && (
              <button
                onClick={handleReinstate}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ShieldCheck size={14} />
                <span>Renew Certificate & Reinstate (Unblock)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Incident Event Audit Trail ──────────────────────── */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} color="var(--text-secondary)" />
            <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Recent Simulation & Audit History for Selected Supplier
            </h3>
          </div>
          <button
            onClick={() => fetchLogs(selectedVendorId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={11} className={loadingLogs ? 'animate-spin' : ''} />
            <span>Refresh History</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            background: 'var(--surface-canvas)',
            borderRadius: '6px',
            border: '1px dashed var(--border-color)'
          }}>
            No recent manual simulation events recorded yet for this supplier. Click any of the simulation buttons above to generate live audit entries.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.slice(0, 5).map((log, idx) => (
              <div
                key={log._id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--surface-canvas)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {log.eventType === 'LateDelivery' ? (
                    <Truck size={14} color="#d97706" />
                  ) : log.eventType === 'QARejection' ? (
                    <CheckCircle2 size={14} color="#dc2626" />
                  ) : (
                    <ShieldAlert size={14} color="#dc2626" />
                  )}
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.eventType === 'LateDelivery' ? 'Late Goods Receipt' :
                       log.eventType === 'QARejection' ? 'QA Sampling Rejection' :
                       log.eventType === 'CertExpired' ? 'Certificate Expired & Auto-Blocked' : 'Status Override'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      {log.details || log.notes || '-'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {log.penaltyPoints && (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      -{log.penaltyPoints} pts
                    </span>
                  )}
                  <span>
                    {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    }) : 'Recent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentSimulatorLab;
