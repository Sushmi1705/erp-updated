import { useEffect, useState } from 'react';
import axios from 'axios';
import AttentionList from './AttentionList';

/* The cross-department "needs attention" list, fetched on its own so any
   screen can drop it in. The server filters it to the modules the signed-in
   role can read, so a store keeper sees stock, not receivables. */
const AttentionPanel = ({ title = 'Needs attention', compact = false, max = 8 }) => {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    axios.get('/dashboards/attention')
      .then((res) => { if (!cancelled) setItems(res.data?.data?.items || []); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);
  return (
    <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
        {items && items.length > max && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>showing {max} of {items.length}</span>}
      </div>
      {error ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Could not check right now.</div>
        : items === null ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Checking…</div>
        : <AttentionList items={items.slice(0, max)} compact={compact} />}
    </section>
  );
};

export default AttentionPanel;
