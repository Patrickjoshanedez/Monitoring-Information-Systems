const User = require('../models/User');
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
