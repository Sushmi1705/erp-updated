import { fmtUnit } from '../../utils/format';

/* A ranked list with a bar behind each figure — the fastest way to show
   "who is biggest" without a legend to decode. `share` (0–100) sets the bar;
   without it the bar is scaled to the largest value in the list. */

const TONE = {
  negative: 'var(--status-negative-fg)',
  caution: 'var(--status-caution-fg)',
  positive: 'var(--status-positive-fg)'
};

const BarList = ({ rows = [], unit = 'count', emptyText = 'Nothing to show yet.' }) => {
  if (!rows.length) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>{emptyText}</div>;
  const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((r, i) => {
        const width = r.share !== undefined && r.share !== null ? Math.max(r.share, 1.5) : Math.max(((Number(r.value) || 0) / max) * 100, 1.5);
        const colour = TONE[r.tone] || 'var(--chart-1)';
        return (
          <div key={r.label + i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, alignItems: 'baseline' }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: 500 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginRight: 8, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>{r.label}
              </span>
              <span style={{ whiteSpace: 'nowrap', fontWeight: 600, color: TONE[r.tone] || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtUnit(r.value, unit, { full: unit === 'money' })}
                {r.share !== undefined && r.share !== null && unit !== 'percent' && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, fontSize: 12 }}>{Math.round(r.share)}%</span>}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', marginTop: 5, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(width, 100)}%`, height: '100%', background: colour, borderRadius: 3, opacity: 0.9 }} />
            </div>
            {r.sub && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>{r.sub}</div>}
          </div>
        );
      })}
    </div>
  );
};

export default BarList;
