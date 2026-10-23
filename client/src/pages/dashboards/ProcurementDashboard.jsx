import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Truck, ShoppingCart, Receipt, Clock, CheckCircle2, AlertTriangle,
  Search, ShieldCheck, ArrowRight, Building, Filter, FileCheck, AlertOctagon
} from 'lucide-react';
import ReportTopNav from '../../components/reports/ReportTopNav';
import TrendChart from '../../components/charts/TrendChart';
import AttentionList from '../../components/reports/AttentionList';
import Donut from '../../components/charts/Donut';
import { fmtUnit, downloadCsv } from '../../utils/format';
import { reportByEndpoint } from './reportConfigs';

const config = reportByEndpoint('procurement');

const ProcurementDashboard = () => {
  const [months, setMonths] = useState(() => {
    try { return Number(localStorage.getItem('report_months')) || 6; } catch { return 6; }
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  // Vendor search
  const [vendorSearch, setVendorSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get('/dashboards/procurement', { params: { months } })
      .then((res) => { if (!cancelled) setData(res.data?.data || null); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Could not load purchasing report.'); })
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
      section: 'Purchasing Headline',
      metric: h.label,
      value: h.value ?? '',
      unit: h.unit,
      delta: h.delta ?? '',
      notes: h.caption || ''
    }));
    data.series.forEach((s) => s.points.forEach((p) => rows.push({
      section: `Purchasing Series: ${s.label}`,
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
    downloadCsv(`Purchasing-Report-${months}m-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const h = (key) => data?.headline?.find((x) => x.key === key) || {};
  const spend = h('spend');
  const billed = h('billed');
  const open = h('open');
  const awaiting = h('awaiting');

  const vendors = data?.breakdowns?.find((b) => b.key === 'vendors')?.rows || [];
  const deliveryStatus = data?.breakdowns?.find((b) => b.key === 'delivery')?.rows || [];

  const filteredVendors = vendors.filter((v) =>
    !vendorSearch.trim() || v.label.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="procurement-dashboard-page">
      {/* 1. Header Ribbon */}
      <ReportTopNav
        currentEndpoint="procurement"
        months={months}
        onPeriodChange={choosePeriod}
        onRefresh={refresh}
        loading={loading}
        onExportCsv={exportCsv}
        readings={readings}
        theme={config.theme}
        badge="Supply Chain Control"
        tagline="Direct Material Spend & Supplier Logistics Control"
        title="Purchasing Report"
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
          {/* 2. Direct Material Spend Telemetry Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {/* Spend Committed */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #b45309',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>POs Raised</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#b45309' }}>
                {fmtUnit(spend.value, 'money')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {spend.caption}
              </div>
            </div>

            {/* Billed by Suppliers */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #0284c7',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supplier Invoices</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0284c7' }}>
                {fmtUnit(billed.value, 'money')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {billed.caption}
              </div>
            </div>

            {/* Open POs Still to Arrive */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #7c3aed',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Deliveries</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#7c3aed' }}>
                {fmtUnit(open.value, 'money')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {open.caption}
              </div>
            </div>

            {/* Waiting for Approval */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: `3px solid ${awaiting.value ? 'var(--status-caution-fg)' : 'var(--status-positive-fg)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Awaiting Approval</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: awaiting.value ? 'var(--status-caution-bg)' : 'var(--status-positive-bg)', color: awaiting.value ? 'var(--status-caution-fg)' : 'var(--status-positive-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: awaiting.value ? 'var(--status-caution-fg)' : 'var(--text-primary)' }}>
                {awaiting.value} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>POs</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {awaiting.caption}
              </div>
            </div>
          </div>

          {/* 3. Operational Bottlenecks & Disruptions */}
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
                      Supply Chain Escalations & Vendor Delivery Disruptions
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Late supplier shipments, pending PO authorizations, and reorder stockouts
                    </div>
                  </div>
                </div>
              </div>
              <AttentionList items={data.attention} />
            </section>
          )}

          {/* 4. Supplier Fulfillment Matrix & PO Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))', gap: 16 }}>
            {/* Top Suppliers Leaderboard */}
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
                    Top Direct Material Suppliers
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Ranked by purchase commitment value, {data.period.label}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search vendor..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    style={{
                      padding: '4px 8px 4px 26px',
                      fontSize: 12,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      width: 150
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredVendors.map((v, idx) => (
                  <div
                    key={v.label}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>#{idx + 1}</span>
                        {v.label}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#b45309' }}>
                        {fmtUnit(v.value, 'money')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.sub}</span>
                      {v.share && <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{Math.round(v.share)}% share</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PO Delivery Status Donut */}
            <section style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Purchase Orders by Delivery Fulfillment
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Fulfillment pipeline across all live POs
                </div>
              </div>
              <Donut rows={deliveryStatus} unit="count" centreLabel="Total POs" />
            </section>
          </div>

          {/* 5. Purchase Order Spend Trend */}
          <section style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Purchase Order Commitments Over Time
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Month-by-month spend commitments across {data.period.label}
              </div>
            </div>
            <TrendChart series={data.series} unit="money" height={220} />
          </section>
        </>
      )}
    </div>
  );
};

export default ProcurementDashboard;
