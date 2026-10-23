/* What an edit request is allowed to change.
 *
 * Twenty update handlers passed req.body straight to findByIdAndUpdate. That
 * hands the caller every field in the schema: the document number the server
 * generated, who created the record, who approved it and when. None of those
 * are the editor's to set — a client that sends `orderNumber` with an edit
 * renames the order, and one that sends `approvedBy` forges a sign-off.
 *
 * editable() returns the body without those fields. Everything else still
 * goes through, so screens that genuinely edit status or approvalStatus on
 * their own record (inquiry, engineering change) keep working.
 */

const SYSTEM_FIELDS = new Set([
  '_id', '__v', 'createdAt', 'updatedAt',
  'createdBy', 'updatedBy', 'approvedBy', 'approvedAt',
  'closedBy', 'closedAt', 'postedBy', 'postedAt'
]);

// Server-generated document identifiers, one set per model with an open
// update handler. Generated once on create; never overwritten by an edit.
const DOC_NUMBERS = new Set([
  'planNumber', 'Plan_Number', 'bomCode', 'routingCode', 'routingNumber',
  'ecrId', 'ecrNumber', 'changeNumber', 'forecastNumber', 'scheduleNumber',
  'breakdownNumber', 'workOrderNumber', 'WO_Number', 'downtimeNumber',
  'inspectionNumber', 'ncrNumber', 'inquiryNumber', 'orderNumber', 'quotationNumber'
]);

const editable = (body) => {
  const out = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (key.startsWith('$')) continue;              // no operators from the wire
    if (SYSTEM_FIELDS.has(key) || DOC_NUMBERS.has(key)) continue;
    out[key] = value;
  }
  return out;
};

module.exports = { editable, SYSTEM_FIELDS, DOC_NUMBERS };
