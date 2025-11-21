const test = require('node:test');
const assert = require('node:assert/strict');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const User = require('../models/User');
const Session = require('../models/Session');
const MentorFeedback = require('../models/MentorFeedback');
const mentorFeedbackController = require('../controllers/mentorFeedbackController');
const mentorFeedbackAggregation = require('../services/mentorFeedbackAggregationWorker');

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; },
});

test('end-to-end: mentor feedback submitted -> snapshot built -> mentee endpoint returns snapshot', async (t) => {
  await connect();
  t.after(async () => { await disconnect(); });
  await cleanup();

  // Create mentor, mentee and a completed session
  const mentor = await User.create({ firstname: 'Maya', lastname: 'Mentor', email: `m-${Date.now()}@example.com`, role: 'mentor', applicationStatus: 'approved' });
  const mentee = await User.create({ firstname: 'Evan', lastname: 'Mentee', email: `e-${Date.now()}@example.com`, role: 'mentee' });

  const session = await Session.create({
    mentor: mentor._id,
    mentee: mentee._id,
    subject: 'Career coaching',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000),
    attended: true,
    status: 'completed',
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  });

  // Submit feedback as mentor
  const req = {
    params: { sessionId: session._id.toString() },
    body: { rating: 4, comment: 'Good progress', competencies: [{ skillKey: 'communication', level: 4 }], visibility: 'public' },
    user: { id: mentor._id.toString(), role: 'mentor' },
    ip: '127.0.0.1',
  };
  const res = createResponse();

  await mentorFeedbackController.createMentorFeedback(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.feedback.rating, 4);

  // Wait a moment - aggregation worker should be triggered; call rebuild explicitly to ensure deterministic test
  await mentorFeedbackAggregation.rebuildSnapshotForMentee(mentee._id);

  // Now call mentee snapshot endpoint via controller method
  const menteeReq = { user: { id: mentee._id.toString(), role: 'mentee' }, ip: '127.0.0.1' };
  const menteeRes = createResponse();
  await mentorFeedbackController.getOwnProgressSnapshot(menteeReq, menteeRes);

  assert.equal(menteeRes.statusCode, 200);
  assert.equal(menteeRes.body.success, true);
  const snapshot = menteeRes.body.snapshot;
  assert.ok(snapshot);
  assert.equal(snapshot.menteeId, mentee._id.toString());
  assert.ok(snapshot.ratingAvg >= 4);
  assert.ok(snapshot.recentComments && snapshot.recentComments.length >= 1);

  // Ensure the feedback doc exists and is linked properly
  const stored = await MentorFeedback.findOne({ sessionId: session._id });
  assert.ok(stored);
  assert.equal(stored.menteeId.toString(), mentee._id.toString());
});
