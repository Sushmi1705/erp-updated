// Currency formatting for an Indian company billing in rupees.
//
// Several screens still print a hardcoded '$' (AccountsReceivable, the credit
// limit in CustomerMaster, PurchaseOrder totals). Converting those is a
// separate sweep; this gives that sweep something to call rather than each
// page inventing its own.

/** Compact rupees for tiles and headline figures: ₹35.4K, ₹1.2Cr. */
export const fmtMoney = (n) => {
  const v = Number(n) || 0;
  try {
    return '₹' + new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(v);
  } catch {
    // Older engines without `notation: 'compact'` support.
    return '₹' + v.toLocaleString('en-IN');
  }
};

/** Full rupees for tables and documents, where exact paise matter: ₹3,54,000.00 */
export const fmtMoneyFull = (n) => {
  const v = Number(n) || 0;
  try {
    return '₹' + new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(v);
  } catch {
    return '₹' + v.toFixed(2);
  }
};

/** Plain integer counts with Indian grouping: 1,23,456 */
export const fmtQty = (n) => {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat('en-IN').format(v);
  } catch {
    return String(v);
  }
};
