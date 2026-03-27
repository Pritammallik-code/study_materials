const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Material = require('../models/Material');
const { protect } = require('../middleware/auth');

// @route   GET /api/search
// @desc    Global search across all nodes and materials
router.get('/', protect, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json({ nodes: [], materials: [] });

        const searchRegex = new RegExp(query, 'i');
        const userId = req.user._id;

        // 1. Search Nodes (Subject, Chapter, Topic)
        const subjects = await Subject.find({ userId, name: searchRegex }).lean();
        const chapters = await Chapter.find({ userId, name: searchRegex }).lean();
        const topics = await Topic.find({ userId, name: searchRegex }).lean();

        const nodes = [
            ...subjects.map(s => ({ ...s, type: 'SUBJECT' })),
            ...chapters.map(c => ({ ...c, type: 'CHAPTER' })),
            ...topics.map(t => ({ ...t, type: 'TOPIC' }))
        ];

        // 2. Search Materials (Title or Content)
        const materials = await Material.find({ 
            userId, 
            $or: [
                { title: searchRegex },
                { content: searchRegex }
            ]
        }).lean();

        res.json({ nodes, materials });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
