/* Page loader that survives a deployment.
 *
 * The app is code-split: each of the 80 routes is a separate chunk whose
 * filename carries a content hash, and index.html names the current ones. When
 * a new build goes out those hashes change and the old chunks stop existing —
 * so any browser still running the previous index.html asks for a file that is
 * no longer there and React shows "Failed to fetch dynamically imported
 * module". The user did nothing wrong and the app is not broken; their tab is
 * simply one build behind.
 *
 * That is unavoidable for a tab that was already open when the deploy landed,
 * so handle it rather than prevent it: on a chunk-load failure, reload once to
 * pick up the new index.html and its new chunk names.
 *
 * The sessionStorage flag is what stops a genuine outage from becoming a reload
 * loop — if the page still cannot load its chunk after one reload, the error is
 * allowed through to the ErrorBoundary, which shows it properly.
 */
import { lazy } from 'react';

const RELOAD_FLAG = 'chunk-reload-attempted';

// Vite and browsers word this differently depending on engine and failure mode.
const isChunkLoadError = (error) => {
  const message = String(error?.message || error || '');
  return (
    error?.name === 'ChunkLoadError' ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /'text\/html' is not a valid JavaScript MIME type/i.test(message)
  );
};

export function lazyWithReload(factory) {
  return lazy(async () => {
    try {
      const mod = await factory();
      // Loaded fine — clear the guard so a later deploy can reload again.
      window.sessionStorage?.removeItem(RELOAD_FLAG);
      return mod;
    } catch (error) {
      if (isChunkLoadError(error) && !window.sessionStorage?.getItem(RELOAD_FLAG)) {
        window.sessionStorage?.setItem(RELOAD_FLAG, '1');
        // Reload rather than retry the import: the stale index.html in memory
        // would just request the same missing filename again.
        window.location.reload();
        // Never settles — the reload replaces the page.
        return new Promise(() => {});
      }
      throw error;
    }
  });
}

export default lazyWithReload;
