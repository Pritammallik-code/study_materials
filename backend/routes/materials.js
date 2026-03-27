const express = require('express');
const router = express.Router();
const controller = require('../controllers/materialController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/node/:nodeId', controller.getMaterialsByNode);
router.get('/:id/file', controller.getMaterialFile);
router.post('/', upload.single('file'), controller.createMaterial);
router.put('/:id', upload.single('file'), controller.updateMaterial);
router.delete('/:id', controller.deleteMaterial);

module.exports = router;
