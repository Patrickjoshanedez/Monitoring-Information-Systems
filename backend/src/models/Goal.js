const mongoose = require('mongoose');

// Learning goal with milestones and progress tracking.
const goalSchema = new mongoose.Schema(
  {
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional association
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    targetDate: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
    milestones: [
      {
        label: { type: String, required: true, trim: true },
        achieved: { type: Boolean, default: false },
        achievedAt: { type: Date },
      },
    ],
    progressHistory: [
      {
        value: { type: Number, required: true, min: 0, max: 100 }, // percentage snapshot
        note: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

goalSchema.index({ mentee: 1, status: 1, createdAt: -1 });
goalSchema.index({ mentor: 1, status: 1, createdAt: -1 });
goalSchema.index({ targetDate: 1 });

module.exports = mongoose.model('Goal', goalSchema);