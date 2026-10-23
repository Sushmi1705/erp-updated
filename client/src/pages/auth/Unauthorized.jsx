import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', gap: '16px', backgroundColor: 'var(--bg-primary)' }}>
      <Lock size={40} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
      <h1 style={{ color: 'var(--text-primary)', fontSize: 'var(--font-title)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>You cannot open this screen</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-body)', maxWidth: '420px', lineHeight: 'var(--leading-normal)' }}>
        Your role does not include this screen. If you need it for your work, ask your plant manager to change your role under Roles &amp; Access.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back to the last screen</button>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    </div>
  );
};
export default Unauthorized;
