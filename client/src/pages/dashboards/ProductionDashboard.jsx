import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Factory, Percent, Timer, Gauge, Wrench, AlertTriangle,
  CheckCircle2, ArrowRight, Layers, Flame, Cpu, BarChart2
} from 'lucide-react';
import ReportTopNav from '../../components/reports/ReportTopNav';
import TrendChart from '../../components/charts/TrendChart';
import AttentionList from '../../components/reports/AttentionList';
import BarList from '../../components/charts/BarList';
import Donut from '../../components/charts/Donut';
import { fmtUnit, downloadCsv } from '../../utils/format';
import { reportByEndpoint } from './reportConfigs';

const config = reportByEndpoint('production');

const ProductionDashboard = () => {
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
    axios.get('/dashboards/production', { params: { months } })
      .then((res) => { if (!cancelled) setData(res.data?.data || null); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Could not load production report.'); })
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
      section: 'Production Headline',
      metric: h.label,
      value: h.value ?? '',
      unit: h.unit,
      delta: h.delta ?? '',
      notes: h.caption || ''
    }));
    data.series.forEach((s) => s.points.forEach((p) => rows.push({
      section: `Production Series: ${s.label}`,
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
    downloadCsv(`Production-ShopFloor-Report-${months}m-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const h = (key) => data?.headline?.find((x) => x.key === key) || {};
  const good = h('good');
  const scrap = h('scrap');
  const downtime = h('downtime');
  const utilisation = h('utilisation');
  const wo = h('wo');

  const reasons = data?.breakdowns?.find((b) => b.key === 'reasons')?.rows || [];
  const machines = data?.breakdowns?.find((b) => b.key === 'machines')?.rows || [];
  const woStages = data?.breakdowns?.find((b) => b.key === 'wo')?.rows || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="production-dashboard-page">
      {/* 1. Header Ribbon */}
      <ReportTopNav
        currentEndpoint="production"
        months={months}
        onPeriodChange={choosePeriod}
        onRefresh={refresh}
        loading={loading}
        onExportCsv={exportCsv}
        readings={readings}
        theme={config.theme}
        badge="Shop Floor OEE"
        tagline="Press Shop Execution Cockpit & Scrap Containment"
        title="Production Report"
        description={config.description}
        who={config.who}
      />

      {error && (
        <div style={{ padding: 16, background: 'var(--status-negative-bg)', border: '1px solid var(--status-negative-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-negative-fg)' }}>
          {error}
        </div>
      )}

      {loading && !data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 120, borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }} />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* 2. Press Shop Telemetry Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
            {/* Good Output */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #c2410c',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Good Pieces Made</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#ffedd5', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Factory size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
                {fmtUnit(good.value, 'count')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {good.caption}
              </div>
            </div>

            {/* Scrap Rate */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: `3px solid ${(scrap.value || 0) > 3.0 ? 'var(--status-negative-fg)' : '#059669'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scrap Rate</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: (scrap.value || 0) > 3.0 ? 'var(--status-negative-bg)' : '#d1fae5', color: (scrap.value || 0) > 3.0 ? 'var(--status-negative-fg)' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Percent size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: (scrap.value || 0) > 3.0 ? 'var(--status-negative-fg)' : '#059669' }}>
                {fmtUnit(scrap.value, 'percent')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {scrap.caption}
              </div>
            </div>

            {/* Press Downtime */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #e11d48',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Press Downtime</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Timer size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#e11d48' }}>
                {fmtUnit(downtime.value, 'hours')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {downtime.caption}
              </div>
            </div>

            {/* Machine Utilisation */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #0284c7',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Machine Utilisation</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gauge size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0284c7' }}>
                {fmtUnit(utilisation.value, 'percent')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {utilisation.caption}
              </div>
            </div>

            {/* Open Work Orders */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #7c3aed',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Work Orders</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#7c3aed' }}>
                {wo.value} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>WOs</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {wo.caption}
              </div>
            </div>
          </div>

          {/* 3. Shop Floor Alerts & Stoppages */}
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
                  <Wrench size={18} style={{ color: 'var(--status-caution-fg)' }} />
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Active Stoppages & Press Maintenance Interruptions
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Shop floor alerts requiring maintenance or tooling intervention
                    </div>
                  </div>
                </div>
              </div>
              <AttentionList items={data.attention} />
            </section>
          )}

          {/* 4. Downtime Root Causes & Machine Health Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 16 }}>
            {/* Downtime Root Cause Pareto */}
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Downtime Root Cause Pareto Analysis
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Hours lost by stoppage reason across {data.period.label}
                </div>
              </div>
              <BarList rows={reasons} unit="hours" />
            </section>

            {/* Machine Utilisation & Floor Telemetry */}
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Press & Machine Shop Utilisation
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Utilization efficiency recorded on each press
                </div>
              </div>
              <BarList rows={machines} unit="percent" />
            </section>
          </div>

          {/* 5. Production Output & Downtime Trends */}
          <section style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Good Production Pieces vs Scrap
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Month-by-month press output progression across {data.period.label}
              </div>
            </div>
            <TrendChart series={data.series.filter((s) => ['good', 'scrap'].includes(s.key))} unit="count" height={220} />
          </section>
        </>
      )}
    </div>
  );
};

export default ProductionDashboard;
