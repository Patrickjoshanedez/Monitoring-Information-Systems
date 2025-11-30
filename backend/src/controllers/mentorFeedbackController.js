const mongoose = require('mongoose');
const MentorFeedback = require('../models/MentorFeedback');
const Session = require('../models/Session');
const Mentorship = require('../models/Mentorship');
const FeedbackAuditLog = require('../models/FeedbackAuditLog');
const { ok, fail } = require('../utils/responses');
const logger = require('../utils/logger');
const { sendNotification } = require('../utils/notificationService');
const mentorFeedbackAggregation = require('../services/mentorFeedbackAggregationWorker');
const { MENTOR_FEEDBACK_EDIT_WINDOW_DAYS } = require('../config/feedback');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_COMMENT_LENGTH = 2000;
const MAX_COMPETENCIES = 8;
const NOTIFICATION_DEBOUNCE_MINUTES =
    parseInt(process.env.MENTOR_FEEDBACK_NOTIFICATION_DEBOUNCE_MINUTES || '', 10) || 180;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const sanitizeComment = (value) => {
    if (!value) {
        return '';
    }

    return value
        .toString()
        .replace(/<[^>]+>/gi, ' ')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, MAX_COMMENT_LENGTH);
};

const sanitizeCompetencies = (list) => {
    if (!Array.isArray(list)) {
        return [];
    }

    const cleaned = [];
    list.every((entry) => {
        if (cleaned.length >= MAX_COMPETENCIES) {
            return false;
        }

        if (!entry || typeof entry.skillKey !== 'string') {
            return true;
        }

        const skillKey = entry.skillKey.trim().slice(0, 64);
        if (!skillKey) {
            return true;
        }

        const level = Number(entry.level);
        if (!Number.isFinite(level) || level < 1 || level > 5) {
            return true;
        }

        const cleanedEntry = {
            skillKey,
            level,
        };

        if (typeof entry.notes === 'string' && entry.notes.trim()) {
            cleanedEntry.notes = entry.notes.trim().slice(0, 500);
        }

        cleaned.push(cleanedEntry);
        return true;
    });

    return cleaned;
};

const resolveCompletionTime = (sessionDoc) => {
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

const computeEditWindowClose = (completedAt) =>
    new Date(completedAt.getTime() + MENTOR_FEEDBACK_EDIT_WINDOW_DAYS * DAY_MS);

const buildValidationError = (code, message) => ({
    ok: false,
    error: { status: 400, code, message },
});

const extractFeedbackPayload = (body = {}) => {
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return buildValidationError('INVALID_RATING', 'Rating must be between 1 and 5.');
    }

    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, MAX_COMMENT_LENGTH) : '';
    const sanitizedComment = sanitizeComment(comment);
    const competencies = sanitizeCompetencies(body.competencies);
    const visibility = body.visibility === 'private' ? 'private' : 'public';

    return {
        ok: true,
        payload: {
            rating,
            competencies,
            comment: comment || null,
            sanitizedComment,
            visibility,
        },
    };
};

const recordAudit = async ({ req, feedbackId, action, metadata = {} }) => {
    if (!feedbackId || !req?.user?.id) {
        return;
    }

    try {
        await FeedbackAuditLog.create({
            feedbackId,
            actorId: req.user.id,
            action,
            ip: req.ip,
            metadata,
        });
    } catch (error) {
        logger.warn('mentor feedback audit log failed: %s', error.message);
    }
};

const formatMentorView = (doc) => {
    if (!doc) {
        return null;
    }

    return {
        id: doc._id.toString(),
        sessionId: doc.sessionId.toString(),
        menteeId: doc.menteeId.toString(),
        rating: doc.rating,
        competencies: doc.competencies || [],
        comment: doc.comment || null,
        sanitizedComment: doc.sanitizedComment || null,
        visibility: doc.visibility,
        editWindowClosesAt: doc.editWindowClosesAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        canEdit: Date.now() <= new Date(doc.editWindowClosesAt).getTime(),
    };
};

const formatMenteeView = (doc) => {
    if (!doc) {
        return null;
    }

    const isPublic = doc.visibility === 'public';

    return {
        id: doc._id.toString(),
        rating: doc.rating,
        competencies: isPublic ? doc.competencies || [] : [],
        comment: isPublic ? doc.sanitizedComment || null : null,
        visibility: doc.visibility,
        submittedAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
};

const formatSnapshotResponse = (snapshot) => {
    if (!snapshot) {
        return {
            menteeId: null,
            ratingAvg: 0,
            ratingCount: 0,
            monthlyTrend: [],
            recentComments: [],
            milestones: { reached: 0, lastUpdatedAt: null },
            lastUpdated: null,
        };
    }

    return {
        menteeId: snapshot.menteeId?.toString() || null,
        ratingAvg: snapshot.ratingAvg || 0,
        ratingCount: snapshot.ratingCount || 0,
        monthlyTrend: Array.isArray(snapshot.monthlyTrend) ? snapshot.monthlyTrend : [],
        recentComments: Array.isArray(snapshot.recentComments)
            ? snapshot.recentComments.map((entry) => ({
                  feedbackId:
                      entry.feedbackId && typeof entry.feedbackId.toString === 'function'
                          ? entry.feedbackId.toString()
                          : entry.feedbackId || null,
                  mentorId:
                      entry.mentorId && typeof entry.mentorId.toString === 'function'
                          ? entry.mentorId.toString()
                          : entry.mentorId || null,
                  mentorName: entry.mentorName || 'Mentor',
                  rating: entry.rating,
                  visibility: entry.visibility,
                  comment: entry.comment,
                  createdAt: entry.createdAt,
              }))
            : [],
        milestones: snapshot.milestones || { reached: 0, lastUpdatedAt: null },
        lastUpdated: snapshot.lastUpdated || snapshot.updatedAt || null,
    };
};

const ensureMentorRole = (req, res) => {
    if (req.user.role !== 'mentor') {
        fail(res, 403, 'FORBIDDEN', 'Only mentors can perform this action.');
        return false;
    }

    return true;
};

const ensureSessionForMentor = async ({ sessionId, mentorId }) => {
    if (!isValidObjectId(sessionId)) {
        return { ok: false, error: { status: 400, code: 'INVALID_ID', message: 'Invalid session id.' } };
    }

    const session = await Session.findById(sessionId)
        .select('mentor mentee subject attended status completedAt updatedAt date')
        .lean();

    if (!session) {
        return { ok: false, error: { status: 404, code: 'SESSION_NOT_FOUND', message: 'Session not found.' } };
    }

    if (!session.mentor || session.mentor.toString() !== mentorId) {
        return { ok: false, error: { status: 403, code: 'NOT_SESSION_MENTOR', message: 'You are not allowed to modify this session.' } };
    }

    if (!session.mentee) {
        return { ok: false, error: { status: 400, code: 'SESSION_NO_MENTEE', message: 'Session does not have a mentee assigned.' } };
    }

    if (!session.attended && session.status !== 'completed') {
        return {
            ok: false,
            error: {
                status: 400,
                code: 'SESSION_NOT_COMPLETED',
                message: 'Feedback can only be submitted after completing the session.',
            },
        };
    }

    const completedAt = resolveCompletionTime(session);
    if (!completedAt) {
        return {
            ok: false,
            error: { status: 400, code: 'MISSING_COMPLETION', message: 'Session completion time is unavailable.' },
        };
    }

    if (Date.now() < completedAt.getTime()) {
        return {
            ok: false,
            error: { status: 400, code: 'FEEDBACK_NOT_OPEN', message: 'Feedback window opens after the session completes.' },
        };
    }

    const editWindowClosesAt = computeEditWindowClose(completedAt);

    return { ok: true, session, editWindowClosesAt };
};

const mentorCanAccessMentee = async ({ mentorId, menteeId }) => {
    const activeStatuses = ['active', 'paused'];
    const mentorship = await Mentorship.findOne({ mentorId, menteeId, status: { $in: activeStatuses } })
        .select('_id')
        .lean();
    if (mentorship) {
        return true;
    }

    const sessionExists = await Session.exists({
        mentor: mentorId,
        $or: [{ mentee: menteeId }, { 'participants.user': menteeId }],
    });

    return Boolean(sessionExists);
};

const maybeNotifyMentee = async ({ feedbackDoc, sessionDoc }) => {
    if (!feedbackDoc?.menteeId) {
        return;
    }

    try {
        const now = new Date();
        const debounceMs = NOTIFICATION_DEBOUNCE_MINUTES * 60 * 1000;
        if (
            feedbackDoc.lastNotifiedAt &&
            now.getTime() - new Date(feedbackDoc.lastNotifiedAt).getTime() < debounceMs
        ) {
            return;
        }

        const subject = sessionDoc?.subject ? ` for "${sessionDoc.subject}"` : '';
        const title = 'New mentor feedback available';
        const message = `Your mentor submitted feedback${subject}. Rating: ${feedbackDoc.rating}/5.`;

        const result = await sendNotification({
            userId: feedbackDoc.menteeId,
            type: 'MENTOR_FEEDBACK',
            title,
            message,
            data: {
                feedbackId: feedbackDoc._id,
                sessionId: feedbackDoc.sessionId,
            },
        });

        if (result?.delivered) {
            await MentorFeedback.updateOne(
                { _id: feedbackDoc._id },
                { $set: { lastNotifiedAt: now } }
            );
        }
    } catch (error) {
        logger.warn('mentor feedback notification failed: %s', error.message);
    }
};

exports.createMentorFeedback = async (req, res) => {
    if (!ensureMentorRole(req, res)) {
        return;
    }

    try {
        const { sessionId } = req.params;
        const access = await ensureSessionForMentor({ sessionId, mentorId: req.user.id });
        if (!access.ok) {
            return fail(res, access.error.status, access.error.code, access.error.message);
        }

        const existing = await MentorFeedback.findOne({ sessionId });
        if (existing) {
            return fail(res, 409, 'MENTOR_FEEDBACK_EXISTS', 'Feedback already submitted for this session.');
        }

        const payloadResult = extractFeedbackPayload(req.body);
        if (!payloadResult.ok) {
            const { status, code, message } = payloadResult.error;
            return fail(res, status, code, message);
        }

        const { payload } = payloadResult;
        const menteeId = access.session.mentee.toString();

        const feedbackDoc = await MentorFeedback.create({
            sessionId,
            mentorId: req.user.id,
            menteeId,
            rating: payload.rating,
            competencies: payload.competencies,
            comment: payload.comment,
            sanitizedComment: payload.sanitizedComment,
            visibility: payload.visibility,
            editWindowClosesAt: access.editWindowClosesAt,
        });

        await recordAudit({
            req,
            feedbackId: feedbackDoc._id,
            action: 'create',
            metadata: { sessionId },
        });

    mentorFeedbackAggregation.queueProgressSnapshotBuild(menteeId);
        maybeNotifyMentee({ feedbackDoc, sessionDoc: access.session });

        return ok(res, { feedback: formatMentorView(feedbackDoc) });
    } catch (error) {
        logger.error('create mentor feedback failed:', error);
        return fail(res, 500, 'MENTOR_FEEDBACK_FAILED', 'Unable to submit mentor feedback.');
    }
};

exports.updateMentorFeedback = async (req, res) => {
    if (!ensureMentorRole(req, res)) {
        return;
    }

    try {
        const { sessionId } = req.params;
        if (!isValidObjectId(sessionId)) {
            return fail(res, 400, 'INVALID_ID', 'Invalid session id.');
        }

        const feedbackDoc = await MentorFeedback.findOne({ sessionId });
        if (!feedbackDoc) {
            return fail(res, 404, 'MENTOR_FEEDBACK_NOT_FOUND', 'No feedback found for this session.');
        }

        if (feedbackDoc.mentorId.toString() !== req.user.id) {
            return fail(res, 403, 'FORBIDDEN', 'You cannot edit another mentor\'s feedback.');
        }

        if (Date.now() > new Date(feedbackDoc.editWindowClosesAt).getTime()) {
            return fail(res, 410, 'FEEDBACK_WINDOW_CLOSED', 'The edit window for this feedback has closed.');
        }

        const payloadResult = extractFeedbackPayload(req.body);
        if (!payloadResult.ok) {
            const { status, code, message } = payloadResult.error;
            return fail(res, status, code, message);
        }

        const { payload } = payloadResult;
        feedbackDoc.rating = payload.rating;
        feedbackDoc.competencies = payload.competencies;
        feedbackDoc.comment = payload.comment;
        feedbackDoc.sanitizedComment = payload.sanitizedComment;
        feedbackDoc.visibility = payload.visibility;

        await feedbackDoc.save();

        await recordAudit({
            req,
            feedbackId: feedbackDoc._id,
            action: 'update',
            metadata: { sessionId },
        });

    mentorFeedbackAggregation.queueProgressSnapshotBuild(feedbackDoc.menteeId.toString());

        return ok(res, { feedback: formatMentorView(feedbackDoc) });
    } catch (error) {
        logger.error('update mentor feedback failed:', error);
        return fail(res, 500, 'MENTOR_FEEDBACK_FAILED', 'Unable to update mentor feedback.');
    }
};

exports.getMentorFeedbackForSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!isValidObjectId(sessionId)) {
            return fail(res, 400, 'INVALID_ID', 'Invalid session id.');
        }

        const feedbackDoc = await MentorFeedback.findOne({ sessionId }).lean();
        if (!feedbackDoc) {
            return ok(res, { feedback: null });
        }

        const userId = req.user.id;
        if (req.user.role === 'mentor') {
            if (feedbackDoc.mentorId.toString() !== userId) {
                return fail(res, 403, 'FORBIDDEN', 'You do not have access to this feedback.');
            }
            return ok(res, { feedback: formatMentorView(feedbackDoc) });
        }

        if (req.user.role === 'mentee') {
            if (feedbackDoc.menteeId.toString() !== userId) {
                return fail(res, 403, 'FORBIDDEN', 'You do not have access to this feedback.');
            }

            await recordAudit({
                req,
                feedbackId: feedbackDoc._id,
                action: 'view',
                metadata: { sessionId },
            });

            return ok(res, { feedback: formatMenteeView(feedbackDoc) });
        }

        if (req.user.role === 'admin') {
            await recordAudit({
                req,
                feedbackId: feedbackDoc._id,
                action: 'view',
                metadata: { sessionId, admin: true },
            });
            return ok(res, { feedback: formatMentorView(feedbackDoc) });
        }

        return fail(res, 403, 'FORBIDDEN', 'You do not have access to this feedback.');
    } catch (error) {
        logger.error('get mentor feedback failed:', error);
        return fail(res, 500, 'MENTOR_FEEDBACK_FAILED', 'Unable to load mentor feedback.');
    }
};

exports.getOwnProgressSnapshot = async (req, res) => {
    if (req.user.role !== 'mentee') {
        return fail(res, 403, 'FORBIDDEN', 'Only mentees can view this resource.');
    }

    try {
        const snapshot = await mentorFeedbackAggregation.getProgressSnapshot(req.user.id, {
            rebuildIfMissing: true,
        });
        return ok(res, { snapshot: formatSnapshotResponse(snapshot) });
    } catch (error) {
        logger.error('get mentee snapshot failed:', error);
        return fail(res, 500, 'PROGRESS_SNAPSHOT_FAILED', 'Unable to load progress snapshot.');
    }
};

exports.getProgressSnapshotForMentee = async (req, res) => {
    const { menteeId } = req.params;
    if (!isValidObjectId(menteeId)) {
        return fail(res, 400, 'INVALID_ID', 'Invalid mentee id.');
    }

    const isAdmin = req.user.role === 'admin';
    const isMentor = req.user.role === 'mentor';
    if (!isAdmin && !isMentor) {
        return fail(res, 403, 'FORBIDDEN', 'You are not allowed to view this progress snapshot.');
    }

    if (isMentor) {
        const allowed = await mentorCanAccessMentee({ mentorId: req.user.id, menteeId });
        if (!allowed) {
            return fail(res, 403, 'MENTOR_NO_ACCESS', 'You can only view progress for your mentees.');
        }
    }

    try {
        const snapshot = await mentorFeedbackAggregation.getProgressSnapshot(menteeId, {
            rebuildIfMissing: true,
        });
        return ok(res, { snapshot: formatSnapshotResponse(snapshot) });
    } catch (error) {
        logger.error('admin snapshot load failed:', error);
        return fail(res, 500, 'PROGRESS_SNAPSHOT_FAILED', 'Unable to load mentee snapshot.');
    }
};

exports.listFeedbackAuditEvents = async (req, res) => {
    if (req.user.role !== 'admin') {
        return fail(res, 403, 'FORBIDDEN', 'Admin access required.');
    }

    const { feedbackId } = req.params;
    if (!isValidObjectId(feedbackId)) {
        return fail(res, 400, 'INVALID_ID', 'Invalid feedback id.');
    }

    try {
        const events = await FeedbackAuditLog.find({ feedbackId })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        return ok(res, {
            events: events.map((event) => ({
                id: event._id.toString(),
                actorId: event.actorId.toString(),
                action: event.action,
                ip: event.ip || null,
                metadata: event.metadata || {},
                createdAt: event.createdAt,
            })),
        });
    } catch (error) {
        logger.error('list feedback audit events failed:', error);
        return fail(res, 500, 'AUDIT_LOG_FAILED', 'Unable to load audit events.');
    }
};
