const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const uploadMaterialMiddleware = require('../middleware/uploadMaterial');
const materialController = require('../controllers/materialController');

// Mentor-only upload to Google Drive for a specific session
router.post(
  '/sessions/:sessionId/upload',
  auth,
  uploadMaterialMiddleware.array('files'),
  materialController.uploadToGoogleDrive,
);

// Mentee view of materials shared with them
router.get('/mentee', auth, materialController.getMenteeMaterials);

// Mentor view/managing of their own materials
router.get('/mentor', auth, materialController.getMentorMaterials);

// Preview a material via Google Drive web view link
router.get('/:materialId/preview', auth, materialController.getMaterialPreview);

// Delete material (mentor only)
router.delete('/:id', auth, materialController.deleteMaterial);

module.exports = router;