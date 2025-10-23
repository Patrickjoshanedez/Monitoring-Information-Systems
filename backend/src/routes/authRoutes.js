const express = require('express');
const passport = require('passport');
const controller = require('../controllers/authController');

const router = express.Router();
const isGoogleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

router.post('/auth/register', controller.register);
router.post('/auth/login', controller.login);
router.post('/auth/forgot-password', controller.forgotPassword);
router.post('/auth/reset-password/:token', controller.resetPassword);

router.get('/auth/google', (req, res, next) => {
  if (!isGoogleConfigured) return res.status(503).json({ error: 'OAUTH_DISABLED' });
  console.log('Starting Google OAuth flow...');
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Debug endpoint to check OAuth configuration
router.get('/auth/debug', (req, res) => {
  res.json({
    googleConfigured: isGoogleConfigured,
    clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
    serverUrl: process.env.SERVER_URL,
    clientUrl: process.env.CLIENT_URL,
    callbackUrl: `${process.env.SERVER_URL || 'http://localhost:4000'}/api/auth/google/callback`
  });
});

router.get('/auth/google/callback', (req, res, next) => {
  if (!isGoogleConfigured) return res.status(503).send('Google OAuth not configured');
  
  console.log('OAuth callback received:', {
    code: req.query.code ? 'Present' : 'Missing',
    error: req.query.error,
    state: req.query.state
  });
  
  return passport.authenticate('google', (err, user, info) => {
    console.log('OAuth callback - Error:', err?.message || 'None');
    console.log('OAuth callback - User:', user ? 'User found' : 'No user');
    console.log('OAuth callback - Info:', info);
    
    if (err) {
      console.error('OAuth Error Details:', {
        code: err.code,
        message: err.message,
        status: err.status
      });
      
      // Handle specific OAuth errors
      if (err.code === 'invalid_grant') {
        return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=OAUTH_CODE_EXPIRED');
      }
      
      return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=OAUTH_ERROR');
    }
    
    if (!user) {
      console.log('OAuth: No user returned from Google');
      return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=INVALID_CREDENTIALS');
    }
    
    req.user = user;
    return controller.googleAuthCallback(req, res);
  })(req, res, next);
});

module.exports = router;


