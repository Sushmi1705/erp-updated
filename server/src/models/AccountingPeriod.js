const mongoose = require('mongoose');

/* A calendar month of the books, and whether it is still open to posting.
 *
 * Once a month's figures have been reported — GST filed, the owner shown the
 * P&L — a document dated into it changes numbers someone has already signed.
 * Closing the month stops that: every finance posting checks the document's
 * date against this table and refuses a closed month. Corrections go in as a
 * dated entry in the current month, which is how books are meant to be kept.
 *
 * Only months that have been closed exist here; an absent month is open. */
const accountingPeriodSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },     // 'YYYY-MM'
  year: { type: Number, required: true },
  month: { type: Number, required: true },                  // 1–12
  status: { type: String, enum: ['Open', 'Closed'], default: 'Closed' },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closedAt: { type: Date },
  reopenedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reopenedAt: { type: Date },
  note: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('AccountingPeriod', accountingPeriodSchema);
