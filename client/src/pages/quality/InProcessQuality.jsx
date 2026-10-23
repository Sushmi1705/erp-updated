import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Cog, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
const InProcessQuality = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [inspections, setInspections] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedInsp, setSelectedInsp] = useState(null);
  const [createForm, setCreateForm] = useState({
    Work_Order_ID: '',
    Operation_ID: 'OP-010 Turning',
    Sample_Size_Checked: 5,
    Observations: ''
  });
  const [updateForm, setUpdateForm] = useState({
    Actual_Measured_Value: 50.0,
    Overall_Status: 'Pass',
    Defect_Code_ID: 'Dimensional Error',
    Affected_Quantity: 1,
    Severity: 'Major',
    Action_Taken: 'Send to Rework'
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const [v2WoRes, v1WoRes] = await Promise.allSettled([axios.get('/production/v2/work-orders'), axios.get('/production/wo')]);
      let woList = [];
      if (v2WoRes.status === 'fulfilled' && v2WoRes.value.data?.data) woList = [...woList, ...v2WoRes.value.data.data];
      if (v1WoRes.status === 'fulfilled' && v1WoRes.value.data?.data) woList = [...woList, ...v1WoRes.value.data.data];

      // Filter out Closed / Cancelled WOs per Rule 1
      setWorkOrders(woList.filter(w => !['Closed', 'Cancelled', 'Not Started'].includes(w.Status || w.status)));
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/quality/v2/inprocess');
      setInspections(res.data.data);
    } catch (err) {
      console.error('In-Process quality fetch error', err);
    }
    setLoading(false);
  };
  const handleCreateInspection = async e => {
    e.preventDefault();
    try {
      await axios.post('/quality/v2/inprocess', createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        Work_Order_ID: '',
        Operation_ID: 'OP-010 Turning',
        Sample_Size_Checked: 5,
        Observations: ''
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error recording in-process inspection');
    }
  };
  const handleUpdateResults = async e => {
    e.preventDefault();
    try {
      await axios.put(`/quality/v2/inprocess/${selectedInsp._id}/results`, updateForm);
      setIsUpdateModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating measurement results');
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
      'Rework': {
        bg: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
        text: 'var(--accent-warning)'
      },
      'Conditional Accept': {
        bg: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        text: 'var(--accent-primary)'
      },
      'Pending': {
        bg: 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
        text: 'var(--text-muted)'
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
    const defaultVal = row.parameters?.[0]?.Actual_Measured_Value || 50.0;
    return <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        <button onClick={() => {
        setSelectedInsp(row);
        setUpdateForm({
          Actual_Measured_Value: defaultVal,
          Overall_Status: row.Overall_Status || 'Pass',
          Defect_Code_ID: 'Dimensional Error',
          Affected_Quantity: 1,
          Severity: 'Major',
          Action_Taken: 'Send to Rework'
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
          <Activity size={12} /> Enter Measurements
        </button>
      </div>;
  };
  const columns = [{
    header: 'Check no.',
    render: row => <strong>{row.Insp_ID || row.inspectionNumber}</strong>
  }, {
    header: 'Work Order',
    render: row => <strong>{row.Work_Order_ID?.WO_Number || row.Work_Order_ID?.workOrderNumber || row.referenceId || '-'}</strong>
  }, {
    header: 'Operation',
    render: row => <span style={{
      fontSize: '12px'
    }}>{row.Operation_ID || 'OP-010'}</span>
  }, {
    header: 'Allowed limits and actual',
    render: row => {
      const p = row.parameters?.[0];
      if (!p) return <span style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>-</span>;
      const isOut = p.Actual_Measured_Value < p.LSL || p.Actual_Measured_Value > p.USL;
      return <div style={{
        fontSize: '12px'
      }}>
          <span style={{
          color: 'var(--text-secondary)',
          fontSize: '11px'
        }}>[{p.LSL} - {p.USL}]</span> | Actual: <strong style={{
          color: isOut ? 'var(--accent-danger)' : 'var(--accent-success)'
        }}>{p.Actual_Measured_Value ?? '-'}</strong>
        </div>;
    }
  }, {
    header: 'Result',
    render: row => <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
        {getStatusBadge(row.Overall_Status || row.status || 'Pending')}
        {row.capa && <span style={{
        fontSize: '10px',
        backgroundColor: 'color-mix(in srgb, var(--accent-danger) 12%, transparent)',
        color: 'var(--accent-danger)',
        padding: '1px 5px',
        borderRadius: '4px',
        fontWeight: 700
      }}>
            CAPA
          </span>}
      </div>
  }, {
    header: 'Inspector',
    render: row => row.Inspector_ID?.name || row.inspectorName || 'System Admin'
  }, {
    header: 'Date',
    render: row => new Date(row.Inspection_Date || row.dateRecorded || row.createdAt).toLocaleDateString()
  }];
  const currentParam = selectedInsp?.parameters?.[0] || {
    LSL: 49.5,
    USL: 50.5,
    Parameter_Name: 'Critical Dimension (Outer Diameter)'
  };
  const measuredVal = Number(updateForm.Actual_Measured_Value);
  const isOutOfSpec = measuredVal < currentParam.LSL || measuredVal > currentParam.USL;
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
        }}>In-Process Checks</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Record checks taken while the job is still running on the machine.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <Cog size={14} /> Add In-Process Check
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
          <DataTable columns={columns} data={inspections} isLoading={loading} emptyTitle="No in-process checks yet" emptyMessage="Record checks taken while a job is still running. Press “Add In-Process Check” above." customActions={actionRenderer} />
        </div>
      </div>

      {/* New Process Check Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Record an in-process check">
        <form onSubmit={e => runBusy(() => handleCreateInspection(e))}>
          <div className="input-group">
            <label className="input-label">Work order (job running now)</label>
            <select className="input-field" required value={createForm.Work_Order_ID} onChange={e => setCreateForm({
            ...createForm,
            Work_Order_ID: e.target.value
          })}>
              <option value="" disabled>Choose a released or running work order</option>
              {workOrders.map(w => <option key={w._id} value={w._id}>
                  {w.WO_Number || w.workOrderNumber} ({w.Status || w.status || 'Active'})
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Operation or station</label>
              <select className="input-field" required value={createForm.Operation_ID} onChange={e => setCreateForm({
              ...createForm,
              Operation_ID: e.target.value
            })}>
                <option value="OP-010 Turning">OP-010 Turning CNC</option>
                <option value="OP-020 Milling">OP-020 Milling Station</option>

                <option value="OP-030 Grinding">OP-030 Precision Grinding</option>
                <option value="OP-040 Assembly">OP-040 Final Assembly</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Pieces checked</label>
              <input type="number" className="input-field" required min="1" value={createForm.Sample_Size_Checked} onChange={e => setCreateForm({
              ...createForm,
              Sample_Size_Checked: e.target.value
            })} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Notes</label>
            <textarea className="input-field" rows="2" placeholder="Inspector notes on shop floor process stability..." value={createForm.Observations} onChange={e => setCreateForm({
            ...createForm,
            Observations: e.target.value
          })}></textarea>
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

      {/* Record Measurements Modal */}
      {selectedInsp && <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title={`Record measurements: ${selectedInsp.Insp_ID || selectedInsp.inspectionNumber}`}>
          <form onSubmit={e => runBusy(() => handleUpdateResults(e))}>
            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              <div>Parameter: <strong>{currentParam.Parameter_Name || 'Critical Dimension'}</strong></div>
              <div>Specification Bounds: Lower (LSL): <strong>{currentParam.LSL}</strong> | Upper (USL): <strong>{currentParam.USL}</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">Measured value</label>
              <input type="number" step="any" className="input-field" required value={updateForm.Actual_Measured_Value} onChange={e => setUpdateForm({
            ...updateForm,
            Actual_Measured_Value: e.target.value
          })} />
            </div>

            {isOutOfSpec && <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-danger) 19%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent-danger)',
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
                <AlertTriangle size={16} /> Auto-Status Resolution: Value {measuredVal} is outside tolerance bounds [{currentParam.LSL} - {currentParam.USL}]. Overall status auto-flags to <strong>FAIL</strong>.
              </div>}

            <div className="input-group">
              <label className="input-label">Overall result</label>
              <select className="input-field" required value={isOutOfSpec ? 'Fail' : updateForm.Overall_Status} onChange={e => setUpdateForm({
            ...updateForm,
            Overall_Status: e.target.value
          })}>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Rework">Rework</option>
                <option value="Conditional Accept">Conditional Accept</option>
              </select>
            </div>

            {(isOutOfSpec || updateForm.Overall_Status === 'Fail' || updateForm.Overall_Status === 'Rework') && <div style={{
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
                  <ShieldAlert size={14} /> Record the defect — this also raises a quality problem
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
              }} required value={updateForm.Defect_Code_ID} onChange={e => setUpdateForm({
                ...updateForm,
                Defect_Code_ID: e.target.value
              })} />
                  </div>
                  <div>
                    <label className="input-label" style={{
                fontSize: '11px'
              }}>Quantity affected</label>
                    <input type="number" className="input-field" style={{
                fontSize: '11px'
              }} required min="1" value={updateForm.Affected_Quantity} onChange={e => setUpdateForm({
                ...updateForm,
                Affected_Quantity: e.target.value
              })} />
                  </div>
                  <div>
                    <label className="input-label" style={{
                fontSize: '11px'
              }}>Severity</label>
                    <select className="input-field" style={{
                fontSize: '11px'
              }} value={updateForm.Severity} onChange={e => setUpdateForm({
                ...updateForm,
                Severity: e.target.value
              })}>
                      <option value="Minor">Minor</option>
                      <option value="Major">Major</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label" style={{
                fontSize: '11px'
              }}>Action Taken</label>
                    <select className="input-field" style={{
                fontSize: '11px'
              }} value={updateForm.Action_Taken} onChange={e => setUpdateForm({
                ...updateForm,
                Action_Taken: e.target.value
              })}>
                      <option value="Send to Rework">Send to Rework</option>
                      <option value="Scrap">Scrap</option>
                      <option value="Use As Is">Use As Is</option>
                    </select>
                  </div>
                </div>
              </div>}

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsUpdateModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Measurements'}</button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default InProcessQuality;