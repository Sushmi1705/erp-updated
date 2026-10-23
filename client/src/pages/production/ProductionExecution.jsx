import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, CheckSquare, Settings, Users, Settings2, ShieldAlert } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
const ProductionExecution = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const runBusy = async (fn, id = null) => {
    setBusy(true);
    setBusyId(id);
    try { await fn(); } finally { setBusy(false); setBusyId(null); }
  };

  const [runs, setRuns] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [startWO, setStartWO] = useState('');
  const [activeRun, setActiveRun] = useState(null);
  const [isOpsModalOpen, setIsOpsModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'labor', 'machine', 'quality'
  const [activeOp, setActiveOp] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    setLoading(true);
    try {
      const [runsRes, woRes] = await Promise.all([axios.get('/production/v2/execution-run'), axios.get('/production/v2/work-orders')]);
      setRuns(runsRes.data.data);
      setWorkOrders(woRes.data.data.filter(w => ['Released', 'In Progress'].includes(w.Status)));
      if (activeRun) {
        const updated = runsRes.data.data.find(r => r._id === activeRun._id);
        if (updated) setActiveRun(updated);
      }
    } catch (err) {
      console.error('Fetch error', err);
    }
    setLoading(false);
  };
  const handleStartRun = async e => {
    e.preventDefault();
    try {
      await axios.post('/production/v2/execution-run/start', {
        WO_ID: startWO
      });
      setIsStartModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error starting run');
    }
  };
  const handleCompleteRun = async runId => {
    try {
      await axios.put(`/production/v2/execution-run/${runId}/complete`);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error completing run');
    }
  };
  const handleOpStatus = async (opId, status) => {
    try {
      await axios.put(`/production/v2/execution-run/operation/${opId}`, {
        Operation_Status: status
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating operation');
    }
  };
  const submitAction = async e => {
    e.preventDefault();
    try {
      if (actionType === 'labor') {
        await axios.post(`/production/v2/execution-run/operation/${activeOp._id}/labor`, formData);
      } else if (actionType === 'machine') {
        await axios.post(`/production/v2/execution-run/operation/${activeOp._id}/machine`, formData);
      } else if (actionType === 'quality') {
        await axios.post(`/production/v2/execution-run/operation/${activeOp._id}/quality`, formData);
      }
      setIsActionModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error logging action');
    }
  };
  const getStatusBadge = status => {
    const colors = {
      'Not Started': {
        bg: 'var(--text-secondary)',
        text: 'var(--text-muted)'
      },
      'Running': {
        bg: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        text: 'var(--accent-primary)'
      },
      'Paused': {
        bg: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
        text: 'var(--accent-warning)'
      },
      'Completed': {
        bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
        text: 'var(--accent-success)'
      },
      'Aborted': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      }
    };
    const c = colors[status] || colors['Not Started'];
    return <span style={{
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      backgroundColor: c.bg,
      color: c.text
    }}>{status}</span>;
  };
  const runColumns = [{
    header: 'Run no.',
    accessor: 'Run_Number'
  }, {
    header: 'Work order no.',
    render: r => <strong style={{
      color: 'var(--text-primary)'
    }}>{r.WO_ID?.WO_Number}</strong>
  }, {
    header: 'Status',
    render: r => getStatusBadge(r.Run_Status)
  }, {
    header: 'Started at',
    render: r => r.Run_Start_Time ? new Date(r.Run_Start_Time).toLocaleString() : '-'
  }, {
    header: 'Actions',
    render: r => <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        <button className="btn btn-secondary" style={{
        padding: '4px 12px',
        fontSize: '11px'
      }} onClick={() => {
        setActiveRun(r);
        setIsOpsModalOpen(true);
      }}>
          View Steps
        </button>
        {r.Run_Status === 'Running' && <button className="btn btn-primary" style={{
        padding: '4px 12px',
        fontSize: '11px'
      }} disabled={busy} onClick={() => runBusy(() => handleCompleteRun(r._id), 'run-' + r._id)}>
            {busyId === 'run-' + r._id ? 'Finishing…' : 'Finish Run'}
          </button>}
      </div>
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
        }}>Run Production</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Start, pause and finish a job on the machine, and record who ran it. Used by press operators and the supervisor.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsStartModalOpen(true)}>
          <Play size={14} /> Start Production Run
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
          <DataTable columns={runColumns} data={runs} isLoading={loading} emptyTitle="No production runs yet" emptyMessage="A run is one job started on a machine. Press “Start Production Run” above and pick a released work order." />
        </div>
      </div>

      {/* Start Run Modal */}
      <Modal isOpen={isStartModalOpen} onClose={() => setIsStartModalOpen(false)} title="Start a production run">
        <form onSubmit={e => runBusy(() => handleStartRun(e))}>
          <div className="input-group">
            <label className="input-label">Work order (must be released, with material allocated)</label>
            <select className="input-field" value={startWO} onChange={e => setStartWO(e.target.value)} required>
              <option value="" disabled>Choose a work order</option>
              {workOrders.map(wo => <option key={wo._id} value={wo._id}>{wo.WO_Number} - {wo.Status}</option>)}
            </select>
        {workOrders.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 11,
            marginTop: 4,
            lineHeight: 1.4
          }}>No work orders ready yet — release one under Production → Work Orders.</p>}
          </div>
          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsStartModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Starting…' : 'Start Production Run'}</button>
          </div>
        </form>
      </Modal>

      {/* Operations Modal */}
      {isOpsModalOpen && activeRun && <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
          <div style={{
        backgroundColor: 'var(--bg-primary)',
        width: '90%',
        maxWidth: '1000px',
        height: '80%',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
            <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
              <h2 style={{
            fontSize: '16px',
            fontWeight: 600
          }}>Execution Run: {activeRun.Run_Number} ({activeRun.WO_ID?.WO_Number})</h2>
              <button onClick={() => setIsOpsModalOpen(false)} style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '20px'
          }}>&times;</button>
            </div>
            <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)'
        }}>
              {activeRun.operations?.map((op, idx) => <div key={idx} style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            marginBottom: '16px',
            padding: '16px'
          }}>
                  <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
                    <div>
                      <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600
                }}>Operation Seq {op.Operation_Sequence}</h3>
                      <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px'
                }}>
                        Target: {op.Target_Quantity} | Good: {op.Completed_Good_Quantity} | Scrap: {op.Scrapped_Quantity}
                      </div>
                    </div>
                    <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                      {getStatusBadge(op.Operation_Status)}
                      {op.Operation_Status === 'Pending' && <button className="btn btn-secondary" style={{
                  padding: '4px 12px',
                  fontSize: '11px'
                }} disabled={busy} onClick={() => runBusy(() => handleOpStatus(op._id, 'Active'), 'op-' + op._id)}>{busyId === 'op-' + op._id ? 'Starting…' : 'Start Step'}</button>}
                      {op.Operation_Status === 'Active' && <button className="btn btn-primary" style={{
                  padding: '4px 12px',
                  fontSize: '11px'
                }} disabled={busy} onClick={() => runBusy(() => handleOpStatus(op._id, 'Completed'), 'op-' + op._id)}>{busyId === 'op-' + op._id ? 'Finishing…' : 'Finish Step'}</button>}
                    </div>
                  </div>
                  
                  {op.Operation_Status !== 'Pending' && <div style={{
              display: 'flex',
              gap: '8px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '12px'
            }}>
                      <button className="btn btn-secondary" style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                display: 'flex',
                justifyContent: 'center',
                gap: '4px'
              }} onClick={() => {
                setActiveOp(op);
                setActionType('labor');
                setFormData({});
                setIsActionModalOpen(true);
              }}>
                        <Users size={14} /> Record Labour
                      </button>
                      <button className="btn btn-secondary" style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                display: 'flex',
                justifyContent: 'center',
                gap: '4px'
              }} onClick={() => {
                setActiveOp(op);
                setActionType('machine');
                setFormData({});
                setIsActionModalOpen(true);
              }}>
                        <Settings2 size={14} /> Record Machine Hours
                      </button>
                      <button className="btn btn-secondary" style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                display: 'flex',
                justifyContent: 'center',
                gap: '4px',
                color: 'var(--accent-danger)',
                borderColor: 'var(--accent-danger)'
              }} onClick={() => {
                setActiveOp(op);
                setActionType('quality');
                setFormData({});
                setIsActionModalOpen(true);
              }}>
                        <ShieldAlert size={14} /> Record Rejections
                      </button>
                    </div>}

                  <div style={{
              marginTop: '12px',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}>
                    {op.labor?.length} Labor logs | {op.machine?.length} Machine logs | {op.quality?.length} Scrap logs
                  </div>
                </div>)}
            </div>
          </div>
        </div>}

      {/* Action Modals */}
      <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} title={`Record ${actionType === 'labor' ? 'labour hours' : actionType === 'machine' ? 'machine hours' : 'rejections'}`}>
        <form onSubmit={e => runBusy(() => submitAction(e))}>
          {actionType === 'labor' && <>
              <div className="input-group">
                <label className="input-label">What are you recording</label>
                <select className="input-field" value={formData.Activity_Type || ''} onChange={e => setFormData({
              ...formData,
              Activity_Type: e.target.value
            })} required>
                  <option value="" disabled>Choose one</option>
                  <option value="Setup">Setup</option>
                  <option value="Run">Run</option>
                  <option value="Teardown">Teardown</option>
                  <option value="Rework">Rework</option>
                  <option value="Idle">Idle</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Start Time</label>
                <input type="datetime-local" className="input-field" required value={formData.Start_Time || ''} onChange={e => setFormData({
              ...formData,
              Start_Time: e.target.value
            })} />
              </div>
              <div className="input-group">
                <label className="input-label">End Time</label>
                <input type="datetime-local" className="input-field" required value={formData.End_Time || ''} onChange={e => setFormData({
              ...formData,
              End_Time: e.target.value
            })} />
              </div>
            </>}

          {actionType === 'machine' && <>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select className="input-field" value={formData.Status || ''} onChange={e => setFormData({
              ...formData,
              Status: e.target.value
            })} required>
                  <option value="" disabled>Choose one</option>
                  <option value="Running">Running</option>
                  <option value="Setup">Setup</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Breakdown">Breakdown</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Start Time</label>
                <input type="datetime-local" className="input-field" required value={formData.Start_Time || ''} onChange={e => setFormData({
              ...formData,
              Start_Time: e.target.value
            })} />
              </div>
              <div className="input-group">
                <label className="input-label">End Time</label>
                <input type="datetime-local" className="input-field" required value={formData.End_Time || ''} onChange={e => setFormData({
              ...formData,
              End_Time: e.target.value
            })} />
              </div>
            </>}

          {actionType === 'quality' && <>
              <div className="input-group">
                <label className="input-label">Quantity rejected</label>
                <input type="number" step="1" className="input-field" required value={formData.Rejected_Quantity || ''} onChange={e => setFormData({
              ...formData,
              Rejected_Quantity: Number(e.target.value)
            })} />
              </div>
              <div className="input-group">
                <label className="input-label">Action Taken</label>
                <select className="input-field" value={formData.Action_Taken || ''} onChange={e => setFormData({
              ...formData,
              Action_Taken: e.target.value
            })} required>
                  <option value="" disabled>Choose one</option>
                  <option value="Scrapped">Scrapped</option>
                  <option value="Sent to Rework">Sent to Rework</option>
                  <option value="Accepted on Concession">Accepted on Concession</option>
                </select>
              </div>
            </>}

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsActionModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Shop Floor Log'}</button>
          </div>
        </form>
      </Modal>
    </div>;
};
export default ProductionExecution;