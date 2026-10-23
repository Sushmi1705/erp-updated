import React from 'react';
import { AlertTriangle, RefreshCw, LifeBuoy } from 'lucide-react';
import { recordRenderError, clearRenderError } from '../../utils/diagnostics';
import ReportProblem from './ReportProblem';

/**
 * Catches a render error in one page instead of letting it blank the whole app.
 *
 * There was no boundary anywhere in the app, so any thrown render turned the
 * entire screen white with nothing to act on — no page name, no message, and
 * an identical result whichever page failed.
 *
 * It also records failures on `window.__pageErrors`, which is what lets an
 * automated route crawl read a structured error per route rather than scrape
 * console text.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, reporting: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof window !== 'undefined') {
      window.__pageErrors = window.__pageErrors || [];
      window.__pageErrors.push({
        path: window.location?.pathname,
        message: String(error?.message || error),
        componentStack: info?.componentStack
      });
    }
    // So "Report this problem" arrives with the actual failure attached.
    recordRenderError(error?.message || String(error), info?.componentStack);
    console.error('Page render failed:', error, info?.componentStack);
  }

  // Without this a failed page stays failed while the user navigates away,
  // because the boundary keeps its error state across route changes.
  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      clearRenderError();
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ padding: 'var(--space-7) var(--space-6)', maxWidth: 620 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
          color: 'var(--status-negative-fg)', fontSize: 'var(--font-section)', fontWeight: 600
        }}>
          <AlertTriangle size={18} /> This page failed to load
        </div>
        <p style={{
          fontSize: 'var(--font-body)', color: 'var(--text-secondary)',
          margin: 'var(--space-4) 0 var(--space-6)', lineHeight: 'var(--leading-normal)'
        }}>
          The rest of the application is unaffected — use the menu to carry on working.
        </p>
        <pre style={{
          fontSize: 'var(--font-caption)', color: 'var(--status-negative-fg)',
          background: 'var(--status-negative-bg)', border: '1px solid var(--status-negative-border)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-5)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 'var(--space-6)'
        }}>
          {String(this.state.error?.message || this.state.error)}
        </pre>
        <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ error: null })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}
          >
            <RefreshCw size={14} /> Try again
          </button>
          {/* The one moment a report is most worth making and least likely to
              be made. The failure is already captured; this just sends it. */}
          <button
            className="btn btn-secondary"
            onClick={() => this.setState({ reporting: true })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}
          >
            <LifeBuoy size={14} /> Tell the team
          </button>
        </div>

        <ReportProblem
          open={this.state.reporting}
          onClose={() => this.setState({ reporting: false })}
          presetKind="Problem"
          presetDescription={`This screen failed to load: ${String(this.state.error?.message || this.state.error)}`}
        />
      </div>
    );
  }
}

export default ErrorBoundary;
