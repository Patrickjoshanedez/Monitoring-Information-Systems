const mongoose = require('mongoose');
const Session = require('../models/Session');
const User = require('../models/User');

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

    const total = await Session.countDocuments(filters);
    const sessions = await Session.find(filters)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('mentor', 'firstname lastname email')
      .lean();

    const rows = sessions.map((s) => ({
      id: s._id.toString(),
      subject: s.subject,
      mentor: s.mentor ? {
        id: s.mentor._id.toString(),
        name: [s.mentor.firstname, s.mentor.lastname].filter(Boolean).join(' ').trim() || s.mentor.email,
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
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('getMenteeSessions error:', error);
    return res.status(500).json({ success: false, error: 'SESSIONS_FETCH_FAILED', message: 'Unable to fetch sessions.' });
  }
};

exports.getMenteeReport = async (req, res) => {
  try {
    const { filters } = parseFilters(req);
    const all = await Session.find(filters).sort({ date: -1 }).limit(500).lean();

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
    const all = await Session.find(filters).sort({ date: -1 }).populate('mentor', 'firstname lastname').lean();

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
