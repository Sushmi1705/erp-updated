const { AccountDetermination } = require('../models/AccountDetermination');
const { JournalEntry, JournalEntryLine } = require('../models/GeneralLedger');
const { generateDocNumber } = require('../utils/docNumbering');

/* Posts the accounting side of a stock movement.
 *
 * Every movement of material has a value as well as a quantity, and the two
 * belong in the same transaction — otherwise the store and the books drift
 * apart and nobody can say which is right. This is the single place that writes
 * that value, so the rule "quantity and value move together" is enforced in one
 * function rather than remembered in a dozen controllers.
 *
 * The caller passes the movement and the amount; which accounts to hit comes
 * from the AccountDetermination table, not from here.
 */

/** Look up the rule, preferring the material-specific one over the fallback. */
const findRule = async (movementType, valuationClass, session) => {
  const q = AccountDetermination.findOne({
    Movement_Type: movementType,
    Valuation_Class: valuationClass || '*',
    Status: 'Active'
  });
  if (session) q.session(session);
  const specific = await q;
  if (specific) return specific;

  const fq = AccountDetermination.findOne({
    Movement_Type: movementType, Valuation_Class: '*', Status: 'Active'
  });
  if (session) fq.session(session);
  return fq;
};

/**
 * Write the journal entry for one stock movement.
 *
 * Returns the created entry, or null when there is nothing to post — a zero or
 * negative amount is not an error, it just means no value moved.
 *
 * Throws when no rule exists. That is deliberate: silently skipping the posting
 * is how the books got out of step in the first place, and a missing rule is a
 * setup problem an accountant must fix, not something to paper over.
 */
const postStockMovement = async ({
  movementType,
  valuationClass,
  amount,
  description,
  referenceId,
  referenceType = 'General',
  entryDate,
  session
}) => {
  const value = Number(amount);
  if (!isFinite(value) || value <= 0) return null;

  const rule = await findRule(movementType, valuationClass, session);
  if (!rule) {
    throw new Error(
      `No account determination rule for movement ${movementType}` +
      (valuationClass ? ` (valuation class ${valuationClass})` : '') +
      '. Set one up under Finance before posting this movement.'
    );
  }

  const rounded = Number(value.toFixed(2));
  const entryNumber = await generateDocNumber('JE', 'JE', session);
  // Mongoose refuses a multi-document create inside a session unless the
  // writes are explicitly ordered.
  const opts = session ? { session, ordered: true } : {};

  const [entry] = await JournalEntry.create([{
    Entry_ID: entryNumber,
    Entry_Number: entryNumber,
    Entry_Date: entryDate || new Date(),
    Source_Module: 'Inventory',
    Description: description || `${movementType} ${referenceId || ''}`.trim(),
    Status: 'Posted'
  }], opts);

  // Debit and credit are written together and for the same amount, so an entry
  // can never be half-posted.
  await JournalEntryLine.create([
    {
      Line_ID: `${entryNumber}-1`,
      Entry_ID: entry._id,
      Line_Sequence: 1,
      Account_ID: rule.Debit_Account_ID,
      Type: 'Debit',
      Amount: rounded,
      Base_Currency_Amount: rounded,
      Reference_Type: referenceType,
      Reference_ID: String(referenceId || '')
    },
    {
      Line_ID: `${entryNumber}-2`,
      Entry_ID: entry._id,
      Line_Sequence: 2,
      Account_ID: rule.Credit_Account_ID,
      Type: 'Credit',
      Amount: rounded,
      Base_Currency_Amount: rounded,
      Reference_Type: referenceType,
      Reference_ID: String(referenceId || '')
    }
  ], opts);

  return entry;
};

/* What a work order has accumulated in work in progress and not yet given up.
 *
 * Finished parts are worth what went into making them, so booking them in has
 * to relieve the value that material issues put into WIP for that order — not
 * some price looked up elsewhere. Valuing output independently is what drove
 * WIP negative: ₹2.48L of finished goods came out of an order that had only
 * ₹31,000 of steel issued to it.
 *
 * Debits are what issues added; credits are what earlier output already took
 * back out. The difference is what is still sitting on the shop floor.
 */
const wipBalanceForOrder = async (workOrderId, session) => {
  const { JournalEntryLine } = require('../models/GeneralLedger');
  const q = JournalEntryLine.aggregate([
    { $match: { Reference_ID: String(workOrderId) } },
    { $lookup: { from: 'chartofaccounts', localField: 'Account_ID', foreignField: '_id', as: 'acct' } },
    { $unwind: '$acct' },
    { $match: { 'acct.Account_Number': '1520' } },
    { $group: {
        _id: null,
        debits:  { $sum: { $cond: [{ $eq: ['$Type', 'Debit'] },  '$Amount', 0] } },
        credits: { $sum: { $cond: [{ $eq: ['$Type', 'Credit'] }, '$Amount', 0] } }
    } }
  ]);
  if (session) q.session(session);
  const [row] = await q;
  return Number((((row?.debits) || 0) - ((row?.credits) || 0)).toFixed(2));
};

module.exports = { postStockMovement, findRule, wipBalanceForOrder };
