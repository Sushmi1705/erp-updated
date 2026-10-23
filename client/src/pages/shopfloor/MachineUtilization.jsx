import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings2, Clock, Play, AlertTriangle, CheckCircle, Pause } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
const MachineUtilization = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [machineStates, setMachineStates] = useState([]);
  const [machines, setMachines] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isIdleModalOpen, setIsIdleModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [allocateForm, setAllocateForm] = useState({
    Machine_ID: '',
    WO_ID: ''
  });
  const [idleForm, setIdleForm] = useState({
    Idle_Reason_Code_ID: 'Material Shortage',
    Notes: ''
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
      const res = await axios.get('/shopfloor/v2/machine');
      setMachineStates(res.data.data);
    } catch (err) {
      console.error('Machine states fetch error', err);
    }
    setLoading(false);
  };
  const handleAllocate = async e => {
    e.preventDefault();
    try {
      await axios.post('/shopfloor/v2/machine/allocate', allocateForm);
      setIsAllocateModalOpen(false);
      setAllocateForm({
        Machine_ID: '',
        WO_ID: ''
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error allocating machine');
    }
  };
  const handleSetRunning = async stateId => {
    try {
      await axios.put(`/shopfloor/v2/machine/${stateId}/running`, {});
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error setting machine to Running');
    }
  };
  const handleLogIdleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.put(`/shopfloor/v2/machine/${selectedMachine._id}/idle`, idleForm);
      setIsIdleModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error logging idle time');
    }
  };
  const handleRelease = async stateId => {
    try {
      await axios.put(`/shopfloor/v2/machine/${stateId}/release`, {});
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error releasing machine allocation');
    }
  };
  const getStatusBadge = status => {
    const colors = {
      'Running': {
        bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
        text: 'var(--accent-success)'
      },
      'Idle': {
        bg: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
        text: 'var(--accent-warning)'
      },
      'Maintenance': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      },
      'Offline': {
        bg: 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
        text: 'var(--text-muted)'
      },
      'Setup': {
        bg: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        text: 'var(--accent-primary)'
      }
    };
    const c = colors[status] || colors['Idle'];
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
    const isRunning = row.Current_Status === 'Running';
    const hasWO = !!(row.Current_WO_ID || row.activeAllocation?.WO_ID);
    return <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        {!isRunning && <button disabled={busy} onClick={() => runBusy(() => handleSetRunning(row._id), row._id)} className="btn-icon" style={{
        fontSize: '11px',
        color: hasWO ? 'var(--accent-success)' : 'var(--text-muted)',
        background: 'none',
        border: 'none',
        cursor: hasWO ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }} title={!hasWO ? 'Book this machine to a work order first' : 'Mark the machine as running'}>
            <Play size={12} /> Set Running
          </button>}
        {isRunning && <button onClick={() => {
        setSelectedMachine(row);
        setIsIdleModalOpen(true);
      }} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--accent-warning)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
            <Pause size={12} /> Set Idle
          </button>}
        <button onClick={() => {
        setSelectedMachine(row);
        setIsIdleModalOpen(true);
      }} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--accent-primary)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
          <Clock size={12} /> Record Idle Time
        </button>
        {hasWO && <button disabled={busy} onClick={() => runBusy(() => handleRelease(row._id), row._id)} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--accent-danger)',
        background: 'none',
        border: 'none',
        cursor: 'pointer'
      }}>
            Release
          </button>}
      </div>;
  };
  const columns = [{
    header: 'Machine',
    render: row => <div>
        <strong style={{
        color: 'var(--text-primary)'
      }}>{row.Machine_ID?.name || row.Machine_ID?.code || 'Factory Hardware'}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>ID: {row.Machine_State_ID || row.Machine_ID?.code || '-'}</div>
      </div>
  }, {
    header: 'Work Order',
    render: row => {
      const woNum = row.Current_WO_ID?.WO_Number || row.Current_WO_ID?.workOrderNumber || row.activeAllocation?.WO_ID?.WO_Number || row.activeAllocation?.WO_ID?.workOrderNumber;
      if (!woNum) {
        return <span style={{
          color: 'var(--text-secondary)',
          fontSize: '11px'
        }}>Unassigned</span>;
      }
      return <strong style={{
        color: 'var(--accent-success)'
      }}>{woNum}</strong>;
    }
  }, {
    header: 'Right now',
    render: row => getStatusBadge(row.Current_Status)
  }, {
    header: 'Idle time (hrs)',
    render: row => <span style={{
      color: (row.Current_Idle_Time_Mins || 0) > 60 ? 'var(--accent-danger)' : 'var(--text-secondary)'
    }}>
        {row.Current_Idle_Time_Mins || 0} mins
      </span>
  }, {
    header: 'Machine used (%)',
    render: row => {
      const util = row.Live_Utilization_Percentage !== undefined ? row.Live_Utilization_Percentage : 100;
      return <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '110px'
      }}>
          <div style={{
          flex: 1,
          height: '6px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
            <div style={{
            height: '100%',
            width: `${util}%`,
            backgroundColor: util > 85 ? 'var(--accent-success)' : util > 70 ? 'var(--accent-warning)' : 'var(--accent-danger)'
          }}></div>
          </div>
          <span style={{
          fontSize: '12px',
          fontWeight: 600
        }}>{util}%</span>
        </div>;
    }
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
        }}>Machine Usage</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Book machines to work orders and see how many hours each machine actually ran.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAllocateModalOpen(true)}>
          <Settings2 size={14} /> Book Machine to Work Order
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
          <DataTable columns={columns} data={machineStates} isLoading={loading} emptyTitle="No machines booked yet" emptyMessage="Book a machine to a work order and its running hours will be tracked here. Press “Book Machine to Work Order” above." customActions={actionRenderer} />
        </div>
      </div>

      {/* Allocate Hardware Modal */}
      <Modal isOpen={isAllocateModalOpen} onClose={() => setIsAllocateModalOpen(false)} title="Book a machine to a work order">
        <form onSubmit={e => runBusy(() => handleAllocate(e))}>
          <div className="input-group">
            <label className="input-label">Machine</label>
            <select className="input-field" required value={allocateForm.Machine_ID} onChange={e => setAllocateForm({
            ...allocateForm,
            Machine_ID: e.target.value
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

          <div className="input-group">
            <label className="input-label">Work order</label>
            <select className="input-field" required value={allocateForm.WO_ID} onChange={e => setAllocateForm({
            ...allocateForm,
            WO_ID: e.target.value
          })}>
              <option value="" disabled>Choose a work order</option>
              {workOrders.map(wo => <option key={wo._id} value={wo._id}>
                  {wo.WO_Number || wo.workOrderNumber} - {wo.Status || wo.status || 'Active'}
                </option>)}
            </select>
        {workOrders.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 11,
            marginTop: 4,
            lineHeight: 1.4
          }}>No work orders ready yet — release one under Production → Work Orders.</p>}
          </div>

          <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent-primary)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
            <CheckCircle size={16} /> Allocation binds the hardware exclusively to this Work Order for production tracking.
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAllocateModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Booking…' : 'Book Machine'}</button>
          </div>
        </form>
      </Modal>

      {/* Log Idle Time Modal */}
      {selectedMachine && <Modal isOpen={isIdleModalOpen} onClose={() => setIsIdleModalOpen(false)} title={`Record idle time: ${selectedMachine.Machine_ID?.name || 'Machine'}`}>
          <form onSubmit={e => runBusy(() => handleLogIdleSubmit(e))}>
            <div className="input-group">
              <label className="input-label">Why the machine is idle</label>
              <select className="input-field" value={idleForm.Idle_Reason_Code_ID} onChange={e => setIdleForm({
            ...idleForm,
            Idle_Reason_Code_ID: e.target.value
          })}>
                <option value="Material Shortage">Material Shortage</option>
                <option value="Operator Break">Operator Break</option>
                <option value="Tool Change">Tool Change / Setup</option>
                <option value="Unplanned Maintenance">Unplanned Maintenance</option>
                <option value="Power Outage">Power Outage</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Notes</label>
              <textarea className="input-field" rows="2" value={idleForm.Notes} onChange={e => setIdleForm({
            ...idleForm,
            Notes: e.target.value
          })} placeholder="Provide additional details on why the machine is idle..."></textarea>
            </div>
            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsIdleModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Set Machine Idle'}</button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default MachineUtilization;