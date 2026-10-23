import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, TrendingUp, RefreshCw, Calendar, Clock, CheckCircle } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
const OperatorManagement = () => {
  /* Slow saves used to leave the button looking untouched, so operators pressed
     it again and again and the record went in twice. Every form submit runs
     through here: the button greys out and says what it is doing. */
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const [operators, setOperators] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState(null);
  const [profileForm, setProfileForm] = useState({
    Operator_Name: '',
    Emp_ID: '',
    Skill_Level: 'Standard',
    Status: 'Active'
  });
  const [shiftForm, setShiftForm] = useState({
    Shift_ID: 'Morning',
    Attendance_Status: 'Present'
  });
  const [reassignForm, setReassignForm] = useState({
    WO_ID: ''
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);
  const fetchDependencies = async () => {
    try {
      const [v2Res, v1Res] = await Promise.allSettled([axios.get('/production/v2/work-orders'), axios.get('/production/wo')]);
      let list = [];
      if (v2Res.status === 'fulfilled' && v2Res.value.data?.data) list = [...list, ...v2Res.value.data.data];
      if (v1Res.status === 'fulfilled' && v1Res.value.data?.data) list = [...list, ...v1Res.value.data.data];
      setWorkOrders(list);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/shopfloor/v2/operator');
      setOperators(res.data.data);
    } catch (err) {
      console.error('Operator fetch error', err);
    }
    setLoading(false);
  };
  const handleCreateProfile = async e => {
    e.preventDefault();
    try {
      await axios.post('/shopfloor/v2/operator', profileForm);
      setIsProfileModalOpen(false);
      setProfileForm({
        Operator_Name: '',
        Emp_ID: '',
        Skill_Level: 'Standard',
        Status: 'Active'
      });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error creating operator profile');
    }
  };
  const handleAssignShift = async e => {
    e.preventDefault();
    try {
      await axios.post(`/shopfloor/v2/operator/${selectedOp._id}/shift`, shiftForm);
      setIsShiftModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error assigning shift');
    }
  };
  const handleAllocateTask = async e => {
    e.preventDefault();
    try {
      await axios.post(`/shopfloor/v2/operator/${selectedOp._id}/allocate`, reassignForm);
      setIsReassignModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error allocating work order');
    }
  };
  const triggerProductivityCalc = async opId => {
    try {
      await axios.put(`/shopfloor/v2/operator/${opId}/productivity`, {});
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error calculating productivity');
    }
  };
  const getAttendanceBadge = shift => {
    if (!shift) return <span style={{
      color: 'var(--text-secondary)',
      fontSize: '11px'
    }}>Not Scheduled</span>;
    const colors = {
      'Present': {
        bg: 'color-mix(in srgb, var(--accent-success) 8%, transparent)',
        text: 'var(--accent-success)'
      },
      'Absent': {
        bg: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
        text: 'var(--accent-danger)'
      },
      'Scheduled': {
        bg: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
        text: 'var(--accent-primary)'
      }
    };
    const c = colors[shift.Attendance_Status] || colors['Scheduled'];
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }}>
        <span style={{
        fontWeight: 600
      }}>{shift.Shift_ID} Shift</span>
        <span style={{
        padding: '2px 6px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 600,
        backgroundColor: c.bg,
        color: c.text,
        width: 'fit-content'
      }}>
          {shift.Attendance_Status}
        </span>
      </div>;
  };
  const actionRenderer = row => {
    return <div style={{
      display: 'flex',
      gap: '8px'
    }}>
        <button onClick={() => {
        setSelectedOp(row);
        setShiftForm({
          Shift_ID: row.shift?.Shift_ID || 'Morning',
          Attendance_Status: row.shift?.Attendance_Status || 'Present'
        });
        setIsShiftModalOpen(true);
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
          <Clock size={12} /> Set Shift
        </button>
        <button onClick={() => {
        setSelectedOp(row);
        setReassignForm({
          WO_ID: row.activeTask?.WO_ID?._id || ''
        });
        setIsReassignModalOpen(true);
      }} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--accent-success)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
          <RefreshCw size={12} /> Reassign
        </button>
        <button disabled={busy} onClick={() => runBusy(() => triggerProductivityCalc(row._id), row._id)} className="btn-icon" style={{
        fontSize: '11px',
        color: 'var(--accent-primary)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
          <TrendingUp size={12} /> Work Out Output
        </button>
      </div>;
  };
  const columns = [{
    header: 'Operator',
    render: row => <div>
        <strong style={{
        color: 'var(--text-primary)'
      }}>{row.Operator_Name || row.operatorName}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>Skill: {row.Skill_Level || 'Standard'}</div>
      </div>
  }, {
    header: 'Employee no.',
    render: row => row.Emp_ID || row.employeeId
  }, {
    header: 'Shift and attendance',
    render: row => getAttendanceBadge(row.shift)
  }, {
    header: 'Working on now',
    render: row => {
      const woNum = row.activeTask?.WO_ID?.WO_Number || row.activeTask?.WO_ID?.workOrderNumber || row.workOrderId?.workOrderNumber;
      if (!woNum) {
        return <span style={{
          color: 'var(--accent-warning)',
          fontWeight: 600,
          fontSize: '12px',
          padding: '2px 8px',
          backgroundColor: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
          borderRadius: '4px'
        }}>Unassigned</span>;
      }
      return <strong style={{
        color: 'var(--accent-success)'
      }}>{woNum}</strong>;
    }
  }, {
    header: 'Output score',
    render: row => {
      const score = row.metric?.Productivity_Score !== undefined ? row.metric.Productivity_Score : row.productivityScore || 100;
      return <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '110px'
      }}>
          <div style={{
          flex: 1,
          height: '6px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
            <div style={{
            height: '100%',
            width: `${score}%`,
            backgroundColor: score > 85 ? 'var(--accent-success)' : score > 70 ? 'var(--accent-warning)' : 'var(--accent-danger)'
          }}></div>
          </div>
          <span style={{
          fontSize: '12px',
          fontWeight: 600
        }}>{score}%</span>
        </div>;
    }
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
        }}>Operators</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Assign operators to shifts and work orders, and see how much each one produced.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsProfileModalOpen(true)}>
          <Users size={14} /> Add Operator
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
          <DataTable columns={columns} data={operators} isLoading={loading} emptyTitle="No operators added yet" emptyMessage="Add each press operator once, then assign shifts and work orders to them. Press “Add Operator” above." customActions={actionRenderer} />
        </div>
      </div>

      {/* New Profile Modal */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Add an operator">
        <form onSubmit={e => runBusy(() => handleCreateProfile(e))}>
          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Operator name</label>
              <input type="text" className="input-field" required value={profileForm.Operator_Name} onChange={e => setProfileForm({
              ...profileForm,
              Operator_Name: e.target.value
            })} />
            </div>
            <div className="input-group">
              <label className="input-label">Employee number</label>
              <input type="text" className="input-field" required value={profileForm.Emp_ID} onChange={e => setProfileForm({
              ...profileForm,
              Emp_ID: e.target.value
            })} />
            </div>
          </div>
          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Skill level</label>
              <select className="input-field" value={profileForm.Skill_Level} onChange={e => setProfileForm({
              ...profileForm,
              Skill_Level: e.target.value
            })}>
                <option value="Trainee">Trainee</option>
                <option value="Standard">Standard</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input-field" value={profileForm.Status} onChange={e => setProfileForm({
              ...profileForm,
              Status: e.target.value
            })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>
          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsProfileModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Operator'}</button>
          </div>
        </form>
      </Modal>

      {/* Shift & Attendance Modal */}
      {selectedOp && <Modal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} title={`Shift and attendance: ${selectedOp.Operator_Name || selectedOp.operatorName}`}>
          <form onSubmit={e => runBusy(() => handleAssignShift(e))}>
            <div className="input-group">
              <label className="input-label">Shift</label>
              <select className="input-field" value={shiftForm.Shift_ID} onChange={e => setShiftForm({
            ...shiftForm,
            Shift_ID: e.target.value
          })}>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Attendance</label>
              <select className="input-field" value={shiftForm.Attendance_Status} onChange={e => setShiftForm({
            ...shiftForm,
            Attendance_Status: e.target.value
          })}>
                <option value="Scheduled">Scheduled</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsShiftModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Attendance'}</button>
            </div>
          </form>
        </Modal>}

      {/* Reassign Work Order Modal */}
      {selectedOp && <Modal isOpen={isReassignModalOpen} onClose={() => setIsReassignModalOpen(false)} title={`Reassign work order: ${selectedOp.Operator_Name || selectedOp.operatorName}`}>
          <form onSubmit={e => runBusy(() => handleAllocateTask(e))}>
            <div className="input-group">
              <label className="input-label">Work order</label>
              <select className="input-field" value={reassignForm.WO_ID} onChange={e => setReassignForm({
            ...reassignForm,
            WO_ID: e.target.value
          })}>
                <option value="" disabled>Take off this work order</option>
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
          fontSize: '11px',
          color: 'var(--text-secondary)',
          marginBottom: '12px'
        }}>
              Note: Reassigning will automatically pause/complete any previous active allocation for this operator. Operator must be marked 'Present'.
            </div>
            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsReassignModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Assigning…' : 'Assign Work Order'}</button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default OperatorManagement;