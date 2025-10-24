const User = require('../models/User');
const path = require('path');

// Submit mentee application
const submitApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstname,
      lastname,
      email,
      yearLevel,
      program,
      specificSkills,
      major,
      programmingLanguage,
      motivation
    } = req.body;

    // Validate required fields
    if (!yearLevel || !program || !specificSkills || !major || !programmingLanguage) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'All required fields must be provided'
      });
    }

    // Check if user already has a pending or approved application
    const user = await User.findById(userId);
    if (user.applicationStatus === 'pending' || user.applicationStatus === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'APPLICATION_EXISTS',
        message: 'You already have a submitted application'
      });
    }

    // Handle file upload
    let corUrl = '';
    if (req.file) {
      corUrl = `/uploads/cor/${req.file.filename}`;
    }

    // Update user with application data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstname,
        lastname,
        email,
        applicationStatus: 'pending',
        applicationData: {
          yearLevel,
          program,
          specificSkills,
          corUrl,
          major,
          programmingLanguage,
          motivation: motivation || ''
        },
        applicationSubmittedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationStatus: updatedUser.applicationStatus
    });

  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      error: 'SUBMISSION_FAILED',
      message: 'Failed to submit application'
    });
  }
};

// Get application status
const getApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('applicationStatus applicationData applicationSubmittedAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      status: user.applicationStatus,
      applicationData: user.applicationData,
      submittedAt: user.applicationSubmittedAt
    });

  } catch (error) {
    console.error('Get application status error:', error);
    res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to fetch application status'
    });
  }
};

// List all applications (Admin only)
const listApplications = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    
    const query = { role: 'mentee' };
    if (status !== 'all') {
      query.applicationStatus = status;
    }

    const applications = await User.find(query)
      .select('firstname lastname email applicationStatus applicationData applicationSubmittedAt')
      .sort({ applicationSubmittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      applications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('List applications error:', error);
    res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to fetch applications'
    });
  }
};

// Approve application (Admin only)
const approveApplication = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.applicationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Application is not in pending status'
      });
    }

    await User.findByIdAndUpdate(userId, {
      applicationStatus: 'approved',
      applicationReviewedAt: new Date(),
      applicationReviewedBy: adminId
    });

    res.json({
      success: true,
      message: 'Application approved successfully'
    });

  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({
      success: false,
      error: 'APPROVAL_FAILED',
      message: 'Failed to approve application'
    });
  }
};

// Reject application (Admin only)
const rejectApplication = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.applicationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Application is not in pending status'
      });
    }

    await User.findByIdAndUpdate(userId, {
      applicationStatus: 'rejected',
      applicationReviewedAt: new Date(),
      applicationReviewedBy: adminId
    });

    res.json({
      success: true,
      message: 'Application rejected'
    });

  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      error: 'REJECTION_FAILED',
      message: 'Failed to reject application'
    });
  }
};

module.exports = {
  submitApplication,
  getApplicationStatus,
  listApplications,
  approveApplication,
  rejectApplication
};

