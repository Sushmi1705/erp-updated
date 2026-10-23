import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      return setError('The two passwords are not the same. Type the same password in both boxes.');
    }

    setLoading(true);
    try {
      await axios.put(`/auth/resetpassword/${token}`, { password });
      setMessage('Your new password is saved. Taking you to the login screen…');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={32} color="var(--accent-primary)" />
          </div>
        </div>
        <h1 style={{ fontSize: 'var(--font-title)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Set a new password</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-body)', marginBottom: '2rem' }}>
          Type your new password twice, so we know it is typed correctly.
        </p>

        {error && <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-negative-bg)', border: '1px solid var(--status-negative-border)', color: 'var(--status-negative-fg)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: 'var(--font-body)' }}>{error}</div>}
        {message && <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-positive-bg)', border: '1px solid var(--status-positive-border)', color: 'var(--status-positive-fg)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: 'var(--font-body)' }}>{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div className="input-group">
            <label className="input-label">New password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">New password again</label>
            <input 
              type="password" 
              className="input-field" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Saving new password…' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
