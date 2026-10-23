import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/* The headline-figure card, in one place.
 *
 * Seven report screens and the launchpad each drew this by hand, so the same
 * idea appeared in eight slightly different shapes — the label above the
 * number on one screen and below it on another, the comparison sometimes a
 * caption and sometimes a coloured chip. This is that card settled once.
 *
 * The trend chip only appears when there is a real comparison to draw. A
 * figure with nothing to compare against gets no chip rather than a grey
 * zero, because an empty chip reads as "flat" when the truth is "unknown" —
 * the same mistake that had the sales report showing "+11.1%" against a month
 * it had never read.
 */

const toneColour = {
  blue: 'var(--accent-primary)',
  teal: 'var(--accent-teal)',
  green: 'var(--accent-success)',
  amber: 'var(--accent-warning)',
  red: 'var(--accent-danger)',
  purple: 'var(--accent-purple)'
};

/**
 * @param {string}  label    what the figure is
 * @param {*}       value    the figure itself, already formatted
 * @param {*}       icon     lucide component, shown in a tinted circle
 * @param {string}  tone     which accent the icon circle takes
 * @param {string}  caption  the quiet line under the number
 * @param {number}  trend    percentage change; omit when there is none to show
 * @param {boolean} trendUpIsGood  false where a rise is bad (scrap, downtime)
 * @param {object}  action   { label, onClick } — a quiet link at the foot of
 *                           the card, "View more" leading to the detail screen
 */
const StatCard = ({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  caption,
  trend,
  trendUpIsGood = true,
  // '%' by default; ' pts' when the trend is a change in a rate, so a scrap
  // rate moving from 2.0% to 3.2% reads "+1.2 pts", not "+1.2%".
  trendUnit = '%',
  muted = false,
  onClick,
  action,
  children
}) => {
  // `tone` takes either one of the names above or a raw colour, so a page
  // that already had its own palette can hand it straight over.
  const accent = toneColour[tone] || tone || toneColour.blue;
  const hasTrend = typeof trend === 'number' && isFinite(trend);

  const TrendIcon = !hasTrend ? Minus : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const good = trend > 0 ? trendUpIsGood : trend < 0 ? !trendUpIsGood : null;
  const trendColour =
    good === null ? 'var(--text-muted)'
    : good ? 'var(--status-positive-fg)' : 'var(--status-negative-fg)';
  const trendBg =
    good === null ? 'var(--status-neutral-bg)'
    : good ? 'var(--status-positive-bg)' : 'var(--status-negative-bg)';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
      className={onClick ? 'stat-card stat-card--clickable' : 'stat-card'}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          paddingTop: 4
        }}>
          {label}
        </span>
        {Icon && (
          <span style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            // A tint of the accent rather than the accent itself: the circle
            // is a label for the row, not a second call to action.
            backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={17} color={accent} />
          </span>
        )}
      </div>

      <div style={{
        // A value the system does not have reads quieter than one it does.
        fontSize: muted ? '16px' : '28px',
        fontWeight: muted ? 500 : 700,
        letterSpacing: muted ? '0' : '-0.02em',
        lineHeight: 1.1,
        color: muted ? 'var(--text-muted)' : 'var(--text-primary)',
        fontVariantNumeric: 'tabular-nums',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {value}
      </div>

      {(caption || hasTrend || action) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {hasTrend && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: trendBg,
              color: trendColour,
              fontSize: '11.5px',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums'
            }}>
              <TrendIcon size={12} />
              {trend > 0 ? '+' : ''}{trend}{trendUnit}
            </span>
          )}
          {caption && (
            <span style={{
              fontSize: '12.5px',
              color: 'var(--text-muted)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {caption}
            </span>
          )}
          {action && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); action.onClick?.(e); }}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none', padding: 0,
                color: 'var(--accent-primary-text)', fontSize: '12px', fontWeight: 500,
                cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {action.label || 'View more'}
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  );
};

export default StatCard;
