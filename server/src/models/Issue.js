const mongoose = require('mongoose');

/* A problem somebody hit, reported from inside the app.
 *
 * The point is that the report arrives without the reporter having to explain
 * where they were or what the system was doing — a store keeper at the gate
 * will write "it won't let me save" and nothing else, and that on its own is
 * unactionable. Everything below the description is captured for them.
 */
const issueSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },   // ISS-2026-27-00001
  kind: { type: String, enum: ['Problem', 'Idea', 'Question', 'Crash'], default: 'Problem' },
  description: { type: String, required: true, trim: true },

  // Who, and what they were allowed to do — a permission refusal looks like a
  // bug to the person it happens to.
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedByName: { type: String },
  roleName: { type: String },

  // Where they were when it happened.
  screenPath: { type: String },
  screenName: { type: String },

  /* What the app was doing. Collected by the client: the last failed request,
     recent console errors, and the render error when this came from a crash. */
  context: {
    userAgent: { type: String },
    viewport: { type: String },
    appVersion: { type: String },
    lastFailedRequest: {
      method: String, url: String, status: Number, message: String, at: Date
    },
    consoleErrors: [{ message: String, at: Date }],
    renderError: { message: String, componentStack: String }
  },

  status: { type: String, enum: ['New', 'Seen', 'In Progress', 'Fixed', 'Not a problem'], default: 'New' },
  severity: { type: String, enum: ['Blocking', 'Painful', 'Minor'], default: 'Painful' },
  // What the team said back, so the reporter is not left wondering.
  response: { type: String, trim: true },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt: { type: Date }
}, { timestamps: true });

issueSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema);
