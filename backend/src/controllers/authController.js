const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/emailService');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const createJwt = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'EMAIL_EXISTS' });
    const user = new User({ firstname, lastname, email, password, role: role || 'mentee' });
    await user.save();
    return res.status(201).json({ message: 'REGISTERED' });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ error: 'ACCOUNT_LOCKED' });
    }

    const passwordOk = await user.comparePassword(password);
    if (!passwordOk) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        user.loginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = createJwt(user);
    return res.json({ 
      token, 
      role: user.role || null,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role || null,
        applicationStatus: user.applicationStatus
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'INVALID_TOKEN' });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1h
    await user.save();

    await sendPasswordResetEmail(user.email, token);
    return res.json({ message: 'RESET_EMAIL_SENT' });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ error: 'INVALID_TOKEN' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.json({ message: 'PASSWORD_RESET' });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

// Google OAuth handlers (Passport middleware mounted in routes)
exports.googleAuth = (req, res) => {
  // handled by passport middleware
  return res.end();
};

exports.googleAuthCallback = (req, res) => {
  const token = createJwt(req.user);
  const redirectBase = process.env.CLIENT_URL || 'http://localhost:5173';
  return res.redirect(`${redirectBase}/oauth/callback?token=${token}`);
};

exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    if (!['mentee', 'mentor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'INVALID_ROLE' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    res.json({
      success: true,
      message: 'Role updated successfully',
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        applicationStatus: user.applicationStatus
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.profile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const user = await User.findById(userId).select('firstname lastname email role applicationStatus');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    return res.json({
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role || null,
      applicationStatus: user.applicationStatus || 'not_submitted'
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};


