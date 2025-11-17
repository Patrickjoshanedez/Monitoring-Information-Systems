const test = require('node:test');
const assert = require('node:assert/strict');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const User = require('../models/User');
const MatchRequest = require('../models/MatchRequest');
const Mentorship = require('../models/Mentorship');
const { menteeAcceptMatch } = require('../services/matchService');

const createMentor = () =>
  User.create({
    firstname: 'Harvey',
    lastname: 'Mentor',
    email: `mentor-${Date.now()}@example.com`,
    role: 'mentor',
    applicationStatus: 'approved',
    mentorSettings: { capacity: 1, activeMenteesCount: 0 },
  });

const createMentee = () =>
  User.create({
    firstname: 'Robin',
    lastname: 'Mentee',
    email: `mentee-${Math.random()}@example.com`,
    role: 'mentee',
    applicationStatus: 'approved',
  });

test('mentee acceptance after mentor creates mentorship connection', async (t) => {
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
    status: 'mentor_accepted',
    score: 92,
    scoreBreakdown: { expertise: 90, availability: 80, interactions: 70, priority: 60 },
  });

  const { match: updated, mentorship } = await menteeAcceptMatch({ matchId: match._id, menteeId: mentee._id });

  assert.equal(updated.status, 'connected');
  assert.ok(mentorship, 'mentorship should be created');

  const storedMentorships = await Mentorship.find({ mentorId: mentor._id });
  assert.equal(storedMentorships.length, 1);

  const refreshedMentor = await User.findById(mentor._id);
  assert.equal(refreshedMentor.mentorSettings.activeMenteesCount, 1);
});
