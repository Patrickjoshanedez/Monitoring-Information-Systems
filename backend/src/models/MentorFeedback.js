const mongoose = require('mongoose');

const competencySchema = new mongoose.Schema(
    {
        skillKey: { type: String, required: true, trim: true, maxlength: 64 },
        level: { type: Number, required: true, min: 1, max: 5 },
        notes: { type: String, trim: true, maxlength: 500 },
    },
    { _id: false }
);

const mentorFeedbackSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            required: true,
            index: true,
        },
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        menteeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        competencies: {
            type: [competencySchema],
            default: [],
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        sanitizedComment: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        visibility: {
            type: String,
            enum: ['public', 'private'],
            default: 'public',
            index: true,
        },
        moderation: {
            type: new mongoose.Schema(
                {
                    flagged: { type: Boolean, default: false },
                    reason: { type: String, trim: true, maxlength: 500 },
                    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                    flaggedAt: { type: Date },
                },
                { _id: false }
            ),
            default: () => ({ flagged: false }),
        },
        editWindowClosesAt: {
            type: Date,
            required: true,
        },
        lastNotifiedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

mentorFeedbackSchema.index({ sessionId: 1, mentorId: 1 }, { unique: true });
mentorFeedbackSchema.index({ menteeId: 1, createdAt: -1 });
mentorFeedbackSchema.index({ mentorId: 1, createdAt: -1 });

module.exports = mongoose.model('MentorFeedback', mentorFeedbackSchema);
