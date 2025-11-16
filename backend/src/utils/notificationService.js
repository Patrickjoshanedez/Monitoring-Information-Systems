const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('./emailService');
const { isConfigured, triggerEvent } = require('./pusher');

const DEFAULT_OFFSETS = [2880, 1440, 60]; // minutes (48h, 24h, 1h)

const REMINDER_HOUR_TO_MINUTES = new Map([
    [48, 2880],
    [24, 1440],
    [1, 60],
]);

const REMINDER_MINUTES_TO_HOUR = new Map(
    Array.from(REMINDER_HOUR_TO_MINUTES.entries()).map(([hours, minutes]) => [minutes, hours])
);

const DEFAULT_REMINDER_HOURS = Array.from(REMINDER_HOUR_TO_MINUTES.keys());

const DEFAULT_NOTIFICATION_SETTINGS = {
    channels: {
        sessionReminders: { inApp: true, email: true },
        matches: { inApp: true, email: true },
        announcements: { inApp: true, email: false },
        messages: { inApp: true, email: true },
    },
    sessionReminders: {
        enabled: true,
        offsets: DEFAULT_OFFSETS,
    },
};

const CHANNEL_TYPE_MAP = [
    { key: 'sessionReminders', prefixes: ['SESSION_', 'SCHEDULE_', 'REMINDER_'] },
    { key: 'matches', prefixes: ['MENTORSHIP_', 'MATCH_'] },
    { key: 'announcements', prefixes: ['ANNOUNCEMENT_', 'ADMIN_', 'BULLETIN_'] },
    { key: 'messages', prefixes: ['MESSAGE_', 'CHAT_', 'INBOX_'] },
];

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS));

const sanitizeBoolean = (value, fallback) => {
    if (typeof value === 'boolean') return value;
    return fallback;
};

const sanitizeOffsets = (offsets) => {
    const parsed = Array.isArray(offsets)
        ? offsets
              .map((value) => Number(value))
              .filter((value) => Number.isFinite(value) && value > 0 && value <= 10080)
        : [];

    if (!parsed.length) {
        return [...DEFAULT_OFFSETS];
    }

    const unique = Array.from(new Set(parsed));
    unique.sort((a, b) => b - a);
    return unique;
};

const mergeSettings = (raw = {}) => {
    const merged = cloneDefaults();

    if (raw.channels) {
        Object.keys(merged.channels).forEach((key) => {
            if (raw.channels[key]) {
                merged.channels[key].inApp = sanitizeBoolean(
                    raw.channels[key].inApp,
                    merged.channels[key].inApp
                );
                merged.channels[key].email = sanitizeBoolean(
                    raw.channels[key].email,
                    merged.channels[key].email
                );
            }
        });
    }

    if (raw.sessionReminders) {
        merged.sessionReminders.enabled = sanitizeBoolean(
            raw.sessionReminders.enabled,
            merged.sessionReminders.enabled
        );
        if (raw.sessionReminders.offsets) {
            merged.sessionReminders.offsets = sanitizeOffsets(raw.sessionReminders.offsets);
        }
    }

    return merged;
};

const getChannelKeyForType = (type) => {
    const upper = String(type || '').toUpperCase();
    for (const entry of CHANNEL_TYPE_MAP) {
        if (entry.prefixes.some((prefix) => upper.startsWith(prefix))) {
            return entry.key;
        }
    }
    return 'announcements';
};

const formatPersonName = (user) => {
    if (!user) return 'there';
    const displayName = user.profile?.displayName;
    const firstname = user.firstname || '';
    const lastname = user.lastname || '';
    const fullName = `${firstname} ${lastname}`.trim();
    return displayName || fullName || 'there';
};

const buildEmailPayload = (user, title, message) => {
    const greetingName = formatPersonName(user);
    const textBody = `Hi ${greetingName},\n\n${message}\n\n— Mentoring System`;
    const htmlBody = `<!doctype html><html><body style="font-family: Arial, sans-serif; color: #1f2937;">` +
        `<p>Hi ${greetingName},</p>` +
        `<p>${message}</p>` +
        `<p style="margin-top: 24px; color: #6b7280;">— Mentoring System</p>` +
        `</body></html>`;

    return {
        to: user.email,
        subject: title,
        text: textBody,
        html: htmlBody,
    };
};

const ensureSettings = (user) => mergeSettings(user?.notificationSettings);

const getSessionReminderOffsets = (user) => {
    const settings = ensureSettings(user);
    if (!settings.sessionReminders.enabled) {
        return [];
    }
    return Array.isArray(settings.sessionReminders.offsets)
        ? settings.sessionReminders.offsets
        : [...DEFAULT_OFFSETS];
};

const sanitizeReminderHours = (hours) => {
    const cleaned = Array.isArray(hours)
        ? hours
              .map((value) => Number(value))
              .filter((value) => REMINDER_HOUR_TO_MINUTES.has(value))
        : [];

    if (!cleaned.length) {
        return [...DEFAULT_REMINDER_HOURS];
    }

    const unique = Array.from(new Set(cleaned));
    unique.sort((a, b) => b - a);
    return unique;
};

const reminderHoursToMinutes = (hoursList) => sanitizeReminderHours(hoursList).map((hour) => REMINDER_HOUR_TO_MINUTES.get(hour));

const reminderMinutesToHours = (minutesList) => {
    const sanitized = Array.isArray(minutesList)
        ? minutesList
              .map((value) => REMINDER_MINUTES_TO_HOUR.get(Number(value)))
              .filter((value) => value !== undefined)
        : [];

    if (!sanitized.length) {
        return [...DEFAULT_REMINDER_HOURS];
    }

    const unique = Array.from(new Set(sanitized));
    unique.sort((a, b) => b - a);
    return unique;
};

const emitRealtimeNotification = async (userId, notificationDoc) => {
    if (!notificationDoc || !isConfigured()) {
        return;
    }

    try {
        await triggerEvent(`private-user-${userId}`, 'notification:new', {
            id: notificationDoc._id.toString(),
            type: notificationDoc.type,
            title: notificationDoc.title,
            message: notificationDoc.message,
            data: notificationDoc.data || {},
            createdAt: notificationDoc.createdAt,
        });
    } catch (error) {
        if (error.code !== 'PUSHER_NOT_CONFIGURED') {
            console.error('notification realtime error:', error);
        }
    }
};

const sendNotification = async ({
    userId,
    type,
    title,
    message,
    data = {},
    channelsOverride = {},
} = {}) => {
    if (!userId) {
        return { delivered: false, channelsUsed: { inApp: false, email: false } };
    }

    try {
        const user = await User.findById(userId).select('email firstname lastname profile notificationSettings');
        if (!user) {
            return { delivered: false, channelsUsed: { inApp: false, email: false } };
        }

        const settings = ensureSettings(user);
        const channelKey = getChannelKeyForType(type);
        const channelPrefs = settings.channels[channelKey] || { inApp: true, email: false };

        const effectiveChannels = {
            inApp: channelsOverride.inApp !== undefined ? channelsOverride.inApp : channelPrefs.inApp,
            email: channelsOverride.email !== undefined ? channelsOverride.email : channelPrefs.email,
        };

        let inAppDelivered = false;
        let emailDelivered = false;

        let notificationDoc = null;

        if (effectiveChannels.inApp) {
            notificationDoc = await Notification.create({
                user: userId,
                type,
                title,
                message,
                data,
            });
            inAppDelivered = true;
        }

        if (effectiveChannels.email && user.email) {
            const payload = buildEmailPayload(user, title, message);
            const sent = await sendNotificationEmail(payload);
            emailDelivered = !!sent;
        }

        if (notificationDoc) {
            emitRealtimeNotification(userId, notificationDoc);
        }

        return {
            delivered: inAppDelivered || emailDelivered,
            channelsUsed: { inApp: inAppDelivered, email: emailDelivered },
        };
    } catch (error) {
        console.error('sendNotification error:', error);
        return { delivered: false, channelsUsed: { inApp: false, email: false }, error };
    }
};

module.exports = {
    DEFAULT_NOTIFICATION_SETTINGS,
    getNotificationSettingsForUser: ensureSettings,
    getSessionReminderOffsets,
    sanitizeOffsets,
    sendNotification,
    reminderMinutesToHours,
    reminderHoursToMinutes,
};
