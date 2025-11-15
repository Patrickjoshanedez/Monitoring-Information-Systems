const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    category: { type: String, trim: true, default: 'General' },
    isFeatured: { type: Boolean, default: false },
    audience: { type: String, enum: ['all', 'mentees', 'mentors'], default: 'all' },
    publishedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

announcementSchema.index({ publishedAt: -1 });
announcementSchema.index({ audience: 1, publishedAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
