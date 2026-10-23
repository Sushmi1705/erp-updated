import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccess } from '../../utils/permissions';
import { getAllScreens } from './Sidebar';

/**
 * Jump to any screen by typing part of its name — ⌘K / Ctrl+K from anywhere.
 *
 * With sixty-odd screens behind a menu of groups, "where is the scrap log?"
 * is a real question. This answers it without the menu: it searches the same
 * labels and hints the menu shows, and only offers what the signed-in role can
 * open, so it never leads anyone to a screen that would refuse them.
 *
 * Keyboard from start to finish: type, ↑/↓, Enter to go, Esc to close.
 */
/* Mounted only while open (Header renders it conditionally), so every opening
   starts with a fresh query and the first result selected — no reset effect. */
const CommandPalette = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const screens = useMemo(() => getAllScreens().filter((s) => canAccess(user, s.module)), [user]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return screens.slice(0, 12);
    const words = q.split(/\s+/);
    const hay = (s) => `${s.label} ${s.section || ''} ${s.hint || ''}`.toLowerCase();
    return screens
      .map((s) => {
        const h = hay(s);
        if (!words.every((w) => h.includes(w))) return null;
        // Label matches outrank hint matches; a label that starts with the
        // query outranks one that merely contains it.
        const label = s.label.toLowerCase();
        const score = label.startsWith(q) ? 0 : label.includes(q) ? 1 : 2;
        return { s, score };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 12)
      .map((r) => r.s);
  }, [query, screens]);

  useEffect(() => {
    // Focus after the overlay has painted.
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = listRef.current?.children?.[active];
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const go = (screen) => {
    onClose();
    navigate(screen.path);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) go(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'var(--surface-overlay)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '12vh 16px 16px'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to a screen"
        style={{
          width: '100%', maxWidth: 560,
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={17} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="Go to a screen — try “quotation” or “scrap”"
            aria-label="Search screens"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 15, color: 'var(--text-primary)'
            }}
          />
          <kbd style={{
            fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border-default)',
            borderRadius: 6, padding: '2px 6px', fontFamily: 'inherit'
          }}>esc</kbd>
        </div>

        <div ref={listRef} role="listbox" style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
          {results.length === 0 && (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No screen matches “{query}”.
            </div>
          )}
          {results.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.path}
                type="button"
                role="option"
                aria-selected={i === active}
                className="palette-item"
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(s)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 10px', borderRadius: 'var(--radius-md)',
                  border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  color: 'var(--text-primary)'
                }}
              >
                <span style={{
                  width: 32, height: 32, flexShrink: 0, borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'
                }}>
                  {Icon ? <Icon size={15} /> : null}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.section ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{s.section} › </span> : null}
                    {s.label}
                  </span>
                  {s.hint && (
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.hint}
                    </span>
                  )}
                </span>
                {i === active && <CornerDownLeft size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
