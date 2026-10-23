import { fmtUnit } from '../../utils/format';

/* A ring for "how is the whole split" — stock by type, orders by stage. The
   total sits in the middle; the legend carries every figure, so the colours
   are a help rather than the only way to read it. */

const COLOURS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-4)'];

const Donut = ({ rows = [], unit = 'count', centreLabel = 'Total', emptyText = 'Nothing to show yet.' }) => {
  const total = rows.reduce((s, r) => s + (Number(r.value) || 0), 0);
  if (!rows.length || total === 0) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>{emptyText}</div>;
  const R = 54, C = 2 * Math.PI * R;
  // Where each arc starts: the running total of the shares before it.
  const starts = rows.reduce((acc, r, i) => { acc.push(i === 0 ? 0 : acc[i - 1] + (Number(rows[i - 1].value) || 0) / total); return acc; }, []);
  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label={centreLabel}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--bg-tertiary)" strokeWidth="16" />
        {rows.map((r, i) => (
          <circle key={r.label + i} cx="70" cy="70" r={R} fill="none" stroke={COLOURS[i % COLOURS.length]} strokeWidth="16"
            strokeDasharray={`${((Number(r.value) || 0) / total) * C} ${C}`} strokeDashoffset={-starts[i] * C} transform="rotate(-90 70 70)" />
        ))}
        <text x="70" y="66" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--text-primary)">{fmtUnit(total, unit)}</text>
        <text x="70" y="82" textAnchor="middle" fontSize="11" fill="var(--text-muted)">{centreLabel}</text>
      </svg>
      <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {rows.map((r, i) => (
          <div key={r.label + i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLOURS[i % COLOURS.length], flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{r.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtUnit(r.value, unit)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 36, textAlign: 'right' }}>{Math.round(((Number(r.value) || 0) / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Donut;
