const mongoose = require('mongoose');

/* Which accounts a stock movement posts to.
 *
 * When steel arrives at the gate, two things are true at once: the store holds
 * more material, and the company owes the supplier for it. Today only the first
 * is recorded — the goods receipt raises stock and writes nothing to the books,
 * so ₹85,250 of steel can enter the plant and the ledger shows ₹0.
 *
 * This is the table that closes that gap. It answers one question — "for this
 * kind of movement, on this kind of material, which account is debited and
 * which is credited" — so the posting code never has to guess, and the rules
 * can be corrected by an accountant without touching code. SAP calls the same
 * idea automatic account determination.
 *
 * Keeping it as data rather than a switch statement matters because these
 * choices are the accountant's, not the programmer's: a firm may want tooling
 * steel in a different inventory account from sheet, and that should be a row,
 * not a deploy.
 */

const MOVEMENTS = [
  'GOODS_RECEIPT',        // supplier delivered — stock up, we owe them
  'GOODS_ISSUE_PRODUCTION', // steel handed to a press — leaves stores, enters WIP
  'PRODUCTION_RECEIPT',   // finished parts booked in — leaves WIP, enters finished goods
  'DISPATCH_COGS',        // sent to the customer — finished goods become a cost of sale
  'SCRAP_LOSS',           // spoiled on the press — written off out of WIP
  'STOCK_ADJUSTMENT',     // physical count correction
  'VENDOR_BILL_CLEARING'  // the supplier's bill arrives and clears what we accrued at receipt
];

const accountDeterminationSchema = new mongoose.Schema({
  Movement_Type: { type: String, enum: MOVEMENTS, required: true },

  // The material's valuation class. '*' is the fallback used when no more
  // specific rule exists, so a new material type still posts somewhere sane
  // rather than failing silently.
  Valuation_Class: { type: String, default: '*' },

  Debit_Account_ID:  { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccounts', required: true },
  Credit_Account_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccounts', required: true },

  Description: { type: String, default: '' },
  Status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// One active rule per movement and valuation class — two would make the posting
// depend on document order, which is exactly the ambiguity this table removes.
accountDeterminationSchema.index(
  { Movement_Type: 1, Valuation_Class: 1 },
  { unique: true, partialFilterExpression: { Status: 'Active' } }
);

const AccountDetermination = mongoose.model('AccountDetermination', accountDeterminationSchema);

module.exports = { AccountDetermination, MOVEMENTS };
