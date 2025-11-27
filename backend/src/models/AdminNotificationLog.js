const mongoose = require('mongoose');

const adminNotificationLogSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        message: { type: String, required: true, trim: true, maxlength: 2000 },
        type: { type: String, required: true, trim: true, maxlength: 80 },
        audienceScope: { type: String, enum: ['all', 'roles', 'custom'], required: true },
        audienceFilters: { type: Object, default: {} },
        recipientCount: { type: Number, default: 0 },
        channels: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: false },
        },
        metadata: { type: Object, default: {} },
        announcement: { type: mongoose.Schema.Types.ObjectId, ref: 'Announcement' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

adminNotificationLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminNotificationLog', adminNotificationLogSchema);
