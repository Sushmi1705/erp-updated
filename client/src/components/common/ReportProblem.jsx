import { useState } from 'react';
import axios from 'axios';
import { LifeBuoy, Send, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../../contexts/AuthContext';
import { getPageLabel } from '../layout/Sidebar';
import { snapshot } from '../../utils/diagnostics';
import { notify } from '../../utils/notify';

/* "Report a problem", from wherever the person is standing.
 *
 * The thing that makes this useful is not the box they type into — it is what
 * goes with it. A store keeper writes "it won't let me save" and the team
 * receives that sentence plus the screen, the role, the request that failed
 * and its message. Without that, the first reply is always "which screen, and
 * what did it say?", and by then the person has gone back to work.
 *
 * Deliberately three clicks at most, and it never blocks what they were doing:
 * the dialog closes on send and the confirmation carries a reference they can
 * quote.
 */

const KINDS = [
  { key: 'Problem', label: 'Something is broken', hint: 'It refused, it showed the wrong thing, or nothing happened.' },
  { key: 'Question', label: "I don't know how to do this", hint: 'The screen is working but you cannot find the way through it.' },
  { key: 'Idea', label: 'It could be better', hint: 'It works, but something about it slows you down.' }
];

const SEVERITIES = [
  { key: 'Blocking', label: 'I cannot carry on', colour: 'var(--status-negative-fg)', bg: 'var(--status-negative-bg)', border: 'var(--status-negative-border)' },
  { key: 'Painful', label: 'I can work around it', colour: 'var(--status-caution-fg)', bg: 'var(--status-caution-bg)', border: 'var(--status-caution-border)' },
  { key: 'Minor', label: 'Just worth knowing', colour: 'var(--status-neutral-fg)', bg: 'var(--status-neutral-bg)', border: 'var(--status-neutral-border)' }
];

const ReportProblem = ({ open, onClose, presetKind, presetDescription }) => {
  const { user } = useAuth();
  const [kind, setKind] = useState(presetKind || 'Problem');
  const [severity, setSeverity] = useState('Painful');
  const [description, setDescription] = useState(presetDescription || '');
  const [sending, setSending] = useState(false);
  const [sentRef, setSentRef] = useState(null);

  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const { section, page } = getPageLabel(path);
  const captured = snapshot();
  const roleName = typeof user?.role === 'object' ? user.role?.name : user?.role;

  const send = async (e) => {
    e.preventDefault();
    if (sending || !description.trim()) return;
    setSending(true);
    try {
      const res = await axios.post('/issues', {
        description, kind, severity,
        screenPath: path,
        screenName: section ? `${section} › ${page}` : page,
        context: captured
      });
      setSentRef(res.data?.data?.reference || 'sent');
      notify.success(res.data?.message || 'Sent to the team.');
    } catch (err) {
      notify.error(err.response?.data?.message || 'That could not be sent. Check you are connected and try again.');
    }
    setSending(false);
  };

  const close = () => {
    setSentRef(null);
    setDescription('');
    setKind(presetKind || 'Problem');
    setSeverity('Painful');
    onClose();
  };

  const chip = (active, tone) => ({
    padding: '8px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
    fontSize: 13, textAlign: 'left', fontWeight: active ? 600 : 400,
    border: `1px solid ${active ? (tone?.border || 'var(--accent-primary)') : 'var(--border-default)'}`,
    background: active ? (tone?.bg || 'var(--accent-wash, var(--surface-selected))') : 'var(--surface-raised)',
    color: active ? (tone?.colour || 'var(--accent-primary-text)') : 'var(--text-secondary)'
  });

  return (
    <Modal isOpen={open} onClose={close} title={sentRef ? 'Sent to the team' : 'Report a problem'} maxWidth={620}>
      {sentRef ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <CheckCircle2 size={22} style={{ color: 'var(--status-positive-fg)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>The team has it.</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.55 }}>
                Your reference is <strong>{sentRef}</strong>. They can see which screen you were on, what your role is
                allowed to do, and what the system said — you do not need to explain any of that.
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={close}>Back to work</button>
        </div>
      ) : (
        <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>What kind of thing is it?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
              {KINDS.map((k) => (
                <button type="button" key={k.key} onClick={() => setKind(k.key)} style={chip(kind === k.key)}>
                  {k.label}
                  <span style={{ display: 'block', fontSize: 11.5, fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>{k.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" htmlFor="issue-description">
              What happened? Your own words are fine — you do not need to be technical.
            </label>
            <textarea
              id="issue-description"
              className="input-field"
              required
              rows={4}
              autoFocus
              placeholder="I tried to save the goods receipt and it said the material is not on the purchase order, but it is."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>How much is it holding you up?</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SEVERITIES.map((sv) => (
                <button type="button" key={sv.key} onClick={() => setSeverity(sv.key)} style={chip(severity === sv.key, sv)}>
                  {sv.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shown, not hidden: the reporter should know exactly what is being
              sent with their words. */}
          <div style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 12.5, color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Sent with this, automatically</div>
            <div>Screen: <strong>{section ? `${section} › ${page}` : page}</strong></div>
            <div>You: <strong>{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email}</strong>{roleName ? ` · ${roleName}` : ''}</div>
            <div>Screen size: {captured.viewport}</div>
            {captured.lastFailedRequest && (
              <div style={{ color: 'var(--status-negative-fg)', marginTop: 4 }}>
                Last refusal: {captured.lastFailedRequest.status} on {captured.lastFailedRequest.url} — {captured.lastFailedRequest.message}
              </div>
            )}
            {captured.renderError && (
              <div style={{ color: 'var(--status-negative-fg)', marginTop: 4 }}>
                The screen failed to draw: {captured.renderError.message}
              </div>
            )}
            <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>No customer, price or order details are sent.</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={sending || !description.trim()}>
              <Send size={14} /> {sending ? 'Sending…' : 'Send to the team'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export { LifeBuoy };
export default ReportProblem;
