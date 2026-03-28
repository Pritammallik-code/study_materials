const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Material = require('../models/Material');

exports.getHierarchy = async (req, res) => {
    try {
        const userId = req.user._id;
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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Subject CRUD
exports.createSubject = async (req, res) => {
    try {
        const subject = new Subject({ ...req.body, userId: req.user._id });
        await subject.save();
        res.status(201).json(subject);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.updateSubject = async (req, res) => {
    try {
        const subject = await Subject.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
        res.json(subject);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.deleteSubject = async (req, res) => {
    try {
        const userId = req.user._id;
        const subjectId = req.params.id;
        
        const subject = await Subject.findOne({ _id: subjectId, userId });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        
        const chapters = await Chapter.find({ subjectId, userId });
        const chapterIds = chapters.map(c => c._id);
        
        const topics = await Topic.find({ chapterId: { $in: chapterIds }, userId });
        const topicIds = topics.map(t => t._id);
        
        const allNodeIds = [subjectId, ...chapterIds, ...topicIds];
        
        await Material.deleteMany({ nodeId: { $in: allNodeIds }, userId });
        await Topic.deleteMany({ _id: { $in: topicIds }, userId });
        await Chapter.deleteMany({ _id: { $in: chapterIds }, userId });
        await Subject.deleteOne({ _id: subjectId, userId });
        
        res.json({ message: 'Subject and all its contents deleted', deletedIds: allNodeIds });
    } catch (error) { res.status(400).json({ message: error.message }); }
};

// Chapter CRUD
exports.createChapter = async (req, res) => {
    try {
        const chapter = new Chapter({ ...req.body, userId: req.user._id });
        await chapter.save();
        res.status(201).json(chapter);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.updateChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
        res.json(chapter);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.deleteChapter = async (req, res) => {
    try {
        const userId = req.user._id;
        const chapterId = req.params.id;

        const chapter = await Chapter.findOne({ _id: chapterId, userId });
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        const topics = await Topic.find({ chapterId, userId });
        const topicIds = topics.map(t => t._id);
        
        const allNodeIds = [chapterId, ...topicIds];

        await Material.deleteMany({ nodeId: { $in: allNodeIds }, userId });
        await Topic.deleteMany({ _id: { $in: topicIds }, userId });
        await Chapter.deleteOne({ _id: chapterId, userId });

        res.json({ message: 'Chapter and its contents deleted', deletedIds: allNodeIds });
    } catch (error) { res.status(400).json({ message: error.message }); }
};

// Topic CRUD
exports.createTopic = async (req, res) => {
    try {
        const topic = new Topic({ ...req.body, userId: req.user._id });
        await topic.save();
        res.status(201).json(topic);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.updateTopic = async (req, res) => {
    try {
        const topic = await Topic.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
        res.json(topic);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.deleteTopic = async (req, res) => {
    try {
        const userId = req.user._id;
        const topicId = req.params.id;

        const topic = await Topic.findOne({ _id: topicId, userId });
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        await Material.deleteMany({ nodeId: topicId, userId });
        await Topic.deleteOne({ _id: topicId, userId });

        res.json({ message: 'Topic deleted', deletedIds: [topicId] });
    } catch (error) { res.status(400).json({ message: error.message }); }
};

// Toggle isCompleted
exports.toggleTopicCompleted = async (req, res) => {
    try {
        const topic = await Topic.findOne({ _id: req.params.id, userId: req.user._id });
        if (!topic) return res.status(404).json({ message: 'Topic not found' });
        topic.isCompleted = !topic.isCompleted;
        await topic.save();
        res.json(topic);
    } catch (error) { res.status(400).json({ message: error.message }); }
};

// Toggle isPinned
exports.toggleTopicPinned = async (req, res) => {
    try {
        const topic = await Topic.findOne({ _id: req.params.id, userId: req.user._id });
        if (!topic) return res.status(404).json({ message: 'Topic not found' });
        topic.isPinned = !topic.isPinned;
        await topic.save();
        res.json(topic);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
