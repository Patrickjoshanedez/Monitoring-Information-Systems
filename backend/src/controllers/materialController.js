const { Types } = require('mongoose');
const Material = require('../models/Material');
const Session = require('../models/Session');
const MentorshipRequest = require('../models/MentorshipRequest');
const { fail, ok } = require('../utils/responses');
const { uploadSessionMaterial } = require('../utils/gdriveService');
const { toUserMessage } = require('../utils/gdriveErrorHandler');

const DRIVE_ERROR_STATUS_MAP = {
  GOOGLE_DRIVE_FILE_TOO_LARGE: 400,
  GOOGLE_DRIVE_UNSUPPORTED_FILE_TYPE: 400,
  GOOGLE_DRIVE_NO_FILE: 400,
  GOOGLE_DRIVE_PERMISSION_DENIED: 403,
  GOOGLE_DRIVE_FILE_NOT_FOUND: 404,
  GOOGLE_DRIVE_SERVICE_UNAVAILABLE: 503,
  NETWORK_ERROR: 503,
};

// Helper: get session ids for mentee to filter shared materials tied to their sessions
const getMenteeSessionIds = async (menteeId) => {
  const ids = await Session.find({ mentee: menteeId }).select('_id').lean();
  return ids.map((s) => s._id);
};

// POST /api/materials/sessions/:sessionId/upload
// Mentor-only upload to Google Drive with optional mentee sharing.
exports.uploadToGoogleDrive = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return fail(res, 403, 'FORBIDDEN', 'Only mentors can upload materials.');
    }

    const { sessionId } = req.params;
    const { menteeIds } = req.body || {};
    const files = Array.isArray(req.files) ? req.files : [];

    if (!sessionId) {
      return fail(res, 400, 'SESSION_REQUIRED', 'SessionId is required.');
    }

    if (!Types.ObjectId.isValid(sessionId)) {
      return fail(res, 400, 'INVALID_SESSION_ID', 'The provided sessionId is invalid.');
    }

    const session = await Session.findById(sessionId).select('mentor').lean();
    if (!session || session.mentor.toString() !== req.user.id) {
      return fail(res, 403, 'FORBIDDEN', 'You can only attach materials to your own sessions.');
    }

    if (!files.length) {
      return fail(res, 400, 'NO_FILE', 'No files uploaded.');
    }

    const normalizedMenteeIds = Array.isArray(menteeIds)
      ? menteeIds
      : typeof menteeIds === 'string'
      ? menteeIds.split(',').map((id) => id.trim()).filter(Boolean)
      : [];

    const mentees = normalizedMenteeIds.length
      ? await MentorshipRequest.find({ mentee: { $in: normalizedMenteeIds }, mentor: req.user.id, status: 'accepted' })
          .populate('mentee', 'email')
          .lean()
      : [];

    const menteeEmails = mentees.map((m) => m.mentee?.email).filter(Boolean);

    const mentorEmail = req.user.email;

    const createdMaterials = [];

    for (const file of files) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const uploaded = await uploadSessionMaterial({
          mentorId: session.mentor,
          sessionId,
          file,
          mentorEmail,
          menteeEmails,
        });

        // eslint-disable-next-line no-await-in-loop
        const doc = await Material.create({
          mentor: req.user.id,
          session: sessionId,
          title: file.originalname,
          description: undefined,
          originalName: file.originalname,
          googleDriveFileId: uploaded.googleDriveFileId,
          googleDriveWebViewLink: uploaded.googleDriveWebViewLink,
          googleDriveDownloadLink: uploaded.googleDriveDownloadLink,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.fileSize,
          folderPath: uploaded.folderPath,
          sharedWith: [
            ...menteeEmails.map((email) => ({ email, role: 'viewer' })),
          ],
          visibility: 'shared',
        });

        createdMaterials.push({
          id: doc._id.toString(),
          title: doc.title,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          googleDriveWebViewLink: doc.googleDriveWebViewLink,
          googleDriveDownloadLink: doc.googleDriveDownloadLink,
        });
      } catch (err) {
        const code = err.appCode || 'GOOGLE_DRIVE_UPLOAD_FAILED';
        const message = toUserMessage(code);
        const status = DRIVE_ERROR_STATUS_MAP[code] || 502;
        return fail(res, status, code, message);
      }
    }

    return ok(res, { materials: createdMaterials }, { count: createdMaterials.length });
  } catch (err) {
    return fail(res, 500, 'MATERIAL_UPLOAD_FAILED', err.message || 'Unable to upload materials.');
  }
};

// GET /api/materials/mentee
// Mentee sees files shared with them or explicitly targeted.
exports.getMenteeMaterials = async (req, res) => {
  try {
    if (req.user.role !== 'mentee') {
      return fail(res, 403, 'FORBIDDEN', 'Only mentees can view mentee materials.');
    }

    const { page = 1, limit = 20, search } = req.query || {};
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const baseFilter = {
      $or: [
        { mentee: req.user.id },
        { sharedWith: { $elemMatch: { email: req.user.email } } },
      ],
    };

    if (search) {
      baseFilter.title = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    const [items, total] = await Promise.all([
      Material.find(baseFilter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageLimit)
        .limit(pageLimit)
        .select('title originalName mimeType fileSize googleDriveWebViewLink googleDriveDownloadLink createdAt')
        .lean(),
      Material.countDocuments(baseFilter),
    ]);

    const rows = items.map((m) => ({
      id: m._id.toString(),
      title: m.title,
      originalName: m.originalName,
      mimeType: m.mimeType,
      fileSize: m.fileSize,
      googleDriveWebViewLink: m.googleDriveWebViewLink,
      googleDriveDownloadLink: m.googleDriveDownloadLink,
      createdAt: m.createdAt,
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageLimit));

    return ok(res, { materials: rows }, { total, page: pageNum, limit: pageLimit, totalPages });
  } catch (err) {
    return fail(res, 500, 'MENTEE_MATERIALS_FETCH_FAILED', err.message || 'Unable to fetch materials.');
  }
};

// GET /api/materials/:materialId/preview
// Validates user access and redirects to Google Drive preview URL.
exports.getMaterialPreview = async (req, res) => {
  try {
    const { materialId } = req.params;
    const m = await Material.findById(materialId)
      .select('mentor mentee googleDriveWebViewLink visibility session')
      .lean();

    if (!m) {
      return fail(res, 404, 'NOT_FOUND', 'Material not found.');
    }

    if (req.user.role === 'mentor') {
      if (m.mentor.toString() !== req.user.id) {
        return fail(res, 403, 'FORBIDDEN', 'Access denied.');
      }
    } else if (req.user.role === 'mentee') {
      const allowed = m.mentee && m.mentee.toString() === req.user.id;
      if (!allowed) {
        const sessionAllowed = m.session
          ? await Session.exists({ _id: m.session, mentee: req.user.id })
          : false;
        if (!sessionAllowed) {
          return fail(res, 403, 'FORBIDDEN', 'Access denied.');
        }
      }
    }

    if (!m.googleDriveWebViewLink) {
      return fail(res, 404, 'NOT_FOUND', 'Preview link not available.');
    }

    return res.redirect(302, m.googleDriveWebViewLink);
  } catch (err) {
    return fail(res, 500, 'MATERIAL_PREVIEW_FAILED', err.message || 'Unable to preview material.');
  }
};

// DELETE /api/materials/:id (mentor only, delete own)
// Note: for now this is a soft delete of DB record; Drive permissions can be pruned in a follow-up.
exports.deleteMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') return fail(res, 403, 'FORBIDDEN', 'Only mentors can delete materials.');
    const doc = await Material.findOne({ _id: req.params.id, mentor: req.user.id });
    if (!doc) return fail(res, 404, 'NOT_FOUND', 'Material not found.');

    await Material.deleteOne({ _id: doc._id });

    return ok(res, { deleted: true });
  } catch (err) {
    return fail(res, 500, 'MATERIAL_DELETE_FAILED', err.message || 'Unable to delete material.');
  }
};

// GET /api/materials/mentor
// Mentors can review their uploaded files, optionally filtered by session or search term
exports.getMentorMaterials = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return fail(res, 403, 'FORBIDDEN', 'Only mentors can view mentor materials.');
    }

    const { page = 1, limit = 20, search, sessionId } = req.query || {};
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = { mentor: req.user.id };

    if (sessionId && Types.ObjectId.isValid(sessionId)) {
      filter.session = sessionId;
    }

    if (search) {
      const sanitized = String(search).trim();
      if (sanitized.length) {
        filter.title = new RegExp(sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      }
    }

    const [items, total] = await Promise.all([
      Material.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageLimit)
        .limit(pageLimit)
        .select('title originalName mimeType fileSize googleDriveWebViewLink googleDriveDownloadLink createdAt session')
        .lean(),
      Material.countDocuments(filter),
    ]);

    const rows = items.map((m) => ({
      id: m._id.toString(),
      title: m.title,
      originalName: m.originalName,
      mimeType: m.mimeType,
      fileSize: m.fileSize,
      googleDriveWebViewLink: m.googleDriveWebViewLink,
      googleDriveDownloadLink: m.googleDriveDownloadLink,
      createdAt: m.createdAt,
      sessionId: m.session ? m.session.toString() : undefined,
    }));

    const meta = {
      total,
      page: pageNum,
      limit: pageLimit,
      totalPages: Math.max(1, Math.ceil(total / pageLimit)),
    };

    return ok(res, { materials: rows }, meta);
  } catch (err) {
    return fail(res, 500, 'MENTOR_MATERIALS_FETCH_FAILED', err.message || 'Unable to fetch mentor materials.');
  }
};