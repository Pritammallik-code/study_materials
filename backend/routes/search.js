const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Material = require('../models/Material');
const { protect } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @route   GET /api/search
// @desc    Global search across all nodes and materials with text indexes
router.get('/', protect, searchLimiter, asyncHandler(async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ nodes: [], materials: [] });

    const searchRegex = new RegExp(query, 'i');
    const userId = req.user._id;

    // Use Promise.all for parallel queries to improve performance
    const [subjects, chapters, topics, materials] = await Promise.all([
        Subject.find({ userId, name: searchRegex }).select('name description orderIndex').lean(),
        Chapter.find({ userId, name: searchRegex }).select('name subjectId orderIndex').lean(),
        Topic.find({ userId, name: searchRegex }).select('name chapterId orderIndex isCompleted isPinned').lean(),
        Material.find({
            userId,
            $or: [
                { title: searchRegex },
                { content: searchRegex }
            ]
        }).select('title type nodeId nodeType tags').limit(50).lean() // Limit materials to 50 results
    ]);

    const nodes = [
        ...subjects.map(s => ({ ...s, type: 'SUBJECT' })),
        ...chapters.map(c => ({ ...c, type: 'CHAPTER' })),
        ...topics.map(t => ({ ...t, type: 'TOPIC' }))
    ];

    logger.info(`Search performed: query="${query}" by user ${userId}, found ${nodes.length} nodes and ${materials.length} materials`);

    res.json({ nodes, materials });
}));

module.exports = router;
