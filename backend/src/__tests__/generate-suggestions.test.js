const test = require('node:test');
const assert = require('node:assert/strict');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const User = require('../models/User');
const MatchRequest = require('../models/MatchRequest');
const { generateSuggestionsForMentor } = require('../services/matchService');

const buildMentor = () => ({
  firstname: 'Alex',
  lastname: 'Mentor',
  email: `mentor-${Date.now()}@test.com`,
  role: 'mentor',
  applicationStatus: 'approved',
  profile: {
    expertiseAreas: ['javascript', 'react'],
    availabilitySlots: [
      { day: 'mon', start: '09:00', end: '11:00' },
      { day: 'wed', start: '13:00', end: '15:00' },
    ],
    interests: ['web', 'frontend'],
    education: { program: 'Computer Science', major: 'Software Engineering' },
  },
});

const buildMentee = (overrides = {}) => ({
  firstname: 'Jamie',
  lastname: 'Mentee',
  email: `mentee-${Math.random()}@test.com`,
  role: 'mentee',
  applicationStatus: 'approved',
  profile: {
    skills: ['javascript', 'node'],
    interests: ['web', 'ai'],
    availabilitySlots: [
      { day: 'mon', start: '10:00', end: '11:30' },
      { day: 'fri', start: '09:00', end: '10:00' },
    ],
    education: { program: 'Computer Science', major: 'Artificial Intelligence' },
  },
  applicationData: overrides.applicationData || {},
});

test('generateSuggestionsForMentor ranks mentees by score', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });

  await cleanup();

  const mentor = await User.create(buildMentor());
  await User.create(buildMentee({ applicationData: { priority: 'high' } }));
  await User.create(buildMentee({ applicationData: { priority: 'low' }, profile: { interests: ['business'] } }));
  await User.create(buildMentee({ applicationData: { priority: 'medium' }, profile: { skills: ['python'] } }));

  const results = await generateSuggestionsForMentor({ mentorId: mentor._id, limit: 2 });

  assert.equal(results.length, 2);
  const stored = await MatchRequest.find({ mentorId: mentor._id }).sort({ score: -1 });
  assert.equal(stored.length >= 2, true);
  assert.ok(stored[0].score >= stored[1].score, 'results should be sorted by score');
});
