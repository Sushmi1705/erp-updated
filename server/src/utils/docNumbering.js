const DocSequence = require('../models/DocSequence');

/**
 * Generate next sequential, collision-safe document number.
 * Uses MongoDB findOneAndUpdate with $inc for atomicity.
 * @param {string} docType - e.g. 'INV', 'BILL', 'JE', 'GRN', 'PO', 'PR', 'WO', 'MRP'
 * @param {string} prefix - e.g. 'INV', 'BILL'
 * @param {object} session - optional mongoose session for transaction context
 */
const generateDocNumber = async (docType, prefix, session = null) => {
  const opts = session ? { session } : {};
  const seq = await DocSequence.findOneAndUpdate(
    { docType },
    { $inc: { currentNumber: 1 }, $setOnInsert: { prefix, padding: 5 } },
    { upsert: true, new: true, ...opts }
  );
  const padded = String(seq.currentNumber).padStart(seq.padding, '0');
  return `${seq.prefix}-${seq.fiscalYear}-${padded}`;
};

module.exports = { generateDocNumber };
