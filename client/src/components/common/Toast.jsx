import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { registerNotifier } from '../../utils/notify';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Hand the sink to the hook-free notify() bridge, so code that cannot call a
  // hook — event handlers, catch blocks, helpers — can still reach these toasts.
  useEffect(() => { registerNotifier(addToast); }, [addToast]);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 6000),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        zIndex: 9999, maxWidth: '420px'
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const COLORS = {
  success: { bg: 'var(--accent-success)', icon: '✓' },
  error: { bg: 'var(--accent-danger)', icon: '✕' },
  warning: { bg: 'var(--accent-warning)', icon: '⚠' },
  info: { bg: 'var(--accent-primary)', icon: 'ℹ' },
};

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const { bg, icon } = COLORS[toast.type] || COLORS.info;
  
  return (
    <div role="status" aria-live="polite" data-toast={toast.type} style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 16px', borderRadius: '8px',
      backgroundColor: 'var(--bg-secondary, #1e293b)',
      border: `1px solid ${bg}40`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      animation: 'slideInRight 0.3s ease',
      cursor: 'pointer'
    }} onClick={() => onRemove(toast.id)}>
      <span style={{ color: bg, fontWeight: 'bold', fontSize: '16px', lineHeight: 1 }}>{icon}</span>
      <span style={{ color: 'var(--text-primary, #f1f5f9)', fontSize: '14px', flex: 1, lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }}
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary, #94a3b8)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
    </div>
  );
};

export default ToastProvider;
