const mongoose = require('mongoose');

const adminReviewTicketSchema = new mongoose.Schema(
    {
        feedbackId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Feedback',
            required: true,
        },
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            required: true,
        },
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reporterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reason: {
            type: String,
            trim: true,
            maxlength: 1000,
            required: true,
        },
        excerpt: {
            type: String,
            trim: true,
            maxlength: 500,
            required: true,
        },
        status: {
            type: String,
            enum: ['open', 'in_review', 'resolved'],
            default: 'open',
        },
        handledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        resolvedAt: {
            type: Date,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
    },
    { timestamps: true }
);

adminReviewTicketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AdminReviewTicket', adminReviewTicketSchema);