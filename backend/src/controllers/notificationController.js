const User = require('../models/User');
const Notification = require('../models/Notification');
const { parseDateCursor } = require('../utils/cursor');
const {
    DEFAULT_NOTIFICATION_SETTINGS,
    getNotificationSettingsForUser,
    sanitizeOffsets,
} = require('../utils/notificationService');

const CHANNEL_KEYS = ['sessionReminders', 'matches', 'announcements', 'messages'];

const clone = (value) => JSON.parse(JSON.stringify(value));

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

        const preferences = getNotificationSettingsForUser(user);
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

        const incoming = req.body || {};
        const current = getNotificationSettingsForUser(user);
        const next = clone(current);

        if (incoming.channels && typeof incoming.channels === 'object') {
            CHANNEL_KEYS.forEach((key) => {
                if (incoming.channels[key]) {
                    const channelInput = incoming.channels[key];
                    if (channelInput.inApp !== undefined) {
                        next.channels[key].inApp = !!channelInput.inApp;
                    }
                    if (channelInput.email !== undefined) {
                        next.channels[key].email = !!channelInput.email;
                    }
                }
            });
        }

        if (incoming.sessionReminders && typeof incoming.sessionReminders === 'object') {
            if (incoming.sessionReminders.enabled !== undefined) {
                next.sessionReminders.enabled = !!incoming.sessionReminders.enabled;
            }
            if (incoming.sessionReminders.offsets) {
                next.sessionReminders.offsets = sanitizeOffsets(incoming.sessionReminders.offsets);
            }
        }

        // Ensure offsets are still unique/sorted even if channel toggles disabled them previously
        if (!Array.isArray(next.sessionReminders.offsets) || !next.sessionReminders.offsets.length) {
            next.sessionReminders.offsets = clone(DEFAULT_NOTIFICATION_SETTINGS.sessionReminders.offsets);
        }

        await User.updateOne(
            { _id: req.user.id },
            { $set: { notificationSettings: next } }
        );

        return res.json({ success: true, preferences: next });
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
        const { cursor, limit } = req.query || {};
        const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

        const findQuery = Notification.find({ user: req.user.id }).sort({ createdAt: -1 });

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

        return res.json({
            success: true,
            notifications: notifications.map((n) => ({
                id: n._id.toString(),
                type: n.type,
                title: n.title,
                message: n.message,
                data: n.data || {},
                readAt: n.readAt || null,
                createdAt: n.createdAt,
            })),
            meta: usingCursor
                ? { cursor: nextCursor, limit: pageLimit, count: notifications.length, usingCursor: true }
                : { limit: pageLimit, count: notifications.length, usingCursor: false },
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

        return res.json({
            success: true,
            notification: {
                id: notification._id.toString(),
                readAt: notification.readAt,
            },
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
