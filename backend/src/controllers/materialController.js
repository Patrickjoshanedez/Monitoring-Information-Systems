const fs = require('fs');
const path = require('path');
const Material = require('../models/Material');
const Session = require('../models/Session');
const { fail, ok } = require('../utils/responses');
const { uploadBuffer, deleteAsset } = require('../utils/cloudinary');

const materialsFolder = process.env.CLOUDINARY_MATERIALS_FOLDER || 'mentoring/materials';

// POST /api/materials/upload
// Mentor-only upload. Optional mentee or session association.
exports.uploadMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return fail(res, 403, 'FORBIDDEN', 'Only mentors can upload materials.');
    }
    if (!req.file) {
      return fail(res, 400, 'NO_FILE', 'No file uploaded.');
    }

    const { title, description, menteeId, sessionId, visibility = 'shared', tags } = req.body || {};
    if (!title) return fail(res, 400, 'MISSING_FIELDS', 'Title is required.');

    // If sessionId provided, ensure the mentor owns the session
    if (sessionId) {
      const session = await Session.findById(sessionId).select('mentor').lean();
      if (!session || session.mentor.toString() !== req.user.id) {
        return fail(res, 403, 'FORBIDDEN', 'You can only attach materials to your own sessions.');
      }
    }

    const sanitizedBase = path
      .basename(req.file.originalname, path.extname(req.file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 120) || 'material';

    let uploadResult;
    try {
      uploadResult = await uploadBuffer(req.file.buffer, {
        folder: materialsFolder,
        resource_type: 'auto',
        public_id: `${sanitizedBase}_${Date.now()}`,
        overwrite: false,
      });
    } catch (cloudErr) {
      if (cloudErr.code === 'CLOUDINARY_NOT_CONFIGURED') {
        return fail(res, 500, 'STORAGE_NOT_CONFIGURED', cloudErr.message);
      }
      return fail(res, 502, 'STORAGE_UPLOAD_FAILED', cloudErr.message || 'Failed to upload to storage provider.');
    }

    const doc = await Material.create({
      mentor: req.user.id,
      mentee: menteeId || undefined,
      session: sessionId || undefined,
      title: String(title).trim(),
      description: description ? String(description).trim() : undefined,
      originalName: req.file.originalname,
      storedName: undefined,
      sizeBytes: uploadResult.bytes || req.file.size,
      mimeType: req.file.mimetype,
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      visibility: visibility === 'mentor-only' ? 'mentor-only' : 'shared',
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.url,
      cloudinarySecureUrl: uploadResult.secure_url,
      cloudinaryResourceType: uploadResult.resource_type,
      cloudinaryFormat: uploadResult.format,
    });

    return ok(res, { material: { id: doc._id.toString(), title: doc.title } });
  } catch (err) {
    return fail(res, 500, 'MATERIAL_UPLOAD_FAILED', err.message);
  }
};

// Helper: get session ids for mentee to filter shared materials tied to their sessions
const getMenteeSessionIds = async (menteeId) => {
  const ids = await Session.find({ mentee: menteeId }).select('_id').lean();
  return ids.map((s) => s._id);
};

// GET /api/materials
// Mentee sees materials addressed to them OR shared and tied to sessions they attended; mentor sees own (optionally filter by mentee/session).
exports.listMaterials = async (req, res) => {
  try {
    const { session, menteeId, search, limit } = req.query || {};
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const q = {};
    if (req.user.role === 'mentor') {
      q.mentor = req.user.id;
      if (menteeId) q.mentee = menteeId;
    } else {
      // mentee: explicitly addressed OR shared materials tied to their sessions
      const sessionIds = await getMenteeSessionIds(req.user.id);
      q.$or = [{ mentee: req.user.id }, { visibility: 'shared', session: { $in: sessionIds } }];
    }
    if (session) q.session = session;
    if (search) q.title = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const items = await Material.find(q)
      .sort({ createdAt: -1 })
      .limit(pageLimit)
      .select('title description originalName storedName sizeBytes mimeType tags visibility mentor mentee session createdAt')
      .lean();

    const rows = items.map((m) => ({
      id: m._id.toString(),
      title: m.title,
      description: m.description || null,
      sizeBytes: m.sizeBytes,
      mimeType: m.mimeType,
      tags: m.tags || [],
      visibility: m.visibility,
      session: m.session || null,
      mentee: m.mentee || null,
      createdAt: m.createdAt,
      downloadUrl: m.cloudinarySecureUrl || m.cloudinaryUrl || (m.storedName ? `/uploads/materials/${m.storedName}` : null),
      asset: m.cloudinaryPublicId
        ? {
            publicId: m.cloudinaryPublicId,
            resourceType: m.cloudinaryResourceType || null,
            format: m.cloudinaryFormat || null,
          }
        : null,
    }));

    return ok(res, { materials: rows }, { count: rows.length, limit: pageLimit });
  } catch (err) {
    return fail(res, 500, 'MATERIAL_LIST_FAILED', err.message);
  }
};

// GET /api/materials/:id/download (auth + access check)
exports.downloadMaterial = async (req, res) => {
  try {
    const m = await Material.findById(req.params.id).select('mentor mentee session storedName visibility').lean();
    if (!m) return fail(res, 404, 'NOT_FOUND', 'Material not found.');

    if (req.user.role === 'mentor') {
      if (m.mentor.toString() !== req.user.id) return fail(res, 403, 'FORBIDDEN', 'Access denied.');
    } else {
      // mentee: must be addressed OR shared and from one of their sessions
      const allowed = m.mentee && m.mentee.toString() === req.user.id;
      let sessionAllowed = false;
      if (!allowed && m.visibility === 'shared' && m.session) {
        const ownsSession = await Session.exists({ _id: m.session, mentee: req.user.id });
        sessionAllowed = !!ownsSession;
      }
      if (!allowed && !sessionAllowed) return fail(res, 403, 'FORBIDDEN', 'Access denied.');
    }

    if (m.cloudinarySecureUrl) {
      return res.redirect(m.cloudinarySecureUrl);
    }
    if (m.storedName) {
      return res.redirect(`/uploads/materials/${m.storedName}`);
    }
    return fail(res, 404, 'NOT_FOUND', 'Material asset missing.');
  } catch (err) {
    return fail(res, 500, 'MATERIAL_DOWNLOAD_FAILED', err.message);
  }
};

// DELETE /api/materials/:id (mentor only, delete own)
exports.deleteMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') return fail(res, 403, 'FORBIDDEN', 'Only mentors can delete materials.');
    const doc = await Material.findOne({ _id: req.params.id, mentor: req.user.id });
    if (!doc) return fail(res, 404, 'NOT_FOUND', 'Material not found.');

    await Material.deleteOne({ _id: doc._id });
    if (doc.cloudinaryPublicId) {
      deleteAsset(doc.cloudinaryPublicId, doc.cloudinaryResourceType).catch(() => {});
    }
    if (doc.storedName) {
      const filePath = path.join(__dirname, `../../uploads/materials/${doc.storedName}`);
      fs.promises.unlink(filePath).catch(() => {});
    }
    return ok(res, { deleted: true });
  } catch (err) {
    return fail(res, 500, 'MATERIAL_DELETE_FAILED', err.message);
  }
};