const mongoose = require('mongoose');
const Session = require('../models/Session');

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

const parseFilters = (req) => {
  const { from, to, mentor, topic, page, limit } = req.query || {};
  const filters = { mentee: req.user.id };

  if (from) {
    filters.date = filters.date || {};
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) filters.date.$gte = d;
  }
  if (to) {
    filters.date = filters.date || {};
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) filters.date.$lte = d;
  }
  if (mentor) {
    const oid = toObjectId(mentor);
    if (oid) filters.mentor = oid;
  }
  if (topic) {
    filters.subject = new RegExp(String(topic).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  return { filters, page: pageNum, limit: limitNum };
};

exports.getMenteeSessions = async (req, res) => {
  try {
  const { filters, page, limit } = parseFilters(req);
  const { cursor } = req.query || {};
  const { parseDateCursor } = require('../utils/cursor');

    // Cursor pagination (preferred) falls back to page-based if no cursor provided
    const query = Session.find(filters).sort({ date: -1 });

    let usingCursor = false;
    if (cursor) {
      usingCursor = true;
      const cursorDate = parseDateCursor(cursor);
      if (cursorDate) {
        query.where({ date: { $lt: cursorDate } });
      }
    } else {
      query.skip((page - 1) * limit);
    }

    query.limit(limit)
      .select('subject mentor date durationMinutes attended tasksCompleted notes')
      .populate('mentor', 'firstname lastname email')
      .lean();

    const sessions = await query.exec();

    // Only compute total count when not using cursor (costly on large collections)
    let total; let totalPages; let nextCursor = null;
    if (!usingCursor) {
      total = await Session.countDocuments(filters);
      totalPages = Math.max(1, Math.ceil(total / limit));
    }

    if (sessions.length === limit) {
      // nextCursor is the last session's date (descending sort)
      nextCursor = sessions[sessions.length - 1].date.toISOString();
    }

    const { getFullName } = require('../utils/person');
    const rows = sessions.map((s) => ({
      id: s._id.toString(),
      subject: s.subject,
      mentor: s.mentor ? {
        id: s.mentor._id.toString(),
        name: getFullName(s.mentor) || s.mentor.email,
        email: s.mentor.email,
      } : null,
      date: s.date,
      durationMinutes: s.durationMinutes,
      attended: !!s.attended,
      tasksCompleted: s.tasksCompleted || 0,
      notes: s.notes || null,
    }));

    return res.json({
      success: true,
      sessions: rows,
      meta: usingCursor
        ? { cursor: nextCursor, limit, count: rows.length, usingCursor: true }
        : { total, page, limit, totalPages, count: rows.length, usingCursor: false },
    });
  } catch (error) {
    console.error('getMenteeSessions error:', error);
    return res.status(500).json({ success: false, error: 'SESSIONS_FETCH_FAILED', message: 'Unable to fetch sessions.' });
  }
};

exports.getMenteeReport = async (req, res) => {
  try {
    const { filters } = parseFilters(req);
    const all = await Session.find(filters)
      .sort({ date: -1 })
      .limit(500)
      .select('date subject attended tasksCompleted')
      .lean();

    const total = all.length;
    const attendedCount = all.filter((s) => s.attended).length;
    const attendancePct = total ? Math.round((attendedCount / total) * 100) : 0;
    const tasksCompleted = all.reduce((acc, s) => acc + (s.tasksCompleted || 0), 0);

    const snapshots = all.slice(0, 5).map((s) => ({
      id: s._id.toString(),
      date: s.date,
      subject: s.subject,
      attended: !!s.attended,
      tasksCompleted: s.tasksCompleted || 0,
    }));

    return res.json({ success: true, report: { total, attendedCount, attendancePct, tasksCompleted, snapshots } });
  } catch (error) {
    console.error('getMenteeReport error:', error);
    return res.status(500).json({ success: false, error: 'REPORT_FETCH_FAILED', message: 'Unable to fetch report.' });
  }
};

const toCsv = (rows) => {
  const header = ['Date', 'Mentor', 'Subject', 'Duration(min)', 'Attended', 'Tasks Completed', 'Notes'];
  const lines = rows.map((r) => [
    new Date(r.date).toISOString(),
    (r.mentor && (r.mentor.firstname || '') + ' ' + (r.mentor.lastname || '')).trim(),
    r.subject,
    r.durationMinutes,
    r.attended ? 'Yes' : 'No',
    r.tasksCompleted || 0,
    (r.notes || '').replace(/\n/g, ' '),
  ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  return [header.join(','), ...lines].join('\n');
};

exports.exportMenteeData = async (req, res) => {
  try {
    const { filters } = parseFilters(req);
    const format = (req.query.format || 'csv').toString().toLowerCase();
    const all = await Session.find(filters)
      .sort({ date: -1 })
      .select('date subject durationMinutes attended tasksCompleted notes mentor')
      .populate('mentor', 'firstname lastname')
      .lean();

    if (format === 'csv') {
      const csv = toCsv(all);
      const filename = `mentee_report_${new Date().toISOString().slice(0,10)}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }

    return res.status(501).json({ success: false, error: 'PDF_NOT_IMPLEMENTED', message: 'PDF export will be enabled after adding a PDF generator. Use format=csv for now.' });
  } catch (error) {
    console.error('exportMenteeData error:', error);
    return res.status(500).json({ success: false, error: 'EXPORT_FAILED', message: 'Unable to export report.' });
  }
};
