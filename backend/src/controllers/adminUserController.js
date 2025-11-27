const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const AdminUserAction = require('../models/AdminUserAction');
const { ok, fail } = require('../utils/responses');

const { Types } = mongoose;
const ADMIN_ACTIONS = new Set(['approve', 'reject', 'deactivate', 'reactivate', 'delete']);

const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';
const toNumber = (value, fallback, { min = 1, max = 100 } = {}) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
};

const sanitizeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

        if (!Types.ObjectId.isValid(userId)) {
            return fail(res, 400, 'INVALID_USER_ID', 'Invalid user id supplied');
        }
        if (!ADMIN_ACTIONS.has(action)) {
            return fail(res, 400, 'INVALID_ACTION', 'Unsupported admin action requested');
        }

        const user = await User.findById(userId).select(
            'firstname lastname email role accountStatus applicationStatus applicationRole applicationSubmittedAt profile deletedAt applicationReviewedAt applicationReviewedBy'
        );
        if (!user) {
            return fail(res, 404, 'USER_NOT_FOUND', 'User not found');
        }

        applyUserAction(user, action, req.user._id);
        await user.save();

        const logEntry = await AdminUserAction.create({
            userId: user._id,
            adminId: req.user._id,
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

const listAdminSessions = async (req, res) => {
    try {
        const { mentor, mentee, limit = 5, page = 1, sort = 'newest' } = req.query;
        if (!mentor && !mentee) {
            return fail(res, 400, 'INVALID_FILTER', 'Provide a mentor or mentee filter');
        }

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

        const pageNumber = toNumber(page, 1, { min: 1, max: 1000 });
        const pageLimit = toNumber(limit, 5, { min: 1, max: 50 });
        const skip = (pageNumber - 1) * pageLimit;
        const sortOrder = sort === 'oldest' ? 1 : -1;

        const projection = {
            subject: 1,
            date: 1,
            status: 1,
            mentor: 1,
            mentee: 1,
            isGroup: 1,
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

        const normalized = sessions.map((session) => ({
            id: session._id,
            subject: session.subject,
            date: session.date,
            status: session.status,
            isGroup: session.isGroup,
            mentor: formatParticipant(session.mentor),
            mentee: formatParticipant(session.mentee),
        }));

        return ok(
            res,
            { sessions: normalized },
            { pagination: { page: pageNumber, limit: pageLimit, total, pages: Math.max(1, Math.ceil(total / pageLimit)) } }
        );
    } catch (error) {
        return fail(res, 500, 'ADMIN_SESSIONS_FAILED', error.message || 'Failed to load sessions');
    }
};

module.exports = {
    listAdminUsers,
    getAdminUserDetail,
    handleAdminUserAction,
    listAdminSessions,
};
