/* Notifications that don't need a hook.
 *
 * The app has a working ToastProvider mounted at the root, but reaching it means
 * calling useToast() — a hook, so only legal at the top of a component body.
 * Nearly every message in this app is raised from inside an event handler or a
 * catch block, often several functions deep, which is why 190 of them ended up
 * as window.alert(): the browser dialog was the only thing callable from there.
 *
 * That dialog freezes the whole page until the operator clicks OK, appears
 * bare-chrome above the app, and cannot say whether what happened was good or
 * bad. On a shop floor that is a real cost — a supervisor recording press output
 * gets a modal box between them and the next entry.
 *
 * So the provider registers its sink here on mount, and anything that needs to
 * tell the operator something imports `notify` and calls it. No hook, no
 * component, no blocking.
 */

let sink = null;
const pending = [];

/** Called once by ToastProvider when it mounts. */
export const registerNotifier = (fn) => {
  sink = fn;
  // Anything raised during the first render (a failed fetch on page load, most
  // often) is held rather than dropped, then shown once there is somewhere to
  // put it.
  while (pending.length) {
    const [message, kind] = pending.shift();
    fn(message, kind);
  }
};

const emit = (kind, message) => {
  // Errors arrive as Error objects, axios failures, or plain strings.
  const text =
    typeof message === 'string' ? message
    : message?.response?.data?.message || message?.message || String(message ?? '');
  if (!text) return;
  if (sink) sink(text, kind);
  else pending.push([text, kind]);
};

export const notify = {
  success: (message) => emit('success', message),
  error: (message) => emit('error', message),
  warning: (message) => emit('warning', message),
  info: (message) => emit('info', message),
};

export default notify;
