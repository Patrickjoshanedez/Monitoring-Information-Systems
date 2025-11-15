const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');

// All routes require authentication. Some are scoped to the logged-in mentee and others to mentors.
router.get('/sessions', auth, sessionController.getMenteeSessions);
router.get('/mentor/sessions', auth, sessionController.getMentorSessions);
router.get('/sessions/report', auth, sessionController.getMenteeReport);
router.get('/sessions/export', auth, sessionController.exportMenteeData);
router.patch('/sessions/:id/complete', auth, sessionController.completeSession);

module.exports = router;
