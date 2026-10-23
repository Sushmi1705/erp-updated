import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Cog, LineChart, IndianRupee, TrendingUp, AlertTriangle, Cpu, Clock } from 'lucide-react';
import { fmtMoney, fmtMoneyFull } from '../../utils/money';

const CostAccounting = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('material'); // material, production, profitability

  useEffect(() => {
    fetchCosting();
  }, []);

  const fetchCosting = async () => {
    try {
      const res = await axios.get('/finance/v2/costing');
      if (res.data && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Costing V2 fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Working out the costs…</div>;
  }

  /* No invented fallbacks.
   *
   * These four lines used to carry a second copy of the figures the server
   * was inventing — ₹4,200 of wages over 120 hours at ₹35, ₹3,500 of
   * overheads, an 80.67% gross margin — applied with `||` whenever the real
   * figure was missing or zero. So a plant asking "what does this part cost
   * us" got a constant, and it looked exactly like an answer. The server
   * reports null where nothing has been recorded; this shows that as
   * not-recorded and says where to record it. */
  const materialCosting = data?.materialCosting || {};
  const productionCosting = data?.productionCosting || {};
  const profitabilityAnalysis = data?.profitabilityAnalysis || {};
  const activePeriod = data?.activePeriod || {};

  /* A figure the system does not have reads quieter than one it does, and
     never as a number. */
  const known = (v) => v !== null && v !== undefined && !Number.isNaN(Number(v));
  const money = (v) => (known(v) ? fmtMoney(v) : 'Not recorded');
  const moneyFull = (v) => (known(v) ? fmtMoneyFull(v) : '—');
  const missingStyle = { fontSize: '19px', fontWeight: 600, color: 'var(--text-muted)' };
  const figureStyle = { fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' };
  const bigFigure = (v) => (known(v) ? figureStyle : missingStyle);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Cost Accounting</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>What each part costs us to make — material, labour and factory overheads — and how much profit is left. Used by accounts staff and the plant manager.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Costing period:</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)' }}>FY{activePeriod.Fiscal_Year} {activePeriod.Fiscal_Quarter} ({activePeriod.Status})</span>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <button role="tab" aria-selected={activeTab === 'material'} onClick={() => setActiveTab('material')} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'material' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'material' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} /> Material cost
        </button>
        <button role="tab" aria-selected={activeTab === 'production'} onClick={() => setActiveTab('production')} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'production' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'production' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cog size={16} /> Labour and overheads
        </button>
        <button role="tab" aria-selected={activeTab === 'profitability'} onClick={() => setActiveTab('profitability')} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'profitability' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'profitability' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LineChart size={16} /> Profit left
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        
        {/* Tab 1: Material Costing */}
        {activeTab === 'material' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>What we spent on material</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Added up from goods receipts against purchase orders (PO) and supplier bills, compared with last quarter</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
               <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total spent on material</span>
                 <div style={bigFigure(materialCosting.totalMaterialCost)}>
                   {money(materialCosting.totalMaterialCost)}
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                   <span style={{ fontSize: '12px', fontWeight: 700, color: materialCosting.variance?.includes('-') ? 'var(--status-positive-fg)' : 'var(--status-caution-fg)' }}>
                     {materialCosting.variance
                       ? `${materialCosting.variance} against the period before (${fmtMoney(materialCosting.previousQuarterCost)})`
                       : 'No earlier period to compare against yet'}
                   </span>
                 </div>
                 {materialCosting.note && (
                   <span style={{ fontSize: '12px', color: 'var(--status-caution-fg)' }}>{materialCosting.note}</span>
                 )}
               </div>

               <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Where these figures come from</span>
                 <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '8px', color: 'var(--accent-text)' }}>Goods receipts and supplier bills</div>
                 <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Added up automatically as receipts and bills are entered</span>
               </div>
            </div>

            {/* Material Ledger Breakdown */}
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Material cost item by item</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Material</th>
                    <th style={{ padding: '8px' }}>Quantity received</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Cost per unit</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total cost</th>
                    <th style={{ padding: '8px' }}>Which document</th>
                  </tr>
                </thead>
                <tbody>
                  {(materialCosting.breakdown || []).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.material}</td>
                      <td style={{ padding: '10px 8px' }}>{row.quantity}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmtMoneyFull(row.unitCost)}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, textAlign: 'right' }}>{fmtMoneyFull(row.totalCost)}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span className="badge badge-info">{row.source}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Production Costing */}
        {activeTab === 'production' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>What production costs us</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Operator hours booked against jobs, plus factory overheads shared out by machine hours run</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
               <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Operator wages on jobs</span>
                   <Clock size={18} color="var(--accent-primary)" />
                 </div>
                 <div style={{ ...bigFigure(productionCosting.directLaborCost), marginTop: '8px' }}>
                   {money(productionCosting.directLaborCost)}
                 </div>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                   {known(productionCosting.directLaborCost)
                     ? <>Hours booked: <strong>{productionCosting.laborHoursLogged} hrs</strong> at {moneyFull(productionCosting.laborRatePerHour)} an hour on average</>
                     : 'No operator hours have been booked against a job in this period.'}
                 </div>
               </div>

               <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Factory overheads</span>
                   <Cpu size={18} color="var(--text-secondary)" />
                 </div>
                 <div style={{ ...bigFigure(productionCosting.manufacturingOverheads), marginTop: '8px' }}>
                   {money(productionCosting.manufacturingOverheads)}
                 </div>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                   {known(productionCosting.manufacturingOverheads)
                     ? <>At <strong>{moneyFull(productionCosting.overheadAbsorptionRate)} an hour</strong> across {productionCosting.allocationBaseHours} machine hours</>
                     : 'No machine hours have been logged in this period.'}
                 </div>
               </div>
            </div>

            {/* Overhead Absorption Banner */}
            <div style={{ padding: '16px', backgroundColor: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Cog size={20} color="var(--status-info-fg)" />
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--status-info-fg)' }}>How these are worked out</span>
                <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-secondary)' }}>
                  {productionCosting.note
                    || `Wages are the hours booked on jobs at the rate on each booking. Overheads are each machine's own hourly cost across the hours it ran — ${moneyFull(productionCosting.overheadAbsorptionRate)} an hour on average here.`}
                </span>
              </div>
            </div>

            {/* Work Center Breakdown Table */}
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Cost by machine or work area</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Machine or work area</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Operator wages</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Share of overheads</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total cost</th>
                  </tr>
                </thead>
                <tbody>
                  {(productionCosting.workCenterBreakdown || []).length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>
                        Nothing to break down yet — this fills in once operators book their hours against a job on Run Production.
                      </td>
                    </tr>
                  )}
                  {(productionCosting.workCenterBreakdown || []).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.workCenter}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmtMoneyFull(row.laborCost)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmtMoneyFull(row.overheadCost)}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, textAlign: 'right' }}>{fmtMoneyFull(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Profitability Analysis */}
        {activeTab === 'profitability' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>How much profit is left</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Sales value, less what the goods cost to make, less running expenses</p>
            </div>

            {/* Net Margin Hierarchy Status Indicator */}
            <div style={{ padding: '16px', backgroundColor: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertTriangle size={19} color="var(--status-info-fg)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--status-info-fg)' }}>What this figure does and does not include</span>
                <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-secondary)' }}>
                  {profitabilityAnalysis.marginHierarchyStatus}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
               <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ padding: '14px', backgroundColor: 'var(--status-info-bg)', borderRadius: '50%' }}><IndianRupee size={28} color="var(--status-info-fg)" /></div>
                 <div>
                   <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Profit before running expenses</p>
                   <div style={{ ...bigFigure(profitabilityAnalysis.averageGrossMarginPct), marginTop: '4px' }}>
                     {known(profitabilityAnalysis.averageGrossMarginPct) ? `${profitabilityAnalysis.averageGrossMarginPct}%` : 'Not recorded'}
                   </div>
                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                     {known(profitabilityAnalysis.averageGrossMarginPct)
                       ? <>Sales {money(profitabilityAnalysis.totalRevenue)} less cost of goods {money(profitabilityAnalysis.totalCOGS)}, as a share of sales</>
                       : profitabilityAnalysis.note || 'No customer invoice is dated inside this period.'}
                   </div>
                 </div>
               </div>

               <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ padding: '14px', backgroundColor: 'var(--status-positive-bg)', borderRadius: '50%' }}><TrendingUp size={28} color="var(--status-positive-fg)" /></div>
                 <div>
                   <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Profit after running expenses</p>
                   <div style={{ ...bigFigure(profitabilityAnalysis.averageNetMarginPct), marginTop: '4px' }}>
                     {known(profitabilityAnalysis.averageNetMarginPct) ? `${profitabilityAnalysis.averageNetMarginPct}%` : 'Not recorded'}
                   </div>
                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                     {known(profitabilityAnalysis.averageNetMarginPct)
                       ? <>After running expenses of {money(profitabilityAnalysis.operatingExpenses)}, profit left is {money(profitabilityAnalysis.netProfit)}</>
                       : 'Wages, power and rent are not recorded in this system, so there is nothing to take off the figure on the left.'}
                   </div>
                 </div>
               </div>
            </div>

            {/* Profitability Summary Card */}
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-primary)' }}>Profit summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total sales</span>
                <span style={{ fontWeight: 700 }}>{fmtMoneyFull(profitabilityAnalysis.totalRevenue)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Less what the goods cost to make</span>
                <span style={{ fontWeight: 700 }}>- {fmtMoneyFull(profitabilityAnalysis.totalCOGS)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600 }}>Profit before running expenses</span>
                <span style={{ fontWeight: 800 }}>{fmtMoneyFull(profitabilityAnalysis.grossProfit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Less running expenses</span>
                <span style={{ fontWeight: 700 }}>- {fmtMoneyFull(profitabilityAnalysis.operatingExpenses)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', paddingTop: '12px', borderTop: '2px solid var(--border-color)', marginTop: '4px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Profit left</span>
                <span style={{ fontWeight: 800, color: 'var(--status-positive-fg)' }}>{fmtMoneyFull(profitabilityAnalysis.netProfit)}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CostAccounting;
