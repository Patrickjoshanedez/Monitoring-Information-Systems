const mongoose = require('mongoose');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const AdminNotificationLog = require('../models/AdminNotificationLog');
const { sendNotification } = require('../utils/notificationService');
const { ok, fail } = require('../utils/responses');

const { Types } = mongoose;
const VALID_ROLES = new Set(['mentee', 'mentor', 'admin']);
const DEFAULT_TYPE = 'ADMIN_ANNOUNCEMENT';
const MAX_RECIPIENTS = 10000;
const ANNOUNCEMENT_DEFAULT_CATEGORY = 'General';

const normalizeArray = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

const resolveAudience = async ({ scope, roles, userIds, emails }) => {
    const query = { accountStatus: { $ne: 'deactivated' } };
    if (scope === 'all') {
        return User.find(query).select('_id role email notificationSettings profile firstname lastname');
    }

    if (scope === 'roles') {
        const validRoles = normalizeArray(roles).filter((role) => VALID_ROLES.has(role));
        if (!validRoles.length) {
            throw new Error('Select at least one role for role-targeted notifications.');
        }
        query.role = { $in: validRoles };
        return User.find(query).select('_id role email notificationSettings profile firstname lastname');
    }

    if (scope === 'custom') {
        const ids = normalizeArray(userIds).filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
        const normalizedEmails = normalizeArray(emails);
        if (!ids.length && !normalizedEmails.length) {
            throw new Error('Provide at least one user id or email for custom notifications.');
        }
        query.$or = [];
        if (ids.length) {
            query.$or.push({ _id: { $in: ids } });
        }
        if (normalizedEmails.length) {
            query.$or.push({ email: { $in: normalizedEmails.map((email) => email.toLowerCase()) } });
        }
        return User.find(query).select('_id role email notificationSettings profile firstname lastname');
    }

    throw new Error('Unsupported audience scope.');
};

const resolveAnnouncementAudience = (scope, roles) => {
    if (scope === 'all') {
        return 'all';
    }
    if (scope === 'roles') {
        const normalizedRoles = normalizeArray(roles).filter((role) => role === 'mentor' || role === 'mentee');
        if (!normalizedRoles.length) {
            return null;
        }
        const unique = new Set(normalizedRoles);
        if (unique.has('mentor') && unique.has('mentee')) {
            return 'all';
        }
        if (unique.has('mentee')) {
            return 'mentees';
        }
        if (unique.has('mentor')) {
            return 'mentors';
        }
    }
    return null;
};

const createAnnouncementDoc = async ({ title, message, publishOptions, audience, createdBy }) => {
    const sanitizedSummary = publishOptions.summary ? String(publishOptions.summary).trim() : undefined;
    const sanitizedBody = publishOptions.body ? String(publishOptions.body).trim() : message;
    const sanitizedCategory = publishOptions.category ? String(publishOptions.category).trim() : ANNOUNCEMENT_DEFAULT_CATEGORY;
    const publishedAt = publishOptions.publishedAt ? new Date(publishOptions.publishedAt) : new Date();

    const doc = await Announcement.create({
        title: publishOptions.title ? String(publishOptions.title).trim() : title,
        body: sanitizedBody,
        summary: sanitizedSummary,
        category: sanitizedCategory || ANNOUNCEMENT_DEFAULT_CATEGORY,
        isFeatured: !!publishOptions.isFeatured,
        audience,
        publishedAt,
        createdBy,
    });

    return doc;
};

const dispatchNotifications = async ({ users, type, title, message, data, channels }) => {
    const operations = users.map((user) =>
        sendNotification({
            userId: user._id,
            type,
            title,
            message,
            data,
            channelsOverride: channels,
        })
    );

    const results = await Promise.allSettled(operations);
    const delivered = results.filter((result) => result.status === 'fulfilled' && result.value?.delivered).length;
    const failures = results.length - delivered;

    return { delivered, failures };
};

exports.sendAdminNotification = async (req, res) => {
    try {
        const {
            title,
            message,
            type = DEFAULT_TYPE,
            data = {},
            audience = {},
            channels = {},
            publishOptions = {},
        } = req.body || {};
        const trimmedTitle = typeof title === 'string' ? title.trim() : '';
        const trimmedMessage = typeof message === 'string' ? message.trim() : '';

        if (!trimmedTitle || trimmedTitle.length < 3) {
            return fail(res, 400, 'INVALID_TITLE', 'Notification title must be at least 3 characters.');
        }
        if (!trimmedMessage || trimmedMessage.length < 5) {
            return fail(res, 400, 'INVALID_MESSAGE', 'Notification message must be at least 5 characters.');
        }

        const scope = audience.scope || 'all';
        const users = await resolveAudience({
            scope,
            roles: audience.roles,
            userIds: audience.userIds,
            emails: audience.emails,
        });

        if (!users.length) {
            return fail(res, 400, 'NO_RECIPIENTS', 'No users matched the selected audience.');
        }
        if (users.length > MAX_RECIPIENTS) {
            return fail(
                res,
                400,
                'AUDIENCE_TOO_LARGE',
                `Audience too large (${users.length}). Narrow down recipients before sending.`
            );
        }

        const payloadData = data && typeof data === 'object' ? data : {};
        const deliveryChannels = {
            inApp: channels.inApp !== undefined ? !!channels.inApp : true,
            email: channels.email !== undefined ? !!channels.email : false,
        };

        const { delivered, failures } = await dispatchNotifications({
            users,
            type,
            title: trimmedTitle,
            message: trimmedMessage,
            data: payloadData,
            channels: deliveryChannels,
        });

        let announcementDoc = null;
        if (publishOptions?.publishToAnnouncements) {
            const announcementAudience = resolveAnnouncementAudience(scope, audience.roles);
            if (!announcementAudience) {
                return fail(
                    res,
                    400,
                    'INVALID_ANNOUNCEMENT_AUDIENCE',
                    'Announcements feed publishing is limited to mentor and mentee audiences.'
                );
            }
            announcementDoc = await createAnnouncementDoc({
                title: trimmedTitle,
                message: trimmedMessage,
                publishOptions,
                audience: announcementAudience,
                createdBy: req.user._id,
            });
        }

        await AdminNotificationLog.create({
            title: trimmedTitle,
            message: trimmedMessage,
            type,
            audienceScope: scope,
            audienceFilters: {
                roles: scope === 'roles' ? normalizeArray(audience.roles) : undefined,
                userIds: scope === 'custom' ? normalizeArray(audience.userIds) : undefined,
                emails: scope === 'custom' ? normalizeArray(audience.emails) : undefined,
            },
            recipientCount: users.length,
            channels: deliveryChannels,
            metadata: {
                failures,
                announcementAudience: announcementDoc?.audience,
            },
            announcement: announcementDoc?._id,
            createdBy: req.user._id,
        });

        return ok(res, {
            message: 'Notification dispatched successfully.',
            recipients: users.length,
            delivered,
            failures,
            announcementId: announcementDoc?._id,
        });
    } catch (error) {
        return fail(res, 500, 'ADMIN_NOTIFICATION_FAILED', error.message || 'Failed to send notification.');
    }
};

exports.listAdminNotificationLogs = async (_req, res) => {
    try {
        const logs = await AdminNotificationLog.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('createdBy', 'firstname lastname email profile.displayName')
            .populate('announcement', 'audience category title')
            .lean();

        const serialized = logs.map((log) => ({
            id: log._id,
            title: log.title,
            message: log.message,
            type: log.type,
            audienceScope: log.audienceScope,
            audienceFilters: log.audienceFilters,
            recipientCount: log.recipientCount,
            channels: log.channels,
            failures: log.metadata?.failures ?? 0,
            createdAt: log.createdAt,
            createdBy: log.createdBy
                ? {
                      name:
                          log.createdBy.profile?.displayName ||
                          `${log.createdBy.firstname || ''} ${log.createdBy.lastname || ''}`.trim() ||
                          log.createdBy.email,
                      email: log.createdBy.email,
                  }
                : null,
            announcement: log.announcement
                ? {
                      id: log.announcement._id,
                      audience: log.announcement.audience,
                      category: log.announcement.category,
                      title: log.announcement.title,
                  }
                : null,
        }));

        return ok(res, { logs: serialized });
    } catch (error) {
        return fail(res, 500, 'ADMIN_NOTIFICATION_LOGS_FAILED', error.message || 'Failed to load notification history.');
    }
};
