const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connect, disconnect, cleanup } = require('./matchTestUtils');

const Session = require('../models/Session');

// Each test will manage its own in-memory mongo lifecycle via connect()/disconnect()

test('findMentorSessionsLean returns lean objects with projection', async (t) => {
  await connect();
  t.after(async () => {
    await cleanup();
    await disconnect();
  });
  await cleanup();
  const mentorId = new mongoose.Types.ObjectId();
  const menteeId = new mongoose.Types.ObjectId();

    // create sessions for this mentor
    await Session.create([
      { mentor: mentorId, mentee: menteeId, subject: 'S1', date: new Date('2030-01-01'), status: 'completed' },
      { mentor: mentorId, mentee: menteeId, subject: 'S2', date: new Date('2030-01-02'), status: 'pending' },
      { mentor: mentorId, mentee: menteeId, subject: 'S3', date: new Date('2030-01-03'), status: 'completed' },
    ]);

    const results = await Session.findMentorSessionsLean(mentorId.toString(), { status: 'completed', limit: 10 });
    assert.ok(Array.isArray(results));
    assert.strictEqual(results.length, 2);

    // projection: should not include heavy internal fields like updatedAt beyond allowed
    assert.ok(results[0].subject);
    assert.ok(results[0].date);
    // lean returns plain objects — they should not be mongoose documents
    assert.strictEqual(typeof results[0].toObject, 'undefined');
  // connection will be torn down in t.after
  });

test('findMenteeSessionsLean fetches by mentee or participation', async (t) => {
  await connect();
  t.after(async () => {
    await cleanup();
    await disconnect();
  });
  await cleanup();
  const mentorId = new mongoose.Types.ObjectId();
  const menteeId = new mongoose.Types.ObjectId();

    await Session.create([
      { mentor: mentorId, mentee: menteeId, subject: 'For mentee', date: new Date('2030-02-01'), status: 'confirmed' },
      { mentor: mentorId, mentee: null, participants: [{ user: menteeId, status: 'confirmed' }], subject: 'Participant session', date: new Date('2030-03-01') },
    ]);

    const results = await Session.findMenteeSessionsLean(menteeId.toString(), { limit: 10 });
    assert.ok(Array.isArray(results));
    assert.strictEqual(results.length, 2);
    assert.ok(results[0].mentor);
    assert.ok(results[0].subject);
    assert.strictEqual(typeof results[0].save, 'undefined');
  // connection will be torn down in t.after
  });
