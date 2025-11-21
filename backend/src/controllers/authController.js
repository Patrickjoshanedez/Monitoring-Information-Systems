const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { verifyRecaptchaToken } = require('../utils/recaptcha');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const createJwt = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, role, recaptchaToken } = req.body;

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
    if (!recaptchaResult.ok) {
      return res.status(recaptchaResult.status).json({
        error: recaptchaResult.code,
        message: recaptchaResult.message,
        details: recaptchaResult.details
      });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'EMAIL_EXISTS' });
    const resolvedRole = role || 'mentee';
    // Prevent public registration for admin accounts; admins must be provisioned via back-office
    if (resolvedRole === 'admin') {
      return res.status(403).json({ error: 'ADMIN_REGISTRATION_FORBIDDEN', message: 'Admin accounts can only be created by an administrator.' });
    }
    // Admins must be explicitly approved by another admin (disabled for UI flows)
    const initialStatus = resolvedRole === 'admin' ? 'pending' : 'not_submitted';
    const initialApplicationRole = resolvedRole === 'admin' ? 'admin' : resolvedRole;

    const user = new User({
      firstname,
      lastname,
      email,
      password,
      role: resolvedRole,
      applicationStatus: initialStatus,
      applicationRole: initialApplicationRole,
      applicationData: {}
    });
    await user.save();
    return res.status(201).json({ message: 'REGISTERED' });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
    if (!recaptchaResult.ok) {
      return res.status(recaptchaResult.status).json({
        error: recaptchaResult.code,
        message: recaptchaResult.message,
        details: recaptchaResult.details
      });
    }
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
        applicationStatus: user.applicationStatus,
        applicationRole: user.applicationRole
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, recaptchaToken } = req.body;

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
    if (!recaptchaResult.ok) {
      return res.status(recaptchaResult.status).json({
        error: recaptchaResult.code,
        message: recaptchaResult.message,
        details: recaptchaResult.details
      });
    }
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

exports.googleAuthCallback = (req, res) => {
  const token = createJwt(req.user);
  const redirectBase = process.env.CLIENT_URL || 'http://localhost:5173';
  return res.redirect(`${redirectBase}/oauth/callback?token=${token}`);
};

// Facebook OAuth handlers
exports.facebookAuthCallback = (req, res) => {
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

    // Prevent non-admin users from setting themselves as admin via this API
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'UNAUTHORIZED_ROLE_CHANGE', message: 'Only administrators may assign the admin role.' });
    }

    const update = {
      role,
      applicationData: {},
      applicationSubmittedAt: undefined,
      applicationReviewedAt: undefined,
      applicationReviewedBy: undefined
    };

    if (role === 'admin') {
      // When switching to admin, mark as pending until approved
      update.applicationStatus = 'pending';
      update.applicationRole = 'admin';
    } else {
      update.applicationStatus = 'not_submitted';
      update.applicationRole = role;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      update,
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
        applicationStatus: user.applicationStatus,
        applicationRole: user.applicationRole
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
    // Select password only to compute passwordSet; do not return it to client
  const user = await User.findById(userId).select('firstname lastname email role applicationStatus applicationRole applicationData profile password');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    return res.json({
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role || null,
      applicationStatus: user.applicationStatus || 'not_submitted',
      applicationRole: user.applicationRole || null,
      applicationData: user.applicationData || {},
      profile: user.profile || {},
      passwordSet: Boolean(user.password)
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const {
      firstname,
      lastname,
      applicationData
    } = req.body;

    const update = {};
    if (firstname !== undefined) update.firstname = firstname;
    if (lastname !== undefined) update.lastname = lastname;
    if (applicationData) {
      // Only allow expected fields to be updated
      const allowed = ['professionalSummary', 'program', 'mentoringGoals', 'interests', 'yearLevel', 'specificSkills'];
      const sanitized = {};
      allowed.forEach((k) => {
        if (applicationData[k] !== undefined) sanitized[k] = applicationData[k];
      });
      update.applicationData = { ...(sanitized || {}) };
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).select('firstname lastname email role applicationStatus applicationRole applicationData');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    return res.json({
      message: 'PROFILE_UPDATED',
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role || null,
        applicationStatus: user.applicationStatus || 'not_submitted',
        applicationRole: user.applicationRole || null,
        applicationData: user.applicationData || {}
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.setPassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const { password } = req.body || {};
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findById(userId).select('password');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    if (user.password) {
      return res.status(400).json({ error: 'PASSWORD_ALREADY_SET', message: 'Password already set. Use reset password instead.' });
    }

    user.password = password; // will be hashed by pre-save hook
    await user.save();

    return res.json({ success: true, message: 'PASSWORD_SET' });
  } catch (err) {
    console.error('Set password error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};


