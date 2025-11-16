const mongoose = require('mongoose');
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
// Notification handlers moved to notificationController for compactness
const { sendNotification } = require('../utils/notificationService');

const toArray = (value) => {
  if (!value) return [];
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

const buildAvailability = (applicationData = {}) => {
  const days = toArray(applicationData.availabilityDays);
  const meetingFormats = toArray(applicationData.meetingFormats);
  const hours = applicationData.availabilityHoursPerWeek;

  if (!days.length) {
    return meetingFormats.length ? meetingFormats.map((format) => `${format}`) : ['Schedule to be coordinated'];
  }

  const suffix = [
    meetingFormats.length ? meetingFormats.join(' / ') : null,
    typeof hours === 'number' && hours > 0 ? `${hours} hrs/wk` : null
  ]
    .filter(Boolean)
    .join(' · ');

  return days.map((day) => (suffix ? `${day} (${suffix})` : day));
};

const { getFullName, personFromUser } = require('../utils/person');

const normalizeMentor = (user) => {
  const data = user.applicationData || {};
  const fullName = getFullName(user) || 'Mentor';

  const topics = toArray(data.mentoringTopics);
  const expertise = toArray(data.expertiseAreas);
  const subjects = topics.length ? topics : expertise.length ? expertise : ['Mentorship'];

  const languages = toArray(data.languages || data.preferredLanguages);
  if (!languages.length) {
    languages.push('English');
  }

  const availability = buildAvailability(data);
  const rating = typeof data.averageRating === 'number' ? data.averageRating : 4.5;
  const reviewCount = typeof data.reviewCount === 'number' ? data.reviewCount : 0;
  const experienceYears = typeof data.yearsOfExperience === 'number' ? data.yearsOfExperience : undefined;

  return {
    id: user._id.toString(),
    fullName,
    headline: data.currentRole || data.professionalSummary || 'Mentor',
    rating,
    reviewCount,
    subjects,
    languages,
    availability,
    nextAvailableSlot: data.nextAvailableSlot || null,
    experienceYears,
    bioSnippet: data.professionalSummary || data.mentoringGoals || data.achievements || '',
  };
};

const matchesFilters = (mentor, filters) => {
  const search = (filters.search || '').toLowerCase();
  if (search) {
    const matchFullName = mentor.fullName.toLowerCase().includes(search);
    const matchSubject = mentor.subjects.some((subject) => subject.toLowerCase().includes(search));
    if (!matchFullName && !matchSubject) {
      return false;
    }
  }

  if (filters.subject) {
    const subject = filters.subject.toLowerCase();
    const hasSubject = mentor.subjects.some((item) => item.toLowerCase() === subject);
    if (!hasSubject) {
      return false;
    }
  }

  if (filters.language) {
    const language = filters.language.toLowerCase();
    const hasLanguage = mentor.languages.some((item) => item.toLowerCase() === language);
    if (!hasLanguage) {
      return false;
    }
  }

  if (filters.availability) {
    const availability = filters.availability.toLowerCase();
    const hasAvailability = mentor.availability.some((slot) => slot.toLowerCase().includes(availability));
    if (!hasAvailability) {
      return false;
    }
  }

  const minRating = Number(filters.minRating);
  if (!Number.isNaN(minRating) && minRating > 0) {
    if (Number(mentor.rating || 0) < minRating) {
      return false;
    }
  }

  return true;
};

const formatPerson = personFromUser;

const serializeRequest = (request) => ({
  id: request._id.toString(),
  status: request.status,
  subject: request.subject,
  preferredSlot: request.preferredSlot || null,
  goals: request.goals || null,
  notes: request.notes || null,
  sessionSuggestion: request.sessionSuggestion || null,
  mentor: formatPerson(request.mentor),
  mentee: formatPerson(request.mentee),
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
  mentorResponseAt: request.mentorResponseAt || null,
  menteeWithdrawnAt: request.menteeWithdrawnAt || null,
  declineReason: request.declineReason || null,
});

exports.listMentorRoster = async (req, res) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentors can view their roster.' });
  }

  try {
    const acceptedRequests = await MentorshipRequest.find({
      mentor: req.user.id,
      status: 'accepted',
    })
      .populate('mentee', 'firstname lastname email profile.photoUrl profile.displayName')
      .lean();

    const rosterMap = new Map();
    acceptedRequests.forEach((request) => {
      if (request.mentee) {
        rosterMap.set(request.mentee._id.toString(), request.mentee);
      }
    });

    const mentees = Array.from(rosterMap.values()).map((mentee) => ({
      id: mentee._id.toString(),
      name: getFullName(mentee) || mentee.email,
      email: mentee.email,
      avatar: mentee.profile?.photoUrl || null,
    }));

    return res.json({ success: true, mentees, meta: { count: mentees.length } });
  } catch (error) {
    console.error('listMentorRoster error:', error);
    return res.status(500).json({ success: false, error: 'MENTOR_ROSTER_FAILED', message: 'Unable to load mentee roster.' });
  }
};

exports.listMentors = async (req, res) => {
  try {
    const filters = {
      search: req.query.search || '',
      subject: req.query.subject || '',
      availability: req.query.availability || '',
      language: req.query.language || '',
      minRating: req.query.minRating || '',
    };

    // Optional pagination (defaults keep existing behavior)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const mentorsFromDb = await User.find({
      role: 'mentor',
      applicationStatus: 'approved',
    })
      .select('firstname lastname email applicationData role applicationStatus')
      .lean();

    const normalizedMentors = mentorsFromDb.map(normalizeMentor);
    const filteredMentors = normalizedMentors.filter((mentor) => matchesFilters(mentor, filters));

    const total = filteredMentors.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageItems = filteredMentors.slice(start, end);

    return res.json({
      success: true,
      mentors: pageItems,
      meta: {
        source: 'api',
        message: 'Mentors are sourced from approved mentor profiles in the platform database.',
        total,
        available: normalizedMentors.length,
        page,
        limit,
        totalPages,
        count: pageItems.length,
      },
    });
  } catch (error) {
    console.error('listMentors error:', error);
    return res.status(500).json({
      success: false,
      error: 'MENTOR_LIST_FAILED',
      message: 'Unable to fetch mentors at this time.',
    });
  }
};

exports.submitMentorshipRequest = async (req, res) => {
  try {
    const { mentorId, subject, preferredSlot, goals, notes } = req.body || {};

    if (!mentorId || !subject) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'mentorId and subject are required.',
      });
    }

    const mentee = await User.findById(req.user.id).select('role applicationStatus firstname lastname email');
    if (!mentee || mentee.role !== 'mentee') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only mentees can submit mentorship requests.',
      });
    }

    if (mentee.applicationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'APPLICATION_NOT_APPROVED',
        message: 'Mentee application must be approved before sending requests.',
      });
    }

    const mentor = await User.findById(mentorId).select('role applicationStatus firstname lastname email');
    if (!mentor || mentor.role !== 'mentor' || mentor.applicationStatus !== 'approved') {
      return res.status(404).json({
        success: false,
        error: 'MENTOR_NOT_AVAILABLE',
        message: 'Selected mentor is not available.',
      });
    }

    const existingPending = await MentorshipRequest.findOne({
      mentee: req.user.id,
      mentor: mentorId,
      status: { $in: ['pending', 'accepted'] },
    }).lean();

    if (existingPending) {
      return res.status(409).json({
        success: false,
        error: 'REQUEST_EXISTS',
        message: 'A mentorship request already exists for this mentor.',
      });
    }

    const request = await MentorshipRequest.create({
      mentee: req.user.id,
      mentor: mentorId,
      subject: String(subject).trim(),
      preferredSlot: preferredSlot ? String(preferredSlot).trim() : undefined,
      goals: goals ? String(goals).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
    });

    await Promise.all([
      sendNotification({
        userId: mentee._id,
        type: 'MENTORSHIP_REQUEST_SUBMITTED',
        title: 'Mentorship request sent',
    message: `You requested mentorship from ${getFullName(mentor) || mentor.email}.`,
        data: { requestId: request._id, mentorId: mentor._id },
      }),
      sendNotification({
        userId: mentor._id,
        type: 'MENTORSHIP_REQUEST_RECEIVED',
        title: 'New mentorship request',
    message: `${getFullName(mentee) || mentee.email} requested mentorship in ${request.subject}.`,
        data: { requestId: request._id, menteeId: mentee._id },
      }),
    ]);

    const populatedRequest = await MentorshipRequest.findById(request._id)
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Mentorship request submitted successfully.',
      request: serializeRequest(populatedRequest),
      meta: {
        source: 'api',
      },
    });
  } catch (error) {
    console.error('submitMentorshipRequest error:', error);
    return res.status(500).json({
      success: false,
      error: 'REQUEST_FAILED',
      message: 'Unable to submit mentorship request at this time.',
    });
  }
};

exports.listMentorshipRequests = async (req, res) => {
  try {
    const scope = req.query.scope === 'mentor' ? 'mentor' : 'mentee';
    const statusParam = req.query.status && req.query.status !== 'all' ? req.query.status : undefined;

    const query = scope === 'mentor'
      ? { mentor: req.user.id }
      : { mentee: req.user.id };

    if (statusParam) {
      query.status = statusParam;
    }

    const requests = await MentorshipRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
      .lean();

    return res.json({
      success: true,
      requests: requests.map(serializeRequest),
      meta: {
        scope,
        total: requests.length,
        pending: requests.filter((request) => request.status === 'pending').length,
      },
    });
  } catch (error) {
    console.error('listMentorshipRequests error:', error);
    return res.status(500).json({
      success: false,
      error: 'REQUEST_LIST_FAILED',
      message: 'Unable to fetch mentorship requests at this time.',
    });
  }
};

exports.acceptMentorshipRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionSuggestion } = req.body || {};

    const request = await MentorshipRequest.findById(id)
      .populate('mentor', 'firstname lastname email role applicationStatus')
      .populate('mentee', 'firstname lastname email role applicationStatus');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'REQUEST_NOT_FOUND',
        message: 'Mentorship request not found.',
      });
    }

    if (request.mentor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only the assigned mentor can respond to this request.',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Only pending requests can be accepted.',
      });
    }

    request.status = 'accepted';
    request.sessionSuggestion = sessionSuggestion ? String(sessionSuggestion).trim() : undefined;
    request.mentorResponseAt = new Date();
    request.declineReason = undefined;
    request.menteeWithdrawnAt = undefined;

    await request.save();

    await Promise.all([
      sendNotification({
        userId: request.mentee._id,
        type: 'MENTORSHIP_MATCHED',
        title: 'Mentorship request accepted',
    message: `${getFullName(request.mentor) || request.mentor.email} accepted your mentorship request${request.sessionSuggestion ? ` and suggested ${request.sessionSuggestion}` : ''}.`,
        data: { requestId: request._id, sessionSuggestion: request.sessionSuggestion },
      }),
      sendNotification({
        userId: request.mentor._id,
        type: 'MENTORSHIP_MATCH_CONFIRMED',
        title: 'Mentorship match confirmed',
    message: `You accepted the mentorship request from ${getFullName(request.mentee) || request.mentee.email}.`,
        data: { requestId: request._id },
      }),
    ]);

    const refreshed = await MentorshipRequest.findById(request._id)
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
      .lean();

    return res.json({
      success: true,
      message: 'Mentorship request accepted.',
      request: serializeRequest(refreshed),
    });
  } catch (error) {
    console.error('acceptMentorshipRequest error:', error);
    return res.status(500).json({
      success: false,
      error: 'REQUEST_UPDATE_FAILED',
      message: 'Unable to accept mentorship request at this time.',
    });
  }
};

exports.declineMentorshipRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { declineReason } = req.body || {};

    const request = await MentorshipRequest.findById(id)
      .populate('mentor', 'firstname lastname email role applicationStatus')
      .populate('mentee', 'firstname lastname email role applicationStatus');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'REQUEST_NOT_FOUND',
        message: 'Mentorship request not found.',
      });
    }

    if (request.mentor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only the assigned mentor can respond to this request.',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Only pending requests can be declined.',
      });
    }

    request.status = 'declined';
    request.declineReason = declineReason ? String(declineReason).trim() : undefined;
    request.mentorResponseAt = new Date();
    request.sessionSuggestion = undefined;

    await request.save();

    await Promise.all([
      sendNotification({
        userId: request.mentee._id,
        type: 'MENTORSHIP_DECLINED',
        title: 'Mentorship request declined',
    message: `${getFullName(request.mentor) || request.mentor.email} declined your mentorship request${request.declineReason ? `: ${request.declineReason}` : '.'}`,
        data: { requestId: request._id, declineReason: request.declineReason },
      }),
      sendNotification({
        userId: request.mentor._id,
        type: 'MENTORSHIP_RESPONSE_RECORDED',
        title: 'Mentorship request declined',
    message: `You declined the mentorship request from ${getFullName(request.mentee) || request.mentee.email}.`,
        data: { requestId: request._id },
      }),
    ]);

    const refreshed = await MentorshipRequest.findById(request._id)
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
      .lean();

    return res.json({
      success: true,
      message: 'Mentorship request declined.',
      request: serializeRequest(refreshed),
    });
  } catch (error) {
    console.error('declineMentorshipRequest error:', error);
    return res.status(500).json({
      success: false,
      error: 'REQUEST_UPDATE_FAILED',
      message: 'Unable to decline mentorship request at this time.',
    });
  }
};

exports.withdrawMentorshipRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await MentorshipRequest.findById(id)
      .populate('mentor', 'firstname lastname email role applicationStatus')
      .populate('mentee', 'firstname lastname email role applicationStatus');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'REQUEST_NOT_FOUND',
        message: 'Mentorship request not found.',
      });
    }

    if (request.mentee._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only the requesting mentee can withdraw this request.',
      });
    }

    if (!['pending', 'accepted'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Only pending or accepted requests can be withdrawn.',
      });
    }

    request.status = 'withdrawn';
    request.menteeWithdrawnAt = new Date();
    request.sessionSuggestion = undefined;
    request.declineReason = undefined;

    await request.save();

    await Promise.all([
      sendNotification({
        userId: request.mentor._id,
        type: 'MENTORSHIP_WITHDRAWN',
        title: 'Mentorship request withdrawn',
    message: `${getFullName(request.mentee) || request.mentee.email} withdrew their mentorship request.`,
        data: { requestId: request._id },
      }),
      sendNotification({
        userId: request.mentee._id,
        type: 'MENTORSHIP_WITHDRAWAL_CONFIRMED',
        title: 'Mentorship request withdrawn',
    message: 'You withdrew your mentorship request.',
        data: { requestId: request._id },
      }),
    ]);

    const refreshed = await MentorshipRequest.findById(request._id)
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
      .lean();

    return res.json({
      success: true,
      message: 'Mentorship request withdrawn.',
      request: serializeRequest(refreshed),
    });
  } catch (error) {
    console.error('withdrawMentorshipRequest error:', error);
    return res.status(500).json({
      success: false,
      error: 'REQUEST_UPDATE_FAILED',
      message: 'Unable to withdraw mentorship request at this time.',
    });
  }
};

