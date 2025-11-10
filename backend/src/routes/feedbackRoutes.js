const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');

router.post('/sessions/:sessionId', authenticate, feedbackController.submitSessionFeedback);
router.get('/pending', authenticate, feedbackController.listPendingFeedback);
router.get('/mentor/:mentorId/summary', authenticate, feedbackController.getMentorFeedbackSummary);
router.get('/admin', authenticate, feedbackController.listAdminFeedback);

module.exports = router;
