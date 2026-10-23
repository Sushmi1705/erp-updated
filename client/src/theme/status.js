/* The canonical status vocabulary.
 *
 * Thirty-three pages each carried their own status-to-colour map, and they
 * disagreed: "Completed" rendered green on some screens, amber on another,
 * purple on another and red on another. Same word, four meanings. This module
 * replaces all of them.
 *
 * The rule that settles the arguments:
 *
 *   Colour marks a terminal verdict or a deviation from expected.
 *   Everything else is grey.
 *
 * A corollary worth keeping in mind when adding statuses: if a state describes
 * most rows in a typical table, it is a candidate for neutral. Red lands on
 * only three of the twenty-five states below, which is the point — when a red
 * badge appears on a planner's screen it means "this is dead, stop waiting for
 * it", every time, on every page.
 */

export const INTENTS = Object.freeze({
  NEUTRAL: 'neutral',   // not started, or finished with no verdict — nobody is waiting
  INFO: 'info',         // queued or authorised; work has not begun
  PROGRESS: 'progress', // actively underway, or partially done
  POSITIVE: 'positive', // succeeded, or available for use — terminal good
  CAUTION: 'caution',   // blocked, at risk, or needs a human decision — not failed yet
  NEGATIVE: 'negative'  // a decision went against it, or it failed — terminal bad
});

// Normalised so 'In Progress', 'In-Progress' and 'in_progress' are one key.
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const MAP = {
  // ── neutral ─────────────────────────────────────────────────────────────
  draft: INTENTS.NEUTRAL,
  inactive: INTENTS.NEUTRAL,
  closed: INTENTS.NEUTRAL,       // finished, no verdict — deliberately not green
  cancelled: INTENTS.NEUTRAL,    // nothing failed; someone chose to stop
  canceled: INTENTS.NEUTRAL,     // WOHeader spells it with one l
  void: INTENTS.NEUTRAL,
  cancelledvoid: INTENTS.NEUTRAL,
  expired: INTENTS.NEUTRAL,
  notscheduled: INTENTS.NEUTRAL,
  notstarted: INTENTS.NEUTRAL,
  obsolete: INTENTS.NEUTRAL,
  aborted: INTENTS.NEUTRAL,
  reversed: INTENTS.NEUTRAL,
  voided: INTENTS.NEUTRAL,
  none: INTENTS.NEUTRAL,
  idle: INTENTS.NEUTRAL,          // machine at rest is not a fault

  // ── info ────────────────────────────────────────────────────────────────
  pending: INTENTS.INFO,         // queued work; nobody is blocked
  open: INTENTS.INFO,
  released: INTENTS.INFO,        // authorised and on the floor, work not yet started
  sent: INTENTS.INFO,
  senttocustomer: INTENTS.INFO,
  notsent: INTENTS.INFO,
  requested: INTENTS.INFO,
  new: INTENTS.INFO,
  submitted: INTENTS.INFO,
  quoted: INTENTS.INFO,
  planned: INTENTS.INFO,
  scheduled: INTENTS.INFO,
  assigned: INTENTS.INFO,
  present: INTENTS.INFO,

  // ── progress ────────────────────────────────────────────────────────────
  processing: INTENTS.PROGRESS,
  inprogress: INTENTS.PROGRESS,
  partiallyshipped: INTENTS.PROGRESS,
  partiallypaid: INTENTS.PROGRESS,
  partiallyreceived: INTENTS.PROGRESS,
  partiallyallocated: INTENTS.PROGRESS,
  intransit: INTENTS.PROGRESS,
  underinvestigation: INTENTS.PROGRESS,
  pendingactions: INTENTS.PROGRESS,
  rework: INTENTS.PROGRESS,
  picked: INTENTS.PROGRESS,
  inspecting: INTENTS.PROGRESS,
  inreview: INTENTS.PROGRESS,
  evaluating: INTENTS.PROGRESS,
  calculating: INTENTS.PROGRESS,
  feasibilitycheck: INTENTS.PROGRESS,
  investigating: INTENTS.PROGRESS,
  packing: INTENTS.PROGRESS,
  loading: INTENTS.PROGRESS,
  departed: INTENTS.PROGRESS,
  arrivedathub: INTENTS.PROGRESS,
  outfordelivery: INTENTS.PROGRESS,
  partiallydelivered: INTENTS.PROGRESS,
  pendingclearing: INTENTS.PROGRESS,
  running: INTENTS.PROGRESS,      // machine actively producing
  setup: INTENTS.PROGRESS,

  // ── positive ────────────────────────────────────────────────────────────
  approved: INTENTS.POSITIVE,
  completed: INTENTS.POSITIVE,   // decided once — see the note below
  active: INTENTS.POSITIVE,
  posted: INTENTS.POSITIVE,      // irreversibly committed to the ledger
  paid: INTENTS.POSITIVE,
  pass: INTENTS.POSITIVE,
  passed: INTENTS.POSITIVE,
  accepted: INTENTS.POSITIVE,
  delivered: INTENTS.POSITIVE,
  received: INTENTS.POSITIVE,
  acknowledged: INTENTS.POSITIVE,
  awarded: INTENTS.POSITIVE,
  fullyallocated: INTENTS.POSITIVE,
  fullyapplied: INTENTS.POSITIVE,
  applied: INTENTS.POSITIVE,
  cleared: INTENTS.POSITIVE,
  resolved: INTENTS.POSITIVE,
  executed: INTENTS.POSITIVE,
  dispatched: INTENTS.POSITIVE,
  finalized: INTENTS.POSITIVE,
  filed: INTENTS.POSITIVE,
  confirmed: INTENTS.POSITIVE,
  closedwon: INTENTS.POSITIVE,    // a won sale is the best outcome there is
  implemented: INTENTS.POSITIVE,
  successfullydelivered: INTENTS.POSITIVE,

  // ── caution ─────────────────────────────────────────────────────────────
  pendingapproval: INTENTS.CAUTION,   // a named person must act — the most actionable state here
  pendingreview: INTENTS.CAUTION,
  holdreview: INTENTS.CAUTION,
  onhold: INTENTS.CAUTION,
  hold: INTENTS.CAUTION,
  overdue: INTENTS.CAUTION,           // an overdue invoice can still be collected
  quarantined: INTENTS.CAUTION,       // held pending disposition; not yet rejected
  conditionalaccept: INTENTS.CAUTION,
  actiontaken: INTENTS.CAUTION,
  backordered: INTENTS.CAUTION,
  creditHold: INTENTS.CAUTION,
  credithold: INTENTS.CAUTION,
  adminhold: INTENTS.CAUTION,
  maketoorder: INTENTS.CAUTION,
  shortage: INTENTS.CAUTION,
  delayed: INTENTS.CAUTION,
  paused: INTENTS.CAUTION,
  waitingonspares: INTENTS.CAUTION,
  maintenance: INTENTS.CAUTION,   // planned stop, but the press is not making parts
  conditional: INTENTS.CAUTION,

  // ── negative ────────────────────────────────────────────────────────────
  rejected: INTENTS.NEGATIVE,
  rejectedbyvendor: INTENTS.NEGATIVE,
  failed: INTENTS.NEGATIVE,
  fail: INTENTS.NEGATIVE,
  bounced: INTENTS.NEGATIVE,
  scrapped: INTENTS.NEGATIVE,
  critical: INTENTS.NEGATIVE,
  closedlost: INTENTS.NEGATIVE,
  exception: INTENTS.NEGATIVE,
  offline: INTENTS.NEGATIVE,
  absent: INTENTS.NEGATIVE
};

/* Three calls that will get argued about, recorded so they are not re-litigated:
 *
 * "Completed" is positive. A completed work order, inspection or dispatch is the
 * desired terminal state of a press-shop transaction, and green is what the shop
 * floor already expects. "Closed" carries the "over, no verdict" meaning instead.
 *
 * "Pending Approval" is caution while plain "Pending" is info. The distinction is
 * who is blocked: a pending inspection is queued work moving through the system;
 * a pending approval is a document frozen until a named person clicks. Colouring
 * both the same loses the plant manager's most useful scan.
 *
 * "Overdue" is caution, not negative. An overdue order can still ship. Severity
 * belongs in an ageing bucket column, where "97 days" is actionable and a binary
 * "Overdue" is not.
 */

/* Severity (Critical / High / Medium / Low) is a different vocabulary that
 * happens to be rendered by the same badge. Only Critical is mapped here; High,
 * Medium and Low deliberately stay neutral, because colouring three of four
 * severity levels turns a shortage list into a traffic jam. If severity needs
 * its own ramp, give it one — do not borrow the status intents.
 */

const warned = new Set();

/** Resolve any status string to one of the six intents. Unknown values are neutral. */
export function resolveIntent(value) {
  const key = norm(value);
  const hit = MAP[key];
  if (hit) return hit;
  // Surfacing unknown vocabulary in development is how the remaining statuses
  // get found, without a missing entry ever breaking a screen.
  if (key && import.meta.env?.DEV && !warned.has(key)) {
    warned.add(key);
    console.warn(`[status] no intent mapped for "${value}" — falling back to neutral`);
  }
  return INTENTS.NEUTRAL;
}

/** The CSS custom properties for an intent. */
export function intentTokens(intent) {
  return {
    color: `var(--status-${intent}-fg)`,
    backgroundColor: `var(--status-${intent}-bg)`,
    borderColor: `var(--status-${intent}-border)`
  };
}

export function statusTokens(value) {
  return intentTokens(resolveIntent(value));
}
