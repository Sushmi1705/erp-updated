/* Ask the operator to confirm, without a hook.
 *
 * Same bridge as notify(): the provider registers its asker here on mount, so
 * an event handler several functions deep can await an answer. window.confirm()
 * was used for exactly that reason — it was the only thing callable from there.
 *
 * Returns a promise for the answer, so a call site reads:
 *     if (!(await confirmAction('Delete this record?'))) return;
 */

let asker = null;

export const registerConfirmer = (fn) => { asker = fn; };

/** Split a plain sentence into a heading and the detail under it. */
const asOptions = (input) => {
  if (input && typeof input === 'object') return input;
  const text = String(input ?? 'Are you sure?');

  // "Delete goods receipt GRN-1. This cannot be undone." — the first sentence
  // is the question, the rest is the consequence.
  const match = text.match(/^(.*?[?.!])\s+(.*)$/s);
  const title = (match ? match[1] : text).trim();
  const message = match ? match[2].trim() : '';

  // A destructive action should not be confirmed with a neutral blue button.
  const destructive = /delete|remove|deactivate|cancel|void|discard|permanent|undone/i.test(text);
  const verb =
    /deactivat/i.test(text) ? 'Deactivate'
    : /remove/i.test(text) ? 'Remove'
    : /void/i.test(text) ? 'Void'
    : /cancel/i.test(text) ? 'Yes, cancel'
    : /delete/i.test(text) ? 'Delete'
    : 'Confirm';

  return { title, message, tone: destructive ? 'danger' : 'default', confirmLabel: verb };
};

export const confirmAction = (input) => {
  const options = asOptions(input);
  // Before the provider mounts there is nothing to ask with. Refusing is the
  // safe answer for an irreversible action.
  if (!asker) return Promise.resolve(false);
  return asker(options);
};

/* Ask for a value, in the app rather than through window.prompt().
 *
 *     const qty = await promptAction({ title: 'Update produced quantity', input: { type: 'number', min: 0, defaultValue: 120, required: true } });
 *     if (qty === null) return;   // cancelled
 *
 * Resolves to the trimmed string typed, or null when cancelled. */
export const promptAction = (options) => {
  if (!asker) return Promise.resolve(null);
  return asker({ tone: 'default', confirmLabel: 'Save', ...options, input: { type: 'text', required: true, ...(options.input || {}) } });
};

export default confirmAction;
