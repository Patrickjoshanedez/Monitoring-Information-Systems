require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const pickArg = (key, fallback = undefined) => {
  const prefix = `--${key}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));
  if (raw) {
    return raw.slice(prefix.length);
  }
  return fallback;
};

const menteeId = pickArg('menteeId');
const menteeEmail = pickArg('menteeEmail');
const count = Number(pickArg('count', 3));
const emailPrefix = pickArg('prefix', `seed-mentor`);

if (!menteeId && !menteeEmail) {
  // eslint-disable-next-line no-console
  console.error('Usage: node src/scripts/createMatchingMentors.js --menteeId=<id> or --menteeEmail=address@example.com [--count=3] [--prefix=seed-mentor]');
  process.exit(1);
}

const normalize = (text) => {
  if (!text) return [];
  if (Array.isArray(text)) return text.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  if (typeof text === 'string') {
    return text
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

const sample = (arr, n) => {
  if (!arr || arr.length === 0) return [];
  const unique = Array.from(new Set(arr));
  const out = [];
  while (out.length < n && unique.length) {
    const idx = Math.floor(Math.random() * unique.length);
    out.push(unique.splice(idx, 1)[0]);
  }
  return out;
};

const randName = (base, idx) => ({
  first: `${base.charAt(0).toUpperCase()}${base.slice(1)}${idx}`,
  last: `Seed${idx}`,
});

const days = ['mon', 'tue', 'wed', 'thu', 'fri'];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  // eslint-disable-next-line no-console
  console.info('Connected to DB');

  const mentee = menteeId ? await User.findById(menteeId).lean() : await User.findOne({ email: menteeEmail?.toLowerCase() }).lean();
  if (!mentee) {
    // eslint-disable-next-line no-console
    console.error('Mentee not found');
    process.exit(1);
  }

  const menteeTerms = [
    ...normalize(mentee.applicationData?.expertiseAreas),
    ...normalize(mentee.profile?.skills),
    ...normalize(mentee.profile?.interests),
    ...normalize(mentee.applicationData?.mentoringGoals),
  ].filter(Boolean);

  const created = [];

  for (let i = 0; i < count; i += 1) {
    const name = randName(emailPrefix, Date.now() % 100000 + i);
    const matchedExpertise = sample(menteeTerms, Math.min(3, menteeTerms.length)) || ['general'];

    const availability = (mentee.profile?.availabilitySlots || []).slice(0, 1).map((s) => ({
      day: s.day || days[i % days.length],
      start: s.start || '10:00',
      end: s.end || '11:00',
    }));

    if (!availability.length) {
      availability.push({ day: days[i % days.length], start: '10:00', end: '11:00' });
    }

    // make email unique
    const email = `${emailPrefix}-${Date.now()}-${i}@example.com`;

    const mentor = new User({
      firstname: name.first,
      lastname: name.last,
      email,
      password: 'ChangeMe123!',
      role: 'mentor',
      applicationStatus: 'approved',
      applicationRole: 'mentor',
      applicationData: {
        expertiseAreas: matchedExpertise,
        mentoringTopics: matchedExpertise,
        program: mentee.applicationData?.program || 'N/A',
        interests: (mentee.profile?.interests || []).slice(0, 3),
      },
      profile: {
        displayName: `${name.first} ${name.last}`,
        expertiseAreas: matchedExpertise,
        skills: matchedExpertise,
        availabilitySlots: availability,
        interests: (mentee.profile?.interests || []).slice(0, 3),
        education: { program: mentee.profile?.education?.program || 'General' },
      },
      mentorSettings: { capacity: 3, activeMenteesCount: 0 },
      notificationSettings: {
        channels: { matches: { inApp: true, email: true }, announcements: { inApp: true, email: false } },
      },
    });

    try {
      const saved = await mentor.save();
      created.push(saved);
      // eslint-disable-next-line no-console
      console.info(`Created mentor: ${saved._id} (${saved.email}) with expertise: ${matchedExpertise.join(', ')}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to create mentor', err?.message || err);
    }
  }

  // eslint-disable-next-line no-console
  console.info(`Created ${created.length} mentors.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Script failed', err?.message || err);
  process.exit(1);
});
