const mongoose = require('mongoose');

const matchAuditSchema = new mongoose.Schema(
  {
    matchRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MatchRequest', required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, enum: ['mentor', 'mentee', 'admin', 'system'], required: true },
    action: {
      type: String,
      enum: ['suggested', 'mentor_accept', 'mentor_decline', 'mentee_accept', 'mentee_decline', 'expired', 'connected'],
      required: true,
    },
    reason: { type: String, trim: true },
    ipAddress: { type: String, trim: true },
    meta: {
      capacityBefore: { type: Number },
      capacityAfter: { type: Number },
    },
  },
  { timestamps: true }
);

matchAuditSchema.index({ matchRequestId: 1, createdAt: -1 });

module.exports = mongoose.model('MatchAudit', matchAuditSchema);
