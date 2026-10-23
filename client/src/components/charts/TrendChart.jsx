import { useMemo, useState } from 'react';
import { fmtTick, fmtUnit } from '../../utils/format';

/* Precision ERP — Executive Trend & Comparative Telemetry Visualizer
 *
 * Multi-series SVG chart that gracefully handles both multi-month trendlines
 * and single-month periods (n === 1). When a single month is viewed ("This month"),
 * it automatically renders clear, colored comparative columns with exact value
 * callouts so administrators and executives instantly understand the data.
 */

const COLOURS = ['var(--chart-1)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-2)'];

const TrendChart = ({ series = [], unit = 'count', height = 220 }) => {
  const [hover, setHover] = useState(null);
  const W = 720, H = height, PAD = { l: 56, r: 24, t: 30, b: 32 };
  const labels = series[0]?.points?.map((p) => p.label) || [];
  const n = labels.length;

  const { max, ticks } = useMemo(() => {
    const all = series.flatMap((s) => s.points.map((p) => p.value || 0));
    const raw = Math.max(...all, 0);
    if (raw === 0) return { max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const scales = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
    const nice = scales.map((m) => m * mag).find((m) => m >= raw * 1.15) || (raw * 1.25);
    return { max: nice, ticks: [0, 0.25, 0.5, 0.75, 1].map((t) => t * nice) };
  }, [series]);

  const x = (i) => (n <= 1 ? (W + PAD.l - PAD.r) / 2 : PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r));
  const y = (v) => PAD.t + (1 - (v || 0) / max) * (H - PAD.t - PAD.b);
  const hasData = series.some((s) => s.points.some((p) => p.value > 0));

  const onMove = (e) => {
    if (n <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bd = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(x(i) - px);
      if (d < bd) { bd = d; best = i; }
    }
    setHover(best);
  };

  if (!n) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>Nothing to draw yet.</div>;

  // Single-month comparative column layout parameters
  const isSinglePeriod = n === 1;
  const barW = Math.min(84, Math.floor(180 / Math.max(series.length, 1)));
  const gap = 20;
  const totalGroupW = series.length * barW + (series.length - 1) * gap;
  const groupStartX = ((W + PAD.l - PAD.r) / 2) - (totalGroupW / 2);

  return (
    <div style={{ position: 'relative' }}>
      {/* Legend & Hover Stream Report */}
      {(() => {
        const activeIdx = hover !== null ? hover : Math.max(0, labels.length - 1);
        return (
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12, fontSize: 12.5, color: 'var(--text-secondary)' }}>
            {series.map((s, i) => (
              <span key={s.key || i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: COLOURS[i % COLOURS.length] }} />
                <span style={{ fontWeight: 500 }}>{s.label}:</span>
                <strong style={{ color: 'var(--text-primary)', marginLeft: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtUnit(s.points[activeIdx]?.value, unit)}
                </strong>
              </span>
            ))}
            <span style={{ marginLeft: 'auto', fontWeight: 600, fontSize: 12, color: hover !== null ? 'var(--primary)' : 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 10px', borderRadius: 'var(--radius-pill)' }}>
              {hover !== null ? labels[hover] : (labels.length > 1 ? `Latest (${labels[labels.length - 1]})` : labels[0])}
            </span>
          </div>
        );
      })()}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={series.map((s) => s.label).join(', ')}
      >
        {/* Y-Axis Grid Lines & Tick Labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtTick(t, unit)}
            </text>
          </g>
        ))}

        {/* ── CASE 1: MULTI-MONTH TRENDLINE (n > 1) ── */}
        {!isSinglePeriod && (
          <>
            {labels.map((l, i) => (n <= 13 || i % Math.ceil(n / 12) === 0) && (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-muted)">{l}</text>
            ))}

            {hasData && series.map((s, si) => {
              const pts = s.points.map((p, i) => `${x(i)},${y(p.value)}`);
              const c = COLOURS[si % COLOURS.length];
              return (
                <g key={s.key || si}>
                  {si === 0 && n > 1 && (
                    <polygon points={`${x(0)},${y(0)} ${pts.join(' ')} ${x(n - 1)},${y(0)}`} fill={c} opacity="0.08" />
                  )}
                  <polyline points={pts.join(' ')} fill="none" stroke={c} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  {s.points.map((p, i) => (
                    <circle key={i} cx={x(i)} cy={y(p.value)} r={hover === i ? 5 : 3.5} fill="var(--surface-raised)" stroke={c} strokeWidth="2" />
                  ))}
                </g>
              );
            })}

            {hover !== null && (
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--border-strong)" strokeDasharray="3 3" strokeWidth="1.5" />
            )}
          </>
        )}

        {/* ── CASE 2: SINGLE PERIOD SIDE-BY-SIDE COLUMNS (n === 1) ── */}
        {isSinglePeriod && (
          <g>
            {/* Centered month label */}
            <text x={(W + PAD.l - PAD.r) / 2} y={H - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-primary)">
              {labels[0]}
            </text>

            {/* Side-by-side comparative bars with clear value labels */}
            {series.map((s, si) => {
              const val = s.points[0]?.value || 0;
              const bx = groupStartX + si * (barW + gap);
              const barH = Math.max(((val / max) * (H - PAD.t - PAD.b)), 3);
              const by = (H - PAD.b) - barH;
              const c = COLOURS[si % COLOURS.length];

              return (
                <g key={s.key || si}>
                  {/* Subtle bar background slot */}
                  <rect
                    x={bx}
                    y={PAD.t}
                    width={barW}
                    height={H - PAD.t - PAD.b}
                    rx="6"
                    fill="var(--bg-secondary)"
                    opacity="0.5"
                  />
                  {/* Main Value Bar */}
                  <rect
                    x={bx}
                    y={by}
                    width={barW}
                    height={barH}
                    rx="6"
                    fill={c}
                    opacity="0.9"
                  />
                  {/* Exact Value Callout Text Above Bar */}
                  <text
                    x={bx + barW / 2}
                    y={Math.max(by - 8, PAD.t - 4)}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="800"
                    fill="var(--text-primary)"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {fmtUnit(val, unit)}
                  </text>
                  {/* Series Name below bar */}
                  <text
                    x={bx + barW / 2}
                    y={H - PAD.b + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="var(--text-secondary)"
                  >
                    {s.label.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {!hasData && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="13" fill="var(--text-muted)">
            Nothing recorded in this period
          </text>
        )}
      </svg>
    </div>
  );
};

export default TrendChart;
