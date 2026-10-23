import { X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

/**
 * `maxWidth` lets a dense multi-column form ask for more room; the default suits
 * the common one- and two-column cases.
 *
 * The dialog never scrolls horizontally. Content that cannot fit wraps instead,
 * which is what the form grids now do — a field pushed out of view sideways is a
 * field the user cannot fill.
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = 560 }) => {
  const isMobile = useIsMobile();
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', /* Solid dark backdrop */
        display: 'flex',
        /* On a phone the dialog is a sheet anchored to the bottom of the
           screen: it starts where the thumb already is, and a form taller than
           the screen scrolls inside it rather than pushing its buttons off. */
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: isMobile ? 0 : '16px',
        backdropFilter: 'none' /* Remove glassmorphism */
      }}
    >
      <div
        className="animate-fade-in"
        // The backdrop closes on click; clicks inside the dialog must not bubble
        // out to it and discard what the user is typing.
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-primary)',
          width: '100%',
          maxWidth: isMobile ? '100%' : `min(${maxWidth}px, 100%)`,
          border: '1px solid var(--border-color)', /* Strict native border */
          borderRadius: isMobile ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: isMobile ? '92dvh' : 'calc(100vh - 32px)',
          minWidth: 0
        }}
      >
        <div style={{
          padding: isMobile ? '12px 14px' : '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          backgroundColor: 'var(--bg-secondary)' /* Native titlebar style */
        }}>
          <h2 style={{ fontSize: isMobile ? '15px' : '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: isMobile ? '6px' : '2px', display: 'flex', flexShrink: 0 }}
          >
            <X size={isMobile ? 20 : 16} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: '16px', overflowY: 'auto', overflowX: 'hidden', minWidth: 0, WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
