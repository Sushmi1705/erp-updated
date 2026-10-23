import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { notify } from '../../utils/notify';

const DispatchExecution = () => {
  const [executions, setExecutions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('packing'); // packing, loading, confirmation
  // Saving talks to the server. Without a working label the user cannot tell a
  // slow save from a dead button, so they press it again.
  const [busyAction, setBusyAction] = useState(null);

  const [selectedExec, setSelectedExec] = useState(null);
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [packingForm, setPackingForm] = useState({ Packing_Status: 'In Progress', Total_Boxes: 45 });
  const [loadingForm, setLoadingForm] = useState({ Loading_Status: 'In Progress', Loading_Bay: 'FDSF' });
  const [confirmForm, setConfirmForm] = useState({ Dispatch_Status: 'Confirmed', Dispatched_Date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  const fetchDependencies = async () => {
    try {
      const planRes = await axios.get('/dispatch/v2/planning');
      if (planRes.data?.data) {
        setPlans(planRes.data.data);
      }
    } catch (err) { console.error('Dependencies fetch error', err); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/dispatch/v2/execution');
      setExecutions(res.data.data);
    } catch (err) { console.error('Data fetch error', err); }
    setLoading(false);
  };

  const handleUpdatePacking = async (e) => {
    e.preventDefault();
    setBusyAction('packing');
    try {
      await axios.post(`/dispatch/v2/execution/${selectedExec._id}/packing`, packingForm);
      setIsPackingModalOpen(false);
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error updating packing phase'); }
    setBusyAction(null);
  };

  const handleUpdateLoading = async (e) => {
    e.preventDefault();
    setBusyAction('loading');
    try {
      await axios.post(`/dispatch/v2/execution/${selectedExec._id}/loading`, loadingForm);
      setIsLoadingModalOpen(false);
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error updating loading phase'); }
    setBusyAction(null);
  };

  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    setBusyAction('confirm');
    try {
      await axios.post(`/dispatch/v2/execution/${selectedExec._id}/confirm`, confirmForm);
      setIsConfirmModalOpen(false);
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error confirming dispatch'); }
    setBusyAction(null);
  };

  const actionRenderer = (row) => {
    if (activeTab === 'packing') {
      return (
        <button onClick={() => {
          setSelectedExec(row);
          setPackingForm({
            Packing_Status: row.packing?.Packing_Status || 'In Progress',
            Total_Boxes: row.packing?.Total_Boxes || 45
          });
          setIsPackingModalOpen(true);
        }} className="btn-icon" style={{ fontSize: '11px', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
          <Package size={12} /> Record packing
        </button>
      );
    } else if (activeTab === 'loading') {
      return (
        <button onClick={() => {
          setSelectedExec(row);
          setLoadingForm({
            Loading_Status: row.loading?.Loading_Status || 'In Progress',
            Loading_Bay: row.loading?.Loading_Bay || 'FDSF'
          });
          setIsLoadingModalOpen(true);
        }} className="btn-icon" style={{ fontSize: '11px', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
          <Truck size={12} /> Record loading
        </button>
      );
    } else {
      return (
        <button onClick={() => {
          setSelectedExec(row);
          setConfirmForm({
            Dispatch_Status: row.confirmation?.Dispatch_Status || 'Confirmed',
            Dispatched_Date: row.confirmation?.Dispatched_Date ? new Date(row.confirmation.Dispatched_Date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          });
          setIsConfirmModalOpen(true);
        }} className="btn-icon" style={{ fontSize: '11px', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
          <CheckCircle2 size={12} /> Confirm dispatch
        </button>
      );
    }
  };

  const packingColumns = [
    { header: 'Dispatch number', render: (row) => <strong>{row.Exec_Number || row.Exec_ID}</strong> },
    { header: 'Delivery plan', render: (row) => <strong>{row.Plan_ID?.Plan_Number || 'DP-545516'}</strong> },
    { header: 'Sales order', render: (row) => <span>{row.Plan_ID?.Sales_Order_ID?.orderNumber || 'SO-Q32OS6'}</span> },
    { header: 'Boxes packed', align: 'right', render: (row) => <strong>{row.packing?.Total_Boxes || 0}</strong> },
    { header: 'Packing done?', render: (row) => <StatusBadge value={row.packing?.Packing_Status || 'Pending'} /> },
    { header: 'Overall status', render: (row) => <StatusBadge value={row.Overall_Status} /> }
  ];

  const loadingColumns = [
    { header: 'Dispatch number', render: (row) => <strong>{row.Exec_Number || row.Exec_ID}</strong> },
    { header: 'Delivery plan', render: (row) => <strong>{row.Plan_ID?.Plan_Number || 'DP-545516'}</strong> },
    { header: 'Loading bay', render: (row) => <strong>{row.loading?.Loading_Bay || '-'}</strong> },
    { header: 'Loading done?', render: (row) => <StatusBadge value={row.loading?.Loading_Status || 'Pending'} /> },
    { header: 'Packing done?', render: (row) => <StatusBadge value={row.packing?.Packing_Status || 'Pending'} /> },
    { header: 'Overall status', render: (row) => <StatusBadge value={row.Overall_Status} /> }
  ];

  const confirmationColumns = [
    { header: 'Dispatch number', render: (row) => <strong>{row.Exec_Number || row.Exec_ID}</strong> },
    { header: 'Delivery plan', render: (row) => <strong>{row.Plan_ID?.Plan_Number || 'DP-545516'}</strong> },
    { header: 'Sent out on', render: (row) => row.confirmation?.Dispatched_Date ? new Date(row.confirmation.Dispatched_Date).toLocaleDateString() : '-' },
    { header: 'Dispatch confirmed?', render: (row) => <StatusBadge value={row.confirmation?.Dispatch_Status || 'Pending'} /> },
    { header: 'Overall status', render: (row) => <StatusBadge value={row.Overall_Status} /> }
  ];

  const getActiveColumns = () => {
    if (activeTab === 'loading') return loadingColumns;
    if (activeTab === 'confirmation') return confirmationColumns;
    return packingColumns;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Record Dispatch</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Record each delivery going out in three steps — pack the boxes, load the vehicle, then confirm it has left. Used by dispatch staff and the store keeper.</p>
        </div>
      </div>

      {/* Tabs matching screenshot design */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          role="tab" aria-selected={activeTab === 'packing'} onClick={() => setActiveTab('packing')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'packing' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'packing' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Package size={16} /> Step 1: Pack the goods
        </button>
        <button 
          role="tab" aria-selected={activeTab === 'loading'} onClick={() => setActiveTab('loading')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'loading' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'loading' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Truck size={16} /> Step 2: Load the vehicle
        </button>
        <button 
          role="tab" aria-selected={activeTab === 'confirmation'} onClick={() => setActiveTab('confirmation')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'confirmation' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'confirmation' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <CheckCircle2 size={16} /> Step 3: Confirm it has left
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
          <DataTable
            columns={getActiveColumns()}
            data={executions}
            isLoading={loading}
            customActions={actionRenderer}
            emptyTitle="Nothing to dispatch yet"
            emptyMessage="A dispatch appears here once a delivery plan has been made. Create the plan under Dispatch &amp; Delivery > Dispatch Plan first."
          />
        </div>
      </div>

      {/* Modal 1: Packing Management Phase 1 */}
      {selectedExec && (
        <Modal isOpen={isPackingModalOpen} onClose={() => setIsPackingModalOpen(false)} title={`Step 1: Pack the goods — ${selectedExec.Exec_Number}`}>
          <form onSubmit={handleUpdatePacking}>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
              <div>Delivery plan: <strong>{selectedExec.Plan_ID?.Plan_Number || '-'}</strong></div>
              <div>Overall status: <strong>{selectedExec.Overall_Status}</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">Packing done?</label>
              <select className="input-field" required value={packingForm.Packing_Status} onChange={e => setPackingForm({ ...packingForm, Packing_Status: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">How many boxes packed? (must be at least 1 to mark completed)</label>
              <input type="number" className="input-field" required min="1" placeholder="e.g. 45" value={packingForm.Total_Boxes} onChange={e => setPackingForm({ ...packingForm, Total_Boxes: e.target.value })} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsPackingModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busyAction === 'packing'}>{busyAction === 'packing' ? 'Saving…' : 'Save packing'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Loading Management Phase 2 */}
      {selectedExec && (
        <Modal isOpen={isLoadingModalOpen} onClose={() => setIsLoadingModalOpen(false)} title={`Step 2: Load the vehicle — ${selectedExec.Exec_Number}`}>
          <form onSubmit={handleUpdateLoading}>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
              <div>Step 1 packing: <strong>{selectedExec.packing?.Packing_Status || 'Pending'}</strong> ({selectedExec.packing?.Total_Boxes || 0} boxes)</div>
            </div>

            <div className="input-group">
              <label className="input-label">Loading done? (packing must be completed first)</label>
              <select className="input-field" required value={loadingForm.Loading_Status} onChange={e => setLoadingForm({ ...loadingForm, Loading_Status: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Which loading bay?</label>
              <input type="text" className="input-field" required placeholder="e.g. Bay-01" value={loadingForm.Loading_Bay} onChange={e => setLoadingForm({ ...loadingForm, Loading_Bay: e.target.value })} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsLoadingModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busyAction === 'loading'}>{busyAction === 'loading' ? 'Saving…' : 'Save loading'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 3: Dispatch Confirmation Phase 3 */}
      {selectedExec && (
        <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title={`Step 3: Confirm it has left — ${selectedExec.Exec_Number}`}>
          <form onSubmit={handleConfirmDispatch}>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
              <div>Step 2 loading: <strong>{selectedExec.loading?.Loading_Status || 'Pending'}</strong> (bay {selectedExec.loading?.Loading_Bay || 'not set'})</div>
              <div>Planned dispatch date: <strong>{selectedExec.Plan_ID?.Planned_Date ? new Date(selectedExec.Plan_ID.Planned_Date).toLocaleDateString() : '-'}</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">Has it left the plant?</label>
              <select className="input-field" required value={confirmForm.Dispatch_Status} onChange={e => setConfirmForm({ ...confirmForm, Dispatch_Status: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Date it left</label>
              <input type="date" className="input-field" required value={confirmForm.Dispatched_Date} onChange={e => setConfirmForm({ ...confirmForm, Dispatched_Date: e.target.value })} />
            </div>

            <div style={{ backgroundColor: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-caption)', color: 'var(--status-info-fg)', marginTop: 'var(--space-3)' }}>
              Confirming this sets the dispatch to <strong>Dispatched</strong> on every step of this screen.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsConfirmModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busyAction === 'confirm'}>{busyAction === 'confirm' ? 'Confirming…' : 'Confirm dispatch'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DispatchExecution;
