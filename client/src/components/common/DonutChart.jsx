/* A ring showing how a total splits between a handful of named parts.
 *
 * Hand-rolled SVG because the app has no charting library and adding one to
 * draw six arcs would be a dependency doing less than this file. Arcs are
 * stroke-dasharray on a circle rather than path arcs: no trigonometry to get
 * wrong, and the rounded cap comes free.
 *
 * Segments are drawn largest first so the eye lands on the biggest share, and
 * the palette runs blue → teal in a fixed order so the same customer keeps the
 * same colour between renders.
 */

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)'
];

/**
 * @param {{label: string, value: number}[]} data
 * @param {number} size    outer square, px
 * @param {string} centerLabel  small caption under the centre figure
 * @param {(n:number)=>string} formatCentre  how to render the total
 */
const DonutChart = ({ data = [], size = 168, centerLabel, formatCentre }) => {
  const points = [...data]
    .filter((d) => Number(d?.value) > 0)
    .sort((a, b) => b.value - a.value);

  const total = points.reduce((sum, d) => sum + Number(d.value), 0);

  if (!total) {
    return (
      <div style={{
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '13px',
        textAlign: 'center'
      }}>
        Nothing to show yet.
      </div>
    );
  }

  // Geometry: a circle of this radius has this circumference, and each
  // segment claims its share of it.
  const stroke = Math.round(size * 0.14);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Each segment starts where the ones before it finished. Summing the
  // preceding shares per segment rather than carrying a running total keeps
  // this a pure expression — with at most a handful of segments the repeated
  // addition costs nothing, and the React compiler rejects the mutation.
  const shares = points.map((d) => Number(d.value) / total);
  const arcs = points.map((d, i) => ({
    ...d,
    share: shares[i],
    colour: PALETTE[i % PALETTE.length],
    dash: shares[i] * circumference,
    offset: -shares.slice(0, i).reduce((sum, sh) => sum + sh, 0) * circumference
  }));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Split of ${points.length} items totalling ${total}`}
        >
          {/* The track, so an almost-empty ring still reads as a ring. */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke}
          />
          {/* -90deg puts the first segment at twelve o'clock. */}
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {arcs.map((a) => (
              <circle
                key={a.label}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={a.colour}
                strokeWidth={stroke}
                strokeDasharray={`${a.dash} ${circumference - a.dash}`}
                strokeDashoffset={a.offset}
                strokeLinecap="butt"
              >
                <title>{`${a.label}: ${Math.round(a.share * 100)}%`}</title>
              </circle>
            ))}
          </g>
        </svg>

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            fontSize: size > 150 ? '19px' : '16px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em'
          }}>
            {formatCentre ? formatCentre(total) : total}
          </div>
          {centerLabel && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{centerLabel}</div>
          )}
        </div>
      </div>

      <ul style={{
        listStyle: 'none', margin: 0, padding: 0,
        display: 'flex', flexDirection: 'column', gap: '9px',
        minWidth: 0, flex: 1
      }}>
        {arcs.map((a) => (
          <li key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%',
              backgroundColor: a.colour, flexShrink: 0
            }} />
            <span style={{
              fontSize: '12.5px', color: 'var(--text-secondary)',
              minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
            }}>
              {a.label}
            </span>
            <span style={{
              fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums', flexShrink: 0
            }}>
              {Math.round(a.share * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonutChart;
