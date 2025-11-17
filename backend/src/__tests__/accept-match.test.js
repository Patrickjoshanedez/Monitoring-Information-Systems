const test = require('node:test');
const assert = require('node:assert/strict');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const User = require('../models/User');
const MatchRequest = require('../models/MatchRequest');
const { mentorAcceptMatch } = require('../services/matchService');

const createMentor = () =>
  User.create({
    firstname: 'Mira',
    lastname: 'Mentor',
    email: `mentor-${Date.now()}@example.com`,
    role: 'mentor',
    applicationStatus: 'approved',
    mentorSettings: { capacity: 2, activeMenteesCount: 0 },
  });

const createMentee = () =>
  User.create({
    firstname: 'Casey',
    lastname: 'Mentee',
    email: `mentee-${Math.random()}@example.com`,
    role: 'mentee',
    applicationStatus: 'approved',
  });

test('mentorAcceptMatch moves status to mentor_accepted', async (t) => {
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
    score: 88,
    status: 'suggested',
    scoreBreakdown: { expertise: 80, availability: 70, interactions: 65, priority: 60 },
  });

  const { match: updated } = await mentorAcceptMatch({ matchId: match._id, mentorId: mentor._id });

  assert.equal(updated.status, 'mentor_accepted');
  const fetched = await MatchRequest.findById(match._id);
  assert.equal(fetched.status, 'mentor_accepted');
});
