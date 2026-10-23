const { handleError } = require('../utils/errorHandler');
const Issue = require('../models/Issue');
const { generateDocNumber } = require('../utils/docNumbering');

/* Reporting a problem from inside the app.
 *
 * Anyone signed in may raise one — a problem is most often hit by the person
 * with the fewest permissions, and making them ask someone else to report it
 * is how a problem goes unreported. Reading the list and answering it is for
 * administrators.
 */

const MAX_DESCRIPTION = 4000;

exports.createIssue = async (req, res) => {
  try {
    const { description, kind, severity, screenPath, screenName, context } = req.body;
    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, message: 'Say what went wrong, in your own words — one line is enough.' });
    }

    const role = req.user?.role;
    const issue = await Issue.create({
      reference: await generateDocNumber('ISSUE', 'ISS'),
      kind: ['Problem', 'Idea', 'Question', 'Crash'].includes(kind) ? kind : 'Problem',
      severity: ['Blocking', 'Painful', 'Minor'].includes(severity) ? severity : 'Painful',
      description: String(description).trim().slice(0, MAX_DESCRIPTION),
      reportedBy: req.user?._id,
      reportedByName: [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') || req.user?.email,
      roleName: (role && typeof role === 'object' ? role.name : null) || null,
      screenPath, screenName,
      // Taken as sent — it is diagnostic text, never executed or trusted.
      context: {
        userAgent: context?.userAgent,
        viewport: context?.viewport,
        appVersion: context?.appVersion,
        lastFailedRequest: context?.lastFailedRequest,
        consoleErrors: Array.isArray(context?.consoleErrors) ? context.consoleErrors.slice(0, 10) : [],
        renderError: context?.renderError
      }
    });

    res.status(201).json({
      success: true,
      data: { reference: issue.reference, _id: issue._id },
      message: `Thank you — this is with the team as ${issue.reference}. They can see which screen you were on and what the system was doing.`
    });
  } catch (error) { handleError(res, error); }
};

/** The queue, newest first. ?status=New|Seen|... to filter. */
exports.getIssues = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;
    const issues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(200, Number(req.query.limit) || 100))
      .lean();
    const counts = await Issue.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]).catch(() => []);
    res.json({
      success: true,
      data: issues,
      summary: Object.fromEntries(counts.map((c) => [c._id, c.n]))
    });
  } catch (error) { handleError(res, error); }
};

/** How many are still unanswered — for the badge in the header. */
exports.getOpenIssueCount = async (req, res) => {
  try {
    const n = await Issue.countDocuments({ status: { $in: ['New', 'Seen', 'In Progress'] } });
    res.json({ success: true, data: { open: n } });
  } catch (error) { handleError(res, error); }
};

/** Mine, so a reporter can see what became of what they raised. */
exports.getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user?._id })
      .sort({ createdAt: -1 }).limit(50)
      .select('reference kind description status response respondedAt screenName createdAt')
      .lean();
    res.json({ success: true, data: issues });
  } catch (error) { handleError(res, error); }
};

exports.updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'That report no longer exists.' });

    if (req.body.status) issue.status = req.body.status;
    if (req.body.severity) issue.severity = req.body.severity;
    if (req.body.response !== undefined) {
      issue.response = String(req.body.response).slice(0, MAX_DESCRIPTION);
      issue.respondedBy = req.user?._id;
      issue.respondedAt = new Date();
    }
    await issue.save();
    res.json({ success: true, data: issue, message: `${issue.reference} updated.` });
  } catch (error) { handleError(res, error); }
};
