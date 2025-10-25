const User = require('../models/User');
const { verifyRecaptchaToken } = require('../utils/recaptcha');

const sanitizeArrayInput = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseNumericField = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const submitMenteeApplication = async (req, res) => {
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
      motivation,
      recaptchaToken
    } = req.body;

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
    if (!recaptchaResult.ok) {
      return res.status(recaptchaResult.status).json({
        success: false,
        error: recaptchaResult.code,
        message: recaptchaResult.message,
        details: recaptchaResult.details
      });
    }

    if (!yearLevel || !program || !specificSkills || !major || !programmingLanguage) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'All required fields must be provided'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.applicationStatus === 'pending' || user.applicationStatus === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'APPLICATION_EXISTS',
        message: 'You already have a submitted application'
      });
    }

    if (user.role !== 'mentee') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only mentees can submit this application'
      });
    }

    let corUrl = '';
    if (req.file) {
      corUrl = `/uploads/applications/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstname,
        lastname,
        email,
        applicationRole: 'mentee',
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
        applicationSubmittedAt: new Date(),
        applicationReviewedAt: undefined,
        applicationReviewedBy: undefined
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationStatus: updatedUser.applicationStatus
    });
  } catch (error) {
    console.error('Submit mentee application error:', error);
    return res.status(500).json({
      success: false,
      error: 'SUBMISSION_FAILED',
      message: 'Failed to submit application'
    });
  }
};

const submitMentorApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstname,
      lastname,
      email,
      currentRole,
      organization,
      expertiseAreas,
      mentoringTopics,
      mentoringGoals,
      professionalSummary,
      achievements,
      linkedinUrl,
      portfolioUrl,
      availabilityDays,
      availabilityHoursPerWeek,
      meetingFormats,
      yearsOfExperience,
      motivation,
      recaptchaToken
    } = req.body;

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
    if (!recaptchaResult.ok) {
      return res.status(recaptchaResult.status).json({
        success: false,
        error: recaptchaResult.code,
        message: recaptchaResult.message,
        details: recaptchaResult.details
      });
    }

    const normalizedExpertise = sanitizeArrayInput(expertiseAreas);
    const normalizedTopics = sanitizeArrayInput(mentoringTopics);
    const normalizedAvailabilityDays = sanitizeArrayInput(availabilityDays);
    const normalizedMeetingFormats = sanitizeArrayInput(meetingFormats);
    const parsedExperience = parseNumericField(yearsOfExperience);
    const parsedHours = parseNumericField(availabilityHoursPerWeek);

    if (!currentRole || !normalizedExpertise.length || !normalizedTopics.length || !normalizedAvailabilityDays.length) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Required mentor application fields are missing'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only mentors can submit this application'
      });
    }

    if (user.applicationStatus === 'pending' || user.applicationStatus === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'APPLICATION_EXISTS',
        message: 'You already have a submitted application'
      });
    }

    let supportingDocumentUrl = '';
    if (req.file) {
      supportingDocumentUrl = `/uploads/applications/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstname,
        lastname,
        email,
        applicationRole: 'mentor',
        applicationStatus: 'pending',
        applicationData: {
          currentRole,
          organization: organization || '',
          yearsOfExperience: parsedExperience,
          expertiseAreas: normalizedExpertise,
          mentoringTopics: normalizedTopics,
          mentoringGoals: mentoringGoals || '',
          professionalSummary: professionalSummary || '',
          achievements: achievements || '',
          linkedinUrl: linkedinUrl || '',
          portfolioUrl: portfolioUrl || '',
          availabilityDays: normalizedAvailabilityDays,
          availabilityHoursPerWeek: parsedHours,
          meetingFormats: normalizedMeetingFormats,
          motivation: motivation || '',
          supportingDocumentUrl
        },
        applicationSubmittedAt: new Date(),
        applicationReviewedAt: undefined,
        applicationReviewedBy: undefined
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationStatus: updatedUser.applicationStatus
    });
  } catch (error) {
    console.error('Submit mentor application error:', error);
    return res.status(500).json({
      success: false,
      error: 'SUBMISSION_FAILED',
      message: 'Failed to submit application'
    });
  }
};

const buildStatusResponse = (user) => ({
  success: true,
  role: user.applicationRole || user.role,
  status: user.applicationStatus,
  applicationData: user.applicationData || {},
  submittedAt: user.applicationSubmittedAt,
  profile: {
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email
  }
});

const getMenteeApplicationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'firstname lastname email role applicationRole applicationStatus applicationData applicationSubmittedAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.role !== 'mentee') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only mentees can access this status endpoint'
      });
    }

    return res.json(buildStatusResponse(user));
  } catch (error) {
    console.error('Get mentee application status error:', error);
    return res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to fetch application status'
    });
  }
};

const getMentorApplicationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'firstname lastname email role applicationRole applicationStatus applicationData applicationSubmittedAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only mentors can access this status endpoint'
      });
    }

    return res.json(buildStatusResponse(user));
  } catch (error) {
    console.error('Get mentor application status error:', error);
    return res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to fetch application status'
    });
  }
};

const listApplications = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10, role = 'mentee' } = req.query;

    const query = {};
    if (role !== 'all') {
      query.applicationRole = role;
    }
    if (status !== 'all') {
      query.applicationStatus = status;
    }

    const applications = await User.find(query)
      .select('firstname lastname email role applicationRole applicationStatus applicationData applicationSubmittedAt')
      .sort({ applicationSubmittedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    return res.json({
      success: true,
      applications,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit) || 1),
        total
      }
    });
  } catch (error) {
    console.error('List applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to fetch applications'
    });
  }
};

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

    return res.json({
      success: true,
      message: 'Application approved successfully'
    });
  } catch (error) {
    console.error('Approve application error:', error);
    return res.status(500).json({
      success: false,
      error: 'APPROVAL_FAILED',
      message: 'Failed to approve application'
    });
  }
};

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

    return res.json({
      success: true,
      message: 'Application rejected'
    });
  } catch (error) {
    console.error('Reject application error:', error);
    return res.status(500).json({
      success: false,
      error: 'REJECTION_FAILED',
      message: 'Failed to reject application'
    });
  }
};

module.exports = {
  submitMenteeApplication,
  submitMentorApplication,
  getMenteeApplicationStatus,
  getMentorApplicationStatus,
  listApplications,
  approveApplication,
  rejectApplication
};

