const mongoose = require('mongoose');

const bookingLockSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, index: true },
        mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        availability: { type: mongoose.Schema.Types.ObjectId, ref: 'Availability' },
        scheduledAt: { type: Date, required: true },
        durationMinutes: { type: Number, min: 15, max: 240, default: 60 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        sessionCandidate: {
            type: Object,
            default: {},
        },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

bookingLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
bookingLockSchema.index({ mentor: 1, scheduledAt: 1 });

module.exports = mongoose.model('BookingLock', bookingLockSchema);
