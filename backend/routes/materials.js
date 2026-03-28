const express = require('express');
const router = express.Router();
const controller = require('../controllers/materialController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/node/:nodeId', controller.getMaterialsByNode);
router.post('/', controller.createMaterial);
router.get('/fetch-title', controller.fetchUrlMetadata);
router.put('/:id', controller.updateMaterial);
router.delete('/:id', controller.deleteMaterial);

module.exports = router;
