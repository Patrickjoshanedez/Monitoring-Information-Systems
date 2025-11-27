const mongoose = require('mongoose');

const adminUserActionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['approve', 'reject', 'deactivate', 'reactivate', 'delete'],
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

adminUserActionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminUserAction', adminUserActionSchema);
