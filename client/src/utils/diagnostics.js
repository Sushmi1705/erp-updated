/* What the app was doing when something went wrong.
 *
 * A report that says "it won't let me save" is not actionable, and that is
 * what a report will say — a store keeper at the gate is not going to open
 * the console and copy a stack trace. So the app keeps a short rolling record
 * of the last failed request and the last few errors, and the report carries
 * it automatically.
 *
 * Deliberately small and in memory only: the last failed call and at most ten
 * errors, never request or response bodies, so nothing a customer or a price
 * list sits in here waiting to be posted somewhere.
 */

const MAX_ERRORS = 10;

const state = {
  lastFailedRequest: null,
  consoleErrors: [],
  renderError: null
};

export const recordFailedRequest = ({ method, url, status, message }) => {
  state.lastFailedRequest = {
    method: String(method || 'GET').toUpperCase(),
    url: String(url || '').slice(0, 300),
    status: Number(status) || 0,
    message: String(message || '').slice(0, 300),
    at: new Date().toISOString()
  };
};

export const recordError = (message) => {
  const text = String(message || '').slice(0, 400);
  if (!text) return;
  // The same error firing every render should not push out the earlier ones.
  const last = state.consoleErrors[state.consoleErrors.length - 1];
  if (last && last.message === text) return;
  state.consoleErrors.push({ message: text, at: new Date().toISOString() });
  if (state.consoleErrors.length > MAX_ERRORS) state.consoleErrors.shift();
};

export const recordRenderError = (message, componentStack) => {
  state.renderError = {
    message: String(message || '').slice(0, 400),
    componentStack: String(componentStack || '').slice(0, 2000)
  };
};

export const clearRenderError = () => { state.renderError = null; };

/** Everything worth attaching to a report. */
export const snapshot = () => ({
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : '',
  viewport: typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '',
  // Which build they are on, so a report from a stale tab is recognisable.
  appVersion: typeof document !== 'undefined' ? (document.querySelector('script[src*="index-"]')?.src.match(/index-([\w-]+)\.js/)?.[1] || 'unknown') : 'unknown',
  lastFailedRequest: state.lastFailedRequest,
  consoleErrors: [...state.consoleErrors],
  renderError: state.renderError
});

/* Catch what the app never handled: a thrown promise nobody awaited, and a
   script error. Both are invisible to the user, who only sees a screen that
   did not do what they asked. */
if (typeof window !== 'undefined' && !window.__diagnosticsHooked) {
  window.__diagnosticsHooked = true;
  window.addEventListener('error', (e) => recordError(e?.message || 'Script error'));
  window.addEventListener('unhandledrejection', (e) => {
    const r = e?.reason;
    recordError(r?.message || (typeof r === 'string' ? r : 'A request failed and nothing handled it'));
  });
}
