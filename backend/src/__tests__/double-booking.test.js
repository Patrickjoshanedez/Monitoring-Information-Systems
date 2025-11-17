const test = require('node:test');
const assert = require('node:assert/strict');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const sessionController = require('../controllers/sessionController');
const User = require('../models/User');
const Availability = require('../models/Availability');
const Session = require('../models/Session');

const mockNotificationAdapter = {
  sendNotification: async () => ({ delivered: true }),
};

const createMockRes = () => ({
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
});

test('concurrent bookings respect capacity constraints', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });
  await cleanup();

  sessionController.__setNotificationAdapter(mockNotificationAdapter);

  const mentor = await User.create({
    firstname: 'Avery',
    lastname: 'Mentor',
    email: `mentor-${Date.now()}@example.com`,
    role: 'mentor',
    applicationStatus: 'approved',
  });

  const menteeOne = await User.create({
    firstname: 'Mentee',
    lastname: 'One',
    email: `mentee-one-${Date.now()}@example.com`,
    role: 'mentee',
    applicationStatus: 'approved',
  });

  const menteeTwo = await User.create({
    firstname: 'Mentee',
    lastname: 'Two',
    email: `mentee-two-${Date.now()}@example.com`,
    role: 'mentee',
    applicationStatus: 'approved',
  });

  const availability = await Availability.create({
    mentor: mentor._id,
    type: 'recurring',
    timezone: 'UTC',
    capacity: 1,
    recurring: [
      { dayOfWeek: 2, startTime: '15:00', endTime: '16:00', timezone: 'UTC' },
    ],
  });

  const upcomingTuesday = (() => {
    const date = new Date();
    date.setUTCHours(15, 0, 0, 0);
    while (date.getUTCDay() !== 2 || date.getTime() <= Date.now()) {
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return date;
  })();

  const baseBody = {
    mentorId: mentor._id.toString(),
    scheduledAt: upcomingTuesday.toISOString(),
    durationMinutes: 60,
    subject: 'Portfolio review',
    availabilityRef: availability._id.toString(),
  };

  const reqOne = { body: { ...baseBody }, user: { id: menteeOne._id.toString(), role: 'mentee', firstname: menteeOne.firstname } };
  const resOne = createMockRes();
  await sessionController.bookSession(reqOne, resOne);
  assert.equal(resOne.statusCode, 201);

  const reqTwo = { body: { ...baseBody }, user: { id: menteeTwo._id.toString(), role: 'mentee', firstname: menteeTwo.firstname } };
  const resTwo = createMockRes();
  await sessionController.bookSession(reqTwo, resTwo);
  assert.equal(resTwo.statusCode, 409);
  assert.equal(resTwo.body?.error, 'SLOT_FULL');

  const sessions = await Session.find({ mentor: mentor._id });
  assert.equal(sessions.length, 1, 'only one session stored');
});
