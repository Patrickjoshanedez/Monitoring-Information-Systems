const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
	listAnnouncements,
	createAnnouncement,
	updateAnnouncement,
	deleteAnnouncement,
} = require('../controllers/announcementController');

router.get('/', auth, listAnnouncements);
router.post('/', auth, createAnnouncement);
router.put('/:id', auth, updateAnnouncement);
router.delete('/:id', auth, deleteAnnouncement);

module.exports = router;
