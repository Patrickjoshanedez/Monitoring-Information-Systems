const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { listAnnouncements, createAnnouncement } = require('../controllers/announcementController');

router.get('/', auth, listAnnouncements);
router.post('/', auth, createAnnouncement);

module.exports = router;
