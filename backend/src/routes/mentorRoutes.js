const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  listMentors,
  submitMentorshipRequest,
  listMentorshipRequests,
  acceptMentorshipRequest,
  declineMentorshipRequest,
  withdrawMentorshipRequest,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/mentorController');

router.get('/mentors', auth, listMentors);
router.get('/mentorship/requests', auth, listMentorshipRequests);
router.post('/mentorship/requests', auth, submitMentorshipRequest);
router.patch('/mentorship/requests/:id/accept', auth, acceptMentorshipRequest);
router.patch('/mentorship/requests/:id/decline', auth, declineMentorshipRequest);
router.patch('/mentorship/requests/:id/withdraw', auth, withdrawMentorshipRequest);

router.get('/notifications', auth, listNotifications);
router.patch('/notifications/:id/read', auth, markNotificationRead);
router.patch('/notifications/read-all', auth, markAllNotificationsRead);

module.exports = router;
