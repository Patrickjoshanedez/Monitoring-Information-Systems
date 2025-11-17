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

const createMockRes = () => {
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

test('mentee can book a session when slot is available', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });
  await cleanup();

  sessionController.__setNotificationAdapter(mockNotificationAdapter);

  const mentor = await User.create({
    firstname: 'Sam',
    lastname: 'Mentor',
    email: `mentor-${Date.now()}@example.com`,
    role: 'mentor',
    applicationStatus: 'approved',
  });

  const mentee = await User.create({
    firstname: 'Jamie',
    lastname: 'Mentee',
    email: `mentee-${Date.now()}@example.com`,
    role: 'mentee',
    applicationStatus: 'approved',
  });

  const availability = await Availability.create({
    mentor: mentor._id,
    type: 'recurring',
    timezone: 'UTC',
    capacity: 1,
    recurring: [
      { dayOfWeek: 1, startTime: '14:00', endTime: '15:00', timezone: 'UTC' },
    ],
  });

  const upcomingMonday = (() => {
    const date = new Date();
    date.setUTCHours(14, 0, 0, 0);
    while (date.getUTCDay() !== 1 || date.getTime() <= Date.now()) {
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return date;
  })();

  const req = {
    body: {
      mentorId: mentor._id.toString(),
      scheduledAt: upcomingMonday.toISOString(),
      durationMinutes: 60,
      subject: 'Career coaching',
      availabilityRef: availability._id.toString(),
    },
    user: {
      id: mentee._id.toString(),
      role: 'mentee',
      firstname: mentee.firstname,
    },
  };

  const res = createMockRes();
  await sessionController.bookSession(req, res);

  assert.equal(res.statusCode, 201);
  assert.ok(res.body?.success, 'response success flag');
  assert.equal(res.body?.session?.status, 'pending');

  const storedSessions = await Session.find({ mentor: mentor._id });
  assert.equal(storedSessions.length, 1);
  assert.equal(storedSessions[0].mentee.toString(), mentee._id.toString());
  assert.equal(storedSessions[0].status, 'pending');
});
