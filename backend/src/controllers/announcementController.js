const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationService');
const { fail, ok } = require('../utils/responses');

const { Types } = mongoose;
const ALLOWED_AUDIENCES = new Set(['all', 'mentors', 'mentees']);

const formatAnnouncement = (doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  body: doc.body,
  summary: doc.summary,
  category: doc.category,
  isFeatured: !!doc.isFeatured,
  audience: doc.audience,
  publishedAt: doc.publishedAt,
  createdAt: doc.createdAt,
});

const queueAnnouncementBroadcast = (announcement) => {
  setImmediate(async () => {
    try {
      const filter = { applicationStatus: 'approved' };
      if (announcement.audience === 'mentees') {
        filter.role = 'mentee';
      } else if (announcement.audience === 'mentors') {
        filter.role = 'mentor';
      }

      const recipients = await User.find(filter).select('_id').lean();
      const preview = announcement.summary ||
        (announcement.body.length > 200 ? `${announcement.body.slice(0, 197)}…` : announcement.body);

      const batches = [];
      const batchSize = 25;
      for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await Promise.allSettled(
          batch.map((recipient) =>
            sendNotification({
              userId: recipient._id,
              type: 'ANNOUNCEMENT_NEW',
              title: announcement.title,
              message: preview,
              data: {
                announcementId: announcement._id,
                category: announcement.category,
                publishedAt: announcement.publishedAt,
              },
            })
          )
        );
      }
    } catch (error) {
      console.error('Announcement broadcast failed:', error);
    }
  });
};

exports.listAnnouncements = async (req, res) => {
  try {
    const allowedAudiences = ['all'];
    if (req.user?.role === 'admin') {
      allowedAudiences.push('mentors', 'mentees');
    }
    if (req.user?.role === 'mentee') allowedAudiences.push('mentees');
    if (req.user?.role === 'mentor') allowedAudiences.push('mentors');

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const announcements = await Announcement.find({
      audience: { $in: allowedAudiences },
      publishedAt: { $lte: new Date() },
    })
      .sort({ publishedAt: -1 })
      .limit(limit);

    return ok(
      res,
      { announcements: announcements.map(formatAnnouncement) },
      { total: announcements.length }
    );
  } catch (error) {
    console.error('listAnnouncements error:', error);
    return fail(res, 500, 'ANNOUNCEMENTS_FETCH_FAILED', 'Unable to load announcements.');
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return fail(res, 403, 'FORBIDDEN', 'Only admins can publish announcements.');
    }

    const { title, body, summary, category, isFeatured, audience, publishedAt } = req.body || {};

    if (!title || !body) {
      return fail(res, 400, 'INVALID_ANNOUNCEMENT', 'Title and body are required.');
    }

    const sanitizedAudience = ['all', 'mentors', 'mentees'].includes(audience) ? audience : 'all';
    const doc = await Announcement.create({
      title: String(title).trim(),
      body: String(body).trim(),
      summary: summary ? String(summary).trim() : undefined,
      category: category ? String(category).trim() : undefined,
      isFeatured: !!isFeatured,
      audience: sanitizedAudience,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      createdBy: req.user.id,
    });

    queueAnnouncementBroadcast(doc);

    return ok(res, { announcement: formatAnnouncement(doc) });
  } catch (error) {
    console.error('createAnnouncement error:', error);
    return fail(res, 500, 'ANNOUNCEMENT_CREATE_FAILED', 'Unable to create announcement.');
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return fail(res, 403, 'FORBIDDEN', 'Only admins can update announcements.');
    }

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'INVALID_ANNOUNCEMENT_ID', 'Announcement id is invalid.');
    }

    const payload = req.body || {};
    const updates = {};

    if (payload.title !== undefined) {
      const title = typeof payload.title === 'string' ? payload.title.trim() : '';
      if (!title) {
        return fail(res, 400, 'INVALID_ANNOUNCEMENT', 'Title cannot be empty.');
      }
      updates.title = title;
    }

    if (payload.body !== undefined) {
      const body = typeof payload.body === 'string' ? payload.body.trim() : '';
      if (!body) {
        return fail(res, 400, 'INVALID_ANNOUNCEMENT', 'Body cannot be empty.');
      }
      updates.body = body;
    }

    if (payload.summary !== undefined) {
      updates.summary = typeof payload.summary === 'string' ? payload.summary.trim() : undefined;
    }

    if (payload.category !== undefined) {
      updates.category = typeof payload.category === 'string' ? payload.category.trim() : undefined;
    }

    if (payload.isFeatured !== undefined) {
      updates.isFeatured = !!payload.isFeatured;
    }

    if (payload.audience !== undefined) {
      const normalizedAudience = typeof payload.audience === 'string' ? payload.audience.trim() : '';
      if (!ALLOWED_AUDIENCES.has(normalizedAudience)) {
        return fail(res, 400, 'INVALID_AUDIENCE', 'Audience must be all, mentors, or mentees.');
      }
      updates.audience = normalizedAudience;
    }

    if (payload.publishedAt !== undefined) {
      const publishedAt = new Date(payload.publishedAt);
      if (Number.isNaN(publishedAt.getTime())) {
        return fail(res, 400, 'INVALID_PUBLISHED_AT', 'Published date is invalid.');
      }
      updates.publishedAt = publishedAt;
    }

    if (!Object.keys(updates).length) {
      return fail(res, 400, 'NO_UPDATES', 'Provide at least one field to update.');
    }

    const announcement = await Announcement.findByIdAndUpdate(id, updates, { new: true });
    if (!announcement) {
      return fail(res, 404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found.');
    }

    return ok(res, { announcement: formatAnnouncement(announcement) });
  } catch (error) {
    console.error('updateAnnouncement error:', error);
    return fail(res, 500, 'ANNOUNCEMENT_UPDATE_FAILED', 'Unable to update announcement.');
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return fail(res, 403, 'FORBIDDEN', 'Only admins can delete announcements.');
    }

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return fail(res, 400, 'INVALID_ANNOUNCEMENT_ID', 'Announcement id is invalid.');
    }

    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) {
      return fail(res, 404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found.');
    }

    return ok(res, { message: 'Announcement deleted.' });
  } catch (error) {
    console.error('deleteAnnouncement error:', error);
    return fail(res, 500, 'ANNOUNCEMENT_DELETE_FAILED', 'Unable to delete announcement.');
  }
};
