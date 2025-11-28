const express = require('express');
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/reports/admin/overview', auth, reportController.getAdminReportOverview);
router.get('/reports/admin/export', auth, reportController.exportAdminReport);

module.exports = router;
