const parseDays = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.max(1, Math.floor(parsed));
};

const FEEDBACK_WINDOW_DAYS = parseDays(process.env.FEEDBACK_WINDOW_DAYS, 14);
const FEEDBACK_RETENTION_DAYS = parseDays(process.env.FEEDBACK_RETENTION_DAYS, 365);
const MENTOR_FEEDBACK_EDIT_WINDOW_DAYS = parseDays(process.env.MENTOR_FEEDBACK_EDIT_WINDOW_DAYS, 14);

module.exports = {
    FEEDBACK_WINDOW_DAYS,
    FEEDBACK_RETENTION_DAYS,
    MENTOR_FEEDBACK_EDIT_WINDOW_DAYS,
};