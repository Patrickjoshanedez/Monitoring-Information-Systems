const express = require('express');
const passport = require('passport');
const controller = require('../controllers/authController');

const router = express.Router();
const isGoogleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password/:token', controller.resetPassword);

router.get('/auth/google', (req, res, next) => {
  if (!isGoogleConfigured) return res.status(503).json({ error: 'OAUTH_DISABLED' });
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/auth/google/callback', (req, res, next) => {
  if (!isGoogleConfigured) return res.status(503).send('Google OAuth not configured');
  return passport.authenticate('google', (err, user) => {
    if (err) return res.status(500).send('OAuth Error');
    if (!user) return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=INVALID_CREDENTIALS');
    req.user = user;
    return controller.googleAuthCallback(req, res);
  })(req, res, next);
});

module.exports = router;


