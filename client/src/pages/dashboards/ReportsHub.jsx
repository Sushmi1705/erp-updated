import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  Building2,
  ShoppingCart,
  Truck,
  Boxes,
  Factory,
  ClipboardCheck,
  Wrench,
  ChevronRight,
  ExternalLink,
  Layers,
  Printer
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccess } from '../../utils/permissions';
import { REPORTS } from './reportConfigs';
import { fmtMoney, fmtMoneyFull } from '../../utils/money';

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical Blockers',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    icon: AlertOctagon
  },
  warning: {
    label: 'Operational Warnings',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: AlertTriangle
  },
  info: {
    label: 'Approvals & Info',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: Info
  }
};

const ReportsHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [attentionItems, setAttentionItems] = useState([]);
  const [loadingAttention, setLoadingAttention] = useState(true);
  const [attentionError, setAttentionError] = useState(false);

  // Quick plant preview numbers
  const [plantVitals, setPlantVitals] = useState({
    revenue: null,
    stockValue: null,
    openOrders: null,
    openBreakdowns: null,
    pendingInspections: null,
    lowStockCount: null
  });

  // Attention filtering
  const [severityFilter, setSeverityFilter] = useState('all'); // 'all' | 'critical' | 'warning' | 'info'
  const [moduleFilter, setModuleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [months, setMonths] = useState(() => {
    try {
      return Number(localStorage.getItem('report_months')) || 6;
    } catch {
      return 6;
    }
  });

  // Visible reports authorized for current role
  const visibleReports = useMemo(() => {
    return REPORTS.filter(r => canAccess(user, r.module));
  }, [user]);

  // Load Attention Items and plant vitals
  const loadData = async () => {
    setLoadingAttention(true);
    setAttentionError(false);
    try {
      const [attRes, ceoRes] = await Promise.all([
        axios.get('/dashboards/attention').catch(() => ({ data: { data: { items: [] } } })),
        axios.get('/dashboards/ceo', { params: { months } }).catch(() => ({ data: { data: null } }))
      ]);

      const items = attRes.data?.data?.items || [];
      setAttentionItems(items);

      if (ceoRes.data?.data) {
        const d = ceoRes.data.data;
        const rev = d.headline?.find(h => h.key === 'revenue')?.value;
        const stock = d.headline?.find(h => h.key === 'stock')?.value;
        const owed = d.headline?.find(h => h.key === 'owed')?.value;
        setPlantVitals(prev => ({
          ...prev,
          revenue: rev,
          stockValue: stock,
          openOrders: owed
        }));
      }
    } catch (err) {
      console.error('Error fetching hub data:', err);
      setAttentionError(true);
    } finally {
      setLoadingAttention(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [months]);

  // Filtered Attention Items
  const filteredAttention = useMemo(() => {
    return attentionItems.filter(item => {
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (moduleFilter !== 'all' && item.module?.toLowerCase() !== moduleFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (item.title || '').toLowerCase().includes(q);
        const inDetail = (item.detail || '').toLowerCase().includes(q);
        const inModule = (item.module || '').toLowerCase().includes(q);
        if (!inTitle && !inDetail && !inModule) return false;
      }
      return true;
    });
  }, [attentionItems, severityFilter, moduleFilter, searchQuery]);

  // Attention Counts by Severity
  const counts = useMemo(() => {
    const c = { total: attentionItems.length, critical: 0, warning: 0, info: 0 };
    attentionItems.forEach(item => {
      if (item.severity === 'critical') c.critical += 1;
      else if (item.severity === 'warning') c.warning += 1;
      else if (item.severity === 'info') c.info += 1;
    });
    return c;
  }, [attentionItems]);

  // Unique modules present in attention items
  const availableModules = useMemo(() => {
    const set = new Set(attentionItems.map(i => i.module).filter(Boolean));
    return Array.from(set);
  }, [attentionItems]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* ── Top Header & Global Intelligence Bar ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Automotive Intelligence &amp; Analytics Hub
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#1d4ed8',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={12} /> IATF 16949 &bull; MULTI-DISCIPLINARY TELEMETRY
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '840px' }}>
            Cross-departmental diagnostic center. Real-time operational bottleneck tracking, department deep-dives, and comparative trend analysis across financial, commercial, supply chain, production, and quality performance.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Period selector */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '2px'
            }}
          >
            {[
              [1, '1M'],
              [3, '3M'],
              [6, '6M'],
              [12, '12M']
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setMonths(val);
                  try { localStorage.setItem('report_months', String(val)); } catch {}
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: months === val ? 'var(--bg-primary)' : 'transparent',
                  color: months === val ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: months === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            className="btn btn-secondary"
            onClick={loadData}
            title="Reload plant intelligence metrics"
            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={loadingAttention ? 'animate-spin' : ''} /> Sync
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => window.print()}
            title="Print Executive Overview"
            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={13} /> Print Summary
          </button>
        </div>
      </div>

      {/* ── Section 1: Plant Health Vitals Bar (Live Domain Radar) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px'
        }}
      >
        {visibleReports.map(rep => {
          const Icon = rep.icon;
          const theme = rep.theme || {};
          // Check if there are active bottlenecks for this department
          const deptAlerts = attentionItems.filter(i => i.module?.toLowerCase() === rep.module?.toLowerCase());
          const hasCrit = deptAlerts.some(i => i.severity === 'critical');
          const hasWarn = deptAlerts.some(i => i.severity === 'warning');

          return (
            <div
              key={rep.endpoint}
              onClick={() => navigate(rep.path)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = theme.accent || 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      backgroundColor: theme.lightBg || '#eff6ff',
                      color: theme.accent || '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {rep.title.replace(' Report', '').replace(' Overview', '')}
                  </span>
                </div>

                {/* Health Dot */}
                <div
                  title={hasCrit ? 'Critical attention items pending' : hasWarn ? 'Warnings pending' : 'Operational status nominal'}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: hasCrit ? '#dc2626' : hasWarn ? '#f59e0b' : '#10b981',
                    boxShadow: hasCrit ? '0 0 6px rgba(220, 38, 38, 0.6)' : 'none'
                  }}
                />
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {deptAlerts.length > 0 ? `${deptAlerts.length} actionable item${deptAlerts.length > 1 ? 's' : ''}` : 'Nominal'}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: theme.accent || 'var(--accent-primary)' }}>
                  View &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Section 2: Actionable Plant Bottlenecks Radar ── */}
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        {/* Radar Header & Filter Controls */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Actionable Bottleneck &amp; Disruption Radar
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: counts.critical > 0 ? '#fef2f2' : '#f0fdf4',
                  color: counts.critical > 0 ? '#dc2626' : '#166534',
                  border: `1px solid ${counts.critical > 0 ? '#fecaca' : '#bbf7d0'}`
                }}
              >
                {counts.total} items flagged ({counts.critical} critical)
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Automated plant surveillance: overdue releases, open machine breakdowns, reorder stockouts, late deliveries, and unresolved non-conformances.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 10px',
                width: '180px'
              }}
            >
              <Search size={12} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '11.5px', outline: 'none', width: '100%', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Severity Pill Selector */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '2px'
              }}
            >
              <button
                type="button"
                onClick={() => setSeverityFilter('all')}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: severityFilter === 'all' ? 'var(--accent-primary)' : 'transparent',
                  color: severityFilter === 'all' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                All ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter('critical')}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: severityFilter === 'critical' ? '#dc2626' : 'transparent',
                  color: severityFilter === 'critical' ? '#ffffff' : '#dc2626'
                }}
              >
                Critical ({counts.critical})
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter('warning')}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: severityFilter === 'warning' ? '#d97706' : 'transparent',
                  color: severityFilter === 'warning' ? '#ffffff' : '#d97706'
                }}
              >
                Warnings ({counts.warning})
              </button>
            </div>

            {/* Domain Filter Dropdown */}
            {availableModules.length > 0 && (
              <select
                className="input-field"
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
                style={{ fontSize: '11.5px', padding: '4px 8px', borderRadius: '6px' }}
              >
                <option value="all">All Departments</option>
                {availableModules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Radar List Content */}
        <div style={{ padding: '14px', maxHeight: '340px', overflowY: 'auto' }}>
          {loadingAttention ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Scanning plant operations for bottlenecks...
            </div>
          ) : attentionError ? (
            <div style={{ padding: '16px', color: 'var(--status-negative-fg)', backgroundColor: 'var(--status-negative-bg)', borderRadius: '6px', fontSize: '12px' }}>
              Could not retrieve plant bottleneck radar. Please verify server connectivity.
            </div>
          ) : filteredAttention.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                color: '#166534',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={18} />
              <span>All monitored parameters nominal. No active bottlenecks matching filter criteria.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(450px, 100%), 1fr))', gap: '10px' }}>
              {filteredAttention.map((item, idx) => {
                const cfg = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.info;
                const Icon = cfg.icon;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: `1px solid var(--border-color)`,
                      borderLeft: `4px solid ${cfg.color}`,
                      borderRadius: '8px',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: cfg.bg,
                          color: cfg.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.title}
                          </span>
                          {item.module && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {item.module}
                            </span>
                          )}
                        </div>
                        {item.detail && (
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.4' }}>
                            {item.detail}
                          </div>
                        )}
                      </div>
                    </div>

                    {item.path && (
                      <button
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="btn btn-secondary"
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0,
                          fontWeight: 600
                        }}
                      >
                        <span>Resolve</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Specialized Department Intelligence Consoles (7 Custom Suites) ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Department Intelligence Consoles
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Specialized management suites with time-series trends, ranked pareto distributions, and operational explanations.
            </p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {visibleReports.length} authorized suites
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '16px' }}>
          {visibleReports.map(rep => {
            const Icon = rep.icon;
            const theme = rep.theme || {};

            return (
              <div
                key={rep.endpoint}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(rep.path)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = theme.accent || 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                }}
              >
                {/* Department Accent Banner */}
                <div
                  style={{
                    padding: '14px 16px',
                    background: theme.gradient || 'linear-gradient(135deg, #1e40af, #3b82f6)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                        {rep.title}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '1px' }}>
                        {theme.badge || 'Department Suite'}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ArrowRight size={14} />
                  </span>
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: theme.accent || 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {theme.tagline || rep.subtitle}
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, flex: 1 }}>
                    {rep.description}
                  </p>

                  <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      <strong>Read by:</strong> {rep.who}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: theme.accent || 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Open Console &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportsHub;
