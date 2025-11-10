const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

// File filter: images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
  if (mimetype && extname) return cb(null, true);
  return cb(new Error('Only image files (JPG, JPEG, PNG, WEBP) are allowed for profile photos'));
};

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter
});

module.exports = uploadAvatar;
