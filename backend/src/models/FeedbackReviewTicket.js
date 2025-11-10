const mongoose = require('mongoose');

const feedbackReviewTicketSchema = new mongoose.Schema(
  {
    feedback: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionFeedback', required: true },
    status: { type: String, enum: ['open', 'in_review', 'resolved'], default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, trim: true, maxlength: 1000 },
    adminNotes: { type: String, trim: true, maxlength: 2000 },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

feedbackReviewTicketSchema.index({ status: 1, createdAt: -1 });
feedbackReviewTicketSchema.index({ feedback: 1 }, { unique: true });

module.exports = mongoose.model('FeedbackReviewTicket', feedbackReviewTicketSchema);
