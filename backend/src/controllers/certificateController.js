const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const { generateCertificatePDF } = require('../utils/certificatePdf');

// Simple policy stub: completion if user has >= 3 accepted sessions & >= 1 goal completed.
// TODO: Replace with real aggregation logic using Session & Goal models.
async function checkCompletionCriteria(userId) {
  // Placeholder logic; assume criteria met for demonstration.
  return { eligible: true, reason: 'stub_criteria_met' };
}

exports.issueCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'completion', programName = 'Mentorship Program' } = req.body || {};

    if (!['completion', 'participation'].includes(type)) {
      return res.status(400).json({ success: false, error: 'INVALID_TYPE', message: 'Invalid certificate type.' });
    }

    const user = await User.findById(userId).select('firstname lastname role');
    if (!user || user.role !== 'mentee') {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentees can request certificates.' });
    }

    // Basic eligibility check for completion certificates
    if (type === 'completion') {
      const criteria = await checkCompletionCriteria(userId);
      if (!criteria.eligible) {
        return res.status(400).json({ success: false, error: 'CRITERIA_NOT_MET', message: 'Completion criteria not met.' });
      }
    }

    // For demo: choose first approved mentor as mentor reference (TODO: refine)
    const mentor = await User.findOne({ role: 'mentor', applicationStatus: 'approved' }).select('firstname lastname');
    const mentorName = mentor ? `${mentor.firstname} ${mentor.lastname}` : 'Mentor';

    const certificate = await Certificate.create({
      user: user._id,
      mentor: mentor ? mentor._id : user._id, // fallback
      programName,
      certificateType: type,
      issuanceLog: [{ issuedBy: req.user.id, reason: 'initial' }],
    });

    return res.json({
      success: true,
      message: 'Certificate issued',
      certificate: {
        id: certificate._id,
        type: certificate.certificateType,
        programName: certificate.programName,
        issuedAt: certificate.issuedAt,
      },
    });
  } catch (err) {
    console.error('issueCertificate error:', err);
    return res.status(500).json({ success: false, error: 'ISSUE_FAILED', message: 'Failed to issue certificate.' });
  }
};

exports.downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findById(id).populate('user', 'firstname lastname').populate('mentor', 'firstname lastname');
    if (!cert) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Certificate not found.' });
    }
    if (cert.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied.' });
    }

    const buffer = await generateCertificatePDF({
      fullName: `${cert.user.firstname} ${cert.user.lastname}`,
      mentorName: `${cert.mentor.firstname} ${cert.mentor.lastname}`,
      programName: cert.programName,
      certificateType: cert.certificateType,
      dateIssued: cert.issuedAt,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${cert._id}.pdf`);
    return res.send(buffer);
  } catch (err) {
    console.error('downloadCertificate error:', err);
    return res.status(500).json({ success: false, error: 'DOWNLOAD_FAILED', message: 'Failed to generate certificate PDF.' });
  }
};

exports.reissueCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findById(id);
    if (!cert) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Certificate not found.' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Admin required to reissue.' });
    }
    cert.reissueCount += 1;
    cert.issuanceLog.push({ issuedBy: req.user.id, reason: 'reissue' });
    await cert.save();
    return res.json({ success: true, message: 'Certificate reissued', reissueCount: cert.reissueCount });
  } catch (err) {
    console.error('reissueCertificate error:', err);
    return res.status(500).json({ success: false, error: 'REISSUE_FAILED', message: 'Failed to reissue certificate.' });
  }
};

exports.listAchievements = async (req, res) => {
  try {
    const items = await Achievement.find({ user: req.user.id }).sort({ earnedAt: -1 }).lean();
    return res.json({ success: true, achievements: items });
  } catch (err) {
    console.error('listAchievements error:', err);
    return res.status(500).json({ success: false, error: 'ACHIEVEMENTS_FAILED', message: 'Failed to load achievements.' });
  }
};

exports.awardAchievement = async (req, res) => {
  try {
    const { code, title, description, icon } = req.body || {};
    if (!code || !title) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'code and title required.' });
    }
    // Prevent duplicates by unique index
    const achievement = await Achievement.findOneAndUpdate(
      { user: req.user.id, code },
      { $setOnInsert: { title, description: description || '', icon: icon || '🏅', earnedAt: new Date() } },
      { new: true, upsert: true }
    );
    return res.json({ success: true, achievement });
  } catch (err) {
    console.error('awardAchievement error:', err);
    return res.status(500).json({ success: false, error: 'AWARD_FAILED', message: 'Failed to award achievement.' });
  }
};
