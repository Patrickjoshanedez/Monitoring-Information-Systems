const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
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
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },
        text: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        sanitizedText: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        flagged: {
            type: Boolean,
            default: false,
        },
        flagReason: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        anonymizedCode: {
            type: String,
            trim: true,
            maxlength: 16,
        },
        windowClosesAt: {
            type: Date,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

feedbackSchema.index({ sessionId: 1, menteeId: 1 }, { unique: true });
feedbackSchema.index({ mentorId: 1, submittedAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);