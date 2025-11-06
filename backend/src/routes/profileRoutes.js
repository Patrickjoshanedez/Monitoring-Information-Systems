const router = require('express').Router();
const auth = require('../middleware/auth');
const uploadAvatar = require('../middleware/uploadAvatar');
const profileController = require('../controllers/profileController');

// Authenticated endpoints
router.get('/profile/me', auth, profileController.getMyProfile);
router.patch('/profile/me', auth, profileController.updateMyProfile);
router.post('/profile/photo', auth, uploadAvatar.single('photo'), profileController.afterPhotoUploaded);

// Public/mentor-facing profile (auth optional)
router.get('/profiles/:id', authOptional, profileController.getPublicProfile);

function authOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return next();
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // ignore invalid token for public view
  }
  next();
}

module.exports = router;
