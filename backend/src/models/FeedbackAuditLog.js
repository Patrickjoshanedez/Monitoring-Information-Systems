const mongoose = require('mongoose');

const feedbackAuditLogSchema = new mongoose.Schema(
    {
        feedbackId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MentorFeedback',
            required: true,
            index: true,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        action: {
            type: String,
            enum: ['create', 'update', 'view'],
            required: true,
        },
        ip: {
            type: String,
            trim: true,
            maxlength: 64,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { versionKey: false }
);

feedbackAuditLogSchema.index({ feedbackId: 1, createdAt: -1 });
feedbackAuditLogSchema.index({ actorId: 1, createdAt: -1 });

module.exports = mongoose.model('FeedbackAuditLog', feedbackAuditLogSchema);
