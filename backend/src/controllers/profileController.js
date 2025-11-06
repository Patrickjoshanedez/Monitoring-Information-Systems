const User = require('../models/User');

const pick = (obj, allowed) => Object.keys(obj || {}).reduce((acc, k) => {
  if (allowed.includes(k) && obj[k] !== undefined) acc[k] = obj[k];
  return acc;
}, {});

const getViewerLevel = (requester, targetUser) => {
  if (!requester) return 'public';
  if (requester.role === 'admin') return 'admin';
  if (String(requester.id) === String(targetUser._id)) return 'self';
  return 'mentors';
};

const filterByPrivacy = (profile, level) => {
  if (!profile) return {};
  if (level === 'admin' || level === 'self') return profile;
  const privacy = profile.privacy || {};
  const allowed = (field) => {
    const vis = privacy[field] || 'mentors';
    if (level === 'public') return vis === 'public';
    // mentors level: can see both 'public' and 'mentors'
    return vis === 'public' || vis === 'mentors';
  };
  const out = {};
  if (allowed('displayName')) out.displayName = profile.displayName;
  if (allowed('photo')) out.photoUrl = profile.photoUrl;
  if (allowed('bio')) out.bio = profile.bio;
  if (allowed('education')) out.education = profile.education;
  if (allowed('coursesNeeded')) out.coursesNeeded = profile.coursesNeeded;
  if (allowed('interests')) out.interests = profile.interests;
  if (allowed('learningGoals')) out.learningGoals = profile.learningGoals;
  if (allowed('contact')) out.contactPreferences = profile.contactPreferences;
  out.timezone = profile.timezone; // timezone is non-sensitive
  out.privacy = privacy; // provide privacy map for clients to know
  return out;
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('firstname lastname email role profile');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    return res.json({
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      profile: user.profile || {}
    });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { profile } = req.body || {};
    const allowedTop = ['displayName', 'photoUrl', 'bio', 'education', 'coursesNeeded', 'interests', 'learningGoals', 'timezone', 'contactPreferences', 'privacy'];
    const allowedEducation = ['program', 'yearLevel', 'major'];
    const clean = {};

    if (profile) {
      const picked = pick(profile, allowedTop);
      if (picked.education) {
        picked.education = pick(picked.education, allowedEducation);
      }
      if (picked.coursesNeeded && !Array.isArray(picked.coursesNeeded)) {
        picked.coursesNeeded = [];
      }
      if (picked.interests && !Array.isArray(picked.interests)) {
        picked.interests = [];
      }
      if (picked.contactPreferences && !Array.isArray(picked.contactPreferences)) {
        picked.contactPreferences = [];
      }
      clean.profile = picked;
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: clean },
      { new: true }
    ).select('firstname lastname email role profile');

    if (!updated) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    return res.json({
      id: updated._id,
      firstname: updated.firstname,
      lastname: updated.lastname,
      email: updated.email,
      role: updated.role,
      profile: updated.profile || {}
    });
  } catch (err) {
    console.error('Update profile error', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const target = await User.findById(req.params.id).select('firstname lastname role profile');
    if (!target) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    const level = getViewerLevel(req.user, target);
    const filtered = filterByPrivacy(target.profile || {}, level);
    return res.json({
      id: target._id,
      role: target.role,
      displayName: (target.profile && target.profile.displayName) || `${target.firstname || ''} ${target.lastname || ''}`.trim(),
      profile: filtered
    });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.afterPhotoUploaded = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'NO_FILE' });
    const url = `/uploads/avatars/${req.file.filename}`;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { 'profile.photoUrl': url } },
      { new: true }
    ).select('profile');
    return res.json({ photoUrl: updated.profile?.photoUrl || url });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};
