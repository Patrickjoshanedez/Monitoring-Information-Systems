const router = require('express').Router();
const auth = require('../middleware/auth');
const calendarIntegrationController = require('../controllers/calendarIntegrationController');

router.get('/integrations/google-calendar/status', auth, calendarIntegrationController.getStatus);
router.get('/integrations/google-calendar/auth-url', auth, calendarIntegrationController.getAuthUrl);
router.post('/integrations/google-calendar/disconnect', auth, calendarIntegrationController.disconnect);
router.get('/integrations/google-calendar/callback', calendarIntegrationController.handleCallback);

module.exports = router;
