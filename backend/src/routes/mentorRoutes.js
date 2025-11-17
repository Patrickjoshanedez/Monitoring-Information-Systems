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
const availabilityController = require('../controllers/availabilityController');

router.get('/mentors', auth, listMentors);
router.get('/mentor/mentees', auth, listMentorRoster);
router.get('/mentorship/requests', auth, listMentorshipRequests);
router.post('/mentorship/requests', auth, submitMentorshipRequest);
router.patch('/mentorship/requests/:id/accept', auth, acceptMentorshipRequest);
router.patch('/mentorship/requests/:id/decline', auth, declineMentorshipRequest);
router.patch('/mentorship/requests/:id/withdraw', auth, withdrawMentorshipRequest);
router.get('/mentors/:mentorId/availability', auth, availabilityController.listMentorAvailability);
router.post('/mentors/:mentorId/availability', auth, availabilityController.createMentorAvailability);
router.patch('/mentors/:mentorId/availability/:availabilityId', auth, availabilityController.updateMentorAvailability);
router.delete('/mentors/:mentorId/availability/:availabilityId', auth, availabilityController.deleteMentorAvailability);

module.exports = router;
