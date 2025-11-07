const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    data: { type: Object, default: {} },
    readAt: { type: Date }
  },
  { timestamps: true }
);

// Existing indexes
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

// Faster unread queries & counts (partial index)
notificationSchema.index({ user: 1, createdAt: -1 }, { partialFilterExpression: { readAt: { $exists: false } }, name: 'unread_by_user_created_desc' });

// Optional future filtering by type
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
