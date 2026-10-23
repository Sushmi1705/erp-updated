import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Hammer, CheckCircle2, PackagePlus, ShieldAlert, Lock, Clock } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
const BreakdownMaintenance = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [breakdowns, setBreakdowns] = useState([]);
  const [machines, setMachines] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRepairLogModalOpen, setIsRepairLogModalOpen] = useState(false);
  const [isSparesModalOpen, setIsSparesModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [reportForm, setReportForm] = useState({
    Machine_ID: '',
    Reported_Issue: ''
  });
  const [repairLogForm, setRepairLogForm] = useState({
    Action_Taken: '',
    Labor_Hours_Spent: 1
  });
  const [spareForm, setSpareForm] = useState({
    Spare_Part_ID: '',
    Quantity_Consumed: 1
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const macRes = await axios.get('/master/machine');
      if (macRes.data?.data) setMachines(macRes.data.data);
      const matRes = await axios.get('/master/material');
      if (matRes.data?.data) setSpareParts(matRes.data.data);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/maintenance/v2/breakdown');
      setBreakdowns(res.data.data);
    } catch (err) {
      console.error('Breakdown fetch error', err);
    }
    setLoading(false);
  };
  const handleReportBreakdown = async e => {
    e.preventDefault();
    try {
      await axios.post('/maintenance/v2/breakdown', reportForm);
      setIsReportModalOpen(false);
      setReportForm({
        Machine_ID: '',
        Reported_Issue: ''
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error reporting breakdown');
    }
  };
  const handleAddRepairLog = async e => {
    e.preventDefault();
    try {
      await axios.post(`/maintenance/v2/breakdown/${selectedIncident._id}/repair-log`, repairLogForm);
      setIsRepairLogModalOpen(false);
      setRepairLogForm({
        Action_Taken: '',
        Labor_Hours_Spent: 1
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error logging repair action');
    }
  };
  const handleLogSpares = async e => {
    e.preventDefault();
    try {
      await axios.post(`/maintenance/v2/breakdown/${selectedIncident._id}/spares`, spareForm);
      setIsSparesModalOpen(false);
      setSpareForm({
        Spare_Part_ID: '',
        Quantity_Consumed: 1
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error logging spare part');
    }
  };
  const handleResolveIncident = async e => {
    e.preventDefault();
    try {
      await axios.put(`/maintenance/v2/breakdown/${selectedIncident._id}/status`, {
        Status: 'Resolved',
        Resolution_Datetime: new Date().toISOString()
      });
      setIsResolveModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error resolving breakdown');
    }
  };
  const getStatusBadge = status => {
    const colors = {
      'Resolved': {
        bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
        text: 'var(--accent-success)'
      },
      'In Progress': {
        bg: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        text: 'var(--accent-primary)'
      },
      'Waiting on Spares': {
        bg: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
        text: 'var(--accent-warning)'
      },
      'Open': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      }
    };
    const c = colors[status] || colors['Open'];
    return <span style={{
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      backgroundColor: c.bg,
      color: c.text
    }}>{status}</span>;
  };
  const actionRenderer = row => {
    const isResolved = row.Status === 'Resolved';
    if (isResolved) {
      return <span style={{
        fontSize: '11px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
          <Lock size={12} /> Resolved
        </span>;
    }
    const hasRepairLogs = row.repairLogs && row.repairLogs.length > 0;
    return <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        <button onClick={() => {
        setSelectedIncident(row);
        setRepairLogForm({
          Action_Taken: '',
          Labor_Hours_Spent: 1
        });
        setIsRepairLogModalOpen(true);
      }} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--accent-primary)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 600
      }}>
          <Hammer size={12} /> Add Repair Entry
        </button>

        <button onClick={() => {
        setSelectedIncident(row);
        setSpareForm({
          Spare_Part_ID: '',
          Quantity_Consumed: 1
        });
        setIsSparesModalOpen(true);
      }} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--text-secondary)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
          <PackagePlus size={12} /> Record Spare Used
        </button>

        <button onClick={() => {
        setSelectedIncident(row);
        setIsResolveModalOpen(true);
      }} className="btn-icon" style={{
        fontSize: '11px',
        color: hasRepairLogs ? 'var(--accent-success)' : 'var(--text-secondary)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 600,
        opacity: hasRepairLogs ? 1 : 0.6
      }}>
          <CheckCircle2 size={12} /> Close Breakdown
        </button>
      </div>;
  };
  const columns = [{
    header: 'Breakdown no.',
    render: row => <strong>{row.Incident_ID || row.breakdownNumber}</strong>
  }, {
    header: 'Machine',
    render: row => <div>
        <strong>{row.Machine_ID?.name || row.machineId?.name || 'CNC Machine'}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--accent-danger)',
        fontWeight: 500
      }}>{row.Machine_ID?.code || row.machineId?.code} ({row.Machine_ID?.status || 'Down/Unavailable'})</div>
      </div>
  }, {
    header: 'Problem reported',
    render: row => <span style={{
      fontSize: '12px'
    }}>{row.Reported_Issue || row.issueDescription}</span>
  }, {
    header: 'Status',
    render: row => getStatusBadge(row.Status || row.repairStatus || 'Open')
  }, {
    header: 'Reported on',
    render: row => new Date(row.Reported_Datetime || row.reportedDate).toLocaleString()
  }, {
    header: 'Machine stopped (hrs)',
    render: row => <strong style={{
      color: (row.Total_Downtime_Hours || row.downtimeDurationHours) > 0 ? 'var(--accent-danger)' : 'inherit'
    }}>
        {row.Total_Downtime_Hours || row.downtimeDurationHours || 0} h
      </strong>
  }, {
    header: 'Cost of breakdown',
    render: row => <span style={{
      fontSize: '12px',
      fontWeight: 600,
      color: row.costAnalysis ? 'var(--text-primary)' : 'var(--text-secondary)'
    }}>
        {row.costAnalysis ? fmtMoneyFull(row.costAnalysis.Total_Incident_Cost) : 'Working it out…'}
      </span>
  }];
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }}>
      <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '16px',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '16px'
    }}>
        <div>
          <h1 style={{
          fontSize: '18px',
          fontWeight: 600
        }}>Breakdown Repairs</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Report a machine breakdown, follow the repair, and see what the stoppage cost.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsReportModalOpen(true)} style={{
        backgroundColor: 'var(--accent-danger)'
      }}>
          <AlertTriangle size={14} /> Report Breakdown
        </button>
      </div>

      <div style={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)'
    }}>
        <div style={{
        padding: '16px',
        flex: 1,
        overflowY: 'auto',
        backgroundColor: 'var(--bg-primary)'
      }}>
          <DataTable columns={columns} data={breakdowns} isLoading={loading} emptyTitle="No breakdowns reported" emptyMessage="When a machine stops working, report it here and follow the repair. Press “Report Breakdown” above." customActions={actionRenderer} />
        </div>
      </div>

      {/* Report Breakdown Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Report a machine breakdown">
        <form onSubmit={e => runBusy(() => handleReportBreakdown(e))}>
          <div className="input-group">
            <label className="input-label">Machine affected</label>
            <select className="input-field" required value={reportForm.Machine_ID} onChange={e => setReportForm({
            ...reportForm,
            Machine_ID: e.target.value
          })}>
              <option value="" disabled>Choose the machine that failed</option>
              {machines.map(m => <option key={m._id} value={m._id}>{m.name} ({m.code}) - {m.status}</option>)}
            </select>
        {machines.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 11,
            marginTop: 4,
            lineHeight: 1.4
          }}>No machines yet — add one under Master Data → Machines.</p>}
          </div>

          <div className="input-group">
            <label className="input-label">What went wrong</label>
            <textarea className="input-field" rows="3" required placeholder="Describe observed breakdown symptom or fault code..." value={reportForm.Reported_Issue} onChange={e => setReportForm({
            ...reportForm,
            Reported_Issue: e.target.value
          })}></textarea>
          </div>

          <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-danger) 19%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent-danger)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
            <ShieldAlert size={16} /> Immediate Equipment Lock: Reporting a breakdown will lock the machine status as "Down/Unavailable" and halt shop floor dispatch.
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsReportModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{
            backgroundColor: 'var(--accent-danger)'
          }}>{busy ? 'Reporting…' : 'Report Breakdown'}</button>
          </div>
        </form>
      </Modal>

      {/* Repair Log Modal */}
      {selectedIncident && <Modal isOpen={isRepairLogModalOpen} onClose={() => setIsRepairLogModalOpen(false)} title={`Add a repair entry: ${selectedIncident.Incident_ID || selectedIncident.breakdownNumber}`}>
          <form onSubmit={e => runBusy(() => handleAddRepairLog(e))}>
            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              <div>Machine: <strong>{selectedIncident.Machine_ID?.name || 'CNC Machine'}</strong></div>
              <div>Reported Issue: <strong>{selectedIncident.Reported_Issue || selectedIncident.issueDescription}</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">Repair work done</label>
              <textarea className="input-field" rows="3" required placeholder="Detailed notes on troubleshooting and repair steps executed..." value={repairLogForm.Action_Taken} onChange={e => setRepairLogForm({
            ...repairLogForm,
            Action_Taken: e.target.value
          })}></textarea>
            </div>

            <div className="input-group">
              <label className="input-label">Hours spent</label>
              <input type="number" step="0.5" className="input-field" required min="0.5" value={repairLogForm.Labor_Hours_Spent} onChange={e => setRepairLogForm({
            ...repairLogForm,
            Labor_Hours_Spent: e.target.value
          })} />
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsRepairLogModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Repair Entry'}</button>
            </div>
          </form>
        </Modal>}

      {/* Log Spare Parts Modal */}
      {selectedIncident && <Modal isOpen={isSparesModalOpen} onClose={() => setIsSparesModalOpen(false)} title={`Record spares used: ${selectedIncident.Incident_ID || selectedIncident.breakdownNumber}`}>
          <form onSubmit={e => runBusy(() => handleLogSpares(e))}>
            <div className="input-group">
              <label className="input-label">Spare part</label>
              <select className="input-field" required value={spareForm.Spare_Part_ID} onChange={e => setSpareForm({
            ...spareForm,
            Spare_Part_ID: e.target.value
          })}>
                <option value="" disabled>Choose a spare part</option>
                {spareParts.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code}) - Cost: ${s.standardCost || 50}</option>)}
              </select>
        {spareParts.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 11,
            marginTop: 4,
            lineHeight: 1.4
          }}>No materials yet — add the spare under Master Data → Raw Materials.</p>}
            </div>

            <div className="input-group">
              <label className="input-label">Quantity used</label>
              <input type="number" className="input-field" required min="1" value={spareForm.Quantity_Consumed} onChange={e => setSpareForm({
            ...spareForm,
            Quantity_Consumed: e.target.value
          })} />
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsSparesModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Recording…' : 'Record Spare Used'}</button>
            </div>
          </form>
        </Modal>}

      {/* Resolve Incident Modal */}
      {selectedIncident && <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title={`Close breakdown: ${selectedIncident.Incident_ID || selectedIncident.breakdownNumber}`}>
          <form onSubmit={e => runBusy(() => handleResolveIncident(e))}>
            {(!selectedIncident.repairLogs || selectedIncident.repairLogs.length === 0) && <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-danger) 19%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent-danger)',
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
                <AlertTriangle size={16} /> Mandatory Repair Log Notice: Cannot resolve breakdown without at least one repair action log.
              </div>}

            {selectedIncident.Status === 'Open' && <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-warning) 19%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent-warning)',
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
                <Clock size={16} /> Workflow Notice: Incident must first be placed in "In Progress" or logged with a repair action before resolving.
              </div>}

            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              <div>Reported: <strong>{new Date(selectedIncident.Reported_Datetime || selectedIncident.reportedDate).toLocaleString()}</strong></div>
              <div>Current Repair Logs: <strong>{selectedIncident.repairLogs?.length || 0} entries</strong></div>
              <div>Current Spares Used: <strong>{selectedIncident.spares?.length || 0} items</strong></div>
            </div>

            <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent-success)',
          marginBottom: '16px'
        }}>
              Resolving this incident will auto-calculate exact Downtime Hours, sum Labor + Spares + Idle Costs, and unlock the Machine asset to "Active".
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsResolveModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{
            backgroundColor: 'var(--accent-success)'
          }} disabled={busy || selectedIncident.Status === 'Open' || !selectedIncident.repairLogs || selectedIncident.repairLogs.length === 0}>
                {busy ? 'Closing…' : 'Close Breakdown'}
              </button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default BreakdownMaintenance;