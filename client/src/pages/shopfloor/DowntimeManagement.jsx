import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, PowerOff, CheckCircle, Lock, Wrench } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
const DowntimeManagement = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [downtimes, setDowntimes] = useState([]);
  const [machines, setMachines] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedDT, setSelectedDT] = useState(null);
  const [recordForm, setRecordForm] = useState({
    Hardware_ID: '',
    DT_Type: 'Unplanned',
    Reason_Description: '',
    Component_Failed: '',
    Impact_Analysis_Notes: ''
  });
  const [resolveForm, setResolveForm] = useState({
    Reason_Description: '',
    Impact_Analysis_Notes: '',
    Corrective_Action_Taken: ''
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const [macRes, v2WoRes, v1WoRes] = await Promise.allSettled([axios.get('/master/machine'), axios.get('/production/v2/work-orders'), axios.get('/production/wo')]);
      if (macRes.status === 'fulfilled' && macRes.value.data?.data) {
        setMachines(macRes.value.data.data.filter(m => m.isActive !== false));
      }
      let woList = [];
      if (v2WoRes.status === 'fulfilled' && v2WoRes.value.data?.data) woList = [...woList, ...v2WoRes.value.data.data];
      if (v1WoRes.status === 'fulfilled' && v1WoRes.value.data?.data) woList = [...woList, ...v1WoRes.value.data.data];
      setWorkOrders(woList);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/shopfloor/v2/downtime');
      setDowntimes(res.data.data);
    } catch (err) {
      console.error('Downtime fetch error', err);
    }
    setLoading(false);
  };
  const handleRecordDowntime = async e => {
    e.preventDefault();
    try {
      await axios.post('/shopfloor/v2/downtime', recordForm);
      setIsRecordModalOpen(false);
      setRecordForm({
        Hardware_ID: '',
        DT_Type: 'Unplanned',
        Reason_Description: '',
        Component_Failed: '',
        Impact_Analysis_Notes: ''
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error recording downtime event');
    }
  };
  const handleResolveDowntime = async e => {
    e.preventDefault();
    try {
      await axios.put(`/shopfloor/v2/downtime/${selectedDT._id}/resolve`, resolveForm);
      setIsResolveModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error resolving downtime event');
    }
  };
  const handleCloseDowntime = async dtId => {
    try {
      await axios.put(`/shopfloor/v2/downtime/${dtId}/close`, {});
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error closing downtime event');
    }
  };
  const getStatusBadge = status => {
    const colors = {
      'Active': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      },
      'Investigating': {
        bg: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
        text: 'var(--accent-warning)'
      },
      'Resolved': {
        bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
        text: 'var(--accent-success)'
      },
      'Closed': {
        bg: 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
        text: 'var(--text-muted)'
      }
    };
    const c = colors[status] || colors['Active'];
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
    const isClosed = row.Status === 'Closed';
    const isResolved = row.Status === 'Resolved';
    if (isClosed) {
      return <span style={{
        fontSize: '11px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
          <Lock size={12} /> Locked (Closed)
        </span>;
    }
    return <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        {!isResolved && <button onClick={() => {
        setSelectedDT(row);
        setResolveForm({
          Reason_Description: row.cause?.Reason_Description || '',
          Impact_Analysis_Notes: row.impact?.Impact_Analysis_Notes || '',
          Corrective_Action_Taken: ''
        });
        setIsResolveModalOpen(true);
      }} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--accent-success)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
            <Wrench size={12} /> Machine Running Again
          </button>}
        {isResolved && <button disabled={busy} onClick={() => runBusy(() => handleCloseDowntime(row._id), row._id)} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
            <Lock size={12} /> Close Entry
          </button>}
      </div>;
  };
  const columns = [{
    header: 'Downtime no.',
    render: row => <strong>{row.DT_Log_Number || row.downtimeNumber}</strong>
  }, {
    header: 'Machine',
    render: row => <div>
        <strong style={{
        color: 'var(--text-primary)'
      }}>{row.Hardware_ID?.name || row.Hardware_ID?.code || 'Factory Hardware'}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>Code: {row.Hardware_ID?.code || '-'}</div>
      </div>
  }, {
    header: 'Type and reason',
    render: row => <div>
        <span style={{
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        backgroundColor: row.cause?.DT_Type === 'Unplanned' || row.type === 'Unplanned' ? 'color-mix(in srgb, var(--accent-danger) 8%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        color: row.cause?.DT_Type === 'Unplanned' || row.type === 'Unplanned' ? 'var(--accent-danger)' : 'var(--accent-primary)'
      }}>
          {row.cause?.DT_Type || row.type}
        </span>
        <div style={{
        fontSize: '12px',
        marginTop: '2px'
      }}>{row.cause?.Reason_Description || row.reason || 'Unspecified'}</div>
      </div>
  }, {
    header: 'Status',
    render: row => getStatusBadge(row.Status || 'Active')
  }, {
    header: 'Duration',
    render: row => <strong style={{
      color: 'var(--text-primary)'
    }}>
        {row.Duration_Minutes || row.durationMinutes || 0} min
      </strong>
  }, {
    header: 'What it affected',
    render: row => <span style={{
      fontSize: '11px',
      color: 'var(--text-secondary)'
    }}>{row.impact?.Impact_Analysis_Notes || row.impactAnalysis || '-'}</span>
  }, {
    header: 'Recorded on',
    render: row => new Date(row.Logged_Date || row.dateRecorded || row.createdAt).toLocaleDateString()
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
        }}>Machine Downtime</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Record every machine stoppage and its reason, so repeat problems can be found.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsRecordModalOpen(true)}>
          <PowerOff size={14} /> Record Downtime
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
          <DataTable columns={columns} data={downtimes} isLoading={loading} emptyTitle="No downtime recorded yet" emptyMessage="Every time a machine stops, record it here with the reason. Press “Record Downtime” above." customActions={actionRenderer} />
        </div>
      </div>

      {/* Record Downtime Modal */}
      <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title="Record a machine stoppage">
        <form onSubmit={e => runBusy(() => handleRecordDowntime(e))}>
          <div className="input-group">
            <label className="input-label">Machine</label>
            <select className="input-field" required value={recordForm.Hardware_ID} onChange={e => setRecordForm({
            ...recordForm,
            Hardware_ID: e.target.value
          })}>
              <option value="" disabled>Choose a machine</option>
              {machines.map(m => <option key={m._id} value={m._id}>{m.name} ({m.code})</option>)}
            </select>
        {machines.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 11,
            marginTop: 4,
            lineHeight: 1.4
          }}>No machines yet — add one under Master Data → Machines.</p>}
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Type of stoppage</label>
              <select className="input-field" required value={recordForm.DT_Type} onChange={e => setRecordForm({
              ...recordForm,
              DT_Type: e.target.value
            })}>
                <option value="Unplanned">Unplanned (Breakdown/Jam)</option>
                <option value="Planned">Planned (Maintenance/Setup)</option>
                <option value="Preventative">Preventative Service</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Part that failed</label>
              <input type="text" className="input-field" placeholder="e.g. Hydraulic Valve" value={recordForm.Component_Failed} onChange={e => setRecordForm({
              ...recordForm,
              Component_Failed: e.target.value
            })} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Reason for the stoppage</label>
            <input type="text" className="input-field" required placeholder="Describe what caused the stoppage..." value={recordForm.Reason_Description} onChange={e => setRecordForm({
            ...recordForm,
            Reason_Description: e.target.value
          })} />
          </div>

          <div className="input-group">
            <label className="input-label">What it affected</label>
            <textarea className="input-field" rows="2" placeholder="Qualitative assessment of production impact..." value={recordForm.Impact_Analysis_Notes} onChange={e => setRecordForm({
            ...recordForm,
            Impact_Analysis_Notes: e.target.value
          })}></textarea>
          </div>

          <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent-danger)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
            <AlertTriangle size={16} /> Recording active downtime will immediately update machine utilization state to Offline.
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRecordModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Recording…' : 'Record Downtime'}</button>
          </div>
        </form>
      </Modal>

      {/* Resolve Event Modal */}
      {selectedDT && <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title={`Machine running again: ${selectedDT.DT_Log_Number || selectedDT.downtimeNumber}`}>
          <form onSubmit={e => runBusy(() => handleResolveDowntime(e))}>
            <div className="input-group">
              <label className="input-label">Final reason for the stoppage *</label>
              <input type="text" className="input-field" required value={resolveForm.Reason_Description} onChange={e => setResolveForm({
            ...resolveForm,
            Reason_Description: e.target.value
          })} />
            </div>

            <div className="input-group">
              <label className="input-label">What it affected *</label>
              <textarea className="input-field" rows="2" required value={resolveForm.Impact_Analysis_Notes} onChange={e => setResolveForm({
            ...resolveForm,
            Impact_Analysis_Notes: e.target.value
          })} placeholder="Document final production impact..."></textarea>
            </div>

            <div className="input-group">
              <label className="input-label">What was done to fix it</label>
              <textarea className="input-field" rows="2" value={resolveForm.Corrective_Action_Taken} onChange={e => setResolveForm({
            ...resolveForm,
            Corrective_Action_Taken: e.target.value
          })} placeholder="Details of repair or corrective action..."></textarea>
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsResolveModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Closing…' : 'Close Downtime'}</button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default DowntimeManagement;