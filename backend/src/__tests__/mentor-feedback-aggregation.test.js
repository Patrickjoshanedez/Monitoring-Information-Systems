const test = require('node:test');
const assert = require('node:assert/strict');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const User = require('../models/User');
const Session = require('../models/Session');
const MentorFeedback = require('../models/MentorFeedback');
const mentorFeedbackAggregation = require('../services/mentorFeedbackAggregationWorker');

const DAY_MS = 24 * 60 * 60 * 1000;

const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

test('mentor feedback aggregation builds snapshot stats and recent comments', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });

  await cleanup();

  const mentorA = await User.create({
    firstname: 'Morgan',
    lastname: 'Mentor',
    email: `mentor-a-${Date.now()}@example.com`,
    role: 'mentor',
  });

  const mentorB = await User.create({
    firstname: 'Casey',
    lastname: 'Coach',
    email: `mentor-b-${Date.now()}@example.com`,
    role: 'mentor',
  });

  const mentee = await User.create({
    firstname: 'Riley',
    lastname: 'Learner',
    email: `mentee-${Date.now()}@example.com`,
    role: 'mentee',
  });

  const sessionA = await Session.create({
    mentor: mentorA._id,
    mentee: mentee._id,
    subject: 'Resume review',
    date: new Date(Date.now() - 7 * DAY_MS),
    status: 'completed',
    attended: true,
    completedAt: new Date(Date.now() - 7 * DAY_MS),
  });

  const sessionB = await Session.create({
    mentor: mentorB._id,
    mentee: mentee._id,
    subject: 'Mock interview',
    date: new Date(Date.now() - 40 * DAY_MS),
    status: 'completed',
    attended: true,
    completedAt: new Date(Date.now() - 40 * DAY_MS),
  });

  const editWindow = new Date(Date.now() + 14 * DAY_MS);
  const recentDate = new Date(Date.now() - 5 * DAY_MS);
  const olderDate = new Date(Date.now() - 35 * DAY_MS);

  const flaggedSession = await Session.create({
    mentor: mentorA._id,
    mentee: mentee._id,
    subject: 'Flagged entry',
    date: new Date(Date.now() - 2 * DAY_MS),
    status: 'completed',
    attended: true,
    completedAt: new Date(Date.now() - 2 * DAY_MS),
  });

  await MentorFeedback.create([
    {
      sessionId: sessionA._id,
      mentorId: mentorA._id,
      menteeId: mentee._id,
      rating: 5,
      comment: 'Insightful progress',
      sanitizedComment: 'Insightful progress',
      visibility: 'public',
      editWindowClosesAt: editWindow,
      createdAt: recentDate,
      updatedAt: recentDate,
    },
    {
      sessionId: sessionB._id,
      mentorId: mentorB._id,
      menteeId: mentee._id,
      rating: 4,
      comment: 'Solid prep work',
      sanitizedComment: 'Solid prep work',
      visibility: 'private',
      editWindowClosesAt: editWindow,
      createdAt: olderDate,
      updatedAt: olderDate,
    },
    {
      sessionId: flaggedSession._id,
      mentorId: mentorA._id,
      menteeId: mentee._id,
      rating: 2,
      comment: 'Flagged comment',
      sanitizedComment: 'Flagged comment',
      visibility: 'public',
      editWindowClosesAt: editWindow,
      createdAt: recentDate,
      updatedAt: recentDate,
      moderation: { flagged: true },
    },
  ]);

  const snapshotDoc = await mentorFeedbackAggregation.rebuildSnapshotForMentee(mentee._id);
  const snapshot = snapshotDoc.toObject ? snapshotDoc.toObject() : snapshotDoc;

  assert.equal(snapshot.menteeId.toString(), mentee._id.toString());
  assert.equal(snapshot.ratingCount, 2);
  assert.equal(snapshot.ratingAvg, 4.5);
  assert.equal(snapshot.milestones.reached, 2);

  const trendMap = new Map(snapshot.monthlyTrend.map((entry) => [entry.month, entry]));
  const recentKey = monthKey(recentDate);
  const olderKey = monthKey(olderDate);
  assert.ok(trendMap.has(recentKey));
  assert.ok(trendMap.has(olderKey));
  assert.ok(trendMap.get(recentKey).count >= 1);
  assert.ok(trendMap.get(olderKey).count >= 1);

  assert.equal(snapshot.recentComments.length, 1);
  const comment = snapshot.recentComments[0];
  assert.equal(comment.mentorId.toString(), mentorA._id.toString());
  assert.equal(comment.comment, 'Insightful progress');
  assert.equal(comment.visibility, 'public');
});
