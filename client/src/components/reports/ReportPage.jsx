import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Download, Printer, RefreshCw, AlertCircle, Sparkles, TrendingUp, TrendingDown,
  Minus, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, Copy, Check,
  Table as TableIcon, LayoutDashboard, Search, ShieldCheck, ArrowUpRight,
  Info, AlertTriangle, AlertOctagon, HelpCircle, Layers, Calendar, BarChart3
} from 'lucide-react';
import StatCard from '../common/StatCard';
import TrendChart from '../charts/TrendChart';
import BarList from '../charts/BarList';
import Donut from '../charts/Donut';
import AttentionList from './AttentionList';
import { fmtUnit, downloadCsv } from '../../utils/format';
import { REPORTS } from '../../pages/dashboards/reportConfigs';

/* Precision ERP — Executive Automotive Intelligence Suite
 *
 * Provides a tailored domain analytics cockpit for each department report:
 * 1. Top Fast-Switcher Bar to jump between reports without sidebar friction.
 * 2. Distinct Domain Aesthetic (Theme accents, badges, gradients).
 * 3. Dual View Mode: Executive Cockpit View (Visuals/Gauges) vs Data Matrix View (Audit Grid).
 * 4. Executive Briefing Deck with categorized operational insights.
 * 5. Actionable Bottleneck Console with direct deep-links.
 * 6. Dual-mode Breakdowns (Interactive Pareto/Donut + Tabular Matrix with search).
 * 7. IATF 16949 Standards Reference Drawer.
 * 8. One-click Copy Executive Summary, CSV Export, and Print/PDF.
 */

const PERIODS = [
  [1, 'This month'],
  [3, '3 months'],
  [6, '6 months'],
  [12, '12 months']
];

/* Generic sentences from the headline when the report does not write its own */
const defaultReadings = (data) => {
  const out = [];
  for (const h of data.headline.slice(0, 4)) {
    const v = fmtUnit(h.value, h.unit);
    if (h.value === null || h.value === undefined) {
      out.push(`${h.label} is not recorded yet — ${h.caption || 'nothing to measure'}.`);
      continue;
    }
    if (typeof h.delta === 'number') {
      const dir = h.delta > 0 ? 'up' : h.delta < 0 ? 'down' : 'level';
      const amt = h.deltaIsPoints ? `${Math.abs(h.delta)} points` : `${Math.abs(h.delta)}%`;
      out.push(dir === 'level' ? `${h.label} is unchanged at ${v}.` : `${h.label} is ${dir} ${amt} on the period before, at ${v}.`);
    } else {
      out.push(`${h.label}: ${v}${h.caption ? ` — ${h.caption}` : ''}.`);
    }
  }
  return out;
};

const ReportPage = ({ config }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [months, setMonths] = useState(() => {
    try { return Number(localStorage.getItem('report_months')) || 6; } catch { return 6; }
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  // View Mode: 'cockpit' (charts & visual cards) vs 'matrix' (audit data grid)
  const [viewMode, setViewMode] = useState('cockpit');

  // Breakdown view mode state: { [breakdownKey]: 'visual' | 'table' }
  const [breakdownModes, setBreakdownModes] = useState({});
  // Breakdown search state: { [breakdownKey]: string }
  const [breakdownSearches, setBreakdownSearches] = useState({});

  // Matrix search state
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixFilter, setMatrixFilter] = useState('all');

  // UI state
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showStandards, setShowStandards] = useState(false);

  const theme = config.theme || {
    accent: '#2563eb',
    badge: 'Automotive Intelligence',
    tagline: 'Standard Operational Telemetry',
    lightBg: '#eff6ff',
    border: '#bfdbfe',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    accentDark: '#172554',
    chipColor: '#1d4ed8'
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get(`/dashboards/${config.endpoint}`, { params: { months } })
      .then((res) => { if (!cancelled) setData(res.data?.data || null); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Could not load this report.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [config.endpoint, months, tick]);

  const choosePeriod = (m) => {
    setMonths(m);
    setLoading(true);
    setError(null);
    try { localStorage.setItem('report_months', String(m)); } catch { /* ignore */ }
  };

  const refresh = () => {
    setTick((t) => t + 1);
    setLoading(true);
    setError(null);
  };

  const readings = useMemo(() => {
    if (!data) return [];
    return config.readings ? config.readings(data) : defaultReadings(data);
  }, [data, config]);

  const copyBriefing = () => {
    if (!readings.length) return;
    const text = `*${config.title} — Executive Intelligence Briefing (${data?.period?.label || ''})*\n\n` +
      readings.map((r, i) => `• ${r}`).join('\n') +
      `\n\nGenerated by Precision ERP on ${new Date().toLocaleDateString('en-IN')}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [];
    data.headline.forEach((h) => rows.push({
      section: 'Headline Telemetry',
      indicator: h.label,
      metric_value: h.value ?? '',
      unit: h.unit,
      delta_vs_prior_period: h.delta !== null && h.delta !== undefined ? `${h.delta}${h.deltaIsPoints ? ' pts' : '%'}` : '',
      benchmark_notes: h.caption || ''
    }));
    data.series.forEach((s) => s.points.forEach((p) => rows.push({
      section: `Time Series: ${s.label}`,
      indicator: p.label,
      metric_value: p.value,
      unit: s.unit,
      delta_vs_prior_period: '',
      benchmark_notes: ''
    })));
    data.breakdowns.forEach((b) => b.rows.forEach((r, idx) => rows.push({
      section: `Breakdown: ${b.title}`,
      indicator: `#${idx + 1} ${r.label}`,
      metric_value: r.value ?? '',
      unit: b.unit,
      delta_vs_prior_period: r.share !== undefined && r.share !== null ? `${r.share}% share` : '',
      benchmark_notes: r.sub || ''
    })));
    data.attention.forEach((a) => rows.push({
      section: 'Operational Attention Item',
      indicator: a.title,
      metric_value: a.count ?? 1,
      unit: a.severity,
      delta_vs_prior_period: '',
      benchmark_notes: a.detail || ''
    }));
    downloadCsv(`${config.endpoint}-telemetry-${months}m-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const seriesGroups = config.seriesGroups || (data ? [{ title: config.trendTitle || 'Historical Trajectory', keys: data.series.map((s) => s.key) }] : []);

  // Filtered Matrix rows
  const matrixRows = useMemo(() => {
    if (!data) return [];
    const rows = [];
    data.headline.forEach((h) => rows.push({
      type: 'headline',
      section: 'Headline Metric',
      title: h.label,
      value: fmtUnit(h.value, h.unit),
      change: h.delta !== null && h.delta !== undefined ? `${h.delta > 0 ? '+' : ''}${h.delta}${h.deltaIsPoints ? ' pts' : '%'}` : '—',
      tone: h.tone || 'neutral',
      detail: h.caption || 'Core plant metric'
    }));
    data.series.forEach((s) => {
      s.points.forEach((p) => rows.push({
        type: 'series',
        section: `Trajectory: ${s.label}`,
        title: p.label,
        value: fmtUnit(p.value, s.unit),
        change: 'Trend point',
        tone: 'neutral',
        detail: `Monthly metric for ${s.label}`
      }));
    });
    data.breakdowns.forEach((b) => {
      b.rows.forEach((r, idx) => rows.push({
        type: 'breakdown',
        section: b.title,
        title: `${idx + 1}. ${r.label}`,
        value: fmtUnit(r.value, b.unit),
        change: r.share !== undefined && r.share !== null ? `${Math.round(r.share)}% share` : '—',
        tone: r.tone || 'neutral',
        detail: r.sub || `${b.title} segment`
      }));
    });
    data.attention.forEach((a) => rows.push({
      type: 'attention',
      section: 'Action Required',
      title: a.title,
      value: a.severity.toUpperCase(),
      change: a.module || 'Plant Ops',
      tone: a.severity === 'critical' ? 'negative' : a.severity === 'warning' ? 'caution' : 'info',
      detail: a.detail || 'Operational bottleneck'
    }));

    return rows.filter((r) => {
      if (matrixFilter !== 'all' && r.type !== matrixFilter) return false;
      if (!matrixSearch.trim()) return true;
      const q = matrixSearch.toLowerCase();
      return r.section.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || String(r.value).toLowerCase().includes(q) || r.detail.toLowerCase().includes(q);
    });
  }, [data, matrixSearch, matrixFilter]);

  // Critical bottleneck counts
  const criticalCount = data?.attention?.filter((a) => a.severity === 'critical').length || 0;
  const warningCount = data?.attention?.filter((a) => a.severity === 'warning').length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="report-page">

      {/* ── 1. TOP FAST-SWITCHER NAV BAR ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 8px',
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflowX: 'auto',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <button
          type="button"
          onClick={() => navigate('/dashboards')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            background: 'transparent',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <BarChart3 size={15} /> All Reports
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 4px', flexShrink: 0 }} />

        {REPORTS.map((r) => {
          const isActive = r.endpoint === config.endpoint;
          const Icon = r.icon;
          const rTheme = r.theme || {};
          return (
            <button
              key={r.endpoint}
              type="button"
              onClick={() => navigate(r.path)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 13px',
                borderRadius: 'var(--radius-md)',
                fontSize: 12.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fff' : 'var(--text-secondary)',
                background: isActive ? (rTheme.accent || 'var(--accent-primary)') : 'transparent',
                boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.18)' : 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={14} style={{ color: isActive ? '#fff' : (rTheme.accent || 'inherit') }} />
              {r.title}
              {isActive && (
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#fff',
                  marginLeft: 2
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── 2. DOMAIN IDENTITY HERO HEADER ── */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.lightBg} 0%, var(--surface-raised) 70%)`,
        border: `1px solid ${theme.border}`,
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Decorative corner accent badge */}
        <div style={{
          position: 'absolute',
          top: -24,
          right: -24,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: theme.accent,
          opacity: 0.06,
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: 'var(--radius-pill)',
                background: theme.accent,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <ShieldCheck size={12} /> {theme.badge || 'Automotive Telemetry'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {theme.tagline || 'Operational Precision'}
              </span>
              {config.who && (
                <>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Audience: <strong style={{ color: 'var(--text-secondary)' }}>{config.who}</strong>
                  </span>
                </>
              )}
            </div>

            <h1 style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              {config.title}
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 13.5,
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 780
            }}>
              {config.description}
            </p>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {/* View Mode Toggle & Period Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Dual View Switcher */}
              <div style={{
                display: 'inline-flex',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-pill)',
                padding: 3
              }}>
                <button
                  type="button"
                  onClick={() => setViewMode('cockpit')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'cockpit' ? theme.accent : 'transparent',
                    color: viewMode === 'cockpit' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <LayoutDashboard size={13} /> Cockpit View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('matrix')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'matrix' ? theme.accent : 'transparent',
                    color: viewMode === 'matrix' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <TableIcon size={13} /> Data Matrix
                </button>
              </div>

              {/* Period Selector */}
              <div role="radiogroup" aria-label="Analysis Window" style={{
                display: 'inline-flex',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-pill)',
                padding: 3
              }}>
                {PERIODS.map(([m, label]) => {
                  const isCur = months === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={isCur}
                      onClick={() => choosePeriod(m)}
                      style={{
                        padding: '5px 12px',
                        fontSize: 12,
                        fontWeight: isCur ? 600 : 500,
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-pill)',
                        background: isCur ? theme.accent : 'transparent',
                        color: isCur ? '#fff' : 'var(--text-muted)',
                        boxShadow: isCur ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Utility Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={refresh}
                style={{ fontSize: 12, gap: 6, padding: '5px 11px' }}
                title="Reload live telemetry figures"
              >
                <RefreshCw size={13} className={loading ? 'spin' : ''} />
                Refresh
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={copyBriefing}
                disabled={!readings.length}
                style={{ fontSize: 12, gap: 6, padding: '5px 11px' }}
                title="Copy executive brief to clipboard for plant meetings"
              >
                {copiedSummary ? <Check size={13} style={{ color: 'var(--accent-success)' }} /> : <Copy size={13} />}
                {copiedSummary ? 'Copied Brief' : 'Copy Summary'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={exportCsv}
                disabled={!data}
                style={{ fontSize: 12, gap: 6, padding: '5px 11px' }}
                title="Export all metrics and breakdowns to CSV spreadsheet"
              >
                <Download size={13} />
                Excel / CSV
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
                style={{ fontSize: 12, gap: 6, padding: '5px 11px' }}
                title="Print or export as audit PDF"
              >
                <Printer size={13} />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. ERROR BANNER ── */}
      {error && (
        <div role="alert" style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          padding: 16,
          background: 'var(--status-negative-bg)',
          border: '1px solid var(--status-negative-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--status-negative-fg)'
        }}>
          <AlertCircle size={20} />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: 13.5 }}>Telemetric Data Feed Error</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{error}</span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={refresh}>
            Retry Connection
          </button>
        </div>
      )}

      {/* ── 4. LOADING STATE ── */}
      {loading && !data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 100, borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ height: 120, borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }} />
            ))}
          </div>
          <div style={{ height: 260, borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }} />
        </div>
      )}

      {/* ── 5. LOADED CONTENT ── */}
      {data && (
        <>
          {/* ═══════════ COCKPIT VIEW ═══════════ */}
          {viewMode === 'cockpit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* 5.1 EXECUTIVE INTELLIGENCE BRIEFING */}
              <div style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderLeft: `4px solid ${theme.accent}`,
                borderRadius: 'var(--radius-lg)',
                padding: '18px 22px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-md)',
                      background: theme.lightBg,
                      color: theme.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}>
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Executive Intelligence Brief · {data.period.label}
                      </h3>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        Synthesized multi-dimensional telemetry for leadership reviews
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={copyBriefing}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {copiedSummary ? <Check size={12} style={{ color: 'var(--accent-success)' }} /> : <Copy size={12} />}
                    {copiedSummary ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {readings.map((r, i) => {
                    const isCritical = r.toLowerCase().includes('critical') || r.toLowerCase().includes('action now') || r.toLowerCase().includes('waiting') || r.toLowerCase().includes('worse');
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: isCritical ? 'var(--status-negative-bg)' : 'var(--bg-secondary)',
                          border: `1px solid ${isCritical ? 'var(--status-negative-border)' : 'var(--border-subtle)'}`
                        }}
                      >
                        <span style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: isCritical ? 'var(--status-negative-fg)' : theme.accent,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 1
                        }}>
                          {i + 1}
                        </span>
                        <p style={{
                          margin: 0,
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: isCritical ? 'var(--status-negative-fg)' : 'var(--text-primary)',
                          fontWeight: isCritical ? 600 : 400
                        }}>
                          {r}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5.2 OPERATIONAL BOTTLENECKS (NEEDS ATTENTION) */}
              {data.attention && data.attention.length > 0 && (
                <section style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-md)',
                        background: criticalCount > 0 ? 'var(--status-negative-bg)' : 'var(--status-caution-bg)',
                        color: criticalCount > 0 ? 'var(--status-negative-fg)' : 'var(--status-caution-fg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <AlertTriangle size={18} />
                      </span>
                      <div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          Operational Bottlenecks & Disruptions
                        </h2>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Direct operational escalations requiring immediate resolution
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {criticalCount > 0 && (
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--status-negative-bg)',
                          color: 'var(--status-negative-fg)',
                          border: '1px solid var(--status-negative-border)'
                        }}>
                          {criticalCount} Critical Blocker{criticalCount === 1 ? '' : 's'}
                        </span>
                      )}
                      {warningCount > 0 && (
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--status-caution-bg)',
                          color: 'var(--status-caution-fg)',
                          border: '1px solid var(--status-caution-border)'
                        }}>
                          {warningCount} Warning{warningCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>

                  <AttentionList items={data.attention} />
                </section>
              )}

              {/* 5.3 HEADLINE TELEMETRY CARDS */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', margin: 0 }}>
                    Core Key Performance Indicators
                  </h2>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Comparative analysis vs preceding {months}M window
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
                  {data.headline.map((h) => {
                    const Icon = config.icons?.[h.key] || ShieldCheck;
                    return (
                      <StatCard
                        key={h.key}
                        label={h.label}
                        value={fmtUnit(h.value, h.unit)}
                        muted={h.value === null || h.value === undefined}
                        icon={Icon}
                        tone={h.tone === 'negative' ? 'red' : h.tone === 'caution' ? 'amber' : h.tone === 'positive' ? 'green' : 'blue'}
                        trend={typeof h.delta === 'number' ? h.delta : undefined}
                        trendUpIsGood={h.upIsGood !== false}
                        trendUnit={h.deltaIsPoints ? ' pts' : '%'}
                        caption={h.caption}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 5.4 TIME SERIES CHARTS (HISTORICAL TRAJECTORY) */}
              {seriesGroups.map((g) => {
                const series = data.series.filter((s) => g.keys.includes(s.key));
                if (!series.length) return null;
                return (
                  <section
                    key={g.title}
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-sm)',
                      padding: '18px 20px',
                      minWidth: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                      <div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {g.title}
                        </h2>
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                          {g.caption || `Month by month progression across ${data.period.label}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                          {series.length} Data Stream{series.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    <TrendChart series={series} unit={series[0]?.unit || 'count'} />
                  </section>
                );
              })}

              {/* 5.5 DUAL-MODE BREAKDOWNS (DONUT & PARETO BARS) */}
              {data.breakdowns.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', margin: 0 }}>
                        Analytical Breakdown & Pareto Distributions
                      </h2>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Segment splits, volume distribution, and ranked contributors
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: 16 }}>
                    {data.breakdowns.map((b) => {
                      const how = config.breakdowns?.[b.key] || 'bars';
                      const currentMode = breakdownModes[b.key] || 'visual';
                      const searchTerm = breakdownSearches[b.key] || '';

                      // Filter rows if search is typed
                      const filteredRows = b.rows.filter((r) =>
                        !searchTerm.trim() || r.label.toLowerCase().includes(searchTerm.toLowerCase()) || String(r.value).includes(searchTerm)
                      );

                      return (
                        <section
                          key={b.key}
                          style={{
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-sm)',
                            padding: '18px 20px',
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          {/* Card Header with Table/Chart Switcher & Search */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                            <div>
                              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {b.title}
                              </h3>
                              {b.caption && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                  {b.caption}
                                </div>
                              )}
                            </div>

                            {/* View Switcher for this breakdown */}
                            <div style={{
                              display: 'inline-flex',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-pill)',
                              padding: 2
                            }}>
                              <button
                                type="button"
                                onClick={() => setBreakdownModes({ ...breakdownModes, [b.key]: 'visual' })}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-pill)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentMode === 'visual' ? theme.accent : 'transparent',
                                  color: currentMode === 'visual' ? '#fff' : 'var(--text-muted)'
                                }}
                              >
                                Visual
                              </button>
                              <button
                                type="button"
                                onClick={() => setBreakdownModes({ ...breakdownModes, [b.key]: 'table' })}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-pill)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentMode === 'table' ? theme.accent : 'transparent',
                                  color: currentMode === 'table' ? '#fff' : 'var(--text-muted)'
                                }}
                              >
                                Table
                              </button>
                            </div>
                          </div>

                          {/* Quick In-Card Search if rows >= 5 */}
                          {b.rows.length >= 5 && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ position: 'relative' }}>
                                <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                  type="text"
                                  placeholder={`Filter ${b.title.toLowerCase()}...`}
                                  value={searchTerm}
                                  onChange={(e) => setBreakdownSearches({ ...breakdownSearches, [b.key]: e.target.value })}
                                  style={{
                                    width: '100%',
                                    padding: '5px 10px 5px 28px',
                                    fontSize: 12,
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)'
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Content: Visual Mode */}
                          {currentMode === 'visual' ? (
                            <div style={{ flex: 1 }}>
                              {how === 'donut' ? (
                                <Donut rows={filteredRows} unit={b.unit} centreLabel={config.donutLabel?.[b.key] || 'Total'} />
                              ) : (
                                <BarList rows={filteredRows} unit={b.unit} emptyText={config.emptyText?.[b.key] || 'No entries in this period.'} />
                              )}
                            </div>
                          ) : (
                            /* Content: Tabular Mode */
                            <div style={{ flex: 1, overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '6px 4px', fontWeight: 600 }}>Rank & Name</th>
                                    <th style={{ padding: '6px 4px', fontWeight: 600, textAlign: 'right' }}>Metric</th>
                                    <th style={{ padding: '6px 4px', fontWeight: 600, textAlign: 'right' }}>Share</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredRows.map((r, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                      <td style={{ padding: '8px 4px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                        <span style={{ color: 'var(--text-muted)', marginRight: 6, fontVariantNumeric: 'tabular-nums' }}>#{idx + 1}</span>
                                        {r.label}
                                        {r.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.sub}</div>}
                                      </td>
                                      <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                        {fmtUnit(r.value, b.unit)}
                                      </td>
                                      <td style={{ padding: '8px 4px', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                                        {r.share !== undefined && r.share !== null ? `${Math.round(r.share)}%` : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                  {!filteredRows.length && (
                                    <tr>
                                      <td colSpan={3} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                                        No matching items found.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5.6 IATF 16949 STANDARDS REFERENCE DRAWER */}
              {config.explain && (
                <div style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowStandards(!showStandards)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <HelpCircle size={17} style={{ color: theme.accent }} />
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          IATF 16949 Metric Standards & Operational Glossaries
                        </span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>
                          Calculation formulas, source tables, and compliance requirements
                        </span>
                      </div>
                    </div>
                    {showStandards ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
                  </button>

                  {showStandards && (
                    <div style={{
                      padding: '0 20px 18px',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: 16
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                        {config.explain.map(([term, desc], idx) => (
                          <div key={idx} style={{
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, marginBottom: 4 }}>
                              {term}
                            </strong>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.5 }}>
                              {desc}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ DATA MATRIX AUDIT VIEW ═══════════ */}
          {viewMode === 'matrix' && (
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px 24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              {/* Controls Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TableIcon size={18} style={{ color: theme.accent }} />
                    Audit Data Matrix · {data.period.label}
                  </h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Comprehensive tabular ledger of all {matrixRows.length} recorded telemetric datapoints
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Category Filter */}
                  <div style={{
                    display: 'inline-flex',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-pill)',
                    padding: 2
                  }}>
                    {[
                      ['all', 'All Datapoints'],
                      ['headline', 'Headlines'],
                      ['series', 'Monthly Trend'],
                      ['breakdown', 'Breakdowns'],
                      ['attention', 'Bottlenecks']
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setMatrixFilter(key)}
                        style={{
                          padding: '4px 10px',
                          fontSize: 11.5,
                          fontWeight: matrixFilter === key ? 600 : 500,
                          borderRadius: 'var(--radius-pill)',
                          border: 'none',
                          cursor: 'pointer',
                          background: matrixFilter === key ? theme.accent : 'transparent',
                          color: matrixFilter === key ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search matrix..."
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      style={{
                        padding: '6px 12px 6px 30px',
                        fontSize: 12.5,
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        width: 200
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={exportCsv}
                    style={{ fontSize: 12, gap: 6, padding: '6px 12px' }}
                  >
                    <Download size={13} /> Export Ledger
                  </button>
                </div>
              </div>

              {/* Table Body */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 600, width: 200 }}>Category / Section</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Indicator / Item</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Recorded Value</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Variance / Share</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Operational Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'var(--surface-raised)' : 'var(--bg-primary)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            {r.section}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {r.title}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: r.tone === 'negative' ? 'var(--status-negative-fg)' : r.tone === 'positive' ? 'var(--status-positive-fg)' : 'var(--text-primary)' }}>
                          {r.value}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                          {r.change}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>
                          {r.detail}
                        </td>
                      </tr>
                    ))}
                    {!matrixRows.length && (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No datapoints matched the search filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportPage;

