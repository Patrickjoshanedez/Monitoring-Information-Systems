const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

// Accept common doc/image types; adjust as needed
const fileFilter = (req, file, cb) => {
  const allowed = /pdf|doc|docx|ppt|pptx|xlsx|csv|txt|md|jpeg|jpg|png|webp|mp4|zip|gz|rar/;
  const ext = path.extname(file.originalname).toLowerCase();
  const ok = allowed.test(ext) || allowed.test(file.mimetype.toLowerCase());
  if (ok) return cb(null, true);
  return cb(new Error('Unsupported file type for materials'));
};

const uploadMaterial = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter,
});

module.exports = uploadMaterial;