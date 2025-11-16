const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['invited', 'confirmed', 'declined', 'removed'],
      default: 'invited',
    },
    invitedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60, min: 0 },
    room: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 1, min: 1, max: 500 },
    isGroup: { type: Boolean, default: false },
    participants: { type: [participantSchema], default: [] },
    chatThread: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread' },
    attended: { type: Boolean, default: false },
    tasksCompleted: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
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
// Helpful for feeds and exports
sessionSchema.index({ mentee: 1, createdAt: -1 });
sessionSchema.index({ mentor: 1, createdAt: -1 });
sessionSchema.index({ 'participants.user': 1, date: -1 });

module.exports = mongoose.model('Session', sessionSchema);
