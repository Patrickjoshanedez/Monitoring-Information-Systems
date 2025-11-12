const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/certificateController');

// Issue a certificate (mentee requests; verifies criteria)
router.post('/certificates/issue', auth, ctrl.issueCertificate);

// List achievements (badges)
router.get('/achievements', auth, ctrl.listAchievements);

// Award an achievement to self (placeholder) — typically system- or admin-driven
router.post('/achievements/award', auth, ctrl.awardAchievement);

// Download certificate PDF
router.get('/certificates/:id/download', auth, ctrl.downloadCertificate);

// Admin: reissue certificate
router.post('/admin/certificates/:id/reissue', auth, ctrl.reissueCertificate);

module.exports = router;
