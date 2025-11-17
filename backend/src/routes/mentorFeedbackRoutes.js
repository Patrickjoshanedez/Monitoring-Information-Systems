const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authenticate = require('../middleware/auth');
const mentorFeedbackController = require('../controllers/mentorFeedbackController');

const mentorFeedbackLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 12,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
        res
            .status(429)
            .json({
                success: false,
                error: 'RATE_LIMITED',
                message: 'Too many mentor feedback actions. Please try again shortly.',
            }),
});

router.post(
    '/sessions/:sessionId/mentor-feedback',
    authenticate,
    mentorFeedbackLimiter,
    mentorFeedbackController.createMentorFeedback
);
router.put(
    '/sessions/:sessionId/mentor-feedback',
    authenticate,
    mentorFeedbackLimiter,
    mentorFeedbackController.updateMentorFeedback
);
router.get(
    '/sessions/:sessionId/mentor-feedback',
    authenticate,
    mentorFeedbackController.getMentorFeedbackForSession
);

router.get('/mentor-feedback/progress', authenticate, mentorFeedbackController.getOwnProgressSnapshot);
router.get(
    '/mentor-feedback/mentees/:menteeId/progress',
    authenticate,
    mentorFeedbackController.getProgressSnapshotForMentee
);
router.get(
    '/mentor-feedback/:feedbackId/audit',
    authenticate,
    mentorFeedbackController.listFeedbackAuditEvents
);

module.exports = router;
