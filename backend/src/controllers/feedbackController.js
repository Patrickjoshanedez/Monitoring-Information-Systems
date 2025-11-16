const mongoose = require('mongoose');
const crypto = require('crypto');
const Session = require('../models/Session');
const SessionFeedback = require('../models/SessionFeedback');
const FeedbackReviewTicket = require('../models/FeedbackReviewTicket');
const User = require('../models/User');
const { ok, fail } = require('../utils/responses');

const FEEDBACK_WINDOW_DAYS = 14;

const normalizeObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return null;
};

const buildMenteeOwnershipFilter = (userId) => {
  const normalized = normalizeObjectId(userId);
  if (!normalized) {
    return null;
  }

  return {
    $or: [{ mentee: normalized }, { participants: { $elemMatch: { user: normalized } } }],
  };
};

const isValidRating = (value) => Number.isFinite(value) && value >= 1 && value <= 5;

const buildAnonymizedCode = ({ menteeId, sessionId }) => {
  return crypto.createHash('sha1').update(`${menteeId}:${sessionId}`).digest('hex').slice(0, 8);
};

exports.submitSessionFeedback = async (req, res) => {
  try {
    if (req.user.role !== 'mentee') {
      return fail(res, 403, 'FORBIDDEN', 'Only mentees can submit session feedback.');
    }

    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return fail(res, 400, 'INVALID_SESSION_ID', 'Invalid session identifier.');
    }

    const { rating, comment, flagReason } = req.body || {};
    const parsedRating = Number(rating);

    if (!isValidRating(parsedRating)) {
      return fail(res, 400, 'INVALID_RATING', 'Rating must be between 1 and 5.');
    }

    const trimmedComment = comment ? String(comment).trim() : undefined;
    if (trimmedComment && trimmedComment.length > 2000) {
      return fail(res, 400, 'INVALID_COMMENT', 'Feedback comment exceeds the 2000 character limit.');
    }

    const trimmedFlagReason = flagReason ? String(flagReason).trim() : undefined;
    if (trimmedFlagReason && trimmedFlagReason.length > 1000) {
      return fail(res, 400, 'INVALID_FLAG_REASON', 'Flag reason exceeds the 1000 character limit.');
    }

    const menteeFilter = buildMenteeOwnershipFilter(req.user.id);
    if (!menteeFilter) {
      return fail(res, 400, 'INVALID_USER_ID', 'Signed-in account identifier is invalid.');
    }

    const session = await Session.findOne({ _id: sessionId, ...menteeFilter })
      .select('mentee mentor date attended participants')
      .lean();
    if (!session) {
      return fail(res, 404, 'SESSION_NOT_FOUND', 'Session not found or not owned by mentee.');
    }

    if (!session.attended) {
      return fail(res, 400, 'SESSION_NOT_COMPLETED', 'Feedback can only be submitted after attending the session.');
    }

    const now = new Date();
    if (session.date > now) {
      return fail(res, 400, 'FEEDBACK_NOT_OPEN', 'Feedback opens after the session completes.');
    }

    const windowStart = new Date(now.getTime() - FEEDBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    if (session.date < windowStart) {
      return fail(res, 400, 'FEEDBACK_WINDOW_CLOSED', 'Feedback window has closed for this session.');
    }

  const existing = await SessionFeedback.findOne({ session: sessionId });
    if (existing) {
      return fail(res, 409, 'FEEDBACK_EXISTS', 'Feedback already submitted for this session.');
    }

    const anonymizedCode = buildAnonymizedCode({ menteeId: req.user.id, sessionId });
    const doc = await SessionFeedback.create({
      session: sessionId,
      mentor: session.mentor,
      mentee: req.user.id,
      rating: parsedRating,
      comment: trimmedComment,
      anonymizedCode,
      flagged: Boolean(trimmedFlagReason),
      flagReason: trimmedFlagReason,
    });

    await User.updateOne(
      { _id: session.mentor },
      [
        {
          $set: {
            'feedbackStats.totalReviews': {
              $add: [{ $ifNull: ['$feedbackStats.totalReviews', 0] }, 1],
            },
            'feedbackStats.totalScore': {
              $add: [{ $ifNull: ['$feedbackStats.totalScore', 0] }, { $literal: parsedRating }],
            },
            'feedbackStats.averageRating': {
              $round: [
                {
                  $divide: [
                    { $add: [{ $ifNull: ['$feedbackStats.totalScore', 0] }, { $literal: parsedRating }] },
                    { $add: [{ $ifNull: ['$feedbackStats.totalReviews', 0] }, 1] },
                  ],
                },
                1,
              ],
            },
            'feedbackStats.lastReviewAt': '$$NOW',
          },
        },
      ]
    );

    if (doc.flagged) {
      await FeedbackReviewTicket.create({
        feedback: doc._id,
        createdBy: req.user.id,
        reason: doc.flagReason || 'Flagged during submission',
      });
    }

    return ok(res, { feedback: { id: doc._id.toString(), rating: doc.rating } });
  } catch (error) {
    return fail(res, 500, 'FEEDBACK_SUBMIT_FAILED', error.message);
  }
};

exports.listPendingFeedback = async (req, res) => {
  try {
    if (req.user.role !== 'mentee') {
      return fail(res, 403, 'FORBIDDEN', 'Only mentees can view pending feedback.');
    }

    const windowStart = new Date(Date.now() - FEEDBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const menteeFilter = buildMenteeOwnershipFilter(req.user.id);
    if (!menteeFilter) {
      return ok(res, { pending: [] }, { count: 0 });
    }

    const sessions = await Session.find({
      ...menteeFilter,
      attended: true,
      date: { $lte: new Date(), $gte: windowStart },
    })
      .select('subject mentor date')
      .populate('mentor', 'firstname lastname email')
      .lean();

    const sessionIds = sessions.map((s) => s._id);
    const feedbackDocs = await SessionFeedback.find({ session: { $in: sessionIds } })
      .select('session')
      .lean();
    const submittedSet = new Set(feedbackDocs.map((f) => f.session.toString()));
    const { getFullName } = require('../utils/person');

    const pending = sessions
      .filter((s) => !submittedSet.has(s._id.toString()))
      .map((s) => ({
        id: s._id.toString(),
        subject: s.subject,
        mentor: {
          id: s.mentor?._id?.toString() || null,
          name: s.mentor ? getFullName(s.mentor) || s.mentor.email : 'Mentor',
        },
        date: s.date,
      }));

    return ok(res, { pending }, { count: pending.length });
  } catch (error) {
    return fail(res, 500, 'PENDING_FEEDBACK_FAILED', error.message);
  }
};

exports.getMentorFeedbackSummary = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return fail(res, 400, 'INVALID_ID', 'Invalid mentor id.');
    }

    const mentor = await User.findById(mentorId).select('feedbackStats firstname lastname email role');
    if (!mentor || mentor.role !== 'mentor') {
      return fail(res, 404, 'MENTOR_NOT_FOUND', 'Mentor not found.');
    }

    const summary = {
      averageRating: mentor.feedbackStats?.averageRating || 0,
      totalReviews: mentor.feedbackStats?.totalReviews || 0,
      lastReviewAt: mentor.feedbackStats?.lastReviewAt || null,
    };

    const recent = await SessionFeedback.find({ mentor: mentorId, flagged: { $ne: true } })
      .sort({ submittedAt: -1 })
      .limit(10)
      .select('rating comment submittedAt anonymizedCode')
      .lean();

    return ok(res, {
      summary,
      recent: recent.map((item) => ({
        code: item.anonymizedCode,
        rating: item.rating,
        comment: item.comment || null,
        submittedAt: item.submittedAt,
      })),
    });
  } catch (error) {
    return fail(res, 500, 'FEEDBACK_SUMMARY_FAILED', error.message);
  }
};

exports.listAdminFeedback = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return fail(res, 403, 'FORBIDDEN', 'Admin access required.');
    }

    const status = req.query.status === 'all' ? undefined : req.query.status;
    const filter = {};
    if (status === 'flagged') {
      filter.flagged = true;
    }

    const feedbacks = await SessionFeedback.find(filter)
      .sort({ submittedAt: -1 })
      .limit(100)
      .select('mentor rating comment submittedAt anonymizedCode flagged flagReason')
      .populate('mentor', 'firstname lastname email')
      .lean();

    const { getFullName } = require('../utils/person');

    const rows = feedbacks.map((fb) => ({
      id: fb._id.toString(),
      mentor: fb.mentor ? getFullName(fb.mentor) || fb.mentor.email : 'Mentor',
      rating: fb.rating,
      comment: fb.comment || null,
      submittedAt: fb.submittedAt,
      anonymizedCode: fb.anonymizedCode,
      flagged: !!fb.flagged,
      flagReason: fb.flagReason || null,
    }));

    return ok(res, { feedback: rows }, { count: rows.length });
  } catch (error) {
    return fail(res, 500, 'ADMIN_FEEDBACK_FAILED', error.message);
  }
};
