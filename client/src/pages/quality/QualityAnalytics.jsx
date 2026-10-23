import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, PieChart, ShieldAlert, Award, PackageCheck, RefreshCw } from 'lucide-react';

const QualityAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/quality/v2/analytics');
      setData(res.data.data);
    } catch (err) { console.error('Analytics fetch error', err); }
    setLoading(false);
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '8px' }}>
        <RefreshCw size={18} className="spin" /> Working out the quality figures…
      </div>
    );
  }

  const { kpis, stageBreakdown, vendorScorecards } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Quality Reports</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rejection trends by part, reason and supplier, for the quality team and the plant manager.</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={fetchAnalytics}>
          <RefreshCw size={14} /> Refresh Report
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flex: 1 }}>
        
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          
          {/* Card 1: Total Inspections */}
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', borderRadius: '8px' }}>
                <BarChart3 size={20} color="var(--accent-primary)" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Inspections</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{kpis.totalInspections}</div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Sum across Incoming, In-Process, and Final stages</p>
          </div>

          {/* Card 2: Overall Rejection Rate */}
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)', borderRadius: '8px' }}>
                <PieChart size={20} color="var(--accent-danger)" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Overall Rejection Rate</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: kpis.rejectionRate > 5 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
              {kpis.rejectionRate}%
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              {kpis.totalFailedInspections} failed out of {kpis.totalInspections} total inspections
            </p>
          </div>

          {/* Card 3: Logged Defects (NCRs) */}
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)', borderRadius: '8px' }}>
                <ShieldAlert size={20} color="var(--accent-warning)" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Logged Defects (Active NCRs)</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent-warning)' }}>{kpis.activeNCRCount}</div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Open quality problems still waiting for a fix</p>
          </div>

        </div>

        {/* Detailed Analysis Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          {/* Rejection Analysis by Stage */}
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageCheck size={18} color="var(--accent-primary)" /> Rejection Analysis by Stage
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {stageBreakdown.map((s, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 500 }}>{s.stage}</span>
                    <span><strong>{s.failed}</strong> Failed / <strong>{s.count}</strong> Total ({s.rate}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, s.rate * 2)}%`,
                      backgroundColor: idx === 0 ? 'var(--accent-primary)' : idx === 1 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Quality Analysis */}
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--accent-success)" /> Supplier quality scores
            </h3>
            
            {vendorScorecards.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>No vendor data registered yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                {vendorScorecards.map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{v.vendorName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Lots: {v.totalLotsReceived} | Rejected: {v.lotsRejected}</div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                        backgroundColor: v.qualityScore === 'N/A' ? 'var(--bg-tertiary)' : v.qualityScore >= 80 ? 'color-mix(in srgb, var(--accent-success) 8%, transparent)' : v.qualityScore >= 50 ? 'color-mix(in srgb, var(--accent-warning) 8%, transparent)' : 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
                        color: v.qualityScore === 'N/A' ? 'var(--text-secondary)' : v.qualityScore >= 80 ? 'var(--accent-success)' : v.qualityScore >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)'
                      }}>
                        {v.qualityScore === 'N/A' ? 'Score: N/A' : `${v.qualityScore} / 100`}
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

export default QualityAnalytics;
