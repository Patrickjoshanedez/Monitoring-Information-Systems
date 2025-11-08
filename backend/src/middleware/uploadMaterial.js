const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/materials');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(file.originalname);
    const name = path.basename(sanitizedName, ext);
    cb(null, `${name}_${Date.now()}${ext}`);
  },
});

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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter,
});

module.exports = uploadMaterial;