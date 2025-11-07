const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPreferences, updatePreferences } = require('../controllers/notificationController');
const {
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} = require('../controllers/mentorController');

router.get('/', auth, listNotifications);
router.patch('/read-all', auth, markAllNotificationsRead);
router.patch('/:id/read', auth, markNotificationRead);
router.get('/preferences', auth, getPreferences);
router.put('/preferences', auth, updatePreferences);

module.exports = router;
