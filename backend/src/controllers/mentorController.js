const mongoose = require('mongoose');
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const Notification = require('../models/Notification');

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

const normalizeMentor = (user) => {
  const data = user.applicationData || {};
  const firstname = user.firstname || '';
  const lastname = user.lastname || '';
  const fullName = [firstname, lastname].join(' ').replace(/\s+/g, ' ').trim() || 'Mentor';

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

const formatPerson = (user) => {
  if (!user) {
    return {
      id: null,
      name: 'Unknown user',
      email: null,
    };
  }

  const name = [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
  return {
    id: user._id.toString(),
    name: name || user.email,
    email: user.email,
  };
};

const createNotification = async (userId, type, title, message, data = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return;
  }

  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
    });
  } catch (error) {
    console.error('createNotification error:', error);
  }
};

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
      createNotification(
        mentee._id,
        'MENTORSHIP_REQUEST_SUBMITTED',
        'Mentorship request sent',
        `You requested mentorship from ${[mentor.firstname, mentor.lastname].filter(Boolean).join(' ') || mentor.email}.`,
        { requestId: request._id, mentorId: mentor._id }
      ),
      createNotification(
        mentor._id,
        'MENTORSHIP_REQUEST_RECEIVED',
        'New mentorship request',
        `${[mentee.firstname, mentee.lastname].filter(Boolean).join(' ') || mentee.email} requested mentorship in ${request.subject}.`,
        { requestId: request._id, menteeId: mentee._id }
      ),
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
      createNotification(
        request.mentee._id,
        'MENTORSHIP_MATCHED',
        'Mentorship request accepted',
        `${[request.mentor.firstname, request.mentor.lastname].filter(Boolean).join(' ') || request.mentor.email} accepted your mentorship request${request.sessionSuggestion ? ` and suggested ${request.sessionSuggestion}` : ''}.`,
        { requestId: request._id, sessionSuggestion: request.sessionSuggestion }
      ),
      createNotification(
        request.mentor._id,
        'MENTORSHIP_MATCH_CONFIRMED',
        'Mentorship match confirmed',
        `You accepted the mentorship request from ${[request.mentee.firstname, request.mentee.lastname].filter(Boolean).join(' ') || request.mentee.email}.`,
        { requestId: request._id }
      ),
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
      createNotification(
        request.mentee._id,
        'MENTORSHIP_DECLINED',
        'Mentorship request declined',
        `${[request.mentor.firstname, request.mentor.lastname].filter(Boolean).join(' ') || request.mentor.email} declined your mentorship request${request.declineReason ? `: ${request.declineReason}` : '.'}`,
        { requestId: request._id, declineReason: request.declineReason }
      ),
      createNotification(
        request.mentor._id,
        'MENTORSHIP_RESPONSE_RECORDED',
        'Mentorship request declined',
        `You declined the mentorship request from ${[request.mentee.firstname, request.mentee.lastname].filter(Boolean).join(' ') || request.mentee.email}.`,
        { requestId: request._id }
      ),
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
      createNotification(
        request.mentor._id,
        'MENTORSHIP_WITHDRAWN',
        'Mentorship request withdrawn',
        `${[request.mentee.firstname, request.mentee.lastname].filter(Boolean).join(' ') || request.mentee.email} withdrew their mentorship request.`,
        { requestId: request._id }
      ),
      createNotification(
        request.mentee._id,
        'MENTORSHIP_WITHDRAWAL_CONFIRMED',
        'Mentorship request withdrawn',
        'You withdrew your mentorship request.',
        { requestId: request._id }
      ),
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

exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      notifications: notifications.map((notification) => ({
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        readAt: notification.readAt || null,
        createdAt: notification.createdAt,
      })),
    });
  } catch (error) {
    console.error('listNotifications error:', error);
    return res.status(500).json({
      success: false,
      error: 'NOTIFICATION_FETCH_FAILED',
      message: 'Unable to fetch notifications at this time.',
    });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'NOTIFICATION_NOT_FOUND',
        message: 'Notification not found.',
      });
    }

    return res.json({
      success: true,
      notification: {
        id: notification._id.toString(),
        readAt: notification.readAt,
      },
    });
  } catch (error) {
    console.error('markNotificationRead error:', error);
    return res.status(500).json({
      success: false,
      error: 'NOTIFICATION_UPDATE_FAILED',
      message: 'Unable to update notification at this time.',
    });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, readAt: { $exists: false } },
      { readAt: new Date() }
    );

    return res.json({
      success: true,
      message: 'Notifications marked as read.',
    });
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    return res.status(500).json({
      success: false,
      error: 'NOTIFICATION_UPDATE_FAILED',
      message: 'Unable to update notifications at this time.',
    });
  }
};
