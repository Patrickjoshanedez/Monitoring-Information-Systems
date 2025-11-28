const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const AdminUserAction = require('../models/AdminUserAction');
const AuditLog = require('../models/AuditLog');
const { ok, fail } = require('../utils/responses');

const { Types } = mongoose;
const ADMIN_ACTIONS = new Set(['approve', 'reject', 'deactivate', 'reactivate', 'delete']);
const SESSION_STATUS_VALUES = new Set(['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed']);
const DEFAULT_TRACKED_SESSION_STATUSES = ['confirmed', 'completed', 'cancelled'];

const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';
const toNumber = (value, fallback, { min = 1, max = 100 } = {}) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
};

const sanitizeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveAdminId = (authUser) => {
    if (!authUser) {
        return null;
    }
    if (authUser._id && Types.ObjectId.isValid(authUser._id)) {
        return authUser._id;
    }
    if (authUser.id && Types.ObjectId.isValid(authUser.id)) {
        return authUser.id;
    }
    return null;
};

const buildUserSummary = (user) => ({
    id: user._id,
    firstname: user.firstname || '',
    lastname: user.lastname || '',
    displayName: (user.profile && user.profile.displayName) || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus || (user.deletedAt ? 'deactivated' : 'active'),
    applicationStatus: user.applicationStatus,
    applicationRole: user.applicationRole,
    submittedAt: user.applicationSubmittedAt,
    hasPendingApplication: user.applicationStatus === 'pending',
    profile: user.profile || null,
});

const attachLastAction = (users, actions) => {
    if (!actions.length) {
        return users.map((user) => ({ ...user, lastAction: null }));
    }
    const map = new Map();
    actions.forEach((action) => {
        const key = action.userId.toString();
        if (!map.has(key)) {
            map.set(key, action);
        }
    });
    return users.map((user) => {
        const action = map.get(user.id.toString());
        if (!action) {
            return { ...user, lastAction: null };
        }
        return {
            ...user,
            lastAction: {
                id: action._id,
                action: action.action,
                reason: action.reason,
                createdAt: action.createdAt,
            },
        };
    });
};

const listAdminUsers = async (req, res) => {
    try {
        const {
            role = 'all',
            accountStatus = 'all',
            applicationStatus = 'all',
            pendingOnly = false,
            includeDeleted = false,
            search = '',
            page = 1,
            limit = 20,
        } = req.query;

        const query = {};
        if (role !== 'all') {
            query.role = role;
        }
        if (accountStatus !== 'all') {
            query.accountStatus = accountStatus;
        }
        if (pendingOnly === 'true' || pendingOnly === true) {
            query.applicationStatus = 'pending';
        } else if (applicationStatus !== 'all') {
            query.applicationStatus = applicationStatus;
        }
        if (!toBoolean(includeDeleted)) {
            query.deletedAt = { $exists: false };
        }
        if (search && typeof search === 'string') {
            const regex = new RegExp(sanitizeRegex(search.trim()), 'i');
            query.$or = [
                { firstname: regex },
                { lastname: regex },
                { email: regex },
                { 'profile.displayName': regex },
            ];
        }

        const pageNumber = toNumber(page, 1, { min: 1, max: 1000 });
        const pageLimit = toNumber(limit, 20, { min: 5, max: 100 });
        const skip = (pageNumber - 1) * pageLimit;

        const projection = {
            firstname: 1,
            lastname: 1,
            email: 1,
            role: 1,
            accountStatus: 1,
            applicationStatus: 1,
            applicationRole: 1,
            applicationSubmittedAt: 1,
            profile: 1,
            deletedAt: 1,
        };

        const [users, total] = await Promise.all([
            User.find(query).select(projection).sort({ createdAt: -1 }).skip(skip).limit(pageLimit).lean(),
            User.countDocuments(query),
        ]);

        const summaries = users.map(buildUserSummary);
        const userIds = users.map((user) => user._id);
        let actions = [];
        if (userIds.length) {
            actions = await AdminUserAction.find({ userId: { $in: userIds } })
                .sort({ createdAt: -1 })
                .lean();
        }

        const withActions = attachLastAction(summaries, actions);
        const pages = Math.max(1, Math.ceil(total / pageLimit));

        return ok(
            res,
            { users: withActions },
            { pagination: { page: pageNumber, limit: pageLimit, total, pages } }
        );
    } catch (error) {
        return fail(res, 500, 'ADMIN_USERS_FETCH_FAILED', error.message || 'Failed to load users');
    }
};

const getAdminUserDetail = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!Types.ObjectId.isValid(userId)) {
            return fail(res, 400, 'INVALID_USER_ID', 'Invalid user id supplied');
        }

        const user = await User.findById(userId)
            .select(
                'firstname lastname email role accountStatus applicationStatus applicationRole applicationSubmittedAt profile'
            )
            .lean();
        if (!user) {
            return fail(res, 404, 'USER_NOT_FOUND', 'User not found');
        }

        const actions = await AdminUserAction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(25)
            .lean();

        return ok(res, {
            user: buildUserSummary(user),
            actions: actions.map((action) => ({
                id: action._id,
                action: action.action,
                reason: action.reason,
                createdAt: action.createdAt,
            })),
        });
    } catch (error) {
        return fail(res, 500, 'ADMIN_USER_DETAIL_FAILED', error.message || 'Failed to load user');
    }
};

const applyUserAction = (user, action, adminId) => {
    const now = new Date();
    switch (action) {
        case 'approve':
            user.accountStatus = 'active';
            user.applicationStatus = 'approved';
            user.applicationReviewedAt = now;
            user.applicationReviewedBy = adminId;
            user.deletedAt = undefined;
            break;
        case 'reject':
            user.accountStatus = 'deactivated';
            user.applicationStatus = 'rejected';
            user.applicationReviewedAt = now;
            user.applicationReviewedBy = adminId;
            break;
        case 'deactivate':
            user.accountStatus = 'deactivated';
            break;
        case 'reactivate':
            user.accountStatus = 'active';
            user.deletedAt = undefined;
            break;
        case 'delete':
            user.accountStatus = 'deactivated';
            user.deletedAt = now;
            break;
        default:
            break;
    }
};

const handleAdminUserAction = async (req, res) => {
    try {
        const { userId } = req.params;
        const { action, reason } = req.body || {};
        const adminId = resolveAdminId(req.user);

        if (!Types.ObjectId.isValid(userId)) {
            return fail(res, 400, 'INVALID_USER_ID', 'Invalid user id supplied');
        }
        if (!ADMIN_ACTIONS.has(action)) {
            return fail(res, 400, 'INVALID_ACTION', 'Unsupported admin action requested');
        }
        if (!adminId) {
            return fail(res, 401, 'ADMIN_CONTEXT_MISSING', 'Unable to resolve the admin identity for this action.');
        }

        const user = await User.findById(userId).select(
            'firstname lastname email role accountStatus applicationStatus applicationRole applicationSubmittedAt profile deletedAt applicationReviewedAt applicationReviewedBy'
        );
        if (!user) {
            return fail(res, 404, 'USER_NOT_FOUND', 'User not found');
        }

        applyUserAction(user, action, adminId);
        await user.save();

        const logEntry = await AdminUserAction.create({
            userId: user._id,
            adminId,
            action,
            reason,
            metadata: {
                accountStatus: user.accountStatus,
                applicationStatus: user.applicationStatus,
            },
        });

        const summary = {
            ...buildUserSummary(user.toObject()),
            lastAction: {
                id: logEntry._id,
                action: logEntry.action,
                reason: logEntry.reason,
                createdAt: logEntry.createdAt,
            },
        };

        return ok(res, { user: summary });
    } catch (error) {
        return fail(res, 500, 'ADMIN_USER_ACTION_FAILED', error.message || 'Failed to update user');
    }
};

const formatParticipant = (user) => {
    if (!user) {
        return null;
    }
    const displayName = (user.profile && user.profile.displayName) || `${user.firstname || ''} ${user.lastname || ''}`.trim();
    return {
        id: user._id,
        name: displayName || user.email,
        email: user.email,
    };
};

const summarizeAttendance = (entries = []) => {
    const summary = {
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        lastRecordedAt: null,
    };
    entries.forEach((entry) => {
        summary.total += 1;
        if (entry && typeof entry === 'object') {
            if (entry.status === 'present') {
                summary.present += 1;
            } else if (entry.status === 'late') {
                summary.late += 1;
            } else if (entry.status === 'absent') {
                summary.absent += 1;
            }
            if (entry.recordedAt) {
                const recordedDate = new Date(entry.recordedAt);
                if (!summary.lastRecordedAt || recordedDate > summary.lastRecordedAt) {
                    summary.lastRecordedAt = recordedDate;
                }
            }
        }
    });
    return summary;
};

const formatAdminSessionRow = (session) => {
    if (!session) {
        return null;
    }
    const attendanceSummary = summarizeAttendance(session.attendance || []);
    return {
        id: session._id,
        subject: session.subject,
        date: session.date,
        status: session.status,
        isGroup: session.isGroup,
        mentor: formatParticipant(session.mentor),
        mentee: formatParticipant(session.mentee),
        attendanceSummary: {
            ...attendanceSummary,
            lastRecordedAt: attendanceSummary.lastRecordedAt ? attendanceSummary.lastRecordedAt.toISOString() : null,
        },
        adminReview: session.adminReview
            ? {
                  flagged: !!session.adminReview.flagged,
                  reason: session.adminReview.reason || null,
                  notes: session.adminReview.notes || null,
                  flaggedAt: session.adminReview.flaggedAt || null,
                  flaggedBy: session.adminReview.flaggedBy || null,
                  updatedAt: session.adminReview.updatedAt || null,
                  updatedBy: session.adminReview.updatedBy || null,
              }
            : { flagged: false },
        completedAt: session.completedAt || null,
        durationMinutes: session.durationMinutes,
    };
};

const listAdminSessions = async (req, res) => {
    try {
        const { mentor, mentee, limit = 10, page = 1, sort = 'newest', status = 'all' } = req.query;

        const query = {};
        if (mentor) {
            if (!Types.ObjectId.isValid(mentor)) {
                return fail(res, 400, 'INVALID_MENTOR_ID', 'Mentor id is invalid');
            }
            query.mentor = mentor;
        }
        if (mentee) {
            if (!Types.ObjectId.isValid(mentee)) {
                return fail(res, 400, 'INVALID_MENTEE_ID', 'Mentee id is invalid');
            }
            query.mentee = mentee;
        }

        if (status && status !== 'all') {
            if (!SESSION_STATUS_VALUES.has(status)) {
                return fail(res, 400, 'INVALID_STATUS', 'Unsupported session status filter.');
            }
            query.status = status;
        } else {
            query.status = { $in: DEFAULT_TRACKED_SESSION_STATUSES };
        }

        const pageNumber = toNumber(page, 1, { min: 1, max: 1000 });
        const pageLimit = toNumber(limit, 10, { min: 5, max: 100 });
        const skip = (pageNumber - 1) * pageLimit;
        const sortOrder = sort === 'oldest' ? 1 : -1;

        const projection = {
            subject: 1,
            date: 1,
            status: 1,
            mentor: 1,
            mentee: 1,
            isGroup: 1,
            attendance: 1,
            adminReview: 1,
            completedAt: 1,
            durationMinutes: 1,
        };

        const [sessions, total] = await Promise.all([
            Session.find(query)
                .select(projection)
                .sort({ date: sortOrder })
                .skip(skip)
                .limit(pageLimit)
                .populate('mentor', 'firstname lastname email profile.displayName')
                .populate('mentee', 'firstname lastname email profile.displayName')
                .lean(),
            Session.countDocuments(query),
        ]);

        const normalized = sessions.map((session) => formatAdminSessionRow(session)).filter(Boolean);

        return ok(
            res,
            { sessions: normalized },
            { pagination: { page: pageNumber, limit: pageLimit, total, pages: Math.max(1, Math.ceil(total / pageLimit)) } }
        );
    } catch (error) {
        return fail(res, 500, 'ADMIN_SESSIONS_FAILED', error.message || 'Failed to load sessions');
    }
};

const updateAdminSessionReview = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { status, flagged, reason, notes } = req.body || {};
        const adminId = resolveAdminId(req.user);

        if (!Types.ObjectId.isValid(sessionId)) {
            return fail(res, 400, 'INVALID_SESSION_ID', 'Invalid session identifier.');
        }
        if (!adminId) {
            return fail(res, 401, 'ADMIN_CONTEXT_MISSING', 'Unable to resolve the admin identity for this action.');
        }
        if (!status && typeof flagged === 'undefined' && typeof reason === 'undefined' && typeof notes === 'undefined') {
            return fail(res, 400, 'NO_CHANGES', 'Provide at least one field to update.');
        }
        if (status && !SESSION_STATUS_VALUES.has(status)) {
            return fail(res, 400, 'INVALID_STATUS', 'Unsupported session status update.');
        }

        const session = await Session.findById(sessionId)
            .populate('mentor', 'firstname lastname email profile.displayName')
            .populate('mentee', 'firstname lastname email profile.displayName');
        if (!session) {
            return fail(res, 404, 'SESSION_NOT_FOUND', 'Session not found.');
        }

        const metadata = {};
        let hasChanges = false;

        if (status && session.status !== status) {
            metadata.statusBefore = session.status;
            metadata.statusAfter = status;
            session.status = status;
            hasChanges = true;
            if (status === 'cancelled') {
                session.statusMeta = session.statusMeta || {};
                session.statusMeta.cancellationReason = reason ? reason.toString().trim() : session.statusMeta.cancellationReason;
                session.statusMeta.cancellationBy = adminId;
                session.statusMeta.cancelledAt = new Date();
            }
            if (status === 'completed' && !session.completedAt) {
                session.completedAt = new Date();
            }
            if (status === 'confirmed') {
                session.completedAt = null;
            }
        }

        const review = session.adminReview || {};
        const normalizedReason = typeof reason === 'string' ? reason.trim() : reason;
        const normalizedNotes = typeof notes === 'string' ? notes.trim() : notes;

        if (typeof flagged === 'boolean') {
            if (flagged && !normalizedReason && !review.reason) {
                return fail(res, 400, 'FLAG_REASON_REQUIRED', 'Provide a reason when flagging a session.');
            }
            review.flagged = flagged;
            review.flaggedAt = flagged ? new Date() : null;
            review.flaggedBy = flagged ? adminId : null;
            metadata.flagged = flagged;
            hasChanges = true;
        }
        if (typeof normalizedReason !== 'undefined') {
            review.reason = normalizedReason || null;
            hasChanges = true;
        }
        if (typeof normalizedNotes !== 'undefined') {
            review.notes = normalizedNotes || null;
            hasChanges = true;
        }

        if (!hasChanges) {
            return fail(res, 400, 'NO_CHANGES', 'No updates detected for this session.');
        }

        review.updatedAt = new Date();
        review.updatedBy = adminId;
        session.adminReview = review;

        await session.save();

        await AuditLog.create({
            actorId: adminId,
            action: 'admin.session.update',
            resourceType: 'session',
            resourceId: session._id.toString(),
            metadata,
        });

        const refreshed = await Session.findById(session._id)
            .select({
                subject: 1,
                date: 1,
                status: 1,
                mentor: 1,
                mentee: 1,
                isGroup: 1,
                attendance: 1,
                adminReview: 1,
                completedAt: 1,
                durationMinutes: 1,
            })
            .populate('mentor', 'firstname lastname email profile.displayName')
            .populate('mentee', 'firstname lastname email profile.displayName')
            .lean();

        return ok(res, { session: formatAdminSessionRow(refreshed) });
    } catch (error) {
        return fail(res, 500, 'ADMIN_SESSION_UPDATE_FAILED', error.message || 'Failed to update session.');
    }
};

module.exports = {
    listAdminUsers,
    getAdminUserDetail,
    handleAdminUserAction,
    listAdminSessions,
    updateAdminSessionReview,
};
