import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, LogIn, Monitor, FileClock } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

/* Display names only — the stored values stay CREATE/UPDATE/DELETE. */
const ACTION_LABEL = {
  CREATE: 'Added',
  UPDATE: 'Changed',
  DELETE: 'Deleted'
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (activeTab === 'transactions') fetchLogs();
    else fetchLoginHistory();
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/audit/logs');
      setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchLoginHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/audit/login-history');
      setLoginHistory(res.data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const transactionColumns = [
    { header: 'What happened', render: (row) => ACTION_LABEL[row.action] || row.action },
    { header: 'Screen', accessor: 'module' },
    { header: 'Who did it', render: (row) => {
      const name = row.changedBy ? `${row.changedBy.firstName || ''} ${row.changedBy.lastName || ''}`.trim() : '';
      return name ? name : 'System';
    }},
    { header: 'Computer address (IP)', accessor: 'ipAddress' },
    { header: 'When', render: (row) => new Date(row.createdAt).toLocaleString('en-IN') },
    { header: 'Details', render: (row) => (
      <button onClick={() => setSelectedLog(row)} title="See exactly what changed" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
        <FileClock size={18} />
      </button>
    )}
  ];

  const loginColumns = [
    { header: 'Result', render: (row) => <StatusBadge value={row.status} /> },
    { header: 'Who', render: (row) => row.userId ? `${row.userId.firstName} ${row.userId.lastName}` : row.email },
    { header: 'Computer address (IP)', accessor: 'ipAddress' },
    { header: 'Device used', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.userAgent}>
        <Monitor size={14} /> {row.userAgent || 'Not recorded'}
      </div>
    )},
    { header: 'When', render: (row) => new Date(row.createdAt).toLocaleString('en-IN') }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-title)', fontWeight: 'var(--weight-semibold)' }}>Change History (Audit)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-label)', marginTop: 'var(--space-1)' }}>
            A record of who changed what, and when, plus every login attempt. Read-only — nothing here can be edited.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', backgroundColor: 'var(--bg-tertiary)' }}>
          <button
            role="tab" aria-selected={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              borderBottom: activeTab === 'transactions' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'transactions' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'transactions' ? 600 : 500, backgroundColor: activeTab === 'transactions' ? 'var(--bg-primary)' : 'transparent',
              fontSize: '13px'
            }}
          >
            <Activity size={14} /> Record changes
          </button>
          <button
            role="tab" aria-selected={activeTab === 'logins'} onClick={() => setActiveTab('logins')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              borderBottom: activeTab === 'logins' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'logins' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'logins' ? 600 : 500, backgroundColor: activeTab === 'logins' ? 'var(--bg-primary)' : 'transparent',
              fontSize: '13px'
            }}
          >
            <LogIn size={14} /> Login attempts
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'transactions' ? (
            <DataTable columns={transactionColumns} data={logs} isLoading={loading} onRetry={fetchLogs} emptyTitle="No record changes yet" emptyMessage="Once staff start adding and changing records, every change is listed here with the person's name and the time." />
          ) : (
            <DataTable columns={loginColumns} data={loginHistory} isLoading={loading} onRetry={fetchLoginHistory} emptyTitle="No login attempts yet" emptyMessage="Every attempt to log in — successful or not — is listed here, so you can see if someone is trying passwords that do not work." />
          )}
        </div>
      </div>

      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="What changed">
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)' }}>What happened</span>
                <div style={{ fontWeight: 600 }}>{ACTION_LABEL[selectedLog.action] || selectedLog.action}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)' }}>Screen</span>
                <div style={{ fontWeight: 600 }}>{selectedLog.module}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)' }}>Record number</span>
                <div style={{ fontSize: 'var(--font-body)' }}>{selectedLog.recordId}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)' }}>Who did it</span>
                <div style={{ fontSize: '0.875rem' }}>
                  {(() => {
                    const name = selectedLog.changedBy ? `${selectedLog.changedBy.firstName || ''} ${selectedLog.changedBy.lastName || ''}`.trim() : '';
                    return name ? name : 'System';
                  })()}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 'var(--font-section)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>The values that were saved</h4>
              <pre style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                padding: '1rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                overflowX: 'auto',
                color: 'var(--text-primary)'
              }}>
                {JSON.stringify(selectedLog.newValue || selectedLog.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
