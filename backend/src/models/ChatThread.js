const mongoose = require('mongoose');

const participantStateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    unreadCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const chatThreadSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['direct', 'session'], default: 'direct' },
    title: { type: String, trim: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    participantStates: { type: [participantStateSchema], default: [] },
    lastMessage: { type: String, trim: true, maxlength: 4000 },
    lastSender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessageAt: { type: Date },
    mentorUnreadCount: { type: Number, default: 0, min: 0 },
    menteeUnreadCount: { type: Number, default: 0, min: 0 },
    archivedFor: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true }
);

chatThreadSchema.index(
  { mentor: 1, mentee: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: 'direct' },
  }
);
chatThreadSchema.index(
  { session: 1 },
  {
    unique: true,
    partialFilterExpression: { session: { $type: 'objectId' } },
  }
);
chatThreadSchema.index({ participants: 1, updatedAt: -1 });
chatThreadSchema.index({ mentor: 1, updatedAt: -1 });
chatThreadSchema.index({ mentee: 1, updatedAt: -1 });
chatThreadSchema.index({ archivedFor: 1 });

chatThreadSchema.pre('save', function syncParticipantStates(next) {
  const rawIds = Array.isArray(this.participants) ? this.participants : [];
  const parsedIds = rawIds
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') return entry;
      if (entry._id) return entry._id.toString();
      if (entry.toString) return entry.toString();
      return null;
    })
    .filter(Boolean);

  if (this.type === 'direct' && this.mentor && this.mentee) {
    parsedIds.push(this.mentor.toString(), this.mentee.toString());
  }

  const uniqueIds = [...new Set(parsedIds)].filter((id) => mongoose.Types.ObjectId.isValid(id));
  this.participants = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));

  const statesById = new Map();
  (this.participantStates || []).forEach((state) => {
    const key = state.user?.toString();
    if (key) {
      statesById.set(key, state.unreadCount || 0);
    }
  });

  this.participantStates = uniqueIds.map((id) => ({
    user: new mongoose.Types.ObjectId(id),
    unreadCount: statesById.get(id) || 0,
  }));

  next();
});

module.exports = mongoose.model('ChatThread', chatThreadSchema);
