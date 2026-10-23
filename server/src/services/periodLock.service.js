const AccountingPeriod = require('../models/AccountingPeriod');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const keyFor = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const labelFor = (key) => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

/** The closed period covering `date`, or null when that month is open. */
const closedPeriodFor = async (date) => {
  if (!date || Number.isNaN(new Date(date).getTime())) return null;
  return AccountingPeriod.findOne({ key: keyFor(date), status: 'Closed' }).lean();
};

/**
 * Refuses a posting dated into a closed month. Returns null when the month is
 * open, otherwise the response body to send back with a 423 — the document
 * is not wrong, the month is locked.
 *
 *   const locked = await periodLockFor(Entry_Date, 'journal entry');
 *   if (locked) return res.status(423).json(locked);
 */
const periodLockFor = async (date, what = 'document') => {
  const closed = await closedPeriodFor(date);
  if (!closed) return null;
  return {
    success: false,
    periodClosed: true,
    period: closed.key,
    message:
      `${labelFor(closed.key)} is closed — this ${what} is dated ${new Date(date).toLocaleDateString('en-IN')}, ` +
      `inside a month whose figures have already been reported. Date it in the current month, ` +
      `or ask an administrator to reopen ${labelFor(closed.key)} on the General Ledger screen.`
  };
};

module.exports = { keyFor, labelFor, closedPeriodFor, periodLockFor };
