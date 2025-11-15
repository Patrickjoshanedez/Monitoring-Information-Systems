const mongoose = require('mongoose');
const Session = require('../models/Session');
const { getFullName } = require('../utils/person');

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

const parseFilters = (req, scope = 'mentee') => {
  const { from, to, mentor, mentee, topic, page, limit } = req.query || {};
  const filters = scope === 'mentor' ? { mentor: req.user.id } : { mentee: req.user.id };

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
  if (scope === 'mentee' && mentor) {
    const oid = toObjectId(mentor);
    if (oid) filters.mentor = oid;
  }
  if (scope === 'mentor' && mentee) {
    const oid = toObjectId(mentee);
    if (oid) filters.mentee = oid;
  }
  if (topic) {
    filters.subject = new RegExp(String(topic).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  return { filters, page: pageNum, limit: limitNum };
};

const summarizePerson = (doc) => {
  if (!doc || typeof doc !== 'object') {
    return null;
  }

  const identifier = doc._id || doc.id || null;
  if (!identifier && !doc.firstname && !doc.lastname && !doc.email) {
    return null;
  }

  return {
    id: identifier ? identifier.toString() : null,
    name: getFullName(doc) || doc.email,
    email: doc.email,
  };
};

const formatSessionRow = (sessionDoc) => {
  if (!sessionDoc) {
    return null;
  }

  return {
    id: sessionDoc._id.toString(),
    subject: sessionDoc.subject,
    mentor: summarizePerson(sessionDoc.mentor),
    mentee: summarizePerson(sessionDoc.mentee),
    date: sessionDoc.date,
    durationMinutes: sessionDoc.durationMinutes,
    attended: !!sessionDoc.attended,
    tasksCompleted: sessionDoc.tasksCompleted || 0,
    notes: sessionDoc.notes || null,
  };
};

exports.getMenteeSessions = async (req, res) => {
  try {
    const { filters, page, limit } = parseFilters(req, 'mentee');
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
      .select('subject mentor mentee date durationMinutes attended tasksCompleted notes')
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
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

    const rows = sessions.map(formatSessionRow);

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

exports.getMentorSessions = async (req, res) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Mentor access required.' });
  }

  try {
    const { filters, page, limit } = parseFilters(req, 'mentor');
    const { cursor } = req.query || {};
    const { parseDateCursor } = require('../utils/cursor');

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
      .select('subject mentor mentee date durationMinutes attended tasksCompleted notes')
      .populate('mentee', 'firstname lastname email')
      .populate('mentor', 'firstname lastname email')
      .lean();

    const sessions = await query.exec();

    let total; let totalPages; let nextCursor = null;
    if (!usingCursor) {
      total = await Session.countDocuments(filters);
      totalPages = Math.max(1, Math.ceil(total / limit));
    }

    if (sessions.length === limit) {
      nextCursor = sessions[sessions.length - 1].date.toISOString();
    }

    const rows = sessions.map(formatSessionRow);

    return res.json({
      success: true,
      sessions: rows,
      meta: usingCursor
        ? { cursor: nextCursor, limit, count: rows.length, usingCursor: true }
        : { total, page, limit, totalPages, count: rows.length, usingCursor: false },
    });
  } catch (error) {
    console.error('getMentorSessions error:', error);
    return res.status(500).json({ success: false, error: 'SESSIONS_FETCH_FAILED', message: 'Unable to fetch mentor sessions.' });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'INVALID_SESSION_ID', message: 'Invalid session identifier.' });
    }

    let ownerFilter;
    if (req.user.role === 'mentor') {
      ownerFilter = { mentor: req.user.id };
    } else if (req.user.role === 'mentee') {
      ownerFilter = { mentee: req.user.id };
    } else {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentors or mentees can update sessions.' });
    }

    const session = await Session.findOne({ _id: id, ...ownerFilter })
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email');

    if (!session) {
      return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND', message: 'Session not found for this account.' });
    }

    const { attended, tasksCompleted, notes } = req.body || {};
    if (typeof attended !== 'undefined' && typeof attended !== 'boolean') {
      return res.status(400).json({ success: false, error: 'INVALID_ATTENDED_FLAG', message: 'attended must be a boolean value.' });
    }

    if (typeof tasksCompleted !== 'undefined') {
      const parsedTasks = Number(tasksCompleted);
      if (!Number.isFinite(parsedTasks) || parsedTasks < 0) {
        return res.status(400).json({ success: false, error: 'INVALID_TASK_COUNT', message: 'tasksCompleted must be a non-negative number.' });
      }
      session.tasksCompleted = Math.round(parsedTasks);
    }

    if (typeof notes !== 'undefined') {
      if (notes !== null && typeof notes !== 'string') {
        return res.status(400).json({ success: false, error: 'INVALID_NOTES', message: 'notes must be a string.' });
      }
      session.notes = notes ? notes.toString().trim() : null;
    }

    session.attended = typeof attended === 'boolean' ? attended : true;

    await session.save();

    return res.json({ success: true, session: formatSessionRow(session) });
  } catch (error) {
    console.error('completeSession error:', error);
    return res.status(500).json({ success: false, error: 'COMPLETE_SESSION_FAILED', message: 'Unable to update session.' });
  }
};

exports.getMenteeReport = async (req, res) => {
  try {
    const { filters } = parseFilters(req, 'mentee');
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
    const { filters } = parseFilters(req, 'mentee');
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
