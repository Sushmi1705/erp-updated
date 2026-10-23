import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Wrench, CheckCircle2, AlertTriangle, PackagePlus, Play } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
const PreventiveMaintenance = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [schedules, setSchedules] = useState([]);
  const [machines, setMachines] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [isSparesModalOpen, setIsSparesModalOpen] = useState(false);
  const [selectedPm, setSelectedPm] = useState(null);
  const [createForm, setCreateForm] = useState({
    Machine_ID: '',
    Task_Summary: '',
    Scheduled_Date: new Date().toISOString().split('T')[0],
    Maintenance_Type: 'Time-Based'
  });
  const [execForm, setExecForm] = useState({
    Status: 'In Progress',
    Executed_Date: new Date().toISOString().split('T')[0]
  });
  const [spareForm, setSpareForm] = useState({
    Spare_Part_ID: '',
    Actual_Quantity_Consumed: 1
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
      const res = await axios.get('/maintenance/v2/preventive');
      setSchedules(res.data.data);
    } catch (err) {
      console.error('PM Schedule fetch error', err);
    }
    setLoading(false);
  };
  const handleCreatePM = async e => {
    e.preventDefault();
    try {
      await axios.post('/maintenance/v2/preventive', createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        Machine_ID: '',
        Task_Summary: '',
        Scheduled_Date: new Date().toISOString().split('T')[0],
        Maintenance_Type: 'Time-Based'
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error scheduling PM');
    }
  };
  const handleUpdateStatus = async e => {
    e.preventDefault();
    try {
      await axios.put(`/maintenance/v2/preventive/${selectedPm._id}/status`, execForm);
      setIsExecModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating status');
    }
  };
  const handleLogSpares = async e => {
    e.preventDefault();
    try {
      await axios.post(`/maintenance/v2/preventive/${selectedPm._id}/spares`, spareForm);
      setIsSparesModalOpen(false);
      setSpareForm({
        Spare_Part_ID: '',
        Actual_Quantity_Consumed: 1
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error logging spare parts');
    }
  };
  const getStatusBadge = status => {
    const colors = {
      'Completed': {
        bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
        text: 'var(--accent-success)'
      },
      'In Progress': {
        bg: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        text: 'var(--accent-primary)'
      },
      'Overdue': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      },
      'Scheduled': {
        bg: 'color-mix(in srgb, var(--accent-purple) 8%, transparent)',
        text: 'var(--accent-purple)'
      },
      'Cancelled': {
        bg: 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
        text: 'var(--text-muted)'
      }
    };
    const c = colors[status] || colors['Scheduled'];
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
    const isCompleted = row.Status === 'Completed';
    if (isCompleted) {
      return <span style={{
        fontSize: '11px',
        color: 'var(--accent-success)',
        fontWeight: 600
      }}>Executed</span>;
    }
    return <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        {row.Status === 'Scheduled' || row.Status === 'Overdue' ? <button onClick={() => {
        setSelectedPm(row);
        setExecForm({
          Status: 'In Progress',
          Executed_Date: new Date().toISOString().split('T')[0]
        });
        setIsExecModalOpen(true);
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
            <Play size={12} /> Start Job
          </button> : <button onClick={() => {
        setSelectedPm(row);
        setExecForm({
          Status: 'Completed',
          Executed_Date: new Date().toISOString().split('T')[0]
        });
        setIsExecModalOpen(true);
      }} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--accent-success)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 600
      }}>
            <CheckCircle2 size={12} /> Finish Job
          </button>}

        <button onClick={() => {
        setSelectedPm(row);
        setSpareForm({
          Spare_Part_ID: '',
          Actual_Quantity_Consumed: 1
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
      </div>;
  };
  const columns = [{
    header: 'Job no.',
    render: row => <strong>{row.PM_ID || row.scheduleNumber}</strong>
  }, {
    header: 'Machine',
    render: row => <div>
        <strong>{row.Machine_ID?.name || row.machineId?.name || 'CNC Machine'}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>{row.Machine_ID?.code || row.machineId?.code} ({row.Machine_ID?.status || 'Active'})</div>
      </div>
  }, {
    header: 'Work to be done',
    render: row => <span style={{
      fontSize: '12px'
    }}>{row.Task_Summary || row.maintenanceTask}</span>
  }, {
    header: 'Type',
    render: row => <span style={{
      fontSize: '11px',
      color: 'var(--text-secondary)'
    }}>{row.Maintenance_Type || 'Time-Based'}</span>
  }, {
    header: 'Status',
    render: row => getStatusBadge(row.Status || row.status || 'Scheduled')
  }, {
    header: 'Technician',
    render: row => row.Technician_ID?.name || row.assignedTechnician || 'System Technician'
  }, {
    header: 'Planned for',
    render: row => new Date(row.Scheduled_Date || row.scheduledDate).toLocaleDateString()
  }, {
    header: 'Done on',
    render: row => row.Executed_Date || row.executionDate ? new Date(row.Executed_Date || row.executionDate).toLocaleDateString() : '-'
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
        }}>Planned Maintenance</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Schedule service before a machine breaks down, and record the spares used on each job.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <Calendar size={14} /> Schedule Maintenance
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
          <DataTable columns={columns} data={schedules} isLoading={loading} emptyTitle="Nothing scheduled yet" emptyMessage="Plan service before a machine breaks down. Press “Schedule Maintenance” above." customActions={actionRenderer} />
        </div>
      </div>

      {/* Schedule PM Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Schedule a maintenance job">
        <form onSubmit={e => runBusy(() => handleCreatePM(e))}>
          <div className="input-group">
            <label className="input-label">Machine</label>
            <select className="input-field" required value={createForm.Machine_ID} onChange={e => setCreateForm({
            ...createForm,
            Machine_ID: e.target.value
          })}>
              <option value="" disabled>Choose a machine</option>
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
            <label className="input-label">Work to be done</label>
            <input type="text" className="input-field" required placeholder="e.g. Monthly CNC Spindle Alignment & Bearing Lubrication" value={createForm.Task_Summary} onChange={e => setCreateForm({
            ...createForm,
            Task_Summary: e.target.value
          })} />
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Type of maintenance</label>
              <select className="input-field" required value={createForm.Maintenance_Type} onChange={e => setCreateForm({
              ...createForm,
              Maintenance_Type: e.target.value
            })}>
                <option value="Time-Based">Time-Based (Calendar Routine)</option>
                <option value="Usage-Based">Usage-Based (Operating Hours)</option>
                <option value="Condition-Based">Condition-Based (Vibration/Temp Sensor)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Planned for</label>
              <input type="date" className="input-field" required value={createForm.Scheduled_Date} onChange={e => setCreateForm({
              ...createForm,
              Scheduled_Date: e.target.value
            })} />
            </div>
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Maintenance Schedule'}</button>
          </div>
        </form>
      </Modal>

      {/* Execute PM Status Modal */}
      {selectedPm && <Modal isOpen={isExecModalOpen} onClose={() => setIsExecModalOpen(false)} title={`Update job status: ${selectedPm.PM_ID || selectedPm.scheduleNumber}`}>
          <form onSubmit={e => runBusy(() => handleUpdateStatus(e))}>
            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              <div>Target Machine: <strong>{selectedPm.Machine_ID?.name || 'CNC Lathe'}</strong></div>
              <div>Job Summary: <strong>{selectedPm.Task_Summary || selectedPm.maintenanceTask}</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">New status</label>
              <select className="input-field" required value={execForm.Status} onChange={e => setExecForm({
            ...execForm,
            Status: e.target.value
          })}>
                <option value="In Progress">In Progress (Flags Machine as Under Maintenance)</option>
                <option value="Completed">Completed (Deducts Spares & Restores Machine to Active)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {execForm.Status === 'Completed' && <div className="input-group">
                <label className="input-label">Date the work was done *</label>
                <input type="date" className="input-field" required value={execForm.Executed_Date} onChange={e => setExecForm({
            ...execForm,
            Executed_Date: e.target.value
          })} />
              </div>}

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsExecModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Job Update'}</button>
            </div>
          </form>
        </Modal>}

      {/* Log Spare Parts Modal */}
      {selectedPm && <Modal isOpen={isSparesModalOpen} onClose={() => setIsSparesModalOpen(false)} title={`Record spares used: ${selectedPm.PM_ID || selectedPm.scheduleNumber}`}>
          <form onSubmit={e => runBusy(() => handleLogSpares(e))}>
            <div className="input-group">
              <label className="input-label">Spare part</label>
              <select className="input-field" required value={spareForm.Spare_Part_ID} onChange={e => setSpareForm({
            ...spareForm,
            Spare_Part_ID: e.target.value
          })}>
                <option value="" disabled>Choose a spare part</option>
                {spareParts.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code}) - Stock: {s.quantityOnHand || 0}</option>)}
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
              <input type="number" className="input-field" required min="1" value={spareForm.Actual_Quantity_Consumed} onChange={e => setSpareForm({
            ...spareForm,
            Actual_Quantity_Consumed: e.target.value
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
    </div>;
};
export default PreventiveMaintenance;