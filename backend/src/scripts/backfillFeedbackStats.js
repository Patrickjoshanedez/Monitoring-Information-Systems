require('dotenv').config();
const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

const hasFlag = (flag) => process.argv.includes(`--${flag}`);
const getArg = (key, fallback) => {
    const prefix = `--${key}=`;
    const raw = process.argv.find((arg) => arg.startsWith(prefix));
    return raw ? raw.slice(prefix.length) : fallback;
};

const dryRun = hasFlag('dry-run');
const verbose = hasFlag('verbose');
const chunkSize = Number(getArg('chunk', '500')) || 500;

const ZERO_STATS = {
    'feedbackStats.totalReviews': 0,
    'feedbackStats.totalScore': 0,
    'feedbackStats.averageRating': 0,
    'feedbackStats.lastReviewAt': null,
    ratingAvg: 0,
    ratingCount: 0,
};

const formatNumber = (value) => (Number.isFinite(value) ? Number(value.toFixed(3)) : 0);

const run = async () => {
    if (!process.env.MONGODB_URI) {
        console.error('Missing MONGODB_URI in environment');
        process.exit(1);
    }

    const connection = await mongoose.connect(process.env.MONGODB_URI);

    try {
        const aggregates = await Feedback.aggregate([
            {
                $group: {
                    _id: '$mentorId',
                    totalReviews: { $sum: 1 },
                    totalScore: { $sum: '$rating' },
                    lastReviewAt: { $max: '$submittedAt' },
                },
            },
        ]);

        if (aggregates.length === 0) {
            console.info('No feedback documents found; resetting mentor stats to zero.');
        } else {
            console.info(`Aggregated feedback stats for ${aggregates.length} mentor(s).`);
        }

        const bulkOps = [];
        for (const aggregate of aggregates) {
            const average = aggregate.totalReviews ? aggregate.totalScore / aggregate.totalReviews : 0;
            const formattedAverage = formatNumber(average);

            bulkOps.push({
                updateOne: {
                    filter: { _id: aggregate._id },
                    update: {
                        $set: {
                            'feedbackStats.totalReviews': aggregate.totalReviews,
                            'feedbackStats.totalScore': aggregate.totalScore,
                            'feedbackStats.averageRating': formattedAverage,
                            'feedbackStats.lastReviewAt': aggregate.lastReviewAt || null,
                            ratingAvg: formattedAverage,
                            ratingCount: aggregate.totalReviews,
                        },
                    },
                },
            });
        }

        const mentorIdsWithFeedback = aggregates.map((aggregate) => aggregate._id);
        bulkOps.push({
            updateMany: {
                filter: {
                    role: 'mentor',
                    _id: { $nin: mentorIdsWithFeedback },
                },
                update: {
                    $set: ZERO_STATS,
                },
            },
        });

        if (dryRun) {
            console.info(`[DRY RUN] Prepared ${bulkOps.length} bulk operation(s) but did not persist changes.`);
            if (verbose) {
                console.info(JSON.stringify(bulkOps, null, 2));
            }
            await connection.disconnect();
            process.exit(0);
        }

        let processed = 0;
        while (processed < bulkOps.length) {
            const slice = bulkOps.slice(processed, processed + chunkSize);
            const result = await User.bulkWrite(slice, { ordered: false });
            processed += slice.length;
            console.info(`Applied ${slice.length} bulk operation(s); matched ${result.matchedCount}, modified ${result.modifiedCount}.`);
        }

        console.info('Mentor feedback stats backfill complete.');
        await connection.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Backfill failed:', error);
        await connection.disconnect();
        process.exit(1);
    }
};

run();
