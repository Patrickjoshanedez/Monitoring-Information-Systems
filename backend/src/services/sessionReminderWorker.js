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
        .select('date mentee mentor participants remindersSent subject room')
        .populate('mentee', 'firstname lastname email profile notificationSettings')
        .populate('mentor', 'firstname lastname email')
        .populate('participants.user', 'firstname lastname email profile notificationSettings')
        .lean();

    for (const session of sessions) {
        const activeParticipants = Array.isArray(session.participants)
            ? session.participants.filter((entry) => !['declined', 'removed'].includes(entry.status))
            : [];

        const recipients = activeParticipants.length
            ? activeParticipants.map((entry) => entry.user).filter(Boolean)
            : session.mentee
            ? [session.mentee]
            : [];

        if (!recipients.length) {
            continue;
        }

        const timeUntilSessionMs = new Date(session.date).getTime() - now.getTime();
        if (timeUntilSessionMs <= 0) continue;

        const { getFullName } = require('../utils/person');
        const mentorName = session.mentor ? (getFullName(session.mentor) || session.mentor.email) : 'your mentor';

        for (const recipient of recipients) {
            if (!recipient) continue;

            const offsets = getSessionReminderOffsets(recipient);
            if (!offsets.length) continue;

            const timezone = recipient.profile?.timezone || 'UTC';
            const formattedDate = formatSessionDate(new Date(session.date), timezone);

            for (const offsetMinutes of offsets) {
                if (timeUntilSessionMs > offsetMinutes * 60000) continue;

                const insertion = await Session.updateOne(
                    {
                        _id: session._id,
                        remindersSent: { $not: { $elemMatch: { offsetMinutes, recipient: recipient._id } } },
                    },
                    {
                        $push: {
                            remindersSent: {
                                offsetMinutes,
                                recipient: recipient._id,
                                sentAt: new Date(),
                                channels: { inApp: false, email: false },
                            },
                        },
                    }
                );

                if (!insertion.modifiedCount) {
                    continue;
                }

                const friendlyOffset = describeOffset(offsetMinutes);
                const message = `Reminder: You have a mentorship session with ${mentorName} on ${formattedDate} (${timezone})${friendlyOffset ? ` in about ${friendlyOffset}.` : '.'}`;

                const result = await sendNotification({
                    userId: recipient._id,
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

                if (result.delivered) {
                    await Session.updateOne(
                        {
                            _id: session._id,
                            'remindersSent.offsetMinutes': offsetMinutes,
                            'remindersSent.recipient': recipient._id,
                        },
                        {
                            $set: {
                                'remindersSent.$.channels': result.channelsUsed,
                                'remindersSent.$.sentAt': new Date(),
                            },
                        }
                    );
                }
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
