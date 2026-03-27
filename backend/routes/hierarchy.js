const express = require('express');
const router = express.Router();
const controller = require('../controllers/hierarchyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', controller.getHierarchy);

router.post('/subjects', controller.createSubject);
router.put('/subjects/:id', controller.updateSubject);
router.delete('/subjects/:id', controller.deleteSubject);

router.post('/chapters', controller.createChapter);
router.put('/chapters/:id', controller.updateChapter);
router.delete('/chapters/:id', controller.deleteChapter);

router.post('/topics', controller.createTopic);
router.put('/topics/:id', controller.updateTopic);
router.delete('/topics/:id', controller.deleteTopic);
router.patch('/topics/:id/toggle-completed', controller.toggleTopicCompleted);
router.patch('/topics/:id/toggle-pinned', controller.toggleTopicPinned);

module.exports = router;
