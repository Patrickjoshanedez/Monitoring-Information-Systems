const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60, min: 0 },
    attended: { type: Boolean, default: true },
    tasksCompleted: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
    remindersSent: [
      {
        offsetMinutes: { type: Number, required: true, min: 1 },
        sentAt: { type: Date, default: Date.now },
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

module.exports = mongoose.model('Session', sessionSchema);
