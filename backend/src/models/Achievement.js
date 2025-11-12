const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true, index: true }, // e.g., FIRST_SESSION, GOAL_COMPLETED
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '🏅' }, // simple emoji or icon name
    earnedAt: { type: Date, default: Date.now },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

AchievementSchema.index({ user: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', AchievementSchema);
