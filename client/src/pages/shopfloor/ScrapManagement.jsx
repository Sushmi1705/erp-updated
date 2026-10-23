import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, TrendingDown, IndianRupee, AlertCircle, CheckCircle } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { fmtMoney, fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
const ScrapManagement = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [scrapRecords, setScrapRecords] = useState([]);
  const [metrics, setMetrics] = useState({
    Total_Financial_Impact: 0,
    Total_Items_Scrapped: 0,
    Total_Scrap_Incidents: 0
  });
  const [workOrders, setWorkOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    WO_ID: '',
    Material_ID: '',
    Material_Type: 'Component',
    Quantity: 1,
    Root_Cause_Description: ''
  });
  const [selectedMatCost, setSelectedMatCost] = useState(0);
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const [v2WoRes, v1WoRes, matRes] = await Promise.allSettled([
        axios.get('/production/v2/work-orders'),
        axios.get('/production/wo'),
        axios.get('/master/material')
      ]);
      let woList = [];
      if (v2WoRes.status === 'fulfilled') {
        const d = v2WoRes.value.data?.data || (Array.isArray(v2WoRes.value.data) ? v2WoRes.value.data : []);
        woList = [...woList, ...d];
      }
      if (v1WoRes.status === 'fulfilled') {
        const d = v1WoRes.value.data?.data || (Array.isArray(v1WoRes.value.data) ? v1WoRes.value.data : []);
        woList = [...woList, ...d];
      }
      setWorkOrders(woList);
      
      if (matRes.status === 'fulfilled') {
        const m = matRes.value.data?.data || (Array.isArray(matRes.value.data) ? matRes.value.data : []);
        setMaterials(m);
      }
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/shopfloor/v2/scrap');
      setScrapRecords(res.data.data);
      if (res.data.metrics) setMetrics(res.data.metrics);
    } catch (err) {
      console.error('Scrap fetch error', err);
    }
    setLoading(false);
  };
  const handleMaterialChange = matId => {
    const mat = materials.find(m => m._id === matId);
    const cost = mat ? mat.standardCost || mat.price || 50 : 0;
    setSelectedMatCost(cost);
    setFormData({
      ...formData,
      Material_ID: matId
    });
  };
  const handleSave = async e => {
    e.preventDefault();
    if (!formData.Root_Cause_Description || !formData.Root_Cause_Description.trim()) {
      notify.warning('Write down why it happened before saving.');
      return;
    }
    try {
      await axios.post('/shopfloor/v2/scrap', formData);
      setIsModalOpen(false);
      setFormData({
        WO_ID: '',
        Material_ID: '',
        Material_Type: 'Component',
        Quantity: 1,
        Root_Cause_Description: ''
      });
      setSelectedMatCost(0);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error recording scrap log');
    }
  };
  const columns = [{
    header: 'Scrap no.',
    render: row => <strong>{row.Scrap_Log_Number || row.scrapNumber}</strong>
  }, {
    header: 'Work order',
    render: row => row.WO_ID?.WO_Number || row.WO_ID?.workOrderNumber || row.workOrderId?.workOrderNumber || '-'
  }, {
    header: 'Material scrapped',
    render: row => <strong>{row.detail?.Material_ID?.name || row.materialId?.name || 'Material Asset'}</strong>
  }, {
    header: 'Quantity',
    render: row => <strong style={{
      color: 'var(--accent-danger)'
    }}>{row.detail?.Quantity || row.scrapQuantity}</strong>
  }, {
    header: 'Rate per unit',
    render: row => <span style={{
      fontSize: '12px'
    }}>{fmtMoneyFull(row.detail?.Unit_Cost || row.unitCost || 0)}</span>
  }, {
    header: 'Value lost',
    render: row => <strong style={{
      color: 'var(--accent-danger)'
    }}>{fmtMoneyFull(row.detail?.Total_Value_Lost || row.totalScrapCost || 0)}</strong>
  }, {
    header: 'Reason',
    render: row => <span style={{
      fontSize: '11px',
      color: 'var(--text-secondary)'
    }}>{row.rootCause?.Root_Cause_Description || row.rootCauseAnalysis || '-'}</span>
  }, {
    header: 'Recorded on',
    render: row => new Date(row.Logged_Date || row.dateRecorded || row.createdAt).toLocaleDateString()
  }];

  // Calculated or metric totals
  const totalFinancialImpact = metrics.Total_Financial_Impact || scrapRecords.reduce((acc, curr) => acc + (curr.detail?.Total_Value_Lost || curr.totalScrapCost || 0), 0);
  const totalItemsScrapped = metrics.Total_Items_Scrapped || scrapRecords.reduce((acc, curr) => acc + (curr.detail?.Quantity || curr.scrapQuantity || 0), 0);
  const totalIncidents = metrics.Total_Scrap_Incidents || scrapRecords.length;
  const estimatedValueLost = (Number(formData.Quantity) || 0) * selectedMatCost;
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
        }}>Scrap & Rejections</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Log rejected pieces with the reason, and see what the scrap costs in rupees.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Trash2 size={14} /> Record Scrap
        </button>
      </div>

      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginBottom: '16px'
    }}>
        <div style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          marginBottom: '8px'
        }}>
            <IndianRupee size={16} color="var(--accent-danger)" />
            <span style={{
            fontSize: '12px',
            fontWeight: 600
          }}>Total value lost</span>
          </div>
          <div style={{
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--accent-danger)'
        }}>{fmtMoney(totalFinancialImpact)}</div>
        </div>
        <div style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          marginBottom: '8px'
        }}>
            <TrendingDown size={16} color="var(--accent-warning)" />
            <span style={{
            fontSize: '12px',
            fontWeight: 600
          }}>Total Items Scrapped</span>
          </div>
          <div style={{
          fontSize: '24px',
          fontWeight: 700
        }}>{totalItemsScrapped} units</div>
        </div>
        <div style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          marginBottom: '8px'
        }}>
            <Trash2 size={16} color="var(--accent-primary)" />
            <span style={{
            fontSize: '12px',
            fontWeight: 600
          }}>Total Scrap Incidents</span>
          </div>
          <div style={{
          fontSize: '24px',
          fontWeight: 700
        }}>{totalIncidents} Events</div>
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
          <DataTable columns={columns} data={scrapRecords} isLoading={loading} emptyTitle="No scrap recorded yet" emptyMessage="Record rejected pieces with the reason and the system works out the value lost. Press “Record Scrap” above." />
        </div>
      </div>

      {/* Log Manufacturing Scrap Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record scrap">
        <form onSubmit={e => runBusy(() => handleSave(e))}>
          <div className="input-group">
            <label className="input-label">Source Work Order</label>
            <select className="input-field" required value={formData.WO_ID} onChange={e => setFormData({
            ...formData,
            WO_ID: e.target.value
          })}>
              <option value="" disabled>Choose a running work order</option>
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
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Material scrapped</label>
              <select className="input-field" required value={formData.Material_ID} onChange={e => handleMaterialChange(e.target.value)}>
                <option value="" disabled>Choose the material scrapped</option>
                {materials.map(m => <option key={m._id} value={m._id}>{m.name} (${m.standardCost || m.price || 50})</option>)}
              </select>
        {materials.length === 0 && <p style={{
              color: 'var(--status-caution-fg)',
              fontSize: 11,
              marginTop: 4,
              lineHeight: 1.4
            }}>No raw materials yet — add one under Master Data → Raw Materials.</p>}
            </div>
            <div className="input-group">
              <label className="input-label">Quantity</label>
              <input type="number" className="input-field" required min="1" step="any" value={formData.Quantity} onChange={e => setFormData({
              ...formData,
              Quantity: e.target.value
            })} />
            </div>
          </div>

          {selectedMatCost > 0 && <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-danger) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-danger) 19%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '13px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
              <span>Rate per unit: <strong>{fmtMoneyFull(selectedMatCost)}</strong></span>
              <span style={{
            color: 'var(--accent-danger)',
            fontWeight: 700
          }}>Value lost: {fmtMoneyFull(estimatedValueLost)}</span>
            </div>}

          <div className="input-group">
            <label className="input-label">Reason for the scrap *</label>
            <textarea className="input-field" required rows="3" placeholder="Analyze and document the root cause of the scrap event..." value={formData.Root_Cause_Description} onChange={e => setFormData({
            ...formData,
            Root_Cause_Description: e.target.value
          })}></textarea>
          </div>

          <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          marginTop: '8px'
        }}>
            The financial cost will be automatically calculated by querying the Master Material's standard valuation and multiplying it by the scrap quantity. Once posted, unit costs and total value lost are permanently locked.
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Recording…' : 'Record Scrap'}</button>
          </div>
        </form>
      </Modal>
    </div>;
};
export default ScrapManagement;