const mongoose = require('mongoose');
const Session = require('../models/Session');
const Feedback = require('../models/Feedback');
const AdminReviewTicket = require('../models/AdminReviewTicket');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { ok, fail } = require('../utils/responses');
const { annotateSessionsWithMeta } = require('../utils/sessionFormatter');
const { getFullName } = require('../utils/person');
const logger = require('../utils/logger');
const { FEEDBACK_WINDOW_DAYS } = require('../config/feedback');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TEXT_LENGTH = 2000;
const MAX_FLAG_LENGTH = 1000;

const sanitizeFeedbackText = (value) => {
    if (!value) {
        return '';
    }

    return value
        .toString()
        .replace(/<[^>]+>/gi, ' ')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, MAX_TEXT_LENGTH);
};

const sanitizeFlagReason = (value) => {
    if (!value) {
        return '';
    }

    return value.toString().replace(/\s+/g, ' ').trim().slice(0, MAX_FLAG_LENGTH);
};

const buildExcerpt = (text) => {
    if (!text) {
        return '';
    }

    return text.length <= 280 ? text : `${text.slice(0, 277)}...`;
};

const buildAnonymizedCode = ({ menteeId, sessionId }) => {
    return mongoose.Types.ObjectId.isValid(menteeId) && mongoose.Types.ObjectId.isValid(sessionId)
        ? require('crypto').createHash('sha1').update(`${menteeId}:${sessionId}`).digest('hex').slice(0, 10)
        : null;
};

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

const toPlain = (doc) => {
    if (!doc) {
        return null;
    }

    return typeof doc.toObject === 'function' ? doc.toObject() : doc;
};

const getCompletedAt = (sessionDoc) => {
    if (!sessionDoc) {
        return null;
    }

    if (sessionDoc.completedAt) {
        return new Date(sessionDoc.completedAt);
    }

    if (sessionDoc.updatedAt) {
        return new Date(sessionDoc.updatedAt);
    }

    if (sessionDoc.date) {
        return new Date(sessionDoc.date);
    }

    return null;
};

const computeWindowClose = (completedAt) => new Date(completedAt.getTime() + FEEDBACK_WINDOW_DAYS * DAY_MS);

const isSessionParticipant = (sessionDoc, userId) => {
    if (!sessionDoc || !userId) {
        return false;
    }

    const idStr = userId.toString();
    if (sessionDoc.mentee && sessionDoc.mentee.toString() === idStr) {
        return true;
    }

    if (Array.isArray(sessionDoc.participants)) {
        return sessionDoc.participants.some((entry) => {
            if (!entry || !entry.user) {
                return false;
            }
            const participantId = entry.user._id ? entry.user._id.toString() : entry.user.toString();
            return participantId === idStr;
        });
    }

    return false;
};

const evaluateFeedbackWindow = (sessionDoc) => {
    if (!sessionDoc.attended) {
        return {
            ok: false,
            error: {
                status: 400,
                code: 'SESSION_NOT_COMPLETED',
                message: 'Feedback can be submitted only after attending the session.',
            },
        };
    }

    const completedAt = getCompletedAt(sessionDoc);
    if (!completedAt) {
        return {
            ok: false,
            error: {
                status: 400,
                code: 'MISSING_COMPLETION',
                message: 'Session completion time is unavailable.',
            },
        };
    }

    const now = new Date();
    const closesAt = computeWindowClose(completedAt);

    if (now < completedAt) {
        return {
            ok: false,
            error: {
                status: 400,
                code: 'FEEDBACK_NOT_OPEN',
                message: 'Feedback window opens after the session completes.',
            },
        };
    }

    if (now > closesAt) {
        return {
            ok: false,
            error: {
                status: 410,
                code: 'FEEDBACK_WINDOW_CLOSED',
                message: 'Feedback window has closed for this session.',
            },
        };
    }

    return { ok: true, completedAt, windowClosesAt: closesAt };
};

const getMentorIdFromSession = (sessionDoc) => {
    if (!sessionDoc || !sessionDoc.mentor) {
        return null;
    }

    return sessionDoc.mentor._id ? sessionDoc.mentor._id : sessionDoc.mentor;
};

const formatMenteeFeedback = (doc) => {
    const payload = toPlain(doc);
    if (!payload) {
        return null;
    }

    return {
        id: payload._id.toString(),
        sessionId: payload.sessionId.toString(),
        mentorId: payload.mentorId.toString(),
        rating: payload.rating,
        text: payload.sanitizedText || payload.text || '',
        flagged: !!payload.flagged,
        flagReason: payload.flagReason || null,
        anonymizedCode: payload.anonymizedCode,
        windowClosesAt: payload.windowClosesAt,
        submittedAt: payload.createdAt,
        updatedAt: payload.updatedAt,
    };
};

const formatMentorFeedback = (doc) => {
    const payload = toPlain(doc);
    if (!payload) {
        return null;
    }

    return {
        id: payload._id.toString(),
        rating: payload.rating,
        comment: payload.sanitizedText || null,
        anonymizedCode: payload.anonymizedCode,
        flagged: !!payload.flagged,
        submittedAt: payload.createdAt,
    };
};

const formatAdminFeedback = (doc) => {
    const payload = toPlain(doc);
    if (!payload) {
        return null;
    }

    return {
        id: payload._id.toString(),
        rating: payload.rating,
        excerpt: buildExcerpt(payload.sanitizedText || payload.text || ''),
        anonymizedCode: payload.anonymizedCode,
        sessionId: payload.sessionId.toString(),
        mentorId: payload.mentorId.toString(),
        flagged: !!payload.flagged,
        submittedAt: payload.createdAt,
    };
};

const formatTicket = (ticket) => {
    const payload = toPlain(ticket);
    if (!payload) {
        return null;
    }

    const mentorDoc = payload.mentorId && payload.mentorId.firstname ? payload.mentorId : null;
    const sessionDoc = payload.sessionId && payload.sessionId.subject ? payload.sessionId : null;
    const feedbackDoc = payload.feedbackId && payload.feedbackId._id ? payload.feedbackId : null;

    return {
        id: payload._id.toString(),
        status: payload.status,
        reason: payload.reason,
        excerpt: payload.excerpt,
        sessionId: sessionDoc ? sessionDoc._id.toString() : payload.sessionId.toString(),
        mentorId: mentorDoc ? mentorDoc._id.toString() : payload.mentorId.toString(),
        reporterId: payload.reporterId.toString(),
        handledBy: payload.handledBy ? payload.handledBy.toString() : null,
        resolvedAt: payload.resolvedAt || null,
        notes: payload.notes || null,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
        mentorName: mentorDoc ? getFullName(mentorDoc) || mentorDoc.email : null,
        session: sessionDoc
            ? {
                  subject: sessionDoc.subject,
                  date: sessionDoc.date,
              }
            : null,
        feedback: feedbackDoc
            ? {
                  id: feedbackDoc._id.toString(),
                  rating: feedbackDoc.rating,
                  anonymizedCode: feedbackDoc.anonymizedCode,
                  submittedAt: feedbackDoc.createdAt,
              }
            : null,
    };
};

const logAuditEvent = async ({ actorId, action, resourceId, metadata = {} }) => {
    try {
        await AuditLog.create({ actorId, action, resourceType: 'feedback', resourceId, metadata });
    } catch (error) {
        logger.warn('audit log write failed', error);
    }
};

const updateMentorAggregatesOnCreate = async ({ mentorId, rating, session }) => {
    if (!mentorId) {
        return;
    }

    const pipeline = [
        {
            $set: {
                ratingCount: { $add: [{ $ifNull: ['$ratingCount', 0] }, { $literal: 1 }] },
                ratingAvg: {
                    $round: [
                        {
                            $divide: [
                                { $add: [{ $multiply: [{ $ifNull: ['$ratingAvg', 0] }, { $ifNull: ['$ratingCount', 0] }] }, { $literal: rating }] },
                                { $add: [{ $ifNull: ['$ratingCount', 0] }, { $literal: 1 }] },
                            ],
                        },
                        2,
                    ],
                },
                'feedbackStats.totalReviews': { $add: [{ $ifNull: ['$feedbackStats.totalReviews', 0] }, { $literal: 1 }] },
                'feedbackStats.totalScore': { $add: [{ $ifNull: ['$feedbackStats.totalScore', 0] }, { $literal: rating }] },
                'feedbackStats.averageRating': {
                    $round: [
                        {
                            $divide: [
                                { $add: [{ $ifNull: ['$feedbackStats.totalScore', 0] }, { $literal: rating }] },
                                { $add: [{ $ifNull: ['$feedbackStats.totalReviews', 0] }, { $literal: 1 }] },
                            ],
                        },
                        2,
                    ],
                },
                'feedbackStats.lastReviewAt': '$$NOW',
            },
        },
    ];

    await User.updateOne({ _id: mentorId }, pipeline, session ? { session } : undefined);
};

const updateMentorAggregatesOnUpdate = async ({ mentorId, ratingDelta, session }) => {
    if (!mentorId || !ratingDelta) {
        return;
    }

    const pipeline = [
        {
            $set: {
                ratingAvg: {
                    $round: [
                        {
                            $cond: [
                                { $gt: [{ $ifNull: ['$ratingCount', 0] }, 0] },
                                {
                                    $divide: [
                                        { $add: [{ $multiply: [{ $ifNull: ['$ratingAvg', 0] }, { $ifNull: ['$ratingCount', 0] }] }, { $literal: ratingDelta }] },
                                        { $ifNull: ['$ratingCount', 0] },
                                    ],
                                },
                                { $add: [{ $ifNull: ['$ratingAvg', 0] }, { $literal: ratingDelta }] },
                            ],
                        },
                        2,
                    ],
                },
                'feedbackStats.totalScore': { $add: [{ $ifNull: ['$feedbackStats.totalScore', 0] }, { $literal: ratingDelta }] },
                'feedbackStats.averageRating': {
                    $round: [
                        {
                            $cond: [
                                { $gt: [{ $ifNull: ['$feedbackStats.totalReviews', 0] }, 0] },
                                {
                                    $divide: [
                                        { $add: [{ $ifNull: ['$feedbackStats.totalScore', 0] }, { $literal: ratingDelta }] },
                                        { $ifNull: ['$feedbackStats.totalReviews', 0] },
                                    ],
                                },
                                { $add: [{ $ifNull: ['$feedbackStats.averageRating', 0] }, { $literal: ratingDelta }] },
                            ],
                        },
                        2,
                    ],
                },
                'feedbackStats.lastReviewAt': '$$NOW',
            },
        },
    ];

    await User.updateOne({ _id: mentorId }, pipeline, session ? { session } : undefined);
};

const runWithOptionalTransaction = async (work) => {
    let session = null;
    try {
        session = await mongoose.startSession();
        let result;
        await session.withTransaction(async () => {
            result = await work(session);
        });
        return result;
    } catch (error) {
        if (error?.message && error.message.includes('replica set')) {
            logger.warn('Feedback write falling back to non-transactional mode: %s', error.message);
            return work(null);
        }
        throw error;
    } finally {
        if (session) {
            session.endSession();
        }
    }
};

const createReviewTicket = async ({ feedbackDoc, reporterId, reason, session }) => {
    if (!feedbackDoc) {
        return null;
    }

    const baseFilter = { feedbackId: feedbackDoc._id, status: { $in: ['open', 'in_review'] } };
    const existing = await AdminReviewTicket.findOne(baseFilter).session(session || null);
    if (existing) {
        return existing;
    }

    const excerpt = buildExcerpt(feedbackDoc.sanitizedText || feedbackDoc.text || '');
    const payload = {
        feedbackId: feedbackDoc._id,
        sessionId: feedbackDoc.sessionId,
        mentorId: feedbackDoc.mentorId,
        reporterId,
        reason: reason || 'Flagged by participant',
        excerpt: excerpt || 'Feedback requires admin review.',
    };

    const [ticket] = await AdminReviewTicket.create([payload], session ? { session } : undefined);
    return ticket;
};

const fetchSessionLean = async (sessionId) => {
    return Session.findById(sessionId)
        .select('mentor mentee participants attended date completedAt updatedAt subject')
        .lean();
};

exports.createSessionFeedback = async (req, res) => {
    if (req.user.role !== 'mentee') {
        return fail(res, 403, 'FORBIDDEN', 'Only mentees can submit session feedback.');
    }

    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return fail(res, 400, 'INVALID_SESSION_ID', 'Invalid session identifier.');
    }

    const { rating, text, flagReason } = req.body || {};
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return fail(res, 400, 'INVALID_INPUT', 'Rating must be an integer between 1 and 5.');
    }

    const trimmedText = text ? text.toString().trim().slice(0, MAX_TEXT_LENGTH) : '';
    const sanitizedText = sanitizeFeedbackText(trimmedText);
    const cleanFlagReason = sanitizeFlagReason(flagReason);

    const sessionDoc = await fetchSessionLean(sessionId);
    if (!sessionDoc) {
        return fail(res, 404, 'SESSION_NOT_FOUND', 'Session not found or no longer available.');
    }

    if (!isSessionParticipant(sessionDoc, req.user.id)) {
        return fail(res, 403, 'NOT_PARTICIPANT', 'Feedback is limited to confirmed session participants.');
    }

    const windowCheck = evaluateFeedbackWindow(sessionDoc);
    if (!windowCheck.ok) {
        const { status, code, message } = windowCheck.error;
        return fail(res, status, code, message);
    }

    const existing = await Feedback.findOne({ sessionId, menteeId: req.user.id }).lean();
    if (existing) {
        return fail(res, 409, 'FEEDBACK_EXISTS', 'Feedback already submitted for this session.');
    }

    const mentorId = getMentorIdFromSession(sessionDoc);
    if (!mentorId) {
        return fail(res, 400, 'MENTOR_NOT_FOUND', 'Session mentor is missing.');
    }

    const payload = {
        sessionId,
        mentorId,
        menteeId: req.user.id,
        rating: parsedRating,
        text: trimmedText || undefined,
        sanitizedText,
        anonymizedCode: buildAnonymizedCode({ menteeId: req.user.id, sessionId }),
        windowClosesAt: windowCheck.windowClosesAt,
        flagged: Boolean(cleanFlagReason),
        flagReason: cleanFlagReason || undefined,
        submittedAt: new Date(),
        updatedBy: req.user.id,
    };

    const createdDoc = await runWithOptionalTransaction(async (dbSession) => {
        const [created] = await Feedback.create([payload], dbSession ? { session: dbSession } : undefined);
        await updateMentorAggregatesOnCreate({ mentorId, rating: parsedRating, session: dbSession });
        if (payload.flagged) {
            await createReviewTicket({ feedbackDoc: created, reporterId: req.user.id, reason: cleanFlagReason, session: dbSession });
        }
        return created;
    });

    return res.status(201).json({ success: true, data: formatMenteeFeedback(createdDoc) });
};

exports.updateSessionFeedback = async (req, res) => {
    if (req.user.role !== 'mentee') {
        return fail(res, 403, 'FORBIDDEN', 'Only mentees can update feedback.');
    }

    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return fail(res, 400, 'INVALID_SESSION_ID', 'Invalid session identifier.');
    }

    const { rating, text, flagReason } = req.body || {};
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return fail(res, 400, 'INVALID_INPUT', 'Rating must be an integer between 1 and 5.');
    }

    const trimmedText = text ? text.toString().trim().slice(0, MAX_TEXT_LENGTH) : '';
    const sanitizedText = sanitizeFeedbackText(trimmedText);
    const cleanFlagReason = sanitizeFlagReason(flagReason);

    const sessionDoc = await fetchSessionLean(sessionId);
    if (!sessionDoc) {
        return fail(res, 404, 'SESSION_NOT_FOUND', 'Session not found or no longer available.');
    }

    if (!isSessionParticipant(sessionDoc, req.user.id)) {
        return fail(res, 403, 'NOT_PARTICIPANT', 'Feedback is limited to confirmed session participants.');
    }

    const windowCheck = evaluateFeedbackWindow(sessionDoc);
    if (!windowCheck.ok) {
        const { status, code, message } = windowCheck.error;
        return fail(res, status, code, message);
    }

    const existing = await Feedback.findOne({ sessionId, menteeId: req.user.id });
    if (!existing) {
        return fail(res, 404, 'FEEDBACK_NOT_FOUND', 'Feedback not found for this session.');
    }

    const ratingDelta = parsedRating - existing.rating;
    const updatePayload = {
        rating: parsedRating,
        text: trimmedText || undefined,
        sanitizedText,
        windowClosesAt: windowCheck.windowClosesAt,
        updatedBy: req.user.id,
    };

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'flagReason')) {
        if (cleanFlagReason) {
            updatePayload.flagged = true;
            updatePayload.flagReason = cleanFlagReason;
        } else {
            updatePayload.flagged = false;
            updatePayload.flagReason = undefined;
        }
    }

    const updatedDoc = await runWithOptionalTransaction(async (dbSession) => {
        const updated = await Feedback.findByIdAndUpdate(existing._id, updatePayload, { new: true, session: dbSession });
        if (ratingDelta !== 0) {
            await updateMentorAggregatesOnUpdate({ mentorId: existing.mentorId, ratingDelta, session: dbSession });
        }
        const flagAdded = updatePayload.flagged && !existing.flagged;
        if (flagAdded) {
            await createReviewTicket({ feedbackDoc: updated, reporterId: req.user.id, reason: cleanFlagReason, session: dbSession });
        }
        return updated;
    });

    return ok(res, { data: formatMenteeFeedback(updatedDoc) });
};

exports.getSessionFeedback = async (req, res) => {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return fail(res, 400, 'INVALID_SESSION_ID', 'Invalid session identifier.');
    }

    const sessionDoc = await fetchSessionLean(sessionId);
    if (!sessionDoc) {
        return fail(res, 404, 'SESSION_NOT_FOUND', 'Session not found.');
    }

    if (req.user.role === 'mentee') {
        if (!isSessionParticipant(sessionDoc, req.user.id)) {
            return fail(res, 403, 'NOT_PARTICIPANT', 'Feedback is limited to confirmed session participants.');
        }
        const doc = await Feedback.findOne({ sessionId, menteeId: req.user.id });
        return ok(res, { feedback: doc ? formatMenteeFeedback(doc) : null });
    }

    if (req.user.role === 'mentor') {
        const mentorId = getMentorIdFromSession(sessionDoc);
        if (!mentorId || mentorId.toString() !== req.user.id) {
            return fail(res, 403, 'FORBIDDEN', 'Only the assigned mentor can view this feedback.');
        }
        const docs = await Feedback.find({ sessionId }).sort({ createdAt: -1 }).lean();
        return ok(res, { feedback: docs.map(formatMentorFeedback).filter(Boolean) });
    }

    if (req.user.role === 'admin') {
        const docs = await Feedback.find({ sessionId }).sort({ createdAt: -1 }).lean();
        return ok(res, { feedback: docs.map(formatAdminFeedback).filter(Boolean) });
    }

    return fail(res, 403, 'FORBIDDEN', 'Your role is not permitted to view session feedback.');
};

exports.getMentorFeedbackSummary = async (req, res) => {
    const { mentorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        return fail(res, 400, 'INVALID_ID', 'Invalid mentor identifier.');
    }

    const mentor = await User.findById(mentorId).select('role ratingAvg ratingCount feedbackStats');
    if (!mentor || mentor.role !== 'mentor') {
        return fail(res, 404, 'MENTOR_NOT_FOUND', 'Mentor not found.');
    }

    const ratingAvg = Number(Number(mentor.ratingAvg || mentor.feedbackStats?.averageRating || 0).toFixed(2));
    const ratingCount = mentor.ratingCount || mentor.feedbackStats?.totalReviews || 0;

    return ok(res, {
        summary: {
            ratingAvg,
            ratingCount,
        },
    });
};

exports.flagFeedback = async (req, res) => {
    const { feedbackId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
        return fail(res, 400, 'INVALID_ID', 'Invalid feedback identifier.');
    }

    const reason = sanitizeFlagReason(req.body?.reason);
    if (!reason) {
        return fail(res, 400, 'INVALID_INPUT', 'Reason is required to flag feedback.');
    }

    const feedbackDoc = await Feedback.findById(feedbackId);
    if (!feedbackDoc) {
        return fail(res, 404, 'FEEDBACK_NOT_FOUND', 'Feedback not found.');
    }

    if (req.user.role !== 'admin') {
        const sessionDoc = await fetchSessionLean(feedbackDoc.sessionId);
        if (!sessionDoc) {
            return fail(res, 404, 'SESSION_NOT_FOUND', 'Session not found.');
        }

        const isOwner = feedbackDoc.menteeId.toString() === req.user.id;
        const isMentor = getMentorIdFromSession(sessionDoc)?.toString() === req.user.id;
        const participant = isSessionParticipant(sessionDoc, req.user.id);
        if (!isOwner && !isMentor && !participant) {
            return fail(res, 403, 'NOT_PARTICIPANT', 'Only participants may flag feedback.');
        }
    }

    const ticket = await runWithOptionalTransaction(async (dbSession) => {
        await Feedback.updateOne(
            { _id: feedbackDoc._id },
            { flagged: true, flagReason: reason, updatedBy: req.user.id },
            dbSession ? { session: dbSession } : undefined
        );

        const freshDoc = await Feedback.findById(feedbackDoc._id).session(dbSession || null);
        return createReviewTicket({ feedbackDoc: freshDoc, reporterId: req.user.id, reason, session: dbSession });
    });

    return res.status(201).json({ success: true, data: { ticketId: ticket ? ticket._id.toString() : null } });
};

exports.listReviewTickets = async (req, res) => {
    if (req.user.role !== 'admin') {
        return fail(res, 403, 'FORBIDDEN', 'Admin access required.');
    }

    const status = req.query.status && req.query.status !== 'all' ? req.query.status : undefined;
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const filter = {};
    if (status) {
        filter.status = status;
    }

    if (from || to) {
        filter.createdAt = {};
        if (from && !Number.isNaN(from.getTime())) {
            filter.createdAt.$gte = from;
        }
        if (to && !Number.isNaN(to.getTime())) {
            filter.createdAt.$lte = to;
        }
    }

    const tickets = await AdminReviewTicket.find(filter)
        .sort({ createdAt: -1 })
        .limit(200)
        .populate('mentorId', 'firstname lastname email')
        .populate('sessionId', 'subject date')
        .populate('feedbackId', 'rating anonymizedCode sanitizedText createdAt')
        .lean();

    return ok(res, { tickets: tickets.map(formatTicket).filter(Boolean) }, { count: tickets.length });
};

exports.resolveReviewTicket = async (req, res) => {
    if (req.user.role !== 'admin') {
        return fail(res, 403, 'FORBIDDEN', 'Admin access required.');
    }

    const { ticketId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return fail(res, 400, 'INVALID_ID', 'Invalid ticket identifier.');
    }

    const nextStatus = req.body?.status && ['open', 'in_review', 'resolved'].includes(req.body.status)
        ? req.body.status
        : 'resolved';

    const notes = req.body?.notes ? req.body.notes.toString().trim().slice(0, 2000) : undefined;

    const ticket = await AdminReviewTicket.findById(ticketId);
    if (!ticket) {
        return fail(res, 404, 'TICKET_NOT_FOUND', 'Review ticket not found.');
    }

    ticket.status = nextStatus;
    ticket.notes = notes ?? ticket.notes;
    ticket.handledBy = req.user.id;
    ticket.resolvedAt = nextStatus === 'resolved' ? new Date() : ticket.resolvedAt;

    await ticket.save();

    return ok(res, { ticket: formatTicket(ticket) });
};

exports.getRawFeedbackForAdmin = async (req, res) => {
    if (req.user.role !== 'admin') {
        return fail(res, 403, 'FORBIDDEN', 'Admin access required.');
    }

    const { feedbackId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
        return fail(res, 400, 'INVALID_ID', 'Invalid feedback identifier.');
    }

    const doc = await Feedback.findById(feedbackId);
    if (!doc) {
        return fail(res, 404, 'FEEDBACK_NOT_FOUND', 'Feedback not found.');
    }

    await logAuditEvent({ actorId: req.user.id, action: 'VIEW_FEEDBACK_RAW', resourceId: feedbackId, metadata: { mentorId: doc.mentorId, sessionId: doc.sessionId } });

    return ok(res, {
        feedback: {
            id: doc._id.toString(),
            sessionId: doc.sessionId.toString(),
            mentorId: doc.mentorId.toString(),
            menteeId: doc.menteeId.toString(),
            rating: doc.rating,
            text: doc.text || '',
            sanitizedText: doc.sanitizedText || '',
            flagged: !!doc.flagged,
            flagReason: doc.flagReason || null,
        },
    });
};

exports.listPendingFeedback = async (req, res) => {
    if (req.user.role !== 'mentee') {
        return fail(res, 403, 'FORBIDDEN', 'Only mentees can view pending feedback.');
    }

    const windowStart = new Date(Date.now() - FEEDBACK_WINDOW_DAYS * DAY_MS);
    const menteeFilter = buildMenteeOwnershipFilter(req.user.id);
    if (!menteeFilter) {
        return ok(res, { pending: [] }, { count: 0 });
    }

    const sessions = await Session.find({
        ...menteeFilter,
        attended: true,
        $or: [
            { completedAt: { $gte: windowStart } },
            { completedAt: { $exists: false }, updatedAt: { $gte: windowStart } },
        ],
    })
        .select(
            'subject mentor mentee participants room capacity isGroup chatThread date durationMinutes attended tasksCompleted notes createdAt updatedAt completedAt'
        )
        .populate('mentor', 'firstname lastname email')
        .populate('mentee', 'firstname lastname email')
        .populate('participants.user', 'firstname lastname email')
        .lean();

    const annotated = await annotateSessionsWithMeta(sessions);
    const pendingRows = annotated.filter((session) => session.feedbackDue);

    const pending = pendingRows.map((session) => {
        const mentorInfo = session.mentor || { id: null, name: 'Mentor', email: null };
        return {
            id: session.id,
            subject: session.subject,
            mentor: {
                id: mentorInfo.id,
                name: mentorInfo.name || mentorInfo.email || 'Mentor',
            },
            date: session.completedAt || session.date,
            feedbackWindowClosesAt: session.feedbackWindowClosesAt,
        };
    });

    return ok(res, { pending }, { count: pending.length });
};
