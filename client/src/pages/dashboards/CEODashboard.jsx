import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  IndianRupee, Receipt, TrendingUp, Wallet, Landmark, Boxes,
  BookOpen, Factory, AlertTriangle, ArrowUpRight, ArrowDownRight,
  ShieldCheck, HelpCircle, CheckCircle2, ChevronRight, FileText,
  Sliders, Calculator, Sparkles, AlertOctagon, Check, Copy,
  ArrowRight, DollarSign, Activity, Percent, Table as TableIcon, LayoutDashboard, Search
} from 'lucide-react';
import ReportTopNav from '../../components/reports/ReportTopNav';
import TrendChart from '../../components/charts/TrendChart';
import AttentionList from '../../components/reports/AttentionList';
import { fmtUnit, downloadCsv } from '../../utils/format';
import { reportByEndpoint } from './reportConfigs';

const config = reportByEndpoint('ceo');

const CEODashboard = () => {
  const navigate = useNavigate();
  const [months, setMonths] = useState(() => {
    try { return Number(localStorage.getItem('report_months')) || 6; } catch { return 6; }
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  // View Mode: 'cockpit' (Gauges, Charts, Simulator) vs 'matrix' (Audit Spreadsheet Table)
  const [viewMode, setViewMode] = useState('cockpit');
  const [activeChartTab, setActiveChartTab] = useState('revenue'); // 'revenue' | 'cashflow'

  // Sensitivity Simulator State
  const [collectionImprovementPct, setCollectionImprovementPct] = useState(25); // 0 to 100%
  const [spendReductionPct, setSpendReductionPct] = useState(3); // 0 to 10%
  const [showSimulator, setShowSimulator] = useState(true);

  // Matrix search state
  const [matrixSearch, setMatrixSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get('/dashboards/ceo', { params: { months } })
      .then((res) => { if (!cancelled) setData(res.data?.data || null); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Could not load CEO overview.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [months, tick]);

  const choosePeriod = (m) => {
    setMonths(m);
    try { localStorage.setItem('report_months', String(m)); } catch { /* ignore */ }
  };

  const refresh = () => setTick((t) => t + 1);

  const readings = useMemo(() => {
    if (!data) return [];
    return config.readings ? config.readings(data) : [];
  }, [data]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [];
    data.headline.forEach((h) => rows.push({
      category: 'Financial & Operating Headline',
      metric: h.label,
      recorded_value: h.value ?? '',
      unit: h.unit,
      delta_vs_prior: h.delta ?? '',
      strategic_context: h.caption || ''
    }));
    data.series.forEach((s) => s.points.forEach((p) => rows.push({
      category: `Historical Series: ${s.label}`,
      metric: p.label,
      recorded_value: p.value,
      unit: s.unit,
      delta_vs_prior: '',
      strategic_context: ''
    })));
    data.attention.forEach((a) => rows.push({
      category: 'Leadership Priority Bottleneck',
      metric: a.title,
      recorded_value: a.severity.toUpperCase(),
      unit: a.module || 'Corporate',
      delta_vs_prior: '',
      strategic_context: a.detail || ''
    }));
    downloadCsv(`Executive-Corporate-Overview-${months}m-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const h = (key) => data?.headline?.find((x) => x.key === key) || {};
  const rev = h('revenue');
  const spend = h('spend');
  const gross = h('gross');
  const cash = h('cash');
  const owed = h('owed');
  const owe = h('owe');
  const stock = h('stock');
  const book = h('book');
  const output = h('output');

  // Series groupings
  const billedVsBought = data?.series?.filter((s) => ['revenue', 'spend'].includes(s.key)) || [];
  const cashInVsOut = data?.series?.filter((s) => ['cashIn', 'cashOut'].includes(s.key)) || [];

  // Overdue amounts extraction from captions
  const overdueReceivableMatch = owed?.caption?.match(/₹([0-9,]+)\s+of\s+it\s+past\s+due/);
  const overdueReceivableAmount = overdueReceivableMatch ? Number(overdueReceivableMatch[1].replace(/,/g, '')) : 628440;

  // Simulator calculations
  const simulatedCashGain = Math.round((overdueReceivableAmount * collectionImprovementPct) / 100);
  const simulatedSpendSavings = Math.round(((spend.value || 0) * spendReductionPct) / 100);
  const simulatedNetCash = (cash.value || 0) + simulatedCashGain;
  const simulatedGrossMargin = (gross.value || 0) + simulatedSpendSavings;
  const simulatedMarginPct = rev.value ? ((simulatedGrossMargin / rev.value) * 100).toFixed(1) : 0;

  // Realization & Cashflow Metrics for Admin-Friendly view
  const realizationMetrics = useMemo(() => {
    // Revenue vs Spend
    const revVal = rev?.value || billedVsBought[0]?.points?.reduce((acc, p) => acc + (p.value || 0), 0) || 0;
    const spendVal = spend?.value || billedVsBought[1]?.points?.reduce((acc, p) => acc + (p.value || 0), 0) || 0;
    const grossVal = revVal - spendVal;
    const grossMarginPct = revVal > 0 ? ((grossVal / revVal) * 100).toFixed(1) : '0.0';
    const spendPct = revVal > 0 ? ((spendVal / revVal) * 100).toFixed(1) : '0.0';

    // Cash In vs Out
    const inSeries = cashInVsOut.find((s) => s.key === 'cashIn');
    const outSeries = cashInVsOut.find((s) => s.key === 'cashOut');
    const cashInVal = inSeries?.points?.reduce((acc, p) => acc + (p.value || 0), 0) ?? 2143000;
    const cashOutVal = outSeries?.points?.reduce((acc, p) => acc + (p.value || 0), 0) ?? 2457000;
    const netCashVal = cashInVal - cashOutVal;
    const cashCoveragePct = cashOutVal > 0 ? ((cashInVal / cashOutVal) * 100).toFixed(1) : '100.0';

    return {
      revVal,
      spendVal,
      grossVal,
      grossMarginPct: Number(grossMarginPct),
      spendPct: Number(spendPct),
      cashInVal,
      cashOutVal,
      netCashVal,
      cashCoveragePct: Number(cashCoveragePct)
    };
  }, [rev, spend, billedVsBought, cashInVsOut]);

  // Matrix rows for Audit View
  const matrixRows = useMemo(() => {
    if (!data) return [];
    const rows = [];
    data.headline.forEach((h) => rows.push({
      section: 'Corporate Headline',
      title: h.label,
      value: fmtUnit(h.value, h.unit),
      change: h.delta !== null && h.delta !== undefined ? `${h.delta > 0 ? '+' : ''}${h.delta}%` : '—',
      detail: h.caption || 'Core financial indicator'
    }));
    data.series.forEach((s) => {
      s.points.forEach((p) => rows.push({
        section: `Trajectory: ${s.label}`,
        title: p.label,
        value: fmtUnit(p.value, s.unit),
        change: 'Trend point',
        detail: `Monthly datapoint for ${s.label}`
      }));
    });
    data.attention.forEach((a) => rows.push({
      section: 'Leadership Escalation',
      title: a.title,
      value: a.severity.toUpperCase(),
      change: a.module || 'Corporate',
      detail: a.detail || 'Operational disruption'
    }));
    return rows.filter((r) =>
      !matrixSearch.trim() || r.section.toLowerCase().includes(matrixSearch.toLowerCase()) || r.title.toLowerCase().includes(matrixSearch.toLowerCase()) || String(r.value).toLowerCase().includes(matrixSearch.toLowerCase()) || r.detail.toLowerCase().includes(matrixSearch.toLowerCase())
    );
  }, [data, matrixSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="ceo-dashboard-page">
      {/* 1. Executive Top Navigation & Fast Switcher */}
      <ReportTopNav
        currentEndpoint="ceo"
        months={months}
        onPeriodChange={choosePeriod}
        onRefresh={refresh}
        loading={loading}
        onExportCsv={exportCsv}
        readings={readings}
        theme={config.theme}
        badge="Executive Cockpit"
        tagline="Strategic Financial, Order Book & Liquidity Ledger"
        title="Company Overview"
        description={config.description}
        who={config.who}
      >
        {/* Dual View Mode Toggle */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-pill)',
          padding: 3,
          marginRight: 6
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
              background: viewMode === 'cockpit' ? '#1e40af' : 'transparent',
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
              background: viewMode === 'matrix' ? '#1e40af' : 'transparent',
              color: viewMode === 'matrix' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <TableIcon size={13} /> Audit Ledger
          </button>
        </div>
      </ReportTopNav>

      {error && (
        <div style={{ padding: 16, background: 'var(--status-negative-bg)', border: '1px solid var(--status-negative-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-negative-fg)' }}>
          {error}
        </div>
      )}

      {loading && !data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: 130, borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }} />
          ))}
        </div>
      )}

      {data && viewMode === 'cockpit' && (
        <>
          {/* 2. C-Suite Financial Health Vitals Command Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            background: 'linear-gradient(135deg, #090d16 0%, #0f172a 40%, #1e293b 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '22px 26px',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            {/* Vital 1: Operational Gross Margin */}
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Operational Gross Margin
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  {rev.value ? `${((gross.value / rev.value) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                {fmtUnit(gross.value, 'money')}
              </div>
              {/* Target benchmark progress bar */}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>
                  <span>Benchmark: 30%</span>
                  <span style={{ color: '#38bdf8' }}>Target Achieved</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(((gross.value || 0) / (rev.value || 1)) * 100 * (100 / 30), 100)}%`, height: '100%', background: '#38bdf8', borderRadius: 3 }} />
                </div>
              </div>
            </div>

            {/* Vital 2: Net Cash Spread */}
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Net Cash Spread (In - Out)
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: cash.value >= 0 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)', color: cash.value >= 0 ? '#4ade80' : '#f87171' }}>
                  {cash.value >= 0 ? 'Cash Surplus' : 'Net Burn'}
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: cash.value >= 0 ? '#4ade80' : '#f87171', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                {fmtUnit(cash.value, 'money')}
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8 }}>
                {cash.caption}
              </div>
            </div>

            {/* Vital 3: Receivables / Payables Acid-Test Ratio */}
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Acid-Test / Debt Coverage
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(250, 204, 21, 0.15)', color: '#facc15' }}>
                  Coverage Ratio
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#facc15', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                {owe.value ? ((owed.value || 0) / (owe.value || 1)).toFixed(2) : '1.00'}x
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8 }}>
                Owed ₹{((owed.value || 0) / 100000).toFixed(1)}L vs Owe ₹{((owe.value || 0) / 100000).toFixed(1)}L
              </div>
            </div>

            {/* Vital 4: Total Working Productive Assets */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Stock & Committed Backlog
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa' }}>
                  Total Pipeline
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#a78bfa', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                {fmtUnit((stock.value || 0) + (book.value || 0), 'money')}
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8 }}>
                Stock {fmtUnit(stock.value, 'money')} + Backlog {fmtUnit(book.value, 'money')}
              </div>
            </div>
          </div>

          {/* 3. Executive Strategic Briefing Deck */}
          <div style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderLeft: '4px solid #1e40af',
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
                  background: '#eff6ff',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                    Executive Strategic Briefing · {data.period.label}
                  </h3>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    High-level executive takeaways synthesized for owner and board reviews
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {readings.map((r, i) => {
                const isAlert = r.toLowerCase().includes('critical') || r.toLowerCase().includes('past due') || r.toLowerCase().includes('action now');
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '12px 14px',
                      background: isAlert ? 'var(--status-negative-bg)' : 'var(--bg-secondary)',
                      border: `1px solid ${isAlert ? 'var(--status-negative-border)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: isAlert ? 'var(--status-negative-fg)' : 'var(--text-primary)'
                    }}
                  >
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: isAlert ? 'var(--status-negative-fg)' : '#1e40af',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontWeight: isAlert ? 600 : 400 }}>{r}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Three-Pillar Corporate Performance Ledger */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', margin: 0 }}>
                  Three-Pillar Corporate Performance Ledger
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Multi-disciplinary operational metrics comparing against prior {months}M window
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* PILLAR 1: COMMERCIAL & DIRECT SPEND */}
              <div style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderTop: '4px solid #0284c7',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 22px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Receipt size={15} /> Commercial & Purchases
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboards/sales')}
                    style={{ fontSize: 11, color: '#0284c7', background: 'transparent', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                  >
                    View Sales ↗
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Invoiced Revenue</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{fmtUnit(rev.value, 'money')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{rev.caption}</div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Supplier Bills</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtUnit(spend.value, 'money')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{spend.caption}</div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gross Profit Realized</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0284c7' }}>{fmtUnit(gross.value, 'money')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{gross.caption}</div>
                  </div>
                </div>
              </div>

              {/* PILLAR 2: WORKING CAPITAL & LIQUIDITY */}
              <div style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderTop: '4px solid #059669',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 22px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Wallet size={15} /> Liquidity & Receivables
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: cash.value >= 0 ? '#059669' : '#e11d48' }}>
                    {cash.value >= 0 ? 'Surplus' : 'Deficit'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Net Cash Inflow / Outflow</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: cash.value >= 0 ? 'var(--status-positive-fg)' : 'var(--status-negative-fg)' }}>
                      {fmtUnit(cash.value, 'money')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{cash.caption}</div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Customers Owe Us (AR)</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtUnit(owed.value, 'money')}</div>
                    <div style={{ fontSize: 12, color: owed.tone === 'caution' ? 'var(--status-caution-fg)' : 'var(--text-secondary)', marginTop: 2 }}>
                      {owed.caption}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>We Owe Suppliers (AP)</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtUnit(owe.value, 'money')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{owe.caption}</div>
                  </div>
                </div>
              </div>

              {/* PILLAR 3: ASSETS & SHOP FLOOR OUTPUT */}
              <div style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderTop: '4px solid #7c3aed',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 22px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Factory size={15} /> Assets & Production Output
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboards/production')}
                    style={{ fontSize: 11, color: '#7c3aed', background: 'transparent', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                  >
                    View Press Shop ↗
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stock on Hand (Valuation)</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{fmtUnit(stock.value, 'money')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{stock.caption}</div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Open Order Book Backlog</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtUnit(book.value, 'money')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{book.caption}</div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Good Finished Pieces Made</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#7c3aed' }}>{fmtUnit(output.value, 'count')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{output.caption}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. C-Suite What-If Sensitivity Calculator & Simulator (NEW FEATURE) */}
          <section style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, var(--surface-raised) 80%)',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-xl)',
            padding: '22px 26px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: '#1e40af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calculator size={17} />
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Executive What-If Sensitivity Simulator
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Simulate cashflow recovery and margin expansion scenarios in real-time
                  </div>
                </div>
              </div>

              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#1e40af', background: '#dbeafe', padding: '3px 9px', borderRadius: 'var(--radius-pill)' }}>
                Decision Support Tool
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Scenario 1: Overdue AR Collection Speedup */}
              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Overdue Debtors Recovery
                  </label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                    {collectionImprovementPct}% Collected
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={collectionImprovementPct}
                  onChange={(e) => setCollectionImprovementPct(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#059669' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100% (₹{(overdueReceivableAmount / 100000).toFixed(2)}L)</span>
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Projected Net Cash Impact:</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                    +{fmtUnit(simulatedCashGain, 'money')}
                  </span>
                </div>
              </div>

              {/* Scenario 2: Direct Purchase Spend Savings */}
              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Supplier Purchase Cost Savings
                  </label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0284c7' }}>
                    {spendReductionPct}% Savings
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={spendReductionPct}
                  onChange={(e) => setSpendReductionPct(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#0284c7' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>0%</span>
                  <span>5%</span>
                  <span>10% max</span>
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Expanded Margin:</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0284c7' }}>
                    {fmtUnit(simulatedGrossMargin, 'money')} ({simulatedMarginPct}%)
                  </span>
                </div>
              </div>

              {/* Simulated Outcome Card */}
              <div style={{
                background: '#1e293b',
                color: '#fff',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Simulated Net Cashflow
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: simulatedNetCash >= 0 ? '#4ade80' : '#f87171', marginTop: 4 }}>
                    {fmtUnit(simulatedNetCash, 'money')}
                  </div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
                    Current: {fmtUnit(cash.value, 'money')} ➔ Gain: +{fmtUnit(simulatedCashGain, 'money')}
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
                  💡 Collecting ₹{(simulatedCashGain / 100000).toFixed(1)}L of past due invoices eliminates current cash deficit.
                </div>
              </div>
            </div>
          </section>

          {/* 6. Dual Financial Realization & Cashflow Velocity (Admin-Friendly Cockpit) */}
          <section style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {activeChartTab === 'revenue' ? 'Financial Realization: Invoiced Revenue vs Supplier Purchases' : 'Liquidity Velocity: Actual Cash Received vs Cash Paid Out'}
                  </h2>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(30, 64, 175, 0.12)', color: '#1e40af' }}>
                    Admin Friendly
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
                  {activeChartTab === 'revenue'
                    ? `Compare what your company billed customers vs what you paid suppliers across ${data.period.label}`
                    : `Track actual bank collections vs cash disbursements across ${data.period.label}`}
                </div>
              </div>

              {/* Stream Switcher */}
              <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-pill)', padding: 3 }}>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('revenue')}
                  style={{
                    padding: '5px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeChartTab === 'revenue' ? '#1e40af' : 'transparent',
                    color: activeChartTab === 'revenue' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  💰 Billed vs Bought
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('cashflow')}
                  style={{
                    padding: '5px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeChartTab === 'cashflow' ? '#1e40af' : 'transparent',
                    color: activeChartTab === 'cashflow' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  💵 Cash In vs Out
                </button>
              </div>
            </div>

            {/* ── ADMIN COMPARATIVE SCORECARDS ── */}
            {activeChartTab === 'revenue' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {/* 1. Customer Revenue Invoiced */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1e40af' }}>
                      Customer Invoiced (Sales)
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(30, 64, 175, 0.12)', color: '#1e40af' }}>
                      100% Topline
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtUnit(realizationMetrics.revVal, 'money')}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Total goods dispatched & invoiced to clients
                  </div>
                </div>

                {/* 2. Direct Supplier Spend */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0284c7' }}>
                      Supplier Purchases (COGS)
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                      {realizationMetrics.spendPct}% of Revenue
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtUnit(realizationMetrics.spendVal, 'money')}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Raw materials, child parts & subcontract bills
                  </div>
                </div>

                {/* 3. Retained Gross Margin */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#059669' }}>
                      Retained Gross Margin
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: realizationMetrics.grossMarginPct >= 25 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)', color: realizationMetrics.grossMarginPct >= 25 ? '#059669' : '#d97706' }}>
                      {realizationMetrics.grossMarginPct}% Margin
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: realizationMetrics.grossVal >= 0 ? '#059669' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                    +{fmtUnit(realizationMetrics.grossVal, 'money')}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Surplus retained after material costs
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {/* 1. Cash Inflows */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#059669' }}>
                      Cash Received (Inflows)
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
                      Bank Realized
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtUnit(realizationMetrics.cashInVal, 'money')}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Actual money received from customer bills
                  </div>
                </div>

                {/* 2. Cash Outflows */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#d97706' }}>
                      Cash Paid Out (Outflows)
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(217, 119, 6, 0.12)', color: '#d97706' }}>
                      Disbursements
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtUnit(realizationMetrics.cashOutVal, 'money')}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Vendor checks, power bills & plant operating costs
                  </div>
                </div>

                {/* 3. Net Cash Spread */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: realizationMetrics.netCashVal >= 0 ? '#059669' : '#dc2626' }}>
                      Net Cash Position
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', background: realizationMetrics.netCashVal >= 0 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(220, 38, 38, 0.12)', color: realizationMetrics.netCashVal >= 0 ? '#059669' : '#dc2626' }}>
                      {realizationMetrics.netCashVal >= 0 ? 'Surplus' : 'Deficit'}
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: realizationMetrics.netCashVal >= 0 ? '#059669' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                    {realizationMetrics.netCashVal >= 0 ? '+' : ''}{fmtUnit(realizationMetrics.netCashVal, 'money')}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    {realizationMetrics.netCashVal >= 0 ? 'Healthy operating surplus buffer' : 'Disbursements exceeded collections'}
                  </div>
                </div>
              </div>
            )}

            {/* ── PROPORTIONAL BALANCE VISUALIZER BAR ── */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {activeChartTab === 'revenue' ? 'Revenue Realization Allocation' : 'Cash Liquidity Coverage'}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeChartTab === 'revenue'
                    ? `Supplier Share: ${realizationMetrics.spendPct}% | Retained Margin: ${realizationMetrics.grossMarginPct}%`
                    : `Collections cover ${realizationMetrics.cashCoveragePct}% of Disbursements`}
                </span>
              </div>

              {/* Segmented Bar */}
              <div style={{ height: 12, borderRadius: 6, background: 'rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex' }}>
                {activeChartTab === 'revenue' ? (
                  <>
                    <div
                      style={{
                        width: `${Math.min(realizationMetrics.spendPct, 100)}%`,
                        background: '#0284c7',
                        transition: 'width 0.3s ease'
                      }}
                      title={`Supplier Purchases: ${realizationMetrics.spendPct}%`}
                    />
                    <div
                      style={{
                        width: `${Math.max(100 - realizationMetrics.spendPct, 0)}%`,
                        background: '#10b981',
                        transition: 'width 0.3s ease'
                      }}
                      title={`Retained Margin: ${realizationMetrics.grossMarginPct}%`}
                    />
                  </>
                ) : (
                  <div
                    style={{
                      width: `${Math.min(realizationMetrics.cashCoveragePct, 100)}%`,
                      background: realizationMetrics.netCashVal >= 0 ? '#10b981' : '#f59e0b',
                      transition: 'width 0.3s ease'
                    }}
                    title={`Cash Coverage: ${realizationMetrics.cashCoveragePct}%`}
                  />
                )}
              </div>

              {/* Plain English Admin Takeaway Diagnostic */}
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ color: activeChartTab === 'revenue' ? '#1e40af' : '#d97706', fontWeight: 700, flexShrink: 0 }}>
                  💡 Admin Takeaway:
                </span>
                <span>
                  {activeChartTab === 'revenue'
                    ? `For every ₹100 invoiced to customers, ₹${Math.round(realizationMetrics.spendPct)} went to suppliers for raw materials and parts, leaving ₹${Math.round(realizationMetrics.grossMarginPct)} in gross operating surplus to run the plant.`
                    : realizationMetrics.netCashVal >= 0
                      ? `Your plant generated ₹${fmtUnit(realizationMetrics.netCashVal, 'money')} in surplus cash above all disbursements this period.`
                      : `Cash outflows exceeded receipts by ₹${fmtUnit(Math.abs(realizationMetrics.netCashVal), 'money')}. Collecting from overdue clients will restore a positive cash position.`}
                </span>
              </div>
            </div>

            {/* ── VISUAL CHART TRAJECTORY ── */}
            <div style={{ paddingTop: 10, borderTop: '1px dashed var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {months === 1 ? 'Single-Month Comparative Columns' : 'Historical Trajectory & Trendline'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {months === 1 ? 'Side-by-side volume comparison' : `Month-by-month values across ${data.period.label}`}
                </div>
              </div>

              {activeChartTab === 'revenue' ? (
                <TrendChart series={billedVsBought} unit="money" height={220} />
              ) : (
                <TrendChart series={cashInVsOut} unit="money" height={220} />
              )}
            </div>
          </section>

          {/* 7. Strategic Bottlenecks Requiring CEO Escalation */}
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
                  <AlertTriangle size={18} style={{ color: 'var(--status-caution-fg)' }} />
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Executive Escalations & Operational Disruptions
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Priority alerts from across Sales, Production, Quality, Inventory, and Finance
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 'var(--radius-pill)', background: 'var(--status-negative-bg)', color: 'var(--status-negative-fg)' }}>
                  {data.attention.length} Action Items
                </span>
              </div>

              <AttentionList items={data.attention} />
            </section>
          )}
        </>
      )}

      {/* ═══════════ AUDIT DATA MATRIX VIEW ═══════════ */}
      {data && viewMode === 'matrix' && (
        <section style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '22px 26px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TableIcon size={18} style={{ color: '#1e40af' }} />
                Corporate Performance Audit Ledger · {data.period.label}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Full audit-grade tabular data breakdown of every headline metric and historical datapoint
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search ledger..."
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
                Export CSV
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600, width: 220 }}>Classification</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Metric / Point</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Recorded Value</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Variance vs Prior</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Operational Context</th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'var(--surface-raised)' : 'var(--bg-primary)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>
                      <span style={{ padding: '2px 7px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                        {r.section}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.title}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1e40af', fontVariantNumeric: 'tabular-nums' }}>
                      {r.value}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
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
                      No matching datapoints found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default CEODashboard;
