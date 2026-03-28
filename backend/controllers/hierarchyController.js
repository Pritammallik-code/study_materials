const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Material = require('../models/Material');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Get hierarchy with optional lazy loading support
exports.getHierarchy = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { lazy, subjectId } = req.query;

    // If lazy loading is enabled and subjectId is provided, only fetch that subject's children
    if (lazy && subjectId) {
        const chapters = await Chapter.find({ userId, subjectId }).sort({ orderIndex: 1 }).lean();
        const chapterIds = chapters.map(c => c._id);
        const topics = await Topic.find({ userId, chapterId: { $in: chapterIds } }).sort({ orderIndex: 1 }).lean();

        const topicMap = topics.reduce((acc, topic) => {
            const key = topic.chapterId.toString();
            if (!acc[key]) acc[key] = [];
            acc[key].push(topic);
            return acc;
        }, {});

        const result = chapters.map(chapter => {
            chapter.topics = topicMap[chapter._id.toString()] || [];
            return chapter;
        });

        return res.json(result);
    }

    // Otherwise, fetch the entire hierarchy (default behavior)
    const subjects = await Subject.find({ userId }).sort({ orderIndex: 1 }).lean();
    const chapters = await Chapter.find({ userId }).sort({ orderIndex: 1 }).lean();
    const topics = await Topic.find({ userId }).sort({ orderIndex: 1 }).lean();

    const topicMap = topics.reduce((acc, topic) => {
        const key = topic.chapterId.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(topic);
        return acc;
    }, {});

    const chapterMap = chapters.reduce((acc, chapter) => {
        const key = chapter.subjectId.toString();
        if (!acc[key]) acc[key] = [];
        chapter.topics = topicMap[chapter._id.toString()] || [];
        acc[key].push(chapter);
        return acc;
    }, {});

    const tree = subjects.map(subject => {
        subject.chapters = chapterMap[subject._id.toString()] || [];
        return subject;
    });

    res.json(tree);
});

// Subject CRUD
exports.createSubject = asyncHandler(async (req, res) => {
    const subject = new Subject({ ...req.body, userId: req.user._id });
    await subject.save();
    logger.info(`Subject created: ${subject._id} by user ${req.user._id}`);
    res.status(201).json(subject);
});

exports.updateSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
    );
    if (!subject) {
        throw new AppError('Subject not found', 404);
    }
    logger.info(`Subject updated: ${subject._id}`);
    res.json(subject);
});

exports.deleteSubject = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const subjectId = req.params.id;

    const subject = await Subject.findOne({ _id: subjectId, userId });
    if (!subject) {
        throw new AppError('Subject not found', 404);
    }

    const chapters = await Chapter.find({ subjectId, userId });
    const chapterIds = chapters.map(c => c._id);

    const topics = await Topic.find({ chapterId: { $in: chapterIds }, userId });
    const topicIds = topics.map(t => t._id);

    const allNodeIds = [subjectId, ...chapterIds, ...topicIds];

    await Material.deleteMany({ nodeId: { $in: allNodeIds }, userId });
    await Topic.deleteMany({ _id: { $in: topicIds }, userId });
    await Chapter.deleteMany({ _id: { $in: chapterIds }, userId });
    await Subject.deleteOne({ _id: subjectId, userId });

    logger.info(`Subject deleted: ${subjectId} with ${allNodeIds.length} total nodes`);
    res.json({ message: 'Subject and all its contents deleted', deletedIds: allNodeIds });
});

// Chapter CRUD
exports.createChapter = asyncHandler(async (req, res) => {
    const chapter = new Chapter({ ...req.body, userId: req.user._id });
    await chapter.save();
    logger.info(`Chapter created: ${chapter._id} by user ${req.user._id}`);
    res.status(201).json(chapter);
});

exports.updateChapter = asyncHandler(async (req, res) => {
    const chapter = await Chapter.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
    );
    if (!chapter) {
        throw new AppError('Chapter not found', 404);
    }
    logger.info(`Chapter updated: ${chapter._id}`);
    res.json(chapter);
});

exports.deleteChapter = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const chapterId = req.params.id;

    const chapter = await Chapter.findOne({ _id: chapterId, userId });
    if (!chapter) {
        throw new AppError('Chapter not found', 404);
    }

    const topics = await Topic.find({ chapterId, userId });
    const topicIds = topics.map(t => t._id);

    const allNodeIds = [chapterId, ...topicIds];

    await Material.deleteMany({ nodeId: { $in: allNodeIds }, userId });
    await Topic.deleteMany({ _id: { $in: topicIds }, userId });
    await Chapter.deleteOne({ _id: chapterId, userId });

    logger.info(`Chapter deleted: ${chapterId} with ${allNodeIds.length} total nodes`);
    res.json({ message: 'Chapter and its contents deleted', deletedIds: allNodeIds });
});

// Topic CRUD
exports.createTopic = asyncHandler(async (req, res) => {
    const topic = new Topic({ ...req.body, userId: req.user._id });
    await topic.save();
    logger.info(`Topic created: ${topic._id} by user ${req.user._id}`);
    res.status(201).json(topic);
});

exports.updateTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
    );
    if (!topic) {
        throw new AppError('Topic not found', 404);
    }
    logger.info(`Topic updated: ${topic._id}`);
    res.json(topic);
});

exports.deleteTopic = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const topicId = req.params.id;

    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) {
        throw new AppError('Topic not found', 404);
    }

    await Material.deleteMany({ nodeId: topicId, userId });
    await Topic.deleteOne({ _id: topicId, userId });

    logger.info(`Topic deleted: ${topicId}`);
    res.json({ message: 'Topic deleted', deletedIds: [topicId] });
});

// Toggle isCompleted
exports.toggleTopicCompleted = asyncHandler(async (req, res) => {
    const topic = await Topic.findOne({ _id: req.params.id, userId: req.user._id });
    if (!topic) {
        throw new AppError('Topic not found', 404);
    }
    topic.isCompleted = !topic.isCompleted;
    await topic.save();
    logger.info(`Topic completed toggled: ${topic._id} to ${topic.isCompleted}`);
    res.json(topic);
});

// Toggle isPinned
exports.toggleTopicPinned = asyncHandler(async (req, res) => {
    const topic = await Topic.findOne({ _id: req.params.id, userId: req.user._id });
    if (!topic) {
        throw new AppError('Topic not found', 404);
    }
    topic.isPinned = !topic.isPinned;
    await topic.save();
    logger.info(`Topic pinned toggled: ${topic._id} to ${topic.isPinned}`);
    res.json(topic);
});
