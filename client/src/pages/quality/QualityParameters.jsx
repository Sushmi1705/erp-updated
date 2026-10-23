import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Ruler, Scale, Target, ActivitySquare, AlertTriangle, CheckCircle } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
const QualityParameters = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [parameters, setParameters] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDefModalOpen, setIsDefModalOpen] = useState(false);
  const [isMeasModalOpen, setIsMeasModalOpen] = useState(false);
  const [selectedParam, setSelectedParam] = useState(null);
  const [defForm, setDefForm] = useState({
    Material_ID: '',
    Parameter_Name: '',
    Standard_Target: 50.0,
    Tolerance_Upper: 0.5,
    Tolerance_Lower: 0.5
  });
  const [measForm, setMeasForm] = useState({
    Measured_Value: 50.0,
    Source_Context: 'Standalone'
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const matRes = await axios.get('/master/material');
      if (matRes.data?.data) {
        setMaterials(matRes.data.data);
      }
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/quality/v2/parameter');
      setParameters(res.data.data);
    } catch (err) {
      console.error('Parameter fetch error', err);
    }
    setLoading(false);
  };
  const handleSaveDef = async e => {
    e.preventDefault();
    try {
      await axios.post('/quality/v2/parameter', defForm);
      setIsDefModalOpen(false);
      setDefForm({
        Material_ID: '',
        Parameter_Name: '',
        Standard_Target: 50.0,
        Tolerance_Upper: 0.5,
        Tolerance_Lower: 0.5
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error defining parameter standard');
    }
  };
  const handleSaveMeasurement = async e => {
    e.preventDefault();
    try {
      const res = await axios.post(`/quality/v2/parameter/${selectedParam._id}/measurement`, measForm);
      setIsMeasModalOpen(false);
      fetchData();
      notify.error(res.data.pass ? 'Measurement PASSED tolerance check!' : 'Measurement FAILED tolerance check!');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error recording measurement');
    }
  };
  const actionRenderer = row => {
    return <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        <button onClick={() => {
        setSelectedParam(row);
        setMeasForm({
          Measured_Value: row.Standard_Target,
          Source_Context: 'Standalone'
        });
        setIsMeasModalOpen(true);
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
          <ActivitySquare size={12} /> Record Reading
        </button>
      </div>;
  };
  const columns = [{
    header: 'Material or product',
    render: row => <strong>{row.Material_ID?.name || row.materialId?.name} ({row.Material_ID?.code || row.materialId?.code || 'Material'})</strong>
  }, {
    header: 'What is measured',
    render: row => <span style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontWeight: 600
    }}>
        <Target size={14} color="var(--accent-primary)" /> {row.Parameter_Name || row.parameterType}
      </span>
  }, {
    header: 'Target value',
    render: row => <strong>{row.Standard_Target ?? row.standardValue}</strong>
  }, {
    header: 'Allowed variation (+/-)',
    render: row => {
      const upper = row.Tolerance_Upper ?? row.tolerancePlus;
      const lower = row.Tolerance_Lower ?? row.toleranceMinus;
      return <span style={{
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>+{upper} / -{lower}</span>;
    }
  }, {
    header: 'Pass range',
    render: row => {
      const target = row.Standard_Target ?? row.standardValue ?? 0;
      const upper = row.Tolerance_Upper ?? row.tolerancePlus ?? 0;
      const lower = row.Tolerance_Lower ?? row.toleranceMinus ?? 0;
      return <span style={{
        fontSize: '11px',
        color: 'var(--accent-primary)',
        fontWeight: 600
      }}>[{(target - lower).toFixed(2)} - {(target + upper).toFixed(2)}]</span>;
    }
  }, {
    header: 'Readings taken',
    render: row => `${row.Total_Readings_Count || row.recordedMeasurements?.length || 0} Records`
  }, {
    header: 'Last result',
    render: row => {
      const last = row.latestLog || (row.recordedMeasurements?.length ? row.recordedMeasurements[row.recordedMeasurements.length - 1] : null);
      if (!last) return <span style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>No Readings</span>;
      const val = last.Measured_Value ?? last.value;
      const isPass = last.Calculated_Status ? last.Calculated_Status === 'Pass' : last.pass;
      return <span style={{
        color: isPass ? 'var(--accent-success)' : 'var(--accent-danger)',
        fontWeight: 600,
        fontSize: '12px'
      }}>
          {val} ({isPass ? 'PASS' : 'FAIL'})
        </span>;
    }
  }];
  const minBound = selectedParam ? selectedParam.Standard_Target - selectedParam.Tolerance_Lower : 0;
  const maxBound = selectedParam ? selectedParam.Standard_Target + selectedParam.Tolerance_Upper : 0;
  const measVal = Number(measForm.Measured_Value);
  const isPassCheck = measVal >= minBound && measVal <= maxBound;
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
        }}>Inspection Parameters</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Set what to measure on each part and the allowed limits, so an inspector knows pass from fail.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsDefModalOpen(true)}>
          <Target size={14} /> Add Parameter
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
          <DataTable columns={columns} data={parameters} isLoading={loading} emptyTitle="No inspection parameters yet" emptyMessage="Set what to measure on each part and the allowed limits, so inspectors know pass from fail. Press “Add Parameter” above." customActions={actionRenderer} />
        </div>
      </div>

      {/* Define Quality Standard Modal */}
      <Modal isOpen={isDefModalOpen} onClose={() => setIsDefModalOpen(false)} title="Add an inspection parameter">
        <form onSubmit={e => runBusy(() => handleSaveDef(e))}>
          <div className="input-group">
            <label className="input-label">Material or finished part</label>
            <select className="input-field" required value={defForm.Material_ID} onChange={e => setDefForm({
            ...defForm,
            Material_ID: e.target.value
          })}>
              <option value="" disabled>Choose a material</option>
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
              <label className="input-label">What is measured</label>
              <input type="text" className="input-field" required placeholder="e.g. Thickness, Hardness" value={defForm.Parameter_Name} onChange={e => setDefForm({
              ...defForm,
              Parameter_Name: e.target.value
            })} />
            </div>
            <div className="input-group">
              <label className="input-label">Target value</label>
              <input type="number" step="any" className="input-field" required value={defForm.Standard_Target} onChange={e => setDefForm({
              ...defForm,
              Standard_Target: e.target.value
            })} />
            </div>
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Allowed above target (+)</label>
              <input type="number" step="any" className="input-field" required min="0" value={defForm.Tolerance_Upper} onChange={e => setDefForm({
              ...defForm,
              Tolerance_Upper: e.target.value
            })} />
            </div>
            <div className="input-group">
              <label className="input-label">Allowed below target (-)</label>
              <input type="number" step="any" className="input-field" required min="0" value={defForm.Tolerance_Lower} onChange={e => setDefForm({
              ...defForm,
              Tolerance_Lower: e.target.value
            })} />
            </div>
          </div>

          <div style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent-primary)'
        }}>
            Calculated Acceptable Range: <strong>[{(Number(defForm.Standard_Target) - Number(defForm.Tolerance_Lower)).toFixed(2)} - {(Number(defForm.Standard_Target) + Number(defForm.Tolerance_Upper)).toFixed(2)}]</strong>
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsDefModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Parameter'}</button>
          </div>
        </form>
      </Modal>

      {/* Log Measurement Modal */}
      {selectedParam && <Modal isOpen={isMeasModalOpen} onClose={() => setIsMeasModalOpen(false)} title={`Record a reading: ${selectedParam.Parameter_Name}`}>
          <form onSubmit={e => runBusy(() => handleSaveMeasurement(e))}>
            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              <div>Standard Target: <strong>{selectedParam.Standard_Target}</strong></div>
              <div>Inclusive Tolerances: Lower <strong>-{selectedParam.Tolerance_Lower}</strong> | Upper <strong>+{selectedParam.Tolerance_Upper}</strong></div>
              <div style={{
            color: 'var(--accent-primary)',
            marginTop: '4px'
          }}>Acceptable Bounds: <strong>[{minBound.toFixed(2)} - {maxBound.toFixed(2)}]</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">Measured reading</label>
              <input type="number" step="any" className="input-field" required value={measForm.Measured_Value} onChange={e => setMeasForm({
            ...measForm,
            Measured_Value: e.target.value
          })} />
            </div>

            <div style={{
          backgroundColor: isPassCheck ? 'color-mix(in srgb, var(--accent-success) 8%, transparent)' : 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: isPassCheck ? 'var(--accent-success)' : 'var(--accent-danger)',
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
              {isPassCheck ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              <span>Live Evaluation: Reading {measVal} will evaluate as <strong>{isPassCheck ? 'PASS' : 'FAIL'}</strong></span>
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsMeasModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Check & Save Reading'}</button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default QualityParameters;