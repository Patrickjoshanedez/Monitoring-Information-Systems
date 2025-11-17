const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ok, fail } = require('../utils/responses');

const MAX_CAPACITY = Number(process.env.MAX_MENTOR_CAPACITY || 25);

const ensureAdmin = (user) => user && user.role === 'admin';

const serializeMentorCapacity = (mentor) => {
  if (!mentor) return null;
  const capacity = mentor.mentorSettings?.capacity ?? null;
  const active = mentor.mentorSettings?.activeMenteesCount ?? 0;
  return {
    id: mentor._id.toString(),
    name: [mentor.firstname, mentor.lastname].filter(Boolean).join(' ').trim() || mentor.email,
    email: mentor.email,
    capacity,
    activeMentees: active,
    remainingSlots: capacity !== null ? Math.max(capacity - active, 0) : null,
    updatedAt: mentor.mentorSettings?.capacityUpdatedAt || mentor.updatedAt,
  };
};

exports.listMentorCapacities = async (req, res) => {
  if (!ensureAdmin(req.user)) {
    return fail(res, 403, 'FORBIDDEN', 'Administrator access required.');
  }

  try {
    const mentors = await User.find({ role: 'mentor' })
      .select('firstname lastname email mentorSettings updatedAt')
      .sort({ 'mentorSettings.capacityUpdatedAt': -1, updatedAt: -1 })
      .lean();

    return ok(
      res,
      { mentors: mentors.map(serializeMentorCapacity).filter(Boolean) },
      { count: mentors.length }
    );
  } catch (error) {
    return fail(res, 500, 'CAPACITY_LIST_FAILED', error.message || 'Unable to load mentor capacities.');
  }
};

exports.overrideMentorCapacity = async (req, res) => {
  if (!ensureAdmin(req.user)) {
    return fail(res, 403, 'FORBIDDEN', 'Administrator access required.');
  }

  const { mentorId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(mentorId)) {
    return fail(res, 400, 'INVALID_ID', 'Invalid mentor id.');
  }

  const capacityValue = Number(req.body?.capacity);
  if (!Number.isFinite(capacityValue) || capacityValue < 1 || capacityValue > MAX_CAPACITY) {
    return fail(res, 422, 'INVALID_CAPACITY', `Capacity must be between 1 and ${MAX_CAPACITY}.`);
  }

  try {
    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' }).select(
      'firstname lastname email mentorSettings updatedAt'
    );

    if (!mentor) {
      return fail(res, 404, 'MENTOR_NOT_FOUND', 'Mentor not found.');
    }

    const active = mentor.mentorSettings?.activeMenteesCount ?? 0;
    if (active > capacityValue) {
      return fail(
        res,
        409,
        'CAPACITY_BELOW_ACTIVE',
        'Capacity cannot be lower than the current active mentee count.'
      );
    }

    mentor.mentorSettings = mentor.mentorSettings || {};
    mentor.mentorSettings.capacity = capacityValue;
    mentor.mentorSettings.capacityUpdatedAt = new Date();
    await mentor.save();

    await AuditLog.create({
      actorId: req.user.id,
      action: 'mentor_capacity_override',
      resourceType: 'mentor',
      resourceId: mentorId,
      metadata: {
        capacity: capacityValue,
        activeMentees: active,
        reason: req.body?.reason || null,
      },
    });

    return ok(res, { mentor: serializeMentorCapacity(mentor) });
  } catch (error) {
    return fail(res, 500, 'CAPACITY_OVERRIDE_FAILED', error.message || 'Unable to update capacity.');
  }
};
