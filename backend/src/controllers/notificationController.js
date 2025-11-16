const User = require('../models/User');
const Notification = require('../models/Notification');
const { parseDateCursor } = require('../utils/cursor');
const {
    DEFAULT_NOTIFICATION_SETTINGS,
    getNotificationSettingsForUser,
    reminderMinutesToHours,
    reminderHoursToMinutes,
} = require('../utils/notificationService');

const REMINDER_TIME_OPTIONS = new Set([48, 24, 1]);
const TYPE_FILTER_PREFIXES = {
    session: ['SESSION_', 'SCHEDULE_', 'REMINDER_', 'MENTORSHIP_'],
    message: ['MESSAGE_', 'CHAT_'],
    announcement: ['ANNOUNCEMENT_', 'ADMIN_', 'BULLETIN_'],
    system: ['SYSTEM_', 'APP_', 'PROFILE_', 'APPLICATION_', 'GOAL_', 'CERT_', 'PROGRESS_'],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const deriveCategory = (type = '') => {
    const upperType = String(type).toUpperCase();
    return (
        Object.entries(TYPE_FILTER_PREFIXES).find(([, prefixes]) =>
            prefixes.some((prefix) => upperType.startsWith(prefix))
        )?.[0] || 'system'
    );
};

const serializeNotification = (doc) => ({
    id: doc._id.toString(),
    type: doc.type,
    category: deriveCategory(doc.type),
    title: doc.title,
    message: doc.message,
    data: doc.data || {},
    readAt: doc.readAt || null,
    createdAt: doc.createdAt,
});

const buildTypeFilter = (typeParam) => {
    if (!typeParam) {
        return null;
    }

    const normalized = String(typeParam).toLowerCase();
    const prefixes = TYPE_FILTER_PREFIXES[normalized];
    if (!prefixes) {
        return { error: `Unsupported notification type filter: ${typeParam}` };
    }

    return {
        $in: prefixes.map((prefix) => new RegExp(`^${prefix}`)),
    };
};

const serializePreferences = (settings) => ({
    emailSessionReminders: !!settings.channels.sessionReminders.email,
    emailMatches: !!settings.channels.matches.email,
    emailMessages: !!settings.channels.messages.email,
    emailAnnouncements: !!settings.channels.announcements.email,
    reminderTimes: reminderMinutesToHours(settings.sessionReminders.offsets),
});

const normalizeReminderTimes = (input) => {
    if (!Array.isArray(input) || !input.length) {
        throw new Error('Reminder times must include at least one option.');
    }

    const normalized = input.map((value) => Number(value));
    const invalid = normalized.filter((value) => !REMINDER_TIME_OPTIONS.has(value));
    if (invalid.length) {
        throw new Error('Reminder times must be limited to 48, 24, or 1 hour before the session.');
    }

    const unique = Array.from(new Set(normalized));
    unique.sort((a, b) => b - a);
    return unique;
};

const countUnread = (userId) =>
    Notification.countDocuments({ user: userId, readAt: { $exists: false } });

exports.getPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('notificationSettings');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'USER_NOT_FOUND',
                message: 'Profile not found.',
            });
        }

        const preferences = serializePreferences(getNotificationSettingsForUser(user));
        return res.json({ success: true, preferences });
    } catch (error) {
        console.error('getPreferences error:', error);
        return res.status(500).json({
            success: false,
            error: 'PREFERENCES_FETCH_FAILED',
            message: 'Unable to load notification preferences.',
        });
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('notificationSettings');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'USER_NOT_FOUND',
                message: 'Profile not found.',
            });
        }

        const { emailSessionReminders, emailMatches, emailMessages, emailAnnouncements, reminderTimes } = req.body || {};

        const current = getNotificationSettingsForUser(user);
        const next = clone(current);

        if (emailSessionReminders !== undefined) {
            next.channels.sessionReminders.email = !!emailSessionReminders;
        }
        if (emailMatches !== undefined) {
            next.channels.matches.email = !!emailMatches;
        }
        if (emailMessages !== undefined) {
            next.channels.messages.email = !!emailMessages;
        }
        if (emailAnnouncements !== undefined) {
            next.channels.announcements.email = !!emailAnnouncements;
        }

        if (reminderTimes !== undefined) {
            try {
                const normalized = normalizeReminderTimes(reminderTimes);
                next.sessionReminders.offsets = reminderHoursToMinutes(normalized);
            } catch (validationError) {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_REMINDER_TIMES',
                    message: validationError.message,
                });
            }
        }

        if (!Array.isArray(next.sessionReminders.offsets) || !next.sessionReminders.offsets.length) {
            next.sessionReminders.offsets = clone(DEFAULT_NOTIFICATION_SETTINGS.sessionReminders.offsets);
        }

        await User.updateOne(
            { _id: req.user.id },
            { $set: { notificationSettings: next } }
        );

        return res.json({ success: true, preferences: serializePreferences(next) });
    } catch (error) {
        console.error('updatePreferences error:', error);
        return res.status(500).json({
            success: false,
            error: 'PREFERENCES_UPDATE_FAILED',
            message: 'Unable to update notification preferences.',
        });
    }
};

// Consolidated notifications handlers (moved from mentorController to reduce coupling)
exports.listNotifications = async (req, res) => {
    try {
        const { cursor, limit, type } = req.query || {};
        const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

        const filter = { user: req.user.id };
        const typeFilter = buildTypeFilter(type);

        if (type && typeFilter?.error) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_TYPE_FILTER',
                message: typeFilter.error,
            });
        }

        if (typeFilter && !typeFilter.error) {
            filter.type = typeFilter;
        }

        const findQuery = Notification.find(filter).sort({ createdAt: -1 });

        const cursorDate = parseDateCursor(cursor);
        let usingCursor = false;
        if (cursorDate) {
            usingCursor = true;
            findQuery.where({ createdAt: { $lt: cursorDate } });
        }

        const notifications = await findQuery
            .limit(pageLimit)
            .select('type title message data readAt createdAt')
            .lean();

        let nextCursor = null;
        if (notifications.length === pageLimit) {
            nextCursor = notifications[notifications.length - 1].createdAt.toISOString();
        }

        const unreadCount = await countUnread(req.user.id);

        return res.json({
            success: true,
            notifications: notifications.map(serializeNotification),
            meta: usingCursor
                ? { cursor: nextCursor, limit: pageLimit, count: notifications.length, usingCursor: true }
                : { limit: pageLimit, count: notifications.length, usingCursor: false },
            unreadCount,
        });
    } catch (error) {
        console.error('listNotifications error:', error);
        return res.status(500).json({
            success: false,
            error: 'NOTIFICATION_FETCH_FAILED',
            message: 'Unable to fetch notifications at this time.',
        });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: req.user.id },
            { readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'NOTIFICATION_NOT_FOUND',
                message: 'Notification not found.',
            });
        }

        const unreadCount = await countUnread(req.user.id);

        return res.json({
            success: true,
            notification: {
                id: notification._id.toString(),
                readAt: notification.readAt,
            },
            unreadCount,
        });
    } catch (error) {
        console.error('markNotificationRead error:', error);
        return res.status(500).json({
            success: false,
            error: 'NOTIFICATION_UPDATE_FAILED',
            message: 'Unable to update notification at this time.',
        });
    }
};

exports.markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, readAt: { $exists: false } },
            { readAt: new Date() }
        );

        return res.json({
            success: true,
            message: 'Notifications marked as read.',
            unreadCount: 0,
        });
    } catch (error) {
        console.error('markAllNotificationsRead error:', error);
        return res.status(500).json({
            success: false,
            error: 'NOTIFICATION_UPDATE_FAILED',
            message: 'Unable to update notifications at this time.',
        });
    }
};
