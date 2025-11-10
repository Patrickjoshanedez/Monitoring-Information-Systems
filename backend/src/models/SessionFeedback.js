const mongoose = require('mongoose');

const sessionFeedbackSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 2000 },
    submittedAt: { type: Date, default: Date.now },
    flagReason: { type: String, trim: true, maxlength: 1000 },
    flagged: { type: Boolean, default: false },
    anonymizedCode: { type: String, required: true },
  },
  { timestamps: true }
);

sessionFeedbackSchema.index({ session: 1 }, { unique: true });
sessionFeedbackSchema.index({ mentor: 1, submittedAt: -1 });
sessionFeedbackSchema.index({ mentor: 1, rating: -1 });
sessionFeedbackSchema.index({ flagged: 1, createdAt: -1 });

module.exports = mongoose.model('SessionFeedback', sessionFeedbackSchema);
