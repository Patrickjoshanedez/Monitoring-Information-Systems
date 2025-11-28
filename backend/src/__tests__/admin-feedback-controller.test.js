const test = require('node:test');
const assert = require('node:assert/strict');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const User = require('../models/User');
const Session = require('../models/Session');
const MentorFeedback = require('../models/MentorFeedback');
const FeedbackAuditLog = require('../models/FeedbackAuditLog');
const adminFeedbackController = require('../controllers/adminFeedbackController');

const createResponse = () => {
    return {
        statusCode: 200,
        body: null,
        headers: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        setHeader(name, value) {
            this.headers[name.toLowerCase()] = value;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        send(payload) {
            this.body = payload;
            return this;
        },
    };
};

const createUser = (overrides = {}) =>
    User.create({
        firstname: 'Case',
        lastname: 'User',
        email: `${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
        role: overrides.role || 'mentee',
        applicationStatus: 'approved',
        ...overrides,
    });

test('admin can list mentor feedback with low rating filter', async (t) => {
    await connect();
    t.after(async () => {
        await disconnect();
    });

    await cleanup();

    const admin = await createUser({ role: 'admin' });
    const mentor = await createUser({ role: 'mentor' });
    const mentee = await createUser({ role: 'mentee' });

    const session = await Session.create({
        mentor: mentor._id,
        mentee: mentee._id,
        subject: 'Career planning',
        date: new Date(Date.now() - 60 * 60 * 1000),
        status: 'completed',
        attended: true,
        completedAt: new Date(Date.now() - 30 * 60 * 1000),
    });

    await MentorFeedback.create({
        sessionId: session._id,
        mentorId: mentor._id,
        menteeId: mentee._id,
        rating: 2,
        comment: 'Needs improvement',
        sanitizedComment: 'Needs improvement',
        visibility: 'public',
        editWindowClosesAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const req = {
        query: { sentiment: 'low', limit: 10, page: 1 },
        user: { id: admin._id.toString(), role: 'admin' },
    };
    const res = createResponse();

    await adminFeedbackController.listMentorFeedback(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.feedback.length, 1);
    assert.equal(res.body.feedback[0].rating, 2);
    assert.equal(res.body.meta.pagination.total, 1);
});

test('admin can flag mentor feedback with audit entry', async (t) => {
    await connect();
    t.after(async () => {
        await disconnect();
    });

    await cleanup();

    const admin = await createUser({ role: 'admin' });
    const mentor = await createUser({ role: 'mentor' });
    const mentee = await createUser({ role: 'mentee' });
    const session = await Session.create({
        mentor: mentor._id,
        mentee: mentee._id,
        subject: 'Mock interview',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'completed',
        attended: true,
        completedAt: new Date(Date.now() - 90 * 60 * 1000),
    });

    const feedback = await MentorFeedback.create({
        sessionId: session._id,
        mentorId: mentor._id,
        menteeId: mentee._id,
        rating: 5,
        comment: 'Great progress',
        sanitizedComment: 'Great progress',
        visibility: 'public',
        editWindowClosesAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const req = {
        params: { feedbackId: feedback._id.toString() },
        body: { flagged: true, reason: 'Contains sensitive details' },
        user: { id: admin._id.toString(), role: 'admin' },
        ip: '127.0.0.1',
    };
    const res = createResponse();

    await adminFeedbackController.updateMentorFeedbackModeration(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.feedback.moderation.flagged, true);
    assert.equal(res.body.feedback.moderation.reason, 'Contains sensitive details');

    const auditEntries = await FeedbackAuditLog.find({ feedbackId: feedback._id }).lean();
    assert.equal(auditEntries.length, 1);
    assert.equal(auditEntries[0].action, 'moderate');
});
