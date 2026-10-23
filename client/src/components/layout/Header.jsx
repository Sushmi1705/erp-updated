import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Sun, Moon, LogOut, KeyRound, Search, ChevronRight, Menu, LifeBuoy } from 'lucide-react';
import Modal from '../common/Modal';
import { getPageLabel } from './Sidebar';
import CommandPalette from './CommandPalette';
import ReportProblem from '../common/ReportProblem';
import { useIsMobile } from '../../hooks/useIsMobile';
import axios from 'axios';

const Header = ({ onOpenDrawer }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  // Same wording as the menu entry the user clicked, so the toolbar always
  // answers "where am I?".
  const { section, page } = getPageLabel(pathname);
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // ⌘K on a Mac, Ctrl+K elsewhere — the shortcut every search box has taught.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passMessage, setPassMessage] = useState('');
  const [passError, setPassError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPassError('New passwords do not match');
    }

    setLoading(true);
    try {
      await axios.put('/auth/updatepassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPassMessage('Password changed successfully');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPassMessage('');
      }, 2000);
    } catch (err) {
      setPassError(err.response?.data?.message || 'Error changing password');
    }
    setLoading(false);
  };

  return (
    <>
      <header style={{
        height: '56px',
        flexShrink: 0,
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: isMobile ? '0 10px' : '0 20px',
        backgroundColor: 'var(--bg-secondary)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {/* On a phone the menu lives behind this button. 44px square — the
            size a thumb actually hits. */}
        {isMobile && (
          <button
            type="button"
            onClick={onOpenDrawer}
            className="icon-btn"
            title="Menu"
            aria-label="Open the menu"
            style={{ width: 40, height: 40 }}
          >
            <Menu size={19} />
          </button>
        )}

        {/* Where am I — same wording as the menu entry that got you here. */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', minWidth: 0, overflow: 'hidden' }}
          title={section ? section + ' \u203a ' + page : page}
        >
          {section && !isMobile && (
            <>
              <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{section}</span>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </>
          )}
          <span style={{
            color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {page}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Looks like a search box, works like a button: it opens the screen
              palette, which is where the typing happens. */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="search-trigger"
            title="Go to a screen"
            aria-label="Go to a screen"
            aria-haspopup="dialog"
            style={{
              height: isMobile ? 40 : 34, minWidth: isMobile ? 40 : 170,
              width: isMobile ? 40 : undefined,
              display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : undefined, gap: 8,
              padding: isMobile ? 0 : '0 8px 0 12px',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-subtle)',
              borderRadius: isMobile ? 'var(--radius-md)' : 'var(--radius-pill)',
              color: 'var(--text-muted)', fontSize: 13, cursor: isMobile ? 'pointer' : 'text',
              transition: 'border-color .12s ease, background-color .12s ease'
            }}
          >
            <Search size={isMobile ? 18 : 15} style={{ flexShrink: 0 }} />
            {!isMobile && <span style={{ flex: 1, textAlign: 'left' }}>Search</span>}
            {!isMobile && (
              <kbd style={{
                fontSize: 11, fontFamily: 'inherit', color: 'var(--text-muted)',
                background: 'var(--surface-raised)', border: '1px solid var(--border-default)',
                borderRadius: 6, padding: '1px 6px', lineHeight: '16px'
              }}>
                {isMac ? '⌘' : 'Ctrl'} K
              </kbd>
            )}
          </button>

          {/* Always one click away, on every screen. A problem reported where
              it happened carries the screen with it; a problem reported later
              from a different page carries the wrong one. */}
          <button
            onClick={() => setReportOpen(true)}
            className="icon-btn"
            title="Report a problem to the team"
            aria-label="Report a problem to the team"
            style={isMobile ? { width: 40, height: 40 } : undefined}
          >
            <LifeBuoy size={16} />
          </button>

          <button
            onClick={toggleTheme}
            className="icon-btn"
            title={isDarkMode ? 'Switch to light screen' : 'Switch to dark screen'}
            aria-label={isDarkMode ? 'Switch to light screen' : 'Switch to dark screen'}
            style={isMobile ? { width: 40, height: 40 } : undefined}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {!isMobile && (
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="icon-btn"
              title="Change password"
              aria-label="Change your password"
            >
              <KeyRound size={16} />
            </button>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            borderLeft: isMobile ? 'none' : '1px solid var(--border-subtle)',
            paddingLeft: isMobile ? 0 : '14px'
          }}>
            <div style={{
              width: 32, height: 32, flexShrink: 0, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary-solid), var(--accent-teal))',
              color: '#ffffff', fontSize: '12px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {[user?.firstName, user?.lastName].filter(Boolean).map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
            {!isMobile && <div style={{ lineHeight: 1.25, minWidth: 0 }}>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {user?.role?.name || user?.role || 'User'}
              </div>
            </div>}

            <button
              onClick={logout}
              className="icon-btn icon-btn--danger"
              title="Log out"
              aria-label="Log out of the system"
              style={isMobile ? { width: 40, height: 40 } : undefined}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      <ReportProblem open={reportOpen} onClose={() => setReportOpen(false)} />

      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Password">
        {passError && <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-danger)', border: '1px solid var(--border-color)', marginBottom: '1rem', fontSize: '12px' }}>{passError}</div>}
        {passMessage && <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-success)', border: '1px solid var(--border-color)', marginBottom: '1rem', fontSize: '12px' }}>{passMessage}</div>}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="input-group">
            <label className="input-label">Current Password</label>
            <input type="password" className="input-field" required value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} />
          </div>
          <div className="input-group">
            <label className="input-label">New Password</label>
            <input type="password" className="input-field" required value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} />
          </div>
          <div className="input-group">
            <label className="input-label">Confirm New Password</label>
            <input type="password" className="input-field" required value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Changing...' : 'Change Password'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Header;
