const express = require('express');
const router = express.Router();
const controller = require('../controllers/materialController');
const { protect } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validation');

router.use(protect);

router.get('/node/:nodeId', validateObjectId('nodeId'), controller.getMaterialsByNode);
router.post('/', validate('createMaterial'), controller.createMaterial);
router.put('/:id', validateObjectId('id'), validate('updateMaterial'), controller.updateMaterial);
router.delete('/:id', validateObjectId('id'), controller.deleteMaterial);

module.exports = router;
