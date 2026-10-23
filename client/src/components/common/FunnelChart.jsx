/* How much sits at each step of a process.
 *
 * Each stage is a trapezium whose left edge is its own count and whose right
 * edge is the next stage's, so the slope between two blocks is the change
 * between them — the shape carries the number rather than decorating it.
 *
 * It reads as a funnel when the counts genuinely descend, and it will widen
 * where they genuinely rise. That is deliberate: the geometry always reports
 * the numbers it was given. Do not label it a conversion funnel unless each
 * stage really is a subset of the one before it — in this system invoices
 * accumulate while open orders do not, so those two are not a chain, and a
 * tapering picture over them would imply a drop-off that never happened.
 *
 * Drawn as one SVG rather than CSS shapes so the slanted edges line up exactly
 * where two stages meet.
 */

const FunnelChart = ({ stages = [], height = 150, formatValue }) => {
  const points = stages.filter((s) => s && typeof s.value === 'number');
  const top = points.length ? Math.max(...points.map((s) => s.value)) : 0;

  if (!points.length || top <= 0) {
    return (
      <div style={{
        height,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '13px'
      }}>
        Nothing at any stage yet.
      </div>
    );
  }

  const colWidth = 100 / points.length;
  // A floor on the drawn height keeps a stage with almost nothing in it from
  // collapsing to an invisible sliver.
  const heightFor = (v) => Math.max(0.06, v / top);

  return (
    <div>
      <div style={{ display: 'flex', width: '100%' }}>
        {points.map((s) => (
          <div key={s.label} style={{ width: `${colWidth}%`, textAlign: 'center', padding: '0 4px', minWidth: 0 }}>
            <div style={{
              fontSize: '12.5px', color: 'var(--text-secondary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {s.label}
            </div>
            <div style={{
              fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)',
              letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 2
            }}>
              {formatValue ? formatValue(s.value) : s.value}
            </div>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block', marginTop: 10 }}
        role="img"
        aria-label={points.map((s) => `${s.label} ${s.value}`).join(', ')}
      >
        <defs>
          <linearGradient id="funnel-ramp" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-1)" />
            <stop offset="100%" stopColor="var(--chart-4)" />
          </linearGradient>
        </defs>

        {points.map((s, i) => {
          const next = points[i + 1];
          const x0 = i * colWidth;
          const x1 = x0 + colWidth;
          const hL = heightFor(s.value) * height;
          const hR = heightFor(next ? next.value : s.value) * height;
          // Anchored to the top edge, the way the reference draws it, so the
          // slope reads as a single continuous descent across the whole row.
          return (
            <polygon
              key={s.label}
              points={`${x0},0 ${x1},0 ${x1},${hR} ${x0},${hL}`}
              fill="url(#funnel-ramp)"
              opacity={1 - i * (0.62 / Math.max(1, points.length - 1))}
            >
              <title>{`${s.label}: ${s.value}`}</title>
            </polygon>
          );
        })}
      </svg>

      <div style={{ display: 'flex', width: '100%', marginTop: 6 }}>
        {points.map((s) => (
          <div key={s.label} style={{ width: `${colWidth}%`, textAlign: 'center', padding: '0 4px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round((s.value / top) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FunnelChart;
