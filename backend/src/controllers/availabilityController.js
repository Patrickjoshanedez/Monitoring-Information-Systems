const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Availability = require('../models/Availability');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');

const DEFAULT_WINDOW_DAYS = Number(process.env.AVAILABILITY_WINDOW_DAYS || 30);
const MAX_RECURRING_WINDOW_DAYS = Number(process.env.AVAILABILITY_MAX_WINDOW_DAYS || 90);

const toObjectId = (value) => {
    if (!value) return null;
    if (mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    return null;
};

const ensureMentorAccess = (req, mentorId) => {
    if (!mentorId) {
        const error = new Error('Mentor id missing');
        error.status = 400;
        throw error;
    }

    const isSelf = req.user && (req.user.id?.toString?.() === mentorId.toString());
    if (isSelf) {
        return true;
    }

    if (req.user?.role === 'admin') {
        return true;
    }

    const error = new Error('Only the mentor or an admin can modify availability');
    error.status = 403;
    throw error;
};

const parseRange = (query = {}) => {
    const from = query.from ? new Date(query.from) : new Date();
    const defaultTo = new Date(from.getTime() + DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : defaultTo;

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        const error = new Error('Invalid date range provided');
        error.status = 400;
        throw error;
    }

    const maxWindow = from.getTime() + MAX_RECURRING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (to.getTime() > maxWindow) {
        const boundedTo = new Date(maxWindow);
        return { from, to: boundedTo };
    }

    return { from, to };
};

const toWeekday = (dayOfWeek) => (dayOfWeek === 0 ? 7 : dayOfWeek);

const expandRecurringSlots = (availability, rule, from, to) => {
    const slots = [];
    const zone = rule.timezone || availability.timezone || 'UTC';
    let cursor = DateTime.fromJSDate(from, { zone }).startOf('day');
    const boundary = DateTime.fromJSDate(to, { zone }).endOf('day');
    const targetWeekday = toWeekday(rule.dayOfWeek);
    const [startHour, startMinute] = rule.startTime.split(':').map(Number);
    const [endHour, endMinute] = rule.endTime.split(':').map(Number);

    if (!Number.isFinite(startHour) || !Number.isFinite(startMinute) || !Number.isFinite(endHour) || !Number.isFinite(endMinute)) {
        return slots;
    }

    while (cursor <= boundary && slots.length < 500) {
        if (cursor.weekday === targetWeekday) {
            let start = cursor.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
            let end = cursor.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });
            if (end <= start) {
                end = start.plus({ minutes: availability.metadata?.defaultDuration || 60 });
            }
            slots.push({
                availabilityId: availability._id,
                start: start.toUTC().toJSDate(),
                end: end.toUTC().toJSDate(),
                timezone: zone,
                capacity: availability.capacity,
                note: availability.note || null,
                type: 'recurring',
                rule,
            });
        }

        cursor = cursor.plus({ days: 1 });
    }

    return slots;
};

const expandOneOffSlots = (availability, from, to) => {
    if (!Array.isArray(availability.oneOff)) {
        return [];
    }

    return availability.oneOff
        .filter((slot) => slot && slot.start && slot.end && slot.end > from && slot.start < to)
        .map((slot) => ({
            availabilityId: availability._id,
            start: slot.start,
            end: slot.end,
            timezone: slot.timezone || availability.timezone || 'UTC',
            capacity: availability.capacity,
            note: availability.note || null,
            type: 'oneoff',
        }));
};

const expandSlots = (availability, from, to) => {
    if (!availability || availability.active === false) {
        return [];
    }

    if (availability.type === 'recurring') {
        return (availability.recurring || []).flatMap((rule) => expandRecurringSlots(availability, rule, from, to));
    }

    return expandOneOffSlots(availability, from, to);
};

const buildSlotKey = (availabilityId, start) => `${availabilityId}:${new Date(start).toISOString()}`;

const attachBookingCounts = async ({ mentorId, slots }) => {
    if (!slots.length) {
        return slots;
    }

    const from = new Date(Math.min(...slots.map((slot) => slot.start.getTime())));
    const to = new Date(Math.max(...slots.map((slot) => slot.end.getTime())));

    const pipeline = [
        {
            $match: {
                mentor: mentorId,
                status: { $nin: ['cancelled'] },
                date: { $gte: from, $lte: to },
                availabilityRef: { $ne: null },
            },
        },
        {
            $group: {
                _id: { availabilityRef: '$availabilityRef', date: '$date' },
                count: { $sum: 1 },
            },
        },
    ];

    const counts = await Session.aggregate(pipeline);
    const countMap = new Map();
    counts.forEach((entry) => {
        if (!entry?._id?.availabilityRef || !entry._id.date) {
            return;
        }
        const key = buildSlotKey(entry._id.availabilityRef.toString(), entry._id.date.toISOString());
        countMap.set(key, entry.count);
    });

    return slots.map((slot) => {
        const key = buildSlotKey(slot.availabilityId.toString(), slot.start.toISOString());
        const booked = countMap.get(key) || 0;
        return {
            ...slot,
            slotId: key,
            booked,
            remaining: Math.max(0, slot.capacity - booked),
        };
    });
};

const sanitizeAvailabilityPayload = (body = {}) => {
    const payload = {};
    payload.type = body.type === 'oneoff' ? 'oneoff' : 'recurring';
    payload.capacity = Math.min(50, Math.max(1, Number(body.capacity) || 1));
    payload.note = typeof body.note === 'string' ? body.note.trim() : undefined;
    payload.timezone = typeof body.timezone === 'string' && body.timezone.trim() ? body.timezone.trim() : body.timezone || 'UTC';

    if (payload.type === 'recurring') {
        const rules = Array.isArray(body.recurring) ? body.recurring : body.recurring ? [body.recurring] : [];
        payload.recurring = rules.map((rule) => ({
            dayOfWeek: Number(rule.dayOfWeek),
            startTime: rule.startTime,
            endTime: rule.endTime,
            timezone: rule.timezone || payload.timezone,
        }));
    } else {
        const slots = Array.isArray(body.oneOff) ? body.oneOff : body.oneOff ? [body.oneOff] : [];
        payload.oneOff = slots.map((slot) => ({
            start: slot.start ? new Date(slot.start) : null,
            end: slot.end ? new Date(slot.end) : null,
            timezone: slot.timezone || payload.timezone,
        }));
    }

    return payload;
};

const logAvailabilityAction = async ({ actorId, mentorId, availabilityId, action, metadata }) => {
    try {
        await AuditLog.create({
            actorId,
            action,
            resourceType: 'availability',
            resourceId: availabilityId.toString(),
            metadata: {
                mentorId,
                ...metadata,
            },
        });
    } catch (error) {
        console.error('availability audit log failed:', error.message);
    }
};

exports.listMentorAvailability = async (req, res) => {
    try {
        const mentorId = toObjectId(req.params.mentorId);
        if (!mentorId) {
            return res.status(400).json({ success: false, error: 'INVALID_MENTOR_ID', message: 'Invalid mentor id' });
        }

        const { from, to } = parseRange(req.query);
        const includeInactive = req.query.includeInactive === 'true';

        const query = { mentor: mentorId };
        if (!includeInactive) {
            query.active = true;
        }

        const availabilityDocs = await Availability.find(query).sort({ createdAt: -1 }).lean();
        const slots = await attachBookingCounts({
            mentorId,
            slots: availabilityDocs.flatMap((doc) => expandSlots(doc, from, to)).slice(0, 500),
        });

        return res.json({
            success: true,
            availability: availabilityDocs.map((doc) => ({
                id: doc._id,
                mentor: doc.mentor,
                type: doc.type,
                timezone: doc.timezone,
                capacity: doc.capacity,
                active: doc.active,
                note: doc.note,
                recurring: doc.recurring,
                oneOff: doc.oneOff,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            })),
            slots,
        });
    } catch (error) {
        const status = error.status || 500;
        console.error('listMentorAvailability error:', error);
        return res.status(status).json({ success: false, error: 'AVAILABILITY_FETCH_FAILED', message: error.message || 'Unable to load availability.' });
    }
};

exports.createMentorAvailability = async (req, res) => {
    try {
        const mentorId = toObjectId(req.params.mentorId);
        if (!mentorId) {
            return res.status(400).json({ success: false, error: 'INVALID_MENTOR_ID', message: 'Invalid mentor id' });
        }

        ensureMentorAccess(req, mentorId);
        const payload = sanitizeAvailabilityPayload(req.body);
        payload.mentor = mentorId;

        const availability = await Availability.create(payload);
        await logAvailabilityAction({
            actorId: req.user.id,
            mentorId,
            availabilityId: availability._id,
            action: 'availability:create',
            metadata: { type: availability.type },
        });

        return res.status(201).json({ success: true, availability });
    } catch (error) {
        const status = error.status || 500;
        console.error('createMentorAvailability error:', error);
        return res.status(status).json({ success: false, error: 'AVAILABILITY_CREATE_FAILED', message: error.message || 'Unable to save availability.' });
    }
};

exports.updateMentorAvailability = async (req, res) => {
    try {
        const mentorId = toObjectId(req.params.mentorId);
        const availabilityId = toObjectId(req.params.availabilityId);
        if (!mentorId || !availabilityId) {
            return res.status(400).json({ success: false, error: 'INVALID_IDS', message: 'Invalid identifiers supplied.' });
        }

        ensureMentorAccess(req, mentorId);
        const payload = sanitizeAvailabilityPayload(req.body);

        const availability = await Availability.findOneAndUpdate(
            { _id: availabilityId, mentor: mentorId },
            { $set: payload },
            { new: true }
        );

        if (!availability) {
            return res.status(404).json({ success: false, error: 'AVAILABILITY_NOT_FOUND', message: 'Availability entry not found.' });
        }

        await logAvailabilityAction({
            actorId: req.user.id,
            mentorId,
            availabilityId,
            action: 'availability:update',
            metadata: { type: availability.type },
        });

        return res.json({ success: true, availability });
    } catch (error) {
        const status = error.status || 500;
        console.error('updateMentorAvailability error:', error);
        return res.status(status).json({ success: false, error: 'AVAILABILITY_UPDATE_FAILED', message: error.message || 'Unable to update availability.' });
    }
};

exports.deleteMentorAvailability = async (req, res) => {
    try {
        const mentorId = toObjectId(req.params.mentorId);
        const availabilityId = toObjectId(req.params.availabilityId);
        if (!mentorId || !availabilityId) {
            return res.status(400).json({ success: false, error: 'INVALID_IDS', message: 'Invalid identifiers supplied.' });
        }

        ensureMentorAccess(req, mentorId);

        const availability = await Availability.findOneAndUpdate(
            { _id: availabilityId, mentor: mentorId },
            { $set: { active: false } },
            { new: true }
        );

        if (!availability) {
            return res.status(404).json({ success: false, error: 'AVAILABILITY_NOT_FOUND', message: 'Availability entry not found.' });
        }

        await logAvailabilityAction({
            actorId: req.user.id,
            mentorId,
            availabilityId,
            action: 'availability:deactivate',
        });

        return res.json({ success: true, availability });
    } catch (error) {
        const status = error.status || 500;
        console.error('deleteMentorAvailability error:', error);
        return res.status(status).json({ success: false, error: 'AVAILABILITY_DELETE_FAILED', message: error.message || 'Unable to delete availability.' });
    }
};
