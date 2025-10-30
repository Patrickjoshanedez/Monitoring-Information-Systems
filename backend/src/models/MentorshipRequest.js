const mongoose = require('mongoose');

const mentorshipRequestSchema = new mongoose.Schema(
  {
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    preferredSlot: { type: String, trim: true },
    goals: { type: String, trim: true },
    notes: { type: String, trim: true },
    sessionSuggestion: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'withdrawn'],
      default: 'pending'
    },
    mentorResponseAt: { type: Date },
    menteeWithdrawnAt: { type: Date },
    declineReason: { type: String, trim: true }
  },
  { timestamps: true }
);

mentorshipRequestSchema.index({ mentee: 1, mentor: 1, status: 1 });
mentorshipRequestSchema.index({ mentor: 1, status: 1, createdAt: -1 });
mentorshipRequestSchema.index({ mentee: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
