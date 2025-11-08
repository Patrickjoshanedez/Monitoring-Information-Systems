const Goal = require('../models/Goal');
const { ok, fail } = require('../utils/responses');

const sanitizeTitle = (v) => String(v || '').trim();
const sanitizeDesc = (v) => (v ? String(v).trim() : undefined);

// Compute current percent from milestones & latest progressHistory snapshot
const computePercent = (goal) => {
  if (goal.progressHistory && goal.progressHistory.length) {
    const latest = goal.progressHistory[goal.progressHistory.length - 1];
    return latest.value;
  }
  if (goal.milestones && goal.milestones.length) {
    const total = goal.milestones.length;
    const done = goal.milestones.filter((m) => m.achieved).length;
    return Math.round((done / total) * 100);
  }
  return 0;
};

// POST /api/goals
exports.createGoal = async (req, res) => {
  try {
    if (req.user.role !== 'mentee') return fail(res, 403, 'FORBIDDEN', 'Only mentees can create goals.');
    const { title, description, targetDate, milestones } = req.body || {};
    if (!title) return fail(res, 400, 'MISSING_FIELDS', 'Title is required.');
    const goal = await Goal.create({
      mentee: req.user.id,
      title: sanitizeTitle(title),
      description: sanitizeDesc(description),
      targetDate: targetDate ? new Date(targetDate) : undefined,
      milestones: Array.isArray(milestones)
        ? milestones.filter((m) => m && m.label).map((m) => ({ label: sanitizeTitle(m.label) }))
        : [],
    });
    return ok(res, { goal: { id: goal._id.toString(), title: goal.title } });
  } catch (err) {
    return fail(res, 500, 'GOAL_CREATE_FAILED', err.message);
  }
};

// GET /api/goals
exports.listGoals = async (req, res) => {
  try {
    if (req.user.role !== 'mentee') return fail(res, 403, 'FORBIDDEN', 'Only mentees can view their goals.');
    const goals = await Goal.find({ mentee: req.user.id, status: { $ne: 'archived' } })
      .sort({ createdAt: -1 })
      .select('title description targetDate status milestones progressHistory createdAt updatedAt')
      .lean();
    const rows = goals.map((g) => ({
      id: g._id.toString(),
      title: g.title,
      description: g.description || null,
      targetDate: g.targetDate || null,
      status: g.status,
      milestones: g.milestones.map((m) => ({ label: m.label, achieved: !!m.achieved, achievedAt: m.achievedAt || null })),
      progressPercent: computePercent(g),
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));
    return ok(res, { goals: rows }, { count: rows.length });
  } catch (err) {
    return fail(res, 500, 'GOAL_LIST_FAILED', err.message);
  }
};

// PATCH /api/goals/:id/progress  body: { value?, milestoneLabel? }
exports.updateProgress = async (req, res) => {
  try {
    if (req.user.role !== 'mentee') return fail(res, 403, 'FORBIDDEN', 'Only mentees can update goal progress.');
    const { id } = req.params;
    const { value, milestoneLabel } = req.body || {};
    const goal = await Goal.findOne({ _id: id, mentee: req.user.id });
    if (!goal) return fail(res, 404, 'NOT_FOUND', 'Goal not found.');

    if (typeof value === 'number') {
      const clamped = Math.min(100, Math.max(0, Math.round(value)));
      goal.progressHistory.push({ value: clamped });
      if (clamped === 100) goal.status = 'completed';
    }

    if (milestoneLabel) {
      const idx = goal.milestones.findIndex((m) => m.label.toLowerCase() === String(milestoneLabel).toLowerCase());
      if (idx >= 0 && !goal.milestones[idx].achieved) {
        goal.milestones[idx].achieved = true;
        goal.milestones[idx].achievedAt = new Date();
      }
    }

    await goal.save();
    return ok(res, { updated: true, progressPercent: computePercent(goal) });
  } catch (err) {
    return fail(res, 500, 'GOAL_UPDATE_FAILED', err.message);
  }
};