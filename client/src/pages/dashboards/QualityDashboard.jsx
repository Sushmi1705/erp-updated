import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ClipboardCheck, Search, XCircle, PackageX, ShieldAlert, ShieldCheck,
  AlertTriangle, CheckCircle2, ArrowRight, Layers, FileWarning, Check
} from 'lucide-react';
import ReportTopNav from '../../components/reports/ReportTopNav';
import TrendChart from '../../components/charts/TrendChart';
import AttentionList from '../../components/reports/AttentionList';
import BarList from '../../components/charts/BarList';
import Donut from '../../components/charts/Donut';
import { fmtUnit, downloadCsv } from '../../utils/format';
import { reportByEndpoint } from './reportConfigs';

const config = reportByEndpoint('quality');

const QualityDashboard = () => {
  const [months, setMonths] = useState(() => {
    try { return Number(localStorage.getItem('report_months')) || 6; } catch { return 6; }
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get('/dashboards/quality', { params: { months } })
      .then((res) => { if (!cancelled) setData(res.data?.data || null); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Could not load quality report.'); })
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
      section: 'Quality Assurance Headline',
      metric: h.label,
      value: h.value ?? '',
      unit: h.unit,
      delta: h.delta ?? '',
      notes: h.caption || ''
    }));
    data.series.forEach((s) => s.points.forEach((p) => rows.push({
      section: `Quality Series: ${s.label}`,
      metric: p.label,
      value: p.value,
      unit: s.unit,
      delta: '',
      notes: ''
    })));
    data.breakdowns.forEach((b) => b.rows.forEach((r, idx) => rows.push({
      section: `Breakdown: ${b.title}`,
      metric: `#${idx + 1} ${r.label}`,
      value: r.value ?? '',
      unit: b.unit,
      delta: r.share ? `${r.share}%` : '',
      notes: r.sub || ''
    })));
    downloadCsv(`IATF-16949-Quality-Report-${months}m-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const h = (key) => data?.headline?.find((x) => x.key === key) || {};
  const inspections = h('inspections');
  const failRate = h('failRate');
  const incRate = h('incRate');
  const ncrOpen = h('ncrOpen');

  const stages = data?.breakdowns?.find((b) => b.key === 'stages')?.rows || [];
  const defects = data?.breakdowns?.find((b) => b.key === 'defects')?.rows || [];
  const ncrStatus = data?.breakdowns?.find((b) => b.key === 'ncr')?.rows || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="quality-dashboard-page">
      {/* 1. Header Ribbon */}
      <ReportTopNav
        currentEndpoint="quality"
        months={months}
        onPeriodChange={choosePeriod}
        onRefresh={refresh}
        loading={loading}
        onExportCsv={exportCsv}
        readings={readings}
        theme={config.theme}
        badge="IATF 16949 Assurance"
        tagline="Defect Pareto, Gate Rejections & Corrective Actions (CAPA)"
        title="Quality Report"
        description={config.description}
        who={config.who}
      />

      {error && (
        <div style={{ padding: 16, background: 'var(--status-negative-bg)', border: '1px solid var(--status-negative-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-negative-fg)' }}>
          {error}
        </div>
      )}

      {loading && !data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 120, borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }} />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* 2. Quality Assurance Telemetry Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {/* Inspections Done */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #6d28d9',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inspections Conducted</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#6d28d9' }}>
                {fmtUnit(inspections.value, 'count')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {inspections.caption}
              </div>
            </div>

            {/* Overall Fail Rate */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: `3px solid ${(failRate.value || 0) > 5 ? 'var(--status-negative-fg)' : '#059669'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inspection Fail Rate</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: (failRate.value || 0) > 5 ? 'var(--status-negative-bg)' : '#d1fae5', color: (failRate.value || 0) > 5 ? 'var(--status-negative-fg)' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: (failRate.value || 0) > 5 ? 'var(--status-negative-fg)' : '#059669' }}>
                {fmtUnit(failRate.value, 'percent')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {failRate.caption}
              </div>
            </div>

            {/* Gate Incoming Rejection */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: `3px solid ${(incRate.value || 0) > 5 ? 'var(--status-caution-fg)' : '#0284c7'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gate Incoming Rejection</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: (incRate.value || 0) > 5 ? 'var(--status-caution-bg)' : '#e0f2fe', color: (incRate.value || 0) > 5 ? 'var(--status-caution-fg)' : '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageX size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: (incRate.value || 0) > 5 ? 'var(--status-caution-fg)' : '#0284c7' }}>
                {fmtUnit(incRate.value, 'percent')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {incRate.caption}
              </div>
            </div>

            {/* Open NCRs */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: `3px solid ${ncrOpen.value ? 'var(--status-negative-fg)' : 'var(--status-positive-fg)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Non-Conformances</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: ncrOpen.value ? 'var(--status-negative-bg)' : 'var(--status-positive-bg)', color: ncrOpen.value ? 'var(--status-negative-fg)' : 'var(--status-positive-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: ncrOpen.value ? 'var(--status-negative-fg)' : 'var(--status-positive-fg)' }}>
                {ncrOpen.value} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>NCRs</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {ncrOpen.caption}
              </div>
            </div>
          </div>

          {/* 3. Three-Gate Inspection Funnel */}
          <section style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Three-Gate Inspection Verification Funnel
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Quality assurance gate results: Incoming at gate, In-Process on presses, and Final pre-dispatch
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {stages.map((st) => (
                <div
                  key={st.label}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#6d28d9', marginTop: 4 }}>
                    {st.value} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>inspections</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {st.sub}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Defect Pareto & Open NCR Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 16 }}>
            {/* Defect Pareto */}
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Automotive Defect Pareto Leaderboard
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Top defect codes logged across incoming and in-process sampling
                </div>
              </div>
              <BarList rows={defects} unit="count" />
            </section>

            {/* Non-Conformance NCR Status Donut */}
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Non-Conformances (NCR) by Resolution Stage
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  8D CAPA lifecycle progression
                </div>
              </div>
              <Donut rows={ncrStatus} unit="count" centreLabel="NCRs" />
            </section>
          </div>

          {/* 5. Quality Failures Over Time Trend */}
          <section style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Inspections Failed & NCRs Raised Over Time
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Month-by-month defect containment progression across {data.period.label}
              </div>
            </div>
            <TrendChart series={data.series} unit="count" height={220} />
          </section>
        </>
      )}
    </div>
  );
};

export default QualityDashboard;
