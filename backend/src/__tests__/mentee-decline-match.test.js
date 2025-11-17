const test = require('node:test');
const assert = require('node:assert/strict');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const User = require('../models/User');
const MatchRequest = require('../models/MatchRequest');
const { menteeDeclineMatch } = require('../services/matchService');

const createMentor = () =>
  User.create({
    firstname: 'Daisy',
    lastname: 'Mentor',
    email: `mentor-${Date.now()}@example.com`,
    role: 'mentor',
    applicationStatus: 'approved',
    mentorSettings: { capacity: 2, activeMenteesCount: 0 },
  });

const createMentee = () =>
  User.create({
    firstname: 'Eli',
    lastname: 'Mentee',
    email: `mentee-${Math.random()}@example.com`,
    role: 'mentee',
    applicationStatus: 'approved',
  });

test('menteeDeclineMatch updates status to mentee_declined', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });

  await cleanup();

  const mentor = await createMentor();
  const mentee = await createMentee();

  const match = await MatchRequest.create({
    mentorId: mentor._id,
    applicantId: mentee._id,
    score: 72,
    status: 'suggested',
    scoreBreakdown: { expertise: 70, availability: 60, interactions: 55, priority: 50 },
  });

  const updated = await menteeDeclineMatch({ matchId: match._id, menteeId: mentee._id, reason: 'Found another mentor' });
  assert.equal(updated.status, 'mentee_declined');

  const fromDb = await MatchRequest.findById(match._id);
  assert.equal(fromDb.status, 'mentee_declined');
  assert.equal(fromDb.notes, 'Found another mentor');
});
