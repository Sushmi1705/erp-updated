import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Minus, AlertTriangle, ShieldCheck, Tag, Link2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
const SparePartsManagement = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [ledgers, setLedgers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [activityForm, setActivityForm] = useState({
    Part_ID: '',
    Activity_Type: 'Receipt',
    Transaction_Quantity: 1,
    Unit_Cost: '',
    Reference_Ticket_ID: '',
    Maintenance_Type: 'Preventive',
    Target_Machine_ID: '',
    Remarks: ''
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, [activeTab]);
  const fetchDependencies = async () => {
    try {
      const macRes = await axios.get('/master/machine');
      if (macRes.data?.data) setMachines(macRes.data.data);
      const ledRes = await axios.get('/maintenance/v2/sparepart/ledger');
      if (ledRes.data?.data) setLedgers(ledRes.data.data);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const res = await axios.get('/maintenance/v2/sparepart/ledger');
        setLedgers(res.data.data);
      } else {
        const res = await axios.get('/maintenance/v2/sparepart/activity');
        setActivities(res.data.data);
      }
    } catch (err) {
      console.error('Data fetch error', err);
    }
    setLoading(false);
  };
  const handleRecordActivity = async e => {
    e.preventDefault();
    if (!activityForm.Part_ID) {
      notify.warning('Choose a spare part first.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/maintenance/v2/sparepart/activity', activityForm);
      setIsModalOpen(false);
      setActivityForm({
        Part_ID: '',
        Activity_Type: 'Receipt',
        Transaction_Quantity: 1,
        Unit_Cost: '',
        Reference_Ticket_ID: '',
        Maintenance_Type: 'Preventive',
        Target_Machine_ID: '',
        Remarks: ''
      });
      fetchData();
      const ledRes = await axios.get('/maintenance/v2/sparepart/ledger');
      if (ledRes.data?.data) setLedgers(ledRes.data.data);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error recording part activity');
    } finally {
      setSubmitting(false);
    }
  };
  const openActivityModal = async (ledger = null) => {
    let currentLedgers = ledgers;
    if (!currentLedgers || currentLedgers.length === 0) {
      try {
        const res = await axios.get('/maintenance/v2/sparepart/ledger');
        if (res.data?.data) {
          currentLedgers = res.data.data;
          setLedgers(currentLedgers);
        }
      } catch (err) {}
    }
    const targetLedger = ledger || (currentLedgers && currentLedgers.length > 0 ? currentLedgers[0] : null);
    setSelectedLedger(targetLedger);
    setActivityForm({
      Part_ID: targetLedger ? targetLedger._id : '',
      Activity_Type: 'Receipt',
      Transaction_Quantity: 1,
      Unit_Cost: targetLedger ? targetLedger.Unit_Cost : '',
      Reference_Ticket_ID: '',
      Maintenance_Type: 'Preventive',
      Target_Machine_ID: '',
      Remarks: ''
    });
    setIsModalOpen(true);
  };
  const invColumns = [{
    header: 'Spare part code',
    render: row => <strong>{row.Part_ID}</strong>
  }, {
    header: 'Spare part',
    render: row => <div>
        <strong>{row.Part_Name || row.Material_ID?.name}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>{row.Material_ID?.code}</div>
      </div>
  }, {
    header: 'Stock in hand',
    render: row => <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
        <strong style={{
        color: row.Is_Reorder_Warning ? 'var(--accent-danger)' : 'var(--text-primary)'
      }}>
          {row.Stock_On_Hand} units
        </strong>
        {row.Is_Reorder_Warning && <span style={{
        fontSize: '10px',
        backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        color: 'var(--accent-danger)',
        padding: '1px 6px',
        borderRadius: '10px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '2px'
      }}>
            <AlertTriangle size={10} /> Reorder Alert
          </span>}
      </div>
  }, {
    header: 'Minimum level',
    render: row => <span style={{
      fontSize: '12px',
      color: 'var(--text-secondary)'
    }}>{row.Minimum_Stock_Level || 5} units</span>
  }, {
    header: 'Rate per unit',
    render: row => <span>{fmtMoneyFull(row.Unit_Cost)}</span>
  }, {
    header: 'Stock value',
    render: row => <strong style={{
      color: 'var(--accent-primary)'
    }}>{fmtMoneyFull(row.Total_Value)}</strong>
  }];
  const actColumns = [{
    header: 'Movement no.',
    render: row => <strong>{row.Activity_ID}</strong>
  }, {
    header: 'Spare part',
    render: row => <div>
        <strong>{row.Part_ID?.Part_Name || row.Part_ID?.Material_ID?.name}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>{row.Part_ID?.Part_ID}</div>
      </div>
  }, {
    header: 'Type',
    render: row => <span style={{
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      width: 'fit-content',
      backgroundColor: row.Activity_Type === 'Receipt' ? 'color-mix(in srgb, var(--accent-success) 8%, transparent)' : row.Activity_Type === 'Issue' ? 'color-mix(in srgb, var(--accent-danger) 8%, transparent)' : 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
      color: row.Activity_Type === 'Receipt' ? 'var(--accent-success)' : row.Activity_Type === 'Issue' ? 'var(--accent-danger)' : 'var(--accent-primary)'
    }}>
        {row.Activity_Type === 'Receipt' ? <Plus size={10} /> : <Minus size={10} />}
        {row.Activity_Type}
      </span>
  }, {
    header: 'Quantity',
    render: row => <strong style={{
      color: row.Transaction_Quantity > 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
    }}>
        {row.Transaction_Quantity > 0 ? `+${row.Transaction_Quantity}` : row.Transaction_Quantity}
      </strong>
  }, {
    header: 'Rate at that time',
    render: row => <span>{fmtMoneyFull(row.Unit_Cost_At_Transaction)}</span>
  }, {
    header: 'Linked repair',
    render: row => row.linkage?.Reference_Ticket_ID ? <div>
          <span style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
            <Link2 size={10} /> {row.linkage.Maintenance_Type}: {row.linkage.Reference_Ticket_ID}
          </span>
          {row.linkage.Target_Machine_ID && <div style={{
        fontSize: '10px',
        color: 'var(--text-secondary)'
      }}>Target: {row.linkage.Target_Machine_ID.name}</div>}
        </div> : <span style={{
      fontSize: '11px',
      color: 'var(--text-secondary)'
    }}>-</span>
  }, {
    header: 'Done by',
    render: row => row.Performed_By_ID?.name || 'System Storekeeper'
  }, {
    header: 'Date',
    render: row => new Date(row.Transaction_Date || row.createdAt).toLocaleDateString()
  }];
  const actionRenderer = row => {
    return <button onClick={() => openActivityModal(row)} className="btn-icon" style={{
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
        <Plus size={12} /> Record Movement
      </button>;
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
        }}>Spare Parts</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Spares stock held for machine repairs, with rate, value and which repair used them.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openActivityModal()}>
          <Settings size={14} /> Record Spare Movement
        </button>
      </div>

      <div className="tabs" style={{
      marginBottom: '16px'
    }}>
        <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>Spare Part Stock</button>
        <button className={`tab ${activeTab === 'transactions' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>Spare Movements</button>
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
          {activeTab === 'inventory' ? <DataTable columns={invColumns} data={ledgers} isLoading={loading} emptyTitle="No spare parts in stock yet" emptyMessage="Add the spare under Master Data → Raw Materials, then record a receipt here with “Record Spare Movement”." customActions={actionRenderer} /> : <DataTable columns={actColumns} data={activities} isLoading={loading} emptyTitle="No spare movements yet" emptyMessage="Every receipt and issue of a spare part shows here. Press “Record Spare Movement” above." />}
        </div>
      </div>

      {/* Record Part Activity Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record a spare part movement">
        <form onSubmit={handleRecordActivity}>
          <div className="input-group">
            <label className="input-label">Spare part</label>
            <select className="input-field" required value={activityForm.Part_ID} onChange={e => {
            const selected = ledgers.find(l => l._id === e.target.value);
            setActivityForm({
              ...activityForm,
              Part_ID: e.target.value,
              Unit_Cost: selected ? selected.Unit_Cost : ''
            });
          }}>
              <option value="" disabled>Choose a spare part</option>
              {ledgers.map(l => <option key={l._id} value={l._id}>{l.Part_Name} ({l.Part_ID}) - stock {l.Stock_On_Hand} at {fmtMoneyFull(l.Unit_Cost)} each</option>)}
            </select>
        {ledgers.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 11,
            marginTop: 4,
            lineHeight: 1.4
          }}>No spare parts in stock yet — add one on the Spare Part Stock tab of this screen.</p>}
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Type of movement</label>
              <select className="input-field" required value={activityForm.Activity_Type} onChange={e => setActivityForm({
              ...activityForm,
              Activity_Type: e.target.value
            })}>
                <option value="Receipt">Receipt (Stock In)</option>
                <option value="Issue">Issue (Consumption Out)</option>
                <option value="Return">Return (Restock In)</option>
                <option value="Adjustment">Adjustment</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Quantity</label>
              <input type="number" className="input-field" required min="1" value={activityForm.Transaction_Quantity} onChange={e => setActivityForm({
              ...activityForm,
              Transaction_Quantity: e.target.value
            })} />
            </div>

            <div className="input-group">
              <label className="input-label">Rate per unit (₹)</label>
              <input type="number" step="0.01" className="input-field" required value={activityForm.Unit_Cost} onChange={e => setActivityForm({
              ...activityForm,
              Unit_Cost: e.target.value
            })} placeholder="Current Cost" />
            </div>
          </div>

          {activityForm.Activity_Type === 'Issue' && <div style={{
          borderTop: '1px solid var(--border-color)',
          margin: '16px 0',
          paddingTop: '16px'
        }}>
              <h4 style={{
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '12px',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
                <Link2 size={14} /> Mandatory Maintenance Ticket Linkage
              </h4>

              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
                <div className="input-group">
                  <label className="input-label">Type of maintenance</label>
                  <select className="input-field" required value={activityForm.Maintenance_Type} onChange={e => setActivityForm({
                ...activityForm,
                Maintenance_Type: e.target.value
              })}>
                    <option value="Preventive">Preventive Maintenance</option>
                    <option value="Breakdown">Breakdown Maintenance</option>
                    <option value="General">General Maintenance</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Repair job number (needed when issuing)</label>
                  <input type="text" className="input-field" required placeholder="e.g. PM-981241 or BD-582620" value={activityForm.Reference_Ticket_ID} onChange={e => setActivityForm({
                ...activityForm,
                Reference_Ticket_ID: e.target.value
              })} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Machine (optional)</label>
                <select className="input-field" value={activityForm.Target_Machine_ID} onChange={e => setActivityForm({
              ...activityForm,
              Target_Machine_ID: e.target.value
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
            </div>}

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Recording…' : 'Record Movement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>;
};
export default SparePartsManagement;