require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const pickArg = (key, fallback = undefined) => {
  const prefix = `--${key}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));
  if (raw) return raw.slice(prefix.length);
  return fallback;
};

const email = pickArg('email');
if (!email) {
  // eslint-disable-next-line no-console
  console.error('Usage: node src/scripts/findUser.js --email=email@example.com');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) {
    // eslint-disable-next-line no-console
    console.error('User not found');
    process.exit(1);
  }
  /* eslint-disable no-console */
  console.info('User found:');
  console.info(' - id:', user._id.toString());
  console.info(' - name:', `${user.firstname || ''} ${user.lastname || ''}`.trim());
  console.info(' - role:', user.role);
  console.info(' - app status:', user.applicationStatus);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Script failed:', err?.message || err);
  process.exit(1);
});
