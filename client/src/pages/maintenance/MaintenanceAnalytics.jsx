import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Clock, Wrench, IndianRupee, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { fmtMoneyFull } from '../../utils/money';

const MaintenanceAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/maintenance/v2/analytics');
      setData(res.data.data);
      setError(null);
    } catch (err) {
      console.error('V2 Maintenance Analytics fetch error', err);
      setError('Failed to compile maintenance analytics data.');
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Working out the maintenance figures…</div>;
  }

  if (error) {
    return <div style={{ padding: '24px', color: 'var(--accent-danger)' }}>Error: {error}</div>;
  }

  if (!data) {
    return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>No maintenance analytics data available.</div>;
  }

  const { kpiSummary, financials, machineScorecards } = data;
  const totalCost = financials.totalMaintenanceCost || 1;

  const lostProdPct = Number(((financials.lostProductionCost / totalCost) * 100).toFixed(1));
  const sparesPct = Number(((financials.totalSparesCost / totalCost) * 100).toFixed(1));
  const laborPct = Number(((financials.totalLaborCost / totalCost) * 100).toFixed(1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Maintenance Reports</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Downtime, repair cost and machine reliability trends for the maintenance team and the plant manager.</p>
        </div>
        <button onClick={fetchAnalytics} className="btn btn-secondary" style={{ fontSize: '12px' }}>
          Refresh Report
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top-Level KPI Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', backgroundColor: 'color-mix(in srgb, var(--accent-success) 8%, transparent)', borderRadius: '6px' }}>
                <Activity size={18} color="var(--accent-success)" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Average hours between breakdowns</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              {kpiSummary.factoryMtbf} <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Hrs</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>Mean Time Between Failures</p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)', borderRadius: '6px' }}>
                <Clock size={18} color="var(--accent-danger)" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Average hours to repair</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              {kpiSummary.factoryMttr} <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Hrs</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>Mean Time To Repair</p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', backgroundColor: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)', borderRadius: '6px' }}>
                <Wrench size={18} color="var(--accent-warning)" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Resolved Breakdowns</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{kpiSummary.totalResolvedBreakdowns}</div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>Resolved incidents (Open excluded)</p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', borderRadius: '6px' }}>
                <IndianRupee size={18} color="var(--accent-primary)" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total maintenance cost</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-primary)' }}>
              {fmtMoneyFull(kpiSummary.totalMaintenanceCost)}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>Downtime, spares and labour added together</p>
          </div>
        </div>

        {/* Detailed Section: Financial Analysis & Machine Scorecards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          
          {/* Maintenance Financial Analysis */}
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IndianRupee size={16} color="var(--accent-primary)" /> Where the maintenance money went
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span>Lost production while machines stood idle</span>
                  <strong style={{ color: 'var(--accent-danger)' }}>{fmtMoneyFull(financials.lostProductionCost)} ({lostProdPct}%)</strong>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${lostProdPct}%`, backgroundColor: 'var(--accent-danger)' }}></div>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Worked out from {financials.totalDowntimeHours} recorded downtime hours at {fmtMoneyFull(100)} per hour of idle machine.</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span>Cost of spare parts used</span>
                  <strong style={{ color: 'var(--accent-primary)' }}>{fmtMoneyFull(financials.totalSparesCost)} ({sparesPct}%)</strong>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${sparesPct}%`, backgroundColor: 'var(--accent-primary)' }}></div>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Physical replacement material costs routed to PM & Breakdown tickets.</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span>Technician labour cost</span>
                  <strong style={{ color: 'var(--accent-warning)' }}>{fmtMoneyFull(financials.totalLaborCost)} ({laborPct}%)</strong>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${laborPct}%`, backgroundColor: 'var(--accent-warning)' }}></div>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Technician hours from the repair log at {fmtMoneyFull(50)} per hour.</p>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '20px' }}>
              <strong>How this adds up:</strong> total cost is lost production plus spare parts plus labour. It is worked out again each time a job is closed.
            </div>
          </div>

          {/* Machine reliability */}
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--accent-success)" /> Hours between breakdowns, by machine
            </h3>

            {machineScorecards.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>No machines to report on yet. Add machines under Master Data → Machines.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                {machineScorecards.sort((a,b) => a.machineMtbf - b.machineMtbf).map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <strong style={{ fontSize: '13px' }}>{m.name} ({m.code})</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Uptime: {m.totalUptimeHours}h | Failures: {m.failuresCount}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                        backgroundColor: m.reliabilityStatus === 'Critical' ? 'color-mix(in srgb, var(--accent-danger) 8%, transparent)' : m.reliabilityStatus === 'Moderate' ? 'color-mix(in srgb, var(--accent-warning) 8%, transparent)' : 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
                        color: m.reliabilityStatus === 'Critical' ? 'var(--accent-danger)' : m.reliabilityStatus === 'Moderate' ? 'var(--accent-warning)' : 'var(--accent-success)'
                      }}>
                        {m.machineMtbf} hrs between breakdowns ({m.reliabilityStatus})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default MaintenanceAnalytics;
