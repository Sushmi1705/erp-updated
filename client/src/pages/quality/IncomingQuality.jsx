import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Truck, Star, AlertTriangle, Lock } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
const IncomingQuality = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [inspections, setInspections] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedInsp, setSelectedInsp] = useState(null);
  const [createForm, setCreateForm] = useState({
    Vendor_ID: '',
    Material_ID: '',
    Received_Quantity: 100,
    Sample_Size: 10
  });
  const [updateForm, setUpdateForm] = useState({
    Accepted_Quantity: 100,
    Rejected_Quantity: 0,
    Overall_Status: 'Pass',
    Defect_Code_ID: 'Material Defect',
    Action_Required: 'Return to Vendor',
    Evaluation_Notes: ''
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const [venRes, matRes] = await Promise.allSettled([axios.get('/master/vendor'), axios.get('/master/material')]);
      if (venRes.status === 'fulfilled' && venRes.value.data?.data) {
        setVendors(venRes.value.data.data);
      }
      if (matRes.status === 'fulfilled' && matRes.value.data?.data) {
        setMaterials(matRes.value.data.data);
      }
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/quality/v2/incoming');
      setInspections(res.data.data);
    } catch (err) {
      console.error('Incoming quality fetch error', err);
    }
    setLoading(false);
  };
  const handleCreateInspection = async e => {
    e.preventDefault();
    try {
      await axios.post('/quality/v2/incoming', createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        Vendor_ID: '',
        Material_ID: '',
        Received_Quantity: 100,
        Sample_Size: 10
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error creating incoming inspection');
    }
  };
  const handleUpdateResults = async e => {
    e.preventDefault();
    const acc = Number(updateForm.Accepted_Quantity) || 0;
    const rej = Number(updateForm.Rejected_Quantity) || 0;
    const rec = selectedInsp?.samplings?.[0]?.Received_Quantity || 100;

    // Rule 3: Quantity Conservation
    if (acc + rej !== rec) {
      notify.error(`Quantity Conservation Violation: Accepted Qty (${acc}) + Rejected Qty (${rej}) must strictly equal Received Qty (${rec}).`);
      return;
    }
    try {
      await axios.put(`/quality/v2/incoming/${selectedInsp._id}/results`, updateForm);
      setIsUpdateModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating inspection results');
    }
  };
  const getStatusBadge = status => {
    const colors = {
      'Pass': {
        bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
        text: 'var(--accent-success)'
      },
      'Fail': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      },
      'Conditional Accept': {
        bg: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
        text: 'var(--accent-warning)'
      },
      'Pending': {
        bg: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        text: 'var(--accent-primary)'
      }
    };
    const c = colors[status] || colors['Pending'];
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
    const isFinalized = row.Overall_Status === 'Pass' || row.Overall_Status === 'Fail';
    if (isFinalized) {
      return <span style={{
        fontSize: '11px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
          <Lock size={12} /> Finalized
        </span>;
    }
    const defaultRec = row.samplings?.[0]?.Received_Quantity || 100;
    return <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        <button onClick={() => {
        setSelectedInsp(row);
        setUpdateForm({
          Accepted_Quantity: defaultRec,
          Rejected_Quantity: 0,
          Overall_Status: 'Pass',
          Defect_Code_ID: 'Material Defect',
          Action_Required: 'Return to Vendor',
          Evaluation_Notes: ''
        });
        setIsUpdateModalOpen(true);
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
          <ShieldCheck size={12} /> Enter Results
        </button>
      </div>;
  };
  const columns = [{
    header: 'Check no.',
    render: row => <strong>{row.Insp_ID || row.inspectionNumber}</strong>
  }, {
    header: 'Supplier',
    render: row => row.Vendor_ID?.name || row.Vendor_ID?.vendorName || row.vendorId?.vendorName || '-'
  }, {
    header: 'Received / accepted / rejected',
    render: row => {
      const s = row.samplings?.[0];
      if (!s) return <span style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>-</span>;
      return <div style={{
        fontSize: '12px'
      }}>
          <span>Rec: <strong>{s.Received_Quantity}</strong></span> | <span style={{
          color: 'var(--accent-success)'
        }}>Acc: <strong>{s.Accepted_Quantity}</strong></span> | <span style={{
          color: 'var(--accent-danger)'
        }}>Rej: <strong>{s.Rejected_Quantity}</strong></span>
        </div>;
    }
  }, {
    header: 'Result',
    render: row => getStatusBadge(row.Overall_Status || row.status || 'Pending')
  }, {
    header: 'Supplier score',
    render: row => {
      const score = row.vendorEval?.Score_Awarded !== undefined ? row.vendorEval.Score_Awarded : row.vendorQualityScore;
      if (score === undefined || score === null) return <span style={{
        color: 'var(--text-secondary)',
        fontSize: '11px'
      }}>Pending</span>;
      return <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        fontWeight: 600,
        color: score >= 80 ? 'var(--accent-success)' : score >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)'
      }}>
          <Star size={12} fill={score > 0 ? "currentColor" : "none"} /> {score}/100
        </span>;
    }
  }, {
    header: 'Checked on',
    render: row => new Date(row.Inspection_Date || row.dateRecorded || row.createdAt).toLocaleDateString()
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
        }}>Incoming Material Checks</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Inspect material received from suppliers, accept or reject it, and build the supplier quality record.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <Truck size={14} /> Add Incoming Check
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
          <DataTable columns={columns} data={inspections} isLoading={loading} emptyTitle="No incoming checks yet" emptyMessage="Check material received from a supplier before it goes into the store. Press “Add Incoming Check” above." customActions={actionRenderer} />
        </div>
      </div>

      {/* New Incoming Inspection Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Record an incoming material check">
        <form onSubmit={e => runBusy(() => handleCreateInspection(e))}>
          <div className="input-group">
            <label className="input-label">Supplier</label>
            <select className="input-field" required value={createForm.Vendor_ID} onChange={e => setCreateForm({
            ...createForm,
            Vendor_ID: e.target.value
          })}>
              <option value="" disabled>Choose a supplier</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.name || v.vendorName} ({v.code || v.vendorCode || 'Vendor'})</option>)}
            </select>
        {vendors.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 11,
            marginTop: 4,
            lineHeight: 1.4
          }}>No suppliers yet — add one under Master Data → Suppliers (Vendors).</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Material received</label>
            <select className="input-field" required value={createForm.Material_ID} onChange={e => setCreateForm({
            ...createForm,
            Material_ID: e.target.value
          })}>
              <option value="" disabled>Choose a raw material</option>
              {materials.map(m => <option key={m._id} value={m._id}>{m.name} ({m.code})</option>)}
            </select>
        {materials.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 11,
            marginTop: 4,
            lineHeight: 1.4
          }}>No raw materials yet — add one under Master Data → Raw Materials.</p>}
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Total quantity received</label>
              <input type="number" className="input-field" required min="1" value={createForm.Received_Quantity} onChange={e => setCreateForm({
              ...createForm,
              Received_Quantity: e.target.value
            })} />
            </div>
            <div className="input-group">
              <label className="input-label">Pieces checked</label>
              <input type="number" className="input-field" required min="1" value={createForm.Sample_Size} onChange={e => setCreateForm({
              ...createForm,
              Sample_Size: e.target.value
            })} />
            </div>
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
            <ShieldCheck size={16} /> Created inspections automatically lock incoming inventory in Quarantine until verified.
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create Check'}</button>
          </div>
        </form>
      </Modal>

      {/* Update Inspection Results Modal */}
      {selectedInsp && <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title={`Enter results: ${selectedInsp.Insp_ID || selectedInsp.inspectionNumber}`}>
          <form onSubmit={e => runBusy(() => handleUpdateResults(e))}>
            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              Received Quantity: <strong>{selectedInsp.samplings?.[0]?.Received_Quantity || 100} units</strong>
            </div>

            <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
              <div className="input-group">
                <label className="input-label" style={{
              color: 'var(--accent-success)'
            }}>Quantity accepted</label>
                <input type="number" className="input-field" required min="0" value={updateForm.Accepted_Quantity} onChange={e => setUpdateForm({
              ...updateForm,
              Accepted_Quantity: e.target.value
            })} />
              </div>
              <div className="input-group">
                <label className="input-label" style={{
              color: 'var(--accent-danger)'
            }}>Quantity rejected</label>
                <input type="number" className="input-field" required min="0" value={updateForm.Rejected_Quantity} onChange={e => setUpdateForm({
              ...updateForm,
              Rejected_Quantity: e.target.value
            })} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Overall result</label>
              <select className="input-field" required value={updateForm.Overall_Status} onChange={e => setUpdateForm({
            ...updateForm,
            Overall_Status: e.target.value
          })}>
                <option value="Pass">Pass (Release to Available Inventory)</option>
                <option value="Fail">Fail — raises a quality problem</option>
                <option value="Conditional Accept">Conditional Accept (Accept on Deviation)</option>
              </select>
            </div>

            {Number(updateForm.Rejected_Quantity) > 0 && <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-danger) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-danger) 19%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
                <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--accent-danger)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
                  <AlertTriangle size={14} /> Defect Logging & Action Required
                </div>
                <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
                  <div>
                    <label className="input-label" style={{
                fontSize: '11px'
              }}>Defect type</label>
                    <input type="text" className="input-field" style={{
                fontSize: '11px'
              }} value={updateForm.Defect_Code_ID} onChange={e => setUpdateForm({
                ...updateForm,
                Defect_Code_ID: e.target.value
              })} />
                  </div>
                  <div>
                    <label className="input-label" style={{
                fontSize: '11px'
              }}>Action needed</label>
                    <select className="input-field" style={{
                fontSize: '11px'
              }} value={updateForm.Action_Required} onChange={e => setUpdateForm({
                ...updateForm,
                Action_Required: e.target.value
              })}>
                      <option value="Return to Vendor">Return to Vendor</option>
                      <option value="Scrap">Scrap</option>
                      <option value="Rework">Rework</option>
                      <option value="Accept on Deviation">Accept on Deviation</option>
                    </select>
                  </div>
                </div>
              </div>}

            <div className="input-group">
              <label className="input-label">Inspector notes</label>
              <textarea className="input-field" rows="2" placeholder="Inspector context / notes for vendor evaluation..." value={updateForm.Evaluation_Notes} onChange={e => setUpdateForm({
            ...updateForm,
            Evaluation_Notes: e.target.value
          })}></textarea>
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsUpdateModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Results & Score Supplier'}</button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default IncomingQuality;