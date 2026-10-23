import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, FileSearch, ShieldPlus, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';

const NonConformanceManagement = () => {
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

  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isRcaModalOpen, setIsRcaModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedNcr, setSelectedNcr] = useState(null);

  const [logForm, setLogForm] = useState({ Source_Inspection_Ref: '', Defect_Description: '' });
  const [rcaForm, setRcaForm] = useState({ RCA_Findings: '', Analysis_Method: '5 Whys' });
  const [taskForm, setTaskForm] = useState({ Task_Type: 'CA', Action_Description: '', Task_Status: 'Completed' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/quality/v2/capa');
      setNcrs(res.data.data);
    } catch (err) { console.error('CAPA fetch error', err); }
    setLoading(false);
  };

  const handleCreateNCR = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/quality/v2/capa', logForm);
      setIsLogModalOpen(false);
      setLogForm({ Source_Inspection_Ref: '', Defect_Description: '' });
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error logging NCR'); }
  };

  const handleSaveRCA = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/quality/v2/capa/${selectedNcr._id}/rca`, rcaForm);
      setIsRcaModalOpen(false);
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error saving RCA findings'); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/quality/v2/capa/${selectedNcr._id}/task`, taskForm);
      setIsTaskModalOpen(false);
      setTaskForm({ Task_Type: 'CA', Action_Description: '', Task_Status: 'Completed' });
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error adding CAPA task'); }
  };

  const handleCloseNCR = async (id) => {
    try {
      await axios.put(`/quality/v2/capa/${id}/close`);
      fetchData();
      notify.info('Quality problem closed and locked.');
    } catch (err) { notify.error(err.response?.data?.message || 'Error closing NCR'); }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Closed': { bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)', text: 'var(--accent-success)' },
      'Completed': { bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)', text: 'var(--accent-success)' },
      'In Progress': { bg: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', text: 'var(--accent-primary)' },
      'Under Investigation': { bg: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)', text: 'var(--accent-warning)' },
      'Pending Actions': { bg: 'color-mix(in srgb, var(--accent-purple) 8%, transparent)', text: 'var(--accent-purple)' },
      'Pending': { bg: 'color-mix(in srgb, var(--text-muted) 8%, transparent)', text: 'var(--text-muted)' },
      'Open': { bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)', text: 'var(--accent-danger)' }
    };
    const c = colors[status] || colors['Pending'];
    return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, backgroundColor: c.bg, color: c.text }}>{status}</span>;
  };

  const actionRenderer = (row) => {
    const isClosed = row.NCR_Status === 'Closed';

    if (isClosed) {
      return (
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Lock size={12} /> Closed
        </span>
      );
    }

    const hasRCA = row.rca && row.rca.RCA_Findings;
    const canClose = row.CA_Overall_Status === 'Completed' && row.PA_Overall_Status === 'Completed';

    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => {
          setSelectedNcr(row);
          setRcaForm({ RCA_Findings: row.rca?.RCA_Findings || '', Analysis_Method: row.rca?.Analysis_Method || '5 Whys' });
          setIsRcaModalOpen(true);
        }} className="btn-icon" style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FileSearch size={12} /> {hasRCA ? 'Edit root cause' : 'Find root cause'}
        </button>

        <button onClick={() => {
          setSelectedNcr(row);
          setTaskForm({ Task_Type: 'CA', Action_Description: '', Task_Status: 'Completed' });
          setIsTaskModalOpen(true);
        }} className="btn-icon" style={{ fontSize: '11px', color: hasRCA ? 'var(--accent-primary)' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: hasRCA ? 1 : 0.6 }}>
          <ShieldPlus size={12} /> Add Fix Task
        </button>

        {canClose && (
          <button disabled={busy} onClick={() => runBusy(() => handleCloseNCR(row._id), row._id)} className="btn-icon" style={{ fontSize: '11px', color: 'var(--accent-success)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <CheckCircle2 size={12} /> {busyId === row._id ? 'Closing…' : 'Close Problem'}
          </button>
        )}
      </div>
    );
  };

  const columns = [
    { header: 'Problem no.', render: (row) => <strong>{row.NCR_ID || row.ncrNumber}</strong> },
    { header: 'Found in check', render: (row) => row.Source_Inspection_Ref || '-' },
    { header: 'What went wrong', render: (row) => <span style={{ fontSize: '12px' }}>{row.Defect_Description || row.defectDescription}</span> },
    { header: 'Root cause found', render: (row) => <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{row.rca?.RCA_Findings || row.rootCauseFindings || 'Pending Analysis'}</span> },
    { header: 'Fix applied', render: (row) => getStatusBadge(row.CA_Overall_Status || row.correctiveActionStatus || 'Pending') },
    { header: 'Step to stop it repeating', render: (row) => getStatusBadge(row.PA_Overall_Status || row.preventiveActionStatus || 'Pending') },
    { header: 'Problem status', render: (row) => getStatusBadge(row.NCR_Status || row.status || 'Open') },
    { header: 'Recorded on', render: (row) => new Date(row.Date_Logged || row.dateRecorded || row.createdAt).toLocaleDateString() }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Quality Problems & Fixes</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Log a quality problem, find why it happened, and record the fix. Used by the quality inspector.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsLogModalOpen(true)}>
          <AlertCircle size={14} /> Add Quality Problem
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
          <DataTable columns={columns} data={ncrs} isLoading={loading} emptyTitle="No quality problems logged" emptyMessage="When something goes wrong, log it here with the root cause and the fix. Press “Add Quality Problem” above." customActions={actionRenderer} />
        </div>
      </div>

      {/* Log a quality problem */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log a new quality problem">
        <form onSubmit={e => runBusy(() => handleCreateNCR(e))}>
          <div className="input-group">
            <label className="input-label">Check where it was found (optional)</label>
            <input type="text" className="input-field" placeholder="e.g. QI-849201 or WO-1002" value={logForm.Source_Inspection_Ref} onChange={e => setLogForm({ ...logForm, Source_Inspection_Ref: e.target.value })} />
          </div>

          <div className="input-group">
            <label className="input-label">What went wrong</label>
            <textarea className="input-field" rows="3" required placeholder="Describe observed non-conformance..." value={logForm.Defect_Description} onChange={e => setLogForm({ ...logForm, Defect_Description: e.target.value })}></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsLogModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create Quality Problem'}</button>
          </div>
        </form>
      </Modal>

      {/* Root cause */}
      {selectedNcr && (
        <Modal isOpen={isRcaModalOpen} onClose={() => setIsRcaModalOpen(false)} title={`Why it happened: ${selectedNcr.NCR_ID || selectedNcr.ncrNumber}`}>
          <form onSubmit={e => runBusy(() => handleSaveRCA(e))}>
            <div className="input-group">
              <label className="input-label">Method used to find the cause</label>
              <select className="input-field" required value={rcaForm.Analysis_Method} onChange={e => setRcaForm({ ...rcaForm, Analysis_Method: e.target.value })}>
                <option value="5 Whys">5 Whys Analysis</option>
                <option value="Fishbone">Ishikawa / Fishbone Diagram</option>
                <option value="Fault Tree">Fault Tree Analysis</option>
                <option value="General">General Investigation</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Why it happened (root cause)</label>
              <textarea className="input-field" rows="4" required placeholder="Document the root cause findings derived from investigation..." value={rcaForm.RCA_Findings} onChange={e => setRcaForm({ ...rcaForm, RCA_Findings: e.target.value })}></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsRcaModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Root Cause'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Fix task */}
      {selectedNcr && (
        <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={`Add a fix task: ${selectedNcr.NCR_ID || selectedNcr.ncrNumber}`}>
          <form onSubmit={e => runBusy(() => handleAddTask(e))}>
            {(!selectedNcr.rca || !selectedNcr.rca.RCA_Findings) && (
              <div style={{ backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-danger) 19%, transparent)', padding: '12px', borderRadius: '6px', fontSize: '12px', color: 'var(--accent-danger)', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertTriangle size={16} /> Record the root cause first. Fix tasks can only be added after that.
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Type of action</label>
              <select className="input-field" required value={taskForm.Task_Type} onChange={e => setTaskForm({ ...taskForm, Task_Type: e.target.value })}>
                <option value="CA">Corrective Action (Immediate Fix)</option>
                <option value="PA">Preventive Action (Long-Term Prevention)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">What was done</label>
              <textarea className="input-field" rows="3" required placeholder="Specific action step to be taken..." value={taskForm.Action_Description} onChange={e => setTaskForm({ ...taskForm, Action_Description: e.target.value })}></textarea>
            </div>

            <div className="input-group">
              <label className="input-label">Status now</label>
              <select className="input-field" required value={taskForm.Task_Status} onChange={e => setTaskForm({ ...taskForm, Task_Status: e.target.value })}>
                <option value="Completed">Completed (Action Implemented)</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsTaskModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy || !selectedNcr.rca || !selectedNcr.rca.RCA_Findings}>{busy ? 'Saving…' : 'Save Fix Task'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default NonConformanceManagement;
