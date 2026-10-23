import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Wrench, Timer, Activity, CalendarClock, AlertTriangle, AlertOctagon,
  CheckCircle2, ArrowRight, ShieldCheck, Flame, Cpu, Gauge
} from 'lucide-react';
import ReportTopNav from '../../components/reports/ReportTopNav';
import TrendChart from '../../components/charts/TrendChart';
import AttentionList from '../../components/reports/AttentionList';
import BarList from '../../components/charts/BarList';
import Donut from '../../components/charts/Donut';
import { fmtUnit, downloadCsv } from '../../utils/format';
import { reportByEndpoint } from './reportConfigs';

const config = reportByEndpoint('maintenance');

const MaintenanceDashboard = () => {
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
    axios.get('/dashboards/maintenance', { params: { months } })
      .then((res) => { if (!cancelled) setData(res.data?.data || null); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Could not load maintenance report.'); })
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
      section: 'Maintenance Headline',
      metric: h.label,
      value: h.value ?? '',
      unit: h.unit,
      delta: h.delta ?? '',
      notes: h.caption || ''
    }));
    data.series.forEach((s) => s.points.forEach((p) => rows.push({
      section: `Maintenance Series: ${s.label}`,
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
    downloadCsv(`Maintenance-Asset-Reliability-${months}m-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const h = (key) => data?.headline?.find((x) => x.key === key) || {};
  const breakdowns = h('breakdowns');
  const hours = h('hours');
  const mttr = h('mttr');
  const pmOverdue = h('pmOverdue');

  const machines = data?.breakdowns?.find((b) => b.key === 'machines')?.rows || [];
  const repairStatus = data?.breakdowns?.find((b) => b.key === 'status')?.rows || [];
  const pmStatus = data?.breakdowns?.find((b) => b.key === 'pm')?.rows || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="maintenance-dashboard-page">
      {/* 1. Header Ribbon */}
      <ReportTopNav
        currentEndpoint="maintenance"
        months={months}
        onPeriodChange={choosePeriod}
        onRefresh={refresh}
        loading={loading}
        onExportCsv={exportCsv}
        readings={readings}
        theme={config.theme}
        badge="Asset Reliability"
        tagline="Equipment Uptime, Breakdown Elimination & Preventive Service"
        title="Maintenance Report"
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
          {/* 2. Asset Reliability Telemetry Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {/* Total Breakdowns */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #be123c',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Breakdown Incidents</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#ffe4e6', color: '#be123c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#be123c' }}>
                {breakdowns.value} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>failures</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {breakdowns.caption}
              </div>
            </div>

            {/* Hours Lost to Breakdowns */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #e11d48',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Press Downtime Lost</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Timer size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#e11d48' }}>
                {fmtUnit(hours.value, 'hours')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {hours.caption}
              </div>
            </div>

            {/* Mean Time to Repair (MTTR) */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #0284c7',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mean Time to Repair</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0284c7' }}>
                {mttr.value !== null && mttr.value !== undefined ? fmtUnit(mttr.value, 'hours') : '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {mttr.caption}
              </div>
            </div>

            {/* Overdue PM Tasks */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: `3px solid ${pmOverdue.value ? 'var(--status-negative-fg)' : 'var(--status-positive-fg)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overdue PM Service</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: pmOverdue.value ? 'var(--status-negative-bg)' : 'var(--status-positive-bg)', color: pmOverdue.value ? 'var(--status-negative-fg)' : 'var(--status-positive-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarClock size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: pmOverdue.value ? 'var(--status-negative-fg)' : 'var(--status-positive-fg)' }}>
                {pmOverdue.value} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>tasks</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {pmOverdue.caption}
              </div>
            </div>
          </div>

          {/* 3. Emergency Breakdown Alerts & Overdue Tasks */}
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
                  <AlertOctagon size={18} style={{ color: 'var(--status-negative-fg)' }} />
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Active Stoppages & Maintenance Priorities
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Open machine breakdowns and overdue preventive service orders
                    </div>
                  </div>
                </div>
              </div>
              <AttentionList items={data.attention} />
            </section>
          )}

          {/* 4. Worst Machines by Downtime & Repair Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 16 }}>
            {/* Machines with most downtime */}
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Equipment with Highest Downtime Losses
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Presses and tooling losing the most production hours, {data.period.label}
                </div>
              </div>
              <BarList rows={machines} unit="hours" />
            </section>

            {/* PM Adherence Donut */}
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Preventive Maintenance (PM) Adherence
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Status of scheduled machine inspections & servicing
                </div>
              </div>
              <Donut rows={pmStatus} unit="count" centreLabel="PM Tasks" />
            </section>
          </div>

          {/* 5. Breakdown Frequency & Downtime Trajectory */}
          <section style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Equipment Breakdown Frequency & Downtime Hours
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Month-by-month asset failure progression across {data.period.label}
              </div>
            </div>
            <TrendChart series={data.series} unit="count" height={220} />
          </section>
        </>
      )}
    </div>
  );
};

export default MaintenanceDashboard;
