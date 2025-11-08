const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const uploadMaterial = require('../middleware/uploadMaterial');
const materialController = require('../controllers/materialController');

// Upload material (mentor only)
router.post('/materials/upload', auth, uploadMaterial.single('file'), materialController.uploadMaterial);

// List materials (mentor sees own; mentee sees shared or addressed)
router.get('/materials', auth, materialController.listMaterials);

// Delete material (mentor only for own)
router.delete('/materials/:id', auth, materialController.deleteMaterial);

// Download material with access checks
router.get('/materials/:id/download', auth, materialController.downloadMaterial);

module.exports = router;