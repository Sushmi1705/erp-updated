import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PackageCheck, FileCheck, CheckCircle2, ShieldAlert, Lock } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
const FinalQuality = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [inspections, setInspections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedInsp, setSelectedInsp] = useState(null);
  const [createForm, setCreateForm] = useState({
    FG_Batch_Ref: '',
    Product_ID: '',
    Batch_Quantity: 100,
    Sample_Size_Inspected: 10
  });
  const [testForm, setTestForm] = useState({
    Actual_Result: 'Meets All Engineering Specs',
    Inspection_Status: 'Pass',
    Remarks: ''
  });
  const [releaseForm, setReleaseForm] = useState({
    Action_Taken: 'Approve Release',
    Approver_Comments: ''
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const matRes = await axios.get('/master/material');
      if (matRes.data?.data) {
        setProducts(matRes.data.data);
      }
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/quality/v2/final');
      setInspections(res.data.data);
    } catch (err) {
      console.error('Final quality fetch error', err);
    }
    setLoading(false);
  };
  const handleCreateInspection = async e => {
    e.preventDefault();
    if (!createForm.FG_Batch_Ref || !createForm.FG_Batch_Ref.trim()) {
      notify.warning('Enter the finished goods batch or tag number before saving.');
      return;
    }
    try {
      await axios.post('/quality/v2/final', createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        FG_Batch_Ref: '',
        Product_ID: '',
        Batch_Quantity: 100,
        Sample_Size_Inspected: 10
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error recording final inspection');
    }
  };
  const handleUpdateTest = async e => {
    e.preventDefault();
    try {
      await axios.put(`/quality/v2/final/${selectedInsp._id}/results`, testForm);
      setIsTestModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating test results');
    }
  };
  const handleApproveRelease = async e => {
    e.preventDefault();
    try {
      await axios.post(`/quality/v2/final/${selectedInsp._id}/release`, releaseForm);
      setIsReleaseModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error executing release decision');
    }
  };
  const getInspectionStatusBadge = status => {
    const colors = {
      'Pass': {
        bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
        text: 'var(--accent-success)'
      },
      'Fail': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      },
      'Hold': {
        bg: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
        text: 'var(--accent-warning)'
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
  const getReleaseStatusBadge = status => {
    const colors = {
      'Released': {
        bg: 'color-mix(in srgb, var(--accent-purple) 8%, transparent)',
        text: 'var(--accent-purple)'
      },
      'Quarantined': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      },
      'Rejected': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      },
      'Pending Approval': {
        bg: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        text: 'var(--accent-primary)'
      }
    };
    const c = colors[status] || colors['Pending Approval'];
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
    const isReleased = row.Release_Status === 'Released';
    const isQuarantined = row.Release_Status === 'Quarantined';
    if (isReleased || isQuarantined) {
      return <span style={{
        fontSize: '11px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
          <Lock size={12} /> {row.Release_Status}
        </span>;
    }
    return <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        <button onClick={() => {
        setSelectedInsp(row);
        setTestForm({
          Actual_Result: row.parameters?.[0]?.Actual_Result || 'Meets Specs',
          Inspection_Status: row.Inspection_Status || 'Pass',
          Remarks: ''
        });
        setIsTestModalOpen(true);
      }} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--text-secondary)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
          <PackageCheck size={12} /> Enter Test Results
        </button>

        <button onClick={() => {
        setSelectedInsp(row);
        setReleaseForm({
          Action_Taken: row.Inspection_Status === 'Pass' ? 'Approve Release' : 'Reject Release',
          Approver_Comments: ''
        });
        setIsReleaseModalOpen(true);
      }} className="btn-icon" style={{
        fontSize: '11px',
        color: row.Inspection_Status === 'Pass' ? 'var(--accent-purple)' : 'var(--accent-danger)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 600
      }}>
          <CheckCircle2 size={12} /> Release Decision
        </button>
      </div>;
  };
  const columns = [{
    header: 'Check no.',
    render: row => <strong>{row.Insp_ID || row.inspectionNumber}</strong>
  }, {
    header: 'Finished goods / batch',
    render: row => <strong>{row.FG_Batch_Ref || row.referenceId}</strong>
  }, {
    header: 'Product',
    render: row => row.Product_ID?.name || 'Finished Component'
  }, {
    header: 'Batch / sample quantity',
    render: row => <span style={{
      fontSize: '12px'
    }}>
        Batch: <strong>{row.Batch_Quantity || 100}</strong> | Sample: <strong>{row.Sample_Size_Inspected || 10}</strong>
      </span>
  }, {
    header: 'Check result',
    render: row => getInspectionStatusBadge(row.Inspection_Status || row.status || 'Pending')
  }, {
    header: 'Released for dispatch',
    render: row => getReleaseStatusBadge(row.Release_Status || 'Pending Approval')
  }, {
    header: 'Inspector',
    render: row => row.Inspector_ID?.name || row.inspectorName || 'System Admin'
  }, {
    header: 'Date',
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
        }}>Final Inspection</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Check finished parts before dispatch and approve them for release. Used by the quality inspector.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <FileCheck size={14} /> Add Final Inspection
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
          <DataTable columns={columns} data={inspections} isLoading={loading} emptyTitle="No final inspections yet" emptyMessage="Check finished parts before dispatch and release them here. Press “Add Final Inspection” above." customActions={actionRenderer} />
        </div>
      </div>

      {/* New Final Inspection Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Record a final inspection">
        <form onSubmit={e => runBusy(() => handleCreateInspection(e))}>
          <div className="input-group">
            <label className="input-label">Finished goods batch or tag number *</label>
            <input type="text" className="input-field" required placeholder="e.g. FG-BATCH-98214" value={createForm.FG_Batch_Ref} onChange={e => setCreateForm({
            ...createForm,
            FG_Batch_Ref: e.target.value
          })} />
          </div>

          <div className="input-group">
            <label className="input-label">Product</label>
            <select className="input-field" required value={createForm.Product_ID} onChange={e => setCreateForm({
            ...createForm,
            Product_ID: e.target.value
          })}>
              <option value="" disabled>Choose a finished product</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
            </select>
        {products.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 11,
            marginTop: 4,
            lineHeight: 1.4
          }}>No products yet — add one under Master Data → Products We Make.</p>}
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Total batch quantity</label>
              <input type="number" className="input-field" required min="1" value={createForm.Batch_Quantity} onChange={e => setCreateForm({
              ...createForm,
              Batch_Quantity: e.target.value
            })} />
            </div>
            <div className="input-group">
              <label className="input-label">Pieces inspected</label>
              <input type="number" className="input-field" required min="1" value={createForm.Sample_Size_Inspected} onChange={e => setCreateForm({
              ...createForm,
              Sample_Size_Inspected: e.target.value
            })} />
            </div>
          </div>

          <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-purple) 8%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent-purple)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
            <FileCheck size={16} /> Batch dispatch will remain strictly blocked until formal Product Release Approval is granted.
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create Inspection'}</button>
          </div>
        </form>
      </Modal>

      {/* Record Test Results Modal */}
      {selectedInsp && <Modal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} title={`Record measurements: ${selectedInsp.Insp_ID || selectedInsp.inspectionNumber}`}>
          <form onSubmit={e => runBusy(() => handleUpdateTest(e))}>
            <div className="input-group">
              <label className="input-label">Inspection result</label>
              <select className="input-field" required value={testForm.Inspection_Status} onChange={e => setTestForm({
            ...testForm,
            Inspection_Status: e.target.value
          })}>
                <option value="Pass">Pass (Physical Quality Confirmed)</option>
                <option value="Fail">Fail (Defect Detected)</option>
                <option value="Hold">Hold (Requires Further Testing)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Actual result / test certificate details</label>
              <textarea className="input-field" rows="3" required placeholder="Document actual testing findings vs engineering standards..." value={testForm.Actual_Result} onChange={e => setTestForm({
            ...testForm,
            Actual_Result: e.target.value
          })}></textarea>
            </div>

            <div className="input-group">
              <label className="input-label">Inspector notes</label>
              <input type="text" className="input-field" placeholder="Additional notes..." value={testForm.Remarks} onChange={e => setTestForm({
            ...testForm,
            Remarks: e.target.value
          })} />
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsTestModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Measurements'}</button>
            </div>
          </form>
        </Modal>}

      {/* Product Release Approval Modal */}
      {selectedInsp && <Modal isOpen={isReleaseModalOpen} onClose={() => setIsReleaseModalOpen(false)} title={`Release for dispatch: ${selectedInsp.FG_Batch_Ref || selectedInsp.referenceId}`}>
          <form onSubmit={e => runBusy(() => handleApproveRelease(e))}>
            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              <div>Physical Inspection Status: <strong>{selectedInsp.Inspection_Status || 'Pending'}</strong></div>
              <div>Current Release Status: <strong>{selectedInsp.Release_Status || 'Pending Approval'}</strong></div>
            </div>

            {selectedInsp.Inspection_Status !== 'Pass' && <div style={{
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
                <ShieldAlert size={16} /> Release Dependency Warning: Cannot approve product release unless physical Inspection Status is PASS.
              </div>}

            <div className="input-group">
              <label className="input-label">Release decision</label>
              <select className="input-field" required value={releaseForm.Action_Taken} onChange={e => setReleaseForm({
            ...releaseForm,
            Action_Taken: e.target.value
          })}>
                <option value="Approve Release" disabled={selectedInsp.Inspection_Status !== 'Pass'}>Approve Release (Authorize Dispatch)</option>
                <option value="Reject Release">Reject Release (Quarantine Batch)</option>
                <option value="Request Re-test">Request Re-test</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Approver notes</label>
              <textarea className="input-field" rows="2" placeholder="Quality Manager release comments..." value={releaseForm.Approver_Comments} onChange={e => setReleaseForm({
            ...releaseForm,
            Approver_Comments: e.target.value
          })}></textarea>
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsReleaseModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Releasing…' : 'Release for Dispatch'}</button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default FinalQuality;