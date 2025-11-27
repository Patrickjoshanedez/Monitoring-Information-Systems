const express = require('express');
const auth = require('../middleware/auth');
const { listMentorCapacities, overrideMentorCapacity } = require('../controllers/adminController');
const {
	listPairings,
	getPairingDetail,
	updatePairing,
} = require('../controllers/adminMatchingController');

const router = express.Router();

router.get('/admin/mentors/capacity', auth, listMentorCapacities);
router.patch('/admin/mentors/:mentorId/capacity', auth, overrideMentorCapacity);
router.get('/admin/matching/pairings', auth, listPairings);
router.get('/admin/matching/pairings/:pairingId', auth, getPairingDetail);
router.patch('/admin/matching/pairings/:pairingId', auth, updatePairing);

module.exports = router;
