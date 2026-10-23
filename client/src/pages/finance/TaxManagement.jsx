import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Percent, Calculator, FileText, CheckCircle2, AlertCircle, Plus, Send } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

const TaxManagement = () => {
  const [taxConfigs, setTaxConfigs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('configuration'); // configuration, report
  // Saving and report generation both go to the server. Naming the work in the
  // button is what stops the repeat clicking on a slow connection.
  const [busyAction, setBusyAction] = useState(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const [configForm, setConfigForm] = useState({
    Tax_Code: 'IGST-18',
    Description: 'Integrated GST 18% (Inter-State Supplies)',
    Tax_Type: 'IGST',
    Rate_Percentage: 18.00,
    Status: 'Active'
  });

  const [generateForm, setGenerateForm] = useState({
    Period_Start_Date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    Period_End_Date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'configuration') {
        const res = await axios.get('/finance/v2/tax/configs');
        setTaxConfigs(res.data.data);
      } else if (activeTab === 'report') {
        const res = await axios.get('/finance/v2/tax/reports');
        setReports(res.data.data);
      }
    } catch (err) { console.error('Data fetch error', err); }
    setLoading(false);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setBusyAction('config');
    try {
      if (configForm._id) {
        await axios.put(`/finance/v2/tax/configs/${configForm._id}`, configForm);
      } else {
        await axios.post('/finance/v2/tax/configs', configForm);
      }
      setIsConfigModalOpen(false);
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error saving tax configuration'); }
    setBusyAction(null);
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setBusyAction('report');
    try {
      await axios.post('/finance/v2/tax/reports/generate', generateForm);
      setIsGenerateModalOpen(false);
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error generating tax report'); }
    setBusyAction(null);
  };

  const handleFileReport = async (reportId) => {
    if (!await confirmAction('Mark this GST return as filed? This cannot be undone.')) return;
    setBusyAction('file-' + reportId);
    try {
      await axios.put(`/finance/v2/tax/reports/${reportId}/file`);
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error filing tax report'); }
    setBusyAction(null);
  };

  const configActionRenderer = (row) => {
    return (
      <button onClick={() => {
        setConfigForm({
          _id: row._id,
          Tax_Code: row.Tax_Code,
          Description: row.Description,
          Tax_Type: row.Tax_Type,
          Rate_Percentage: row.Rate_Percentage,
          Status: row.Status
        });
        setIsConfigModalOpen(true);
      }} className="btn-icon" style={{ fontSize: '11px', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
        <Percent size={12} /> Edit rate
      </button>
    );
  };

  const reportActionRenderer = (row) => {
    if (row.Status === 'Filed') return <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Already filed</span>;
    const filing = busyAction === 'file-' + row._id;
    return (
      <button onClick={() => handleFileReport(row._id)} disabled={filing} className="btn-icon" style={{ fontSize: '11px', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: filing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
        <Send size={12} /> {filing ? 'Marking as filed…' : 'Mark GST return filed'}
      </button>
    );
  };

  const configColumns = [
    { header: 'Tax code', render: (row) => <strong>{row.Tax_Code || row.Tax_ID}</strong> },
    { header: 'What it is for', accessor: 'Description' },
    { header: 'Type of GST', render: (row) => <span style={{ fontSize: '12px', fontWeight: 600 }}>{row.Tax_Type}</span> },
    { header: 'Rate (%)', align: 'right', render: (row) => <strong>{row.Rate_Percentage?.toFixed(2)}%</strong> },
    { header: 'In force from', render: (row) => new Date(row.Effective_From_Date).toLocaleDateString() },
    { header: 'Status', render: (row) => <StatusBadge value={row.Status} /> }
  ];

  const reportColumns = [
    { header: 'Report number', render: (row) => <strong>{row.Report_Number || row.Report_ID}</strong> },
    { header: 'Period covered', render: (row) => `${new Date(row.Period_Start_Date).toLocaleDateString()} - ${new Date(row.Period_End_Date).toLocaleDateString()}` },
    { header: 'Sales billed', align: 'right', render: (row) => <span>{fmtMoneyFull(row.Total_Sales_Value)}</span> },
    { header: 'Purchases', align: 'right', render: (row) => <span>{fmtMoneyFull(row.Total_Purchase_Value)}</span> },
    { header: 'GST we collected on sales', align: 'right', render: (row) => <strong>{fmtMoneyFull(row.Total_Output_Tax)}</strong> },
    { header: 'GST we paid on purchases (input credit)', align: 'right', render: (row) => <strong>{fmtMoneyFull(row.Total_Input_Tax)}</strong> },
    { header: 'GST to pay the government', align: 'right', render: (row) => (
      <strong style={{ color: row.Net_Tax_Payable > 0 ? 'var(--status-caution-fg)' : 'var(--status-positive-fg)' }}>
        {fmtMoneyFull(Math.abs(row.Net_Tax_Payable || 0))}{row.Net_Tax_Payable < 0 ? ' in our credit' : ''}
      </strong>
    )},
    { header: 'Status', render: (row) => <StatusBadge value={row.Status} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Tax &amp; GST</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Set the GST rates the company charges, work out how much GST is owed for a period, and mark the return as filed. Used by accounts staff.</p>
        </div>
        {activeTab === 'configuration' && (
          <button className="btn btn-primary" onClick={() => {
            setConfigForm({ Tax_Code: '', Description: '', Tax_Type: 'IGST', Rate_Percentage: 18.00, Status: 'Active' });
            setIsConfigModalOpen(true);
          }}>
            <Percent size={14} /> Add GST Rate
          </button>
        )}
        {activeTab === 'report' && (
          <button className="btn btn-primary" onClick={() => setIsGenerateModalOpen(true)}>
            <Calculator size={14} /> Work Out GST for a Period
          </button>
        )}
      </div>

      {/* Tabs matching screenshot design */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          role="tab" aria-selected={activeTab === 'configuration'} onClick={() => setActiveTab('configuration')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'configuration' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'configuration' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Percent size={16} /> GST rates we use
        </button>
        <button 
          role="tab" aria-selected={activeTab === 'report'} onClick={() => setActiveTab('report')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'report' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'report' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FileText size={16} /> GST returns
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
          <DataTable
            columns={activeTab === 'configuration' ? configColumns : reportColumns}
            data={activeTab === 'configuration' ? taxConfigs : reports}
            isLoading={loading}
            customActions={activeTab === 'configuration' ? configActionRenderer : reportActionRenderer}
            emptyTitle={activeTab === 'configuration' ? 'No GST rates set up yet' : 'No GST returns worked out yet'}
            emptyMessage={activeTab === 'configuration'
              ? 'Add the GST rates the company charges — for example IGST 18% on sales to another state. Use Add GST Rate above.'
              : 'Pick a period and the system will add up the GST on your sales and purchases, so you can see what is owed. Use Work Out GST for a Period above.'}
          />
        </div>
      </div>

      {/* Modal 1: New / Edit Tax Configuration */}
      <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title={configForm._id ? `Edit GST rate: ${configForm.Tax_Code}` : 'Add a GST rate'}>
        <form onSubmit={handleSaveConfig}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Tax code — a short name for this rate (format: TYPE-RATE, e.g. IGST-18)</label>
              <input type="text" className="input-field" required placeholder="e.g. IGST-18" value={configForm.Tax_Code} onChange={e => setConfigForm({ ...configForm, Tax_Code: e.target.value })} disabled={!!configForm._id} />
            </div>

            <div className="input-group">
              <label className="input-label">Which kind of GST?</label>
              <select className="input-field" value={configForm.Tax_Type} onChange={e => setConfigForm({ ...configForm, Tax_Type: e.target.value })}>
                <option value="CGST">CGST (Central GST)</option>
                <option value="SGST">SGST (State GST)</option>
                <option value="IGST">IGST (Integrated GST)</option>
                <option value="UTGST">UTGST (Union Territory GST)</option>
                <option value="CESS">CESS (GST Compensation)</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">What is this rate for?</label>
            <input type="text" className="input-field" required placeholder="e.g. Integrated GST 18% (Inter-State Supplies)" value={configForm.Description} onChange={e => setConfigForm({ ...configForm, Description: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Rate percentage (between 0 and 100)</label>
              <input type="number" step="0.01" className="input-field" required min="0" max="100" value={configForm.Rate_Percentage} onChange={e => setConfigForm({ ...configForm, Rate_Percentage: e.target.value })} />
            </div>

            <div className="input-group">
              <label className="input-label">Is this rate in use?</label>
              <select className="input-field" value={configForm.Status} onChange={e => setConfigForm({ ...configForm, Status: e.target.value })}>
                <option value="Active">Active — available to use</option>
                <option value="Inactive">Inactive — no longer used</option>
              </select>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '12px', marginTop: '8px' }}>
Sales inside Tamil Nadu carry <strong>CGST and SGST</strong> together. Sales to another state carry <strong>IGST</strong> instead.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsConfigModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busyAction === 'config'}>{busyAction === 'config' ? 'Saving…' : 'Save GST rate'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Generate GSTR Tax Report */}
      <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Work out GST for a period">
        <form onSubmit={handleGenerateReport}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Period starts on</label>
              <input type="date" className="input-field" required value={generateForm.Period_Start_Date} onChange={e => setGenerateForm({ ...generateForm, Period_Start_Date: e.target.value })} />
            </div>

            <div className="input-group">
              <label className="input-label">Period ends on</label>
              <input type="date" className="input-field" required value={generateForm.Period_End_Date} onChange={e => setGenerateForm({ ...generateForm, Period_End_Date: e.target.value })} />
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-caption)', color: 'var(--status-info-fg)', marginTop: 'var(--space-3)' }}>
            This adds up the GST on every customer invoice and every supplier bill in the period, and shows what is left to pay the government.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsGenerateModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busyAction === 'report'}>{busyAction === 'report' ? 'Working it out…' : 'Work out the GST'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaxManagement;
