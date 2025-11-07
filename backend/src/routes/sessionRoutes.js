const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');

// All routes require authentication and are scoped to the logged-in mentee
router.get('/sessions', auth, sessionController.getMenteeSessions);
router.get('/sessions/report', auth, sessionController.getMenteeReport);
router.get('/sessions/export', auth, sessionController.exportMenteeData);

module.exports = router;
