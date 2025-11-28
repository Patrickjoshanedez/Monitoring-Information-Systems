const express = require('express');
const auth = require('../middleware/auth');
const { listMentorCapacities, overrideMentorCapacity } = require('../controllers/adminController');
const {
	listPairings,
	getPairingDetail,
	updatePairing,
} = require('../controllers/adminMatchingController');
const {
	listAdminUsers,
	getAdminUserDetail,
	handleAdminUserAction,
	listAdminSessions,
	updateAdminSessionReview,
} = require('../controllers/adminUserController');
const {
	sendAdminNotification,
	listAdminNotificationLogs,
} = require('../controllers/adminNotificationController');
const {
	listMentorFeedback,
	getMentorFeedbackSummary,
	exportMentorFeedbackCsv,
	updateMentorFeedbackModeration,
} = require('../controllers/adminFeedbackController');

const router = express.Router();

const ensureAdmin = (req, res, next) => {
	if (!req.user || req.user.role !== 'admin') {
		return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Admin access required' });
	}
	return next();
};

router.get('/admin/mentors/capacity', auth, ensureAdmin, listMentorCapacities);
router.patch('/admin/mentors/:mentorId/capacity', auth, ensureAdmin, overrideMentorCapacity);
router.get('/admin/matching/pairings', auth, ensureAdmin, listPairings);
router.get('/admin/matching/pairings/:pairingId', auth, ensureAdmin, getPairingDetail);
router.patch('/admin/matching/pairings/:pairingId', auth, ensureAdmin, updatePairing);
router.get('/admin/users', auth, ensureAdmin, listAdminUsers);
router.get('/admin/users/:userId', auth, ensureAdmin, getAdminUserDetail);
router.post('/admin/users/:userId/actions', auth, ensureAdmin, handleAdminUserAction);
router.get('/admin/sessions', auth, ensureAdmin, listAdminSessions);
router.patch('/admin/sessions/:sessionId/review', auth, ensureAdmin, updateAdminSessionReview);
router.post('/admin/notifications', auth, ensureAdmin, sendAdminNotification);
router.get('/admin/notifications/logs', auth, ensureAdmin, listAdminNotificationLogs);
router.get('/admin/feedback/mentor', auth, ensureAdmin, listMentorFeedback);
router.get('/admin/feedback/mentor/summary', auth, ensureAdmin, getMentorFeedbackSummary);
router.get('/admin/feedback/mentor/export', auth, ensureAdmin, exportMentorFeedbackCsv);
router.patch('/admin/feedback/mentor/:feedbackId/moderation', auth, ensureAdmin, updateMentorFeedbackModeration);

module.exports = router;
