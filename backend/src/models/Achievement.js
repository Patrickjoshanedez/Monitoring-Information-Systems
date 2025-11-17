const mongoose = require('mongoose');

const ACHIEVEMENT_STATUS = ['locked', 'in_progress', 'unlocked'];

const progressSchema = new mongoose.Schema(
    {
        current: { type: Number, default: 0, min: 0 },
        target: { type: Number, default: 1, min: 1 },
        unit: { type: String, default: 'count', trim: true },
    },
    { _id: false }
);

const AchievementSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        code: { type: String, required: true, index: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        icon: { type: String, default: '🏅' },
        category: { type: String, default: 'journey', trim: true },
        level: { type: Number, default: 1, min: 1 },
        color: { type: String, default: '#f59e0b' },
        status: { type: String, enum: ACHIEVEMENT_STATUS, default: 'in_progress' },
        earnedAt: { type: Date },
        lastProgressAt: { type: Date },
        rewardPoints: { type: Number, default: 0, min: 0 },
        progress: progressSchema,
        meta: { type: Object, default: {} },
    },
    { timestamps: true }
);

AchievementSchema.index({ user: 1, code: 1 }, { unique: true });
AchievementSchema.index({ status: 1, earnedAt: -1 });

module.exports = mongoose.model('Achievement', AchievementSchema);
module.exports.ACHIEVEMENT_STATUS = ACHIEVEMENT_STATUS;
