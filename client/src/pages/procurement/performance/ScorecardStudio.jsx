import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Award, Star, ShieldAlert, CheckCircle2, AlertTriangle, 
  Truck, Clock, Search, X, ShieldCheck, Zap, ArrowRight,
  TrendingDown, Check, FileText, RefreshCw, AlertCircle
} from 'lucide-react';
import { notify } from '../../../utils/notify';

const getGrade = (score) => {
  if (score >= 90) return { grade: 'Grade A', label: 'Preferred Tier-1', color: '#059669', bg: 'rgba(16, 185, 129, 0.1)' };
  if (score >= 75) return { grade: 'Grade B', label: 'Standard Approved', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' };
  return { grade: 'Grade C', label: 'At-Risk / Watchlist', color: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)' };
};

const ScorecardStudio = ({
  scorecards = [],
  selectedScorecard,
  onSelectScorecard,
  onFireMockEvent,
  onRefresh,
  firing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('All'); // 'All', 'Approved', 'Probation', 'Blocked'

  // Action Drawer / Form states for the selected vendor
  const [activeAction, setActiveAction] = useState(null); // 'lateDelivery', 'qaDefect', 'certExpire'
  const [lateDays, setLateDays] = useState(1);
  const [defectCount, setDefectCount] = useState(5);
  const [totalChecked, setTotalChecked] = useState(100);

  // Vendor Incident Logs
  const [eventLogs, setEventLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Auto-select first scorecard if none selected
  if (!selectedScorecard && scorecards.length > 0) {
    onSelectScorecard(scorecards[0]);
  }

  const selectedVendorId = selectedScorecard?.vendorId?._id || selectedScorecard?.vendorId;

  // Fetch incident logs whenever selected vendor changes
  useEffect(() => {
    if (selectedVendorId) {
      fetchEventLogs(selectedVendorId);
    }
  }, [selectedVendorId]);

  const fetchEventLogs = async (vendorId) => {
    setLoadingLogs(true);
    try {
      const res = await axios.get(`/procurement/performance/events/${vendorId}`);
      setEventLogs(res.data?.data || []);
    } catch (err) {
      // Fallback empty if no events logged yet
      setEventLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Re-instate or Override Risk Status
  const handleUpdateStatus = async (newStatus, notes) => {
    if (!selectedVendorId) return;
    try {
      await axios.put(`/procurement/performance/${selectedVendorId}/status`, {
        riskStatus: newStatus,
        notes
      });
      notify.success(`Supplier status updated to ${newStatus}`);
      await onRefresh();
      fetchEventLogs(selectedVendorId);
    } catch (err) {
      notify.error('Could not update supplier status');
    }
  };

  // Filtered scorecards list
  const filteredScorecards = scorecards.filter(s => {
    const name = s.vendorId?.name?.toLowerCase() || '';
    const code = s.vendorId?.code?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    const matchesSearch = !search || name.includes(search) || code.includes(search);
    const matchesRisk = filterRisk === 'All' || s.riskStatus === filterRisk;

    return matchesSearch && matchesRisk;
  }).sort((a, b) => (b.currentOverallScore || 0) - (a.currentOverallScore || 0));

  const currentScore = selectedScorecard?.currentOverallScore || 0;
  const gradeInfo = getGrade(currentScore);
  const otifScore = selectedScorecard?.rollingOtifPct || 0;
  const ppmScore = selectedScorecard?.rollingDefectPpm || 0;
  const isBlocked = selectedScorecard?.riskStatus === 'Blocked';
  const isProbation = selectedScorecard?.riskStatus === 'Probation';

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      height: 'calc(100vh - 215px)',
      minHeight: '520px',
      overflow: 'hidden'
    }}>
      {/* ── LEFT PANEL: RANKED SUPPLIERS QUEUE (340px) ────────────────────── */}
      <div style={{
        width: '340px',
        flexShrink: 0,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Tray Header */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-canvas)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Supplier Leaderboard
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '10px',
              background: '#059669',
              color: '#ffffff'
            }}>
              {scorecards.length}
            </span>
          </div>

          {/* Quick Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '5px 8px'
          }}>
            <Search size={13} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search supplier or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                width: '100%',
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <X size={12} color="var(--text-secondary)" cursor="pointer" onClick={() => setSearchTerm('')} />
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['All', 'Approved', 'Probation', 'Blocked'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilterRisk(tab)}
                style={{
                  flex: 1,
                  padding: '3px 0',
                  fontSize: '11px',
                  fontWeight: filterRisk === tab ? 600 : 500,
                  background: filterRisk === tab ? '#059669' : 'transparent',
                  color: filterRisk === tab ? '#ffffff' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Ranked Supplier Cards */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filteredScorecards.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
              No supplier scorecards found matching criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredScorecards.map((scorecard, idx) => {
                const isSelected = selectedScorecard?._id === scorecard._id;
                const score = scorecard.currentOverallScore || 0;
                const vendorName = scorecard.vendorId?.name || 'Supplier Partner';
                const grade = getGrade(score);

                return (
                  <div
                    key={scorecard._id}
                    onClick={() => onSelectScorecard(scorecard)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #059669' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(5, 150, 105, 0.04)' : 'var(--surface-card)',
                      boxShadow: isSelected ? '0 1px 4px rgba(5, 150, 105, 0.12)' : 'none',
                      transition: 'all 0.12s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Rank & Grade Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#d97706' : 'var(--surface-canvas)',
                          color: idx <= 2 ? '#0f172a' : 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          #{idx + 1}
                        </span>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: grade.bg,
                          color: grade.color
                        }}>
                          {grade.grade}
                        </span>
                      </div>

                      {scorecard.riskStatus === 'Approved' ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Check size={10} strokeWidth={3} /> Approved
                        </span>
                      ) : scorecard.riskStatus === 'Probation' ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706'
                        }}>
                          On hold
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626'
                        }}>
                          Blocked
                        </span>
                      )}
                    </div>

                    {/* Supplier Name */}
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {vendorName}
                    </div>

                    {/* Bottom Row: Score & Metrics */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#059669', fontWeight: 700 }}>
                        <Star size={12} fill="#059669" color="#059669" />
                        <span>{score.toFixed(1)} / 100</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
                        <span>OTIF: <strong style={{ color: 'var(--text-primary)' }}>{scorecard.rollingOtifPct?.toFixed(0)}%</strong></span>
                        <span>Defect: <strong style={{ color: scorecard.rollingDefectPpm > 1000 ? '#dc2626' : 'var(--text-primary)' }}>{scorecard.rollingDefectPpm} PPM</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: 360° QUALITY DOSSIER & INCIDENT LAB ────────────────── */}
      <div style={{
        flex: 1,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {selectedScorecard ? (
          <>
            {/* Dossier Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--surface-canvas)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {selectedScorecard.vendorId?.name}
                  </h2>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: gradeInfo.bg,
                    color: gradeInfo.color
                  }}>
                    {gradeInfo.grade} — {gradeInfo.label}
                  </span>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isBlocked ? 'rgba(239,68,68,0.1)' : isProbation ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                    color: isBlocked ? '#dc2626' : isProbation ? '#d97706' : '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isBlocked ? <ShieldAlert size={12} /> : isProbation ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                    {selectedScorecard.riskStatus}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span>Code: <strong style={{ color: 'var(--text-primary)' }}>{selectedScorecard.vendorId?.code || 'VND-SUP'}</strong></span>
                  <span>Overall Rating: <strong style={{ color: '#059669' }}>★ {currentScore.toFixed(1)} / 100</strong></span>
                  <span>ISO Status: <strong style={{ color: isBlocked ? '#dc2626' : '#059669' }}>{isBlocked ? 'Certificate Expired' : 'IATF 16949 / ISO 9001 Active'}</strong></span>
                  <span>Last Audit: <strong style={{ color: 'var(--text-primary)' }}>{new Date(selectedScorecard.lastCalculated || Date.now()).toLocaleDateString()}</strong></span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isBlocked || isProbation ? (
                  <button
                    onClick={() => handleUpdateStatus('Approved', 'Quality Audit passed and Certificate renewed.')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Reinstate to Approved</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('Probation', 'Quality warning issued for delivery slippage.')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <AlertTriangle size={13} color="#d97706" />
                    <span>Place on Watchlist</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Dossier Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* 1. IATF 16949 Tri-Pillar Score Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                {/* Pillar 1: Delivery OTIF */}
                <div style={{
                  background: 'var(--surface-canvas)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Delivery OTIF (40%)
                    </span>
                    <Truck size={14} color="#059669" />
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: otifScore >= 90 ? '#059669' : '#d97706', fontFamily: 'var(--font-mono)' }}>
                    {otifScore.toFixed(1)}%
                  </div>
                  <div style={{
                    height: '4px',
                    width: '100%',
                    background: 'var(--surface-card)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, otifScore))}%`,
                      background: otifScore >= 90 ? '#059669' : '#d97706',
                      borderRadius: '2px'
                    }} />
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Target ≥ 95%. Penalty: -5 pts/day late.
                  </span>
                </div>

                {/* Pillar 2: Quality Defect PPM */}
                <div style={{
                  background: 'var(--surface-canvas)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Quality Defect PPM (40%)
                    </span>
                    <Award size={14} color="#2563eb" />
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: ppmScore > 1000 ? '#dc2626' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {ppmScore} PPM
                  </div>
                  <div style={{
                    height: '4px',
                    width: '100%',
                    background: 'var(--surface-card)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(0, Math.min(100, 100 - (ppmScore / 50)))}%`,
                      background: ppmScore > 1000 ? '#dc2626' : '#2563eb',
                      borderRadius: '2px'
                    }} />
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Target &lt; 500 PPM. Parts rejected per million.
                  </span>
                </div>

                {/* Pillar 3: Compliance & ISO Audit */}
                <div style={{
                  background: 'var(--surface-canvas)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Audit & ISO (20%)
                    </span>
                    <ShieldCheck size={14} color={isBlocked ? '#dc2626' : '#059669'} />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: isBlocked ? '#dc2626' : '#059669' }}>
                    {isBlocked ? 'Non-Compliant' : '100% Certified'}
                  </div>
                  <div style={{
                    height: '4px',
                    width: '100%',
                    background: 'var(--surface-card)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: isBlocked ? '0%' : '100%',
                      background: isBlocked ? '#dc2626' : '#059669',
                      borderRadius: '2px'
                    }} />
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {isBlocked ? 'Auto-blocks RFQ & PO placement' : 'ISO 9001 / IATF 16949 Valid'}
                  </span>
                </div>
              </div>

              {/* 2. Direct Incident Simulation Bar for Selected Vendor */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} color="#059669" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Log Quality / Delivery Event for {selectedScorecard.vendorId?.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Immediate feedback recalculates score and feeds RFQ scoring penalties
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveAction(activeAction === 'lateDelivery' ? null : 'lateDelivery')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      background: activeAction === 'lateDelivery' ? '#059669' : 'var(--surface-canvas)',
                      color: activeAction === 'lateDelivery' ? '#ffffff' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Truck size={12} />
                    <span>Log Late Delivery</span>
                  </button>

                  <button
                    onClick={() => setActiveAction(activeAction === 'qaDefect' ? null : 'qaDefect')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      background: activeAction === 'qaDefect' ? '#059669' : 'var(--surface-canvas)',
                      color: activeAction === 'qaDefect' ? '#ffffff' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Award size={12} />
                    <span>Log QA Inspection Defect</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Simulate ISO Certificate Expiration for ${selectedScorecard.vendorId?.name}? This will immediately BLOCK the supplier and trigger CAPA.`)) {
                        onFireMockEvent('mock-cert-expiration', { vendorId: selectedVendorId });
                      }
                    }}
                    disabled={firing === 'mock-cert-expiration'}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#dc2626',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <AlertTriangle size={12} />
                    <span>Simulate Certificate Expiration</span>
                  </button>
                </div>

                {/* Action Input Forms */}
                {activeAction === 'lateDelivery' && (
                  <div style={{
                    padding: '12px',
                    background: 'var(--surface-canvas)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px'
                  }}>
                    <div style={{ width: '180px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Days Delivery Arrived Late
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={lateDays}
                        onChange={(e) => setLateDays(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--surface-card)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        await onFireMockEvent('mock-goods-receipt', {
                          vendorId: selectedVendorId,
                          isLate: true,
                          daysLate: lateDays
                        });
                        setActiveAction(null);
                        fetchEventLogs(selectedVendorId);
                      }}
                      disabled={firing === 'mock-goods-receipt'}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      {firing === 'mock-goods-receipt' ? 'Recording...' : 'Record Goods Receipt Penalty'}
                    </button>
                  </div>
                )}

                {activeAction === 'qaDefect' && (
                  <div style={{
                    padding: '12px',
                    background: 'var(--surface-canvas)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px'
                  }}>
                    <div style={{ width: '140px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Total Inspected Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalChecked}
                        onChange={(e) => setTotalChecked(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--surface-card)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    <div style={{ width: '140px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Defective Units Found
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={defectCount}
                        onChange={(e) => setDefectCount(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--surface-card)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        await onFireMockEvent('mock-qa-inspection', {
                          vendorId: selectedVendorId,
                          defectCount,
                          totalChecked
                        });
                        setActiveAction(null);
                        fetchEventLogs(selectedVendorId);
                      }}
                      disabled={firing === 'mock-qa-inspection'}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      {firing === 'mock-qa-inspection' ? 'Recording...' : 'Record QA Defect Penalty'}
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Historical KPI Incident Audit Trail Table */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--surface-canvas)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Quality & Delivery Incident Audit Trail
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {eventLogs.length} logged incidents
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  {loadingLogs ? (
                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Loading audit events...
                    </div>
                  ) : eventLogs.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      No negative delivery or quality incidents logged for this supplier. Clean record.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Ref Doc</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Module</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>KPI Category</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Score Impact</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Incident Notes</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Logged At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventLogs.map(log => (
                          <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#059669' }}>
                              {log.referenceDocId}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                              {log.sourceModule?.replace(/_/g, ' ')}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                background: log.kpiCategory === 'Delivery' ? 'rgba(59,130,246,0.1)' : log.kpiCategory === 'Quality' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                color: log.kpiCategory === 'Delivery' ? '#2563eb' : log.kpiCategory === 'Quality' ? '#dc2626' : '#d97706'
                              }}>
                                {log.kpiCategory}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: log.impactValue < 0 ? '#dc2626' : '#059669' }}>
                              {log.impactValue > 0 ? `+${log.impactValue}` : log.impactValue} pts
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>
                              {log.notes}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '11px' }}>
                              {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            fontSize: '13px'
          }}>
            <Award size={36} color="var(--text-secondary)" style={{ marginBottom: '10px' }} />
            <p>Select a supplier on the left to view 360° scorecard rating.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScorecardStudio;
