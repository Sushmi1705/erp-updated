import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Truck, UserCheck } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
const DispatchPlanning = () => {
  const [plans, setPlans] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('planning'); // planning, scheduling, vehicle
  // A slow save used to leave every button looking untouched, so the store
  // keeper pressed it again and again. Each action now names itself while it runs.
  const [busyAction, setBusyAction] = useState(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSchedModalOpen, setIsSchedModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    Sales_Order_ID: '',
    Planned_Date: new Date().toISOString().split('T')[0]
  });
  const [schedForm, setSchedForm] = useState({
    Scheduled_Date: new Date().toISOString().split('T')[0],
    Carrier_ID: 'das',
    Shipping_Method: 'Road',
    Estimated_Arrival_Date: ''
  });
  const [assignForm, setAssignForm] = useState({
    Vehicle_ID: 'TN-69-HY-6574',
    Driver_ID: 'saS'
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const soRes = await axios.get('/sales/order');
      if (soRes.data?.data) {
        setSalesOrders(soRes.data.data.filter(so => so.status !== 'Cancelled' && so.status !== 'Hold'));
      }
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/dispatch/v2/planning');
      setPlans(res.data.data);
    } catch (err) {
      console.error('Data fetch error', err);
    }
    setLoading(false);
  };
  const handleCreatePlan = async e => {
    e.preventDefault();
    setBusyAction('plan');
    try {
      await axios.post('/dispatch/v2/planning', planForm);
      setIsPlanModalOpen(false);
      setPlanForm({
        Sales_Order_ID: '',
        Planned_Date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error creating delivery plan');
    }
    setBusyAction(null);
  };
  const handleScheduleShipment = async e => {
    e.preventDefault();
    setBusyAction('schedule');
    try {
      await axios.post(`/dispatch/v2/planning/${selectedPlan._id}/schedule`, schedForm);
      setIsSchedModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error scheduling shipment');
    }
    setBusyAction(null);
  };
  const handleAssignVehicle = async e => {
    e.preventDefault();
    setBusyAction('assign');
    try {
      await axios.post(`/dispatch/v2/planning/${selectedPlan._id}/assign`, assignForm);
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error assigning vehicle');
    }
    setBusyAction(null);
  };
  const actionRenderer = row => {
    if (activeTab === 'planning') {
      return <button onClick={() => {
        setSelectedPlan(row);
        setSchedForm({
          Scheduled_Date: row.schedule?.Scheduled_Date ? new Date(row.schedule.Scheduled_Date).toISOString().split('T')[0] : new Date(row.Planned_Date).toISOString().split('T')[0],
          Carrier_ID: row.schedule?.Carrier_ID || 'das',
          Shipping_Method: row.schedule?.Shipping_Method || 'Road',
          Estimated_Arrival_Date: row.schedule?.Estimated_Arrival_Date ? new Date(row.schedule.Estimated_Arrival_Date).toISOString().split('T')[0] : ''
        });
        setIsSchedModalOpen(true);
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
          <Truck size={12} /> Book transport
        </button>;
    } else if (activeTab === 'scheduling') {
      return <button onClick={() => {
        setSelectedPlan(row);
        setAssignForm({
          Vehicle_ID: row.assignment?.Vehicle_ID || 'TN-69-HY-6574',
          Driver_ID: row.assignment?.Driver_ID || 'saS'
        });
        setIsAssignModalOpen(true);
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
          <UserCheck size={12} /> Assign vehicle and driver
        </button>;
    } else {
      return <span style={{
        fontSize: '11px',
        color: row.assignment ? 'var(--accent-success)' : 'var(--text-secondary)',
        fontWeight: 600
      }}>
          {row.assignment ? `Vehicle ${row.assignment.Vehicle_ID} assigned` : 'No vehicle assigned yet'}
        </span>;
    }
  };
  const planningColumns = [{
    header: 'Plan number',
    render: row => <strong>{row.Plan_Number || row.Plan_ID}</strong>
  }, {
    header: 'Sales order',
    render: row => <div>
        <strong>{row.Sales_Order_ID?.orderNumber || 'SO-Ref'}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>{row.Sales_Order_ID?.customerName || 'Customer'}</div>
      </div>
  }, {
    header: 'Planned dispatch date',
    render: row => new Date(row.Planned_Date).toLocaleDateString()
  }, {
    header: 'Status',
    render: row => <StatusBadge value={row.Status} />
  }];
  const schedulingColumns = [{
    header: 'Plan number',
    render: row => <strong>{row.Plan_Number || row.Plan_ID}</strong>
  }, {
    header: 'Scheduled ship date',
    render: row => row.schedule?.Scheduled_Date ? new Date(row.schedule.Scheduled_Date).toLocaleDateString() : '-'
  }, {
    header: 'Transport company',
    render: row => <strong>{row.schedule?.Carrier_ID || '-'}</strong>
  }, {
    header: 'How it travels',
    render: row => <span style={{
      fontSize: '12px'
    }}>{row.schedule?.Shipping_Method || '-'}</span>
  }, {
    header: 'Expected arrival',
    render: row => row.schedule?.Estimated_Arrival_Date ? new Date(row.schedule.Estimated_Arrival_Date).toLocaleDateString() : '-'
  }, {
    header: 'Status',
    render: row => <StatusBadge value={row.Status} />
  }];
  const vehicleColumns = [{
    header: 'Plan number',
    render: row => <strong>{row.Plan_Number || row.Plan_ID}</strong>
  }, {
    header: 'Vehicle number',
    render: row => <strong>{row.assignment?.Vehicle_ID || '-'}</strong>
  }, {
    header: 'Driver name',
    render: row => <span>{row.assignment?.Driver_ID || '-'}</span>
  }, {
    header: 'Assigned on',
    render: row => row.assignment?.Assignment_Date ? new Date(row.assignment.Assignment_Date).toLocaleDateString() : '-'
  }, {
    header: 'Sent out yet?',
    render: row => <StatusBadge value={row.assignment?.Dispatch_Status || 'Pending'} />
  }, {
    header: 'Overall status',
    render: row => <StatusBadge value={row.Status} />
  }];
  const getActiveColumns = () => {
    if (activeTab === 'scheduling') return schedulingColumns;
    if (activeTab === 'vehicle') return vehicleColumns;
    return planningColumns;
  };
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
        }}>Dispatch Plan</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Plan what goes out and when, book the transport company, then put a vehicle and driver against it. Used by dispatch staff and the plant manager.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsPlanModalOpen(true)}>
          <Calendar size={14} /> Create delivery plan
        </button>
      </div>

      {/* Tabs matching screenshot design */}
      <div style={{
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
      borderBottom: '1px solid var(--border-color)'
    }}>
        <button role="tab" aria-selected={activeTab === 'planning'} onClick={() => setActiveTab('planning')} style={{
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        borderBottom: activeTab === 'planning' ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === 'planning' ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <Calendar size={16} /> 1. Plan the delivery
        </button>
        <button role="tab" aria-selected={activeTab === 'scheduling'} onClick={() => setActiveTab('scheduling')} style={{
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        borderBottom: activeTab === 'scheduling' ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === 'scheduling' ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <Truck size={16} /> 2. Book the transport
        </button>
        <button role="tab" aria-selected={activeTab === 'vehicle'} onClick={() => setActiveTab('vehicle')} style={{
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        borderBottom: activeTab === 'vehicle' ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === 'vehicle' ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <UserCheck size={16} /> 3. Assign vehicle and driver
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
          <DataTable
            columns={getActiveColumns()}
            data={plans}
            isLoading={loading}
            customActions={actionRenderer}
            emptyTitle="No delivery plans yet"
            emptyMessage="A delivery plan says which confirmed sales order goes out on which day. Use Create delivery plan to make the first one."
            emptyAction={<button className="btn btn-primary" onClick={() => setIsPlanModalOpen(true)}>Create delivery plan</button>}
          />
        </div>
      </div>

      {/* Modal 1: Create Delivery Plan */}
      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="Create delivery plan">
        <form onSubmit={handleCreatePlan}>
          <div className="input-group">
            <label className="input-label">Which sales order is this delivery for?</label>
            <select className="input-field" required value={planForm.Sales_Order_ID} onChange={e => setPlanForm({
            ...planForm,
            Sales_Order_ID: e.target.value
          })}>
              <option value="" disabled>Select a sales order</option>
              {salesOrders.map(so => <option key={so._id} value={so._id}>{so.orderNumber} - {so.customerName} ({fmtMoneyFull(so.totalAmount || 0)})</option>)}
            </select>
        {salesOrders.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 'var(--font-caption)',
            marginTop: 'var(--space-2)'
          }}>No confirmed sales orders yet — add one under Sales &gt; Sales Orders, then come back here.</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Planned dispatch date</label>
            <input type="date" className="input-field" required value={planForm.Planned_Date} onChange={e => setPlanForm({
            ...planForm,
            Planned_Date: e.target.value
          })} />
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPlanModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busyAction === 'plan'}>{busyAction === 'plan' ? 'Creating plan…' : 'Create delivery plan'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Schedule Shipment Logistics */}
      {selectedPlan && <Modal isOpen={isSchedModalOpen} onClose={() => setIsSchedModalOpen(false)} title={`Book transport: ${selectedPlan.Plan_Number}`}>
          <form onSubmit={handleScheduleShipment}>
            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              <div>Planned Dispatch Date: <strong>{new Date(selectedPlan.Planned_Date).toLocaleDateString()}</strong></div>
              <div>Sales Order: <strong>{selectedPlan.Sales_Order_ID?.orderNumber}</strong></div>
            </div>

            <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
              <div className="input-group">
                <label className="input-label">Scheduled ship date</label>
                <input type="date" className="input-field" required value={schedForm.Scheduled_Date} onChange={e => setSchedForm({
              ...schedForm,
              Scheduled_Date: e.target.value
            })} />
              </div>

              <div className="input-group">
                <label className="input-label">Transport company</label>
                <input type="text" className="input-field" required placeholder="e.g. das or BlueDart Logistics" value={schedForm.Carrier_ID} onChange={e => setSchedForm({
              ...schedForm,
              Carrier_ID: e.target.value
            })} />
              </div>
            </div>

            <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
              <div className="input-group">
                <label className="input-label">How it travels</label>
                <select className="input-field" required value={schedForm.Shipping_Method} onChange={e => setSchedForm({
              ...schedForm,
              Shipping_Method: e.target.value
            })}>
                  <option value="Road">Road Freight</option>
                  <option value="Rail">Rail Express</option>
                  <option value="Air">Air Cargo</option>
                  <option value="Sea">Sea Freight</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Expected arrival date (optional)</label>
                <input type="date" className="input-field" value={schedForm.Estimated_Arrival_Date} onChange={e => setSchedForm({
              ...schedForm,
              Estimated_Arrival_Date: e.target.value
            })} />
              </div>
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsSchedModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busyAction === 'schedule'}>{busyAction === 'schedule' ? 'Saving booking…' : 'Save transport booking'}</button>
            </div>
          </form>
        </Modal>}

      {/* Modal 3: Assign Vehicle & Driver Resource */}
      {selectedPlan && <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assign vehicle and driver: ${selectedPlan.Plan_Number}`}>
          <form onSubmit={handleAssignVehicle}>
            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              <div>Scheduled Carrier: <strong>{selectedPlan.schedule?.Carrier_ID || 'Carrier Scheduled'}</strong></div>
              <div>Scheduled Date: <strong>{selectedPlan.schedule?.Scheduled_Date ? new Date(selectedPlan.schedule.Scheduled_Date).toLocaleDateString() : '-'}</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">Vehicle number (as on the number plate)</label>
              <input type="text" className="input-field" required placeholder="e.g. TN-69-HY-6574" value={assignForm.Vehicle_ID} onChange={e => setAssignForm({
            ...assignForm,
            Vehicle_ID: e.target.value
          })} />
            </div>

            <div className="input-group">
              <label className="input-label">Driver name or staff number</label>
              <input type="text" className="input-field" required placeholder="e.g. saS or Driver John" value={assignForm.Driver_ID} onChange={e => setAssignForm({
            ...assignForm,
            Driver_ID: e.target.value
          })} />
            </div>

            <div style={{
          backgroundColor: 'var(--status-info-bg)',
          border: '1px solid var(--status-info-border)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-caption)',
          color: 'var(--status-info-fg)',
          marginTop: 'var(--space-3)'
        }}>
              Saving this will set the delivery plan to <strong>Assigned</strong> on every tab of this screen.
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busyAction === 'assign'}>{busyAction === 'assign' ? 'Saving assignment…' : 'Save vehicle and driver'}</button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default DispatchPlanning;