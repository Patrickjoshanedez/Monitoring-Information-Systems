const test = require('node:test');
const assert = require('node:assert/strict');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const User = require('../models/User');
const Availability = require('../models/Availability');

test('availability CRUD operations manage mentor windows', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });

  await cleanup();

  const mentor = await User.create({
    firstname: 'Casey',
    lastname: 'Coach',
    email: `mentor-${Date.now()}@example.com`,
    role: 'mentor',
    applicationStatus: 'approved',
  });

  const availability = await Availability.create({
    mentor: mentor._id,
    type: 'recurring',
    timezone: 'America/New_York',
    capacity: 3,
    recurring: [
      {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        timezone: 'America/New_York',
      },
    ],
  });

  assert.equal(availability.mentor.toString(), mentor._id.toString());
  assert.equal(availability.capacity, 3);
  assert.equal(availability.recurring[0].dayOfWeek, 1);
  assert.equal(availability.recurring[0].startTime, '09:00');
  assert.equal(availability.timezone, 'America/New_York');

  const updated = await Availability.findByIdAndUpdate(
    availability._id,
    { $set: { capacity: 4, note: 'Office hours' } },
    { new: true }
  );

  assert.equal(updated.capacity, 4);
  assert.equal(updated.note, 'Office hours');

  const deactivated = await Availability.findByIdAndUpdate(
    availability._id,
    { $set: { active: false } },
    { new: true }
  );

  assert.equal(deactivated.active, false);
});
