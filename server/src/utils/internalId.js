/* Identifiers for internal records.
 *
 * Most records in this system took their id from
 * `${PREFIX}-${Date.now().toString().slice(-6)}`. Those last six digits are the
 * bottom of the epoch in milliseconds, and they repeat every 10^6 ms — sixteen
 * minutes and forty seconds. Two packing notes raised in the same shift
 * therefore collide, and most of these ids sit on unique indexes, so the second
 * one does not get a strange number: it fails to save.
 *
 * The counter is what makes calls within the same millisecond distinct; the
 * timestamp is what keeps ids roughly time-ordered and distinct across
 * restarts. Base 36 keeps them short enough to read out over a phone.
 *
 * This is deliberately NOT for anything a person outside the company counts on
 * being gap-free — invoices, bills, payments, journal entries. Those go through
 * generateDocNumber, which keeps a real sequence per document type, because an
 * auditor reading a jump from INV-000041 to INV-000043 wants to know what
 * happened to 42.
 */

let counter = 0;

/**
 * @param {string} prefix short document tag, e.g. 'PKG', 'EVT'
 * @returns {string} e.g. PKG-M8QK2P4-0007
 */
const internalId = (prefix) => {
  counter = (counter + 1) % 10000;
  const stamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${stamp}-${String(counter).padStart(4, '0')}`;
};

module.exports = { internalId };
