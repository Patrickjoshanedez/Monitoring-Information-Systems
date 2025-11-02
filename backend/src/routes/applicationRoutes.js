const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  submitMenteeApplication,
  submitMentorApplication,
  getMenteeApplicationStatus,
  getMentorApplicationStatus,
  listApplications,
  approveApplication,
  rejectApplication
} = require('../controllers/applicationController');

// Mentee routes
router.post('/mentee/application/submit', auth, upload.single('corFile'), submitMenteeApplication);
router.get('/mentee/application/status', auth, getMenteeApplicationStatus);

// Mentor routes
router.post('/mentor/application/submit', auth, upload.single('supportingDocument'), submitMentorApplication);
router.get('/mentor/application/status', auth, getMentorApplicationStatus);

// Admin routes
router.get('/admin/applications', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  next();
}, listApplications);

router.patch('/admin/applications/:userId/approve', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  next();
}, approveApplication);

router.patch('/admin/applications/:userId/reject', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  next();
}, rejectApplication);

// Admin route to update any user's role
router.patch('/admin/users/:userId/role', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['mentee', 'mentor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ROLE',
        message: 'Invalid role specified'
      });
    }

    const User = require('../models/User');
    const existing = await User.findById(userId).select('firstname lastname email role applicationStatus applicationRole');
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Policy: Any role change requires an approval step.
    // Mark the user as "pending" and stamp a submitted time so the entry
    // appears in the Application Review panel where admins can approve/reject.
    // Also reset review metadata.
    const update = {
      role,
      applicationRole: role,
      applicationStatus: 'pending',
      applicationSubmittedAt: new Date(),
      applicationReviewedAt: undefined,
      applicationReviewedBy: undefined
    };

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('firstname lastname email role applicationStatus applicationRole applicationSubmittedAt');

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        applicationStatus: user.applicationStatus,
        applicationRole: user.applicationRole,
        applicationSubmittedAt: user.applicationSubmittedAt,
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_FAILED',
      message: 'Failed to update user role'
    });
  }
});

module.exports = router;

