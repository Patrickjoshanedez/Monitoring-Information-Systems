const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    matchRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MatchRequest' },
    startedAt: { type: Date, default: () => new Date() },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active',
    },
    sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
    metadata: {
      goals: { type: String, trim: true },
      program: { type: String, trim: true },
      notes: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

mentorshipSchema.index({ mentorId: 1, status: 1 });
mentorshipSchema.index({ mentorId: 1, menteeId: 1 }, { unique: true });

module.exports = mongoose.model('Mentorship', mentorshipSchema);
