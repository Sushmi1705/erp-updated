import { useNavigate } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, Info, ChevronRight, CheckCircle2 } from 'lucide-react';

/* "What needs someone to act" — the list a manager reads before any chart.
   Every item leads to the screen where it is dealt with. */

const LOOK = {
  critical: { icon: AlertOctagon, fg: 'var(--status-negative-fg)', bg: 'var(--status-negative-bg)', border: 'var(--status-negative-border)' },
  warning: { icon: AlertTriangle, fg: 'var(--status-caution-fg)', bg: 'var(--status-caution-bg)', border: 'var(--status-caution-border)' },
  info: { icon: Info, fg: 'var(--status-info-fg)', bg: 'var(--status-info-bg)', border: 'var(--status-info-border)' }
};

const AttentionList = ({ items = [], compact = false, emptyText = 'Nothing needs attention right now.' }) => {
  const navigate = useNavigate();
  if (!items.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'var(--status-positive-bg)', border: '1px solid var(--status-positive-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-positive-fg)', fontSize: 13, fontWeight: 500 }}>
        <CheckCircle2 size={17} /> {emptyText}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it, i) => {
        const look = LOOK[it.severity] || LOOK.info;
        const Icon = look.icon;
        return (
          <button
            key={i}
            type="button"
            onClick={() => it.path && navigate(it.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
              padding: compact ? '9px 12px' : '11px 14px',
              background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${look.fg}`,
              borderRadius: 'var(--radius-md)', cursor: it.path ? 'pointer' : 'default', color: 'var(--text-primary)'
            }}
          >
            <span style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: look.bg, color: look.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{it.title}</span>
              {it.detail && !compact && <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.detail}</span>}
            </span>
            {it.module && <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{it.module}</span>}
            {it.path && <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
          </button>
        );
      })}
    </div>
  );
};

export default AttentionList;
