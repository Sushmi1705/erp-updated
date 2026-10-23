import { useEffect, useState } from 'react';
import axios from 'axios';
import { LifeBuoy, Send } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { notify } from '../../utils/notify';

/* What people have reported, and what was said back.
 *
 * The queue exists so a report is not a message into the dark: every row
 * carries who hit it, on which screen, with which role, and what the system
 * said at the time — and an answer written here is visible to the person who
 * raised it, under their own name in the app.
 */

const STATUSES = ['All', 'New', 'Seen', 'In Progress', 'Fixed', 'Not a problem'];

const IssueQueue = () => {
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState({});
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('Seen');
  const [saving, setSaving] = useState(false);

  const load = async (f = filter) => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get('/issues', { params: { status: f } });
      setIssues(res.data?.data || []);
      setSummary(res.data?.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load the reports.');
    }
    setLoading(false);
  };
  // The first fetch sets no state on the way in — `loading` already starts
  // true, so there is nothing to switch on before the request goes out.
  useEffect(() => {
    let cancelled = false;
    axios.get('/issues', { params: { status: 'All' } })
      .then((res) => { if (!cancelled) { setIssues(res.data?.data || []); setSummary(res.data?.summary || {}); } })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || err.message || 'Could not load the reports.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const choose = (f) => { setFilter(f); load(f); };

  const openIssue = (row) => {
    setOpen(row);
    setReply(row.response || '');
    setStatus(row.status === 'New' ? 'Seen' : row.status);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await axios.put(`/issues/${open._id}`, { status, response: reply });
      notify.success(res.data?.message || 'Updated.');
      setOpen(null);
      await load();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not save that.');
    }
    setSaving(false);
  };

  const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

  const columns = [
    { header: 'Reference', accessor: 'reference', mono: true },
    { header: 'What they said', render: (r) => (
      <div style={{ maxWidth: 420 }}>
        <div style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.screenName || r.screenPath}</div>
      </div>
    ) },
    { header: 'Who', render: (r) => (
      <div>
        <div>{r.reportedByName || '—'}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.roleName || ''}</div>
      </div>
    ) },
    { header: 'Holding them up?', render: (r) => <StatusBadge value={r.severity === 'Blocking' ? 'Critical' : r.severity === 'Minor' ? 'Closed' : 'Open'} title={r.severity} /> },
    { header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { header: 'Reported', render: (r) => when(r.createdAt) }
  ];

  const pill = (f) => ({
    padding: '6px 12px', fontSize: 12.5, borderRadius: 'var(--radius-pill)', cursor: 'pointer',
    border: '1px solid ' + (filter === f ? 'var(--accent-primary)' : 'var(--border-default)'),
    background: filter === f ? 'var(--accent-primary)' : 'var(--surface-raised)',
    color: filter === f ? '#fff' : 'var(--text-secondary)', fontWeight: filter === f ? 600 : 400
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-color)', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-title)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <LifeBuoy size={20} style={{ color: 'var(--accent-primary)' }} /> Reported problems
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-label)', marginTop: 2, maxWidth: 760 }}>
            What people hit while using the system, sent from the screen it happened on. Each one carries the screen, the
            person&apos;s role and what the system said, so nobody has to be asked to explain it again.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {STATUSES.map((f) => (
          <button key={f} type="button" onClick={() => choose(f)} style={pill(f)}>
            {f}{f !== 'All' && summary[f] ? ` (${summary[f]})` : ''}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <DataTable
          columns={columns}
          data={issues}
          isLoading={loading}
          error={error}
          onRetry={() => load()}
          onRowClick={openIssue}
          selectedRowId={open?._id}
          emptyTitle="Nothing reported"
          emptyMessage="When somebody hits a problem, they press the lifebuoy in the top bar and it arrives here with the screen and the error attached."
        />
      </div>

      <Modal isOpen={!!open} onClose={() => setOpen(null)} title={open ? `${open.reference} · ${open.kind}` : ''} maxWidth={720}>
        {open && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6 }}>{open.description}</div>

            <div style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div><strong style={{ color: 'var(--text-primary)' }}>{open.reportedByName}</strong>{open.roleName ? ` · ${open.roleName}` : ''} · {when(open.createdAt)}</div>
              <div>Screen: <strong style={{ color: 'var(--text-primary)' }}>{open.screenName || open.screenPath}</strong> <span style={{ color: 'var(--text-muted)' }}>({open.screenPath})</span></div>
              {open.context?.viewport && <div>Screen size: {open.context.viewport}{open.context.userAgent ? ` · ${open.context.userAgent.slice(0, 80)}` : ''}</div>}
              {open.context?.lastFailedRequest?.url && (
                <div style={{ color: 'var(--status-negative-fg)', marginTop: 4 }}>
                  Last refusal: <strong>{open.context.lastFailedRequest.status}</strong> {open.context.lastFailedRequest.method} {open.context.lastFailedRequest.url}
                  <div>{open.context.lastFailedRequest.message}</div>
                </div>
              )}
              {open.context?.renderError?.message && (
                <div style={{ color: 'var(--status-negative-fg)', marginTop: 4 }}>Screen failed to draw: {open.context.renderError.message}</div>
              )}
              {(open.context?.consoleErrors || []).length > 0 && (
                <details style={{ marginTop: 4 }}>
                  <summary style={{ cursor: 'pointer' }}>{open.context.consoleErrors.length} error(s) logged just before</summary>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {open.context.consoleErrors.map((c, i) => <li key={i} style={{ fontSize: 11.5 }}>{c.message}</li>)}
                  </ul>
                </details>
              )}
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="issue-status">Where has this got to?</label>
              <select id="issue-status" className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                {['Seen', 'In Progress', 'Fixed', 'Not a problem'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="issue-reply">
                What should they be told? They will see this against their report.
              </label>
              <textarea id="issue-reply" className="input-field" rows={3} value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder="Fixed — the material has to be on the purchase order first. Try the receipt again." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(null)}>Close</button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                <Send size={14} /> {saving ? 'Saving…' : 'Save and reply'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IssueQueue;
