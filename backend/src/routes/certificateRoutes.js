const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/certificateController');

// Issue a certificate (mentee requests; verifies criteria)
router.post('/certificates/issue', auth, ctrl.issueCertificate);

// List certificates visible to the requester (mentee: own, mentor: mentees, admin: all)
router.get('/certificates', auth, ctrl.listCertificates);

// Public verification endpoint (QR codes)
router.get('/certificates/verify/:code', ctrl.verifyCertificate);

// List achievements (badges)
router.get('/achievements', auth, ctrl.listAchievements);

// Trigger/increment an achievement (used by clients for progress displays)
router.post('/achievements/trigger', auth, ctrl.triggerAchievement);

// Download certificate PDF
router.get('/certificates/:id/download', auth, ctrl.downloadCertificate);

// Mentee: request a reissue; admin/mentor notified via audit log
router.post('/certificates/:id/reissue-request', auth, ctrl.requestReissue);

// Admin: reissue certificate
router.post('/admin/certificates/:id/reissue', auth, ctrl.reissueCertificate);

module.exports = router;
