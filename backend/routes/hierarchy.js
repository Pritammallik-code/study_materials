const express = require('express');
const router = express.Router();
const controller = require('../controllers/hierarchyController');
const { protect } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validation');

router.use(protect);

router.get('/', controller.getHierarchy);

// Subject routes
router.post('/subjects', validate('createSubject'), controller.createSubject);
router.put('/subjects/:id', validateObjectId('id'), validate('updateSubject'), controller.updateSubject);
router.delete('/subjects/:id', validateObjectId('id'), controller.deleteSubject);

// Chapter routes
router.post('/chapters', validate('createChapter'), controller.createChapter);
router.put('/chapters/:id', validateObjectId('id'), validate('updateChapter'), controller.updateChapter);
router.delete('/chapters/:id', validateObjectId('id'), controller.deleteChapter);

// Topic routes
router.post('/topics', validate('createTopic'), controller.createTopic);
router.put('/topics/:id', validateObjectId('id'), validate('updateTopic'), controller.updateTopic);
router.delete('/topics/:id', validateObjectId('id'), controller.deleteTopic);
router.patch('/topics/:id/toggle-completed', validateObjectId('id'), controller.toggleTopicCompleted);
router.patch('/topics/:id/toggle-pinned', validateObjectId('id'), controller.toggleTopicPinned);

module.exports = router;
