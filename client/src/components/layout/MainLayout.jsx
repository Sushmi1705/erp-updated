import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from '../common/ErrorBoundary';
import { useIsMobile } from '../../hooks/useIsMobile';

const MainLayout = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  // On a phone the menu is a drawer over the page rather than a column beside
  // it — 244px of a 375px screen left nothing for the work.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Nothing here locks body scrolling: index.css already holds the body at
  // overflow:hidden (the page-wrapper is the scroll container), and the
  // backdrop below covers the page, so the list behind the drawer cannot be
  // dragged under the user's thumb.

  return (
    <div className="app-container">
      <Sidebar mobileOpen={drawerOpen} onCloseDrawer={() => setDrawerOpen(false)} />
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, background: 'var(--surface-overlay)', zIndex: 39 }}
        />
      )}
      <main className="main-content">
        <Header onOpenDrawer={() => setDrawerOpen(true)} />
        <div className="page-wrapper">
          {/* Scoped to the page outlet so the sidebar and header survive a
              failed page — the user can navigate away instead of reloading.
              resetKey clears the error when the route changes. */}
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
