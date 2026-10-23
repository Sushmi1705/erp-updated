import { resolveIntent, intentTokens } from '../../theme/status';

/**
 * The one badge in the application.
 *
 * Seven pages defined their own, in two different visual forms — a 4px chip and
 * a 12px pill — with thirty-three separate status-to-colour maps behind them.
 * Colour now comes from the shared vocabulary in theme/status.js.
 *
 * The word is always rendered. positive and negative are the red/green pair, so
 * a bare colour dot would carry meaning that a colour-blind user cannot read;
 * the optional `dot` is an addition to the label, never a replacement for it.
 */
const StatusBadge = ({ value, dot = false, title }) => {
  if (value === null || value === undefined || value === '') return <span>—</span>;

  const intent = resolveIntent(value);
  const tokens = intentTokens(intent);

  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: '3px 10px',
        // A soft pill: a tinted fill with a hairline of the same hue. A pill
        // reads as a state; a rounded rectangle reads as a button.
        borderRadius: 'var(--radius-pill)',
        border: '1px solid',
        fontSize: 'var(--font-caption)',
        fontWeight: 'var(--weight-semibold)',
        lineHeight: '16px',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        ...tokens
      }}
    >
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: 'currentColor', flexShrink: 0
          }}
        />
      )}
      {value}
    </span>
  );
};

export default StatusBadge;
