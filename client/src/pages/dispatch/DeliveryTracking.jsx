import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Navigation, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { notify } from '../../utils/notify';

const DeliveryTracking = () => {
  const [trackings, setTrackings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tracking'); // tracking, confirmation
  // Saving goes to the server. Naming the work in the button stops the repeat
  // clicking that happens when a button looks unchanged for two seconds.
  const [busyAction, setBusyAction] = useState(null);

  const [selectedTracking, setSelectedTracking] = useState(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  const [milestoneForm, setMilestoneForm] = useState({ Tracking_Status: 'Departed', Current_Location: '', Remarks_Exceptions: '' });
  const [handoverForm, setHandoverForm] = useState({ Final_Status: 'Successfully Delivered', Delivered_Date: new Date().toISOString().split('T')[0], Received_By: '', Proof_Of_Delivery_Ref: '', Customer_Feedback_Notes: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/dispatch/v2/tracking');
      setTrackings(res.data.data);
    } catch (err) { console.error('Data fetch error', err); }
    setLoading(false);
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    setBusyAction('milestone');
    try {
      await axios.post(`/dispatch/v2/tracking/${selectedTracking._id}/milestone`, milestoneForm);
      setIsMilestoneModalOpen(false);
      setMilestoneForm({ Tracking_Status: 'Departed', Current_Location: '', Remarks_Exceptions: '' });
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error adding shipment milestone'); }
    setBusyAction(null);
  };

  const handleConfirmHandover = async (e) => {
    e.preventDefault();
    setBusyAction('handover');
    try {
      await axios.post(`/dispatch/v2/tracking/${selectedTracking._id}/handover`, handoverForm);
      setIsHandoverModalOpen(false);
      fetchData();
    } catch (err) { notify.error(err.response?.data?.message || 'Error confirming delivery handover'); }
    setBusyAction(null);
  };

  const actionRenderer = (row) => {
    if (activeTab === 'tracking') {
      const isClosed = row.confirmation?.Final_Status === 'Successfully Delivered';
      return (
        <button 
          onClick={() => {
            if (isClosed) return notify.error('This delivery is already marked Successfully Delivered, so no more checkpoints can be added.');
            setSelectedTracking(row);
            setIsMilestoneModalOpen(true);
          }} 
          className="btn-icon" 
          style={{ fontSize: '11px', color: isClosed ? 'var(--text-muted)' : 'var(--accent-text)', background: 'none', border: 'none', cursor: isClosed ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
        >
          <Navigation size={12} /> {isClosed ? 'Delivered — locked' : 'Add checkpoint'}
        </button>
      );
    } else {
      return (
        <button onClick={() => {
          setSelectedTracking(row);
          setHandoverForm({
            Final_Status: row.confirmation?.Final_Status || 'Successfully Delivered',
            Delivered_Date: row.confirmation?.Delivered_Date ? new Date(row.confirmation.Delivered_Date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            Received_By: row.confirmation?.Received_By || '',
            Proof_Of_Delivery_Ref: row.confirmation?.Proof_Of_Delivery_Ref || '',
            Customer_Feedback_Notes: row.confirmation?.Customer_Feedback_Notes || ''
          });
          setIsHandoverModalOpen(true);
        }} className="btn-icon" style={{ fontSize: '11px', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
          <CheckCircle2 size={12} /> Record who received it
        </button>
      );
    }
  };

  const trackingColumns = [
    { header: 'Tracking number', render: (row) => <strong>{row.Tracking_Number || row.Tracking_ID}</strong> },
    { header: 'Dispatch number', render: (row) => <strong>{row.Exec_ID?.Exec_Number || '-'}</strong> },
    { header: 'Sales order', render: (row) => (
      <div>
        <strong>{row.Exec_ID?.Plan_ID?.Sales_Order_ID?.orderNumber || 'SO-Ref'}</strong>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{row.Exec_ID?.Plan_ID?.Sales_Order_ID?.customerName || 'Customer'}</div>
      </div>
    )},
    { header: 'Last seen at', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '12px', fontWeight: 500 }}>{row.milestones && row.milestones.length > 0 ? row.milestones[0].Current_Location : 'Origin Plant Facility'}</span>
      </div>
    )},
    { header: 'Where it has reached', render: (row) => <StatusBadge value={row.milestones && row.milestones.length > 0 ? row.milestones[0].Tracking_Status : 'Departed'} /> },
    { header: 'Overall delivery status', render: (row) => <StatusBadge value={row.Overall_Delivery_Status} /> }
  ];

  const deliveryColumns = [
    { header: 'Tracking number', render: (row) => <strong>{row.Tracking_Number || row.Tracking_ID}</strong> },
    { header: 'Dispatch number', render: (row) => <strong>{row.Exec_ID?.Exec_Number || '-'}</strong> },
    { header: 'Received by', render: (row) => <strong>{row.confirmation?.Received_By || '-'}</strong> },
    { header: 'Proof of delivery (POD) reference', render: (row) => <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{row.confirmation?.Proof_Of_Delivery_Ref || '-'}</span> },
    { header: 'Delivered on', render: (row) => row.confirmation?.Delivered_Date ? new Date(row.confirmation.Delivered_Date).toLocaleDateString() : '-' },
    { header: 'Handover result', render: (row) => <StatusBadge value={row.confirmation?.Final_Status || 'Pending'} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Delivery Tracking</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>See where each dispatch has reached on the road, and record who received it at the customer end. Used by dispatch staff and accounts.</p>
        </div>
      </div>

      {/* Tabs matching screenshot design */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          role="tab" aria-selected={activeTab === 'tracking'} onClick={() => setActiveTab('tracking')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'tracking' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'tracking' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Navigation size={16} /> Where the goods have reached
        </button>
        <button 
          role="tab" aria-selected={activeTab === 'confirmation'} onClick={() => setActiveTab('confirmation')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'confirmation' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'confirmation' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <CheckCircle2 size={16} /> Who received the goods
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
          <DataTable
            columns={activeTab === 'tracking' ? trackingColumns : deliveryColumns}
            data={trackings}
            isLoading={loading}
            customActions={actionRenderer}
            emptyTitle="Nothing on the road yet"
            emptyMessage="A delivery appears here once a dispatch has been confirmed. Confirm one under Dispatch &amp; Delivery > Record Dispatch first."
          />
        </div>
      </div>

      {/* Modal 1: Add Shipment Milestone */}
      {selectedTracking && (
        <Modal isOpen={isMilestoneModalOpen} onClose={() => setIsMilestoneModalOpen(false)} title={`Add checkpoint: ${selectedTracking.Tracking_Number}`}>
          <form onSubmit={handleAddMilestone}>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
              <div>Dispatch number: <strong>{selectedTracking.Exec_ID?.Exec_Number}</strong></div>
              <div>Sales order: <strong>{selectedTracking.Exec_ID?.Plan_ID?.Sales_Order_ID?.orderNumber}</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">What has happened?</label>
              <select className="input-field" required value={milestoneForm.Tracking_Status} onChange={e => setMilestoneForm({ ...milestoneForm, Tracking_Status: e.target.value })}>
                <option value="Departed">Left our plant</option>
                <option value="Arrived at Hub">Reached the transport hub</option>
                <option value="Out for Delivery">Out for delivery to customer</option>
                <option value="Delayed">Delayed or held up</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Where is it right now? (place or hub name)</label>
              <input type="text" className="input-field" required placeholder="e.g. Krishnagiri toll, or Hosur hub" value={milestoneForm.Current_Location} onChange={e => setMilestoneForm({ ...milestoneForm, Current_Location: e.target.value })} />
            </div>

            <div className="input-group">
              <label className="input-label">Notes (optional)</label>
              <textarea className="input-field" rows="2" placeholder="e.g. held up by rain, or running on time" value={milestoneForm.Remarks_Exceptions} onChange={e => setMilestoneForm({ ...milestoneForm, Remarks_Exceptions: e.target.value })}></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsMilestoneModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busyAction === 'milestone'}>{busyAction === 'milestone' ? 'Saving checkpoint…' : 'Save checkpoint'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Delivery Confirmation Handover */}
      {selectedTracking && (
        <Modal isOpen={isHandoverModalOpen} onClose={() => setIsHandoverModalOpen(false)} title={`Record who received it: ${selectedTracking.Tracking_Number}`}>
          <form onSubmit={handleConfirmHandover}>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
              <div>Tracking number: <strong>{selectedTracking.Tracking_Number}</strong></div>
              <div>Sales order: <strong>{selectedTracking.Exec_ID?.Plan_ID?.Sales_Order_ID?.orderNumber}</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">How did the delivery end?</label>
              <select className="input-field" required value={handoverForm.Final_Status} onChange={e => setHandoverForm({ ...handoverForm, Final_Status: e.target.value })}>
                <option value="Pending">Not yet delivered</option>
                <option value="Partially Delivered">Partly delivered</option>
                <option value="Successfully Delivered">Delivered in full</option>
                <option value="Rejected">Customer refused the goods</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Who signed for it? (needed to mark delivered in full)</label>
                <input type="text" className="input-field" required={handoverForm.Final_Status === 'Successfully Delivered'} placeholder="e.g. store in-charge name" value={handoverForm.Received_By} onChange={e => setHandoverForm({ ...handoverForm, Received_By: e.target.value })} />
              </div>

              <div className="input-group">
                <label className="input-label">Date delivered</label>
                <input type="date" className="input-field" required value={handoverForm.Delivered_Date} onChange={e => setHandoverForm({ ...handoverForm, Delivered_Date: e.target.value })} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Proof of delivery (POD) reference — signed challan or receipt number (optional)</label>
              <input type="text" className="input-field" placeholder="e.g. POD-REF-9921" value={handoverForm.Proof_Of_Delivery_Ref} onChange={e => setHandoverForm({ ...handoverForm, Proof_Of_Delivery_Ref: e.target.value })} />
            </div>

            <div className="input-group">
              <label className="input-label">Customer remarks (optional)</label>
              <textarea className="input-field" rows="2" placeholder="e.g. goods accepted in good condition" value={handoverForm.Customer_Feedback_Notes} onChange={e => setHandoverForm({ ...handoverForm, Customer_Feedback_Notes: e.target.value })}></textarea>
            </div>

            <div style={{ backgroundColor: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-caption)', color: 'var(--status-info-fg)', marginTop: 'var(--space-3)' }}>
              Choosing <strong>Delivered in full</strong> stops any more checkpoints being added, and marks the sales order <strong>Completed</strong> so accounts can raise the invoice.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsHandoverModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busyAction === 'handover'}>{busyAction === 'handover' ? 'Saving…' : 'Save delivery record'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DeliveryTracking;
