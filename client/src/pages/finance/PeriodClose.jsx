import { useEffect, useState } from 'react';
import axios from 'axios';
import { Lock, Unlock, CalendarCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { notify } from '../../utils/notify';
import { confirmAction, promptAction } from '../../utils/confirmAction';

/* Month close.
 *
 * Once a month has been reported — GST filed, the owner shown the P&L — any
 * document dated into it changes numbers someone has already signed. Closing
 * the month stops that: invoices, bills, receipts, payments and journal
 * entries dated inside a closed month are refused, and the correction goes
 * in as a dated entry in the current month instead. Reopening is limited to
 * administrators, and every close and reopen is written to the audit log. */
const PeriodClose = () => {
  const { user } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;
  const isAdmin = ['Super Admin', 'Admin'].includes(roleName);

  const load = () => axios.get('/finance/v2/periods')
    .then((r) => setPeriods(r.data?.data || []))
    .catch((e) => notify.error(e.response?.data?.message || 'Could not load the periods.'))
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const close = async (p) => {
    if (!(await confirmAction(`Close ${p.label}? Nothing can be posted into it afterwards — a correction will have to be dated in the current month.`))) return;
    setBusy(p.key);
    try { const r = await axios.put(`/finance/v2/periods/${p.key}/close`); notify.success(r.data?.message); await load(); }
    catch (e) { notify.error(e.response?.data?.message || 'Could not close the period.'); }
    finally { setBusy(null); }
  };
  const reopen = async (p) => {
    const note = await promptAction({
      title: `Reopen ${p.label}?`,
      message: 'Postings into this month become possible again. The reason is written to the audit log.',
      confirmLabel: 'Reopen',
      input: { label: 'Reason', placeholder: 'e.g. supplier bill for March arrived late' }
    });
    if (note === null) return;
    setBusy(p.key);
    try { const r = await axios.put(`/finance/v2/periods/${p.key}/reopen`, { note }); notify.success(r.data?.message); await load(); }
    catch (e) { notify.error(e.response?.data?.message || 'Could not reopen the period.'); }
    finally { setBusy(null); }
  };

  const closedCount = periods.filter((p) => p.status === 'Closed').length;
  const lastClosed = periods.find((p) => p.status === 'Closed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.55 }}>
        <CalendarCheck size={18} style={{ color: 'var(--accent-primary-text)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Close a month once its figures have been reported.</strong> After that, no invoice, bill, receipt, payment or journal entry can be dated into it — a correction goes in dated today.
          {lastClosed ? ` Books are closed through ${lastClosed.label}.` : ' No month is closed yet.'}
          {!isAdmin && ' Reopening a closed month is for administrators.'}
        </div>
      </div>

      {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 10 }}>
          {periods.map((p) => {
            const closed = p.status === 'Closed';
            return (
              <div key={p.key} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                opacity: p.isCurrent ? 0.75 : 1
              }}>
                <span style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: closed ? 'var(--status-neutral-bg)' : 'var(--status-positive-bg)', color: closed ? 'var(--text-muted)' : 'var(--status-positive-fg)' }}>
                  {closed ? <Lock size={15} /> : <Unlock size={15} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}{p.isCurrent && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · current</span>}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {closed ? `Closed ${p.closedAt ? new Date(p.closedAt).toLocaleDateString('en-IN') : ''}${p.closedBy ? ` by ${p.closedBy}` : ''}` : p.isCurrent ? 'Still running' : 'Open to posting'}
                  </div>
                </div>
                <StatusBadge value={closed ? 'Closed' : 'Open'} />
                {closed
                  ? (isAdmin && <button type="button" className="btn btn-secondary" disabled={busy === p.key} onClick={() => reopen(p)} style={{ padding: '4px 10px', fontSize: 12 }}>Reopen</button>)
                  : (!p.isCurrent && <button type="button" className="btn btn-primary" disabled={busy === p.key} onClick={() => close(p)} style={{ padding: '4px 10px', fontSize: 12 }}>Close</button>)}
              </div>
            );
          })}
        </div>
      )}
      {closedCount === 0 && !loading && (
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Tip: close last month once its GST return is filed. That is the moment its figures stop being a draft.</div>
      )}
    </div>
  );
};

export default PeriodClose;
