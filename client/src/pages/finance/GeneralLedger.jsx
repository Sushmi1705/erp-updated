import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Share, Activity, RotateCcw, Plus, AlertCircle, CheckCircle2, Lock, Trash2 } from 'lucide-react';
import PeriodClose from './PeriodClose';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

/* Guidance, not an error: nothing has failed — the record simply does not exist
   yet, and the sentence has to name what to create and where. Caution amber. */
const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: 'var(--font-caption)',
  marginTop: 'var(--space-2)',
  lineHeight: 'var(--leading-normal)'
};
const GeneralLedger = () => {
  const [entries, setEntries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('journal'); // journal, transactions
  // Posting and reversing both go to the server, and posting is irreversible.
  // The button has to say it is working, or the user presses it twice.
  const [busyAction, setBusyAction] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({
    Entry_Date: new Date().toISOString().split('T')[0],
    Source_Module: 'Manual',
    Description: '',
    lines: [{
      Account_ID: '',
      Type: 'Debit',
      Amount: '',
      Reference_Type: 'General',
      Reference_ID: ''
    }, {
      Account_ID: '',
      Type: 'Credit',
      Amount: '',
      Reference_Type: 'General',
      Reference_ID: ''
    }]
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, [activeTab]);
  const fetchDependencies = async () => {
    try {
      const coaRes = await axios.get('/finance/v2/gl/coa');
      if (coaRes.data?.data) {
        setCoaList(coaRes.data.data);
        if (coaRes.data.data.length >= 2 && !entryForm.lines[0].Account_ID) {
          const nonControl = coaRes.data.data.filter(a => !a.Is_Control_Account);
          setEntryForm(prev => ({
            ...prev,
            lines: [{
              ...prev.lines[0],
              Account_ID: nonControl[0]?._id || coaRes.data.data[0]._id
            }, {
              ...prev.lines[1],
              Account_ID: nonControl[1]?._id || coaRes.data.data[1]._id
            }]
          }));
        }
      }
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'journal') {
        const res = await axios.get('/finance/v2/gl/entries');
        setEntries(res.data.data);
      } else if (activeTab === 'transactions') {
        const res = await axios.get('/finance/v2/gl/transactions');
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error('Data fetch error', err);
    }
    setLoading(false);
  };
  const handleCreateEntry = async e => {
    e.preventDefault();
    setBusyAction('create');
    try {
      await axios.post('/finance/v2/gl/entries', entryForm);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error creating journal entry');
    }
    setBusyAction(null);
  };
  const handlePostEntry = async entryId => {
    if (!await confirmAction('Post this entry to the ledger? Once posted it cannot be edited — only reversed.')) return;
    setBusyAction('post-' + entryId);
    try {
      await axios.put(`/finance/v2/gl/entries/${entryId}/post`);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error posting journal entry');
    }
    setBusyAction(null);
  };
  const handleDeleteEntry = async row => {
    if (!(await confirmAction(`Delete draft ${row.Entry_ID || 'entry'}? Nothing has been posted to the ledger, so this only removes the draft.`))) return;
    setBusyAction('delete-' + row._id);
    try {
      await axios.delete(`/finance/v2/gl/entries/${row._id}`);
      notify.success('Draft deleted.');
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not delete this draft.');
    }
    setBusyAction(null);
  };
  const handleReverseEntry = async entryId => {
    if (!await confirmAction('Create an opposite entry that cancels this one? The original entry stays in the ledger.')) return;
    setBusyAction('reverse-' + entryId);
    try {
      await axios.post(`/finance/v2/gl/entries/${entryId}/reverse`);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error reversing journal entry');
    }
    setBusyAction(null);
  };
  const actionRenderer = row => {
    if (activeTab === 'journal') {
      if (row.Status === 'Draft') {
        const posting = busyAction === 'post-' + row._id;
        return <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => handlePostEntry(row._id)} disabled={posting} className="btn-icon" style={{
          fontSize: '11px',
          color: 'var(--accent-text)',
          background: 'none',
          border: 'none',
          cursor: posting ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600
        }}>
            <Share size={12} /> {posting ? 'Posting…' : 'Post to ledger'}
          </button>
          <button onClick={() => handleDeleteEntry(row)} disabled={busyAction === 'delete-' + row._id} className="btn-icon" aria-label="Delete draft" title="Delete this draft" style={{
          fontSize: '11px',
          color: 'var(--accent-danger)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600
        }}>
            <Trash2 size={12} /> Delete draft
          </button>
        </div>;
      } else if (row.Status === 'Posted') {
        const reversing = busyAction === 'reverse-' + row._id;
        return <button onClick={() => handleReverseEntry(row._id)} disabled={reversing} className="btn-icon" style={{
          fontSize: '11px',
          color: 'var(--accent-text)',
          background: 'none',
          border: 'none',
          cursor: reversing ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600
        }}>
            <RotateCcw size={12} /> {reversing ? 'Cancelling…' : 'Cancel with opposite entry'}
          </button>;
      }
    }
    return null;
  };
  const journalColumns = [{
    header: 'Entry number',
    render: row => <strong>{row.Entry_Number || row.Entry_ID}</strong>
  }, {
    header: 'Entry date',
    render: row => new Date(row.Entry_Date).toLocaleDateString()
  }, {
    header: 'Came from',
    render: row => <span style={{
      fontSize: '12px',
      fontWeight: 500
    }}>{row.Source_Module}</span>
  }, {
    header: 'What it is for',
    accessor: 'Description'
  }, {
    header: 'Total debit',
    align: 'right',
    render: row => <strong>{fmtMoneyFull(row.totalDebits)}</strong>
  }, {
    header: 'Total credit',
    align: 'right',
    render: row => <strong>{fmtMoneyFull(row.totalCredits)}</strong>
  }, {
    header: 'Do the two sides match?',
    render: row => <span style={{
      fontSize: '11px',
      fontWeight: 600,
      color: row.isBalanced ? 'var(--status-positive-fg)' : 'var(--status-negative-fg)'
    }}>
        {row.isBalanced ? 'Yes, they match' : 'No — debit and credit differ'}
      </span>
  }, {
    header: 'Status',
    render: row => <StatusBadge value={row.Status} />
  }];
  const transactionColumns = [{
    header: 'Account number',
    render: row => <strong>{row.accountNumber}</strong>
  }, {
    header: 'Account name',
    render: row => <div>
        <strong>{row.accountName}</strong>
        {row.isControlAccount && <span title="This account is filled automatically from Money In or Money Out — it cannot be posted to by hand" style={{
        marginLeft: '6px',
        padding: '1px 6px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--status-neutral-bg)',
        border: '1px solid var(--status-neutral-border)',
        color: 'var(--status-neutral-fg)',
        fontSize: '10px',
        fontWeight: 600
      }}>Filled automatically</span>}
      </div>
  }, {
    header: 'Kind of account',
    render: row => <span style={{
      fontSize: '12px',
      fontWeight: 500
    }}>{row.accountType}</span>
  }, {
    header: 'Total debit',
    align: 'right',
    render: row => <span>{fmtMoneyFull(row.totalDebits)}</span>
  }, {
    header: 'Total credit',
    align: 'right',
    render: row => <span>{fmtMoneyFull(row.totalCredits)}</span>
  }, {
    header: 'Change this period',
    align: 'right',
    render: row => <span style={{
      fontWeight: 600
    }}>{fmtMoneyFull(row.netChange)}</span>
  }, {
    header: 'Balance now',
    align: 'right',
    render: row => <strong>{fmtMoneyFull(row.endingBalance)}</strong>
  }];

  // Calculate live modal balancing state
  const modalDebits = entryForm.lines.filter(l => l.Type === 'Debit').reduce((sum, l) => sum + (Number(l.Amount) || 0), 0);
  const modalCredits = entryForm.lines.filter(l => l.Type === 'Credit').reduce((sum, l) => sum + (Number(l.Amount) || 0), 0);
  const isModalBalanced = Math.abs(modalDebits - modalCredits) < 0.01 && modalDebits > 0;
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
        }}>General Ledger</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Every accounting entry in one place. Make an entry by hand, post it to the ledger, and see the running balance of each account. Used by accounts staff.</p>
        </div>
        {activeTab === 'journal' && <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <BookOpen size={14} /> Add Journal Entry
          </button>}
      </div>

      {/* Tabs matching screenshot design */}
      <div style={{
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
      borderBottom: '1px solid var(--border-color)'
    }}>
        <button role="tab" aria-selected={activeTab === 'journal'} onClick={() => setActiveTab('journal')} style={{
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        borderBottom: activeTab === 'journal' ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === 'journal' ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <BookOpen size={16} /> Journal entries
        </button>
        <button role="tab" aria-selected={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} style={{
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        borderBottom: activeTab === 'transactions' ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === 'transactions' ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <Activity size={16} /> Account balances
        </button>
        <button role="tab" aria-selected={activeTab === 'periods'} onClick={() => setActiveTab('periods')} style={{
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        borderBottom: activeTab === 'periods' ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === 'periods' ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <Lock size={16} /> Month close
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
          {activeTab === 'periods' ? <PeriodClose /> : <DataTable
            columns={activeTab === 'journal' ? journalColumns : transactionColumns}
            data={activeTab === 'journal' ? entries : transactions}
            isLoading={loading}
            customActions={activeTab === 'journal' ? actionRenderer : null}
            emptyTitle={activeTab === 'journal' ? 'No journal entries yet' : 'No account balances yet'}
            emptyMessage={activeTab === 'journal'
              ? 'A journal entry moves money between two accounts — one debit, one credit of the same amount. Use Add Journal Entry above.'
              : 'Balances appear here once journal entries have been posted to the ledger.'}
          />}
        </div>
      </div>

      {/* Modal: Create Balanced Journal Entry */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add a journal entry">
        <form onSubmit={handleCreateEntry}>
          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Entry date</label>
              <input type="date" className="input-field" required value={entryForm.Entry_Date} onChange={e => setEntryForm({
              ...entryForm,
              Entry_Date: e.target.value
            })} />
            </div>

            <div className="input-group">
              <label className="input-label">Where does this entry come from?</label>
              <select className="input-field" value={entryForm.Source_Module} onChange={e => setEntryForm({
              ...entryForm,
              Source_Module: e.target.value
            })}>
                <option value="Manual">Entered by hand</option>
                <option value="AR">Money In (customer invoices)</option>
                <option value="AP">Money Out (supplier bills)</option>
                <option value="Inventory">Stock adjustment</option>
                <option value="System">Posted automatically by the system</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">What is this entry for?</label>
            <input type="text" className="input-field" required placeholder="e.g. monthly electricity and office expenses" value={entryForm.Description} onChange={e => setEntryForm({
            ...entryForm,
            Description: e.target.value
          })} />
          </div>

          {/* Line 1: Debit */}
          <div style={{
          border: '1px solid var(--border-color)',
          padding: '12px',
          borderRadius: '6px',
          marginTop: '12px',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
            <label className="input-label" style={{
            fontWeight: 600
          }}>Line 1 — account to debit (money going in)</label>
            <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '12px'
          }}>
              <select className="input-field" required value={entryForm.lines[0].Account_ID} onChange={e => {
              const newLines = [...entryForm.lines];
              newLines[0].Account_ID = e.target.value;
              setEntryForm({
                ...entryForm,
                lines: newLines
              });
            }}>
                <option value="" disabled>Select an account</option>
                {coaList.map(a => <option key={a._id} value={a._id} disabled={entryForm.Source_Module === 'Manual' && a.Is_Control_Account}>
                    {a.Account_Number} - {a.Account_Name} ({a.Account_Type}) {a.Is_Control_Account ? '— filled automatically, cannot be used here' : ''}
                  </option>)}
              </select>
        {coaList.length === 0 && <p style={hintStyle}>No accounts set up yet — add them under Finance &gt; Chart of Accounts, then come back here.</p>}
              <select className="input-field" value="Debit" disabled><option value="Debit">Debit</option></select>
              <input type="number" step="0.01" className="input-field" required min="0.01" value={entryForm.lines[0].Amount} onChange={e => {
              const val = Number(e.target.value);
              const newLines = [...entryForm.lines];
              newLines[0].Amount = val;
              newLines[1].Amount = val; // auto-balance default for 2 lines
              setEntryForm({
                ...entryForm,
                lines: newLines
              });
            }} />
            </div>
          </div>

          {/* Line 2: Credit */}
          <div style={{
          border: '1px solid var(--border-color)',
          padding: '12px',
          borderRadius: '6px',
          marginTop: '12px',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
            <label className="input-label" style={{
            fontWeight: 600
          }}>Line 2 — account to credit (money coming out)</label>
            <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '12px'
          }}>
              <select className="input-field" required value={entryForm.lines[1].Account_ID} onChange={e => {
              const newLines = [...entryForm.lines];
              newLines[1].Account_ID = e.target.value;
              setEntryForm({
                ...entryForm,
                lines: newLines
              });
            }}>
                <option value="" disabled>Select an account</option>
                {coaList.map(a => <option key={a._id} value={a._id} disabled={entryForm.Source_Module === 'Manual' && a.Is_Control_Account}>
                    {a.Account_Number} - {a.Account_Name} ({a.Account_Type}) {a.Is_Control_Account ? '— filled automatically, cannot be used here' : ''}
                  </option>)}
              </select>
        {coaList.length === 0 && <p style={hintStyle}>No accounts set up yet — add them under Finance &gt; Chart of Accounts, then come back here.</p>}
              <select className="input-field" value="Credit" disabled><option value="Credit">Credit</option></select>
              <input type="number" step="0.01" className="input-field" required min="0.01" value={entryForm.lines[1].Amount} onChange={e => {
              const newLines = [...entryForm.lines];
              newLines[1].Amount = Number(e.target.value);
              setEntryForm({
                ...entryForm,
                lines: newLines
              });
            }} />
            </div>
          </div>

          {/* Live Balancing Verification Indicator */}
          <div style={{
          padding: '12px',
          borderRadius: '6px',
          marginTop: '12px',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isModalBalanced ? 'var(--status-positive-bg)' : 'var(--status-caution-bg)',
          border: isModalBalanced ? '1px solid var(--status-positive-border)' : '1px solid var(--status-caution-border)',
          color: isModalBalanced ? 'var(--status-positive-fg)' : 'var(--status-caution-fg)'
        }}>
            <span>Debit <strong>{fmtMoneyFull(modalDebits)}</strong> against credit <strong>{fmtMoneyFull(modalCredits)}</strong></span>
            <strong>{isModalBalanced ? 'The two sides match — you can save' : 'The two sides must be equal before you can save'}</strong>
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!isModalBalanced || busyAction === 'create'}>{busyAction === 'create' ? 'Saving…' : 'Save as draft'}</button>
          </div>
        </form>
      </Modal>
    </div>;
};
export default GeneralLedger;