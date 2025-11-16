const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        resourceType: {
            type: String,
            required: true,
            trim: true,
            maxlength: 60,
        },
        resourceId: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        metadata: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);