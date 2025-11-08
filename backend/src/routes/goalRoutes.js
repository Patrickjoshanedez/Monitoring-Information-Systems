const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const goalController = require('../controllers/goalController');

// Create goal (mentee)
router.post('/goals', auth, goalController.createGoal);

// List mentee goals
router.get('/goals', auth, goalController.listGoals);

// Update progress or milestone
router.patch('/goals/:id/progress', auth, goalController.updateProgress);

module.exports = router;