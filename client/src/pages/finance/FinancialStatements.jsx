import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Download, Briefcase, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { fmtMoneyFull } from '../../utils/money';

const FinancialStatements = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pl'); // pl, bs, cf
  const [exportMessage, setExportMessage] = useState('');
  /* Export goes to the server. Without a working label the button looks dead and
     the user presses it repeatedly, queueing several exports. */
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      const res = await axios.get('/finance/v2/statements');
      if (res.data && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Statements V2 fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const reportTypeMap = { pl: 'Profit_Loss', bs: 'Balance_Sheet', cf: 'Cash_Flow' };
      const res = await axios.post('/finance/v2/statements/export', {
        reportType: reportTypeMap[activeTab] || 'Profit_Loss'
      });
      if (res.data && res.data.message) {
        setExportMessage(res.data.message);
        setTimeout(() => setExportMessage(''), 5000);
      }
    } catch (err) {
      console.error('Export error', err);
      setExportMessage('The report could not be prepared. Please try again.');
      setTimeout(() => setExportMessage(''), 5000);
    }
    setExporting(false);
  };

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Adding up the accounts…</div>;
  }

  const profitAndLoss = data?.profitAndLoss || { revenue: 0, expenses: 0, netProfit: 0, formattedExpenses: null };
  const balanceSheet = data?.balanceSheet || { assets: 0, liabilities: 0, equity: 0, totalLiabilitiesAndEquity: 0, isBalanced: true, reconciliationStatus: 'Balanced' };
  const cashFlow = data?.cashFlow || { operatingActivities: 0, investingActivities: 0, financingActivities: 0, netCashFlow: 0, beginningCash: 10000, endingCash: 10000 };
  const auditTimestamp = data?.auditTimestamp || `Prepared on ${new Date().toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Financial Statements</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Profit and loss, balance sheet and cash movement, built from the posted accounting entries. Used by accounts staff and the owner.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{auditTimestamp}</span>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Download size={14} /> {exporting ? 'Preparing report…' : 'Download this report'}
          </button>
        </div>
      </div>

      {exportMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', color: 'var(--status-info-fg)', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> {exportMessage}
        </div>
      )}

      {/* Workflow Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <button role="tab" aria-selected={activeTab === 'pl'} onClick={() => setActiveTab('pl')} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'pl' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'pl' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={16} /> Profit and loss
        </button>
        <button role="tab" aria-selected={activeTab === 'bs'} onClick={() => setActiveTab('bs')} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'bs' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'bs' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={16} /> Balance sheet
        </button>
        <button role="tab" aria-selected={activeTab === 'cf'} onClick={() => setActiveTab('cf')} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'cf' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'cf' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} /> Cash in and out
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        
        {/* Profit & Loss Tab */}
        {activeTab === 'pl' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Profit and loss</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>This financial year so far, taken from the posted accounting entries</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', fontSize: '15px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Money earned from sales</span>
                <span style={{ fontWeight: 700 }}>{fmtMoneyFull(profitAndLoss.revenue)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', fontSize: '15px' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Money spent — material, wages and overheads</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Taken away from sales</span>
                </div>
                <span style={{ fontWeight: 700 }}>
                  {`- ${fmtMoneyFull(profitAndLoss.expenses)}`}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>Profit left</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Money earned less money spent</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '20px', color: profitAndLoss.netProfit >= 0 ? 'var(--status-positive-fg)' : 'var(--status-negative-fg)' }}>
                  {fmtMoneyFull(profitAndLoss.netProfit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Balance Sheet Tab */}
        {activeTab === 'bs' && (
          <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Balance sheet — what we own and what we owe</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Balances built up to today</p>
            </div>

            {/* Fundamental Accounting Equation Check Banner */}
            <div style={{ padding: '16px', backgroundColor: balanceSheet.isBalanced ? 'var(--status-positive-bg)' : 'var(--status-negative-bg)', border: balanceSheet.isBalanced ? '1px solid var(--status-positive-border)' : '1px solid var(--status-negative-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {balanceSheet.isBalanced ? <CheckCircle size={20} color="var(--status-positive-fg)" /> : <AlertTriangle size={20} color="var(--status-negative-fg)" />}
                <div>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: balanceSheet.isBalanced ? 'var(--status-positive-fg)' : 'var(--status-negative-fg)' }}>
                    Do the two sides balance?
                  </span>
                  <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-secondary)' }}>
                    What we own {fmtMoneyFull(balanceSheet.assets)} should equal what we owe {fmtMoneyFull(balanceSheet.liabilities)} plus the owners&rsquo; share {fmtMoneyFull(balanceSheet.equity)}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: balanceSheet.isBalanced ? 'var(--status-positive-fg)' : 'var(--status-negative-fg)' }}>
                {balanceSheet.reconciliationStatus}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              {/* Assets */}
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-strong)', paddingBottom: '8px', color: 'var(--text-primary)' }}>What we own (assets)</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Plant, stock and money customers owe us</span>
                  <span style={{ fontWeight: 600 }}>{fmtMoneyFull(balanceSheet.assets)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', marginTop: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total we own</span>
                  <span style={{ fontWeight: 800 }}>{fmtMoneyFull(balanceSheet.assets)}</span>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-strong)', paddingBottom: '8px', color: 'var(--text-primary)' }}>What we owe, and the owners&rsquo; share</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Money we owe suppliers and others</span>
                  <span style={{ fontWeight: 600 }}>{fmtMoneyFull(balanceSheet.liabilities)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Owners&rsquo; share of the business</span>
                  <span style={{ fontWeight: 600 }}>{fmtMoneyFull(balanceSheet.equity)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', marginTop: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total owed plus owners&rsquo; share</span>
                  <span style={{ fontWeight: 800 }}>{fmtMoneyFull(balanceSheet.totalLiabilitiesAndEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Flow Statement Tab */}
        {activeTab === 'cf' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Cash in and out</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Cash movement this financial year — from trading, from buying or selling assets, and from loans</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>From trading — customer receipts less supplier payments</span>
                <span style={{ fontWeight: 700, color: cashFlow.operatingActivities >= 0 ? 'var(--status-positive-fg)' : 'var(--status-negative-fg)' }}>
                  {cashFlow.operatingActivities >= 0 ? '+' : ''} {fmtMoneyFull(cashFlow.operatingActivities)}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>From buying or selling machines and property</span>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {fmtMoneyFull(cashFlow.investingActivities)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>From loans and owner funds</span>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {fmtMoneyFull(cashFlow.financingActivities)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Change in cash this year</span>
                <span style={{ fontWeight: 800, fontSize: '18px', color: cashFlow.netCashFlow >= 0 ? 'var(--status-positive-fg)' : 'var(--status-negative-fg)' }}>
                  {fmtMoneyFull(cashFlow.netCashFlow)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px', color: 'var(--text-secondary)' }}>
                <span>Cash at the start of the year: <strong>{fmtMoneyFull(cashFlow.beginningCash)}</strong></span>
                <span>Cash today: <strong>{fmtMoneyFull(cashFlow.endingCash)}</strong></span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FinancialStatements;
