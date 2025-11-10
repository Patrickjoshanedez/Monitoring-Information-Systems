const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: { type: String, trim: true, maxlength: 4000 },
    lastSender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessageAt: { type: Date },
    mentorUnreadCount: { type: Number, default: 0, min: 0 },
    menteeUnreadCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

chatThreadSchema.index({ mentor: 1, mentee: 1 }, { unique: true });
chatThreadSchema.index({ mentor: 1, updatedAt: -1 });
chatThreadSchema.index({ mentee: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatThread', chatThreadSchema);
