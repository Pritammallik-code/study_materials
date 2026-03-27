const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');

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
        await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Subject deleted' });
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
        await Chapter.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Chapter deleted' });
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
        await Topic.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Topic deleted' });
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
