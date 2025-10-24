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

const firstname = pickArg('firstname', 'Admin');
const lastname = pickArg('lastname', 'User');
const email = pickArg('email');
const password = pickArg('password');
const force = pickArg('force', 'false') === 'true';

if (!email || !password) {
  // eslint-disable-next-line no-console
  console.error('Missing required arguments. Usage: node src/scripts/createAdmin.js --email=admin@example.com --password=StrongPass123! [--firstname=Admin] [--lastname=User] [--force=true]');
  process.exit(1);
}

const createOrUpdateAdmin = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.firstname = firstname || existingUser.firstname;
      existingUser.lastname = lastname || existingUser.lastname;
      existingUser.role = 'admin';
      existingUser.applicationStatus = 'approved';
      existingUser.applicationRole = 'admin';
      existingUser.applicationData = existingUser.applicationData || {};

      if (force) {
        existingUser.password = password;
      }

      await existingUser.save();
      // eslint-disable-next-line no-console
      console.info(`Updated existing admin account for ${email}${force ? ' (password reset)' : ''}.`);
    } else {
      const adminUser = new User({
        firstname,
        lastname,
        email,
        password,
        role: 'admin',
        applicationStatus: 'approved',
        applicationRole: 'admin',
        applicationData: {}
      });

      await adminUser.save();
      // eslint-disable-next-line no-console
      console.info(`Created new admin account for ${email}.`);
    }

    await connection.disconnect();
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create admin account:', error.message || error);
    process.exit(1);
  }
};

createOrUpdateAdmin();
