const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const progressController = require('../controllers/progressController');

router.get('/progress-dashboard', auth, progressController.getProgressDashboard);

module.exports = router;