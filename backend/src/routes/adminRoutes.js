const express = require('express');
const auth = require('../middleware/auth');
const { listMentorCapacities, overrideMentorCapacity } = require('../controllers/adminController');

const router = express.Router();

router.get('/admin/mentors/capacity', auth, listMentorCapacities);
router.patch('/admin/mentors/:mentorId/capacity', auth, overrideMentorCapacity);

module.exports = router;
