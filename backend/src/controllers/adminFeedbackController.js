const mongoose = require('mongoose');
const MentorFeedback = require('../models/MentorFeedback');
const FeedbackAuditLog = require('../models/FeedbackAuditLog');
const { personFromUser } = require('../utils/person');
const { ok, fail } = require('../utils/responses');
const logger = require('../utils/logger');

const { Types } = mongoose;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_EXPORT_ROWS = 1000;
const LOW_RATING_THRESHOLD =
    Number(process.env.ADMIN_FEEDBACK_LOW_THRESHOLD || process.env.LOW_RATING_THRESHOLD || 3) || 3;

const parseBoolean = (value) => value === true || value === 'true' || value === '1';
const boundNumber = (value, fallback, { min = 1, max = 1000 } = {}) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
};

const sanitizeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeDate = (value) => {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const buildSort = (sortParam) => {
    switch (sortParam) {
        case 'oldest':
            return { createdAt: 1 };
        case 'rating-high':
            return { rating: -1, createdAt: -1 };
        case 'rating-low':
            return { rating: 1, createdAt: -1 };
        default:
            return { createdAt: -1 };
    }
};

const ensureObjectId = (value, label) => {
    if (!value) {
        return null;
    }
    if (!Types.ObjectId.isValid(value)) {
        const error = new Error(`Invalid ${label}`);
        error.status = 400;
        error.code = `INVALID_${label.toUpperCase()}_ID`;
        throw error;
    }
    return new Types.ObjectId(value);
};

const buildFilter = (query) => {
    const conditions = [];
    const ratingRange = {};

    if (query.mentor) {
        conditions.push({ mentorId: ensureObjectId(query.mentor, 'mentor') });
    }
    if (query.mentee) {
        conditions.push({ menteeId: ensureObjectId(query.mentee, 'mentee') });
    }
    if (query.session) {
        conditions.push({ sessionId: ensureObjectId(query.session, 'session') });
    }

    const ratingMin = Number(query.ratingMin);
    if (Number.isFinite(ratingMin) && ratingMin >= 1 && ratingMin <= 5) {
        ratingRange.$gte = ratingMin;
    }
    const ratingMax = Number(query.ratingMax);
    if (Number.isFinite(ratingMax) && ratingMax >= 1 && ratingMax <= 5) {
        ratingRange.$lte = ratingMax;
    }

    if (query.sentiment === 'low') {
        ratingRange.$lte = Math.min(ratingRange.$lte ?? LOW_RATING_THRESHOLD, LOW_RATING_THRESHOLD);
    } else if (query.sentiment === 'high') {
        ratingRange.$gte = Math.max(ratingRange.$gte ?? 4, 4);
    }

    if (Object.keys(ratingRange).length) {
        conditions.push({ rating: ratingRange });
    }

    if (query.visibility === 'public' || query.visibility === 'private') {
        conditions.push({ visibility: query.visibility });
    }

    if (query.flagged === 'true') {
        conditions.push({ 'moderation.flagged': true });
    } else if (query.flagged === 'false') {
        conditions.push({ 'moderation.flagged': { $ne: true } });
    }

    if (parseBoolean(query.commentOnly)) {
        conditions.push({ sanitizedComment: { $exists: true, $ne: '' } });
    }

    const submittedAfter = normalizeDate(query.submittedAfter);
    const submittedBefore = normalizeDate(query.submittedBefore);
    if (submittedAfter || submittedBefore) {
        const createdAt = {};
        if (submittedAfter) {
            createdAt.$gte = submittedAfter;
        }
        if (submittedBefore) {
            createdAt.$lte = submittedBefore;
        }
        conditions.push({ createdAt });
    }

    if (query.search && typeof query.search === 'string') {
        const regex = new RegExp(sanitizeRegex(query.search.trim()), 'i');
        conditions.push({
            $or: [
                { sanitizedComment: regex },
                { comment: regex },
                { 'moderation.reason': regex },
            ],
        });
    }

    if (!conditions.length) {
        return {};
    }

    if (conditions.length === 1) {
        return conditions[0];
    }

    return { $and: conditions };
};

const formatSession = (sessionDoc) => {
    if (!sessionDoc) {
        return null;
    }
    return {
        id: sessionDoc._id?.toString() ?? sessionDoc.id ?? null,
        subject: sessionDoc.subject || 'Mentoring session',
        date: sessionDoc.date || sessionDoc.completedAt || null,
        status: sessionDoc.status || null,
    };
};

const formatFeedbackRow = (doc) => {
    if (!doc) {
        return null;
    }

    return {
        id: doc._id.toString(),
        rating: doc.rating,
        visibility: doc.visibility,
        comment: doc.comment || null,
        sanitizedComment: doc.sanitizedComment || null,
        competencies: Array.isArray(doc.competencies) ? doc.competencies : [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        mentor: personFromUser(doc.mentorId) || null,
        mentee: personFromUser(doc.menteeId) || null,
        session: formatSession(doc.sessionId),
        moderation: {
            flagged: Boolean(doc.moderation?.flagged),
            reason: doc.moderation?.reason || null,
            flaggedAt: doc.moderation?.flaggedAt || null,
            flaggedBy: doc.moderation?.flaggedBy || null,
        },
    };
};

const populateMentorFeedback = (cursor) => {
    return cursor
        .populate('mentorId', 'firstname lastname email profile.displayName')
        .populate('menteeId', 'firstname lastname email profile.displayName')
        .populate('sessionId', 'subject date status completedAt');
};

const csvEscape = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    const normalized = String(value).replace(/\r?\n|\r/g, ' ').trim();
    if (/[",]/.test(normalized)) {
        return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
};

exports.listMentorFeedback = async (req, res) => {
    try {
        const filter = buildFilter(req.query || {});
        const page = boundNumber(req.query?.page, 1, { min: 1, max: 1000 });
        const limit = boundNumber(req.query?.limit, DEFAULT_LIMIT, { min: 5, max: MAX_LIMIT });
        const skip = (page - 1) * limit;
        const sort = buildSort(req.query?.sort);

        const [rows, total] = await Promise.all([
            populateMentorFeedback(
                MentorFeedback.find(filter).sort(sort).skip(skip).limit(limit).lean()
            ),
            MentorFeedback.countDocuments(filter),
        ]);

        const payload = rows.map((row) => formatFeedbackRow(row));
        const pages = Math.max(1, Math.ceil(total / limit));

        return ok(
            res,
            { feedback: payload },
            { pagination: { page, limit, total, pages } }
        );
    } catch (error) {
        if (error?.status) {
            return fail(res, error.status, error.code || 'INVALID_REQUEST', error.message);
        }
        logger.error('list mentor feedback failed: %s', error.message);
        return fail(res, 500, 'ADMIN_FEEDBACK_FAILED', 'Unable to load mentor feedback.');
    }
};

exports.getMentorFeedbackSummary = async (_req, res) => {
    try {
        const totalCountPromise = MentorFeedback.countDocuments();
        const flaggedCountPromise = MentorFeedback.countDocuments({ 'moderation.flagged': true });
        const lowRatingCountPromise = MentorFeedback.countDocuments({ rating: { $lte: LOW_RATING_THRESHOLD } });
        const distributionPromise = MentorFeedback.aggregate([
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 },
                },
            },
        ]);
        const recentLowPromise = populateMentorFeedback(
            MentorFeedback.find({ rating: { $lte: LOW_RATING_THRESHOLD } })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean()
        );

        const [total, flagged, low, distribution, recentLow] = await Promise.all([
            totalCountPromise,
            flaggedCountPromise,
            lowRatingCountPromise,
            distributionPromise,
            recentLowPromise,
        ]);

        const ratingBuckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach((entry) => {
            if (entry && entry._id >= 1 && entry._id <= 5) {
                ratingBuckets[entry._id] = entry.count;
            }
        });

        return ok(res, {
            summary: {
                totalCount: total,
                flaggedCount: flagged,
                lowRatingCount: low,
                lowRatingThreshold: LOW_RATING_THRESHOLD,
                ratingDistribution: ratingBuckets,
                recentLowRatings: recentLow.map((row) => formatFeedbackRow(row)),
            },
        });
    } catch (error) {
        logger.error('mentor feedback summary failed: %s', error.message);
        return fail(res, 500, 'ADMIN_FEEDBACK_SUMMARY_FAILED', 'Unable to load feedback summary.');
    }
};

exports.exportMentorFeedbackCsv = async (req, res) => {
    try {
        const filter = buildFilter(req.query || {});
        const sort = buildSort(req.query?.sort);
        const limit = boundNumber(req.query?.limit, 250, { min: 10, max: MAX_EXPORT_ROWS });

        const rows = await populateMentorFeedback(
            MentorFeedback.find(filter).sort(sort).limit(limit).lean()
        );

        const header = [
            'Submitted At',
            'Rating',
            'Mentor Name',
            'Mentor Email',
            'Mentee Name',
            'Mentee Email',
            'Session Subject',
            'Session Date',
            'Visibility',
            'Flagged',
            'Flag Reason',
            'Comment',
        ];

        const records = rows.map((row) => {
            const formatted = formatFeedbackRow(row);
            return [
                formatted.createdAt ? new Date(formatted.createdAt).toISOString() : '',
                formatted.rating,
                formatted.mentor?.name || '',
                formatted.mentor?.email || '',
                formatted.mentee?.name || '',
                formatted.mentee?.email || '',
                formatted.session?.subject || '',
                formatted.session?.date ? new Date(formatted.session.date).toISOString() : '',
                formatted.visibility,
                formatted.moderation?.flagged ? 'Yes' : 'No',
                formatted.moderation?.reason || '',
                formatted.sanitizedComment || formatted.comment || '',
            ];
        });

        const csv = [header, ...records]
            .map((cols) => cols.map((value) => csvEscape(value)).join(','))
            .join('\n');

        const filename = `mentor-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(csv);
    } catch (error) {
        if (error?.status) {
            return fail(res, error.status, error.code || 'INVALID_REQUEST', error.message);
        }
        logger.error('mentor feedback export failed: %s', error.message);
        return fail(res, 500, 'ADMIN_FEEDBACK_EXPORT_FAILED', 'Unable to export mentor feedback.');
    }
};

exports.updateMentorFeedbackModeration = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        if (!Types.ObjectId.isValid(feedbackId)) {
            return fail(res, 400, 'INVALID_FEEDBACK_ID', 'Invalid feedback id.');
        }

        const doc = await populateMentorFeedback(
            MentorFeedback.findById(feedbackId)
        );
        if (!doc) {
            return fail(res, 404, 'FEEDBACK_NOT_FOUND', 'Feedback entry not found.');
        }

        const flagged = typeof req.body?.flagged === 'boolean' ? req.body.flagged : doc.moderation?.flagged || false;
        const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : doc.moderation?.reason || '';

        if (flagged && !reason) {
            return fail(res, 400, 'FLAG_REASON_REQUIRED', 'Please provide a reason when flagging feedback.');
        }

        doc.moderation = doc.moderation || {};
        doc.moderation.flagged = flagged;
        doc.moderation.reason = flagged ? reason : null;
        doc.moderation.flaggedBy = req.user?.id || req.user?._id || null;
        doc.moderation.flaggedAt = new Date();

        await doc.save();

        await FeedbackAuditLog.create({
            feedbackId: doc._id,
            actorId: req.user?.id || req.user?._id,
            action: 'moderate',
            ip: req.ip,
            metadata: {
                flagged: doc.moderation.flagged,
                reason: doc.moderation.reason || null,
            },
        });

        const fresh = await populateMentorFeedback(
            MentorFeedback.findById(doc._id).lean()
        );

        return ok(res, { feedback: formatFeedbackRow(fresh) });
    } catch (error) {
        if (error?.status) {
            return fail(res, error.status, error.code || 'INVALID_REQUEST', error.message);
        }
        logger.error('update mentor feedback moderation failed: %s', error.message);
        return fail(res, 500, 'ADMIN_FEEDBACK_MODERATION_FAILED', 'Unable to update feedback moderation.');
    }
};
