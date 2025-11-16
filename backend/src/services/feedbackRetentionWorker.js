const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const logger = require('../utils/logger');
const { FEEDBACK_RETENTION_DAYS } = require('../config/feedback');

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_INTERVAL_MS = parseInt(process.env.FEEDBACK_RETENTION_WORKER_INTERVAL_MS || '', 10) || 6 * 60 * 60 * 1000;
const BATCH_SIZE = parseInt(process.env.FEEDBACK_RETENTION_BATCH_SIZE || '', 10) || 500;

const ZERO_STATS = {
    ratingCount: 0,
    ratingAvg: 0,
    'feedbackStats.totalReviews': 0,
    'feedbackStats.totalScore': 0,
    'feedbackStats.averageRating': 0,
    'feedbackStats.lastReviewAt': null,
};

let timer = null;
let running = false;

const toObjectIdSet = (docs) => {
    const ids = new Set();
    docs.forEach((doc) => {
        if (doc.mentorId) {
            ids.add(doc.mentorId.toString());
        }
    });
    return Array.from(ids).map((id) => new mongoose.Types.ObjectId(id));
};

const applyMentorStats = async (mentorIds) => {
    if (!mentorIds.length) {
        return;
    }

    const aggregates = await Feedback.aggregate([
        { $match: { mentorId: { $in: mentorIds } } },
        {
            $group: {
                _id: '$mentorId',
                totalReviews: { $sum: 1 },
                totalScore: { $sum: '$rating' },
                lastReviewAt: { $max: '$submittedAt' },
            },
        },
    ]);

    const bulkOps = [];
    const touchedIds = mentorIds.map((id) => id.toString());

    aggregates.forEach((aggregate) => {
        const average = aggregate.totalReviews ? aggregate.totalScore / aggregate.totalReviews : 0;
        const roundedAverage = Number(average.toFixed(3));

        bulkOps.push({
            updateOne: {
                filter: { _id: aggregate._id },
                update: {
                    $set: {
                        ratingCount: aggregate.totalReviews,
                        ratingAvg: roundedAverage,
                        'feedbackStats.totalReviews': aggregate.totalReviews,
                        'feedbackStats.totalScore': aggregate.totalScore,
                        'feedbackStats.averageRating': roundedAverage,
                        'feedbackStats.lastReviewAt': aggregate.lastReviewAt || null,
                    },
                },
            },
        });
    });

    const aggregatedIds = aggregates.map((aggregate) => aggregate._id.toString());
    touchedIds
        .filter((id) => !aggregatedIds.includes(id))
        .forEach((id) => {
            bulkOps.push({
                updateOne: {
                    filter: { _id: new mongoose.Types.ObjectId(id) },
                    update: { $set: ZERO_STATS },
                },
            });
        });

    if (bulkOps.length) {
        await User.bulkWrite(bulkOps, { ordered: false });
    }
};

const cleanExpiredFeedback = async () => {
    if (running) {
        return;
    }

    running = true;
    try {
        const retentionDays = Math.max(1, FEEDBACK_RETENTION_DAYS || 365);
        const cutoff = new Date(Date.now() - retentionDays * DAY_MS);
        let totalRemoved = 0;

        while (true) {
            const expired = await Feedback.find({
                createdAt: { $lt: cutoff },
                flagged: { $ne: true },
            })
                .select('_id mentorId rating createdAt')
                .limit(BATCH_SIZE)
                .lean();

            if (!expired.length) {
                break;
            }

            const ids = expired.map((doc) => doc._id);
            const mentorIds = toObjectIdSet(expired);
            await Feedback.deleteMany({ _id: { $in: ids } });
            totalRemoved += expired.length;
            await applyMentorStats(mentorIds);
        }

        if (totalRemoved) {
            logger.info('Feedback retention worker removed %d expired feedback document(s).', totalRemoved);
        } else {
            logger.info('Feedback retention worker found no expired feedback to clear.');
        }
    } catch (error) {
        logger.error('Feedback retention worker failed:', error);
    } finally {
        running = false;
    }
};

const startFeedbackRetentionWorker = () => {
    if (process.env.ENABLE_FEEDBACK_RETENTION_WORKER === 'false') {
        logger.info('Feedback retention worker disabled via env flag.');
        return;
    }

    if (timer) {
        return;
    }

    cleanExpiredFeedback();
    timer = setInterval(cleanExpiredFeedback, DEFAULT_INTERVAL_MS);
};

const stopFeedbackRetentionWorker = () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
};

module.exports = {
    startFeedbackRetentionWorker,
    stopFeedbackRetentionWorker,
    cleanExpiredFeedback,
};
