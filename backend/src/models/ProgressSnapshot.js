const mongoose = require('mongoose');

const monthlyTrendSchema = new mongoose.Schema(
    {
        month: { type: String, required: true, trim: true, maxlength: 8 },
        avg: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
    },
    { _id: false }
);

const recentCommentSchema = new mongoose.Schema(
    {
        feedbackId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorFeedback', required: true },
        mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        mentorName: { type: String, trim: true, maxlength: 120 },
        rating: { type: Number, min: 1, max: 5, required: true },
        visibility: { type: String, enum: ['public', 'private'], default: 'public' },
        comment: { type: String, trim: true, maxlength: 500 },
        createdAt: { type: Date, required: true },
    },
    { _id: false }
);

const progressSnapshotSchema = new mongoose.Schema(
    {
        menteeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        ratingAvg: {
            type: Number,
            default: 0,
        },
        ratingCount: {
            type: Number,
            default: 0,
        },
        monthlyTrend: {
            type: [monthlyTrendSchema],
            default: [],
        },
        recentComments: {
            type: [recentCommentSchema],
            default: [],
        },
        milestones: {
            reached: { type: Number, default: 0 },
            lastUpdatedAt: { type: Date },
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ProgressSnapshot', progressSnapshotSchema);
