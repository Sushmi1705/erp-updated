import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRightCircle, CheckCircle, Database } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';

const MaterialAllocation = () => {
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

  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);
  
  const [formData, setFormData] = useState({ action: 'Reserve', quantity: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/production/v2/material-allocation');
      setWorkOrders(res.data.data);
    } catch (err) { console.error('WO fetch error', err); }
    setLoading(false);
  };

  const handleRelease = async (woId) => {
    try {
      await axios.put(`/production/v2/work-orders/${woId}/release`);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error releasing Work Order');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/production/v2/material-allocation/${selectedWO._id}/process`, {
        allocations: [{
          reqId: selectedReq._id,
          action: formData.action,
          quantity: parseFloat(formData.quantity)
        }]
      });
      setIsModalOpen(false);
      setSelectedWO(null);
      setSelectedReq(null);
      setFormData({ action: 'Reserve', quantity: '' });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error processing allocation');
    }
  };

  const openActionModal = (wo, req) => {
    setSelectedWO(wo);
    setSelectedReq(req);
    
    // Auto-calculate remaining quantity needed for the action
    let defaultAction = 'Reserve';
    let defaultQty = 0;
    
    const unreserved = req.Required_Quantity - req.Reserved_Quantity - req.Issued_Quantity - req.Consumed_Quantity;
    if (unreserved > 0) {
      defaultAction = 'Reserve';
      defaultQty = unreserved;
    } else if (req.Reserved_Quantity > 0) {
      defaultAction = 'Issue';
      defaultQty = req.Reserved_Quantity;
    } else if (req.Issued_Quantity > 0) {
      defaultAction = 'Consume';
      defaultQty = req.Issued_Quantity;
    }
    
    setFormData({ action: defaultAction, quantity: defaultQty });
    setIsModalOpen(true);
  };

  const getWOStatusBadge = (status) => {
    switch (status) {
      case 'Draft': return <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Draft</span>;
      case 'In Progress': return <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>In Progress</span>;
      default: return <span>{status}</span>;
    }
  };

  const columns = [
    { header: 'Work order no.', render: (row) => <strong style={{ color: 'var(--text-primary)' }}>{row.WO_Number}</strong> },
    { header: 'Work order status', render: (row) => getWOStatusBadge(row.Status) },
    { header: 'Material status', render: (row) => (
      <span style={{ 
        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, 
        backgroundColor: row.Material_Status === 'Consumed' ? 'rgba(16, 185, 129, 0.1)' : row.Material_Status === 'Allocated' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        color: row.Material_Status === 'Consumed' ? 'var(--accent-success)' : row.Material_Status === 'Allocated' ? 'var(--accent-primary)' : 'var(--accent-warning)'
      }}>
        {row.Material_Status}
      </span>
    )},
    { header: 'Parts needed (BOM)', render: (row) => {
      if (!row.requirements || row.requirements.length === 0) {
        return <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No requirements found.</span>;
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minWidth: '350px' }}>
          {row.requirements.map((req, idx) => (
            <div key={idx} style={{ padding: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '12px' }}>{req.Component_Material_ID?.name || 'Unknown Material'}</strong>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <span>Req: {req.Required_Quantity}</span>
                  <span style={{ color: req.Reserved_Quantity > 0 ? 'var(--accent-purple)' : '' }}>Res: {req.Reserved_Quantity}</span>
                  <span style={{ color: req.Issued_Quantity > 0 ? 'var(--accent-primary)' : '' }}>Iss: {req.Issued_Quantity}</span>
                  <span style={{ color: req.Consumed_Quantity > 0 ? 'var(--accent-success)' : '' }}>Con: {req.Consumed_Quantity}</span>
                </div>
              </div>
              {req.Consumed_Quantity < req.Required_Quantity && (
                <button onClick={() => openActionModal(row, req)} className="btn-icon" style={{ padding: '4px', background: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <ArrowRightCircle size={14} />
                </button>
              )}
              {req.Consumed_Quantity >= req.Required_Quantity && (
                <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={12} /> Fulfilled
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }}
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Allocate Material</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Reserve raw material for each work order, then issue it to the shop floor. Used by the store keeper.</p>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
          <DataTable 
            columns={[...columns, { 
              header: 'Actions', 
              render: (row) => row.Status === 'Draft' ? (
                <button 
                  onClick={() => runBusy(() => handleRelease(row._id), row._id)} 
                  disabled={busy}
                  className="btn btn-primary" 
                  style={{ padding: '4px 12px', fontSize: '11px' }}
                >
                  {busyId === row._id ? 'Releasing…' : 'Release Work Order'}
                </button>
              ) : null 
            }]} 
            data={workOrders} 
            isLoading={loading} 
            emptyTitle="No work orders to allocate"
            emptyMessage="Released work orders appear here so you can reserve and issue their material. Create one under Production → Work Orders."
          />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Move material">
        {selectedReq && (
          <form onSubmit={e => runBusy(() => handleSave(e))}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
              <strong>Component:</strong> {selectedReq.Component_Material_ID?.name}<br/>
              <strong>Required:</strong> {selectedReq.Required_Quantity}<br/>
              <strong>Currently Reserved:</strong> {selectedReq.Reserved_Quantity}<br/>
              <strong>Currently Issued:</strong> {selectedReq.Issued_Quantity}<br/>
              <strong>Currently Consumed:</strong> {selectedReq.Consumed_Quantity}
            </div>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label className="input-label">What to do *</label>
              <select className="input-field" value={formData.action} onChange={e => setFormData({...formData, action: e.target.value})}>
                <option value="Reserve">Reserve (Soft Allocation)</option>
                <option value="Issue">Issue (Hard Allocation)</option>
                <option value="Consume">Consume (Record Usage)</option>
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Quantity *</label>
              <input type="number" className="input-field" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>

            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '6px', fontSize: '12px', color: 'var(--accent-primary)', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
              <Database size={16} />
              Transactions are logged immutably in the Inventory Ledger.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : <span>{formData.action} Material</span>}</button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};

export default MaterialAllocation;
