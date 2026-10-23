import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Boxes, AlertTriangle, PackageX, Hourglass, CheckCircle2,
  Search, ShieldAlert, ArrowRight, Layers, PieChart, Clock
} from 'lucide-react';
import ReportTopNav from '../../components/reports/ReportTopNav';
import TrendChart from '../../components/charts/TrendChart';
import AttentionList from '../../components/reports/AttentionList';
import Donut from '../../components/charts/Donut';
import BarList from '../../components/charts/BarList';
import { fmtUnit, downloadCsv } from '../../utils/format';
import { reportByEndpoint } from './reportConfigs';

const config = reportByEndpoint('inventory');

const InventoryDashboard = () => {
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
    axios.get('/dashboards/inventory', { params: { months } })
      .then((res) => { if (!cancelled) setData(res.data?.data || null); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Could not load stock report.'); })
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
      section: 'Inventory Valuation Headline',
      metric: h.label,
      value: h.value ?? '',
      unit: h.unit,
      delta: h.delta ?? '',
      notes: h.caption || ''
    }));
    data.series.forEach((s) => s.points.forEach((p) => rows.push({
      section: `Historical Series: ${s.label}`,
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
    downloadCsv(`Stock-Valuation-Report-${months}m-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const h = (key) => data?.headline?.find((x) => x.key === key) || {};
  const value = h('value');
  const low = h('low');
  const held = h('held');
  const slow = h('slow');

  const typeBreakdown = data?.breakdowns?.find((b) => b.key === 'type')?.rows || [];
  const topItems = data?.breakdowns?.find((b) => b.key === 'items')?.rows || [];
  const lowItems = data?.breakdowns?.find((b) => b.key === 'low')?.rows || [];
  const slowBatches = data?.breakdowns?.find((b) => b.key === 'slow')?.rows || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="inventory-dashboard-page">
      {/* 1. Header Ribbon */}
      <ReportTopNav
        currentEndpoint="inventory"
        months={months}
        onPeriodChange={choosePeriod}
        onRefresh={refresh}
        loading={loading}
        onExportCsv={exportCsv}
        readings={readings}
        theme={config.theme}
        badge="Stores & Materials"
        tagline="Working Capital, Valuation & Batch Aging Matrix"
        title="Stock Report"
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
          {/* 2. Capital Valuation Telemetry Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {/* Total Stock on Hand */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #047857',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Stock on Hand</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#d1fae5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Boxes size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#047857' }}>
                {fmtUnit(value.value, 'money')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {value.caption}
              </div>
            </div>

            {/* Below Reorder Level */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: `3px solid ${low.value ? 'var(--status-negative-fg)' : 'var(--status-positive-fg)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Below Reorder Point</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: low.value ? 'var(--status-negative-bg)' : 'var(--status-positive-bg)', color: low.value ? 'var(--status-negative-fg)' : 'var(--status-positive-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: low.value ? 'var(--status-negative-fg)' : 'var(--status-positive-fg)' }}>
                {low.value} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>materials</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {low.caption}
              </div>
            </div>

            {/* Quarantine Stock */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #f59e0b',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Held in Quarantine</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageX size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#f59e0b' }}>
                {fmtUnit(held.value, 'money')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {held.caption}
              </div>
            </div>

            {/* Slow Moving > 90 Days */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #6366f1',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Not Moved &gt; 90 Days</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#e0e7ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hourglass size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#6366f1' }}>
                {fmtUnit(slow.value, 'money')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {slow.caption}
              </div>
            </div>
          </div>

          {/* 3. Reorder Shortfall & Urgency Alert Console */}
          {lowItems.length > 0 && (
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid var(--status-negative-fg)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--status-negative-fg)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={17} /> Critical Reorder Stockout Alert
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Materials below safety stock threshold requiring immediate purchase replenishment
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--status-negative-fg)', background: 'var(--status-negative-bg)', padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>
                  {lowItems.length} Materials in Shortfall
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {lowItems.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--status-negative-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {r.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>On Hand: <strong>{r.value}</strong></span>
                      <span style={{ fontSize: 11.5, color: 'var(--status-negative-fg)', fontWeight: 600 }}>{r.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Stock Composition by Type & Top Materials */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 16 }}>
            {/* Composition by Type Donut */}
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Stock Capital by Material Category
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Where the money on the shelves sits
                </div>
              </div>
              <Donut rows={typeBreakdown} unit="money" centreLabel="On Hand" />
            </section>

            {/* Highest-Value Materials on Hand */}
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Highest-Value Materials in Stock
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Ranked by live batch valuation on hand
                </div>
              </div>
              <BarList rows={topItems} unit="money" />
            </section>
          </div>

          {/* 5. 90-Day Aged Batch Capital Heatmap */}
          {slowBatches.length > 0 && (
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Slow-Moving Batch Aging Analysis (&gt; 90 Days Idle)
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Batches received more than 90 days ago with capital still tied up on the shelves
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', background: '#e0e7ff', padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>
                  {slowBatches.length} Aged Batches
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {slowBatches.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {s.sub}
                      </div>
                    </div>
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Tied Capital</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>
                        {fmtUnit(s.value, 'money')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. Stock Inflow Trajectory */}
          <section style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Stock Inward Value Over Time
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Value of materials posted into stores, month by month across {data.period.label}
              </div>
            </div>
            <TrendChart series={data.series} unit="money" height={220} />
          </section>
        </>
      )}
    </div>
  );
};

export default InventoryDashboard;
