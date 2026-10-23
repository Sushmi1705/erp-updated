const { JournalEntry, JournalEntryLine, ChartOfAccounts } = require('../models/GeneralLedger');
const { generateDocNumber } = require('../utils/docNumbering');

/**
 * Post a balanced double-entry journal to the GL.
 * Validates that total debits == total credits before posting.
 * 
 * @param {object} params
 * @param {string} params.sourceModule - 'AR'|'AP'|'Inventory'|'Manual'|'System'
 * @param {string} params.description - Human-readable description
 * @param {Array} params.lines - [{accountName, accountType, type:'Debit'|'Credit', amount, referenceType, referenceId}]
 * @param {mongoose.ClientSession} params.session - MongoDB session for atomicity
 * @param {string} params.userId - user performing the action
 */
const postJournalEntry = async ({ sourceModule, description, lines, session, userId }) => {
  const opts = session ? { session } : {};
  
  // Validate balance
  const totalDebits = lines.filter(l => l.type === 'Debit').reduce((sum, l) => sum + l.amount, 0);
  const totalCredits = lines.filter(l => l.type === 'Credit').reduce((sum, l) => sum + l.amount, 0);
  
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error(`GL imbalance: Debits (${totalDebits}) ≠ Credits (${totalCredits}). Journal entry rejected.`);
  }
  
  const entryNumber = await generateDocNumber('JE', 'JE', session);
  
  const [entry] = await JournalEntry.create([{
    Entry_Number: entryNumber,
    Entry_Date: new Date(),
    Source_Module: sourceModule,
    Description: description,
    Status: 'Posted',
    createdBy: userId
  }], opts);
  
  const lineDocuments = lines.map((line, idx) => ({
    Entry_ID: entry._id,
    Line_Sequence: idx + 1,
    Account_ID: line.accountId,  // ObjectId ref to ChartOfAccounts
    Type: line.type,
    Amount: Math.round(line.amount * 100) / 100,
    Reference_Type: line.referenceType || 'General',
    Reference_ID: line.referenceId ? String(line.referenceId) : ''
  }));
  
  await JournalEntryLine.insertMany(lineDocuments, opts);
  
  return entry;
};

/**
 * Find a Chart of Accounts entry by account name (fallback lookup)
 * Prefer looking up by Account_Number in production
 */
const findAccount = async (accountName, session) => {
  const opts = session ? { session } : {};
  return ChartOfAccounts.findOne({ 
    Account_Name: { $regex: new RegExp(accountName, 'i') },
    Status: 'Active'
  }, null, opts);
};

module.exports = { postJournalEntry, findAccount };
