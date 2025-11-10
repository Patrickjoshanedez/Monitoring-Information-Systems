const path = require('path');
const User = require('../models/User');
const { uploadBuffer, deleteAsset } = require('../utils/cloudinary');

const avatarFolder = process.env.CLOUDINARY_AVATAR_FOLDER || 'mentoring/avatars';

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

    const user = await User.findById(req.user.id).select('profile');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const sanitizedBase = path
      .basename(req.file.originalname, path.extname(req.file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 120) || 'profile_photo';

    let uploadResult;
    try {
      uploadResult = await uploadBuffer(req.file.buffer, {
        folder: avatarFolder,
        resource_type: 'image',
        public_id: `${sanitizedBase}_${Date.now()}`,
        overwrite: false,
        transformation: [{ width: 512, height: 512, crop: 'limit' }],
      });
    } catch (storageErr) {
      const message = storageErr.code === 'CLOUDINARY_NOT_CONFIGURED'
        ? 'Cloud storage is not configured on the server.'
        : storageErr.message;
      return res.status(502).json({ error: 'UPLOAD_FAILED', message });
    }

    const updatePayload = {
      'profile.photoUrl': uploadResult.secure_url || uploadResult.url,
      'profile.photoPublicId': uploadResult.public_id,
    };

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updatePayload },
      { new: true }
    ).select('profile');

    const previousPublicId = user.profile?.photoPublicId;
    if (previousPublicId && previousPublicId !== uploadResult.public_id) {
      deleteAsset(previousPublicId, 'image').catch(() => {});
    }

    return res.json({ photoUrl: updated.profile?.photoUrl || updatePayload['profile.photoUrl'] });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};
