import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ShoppingCart, IndianRupee, Receipt, BookOpen, AlertOctagon,
  TrendingUp, Users, Search, ArrowUpRight, CheckCircle2, ChevronRight,
  Filter, Layers, Clock, AlertTriangle, ArrowRight
} from 'lucide-react';
import ReportTopNav from '../../components/reports/ReportTopNav';
import TrendChart from '../../components/charts/TrendChart';
import AttentionList from '../../components/reports/AttentionList';
import { fmtUnit, downloadCsv } from '../../utils/format';
import { reportByEndpoint } from './reportConfigs';

const config = reportByEndpoint('sales');

const SalesDashboard = () => {
  const [months, setMonths] = useState(() => {
    try { return Number(localStorage.getItem('report_months')) || 6; } catch { return 6; }
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  // Customer filter
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerView, setCustomerView] = useState('cards'); // 'cards' | 'table'

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get('/dashboards/sales', { params: { months } })
      .then((res) => { if (!cancelled) setData(res.data?.data || null); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Could not load sales report.'); })
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
      section: 'Sales Headline',
      metric: h.label,
      value: h.value ?? '',
      unit: h.unit,
      delta: h.delta ?? '',
      notes: h.caption || ''
    }));
    data.series.forEach((s) => s.points.forEach((p) => rows.push({
      section: `Sales Series: ${s.label}`,
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
    downloadCsv(`Sales-Report-${months}m-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const h = (key) => data?.headline?.find((x) => x.key === key) || {};
  const orders = h('orders');
  const orderValue = h('orderValue');
  const invoiced = h('invoiced');
  const openBook = h('openBook');

  // Breakdowns
  const customers = data?.breakdowns?.find((b) => b.key === 'customers')?.rows || [];
  const statusRows = data?.breakdowns?.find((b) => b.key === 'status')?.rows || [];
  const totalCustomerVal = customers.reduce((s, c) => s + (c.value || 0), 0);

  // Late order alert
  const lateItem = data?.attention?.find((a) => a.title.toLowerCase().includes('past the promised') || a.title.toLowerCase().includes('late'));

  const filteredCustomers = customers.filter((c) =>
    !customerSearch.trim() || c.label.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="sales-dashboard-page">
      {/* 1. Top Ribbon */}
      <ReportTopNav
        currentEndpoint="sales"
        months={months}
        onPeriodChange={choosePeriod}
        onRefresh={refresh}
        loading={loading}
        onExportCsv={exportCsv}
        readings={readings}
        theme={config.theme}
        badge="Commercial Engine"
        tagline="Order Velocity & Revenue Conversion Engine"
        title="Sales Report"
        description={config.description}
        who={config.who}
      />

      {error && (
        <div style={{ padding: 16, background: 'var(--status-negative-bg)', border: '1px solid var(--status-negative-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-negative-fg)' }}>
          {error}
        </div>
      )}

      {loading && !data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 120, borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }} />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* 2. Commercial Velocity Telemetry Header Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {/* Card 1: Orders Intake */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #0284c7',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orders Intake</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
                {orders.value} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>orders</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {orders.caption}
              </div>
            </div>

            {/* Card 2: Order Value Received */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #0369a1',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Intake Order Value</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IndianRupee size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0369a1' }}>
                {fmtUnit(orderValue.value, 'money')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {orderValue.caption}
              </div>
            </div>

            {/* Card 3: Revenue Invoiced */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #059669',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invoiced Realization</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#059669' }}>
                {fmtUnit(invoiced.value, 'money')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {invoiced.caption}
              </div>
            </div>

            {/* Card 4: Open Order Book */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #7c3aed',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Order Backlog</span>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#7c3aed' }}>
                {fmtUnit(openBook.value, 'money')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {openBook.caption}
              </div>
            </div>
          </div>

          {/* 3. Late Delivery Emergency Alert (If active) */}
          {lateItem && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '14px 20px',
              background: 'var(--status-negative-bg)',
              border: '1px solid var(--status-negative-border)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--status-negative-fg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'var(--status-negative-fg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertOctagon size={18} />
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{lateItem.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{lateItem.detail}</div>
                </div>
              </div>
              {lateItem.path && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.location.href = lateItem.path}
                  style={{ fontSize: 12, gap: 6, flexShrink: 0 }}
                >
                  Resolve Orders <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}

          {/* 4. Commercial Pipeline / Order Book Stage Flow */}
          <section style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={16} style={{ color: '#0284c7' }} />
                  Commercial Order Book Progression Pipeline
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Live distribution of sales orders from drafting to final dispatch completion
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}>
                {statusRows.reduce((acc, s) => acc + (s.value || 0), 0)} Total Orders on Record
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              {statusRows.map((st, idx) => {
                const isCompleted = st.label === 'Completed';
                const isApproval = st.label === 'Pending Approval';
                const isProcessing = st.label === 'Processing';
                return (
                  <div
                    key={st.label}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `1px solid ${isProcessing ? '#0284c7' : isCompleted ? '#059669' : 'var(--border-subtle)'}`,
                      borderTop: `4px solid ${isProcessing ? '#0284c7' : isCompleted ? '#059669' : isApproval ? '#f59e0b' : '#94a3b8'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Step {idx + 1}
                      </span>
                      {isCompleted ? <CheckCircle2 size={13} style={{ color: '#059669' }} /> : null}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {st.label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: isProcessing ? '#0284c7' : isCompleted ? '#059669' : 'var(--text-primary)', marginTop: 4 }}>
                      {st.value} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>orders</span>
                    </div>
                    {st.sub && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
                        {st.sub}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 5. Top Customer Accounts Leaderboard */}
          <section style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} style={{ color: '#0284c7' }} />
                  Commercial Customer Account Leaderboard
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Highest revenue contributors across {data.period.label}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    style={{
                      padding: '5px 10px 5px 28px',
                      fontSize: 12,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      width: 180
                    }}
                  />
                </div>

                {/* View Switcher */}
                <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-pill)', padding: 2 }}>
                  <button
                    type="button"
                    onClick={() => setCustomerView('cards')}
                    style={{
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 'var(--radius-pill)',
                      border: 'none',
                      cursor: 'pointer',
                      background: customerView === 'cards' ? '#0284c7' : 'transparent',
                      color: customerView === 'cards' ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerView('table')}
                    style={{
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 'var(--radius-pill)',
                      border: 'none',
                      cursor: 'pointer',
                      background: customerView === 'table' ? '#0284c7' : 'transparent',
                      color: customerView === 'table' ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>

            {customerView === 'cards' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {filteredCustomers.map((c, idx) => (
                  <div
                    key={c.label}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 7px', borderRadius: 'var(--radius-sm)' }}>
                          Rank #{idx + 1}
                        </span>
                        {c.share ? (
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>
                            {Math.round(c.share)}% share
                          </span>
                        ) : null}
                      </div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: '6px 0 2px', color: 'var(--text-primary)' }}>
                        {c.label}
                      </h4>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {c.sub}
                      </div>
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Committed Value</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#0284c7' }}>
                        {fmtUnit(c.value, 'money')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Rank & Customer Account</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Order Frequency</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Total Order Value</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Top-8 Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((c, idx) => (
                      <tr key={c.label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>#{idx + 1}</span>
                          {c.label}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                          {c.sub}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                          {fmtUnit(c.value, 'money')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {c.share ? `${Math.round(c.share)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 6. Commercial Trajectory (Intake vs Invoiced) */}
          <section style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Orders Received vs Revenue Invoiced
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Month-by-month commercial velocity across {data.period.label}
              </div>
            </div>
            <TrendChart series={data.series} unit="money" height={230} />
          </section>
        </>
      )}
    </div>
  );
};

export default SalesDashboard;
