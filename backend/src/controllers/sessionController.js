const mongoose = require('mongoose');
const Session = require('../models/Session');
const User = require('../models/User');
const ChatThread = require('../models/ChatThread');
const { getFullName } = require('../utils/person');
const { sendNotification } = require('../utils/notificationService');

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

const normalizeUserId = (value) => {
  if (!value) {
    return null;
  }

  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (!trimmed) {
    return null;
  }

  return toObjectId(trimmed) || trimmed;
};

const buildMenteeScopeFilter = (user) => {
  const rawId = (user && user.id) || user;
  const normalized = normalizeUserId(rawId);

  if (!normalized) {
    return {};
  }

  return {
    $or: [
      { mentee: normalized },
      { participants: { $elemMatch: { user: normalized } } },
    ],
  };
};

const parseFilters = (req, scope = 'mentee') => {
  const { from, to, mentor, mentee, topic, page, limit } = req.query || {};
  const filters = {};

  if (scope === 'mentor') {
    filters.mentor = normalizeUserId(req.user.id) || req.user.id;
  } else {
    const menteeFilter = buildMenteeScopeFilter(req.user);
    if (Object.keys(menteeFilter).length === 0) {
      // Ensure no unintended records are returned if the user id is missing
      filters._id = null;
    } else {
      Object.assign(filters, menteeFilter);
    }
  }

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

const summarizeParticipantEntry = (entry) => {
  if (!entry || !entry.user) {
    return null;
  }

  const person = summarizePerson(entry.user);
  if (!person) {
    return null;
  }

  return {
    ...person,
    status: entry.status || 'invited',
  };
};

const getChatThreadId = (sessionDoc) => {
  if (!sessionDoc.chatThread) return null;
  if (typeof sessionDoc.chatThread === 'string') return sessionDoc.chatThread;
  if (sessionDoc.chatThread && sessionDoc.chatThread._id) {
    return sessionDoc.chatThread._id.toString();
  }
  return null;
};

const formatInviteDate = (date) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.warn('formatInviteDate fallback:', error.message);
    return date.toISOString();
  }
};

const formatSessionRow = (sessionDoc) => {
  if (!sessionDoc) {
    return null;
  }

  const participants = Array.isArray(sessionDoc.participants)
    ? sessionDoc.participants.map(summarizeParticipantEntry).filter(Boolean)
    : [];

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
    room: sessionDoc.room || null,
    capacity: sessionDoc.capacity || (participants?.length || 1),
    isGroup: !!sessionDoc.isGroup,
    participants,
    participantCount: participants.length || (sessionDoc.mentee ? 1 : 0),
    chatThreadId: getChatThreadId(sessionDoc),
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

    query
      .limit(limit)
      .select('subject mentor mentee participants room capacity isGroup chatThread date durationMinutes attended tasksCompleted notes')
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
      .populate('participants.user', 'firstname lastname email')
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

    query
      .limit(limit)
      .select('subject mentor mentee participants room capacity isGroup chatThread date durationMinutes attended tasksCompleted notes')
      .populate('mentee', 'firstname lastname email')
      .populate('mentor', 'firstname lastname email')
      .populate('participants.user', 'firstname lastname email')
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

exports.createMentorSession = async (req, res) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentors can create sessions.' });
  }

  try {
    const { subject, date, durationMinutes = 60, room, capacity = 1, participantIds } = req.body || {};

    const trimmedSubject = typeof subject === 'string' ? subject.trim() : '';
    if (!trimmedSubject) {
      return res.status(400).json({ success: false, error: 'SUBJECT_REQUIRED', message: 'Session subject is required.' });
    }

    const trimmedRoom = typeof room === 'string' ? room.trim() : '';
    if (!trimmedRoom) {
      return res.status(400).json({ success: false, error: 'ROOM_REQUIRED', message: 'Please provide a room or meeting link.' });
    }

    const scheduledDate = date ? new Date(date) : null;
    if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ success: false, error: 'INVALID_DATE', message: 'Provide a valid ISO date/time.' });
    }

    if (scheduledDate.getTime() < Date.now() - 60_000) {
      return res.status(400).json({ success: false, error: 'PAST_DATE_NOT_ALLOWED', message: 'Session date must be in the future.' });
    }

    const parsedDuration = Math.min(240, Math.max(15, Number(durationMinutes) || 60));
    const parsedCapacity = Math.min(200, Math.max(1, Number(capacity) || 1));

    const rawParticipants = Array.isArray(participantIds) ? participantIds : [];
    const normalizedParticipants = [...new Set(rawParticipants.map((id) => (id ? id.toString().trim() : '')).filter(Boolean))];

    if (!normalizedParticipants.length) {
      return res.status(400).json({ success: false, error: 'PARTICIPANTS_REQUIRED', message: 'Select at least one mentee.' });
    }

    if (normalizedParticipants.includes(req.user.id)) {
      return res.status(400).json({ success: false, error: 'INVALID_PARTICIPANT', message: 'You cannot add yourself as a participant.' });
    }

    if (normalizedParticipants.length > parsedCapacity) {
      return res.status(400).json({ success: false, error: 'CAPACITY_EXCEEDED', message: 'Capacity must be greater than or equal to the number of invitees.' });
    }

    const mentees = await User.find({ _id: { $in: normalizedParticipants } })
      .select('firstname lastname email role applicationStatus');

    if (mentees.length !== normalizedParticipants.length) {
      return res.status(404).json({ success: false, error: 'MENTEE_NOT_FOUND', message: 'One or more invitees could not be found.' });
    }

    const invalidInvitees = mentees.filter((mentee) => mentee.role !== 'mentee');
    if (invalidInvitees.length) {
      return res.status(400).json({ success: false, error: 'INVITEE_NOT_ELIGIBLE', message: 'All invitees must be registered as mentees.' });
    }

    const participantDocs = mentees.map((mentee) => ({
      user: mentee._id,
      status: 'invited',
    }));

    const mentorObjectId = new mongoose.Types.ObjectId(req.user.id);
    const session = await Session.create({
      mentor: mentorObjectId,
      mentee: participantDocs.length === 1 ? participantDocs[0].user : undefined,
      subject: trimmedSubject,
      date: scheduledDate,
      durationMinutes: parsedDuration,
      room: trimmedRoom,
      capacity: parsedCapacity,
      isGroup: participantDocs.length > 1,
      participants: participantDocs,
    });

    const warnings = [];
    let chatThreadId = null;

    try {
      const threadParticipantIds = [mentorObjectId, ...participantDocs.map((entry) => entry.user)];
      const thread = await ChatThread.create({
        type: 'session',
        title: `${trimmedSubject} (${trimmedRoom})`,
        session: session._id,
        mentor: mentorObjectId,
        participants: threadParticipantIds,
        participantStates: threadParticipantIds.map((userId) => ({ user: userId, unreadCount: 0 })),
      });

      session.chatThread = thread._id;
      chatThreadId = thread._id;
      await session.save();
    } catch (threadError) {
      console.error('mentor session chat thread failed:', threadError);
      warnings.push({
        code: 'CHAT_THREAD_SYNC_FAILED',
        message: 'Session saved but the shared chat space is still syncing. Refresh shortly to access it.',
      });
    }

    const inviteMessage = `Your mentor scheduled "${trimmedSubject}" on ${formatInviteDate(scheduledDate)} at ${trimmedRoom}.`;
    await Promise.allSettled(
      participantDocs.map((participant) =>
        sendNotification({
          userId: participant.user,
          type: 'SESSION_INVITE',
          title: 'New mentoring session scheduled',
          message: inviteMessage,
          data: {
            sessionId: session._id,
            chatThreadId,
            scheduledAt: scheduledDate,
          },
        })
      )
    );

    let hydrated;
    try {
      hydrated = await Session.findById(session._id)
        .select('subject mentor mentee participants room capacity isGroup chatThread date durationMinutes attended tasksCompleted notes')
        .populate('mentor', 'firstname lastname email')
        .populate('mentee', 'firstname lastname email')
        .populate('participants.user', 'firstname lastname email')
        .lean();
    } catch (hydrateError) {
      console.error('mentor session hydrate failed:', hydrateError);
      warnings.push({
        code: 'SESSION_LOOKUP_DELAYED',
        message: 'Session saved but details may take a moment to appear. Try refreshing if it is missing.',
      });
    }

    let responseRow = hydrated ? formatSessionRow(hydrated) : null;
    if (!responseRow) {
      // Fallback to a minimal payload using already-loaded mentee docs
      const menteeLookup = new Map(mentees.map((mentee) => [mentee._id.toString(), mentee]));
      const fallbackParticipants = participantDocs.map((entry) => {
        const relatedUser = menteeLookup.get(entry.user.toString());
        return relatedUser ? { ...entry, user: relatedUser } : entry;
      });

      let fallbackMentor = null;
      try {
        fallbackMentor = await User.findById(req.user.id).select('firstname lastname email').lean();
      } catch (mentorLookupError) {
        console.error('mentor session mentor lookup failed:', mentorLookupError);
      }

      const fallbackDoc = {
        _id: session._id,
        subject: session.subject,
        mentor: fallbackMentor,
        mentee: fallbackParticipants.length === 1 ? fallbackParticipants[0].user : null,
        participants: fallbackParticipants,
        room: session.room,
        capacity: session.capacity,
        isGroup: session.isGroup,
        chatThread: chatThreadId,
        date: session.date,
        durationMinutes: session.durationMinutes,
        attended: session.attended,
        tasksCompleted: session.tasksCompleted,
        notes: session.notes,
      };

      responseRow = formatSessionRow(fallbackDoc) || {
        id: session._id.toString(),
        subject: session.subject,
        mentor: fallbackMentor ? summarizePerson(fallbackMentor) : null,
        mentee: null,
        participants: [],
        participantCount: fallbackParticipants.length,
        room: session.room,
        capacity: session.capacity,
        isGroup: session.isGroup,
        chatThreadId: chatThreadId ? chatThreadId.toString() : null,
        date: session.date,
        durationMinutes: session.durationMinutes,
        attended: !!session.attended,
        tasksCompleted: session.tasksCompleted || 0,
        notes: session.notes || null,
      };
    }

    const meta = warnings.length ? { warnings } : undefined;

    return res.status(201).json({ success: true, session: responseRow, ...(meta ? { meta } : {}) });
  } catch (error) {
    console.error('createMentorSession error:', error);
    return res.status(500).json({ success: false, error: 'SESSION_CREATE_FAILED', message: 'Unable to create session.' });
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
      ownerFilter = { mentor: normalizeUserId(req.user.id) || req.user.id };
    } else if (req.user.role === 'mentee') {
      ownerFilter = buildMenteeScopeFilter(req.user);
    } else {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentors or mentees can update sessions.' });
    }

    const session = await Session.findOne({ _id: id, ...ownerFilter })
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
      .populate('participants.user', 'firstname lastname email');

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
