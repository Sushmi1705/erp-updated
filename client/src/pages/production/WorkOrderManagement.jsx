import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, CheckCircle, ShieldAlert, FileText, Lock } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
import { confirmAction, promptAction } from '../../utils/confirmAction';
const WorkOrderManagement = () => {
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
  const [productionPlans, setProductionPlans] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    Source_Plan_ID: '',
    Plant_ID: '',
    details: [{
      Material_ID: '',
      Target_Quantity: 0
    }]
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const [matRes, plantRes, planAppRes, planRelRes] = await Promise.all([axios.get('/master/material'), axios.get('/company/plants'), axios.get('/production/v2/production-plan?status=Approved&limit=100'), axios.get('/production/v2/production-plan?status=Released&limit=100')]);
      setMaterials(matRes.data.data.filter(m => m.isActive !== false && m.status !== 'Inactive'));
      setPlants(plantRes.data.data.filter(p => p.isActive !== false && p.status !== 'Inactive'));
      const combinedPlans = [...(planAppRes.data?.data || []), ...(planRelRes.data?.data || [])];
      setProductionPlans(combinedPlans);
    } catch (err) {
      notify.error('Dependencies fetch error: ' + (err.response?.data?.message || err.message));
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/production/v2/work-orders');
      setWorkOrders(res.data.data);
    } catch (err) {
      console.error('Work Orders fetch error', err);
    }
    setLoading(false);
  };
  const handleGenerate = async e => {
    e.preventDefault();
    try {
      await axios.post('/production/v2/work-orders/generate', formData);
      setIsModalOpen(false);
      fetchData();
      setFormData({
        Source_Plan_ID: '',
        Plant_ID: '',
        details: [{
          Material_ID: '',
          Target_Quantity: 0
        }]
      });
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error generating work order');
    }
  };
  const handleUpdateProgress = async (id, produced) => {
    try {
      const typed = await promptAction({
        title: 'Update produced quantity',
        message: 'The total produced so far on this work order, not the pieces made today.',
        confirmLabel: 'Update',
        input: { type: 'number', min: 0, step: 1, defaultValue: produced || 0, label: 'Total produced (pieces)' }
      });
      if (typed === null) return;
      const newProduced = parseFloat(typed);
      if (isNaN(newProduced) || newProduced < 0) return notify.error('Enter a whole number of pieces.');
      await axios.put(`/production/v2/work-orders/${id}/progress`, {
        Produced_Quantity: newProduced
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating progress');
    }
  };
  const handleClose = async id => {
    if (!await confirmAction("Are you sure you want to close this work order? It will lock all materials and cost entries permanently.")) return;
    try {
      await axios.put(`/production/v2/work-orders/${id}/close`);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error closing work order');
    }
  };
  const handlePlanChange = planId => {
    const selectedPlan = productionPlans.find(p => p._id === planId);
    if (selectedPlan && selectedPlan.details) {
      // Auto-populate line items from the selected plan
      const autoDetails = selectedPlan.details.map(d => ({
        Material_ID: d.Material_ID?._id || d.Material_ID,
        Target_Quantity: d.Target_Quantity,
        UOM_ID: d.UOM_ID?._id || d.UOM_ID || undefined,
        BOM_Revision_ID: d.BOM_Revision_ID?._id || d.BOM_Revision_ID || undefined
      }));
      setFormData({
        ...formData,
        Source_Plan_ID: planId,
        Plant_ID: selectedPlan.Plant_ID?._id || selectedPlan.Plant_ID,
        details: autoDetails
      });
    } else {
      setFormData({
        ...formData,
        Source_Plan_ID: planId
      });
    }
  };
  const updateLineItem = (index, field, value) => {
    const newDetails = [...formData.details];
    newDetails[index][field] = value;
    setFormData({
      ...formData,
      details: newDetails
    });
  };
  const getStatusBadge = status => {
    switch (status) {
      case 'In Progress':
        return <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: 'var(--accent-primary)'
        }}>In Progress</span>;
      case 'Completed':
        return <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--accent-success)'
        }}>Completed</span>;
      case 'Closed':
        return <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          color: 'var(--text-muted)'
        }}>Closed</span>;
      default:
        return <span style={{
          color: 'var(--text-secondary)'
        }}>{status}</span>;
    }
  };
  const getMaterialStatusBadge = status => {
    switch (status) {
      case 'Allocated':
        return <span style={{
          color: 'var(--accent-primary)',
          fontWeight: 600
        }}>Allocated</span>;
      case 'Consumed':
        return <span style={{
          color: 'var(--accent-success)',
          fontWeight: 600
        }}>Consumed</span>;
      default:
        return <span style={{
          color: 'var(--text-secondary)'
        }}>{status}</span>;
    }
  };
  const columns = [{
    header: 'Work order no.',
    render: row => <strong style={{
      color: 'var(--text-primary)'
    }}>{row.WO_Number}</strong>
  }, {
    header: 'From plan',
    render: row => row.Source_Plan_ID?.Plan_Number || '-'
  }, {
    header: 'Status',
    render: row => getStatusBadge(row.Status)
  }, {
    header: 'Material status',
    render: row => getMaterialStatusBadge(row.Material_Status)
  }, {
    header: 'Progress',
    render: row => <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
        <div style={{
        flex: 1,
        backgroundColor: 'var(--bg-tertiary)',
        height: '6px',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
          <div style={{
          width: `${row.Overall_Progress_Percentage}%`,
          backgroundColor: row.Overall_Progress_Percentage === 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
          height: '100%'
        }}></div>
        </div>
        <span style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>{row.Overall_Progress_Percentage?.toFixed(0)}%</span>
      </div>
  }, {
    header: 'Actions',
    render: row => <div style={{
      display: 'flex',
      gap: '8px'
    }}>
          {row.Status !== 'Closed' && row.Status !== 'Canceled' && <button className="btn btn-secondary" style={{
        padding: '4px 8px',
        fontSize: '12px'
      }} onClick={() => handleUpdateProgress(row._id, row.details?.[0]?.Produced_Quantity)}>
              Update
            </button>}
          {row.Status === 'Completed' && <button className="btn btn-primary" style={{
        padding: '4px 8px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }} disabled={busy} onClick={() => runBusy(() => handleClose(row._id), 'close-' + row._id)}>
              <Lock size={12} /> {busyId === 'close-' + row._id ? 'Closing…' : 'Close Work Order'}
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
        }}>Work Orders</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Job cards released to the shop floor, with the material and the progress against each one.</p>
        </div>
        <div style={{
        display: 'flex',
        gap: '12px'
      }}>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} /> Add Work Order
          </button>
        </div>
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
          <DataTable columns={columns} data={workOrders} isLoading={loading} emptyTitle="No work orders yet" emptyMessage="Work orders are the job cards the shop floor works from. They come from an approved production plan — press “Add Work Order” above." />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a work order">
        <form onSubmit={e => runBusy(() => handleGenerate(e))} noValidate>
          
          <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '16px',
          marginBottom: '24px'
        }}>
            <div className="input-group">
              <label className="input-label">Production plan *</label>
              <select className="input-field" required value={formData.Source_Plan_ID} onChange={e => handlePlanChange(e.target.value)}>
                <option value="" disabled>Choose an approved production plan</option>
                {productionPlans.map(p => <option key={p._id} value={p._id}>{p.Plan_Number} - {p.Plan_Type}</option>)}
              </select>
        {productionPlans.length === 0 && <p style={{
              color: 'var(--status-caution-fg)',
              fontSize: 11,
              marginTop: 4,
              lineHeight: 1.4
            }}>No production plans yet — create one under Production → Production Plan.</p>}
            </div>
            
            <div className="input-group">
              <label className="input-label">Plant *</label>
              <select className="input-field" required value={formData.Plant_ID} onChange={e => setFormData({
              ...formData,
              Plant_ID: e.target.value
            })}>
                <option value="" disabled>Choose a plant</option>
                {plants.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
        {plants.length === 0 && <p style={{
              color: 'var(--status-caution-fg)',
              fontSize: 11,
              marginTop: 4,
              lineHeight: 1.4
            }}>No plants yet — add one under Company Setup → Plants.</p>}
            </div>
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '8px'
        }}>
            <div style={{
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>Generated Details (Auto-populated from Plan)</div>
          </div>

          <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
            {formData.details.map((row, index) => <div key={index} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '8px',
            marginBottom: '12px',
            alignItems: 'end',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '12px',
            borderRadius: '6px'
          }}>
                <div className="input-group">
                  <label className="input-label" style={{
                fontSize: '10px'
              }}>Material *</label>
                  <select className="input-field" required value={row.Material_ID} onChange={e => updateLineItem(index, 'Material_ID', e.target.value)}>
                    <option value="" disabled>Choose a material</option>
                    {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
        {materials.length === 0 && <p style={{
                color: 'var(--status-caution-fg)',
                fontSize: 11,
                marginTop: 4,
                lineHeight: 1.4
              }}>No raw materials yet — add one under Master Data → Raw Materials.</p>}
                </div>
                <div className="input-group">
                  <label className="input-label" style={{
                fontSize: '10px'
              }}>Target quantity *</label>
                  <input type="number" className="input-field" required value={row.Target_Quantity} onChange={e => updateLineItem(index, 'Target_Quantity', parseFloat(e.target.value))} />
                </div>
              </div>)}
          </div>

          <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent-success)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          marginTop: '16px'
        }}>
            <FileText size={16} />
            Work Orders can only be generated from Plans that have been fully Approved by Engineering.
          </div>
          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy || !formData.Source_Plan_ID}>{busy ? 'Creating…' : 'Create Work Order'}</button>
          </div>
        </form>
      </Modal>

    </div>;
};
export default WorkOrderManagement;