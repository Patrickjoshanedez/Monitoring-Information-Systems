const mongoose = require('mongoose');

// Shared learning material uploaded by mentor and optionally linked to a session.
// Access rules: mentee can view if (same mentor) and either global or linked to a session they attended.
const materialSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional direct assignment
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' }, // optional association
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    originalName: { type: String, required: true, trim: true },
    storedName: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    mimeType: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    visibility: { type: String, enum: ['mentor-only', 'shared'], default: 'shared' },
  },
  { timestamps: true }
);

materialSchema.index({ mentor: 1, createdAt: -1 });
materialSchema.index({ mentee: 1, createdAt: -1 });
materialSchema.index({ session: 1, createdAt: -1 });
materialSchema.index({ mentor: 1, visibility: 1, createdAt: -1 });
materialSchema.index({ tags: 1 });

module.exports = mongoose.model('Material', materialSchema);