const Session = require('../models/Session');
const { getSessionReminderOffsets, sendNotification } = require('../utils/notificationService');

const INTERVAL_MS = parseInt(process.env.SESSION_REMINDER_WORKER_INTERVAL_MS || '', 10) || 15 * 60 * 1000;
const LOOKAHEAD_MINUTES = parseInt(process.env.SESSION_REMINDER_MAX_LOOKAHEAD_MINUTES || '', 10) || 2880;

let timer = null;
let running = false;

const describeOffset = (offsetMinutes) => {
    if (!offsetMinutes) return '';
    if (offsetMinutes >= 1440) {
        const days = Math.round(offsetMinutes / 1440);
        return `${days} day${days > 1 ? 's' : ''}`;
    }
    if (offsetMinutes >= 60) {
        const hours = Math.round(offsetMinutes / 60);
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${offsetMinutes} minute${offsetMinutes > 1 ? 's' : ''}`;
};

const formatSessionDate = (sessionDate, timezone) => {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: timezone || 'UTC',
        });
        return formatter.format(sessionDate);
    } catch (error) {
        console.warn('formatSessionDate fallback due to invalid timezone:', timezone, error.message);
        return sessionDate.toLocaleString();
    }
};

const processSessions = async () => {
    const now = new Date();
    const horizon = new Date(now.getTime() + LOOKAHEAD_MINUTES * 60000);

    // Only select necessary fields for performance
    const sessions = await Session.find({
        date: { $gte: now, $lte: horizon },
    })
        .select('date mentee mentor remindersSent')
        .populate('mentee', 'firstname lastname email profile notificationSettings')
        .populate('mentor', 'firstname lastname email')
        .lean();

    for (const session of sessions) {
        const mentee = session.mentee;
        if (!mentee) continue;

        const offsets = getSessionReminderOffsets(mentee);
        if (!offsets.length) continue;

        const timeUntilSessionMs = new Date(session.date).getTime() - now.getTime();
        if (timeUntilSessionMs <= 0) continue;

        for (const offsetMinutes of offsets) {
            if (timeUntilSessionMs > offsetMinutes * 60000) continue; // Not yet inside window

            // Atomic guard: attempt to record the reminder BEFORE sending; skip if already present
            const preUpdate = await Session.findOneAndUpdate(
                { _id: session._id, 'remindersSent.offsetMinutes': { $ne: offsetMinutes } },
                {
                    $push: {
                        remindersSent: {
                            offsetMinutes,
                            sentAt: new Date(),
                            channels: { inApp: false, email: false }, // will patch after send
                        },
                    },
                },
                { new: true }
            ).select('_id');

            if (!preUpdate) {
                // Another worker/process already handled this offset
                continue;
            }

            const { getFullName } = require('../utils/person');
            const mentorName = session.mentor ? (getFullName(session.mentor) || session.mentor.email) : 'your mentor';

            const timezone = mentee.profile?.timezone || 'UTC';
            const formattedDate = formatSessionDate(new Date(session.date), timezone);
            const friendlyOffset = describeOffset(offsetMinutes);
            const message = `Reminder: You have a mentorship session with ${mentorName} on ${formattedDate} (${timezone})${friendlyOffset ? ` in about ${friendlyOffset}.` : '.'}`;

            const result = await sendNotification({
                userId: mentee._id,
                type: 'SESSION_REMINDER',
                title: 'Upcoming session reminder',
                message,
                data: {
                    sessionId: session._id,
                    mentorId: session.mentor ? session.mentor._id : null,
                    scheduledAt: session.date,
                    offsetMinutes,
                },
            });

            // Patch channels only if delivered
            if (result.delivered) {
                await Session.updateOne(
                    { _id: session._id, 'remindersSent.offsetMinutes': offsetMinutes },
                    {
                        $set: {
                            'remindersSent.$.channels': result.channelsUsed,
                        },
                    }
                );
            }
        }
    }
};

const run = async () => {
    if (running) {
        return;
    }

    running = true;
    try {
        await processSessions();
    } catch (error) {
        console.error('Session reminder worker error:', error);
    } finally {
        running = false;
    }
};

const startSessionReminderWorker = () => {
    if (timer) {
        return;
    }

    // Kick off immediately once
    run();
    timer = setInterval(run, INTERVAL_MS);
};

const stopSessionReminderWorker = () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
};

module.exports = {
    startSessionReminderWorker,
    stopSessionReminderWorker,
};
