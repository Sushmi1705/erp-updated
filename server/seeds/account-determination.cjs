/* Sets up the accounts and rules that let stock movements reach the ledger.
 *
 * Safe to run more than once — everything here is matched on its code or key
 * and updated in place rather than duplicated.
 *
 *   node seeds/account-determination.cjs
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const { ChartOfAccounts } = require('../src/models/GeneralLedger');
const { AccountDetermination } = require('../src/models/AccountDetermination');

/* Three accounts the press shop's books need but did not have.
 *
 * WIP is the big one: steel that has left the store but is not yet a finished
 * bracket is neither raw material nor finished goods, and without somewhere to
 * hold it the production postings have nowhere to go. (The scrap posting in
 * production.controller already searches for a WIP account and quietly gives
 * up when it finds none.)
 *
 * GR/IR is the account that makes a goods receipt possible before the bill
 * arrives: at receipt we owe the supplier, but no invoice exists yet, so the
 * amount sits here until their bill clears it.
 */
const NEW_ACCOUNTS = [
  {
    Account_ID: '1520', Account_Number: '1520',
    Account_Name: 'Work in Progress — Press Shop',
    Account_Type: 'Asset',
    note: 'material issued to a press but not yet finished'
  },
  {
    Account_ID: '2050', Account_Number: '2050',
    Account_Name: 'Goods Received Not Invoiced (GR/IR)',
    Account_Type: 'Liability',
    Is_Control_Account: true,
    note: 'owed for material received before the supplier bill arrives'
  },
  {
    Account_ID: '5900', Account_Number: '5900',
    Account_Name: 'Scrap & Rejection Loss',
    Account_Type: 'Expense',
    note: 'value written off when parts are spoiled on the press'
  }
];

/* How each movement posts. Read as: this happens, so debit X and credit Y. */
const RULES = [
  {
    Movement_Type: 'GOODS_RECEIPT', Valuation_Class: '*',
    debit: '1500', credit: '2050',
    Description: 'Material received from supplier — stock rises, amount owed accrues until the bill arrives'
  },
  {
    Movement_Type: 'VENDOR_BILL_CLEARING', Valuation_Class: '*',
    debit: '2050', credit: '2000',
    Description: "Supplier's bill received — clears the accrual and becomes a payable"
  },
  {
    Movement_Type: 'GOODS_ISSUE_PRODUCTION', Valuation_Class: '*',
    debit: '1520', credit: '1500',
    Description: 'Material issued to a work order — leaves the store, enters work in progress'
  },
  {
    Movement_Type: 'PRODUCTION_RECEIPT', Valuation_Class: '*',
    debit: '1550', credit: '1520',
    Description: 'Finished parts booked in — leaves work in progress, enters finished goods'
  },
  {
    Movement_Type: 'DISPATCH_COGS', Valuation_Class: '*',
    debit: '5000', credit: '1550',
    Description: 'Goods despatched to the customer — finished goods become the cost of that sale'
  },
  {
    Movement_Type: 'SCRAP_LOSS', Valuation_Class: '*',
    debit: '5900', credit: '1520',
    Description: 'Parts spoiled on the press — written off out of work in progress'
  },
  {
    Movement_Type: 'STOCK_ADJUSTMENT', Valuation_Class: '*',
    debit: '5900', credit: '1500',
    Description: 'Physical count correction — shortfall written off against stock'
  }
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('Accounts');
  for (const { note, ...acc } of NEW_ACCOUNTS) {
    const existing = await ChartOfAccounts.findOne({ Account_Number: acc.Account_Number });
    if (existing) {
      console.log(`  = ${acc.Account_Number}  ${acc.Account_Name} (already present)`);
      continue;
    }
    await ChartOfAccounts.create({ ...acc, Status: 'Active' });
    console.log(`  + ${acc.Account_Number}  ${acc.Account_Name}`);
    console.log(`      ${note}`);
  }

  const byCode = {};
  for (const a of await ChartOfAccounts.find({})) byCode[a.Account_Number] = a;

  console.log('\nPosting rules');
  for (const { debit, credit, ...rule } of RULES) {
    const dr = byCode[debit], cr = byCode[credit];
    if (!dr || !cr) {
      console.log(`  ! ${rule.Movement_Type}: missing account ${!dr ? debit : credit} — skipped`);
      continue;
    }
    await AccountDetermination.findOneAndUpdate(
      { Movement_Type: rule.Movement_Type, Valuation_Class: rule.Valuation_Class },
      { ...rule, Debit_Account_ID: dr._id, Credit_Account_ID: cr._id, Status: 'Active' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ${rule.Movement_Type.padEnd(24)} Dr ${debit} ${dr.Account_Name}`);
    console.log(`  ${''.padEnd(24)} Cr ${credit} ${cr.Account_Name}`);
  }

  const total = await AccountDetermination.countDocuments({ Status: 'Active' });
  console.log(`\n${total} active rules. Stock movements can now post to the ledger.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
