import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, PlusCircle, AlertCircle, Save } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
const ProductionOutput = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [outputs, setOutputs] = useState([]);
  const [completedWOs, setCompletedWOs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState('');
  const [activeOutput, setActiveOutput] = useState(null);
  const [isYieldModalOpen, setIsYieldModalOpen] = useState(false);
  const [yieldFormData, setYieldFormData] = useState([]);
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const [v2Res, v1Res] = await Promise.allSettled([axios.get('/production/v2/work-orders'), axios.get('/production/wo')]);
      let list = [];
      if (v2Res.status === 'fulfilled' && v2Res.value.data?.data) {
        list = [...list, ...v2Res.value.data.data];
      }
      if (v1Res.status === 'fulfilled' && v1Res.value.data?.data) {
        list = [...list, ...v1Res.value.data.data];
      }
      // Allow Released, In-Progress, and Completed work orders
      const filtered = list.filter(wo => {
        const s = (wo.Status || wo.status || '').toString();
        return ['Released', 'In Progress', 'In-Progress', 'Completed'].includes(s) || !s;
      });
      setCompletedWOs(filtered.length > 0 ? filtered : list);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/production/v2/output');
      setOutputs(res.data.data);
    } catch (err) {
      console.error('Output fetch error', err);
    }
    setLoading(false);
  };
  const handleCreateDraft = async e => {
    e.preventDefault();
    try {
      await axios.post('/production/v2/output', {
        WO_ID: selectedWO
      });
      setIsNewModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error creating output draft');
    }
  };
  const openYieldModal = output => {
    setActiveOutput(output);
    // Initialize form data from details
    setYieldFormData(output.details.map(d => ({
      yieldDetailId: d._id,
      Material_Name: d.Material_ID?.name || 'Unknown',
      Target_Quantity: d.Target_Quantity,
      Good_Quantity: d.Good_Quantity || 0,
      Rejected_Quantity: d.Rejected_Quantity || 0,
      Scrap_Quantity: d.Scrap_Quantity || 0,
      defectLogs: [] // { Type, Quantity, Notes }
    })));
    setIsYieldModalOpen(true);
  };
  const handleYieldChange = (index, field, value) => {
    const updated = [...yieldFormData];
    updated[index][field] = Number(value);
    setYieldFormData(updated);
  };
  const handleDefectLog = (index, type, qty, notes) => {
    const updated = [...yieldFormData];
    const newLog = {
      Type: type,
      Quantity: Number(qty),
      Notes: notes
    };
    updated[index].defectLogs.push(newLog);
    setYieldFormData(updated);
  };
  const handlePostOutput = async () => {
    try {
      await axios.put(`/production/v2/output/${activeOutput._id}/post`, {
        yields: yieldFormData
      });
      setIsYieldModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error posting output');
    }
  };
  const getStatusBadge = status => {
    const colors = {
      'Draft': {
        bg: 'var(--text-secondary)',
        text: 'var(--text-muted)'
      },
      'Posted': {
        bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
        text: 'var(--accent-success)'
      },
      'Canceled': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      }
    };
    const c = colors[status] || colors['Draft'];
    return <span style={{
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      backgroundColor: c.bg,
      color: c.text
    }}>{status}</span>;
  };
  const columns = [{
    header: 'Output no.',
    accessor: 'Output_No'
  }, {
    header: 'Work Order',
    render: row => <strong style={{
      color: 'var(--text-primary)'
    }}>{row.WO_ID?.WO_Number}</strong>
  }, {
    header: 'Status',
    render: row => getStatusBadge(row.Status)
  }, {
    header: 'Recorded on',
    render: row => new Date(row.Recording_Date).toLocaleString()
  }, {
    header: 'Actions',
    render: row => <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        <button className="btn btn-secondary" style={{
        padding: '4px 12px',
        fontSize: '11px'
      }} onClick={() => openYieldModal(row)}>
          {row.Status === 'Draft' ? 'Edit / Post Yield' : 'View Yield'}
        </button>
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
        }}>Production Output</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Record how many pieces were good, rejected or scrap, then post the good ones into stock.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
          <PlusCircle size={14} /> Add Output Record
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
          <DataTable columns={columns} data={outputs} isLoading={loading} emptyTitle="No output recorded yet" emptyMessage="This is where you enter good, rejected and scrap pieces for a finished work order. Press “Add Output Record” above." />
        </div>
      </div>

      {/* New Draft Modal */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Record production output">
        <form onSubmit={e => runBusy(() => handleCreateDraft(e))}>
          <div className="input-group">
            <label className="input-label">Finished work order</label>
            <select className="input-field" value={selectedWO} onChange={e => setSelectedWO(e.target.value)} required>
              <option value="" disabled>Choose a work order</option>
              {completedWOs.map(wo => <option key={wo._id} value={wo._id}>
                  {wo.WO_Number || wo.workOrderNumber} - {wo.Status || wo.status || 'Active'}
                </option>)}
            </select>
        {completedWOs.length === 0 && <p style={{
            color: 'var(--status-caution-fg)',
            fontSize: 11,
            marginTop: 4,
            lineHeight: 1.4
          }}>No finished work orders yet — finish a job under Production → Run Production.</p>}
          </div>
          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create Output Record'}</button>
          </div>
        </form>
      </Modal>

      {/* Yield/Post Modal */}
      {isYieldModalOpen && activeOutput && <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
          <div style={{
        backgroundColor: 'var(--bg-primary)',
        width: '90%',
        maxWidth: '900px',
        height: '80%',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
            <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
              <h2 style={{
            fontSize: '16px',
            fontWeight: 600
          }}>Yield Details: {activeOutput.Output_No} ({activeOutput.WO_ID?.WO_Number})</h2>
              <button onClick={() => setIsYieldModalOpen(false)} style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '20px'
          }}>&times;</button>
            </div>
            
            <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)'
        }}>
              {activeOutput.Status === 'Posted' && <div style={{
            padding: '12px',
            backgroundColor: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
            color: 'var(--accent-success)',
            borderRadius: '6px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600
          }}>
                  <ClipboardList size={16} /> Posted. The good pieces are now in stock and this record can no longer be changed.
                </div>}
              
              {yieldFormData.map((yd, idx) => <div key={idx} style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            marginBottom: '16px',
            padding: '16px'
          }}>
                  <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
                    <h3 style={{
                fontSize: '14px',
                fontWeight: 600
              }}>Material: {yd.Material_Name}</h3>
                    <span style={{
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>Target: {yd.Target_Quantity}</span>
                  </div>
                  
                  <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '16px'
            }}>
                    <div className="input-group" style={{
                flex: 1
              }}>
                      <label className="input-label" style={{
                  color: 'var(--accent-success)'
                }}>Good pieces</label>
                      <input type="number" className="input-field" value={yd.Good_Quantity} onChange={e => handleYieldChange(idx, 'Good_Quantity', e.target.value)} disabled={activeOutput.Status === 'Posted'} />
                    </div>
                    <div className="input-group" style={{
                flex: 1
              }}>
                      <label className="input-label" style={{
                  color: 'var(--accent-warning)'
                }}>Rejected pieces</label>
                      <input type="number" className="input-field" value={yd.Rejected_Quantity} onChange={e => handleYieldChange(idx, 'Rejected_Quantity', e.target.value)} disabled={activeOutput.Status === 'Posted'} />
                    </div>
                    <div className="input-group" style={{
                flex: 1
              }}>
                      <label className="input-label" style={{
                  color: 'var(--accent-danger)'
                }}>Scrap pieces</label>
                      <input type="number" className="input-field" value={yd.Scrap_Quantity} onChange={e => handleYieldChange(idx, 'Scrap_Quantity', e.target.value)} disabled={activeOutput.Status === 'Posted'} />
                    </div>
                  </div>

                  {/* Defect Logs Section */}
                  {(yd.Rejected_Quantity > 0 || yd.Scrap_Quantity > 0) && activeOutput.Status === 'Draft' && <div style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-danger) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-danger) 25%, transparent)',
              borderRadius: '6px',
              padding: '12px'
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
                        <AlertCircle size={14} /> Defect Codes required for Rejected/Scrap Quantities
                      </div>
                      
                      {yd.defectLogs.map((log, lidx) => <div key={lidx} style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-primary)',
                padding: '6px',
                borderRadius: '4px'
              }}>
                          <span style={{
                  fontWeight: 600,
                  color: log.Type === 'Rejected' ? 'var(--accent-warning)' : 'var(--accent-danger)'
                }}>[{log.Type}]</span>
                          <span>Qty: {log.Quantity}</span>
                          <span style={{
                  color: 'var(--text-secondary)'
                }}>Note: {log.Notes || 'None'}</span>
                        </div>)}
                      
                      <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end',
                marginTop: '12px'
              }}>
                        <div style={{
                  flex: 1
                }}>
                          <select id={`dType-${idx}`} className="input-field" style={{
                    padding: '6px',
                    fontSize: '11px'
                  }}>
                            <option value="Rejected">Rejected</option>
                            <option value="Scrapped">Scrapped</option>
                          </select>
                        </div>
                        <div style={{
                  flex: 1
                }}>
                          <input id={`dQty-${idx}`} type="number" placeholder="Qty" className="input-field" style={{
                    padding: '6px',
                    fontSize: '11px'
                  }} />
                        </div>
                        <div style={{
                  flex: 2
                }}>
                          <input id={`dNote-${idx}`} type="text" placeholder="Note" className="input-field" style={{
                    padding: '6px',
                    fontSize: '11px'
                  }} />
                        </div>
                        <button className="btn btn-secondary" style={{
                  padding: '6px 12px',
                  fontSize: '11px'
                }} onClick={() => {
                  const t = document.getElementById(`dType-${idx}`).value;
                  const q = document.getElementById(`dQty-${idx}`).value;
                  const n = document.getElementById(`dNote-${idx}`).value;
                  if (q) handleDefectLog(idx, t, q, n);
                }}>Add Rejection Line</button>
                      </div>
                    </div>}
                  
                  {activeOutput.Status === 'Posted' && <div style={{
              marginTop: '12px'
            }}>
                       <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}>Recorded Defect Logs</div>
                       {activeOutput.details[idx]?.qualityLogs?.map((log, lidx) => <div key={lidx} style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '4px',
                fontSize: '11px'
              }}>
                            <span style={{
                  fontWeight: 600,
                  color: log.Defect_Type === 'Rejected' ? 'var(--accent-warning)' : 'var(--accent-danger)'
                }}>[{log.Defect_Type}]</span>
                            <span>Qty: {log.Affected_Quantity}</span>
                            <span style={{
                  color: 'var(--text-secondary)'
                }}>Note: {log.Notes || 'None'}</span>
                          </div>)}
                     </div>}
                </div>)}
            </div>
            
            <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsYieldModalOpen(false)}>Close</button>
              {activeOutput.Status === 'Draft' && <button type="button" className="btn btn-primary" onClick={() => runBusy(() => handlePostOutput())} disabled={busy} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
                  <Save size={14} /> {busy ? 'Posting to stock…' : 'Post to Inventory'}
                </button>}
            </div>
          </div>
        </div>}
    </div>;
};
export default ProductionOutput;