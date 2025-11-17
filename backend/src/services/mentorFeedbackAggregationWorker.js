const mongoose = require('mongoose');
const MentorFeedback = require('../models/MentorFeedback');
const ProgressSnapshot = require('../models/ProgressSnapshot');
const { getFullName, getDisplayName } = require('../utils/person');
const logger = require('../utils/logger');

const DEFAULT_INTERVAL_MS =
    parseInt(process.env.MENTOR_FEEDBACK_AGGREGATION_INTERVAL_MS || '', 10) || 60 * 1000;
const BATCH_SIZE = parseInt(process.env.MENTOR_FEEDBACK_AGGREGATION_BATCH_SIZE || '', 10) || 20;
const MAX_RECENT_COMMENTS =
    parseInt(process.env.MENTOR_FEEDBACK_RECENT_COMMENTS || '', 10) || 5;
const TREND_MONTHS = parseInt(process.env.MENTOR_FEEDBACK_TREND_MONTHS || '', 10) || 6;

const pendingMenteeIds = new Set();
let timer = null;
let immediateTimer = null;
let running = false;

const normalizeObjectId = (value) => {
    if (!value) {
        return null;
    }

    if (value instanceof mongoose.Types.ObjectId) {
        return value;
    }

    if (mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }

    return null;
};

const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const buildEmptySnapshot = (menteeId) => ({
    menteeId,
    ratingAvg: 0,
    ratingCount: 0,
    monthlyTrend: [],
    recentComments: [],
    milestones: { reached: 0, lastUpdatedAt: null },
    lastUpdated: new Date(),
});

const computeSnapshotPayload = async (menteeId) => {
    const objectId = normalizeObjectId(menteeId);
    if (!objectId) {
        return null;
    }

    const baseMatch = {
        menteeId: objectId,
        'moderation.flagged': { $ne: true },
    };

    const stats = await MentorFeedback.aggregate([
        { $match: baseMatch },
        {
            $group: {
                _id: null,
                ratingAvg: { $avg: '$rating' },
                ratingCount: { $sum: 1 },
                positiveCount: {
                    $sum: {
                        $cond: [{ $gte: ['$rating', 4] }, 1, 0],
                    },
                },
                lastEntryAt: { $max: '$createdAt' },
            },
        },
    ]);

    const ratingAvg = stats.length && stats[0].ratingCount ? Number(stats[0].ratingAvg.toFixed(2)) : 0;
    const ratingCount = stats.length ? stats[0].ratingCount : 0;
    const milestones = {
        reached: stats.length ? stats[0].positiveCount : 0,
        lastUpdatedAt: stats.length ? stats[0].lastEntryAt : null,
    };

    const monthsBack = Math.max(1, TREND_MONTHS);
    const anchor = new Date();
    anchor.setUTCDate(1);
    anchor.setUTCHours(0, 0, 0, 0);
    anchor.setUTCMonth(anchor.getUTCMonth() - (monthsBack - 1));

    const trend = await MentorFeedback.aggregate([
        { $match: { ...baseMatch, createdAt: { $gte: anchor } } },
        {
            $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                avg: { $avg: '$rating' },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyTrendMap = new Map();
    trend.forEach((entry) => {
        const key = `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`;
        monthlyTrendMap.set(key, {
            month: key,
            avg: Number(entry.avg.toFixed(2)),
            count: entry.count,
        });
    });

    const monthlyTrend = [];
    for (let i = 0; i < monthsBack; i += 1) {
        const current = new Date(anchor);
        current.setUTCMonth(anchor.getUTCMonth() + i);
        const key = monthKey(current);
        if (monthlyTrendMap.has(key)) {
            monthlyTrend.push(monthlyTrendMap.get(key));
        } else {
            monthlyTrend.push({ month: key, avg: 0, count: 0 });
        }
    }

    const recentDocs = await MentorFeedback.find({
        menteeId: objectId,
        visibility: 'public',
        sanitizedComment: { $exists: true, $ne: null, $ne: '' },
        'moderation.flagged': { $ne: true },
    })
        .sort({ createdAt: -1 })
        .limit(MAX_RECENT_COMMENTS)
        .populate('mentorId', 'firstname lastname email profile.displayName')
        .lean();

    const recentComments = recentDocs.map((doc) => ({
        feedbackId: doc._id,
        mentorId: doc.mentorId?._id ? doc.mentorId._id : doc.mentorId,
        mentorName: (doc.mentorId ? getFullName(doc.mentorId) || getDisplayName(doc.mentorId) : 'Mentor')
            .slice(0, 120),
        rating: doc.rating,
        visibility: doc.visibility,
        comment: (doc.sanitizedComment || '').slice(0, 500),
        createdAt: doc.createdAt,
    }));

    return {
        menteeId: objectId,
        ratingAvg,
        ratingCount,
        monthlyTrend,
        recentComments,
        milestones,
        lastUpdated: new Date(),
    };
};

const rebuildSnapshotForMentee = async (menteeId) => {
    const payload = await computeSnapshotPayload(menteeId);
    if (!payload) {
        return null;
    }

    return ProgressSnapshot.findOneAndUpdate(
        { menteeId: payload.menteeId },
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

const flushQueue = async () => {
    if (running || !pendingMenteeIds.size) {
        return;
    }

    running = true;
    try {
        while (pendingMenteeIds.size) {
            const batch = Array.from(pendingMenteeIds).slice(0, BATCH_SIZE);
            batch.forEach((id) => pendingMenteeIds.delete(id));

            await Promise.all(
                batch.map((id) =>
                    rebuildSnapshotForMentee(id).catch((error) => {
                        logger.error('mentor feedback snapshot rebuild failed for %s: %s', id, error.message);
                    })
                )
            );
        }
    } finally {
        running = false;
    }
};

const scheduleImmediateFlush = () => {
    if (immediateTimer) {
        return;
    }

    immediateTimer = setTimeout(() => {
        immediateTimer = null;
        flushQueue();
    }, 2000);
};

const queueProgressSnapshotBuild = (menteeId) => {
    const normalized = normalizeObjectId(menteeId);
    if (!normalized) {
        return;
    }

    pendingMenteeIds.add(normalized.toString());
    scheduleImmediateFlush();
};

const getProgressSnapshot = async (menteeId, { rebuildIfMissing = false } = {}) => {
    const normalized = normalizeObjectId(menteeId);
    if (!normalized) {
        return buildEmptySnapshot(null);
    }

    let snapshot = await ProgressSnapshot.findOne({ menteeId: normalized }).lean();
    if (snapshot) {
        return snapshot;
    }

    if (!rebuildIfMissing) {
        return buildEmptySnapshot(normalized);
    }

    snapshot = await rebuildSnapshotForMentee(normalized);
    if (!snapshot) {
        return buildEmptySnapshot(normalized);
    }

    return snapshot.toObject ? snapshot.toObject() : snapshot;
};

const startMentorFeedbackAggregationWorker = () => {
    if (process.env.ENABLE_MENTOR_FEEDBACK_AGGREGATION === 'false') {
        logger.info('Mentor feedback aggregation worker disabled via env flag.');
        return;
    }

    if (timer) {
        return;
    }

    timer = setInterval(flushQueue, DEFAULT_INTERVAL_MS);
    logger.info('Mentor feedback aggregation worker started (%d ms interval).', DEFAULT_INTERVAL_MS);
};

const stopMentorFeedbackAggregationWorker = () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    if (immediateTimer) {
        clearTimeout(immediateTimer);
        immediateTimer = null;
    }
};

module.exports = {
    startMentorFeedbackAggregationWorker,
    stopMentorFeedbackAggregationWorker,
    queueProgressSnapshotBuild,
    rebuildSnapshotForMentee,
    getProgressSnapshot,
};
