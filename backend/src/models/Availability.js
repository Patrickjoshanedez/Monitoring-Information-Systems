const mongoose = require('mongoose');

const TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/;

const recurringRuleSchema = new mongoose.Schema(
    {
        dayOfWeek: { type: Number, min: 0, max: 6, required: true },
        startTime: { type: String, required: true, match: TIME_REGEX },
        endTime: { type: String, required: true, match: TIME_REGEX },
        timezone: { type: String, default: 'UTC', trim: true },
    },
    { _id: false }
);

const oneOffSlotSchema = new mongoose.Schema(
    {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        timezone: { type: String, default: 'UTC', trim: true },
    },
    { _id: false }
);

const availabilitySchema = new mongoose.Schema(
    {
        mentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['recurring', 'oneoff'],
            required: true,
        },
        timezone: { type: String, default: 'UTC', trim: true },
        recurring: {
            type: [recurringRuleSchema],
            default: undefined,
        },
        oneOff: {
            type: [oneOffSlotSchema],
            default: undefined,
        },
        capacity: { type: Number, min: 1, max: 50, default: 1 },
        note: { type: String, trim: true, maxlength: 500 },
        active: { type: Boolean, default: true },
        metadata: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

availabilitySchema.index({ mentor: 1, active: 1 });
availabilitySchema.index({ mentor: 1, updatedAt: -1 });

availabilitySchema.pre('validate', function validateAvailability(next) {
    if (this.type === 'recurring' && (!Array.isArray(this.recurring) || !this.recurring.length)) {
        this.invalidate('recurring', 'Recurring slots are required for recurring availability entries.');
    }

    if (this.type === 'oneoff' && (!Array.isArray(this.oneOff) || !this.oneOff.length)) {
        this.invalidate('oneOff', 'One-off slots are required for one-off availability entries.');
    }

    if (Array.isArray(this.recurring)) {
        this.recurring.forEach((rule, idx) => {
            if (!TIME_REGEX.test(rule.startTime) || !TIME_REGEX.test(rule.endTime)) {
                this.invalidate(`recurring.${idx}`, 'Recurring slot times must be HH:MM format.');
            }
            if (rule.startTime === rule.endTime) {
                this.invalidate(`recurring.${idx}`, 'Recurring slot endTime must be later than startTime.');
            }
        });
    }

    if (Array.isArray(this.oneOff)) {
        this.oneOff.forEach((slot, idx) => {
            if (slot.end <= slot.start) {
                this.invalidate(`oneOff.${idx}`, 'One-off slot end time must be later than start time.');
            }
        });
    }

    next();
});

module.exports = mongoose.model('Availability', availabilitySchema);
