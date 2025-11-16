const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authenticate = require('../middleware/auth');
const feedbackController = require('../controllers/sessionFeedbackController');

const feedbackLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (_req, res) =>
		res.status(429).json({ success: false, error: 'RATE_LIMITED', message: 'Too many feedback requests. Please try again shortly.' }),
});

router.post('/sessions/:sessionId/feedback', authenticate, feedbackLimiter, feedbackController.createSessionFeedback);
router.put('/sessions/:sessionId/feedback', authenticate, feedbackLimiter, feedbackController.updateSessionFeedback);
router.get('/sessions/:sessionId/feedback', authenticate, feedbackController.getSessionFeedback);

router.get('/feedback/pending', authenticate, feedbackController.listPendingFeedback);
router.post('/feedback/:feedbackId/flag', authenticate, feedbackLimiter, feedbackController.flagFeedback);

router.get('/mentors/:mentorId/feedback-summary', authenticate, feedbackController.getMentorFeedbackSummary);

router.get('/feedback/admin/review-tickets', authenticate, feedbackController.listReviewTickets);
router.post('/feedback/admin/review-tickets/:ticketId/resolve', authenticate, feedbackController.resolveReviewTicket);
router.get('/feedback/admin/:feedbackId/raw', authenticate, feedbackController.getRawFeedbackForAdmin);

module.exports = router;
