const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['invited', 'confirmed', 'declined', 'removed', 'pending'],
            default: 'invited',
        },
        invitedAt: { type: Date, default: Date.now },
        respondedAt: { type: Date },
    },
    { _id: false }
);

const attendanceSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['present', 'absent', 'late'], required: true },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        recordedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true, maxlength: 280 },
    },
    { _id: false }
);

const googleEventSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        eventId: { type: String, trim: true },
        calendarId: { type: String, trim: true },
        status: { type: String, trim: true },
        syncedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const STATUS_VALUES = ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'];

const sessionSchema = new mongoose.Schema(
    {
        mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
        mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        subject: { type: String, required: true, trim: true },
        date: { type: Date, required: true, alias: 'scheduledAt' },
        endDate: { type: Date },
        durationMinutes: { type: Number, default: 60, min: 0 },
        status: { type: String, enum: STATUS_VALUES, default: 'pending', index: true },
        statusMeta: {
            confirmedAt: { type: Date },
            rescheduledAt: { type: Date },
            cancelledAt: { type: Date },
            cancellationReason: { type: String, trim: true, maxlength: 500 },
            cancellationBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
        room: { type: String, required: false, trim: true },
        capacity: { type: Number, default: 1, min: 1, max: 500 },
        isGroup: { type: Boolean, default: false },
        availabilityRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Availability' },
        lockId: { type: String, trim: true },
        participants: { type: [participantSchema], default: [] },
        attendance: { type: [attendanceSchema], default: [] },
        chatThread: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread' },
        googleEvents: { type: [googleEventSchema], default: [] },
    attended: { type: Boolean, default: false },
    completedAt: { type: Date },
        tasksCompleted: { type: Number, default: 0, min: 0 },
        notes: { type: String, trim: true },
        calendarEvent: {
            provider: { type: String, enum: ['google'], default: null },
            externalId: { type: String, trim: true },
            calendarId: { type: String, trim: true },
            htmlLink: { type: String },
            hangoutLink: { type: String },
            status: { type: String, trim: true },
            updatedAt: { type: Date },
            lastSyncedAt: { type: Date },
            lastSyncError: {
                code: { type: String },
                message: { type: String },
                occurredAt: { type: Date },
            },
        },
        remindersSent: [
            {
                offsetMinutes: { type: Number, required: true, min: 1 },
                sentAt: { type: Date, default: Date.now },
                recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                channels: {
                    inApp: { type: Boolean, default: false },
                    email: { type: Boolean, default: false },
                },
            },
        ],
    },
    { timestamps: true }
);

sessionSchema.index({ mentee: 1, date: -1 });
sessionSchema.index({ mentor: 1, date: -1 });
sessionSchema.index({ mentee: 1, subject: 1 });
sessionSchema.index({ mentor: 1, status: 1, date: -1 });
sessionSchema.index({ availabilityRef: 1, date: 1 });
sessionSchema.index({ 'participants.user': 1, date: -1 });
// fast lookup for booking locks -> find sessions by lockId quickly
sessionSchema.index({ lockId: 1 });
// Helpful for feeds and exports
sessionSchema.index({ mentee: 1, createdAt: -1 });
sessionSchema.index({ mentor: 1, createdAt: -1 });

sessionSchema.pre('save', function deriveEndDate(next) {
    if (this.date && this.durationMinutes) {
        const durationMs = Math.max(15, this.durationMinutes) * 60000;
        this.endDate = new Date(this.date.getTime() + durationMs);
    }
    next();
});

// Statics: lean, projected fetch helpers for common queries to reduce memory and speed up controllers
sessionSchema.statics.findMentorSessionsLean = async function (mentorId, { status, limit = 50, startDate } = {}) {
    const q = { mentor: mentorId };
    if (status) q.status = status;
    if (startDate) q.date = { $gte: startDate };

    // Only fetch fields used in session lists; keep payload small
    const projection = {
        subject: 1,
        date: 1,
        endDate: 1,
        durationMinutes: 1,
        status: 1,
        mentee: 1,
        participants: 1,
        chatThread: 1,
        attended: 1,
        completedAt: 1,
        feedbackDue: 1,
        feedbackSubmitted: 1,
        tasksCompleted: 1,
        notes: 1,
    };

    return await this.find(q).select(projection).sort({ date: 1 }).limit(Math.min(500, limit)).lean();
};

sessionSchema.statics.findMenteeSessionsLean = async function (menteeId, { status, limit = 50, startDate } = {}) {
    const q = { $or: [{ mentee: menteeId }, { 'participants.user': menteeId }] };
    if (status) q.status = status;
    if (startDate) q.date = { $gte: startDate };

    const projection = {
        subject: 1,
        date: 1,
        durationMinutes: 1,
        status: 1,
        mentor: 1,
        participants: 1,
        chatThread: 1,
        attended: 1,
        completedAt: 1,
        tasksCompleted: 1,
        notes: 1,
    };

    return await this.find(q).select(projection).sort({ date: -1 }).limit(Math.min(500, limit)).lean();
};

module.exports = mongoose.model('Session', sessionSchema);

