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
  listMentorRoster,
} = require('../controllers/mentorController');

router.get('/mentors', auth, listMentors);
router.get('/mentor/mentees', auth, listMentorRoster);
router.get('/mentorship/requests', auth, listMentorshipRequests);
router.post('/mentorship/requests', auth, submitMentorshipRequest);
router.patch('/mentorship/requests/:id/accept', auth, acceptMentorshipRequest);
router.patch('/mentorship/requests/:id/decline', auth, declineMentorshipRequest);
router.patch('/mentorship/requests/:id/withdraw', auth, withdrawMentorshipRequest);

module.exports = router;
