const test = require('node:test');
const assert = require('node:assert/strict');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const User = require('../models/User');
const Session = require('../models/Session');
const MentorFeedback = require('../models/MentorFeedback');
const mentorFeedbackController = require('../controllers/mentorFeedbackController');
const mentorFeedbackAggregation = require('../services/mentorFeedbackAggregationWorker');

const createResponse = () => {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
};

test('mentor can submit feedback for completed session and mentee sees sanitized data', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });

  await cleanup();

  const queueCalls = [];
  const originalQueue = mentorFeedbackAggregation.queueProgressSnapshotBuild;
  mentorFeedbackAggregation.queueProgressSnapshotBuild = (menteeId) => {
    queueCalls.push(menteeId.toString());
  };
  t.after(() => {
    mentorFeedbackAggregation.queueProgressSnapshotBuild = originalQueue;
  });

  const mentor = await User.create({
    firstname: 'Morgan',
    lastname: 'Mentor',
    email: `mentor-${Date.now()}@example.com`,
    role: 'mentor',
    applicationStatus: 'approved',
  });

  const mentee = await User.create({
    firstname: 'Jamie',
    lastname: 'Learner',
    email: `mentee-${Date.now()}@example.com`,
    role: 'mentee',
  });

  const session = await Session.create({
    mentor: mentor._id,
    mentee: mentee._id,
    subject: 'Career planning',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000),
    attended: true,
    status: 'completed',
    completedAt: new Date(Date.now() - 60 * 60 * 1000),
  });

  const req = {
    params: { sessionId: session._id.toString() },
    body: {
      rating: 5,
      comment: '  Stellar <b>progress</b>!  ',
      competencies: [{ skillKey: 'communication', level: 4, notes: ' clear updates ' }],
      visibility: 'private',
    },
    user: { id: mentor._id.toString(), role: 'mentor' },
    ip: '127.0.0.1',
  };
  const res = createResponse();

  await mentorFeedbackController.createMentorFeedback(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.feedback.rating, 5);
  assert.equal(queueCalls[0], mentee._id.toString());

  const stored = await MentorFeedback.findOne({ sessionId: session._id });
  assert.equal(stored.mentorId.toString(), mentor._id.toString());
  assert.equal(stored.menteeId.toString(), mentee._id.toString());
  assert.equal(stored.sanitizedComment.includes('Stellar progress'), true);
  assert.equal(stored.competencies.length, 1);
  assert.equal(stored.visibility, 'private');

  const menteeReq = {
    params: { sessionId: session._id.toString() },
    user: { id: mentee._id.toString(), role: 'mentee' },
    ip: '127.0.0.1',
  };
  const menteeRes = createResponse();
  await mentorFeedbackController.getMentorFeedbackForSession(menteeReq, menteeRes);

  assert.equal(menteeRes.body.success, true);
  assert.equal(menteeRes.body.feedback.comment, null);
  assert.equal(menteeRes.body.feedback.visibility, 'private');
});

test('mentor cannot submit feedback for session they do not own', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });

  await cleanup();

  const mentorA = await User.create({
    firstname: 'Alex',
    lastname: 'Coach',
    email: `mentor-a-${Date.now()}@example.com`,
    role: 'mentor',
  });

  const mentorB = await User.create({
    firstname: 'Billie',
    lastname: 'Guide',
    email: `mentor-b-${Date.now()}@example.com`,
    role: 'mentor',
  });

  const mentee = await User.create({
    firstname: 'Taylor',
    lastname: 'Mentee',
    email: `mentee-${Date.now()}@example.com`,
    role: 'mentee',
  });

  const session = await Session.create({
    mentor: mentorA._id,
    mentee: mentee._id,
    subject: 'Interview prep',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    attended: true,
    status: 'completed',
    completedAt: new Date(Date.now() - 60 * 60 * 1000),
  });

  const req = {
    params: { sessionId: session._id.toString() },
    body: { rating: 4 },
    user: { id: mentorB._id.toString(), role: 'mentor' },
    ip: '127.0.0.1',
  };
  const res = createResponse();

  await mentorFeedbackController.createMentorFeedback(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'NOT_SESSION_MENTOR');

  const count = await MentorFeedback.countDocuments();
  assert.equal(count, 0);
});
