import { useState, useCallback, useEffect, useRef } from 'react';
import { registerConfirmer } from '../../utils/confirmAction';

/* The "are you sure?" step, in the application rather than the browser.
 *
 * Twenty-seven irreversible actions — deleting a goods receipt, cancelling an
 * invoice, deactivating a customer — asked with window.confirm(). That dialog
 * freezes the page, appears in bare browser chrome with the site's hostname
 * above it, cannot say which record is about to go, and offers "OK" for
 * "delete permanently". It is the same problem the alerts had, on the actions
 * where being clear matters most.
 *
 * This asks in the app's own voice, names the record, and labels the button
 * with the verb it performs.
 */

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'var(--surface-overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: '20px'
};

const panelStyle = {
  backgroundColor: 'var(--surface-raised)',
  borderRadius: '12px',
  border: '1px solid var(--border-default)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
  width: '100%',
  maxWidth: '440px',
  padding: '24px'
};

export const ConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null);
  const [value, setValue] = useState('');
  const resolverRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const inputRef = useRef(null);

  const ask = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setValue(options.input?.defaultValue ?? '');
      setRequest(options);
    });
  }, []);

  useEffect(() => { registerConfirmer(ask); }, [ask]);

  // With an input, the answer is the value typed (or null for cancel); a
  // required field cannot be confirmed empty.
  const settle = useCallback((answer) => {
    if (request?.input) {
      const text = String(value ?? '').trim();
      if (answer && request.input.required && !text) { inputRef.current?.focus(); return; }
      setRequest(null);
      const resolve = resolverRef.current;
      resolverRef.current = null;
      if (resolve) resolve(answer ? text : null);
      return;
    }
    setRequest(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (resolve) resolve(answer);
  }, [request, value]);

  // Escape cancels, which is what every other dialog in the app does.
  useEffect(() => {
    if (!request) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') settle(false);
      if (e.key === 'Enter') settle(true);
    };
    window.addEventListener('keydown', onKey);
    // Focus the field if there is one, else the action, so the keyboard works
    // without reaching for the mouse.
    (inputRef.current || confirmButtonRef.current)?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [request, settle]);

  const danger = request?.tone === 'danger';

  return (
    <>
      {children}
      {request && (
        <div
          style={overlayStyle}
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) settle(false); }}
        >
          <div style={panelStyle} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
            <h2
              id="confirm-title"
              style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}
            >
              {request.title}
            </h2>
            {request.message && (
              <p style={{ margin: '10px 0 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {request.message}
              </p>
            )}
            {request.input && (
              <label style={{ display: 'block', marginTop: '16px' }}>
                {request.input.label && (
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {request.input.label}
                  </span>
                )}
                <input
                  ref={inputRef}
                  className="input-field"
                  type={request.input.type || 'text'}
                  min={request.input.min}
                  step={request.input.step}
                  placeholder={request.input.placeholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={{ width: '100%' }}
                />
              </label>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => settle(false)}>
                {request.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                ref={confirmButtonRef}
                className="btn"
                onClick={() => settle(true)}
                style={{
                  backgroundColor: danger ? 'var(--accent-danger)' : 'var(--accent-primary-solid)',
                  color: '#ffffff',
                  border: '1px solid transparent'
                }}
              >
                {request.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConfirmProvider;
