const mongoose = require('mongoose');

const MATCH_STATUSES = [
  'suggested',
  'mentor_accepted',
  'mentor_declined',
  'mentee_accepted',
  'mentee_declined',
  'rejected',
  'connected',
  'expired',
];

const matchRequestSchema = new mongoose.Schema(
  {
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: MATCH_STATUSES, default: 'suggested' },
    expiresAt: { type: Date },
    notes: { type: String, trim: true },
    priority: { type: Number, default: 0, min: 0, max: 100 },
    scoreBreakdown: {
      expertise: { type: Number, default: 0 },
      availability: { type: Number, default: 0 },
      interactions: { type: Number, default: 0 },
      priority: { type: Number, default: 0 },
    },
    metadata: {
      availabilityOverlap: { type: Number, default: 0 },
      expertiseOverlap: { type: Number, default: 0 },
      previousInteractions: { type: Number, default: 0 },
      reason: { type: String, trim: true },
    },
    menteeSnapshot: {
      name: { type: String, trim: true },
      program: { type: String, trim: true },
      skills: [{ type: String, trim: true }],
      expertiseAreas: [{ type: String, trim: true }],
      interests: [{ type: String, trim: true }],
      availabilitySlots: [
        {
          day: { type: String },
          start: { type: String },
          end: { type: String },
        },
      ],
    },
    mentorSnapshot: {
      name: { type: String, trim: true },
      expertiseAreas: [{ type: String, trim: true }],
      capacity: { type: Number },
    },
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true }
);

matchRequestSchema.index({ mentorId: 1, status: 1, createdAt: -1 });
matchRequestSchema.index({ mentorId: 1, applicantId: 1 }, { unique: true });
matchRequestSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('MatchRequest', matchRequestSchema);
module.exports.MATCH_STATUSES = MATCH_STATUSES;
