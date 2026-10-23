import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Shield, ShoppingCart, Receipt, Boxes, Factory, Cog, ClipboardCheck,
  Wrench, Truck, IndianRupee, Building2, ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';


// A stamping press for the brand panel: the flywheel drives the ram down onto a
// coil strip that feeds through, punching one blank per stroke. Pure inline SVG,
// no dependency; motion is disabled under prefers-reduced-motion via tokens.css.
const StampingPress = () => (
  <svg viewBox="0 0 260 170" width="240" height="157" role="img"
    aria-label="Animated stamping press" style={{ display: 'block' }}>
    {/* bed / base */}
    <rect x="34" y="146" width="192" height="14" rx="2"
      fill="var(--surface-raised)" stroke="var(--text-secondary)" strokeWidth="2" />
    <rect x="150" y="158" width="60" height="6" rx="2" fill="var(--border-strong)" />
    {/* left upright + crown of the gap frame */}
    <path d="M40 146 L40 30 L150 30 L150 52 L64 52 L64 146 Z"
      fill="var(--surface-sunken)" stroke="var(--text-secondary)" strokeWidth="2" strokeLinejoin="round" />
    {/* ram guides */}
    <rect x="150" y="52" width="10" height="96" fill="var(--surface-sunken)" stroke="var(--text-secondary)" strokeWidth="2" />

    {/* coil strip feeding through, with punched blanks — advances each cycle */}
    <g style={{ animation: 'press-feed 2.4s ease-in-out infinite' }}>
      <rect x="52" y="132" width="170" height="10" fill="var(--surface-raised)"
        stroke="var(--accent-primary)" strokeWidth="1.5" />
      {[60, 86, 112, 164, 190].map((x) => (
        <circle key={x} cx={x} cy="137" r="3" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" />
      ))}
      {/* the freshly punched hole under the die */}
      <circle cx="138" cy="137" r="3" fill="var(--accent-primary)" opacity="0.35" />
    </g>

    {/* ram + upper die — strokes down onto the strip */}
    <g style={{ animation: 'press-ram 2.4s ease-in-out infinite' }}>
      <rect x="120" y="62" width="52" height="34" rx="2"
        fill="var(--accent-primary)" opacity="0.9" />
      <rect x="130" y="96" width="32" height="12" rx="1" fill="var(--accent-primary-solid)" />
      <line x1="146" y1="52" x2="146" y2="62" stroke="var(--text-secondary)" strokeWidth="4" />
    </g>

    {/* spark at bottom-dead-centre */}
    <g style={{ transformOrigin: '146px 132px', animation: 'press-spark 2.4s ease-in-out infinite' }}>
      <path d="M146 122 L149 131 L158 131 L151 137 L154 146 L146 140 L138 146 L141 137 L134 131 L143 131 Z"
        fill="var(--accent-warning)" />
    </g>

    {/* flywheel — one turn per stroke */}
    <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'press-flywheel 2.4s linear infinite' }}>
      <circle cx="196" cy="46" r="26" fill="var(--surface-raised)" stroke="var(--text-secondary)" strokeWidth="2.5" />
      <circle cx="196" cy="46" r="5" fill="var(--text-secondary)" />
      {[0, 60, 120].map((a) => (
        <line key={a} x1="196" y1="46"
          x2={196 + 24 * Math.cos((a * Math.PI) / 180)}
          y2={46 + 24 * Math.sin((a * Math.PI) / 180)}
          stroke="var(--text-secondary)" strokeWidth="2" />
      ))}
      {/* crank pin — its offset is what the connecting rod would follow */}
      <circle cx="196" cy="26" r="3.5" fill="var(--accent-primary)" />
    </g>
    {/* connecting rod, flywheel crown down to the ram */}
    <line x1="196" y1="26" x2="146" y2="58" stroke="var(--text-secondary)" strokeWidth="2.5" opacity="0.5" />
  </svg>
);

/* Ten job functions seeded by server/seeds/quick-login-users.cjs, plus the
 * account that can do everything. Each one is a real user with a real,
 * narrow permissions array — requirePermission() enforces it on the server
 * and canAccess() reads the same array to decide what the sidebar shows — so
 * clicking "Store Keeper" is not a relabelled admin view, it is the app a
 * store keeper actually gets.
 *
 * The password is not a secret worth protecting here: it is the same seeded
 * dev-fixture password used everywhere else in this project, on a system
 * carrying only dummy data. Before this system carries real customer data,
 * this panel should come out or move behind something that checks who is
 * asking for it.
 */
const QUICK_LOGIN_ACCOUNTS = [
  { email: 'admin@example.com', label: 'Super Admin', description: 'Every screen, every action', Icon: Shield },
  { email: 'sales.exec@lbap.in', label: 'Sales Executive', description: 'Quotations and sales orders', Icon: ShoppingCart },
  { email: 'purchase.officer@lbap.in', label: 'Purchase Officer', description: 'Purchase orders and suppliers', Icon: Receipt },
  { email: 'store.keeper@lbap.in', label: 'Store Keeper', description: 'Goods receipt and stock', Icon: Boxes },
  { email: 'production.planner@lbap.in', label: 'Production Planner', description: 'Material plan and work orders', Icon: Factory },
  { email: 'shopfloor.supervisor@lbap.in', label: 'Shop Floor Supervisor', description: 'Output, downtime and scrap', Icon: Cog },
  { email: 'quality.inspector@lbap.in', label: 'Quality Inspector', description: 'Inspections and non-conformances', Icon: ClipboardCheck },
  { email: 'maintenance.engineer@lbap.in', label: 'Maintenance Engineer', description: 'Preventive and breakdown repair', Icon: Wrench },
  { email: 'dispatch.coordinator@lbap.in', label: 'Dispatch Coordinator', description: 'Delivery plans and dispatch', Icon: Truck },
  { email: 'accounts.executive@lbap.in', label: 'Accounts Executive', description: 'Invoices, receipts and payments', Icon: IndianRupee },
  { email: 'plant.manager@lbap.in', label: 'Plant Manager', description: 'The whole floor, no admin screens', Icon: Building2 }
];
const QUICK_LOGIN_PASSWORD = 'password123';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login', 'forgot', 'mfa', 'forcePassword'
  const [message, setMessage] = useState('');
  
  const [tempToken, setTempToken] = useState('');
  
  const { login, setSession } = useAuth();
  const navigate = useNavigate();

  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [quickLoginBusy, setQuickLoginBusy] = useState(null); // email currently signing in, or null

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await axios.post('/auth/login', { email, password });
      
      if (res.data.requirePasswordChange) {
        setTempToken(res.data.tempToken);
        setMode('forcePassword');
        setMessage('Your password has expired. You must change it to continue.');

      } else {
        setSession(res.data.token, res.data.user, res.data.refreshToken);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred. Please try again.');
    }
    
    setLoading(false);
  };

  // Same endpoint, same session-setting call as the form above — this is a
  // shortcut past typing, not a different way of getting in.
  const handleQuickLogin = async (account) => {
    if (quickLoginBusy) return;
    setError('');
    setQuickLoginBusy(account.email);
    try {
      const res = await axios.post('/auth/login', { email: account.email, password: QUICK_LOGIN_PASSWORD });
      if (res.data.requirePasswordChange) {
        setTempToken(res.data.tempToken);
        setMode('forcePassword');
        setMessage('This account\'s password has expired. Set a new one to continue.');
      } else {
        setSession(res.data.token, res.data.user, res.data.refreshToken);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Could not sign in as ${account.label}.`);
    }
    setQuickLoginBusy(null);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const res = await axios.post('/auth/forgotpassword', { email });
      setMessage(res.data.message || 'Check your email for reset instructions.');
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending reset link.');
    }
    
    setLoading(false);
  };


  const handleForcePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      return setError('The two passwords are not the same. Type the same password in both boxes.');
    }

    setLoading(true);
    try {
      const res = await axios.post('/auth/force-update-password', {
        tempToken,
        currentPassword: password,
        newPassword
      });
      setSession(res.data.token, res.data.user, res.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating password.');
    }
    setLoading(false);
  };

  // ── presentation ──────────────────────────────────────────────────────────
  // A single small card on an empty page gave no sense of what system you were
  // signing in to. The split layout carries the identity on the left and keeps
  // the form itself narrow and quiet on the right; below 900px the brand panel
  // drops away and the form takes the screen.

  const field = (id, label, type, value, onChange, placeholder, extra) => (
    <div className="input-group" style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-1)' }}>
        <label className="input-label" htmlFor={id} style={{ marginBottom: 0 }}>{label}</label>
        {extra}
      </div>
      <input
        id={id}
        type={type}
        className="input-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        style={{
          height: 34,
          backgroundColor: 'var(--surface-input)',
          border: '1px solid var(--border-strong)'
        }}
      />
    </div>
  );

  const submitBtn = (idleLabel, busyLabel) => (
    <button
      type="submit"
      className="btn btn-primary"
      disabled={loading}
      style={{
        width: '100%',
        height: 36,
        marginTop: 'var(--space-2)',
        backgroundColor: 'var(--accent-primary-solid)',
        fontWeight: 'var(--weight-medium)',
        opacity: loading ? 0.7 : 1,
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      {loading ? busyLabel : idleLabel}
    </button>
  );

  const linkBtn = (label, onClick) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-secondary)', fontSize: 'var(--font-label)',
        marginTop: 'var(--space-2)'
      }}
    >
      {label}
    </button>
  );

  const heading = {
    login: ['Sign in', 'Use the email address and password given to you by your plant manager.'],
    forgot: ['Forgot your password', 'Type your email address. We will send you a link to set a new password.'],
    forcePassword: ['Set a new password', 'Your old password has expired. Choose a new one to carry on.']
  }[mode] || ['Sign in', ''];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--surface-raised)'
    }}>
      {/* Brand panel — identity and context, not decoration. */}
      <div style={{
        flex: '1 1 46%',
        display: 'flex',
        flexDirection: 'column',
        // space-between anchors the mark at the top and the domain at the
        // bottom, leaving the name in the optical centre.
        justifyContent: 'space-between',
        padding: 'var(--space-8) var(--space-7)',
        // canvas rather than sunken: at #f7f7f7 the panel was almost white and
        // the split did not read as two surfaces.
        backgroundColor: 'var(--surface-canvas)',
        borderRight: '1px solid var(--border-default)',
        minWidth: 0
      }} className="login-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{
            width: 30, height: 30, flexShrink: 0,
            backgroundColor: 'var(--accent-primary-solid)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={17} color="#ffffff" />
          </div>
          <span style={{
            fontSize: 'var(--font-body)', fontWeight: 'var(--weight-semibold)',
            color: 'var(--text-primary)'
          }}>
            Precision ERP
          </span>
        </div>

        <div style={{ maxWidth: 420 }}>
          <StampingPress />
          <h2 style={{
            fontSize: 26, lineHeight: 1.25, margin: 'var(--space-6) 0 0',
            fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)',
            letterSpacing: '-0.01em'
          }}>
            Laxmi Balaji Automotive Products
          </h2>
          <p style={{
            fontSize: 'var(--font-body)', color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-normal)', marginTop: 'var(--space-5)'
          }}>
            Sheet-metal pressing, sub-assemblies and press tools — from enquiry
            through dispatch, on one system.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-7)', marginTop: 'var(--space-7)' }}>
            {[['Hosur', 'SIPCOT Phase 2'], ['20–250 T', 'press capacity'], ['ISO', 'quality process']].map(([big, small]) => (
              <div key={big}>
                <div style={{
                  fontSize: 'var(--font-section)', fontWeight: 'var(--weight-semibold)',
                  color: 'var(--text-primary)'
                }}>{big}</div>
                <div style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)', marginTop: 2 }}>{small}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)' }}>
          lbap.in
        </div>
      </div>

      {/* Form panel */}
      <div style={{
        flex: '1 1 54%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-7) var(--space-6)',
        minWidth: 0
      }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h1 style={{
            fontSize: 'var(--font-title)', fontWeight: 'var(--weight-semibold)',
            margin: 0, color: 'var(--text-primary)'
          }}>
            {heading[0]}
          </h1>
          <p style={{
            fontSize: 'var(--font-label)', color: 'var(--text-secondary)',
            margin: 'var(--space-2) 0 var(--space-7)'
          }}>
            {heading[1]}
          </p>

          {error && (
            <div role="alert" style={{
              padding: 'var(--space-4) var(--space-5)',
              backgroundColor: 'var(--status-negative-bg)',
              border: '1px solid var(--status-negative-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-negative-fg)',
              marginBottom: 'var(--space-5)',
              fontSize: 'var(--font-label)',
              lineHeight: 'var(--leading-normal)'
            }}>
              {error}
            </div>
          )}

          {message && (
            <div role="status" style={{
              padding: 'var(--space-4) var(--space-5)',
              backgroundColor: 'var(--status-positive-bg)',
              border: '1px solid var(--status-positive-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-positive-fg)',
              marginBottom: 'var(--space-5)',
              fontSize: 'var(--font-label)',
              lineHeight: 'var(--leading-normal)'
            }}>
              {message}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {field('email', 'Email address', 'email', email, e => setEmail(e.target.value), 'you@lbap.in')}
                {field('password', 'Password', 'password', password, e => setPassword(e.target.value), '', (
                  <button type="button" onClick={() => setMode('forgot')} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent-primary-text)', fontSize: 'var(--font-caption)'
                  }}>
                    Forgot password?
                  </button>
                ))}
                {submitBtn('Sign in', 'Signing in…')}
              </form>

              {/* Quick sign-in — jump straight into any of the ten seeded job
                  roles, or the account that sees everything, without typing a
                  password. Collapsed by default so the ordinary sign-in stays
                  the first thing anyone sees. */}
              <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-5)' }}>
                <button
                  type="button"
                  onClick={() => setShowQuickLogin(v => !v)}
                  aria-expanded={showQuickLogin}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: 'var(--text-secondary)', fontSize: 'var(--font-label)', fontWeight: 'var(--weight-medium)'
                  }}
                >
                  {showQuickLogin ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Quick sign-in — see the app as a role
                </button>

                {showQuickLogin && (
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <p style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)', margin: '0 0 var(--space-4)', lineHeight: 'var(--leading-normal)' }}>
                      Demo accounts on seeded data — each one has only the access that role would really have.
                    </p>
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
                      maxHeight: 272, overflowY: 'auto', paddingRight: 'var(--space-2)'
                    }}>
                      {QUICK_LOGIN_ACCOUNTS.map((account) => {
                        const Icon = account.Icon;
                        const busy = quickLoginBusy === account.email;
                        return (
                          <button
                            key={account.email}
                            type="button"
                            onClick={() => handleQuickLogin(account)}
                            disabled={!!quickLoginBusy}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                              width: '100%', textAlign: 'left',
                              padding: 'var(--space-3) var(--space-4)',
                              backgroundColor: 'var(--surface-sunken)',
                              border: '1px solid var(--border-default)',
                              borderRadius: 'var(--radius-md)',
                              cursor: quickLoginBusy ? 'not-allowed' : 'pointer',
                              opacity: quickLoginBusy && !busy ? 0.55 : 1,
                              transition: 'background-color .12s ease, border-color .12s ease'
                            }}
                            onMouseOver={(e) => { if (!quickLoginBusy) e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                          >
                            <div style={{
                              width: 28, height: 28, flexShrink: 0, borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <Icon size={14} color="var(--text-secondary)" />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 'var(--font-label)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
                                {account.label}
                              </div>
                              <div style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {account.description}
                              </div>
                            </div>
                            {busy && (
                              <div style={{ fontSize: 'var(--font-caption)', color: 'var(--accent-primary-text)', flexShrink: 0 }}>
                                Signing in…
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : mode === 'forgot' ? (
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {field('reset-email', 'Email address', 'email', email, e => setEmail(e.target.value), 'you@lbap.in')}
              {submitBtn('Send reset link', 'Sending…')}
              {linkBtn('Back to sign in', () => { setMode('login'); setMessage(''); setError(''); })}
            </form>
          ) : mode === 'forcePassword' ? (
            <form onSubmit={handleForcePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {field('newPassword', 'New password', 'password', newPassword, e => setNewPassword(e.target.value), '')}
              {field('confirmPassword', 'New password again', 'password', confirmPassword, e => setConfirmPassword(e.target.value), '')}
              {submitBtn('Save password and sign in', 'Saving…')}
              {linkBtn('Cancel', () => { setMode('login'); setMessage(''); setError(''); setPassword(''); })}
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Login;
