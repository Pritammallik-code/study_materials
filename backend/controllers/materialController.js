const Material = require('../models/Material');

exports.getMaterialsByNode = async (req, res) => {
    try {
        const filter = { nodeId: req.params.nodeId, userId: req.user._id };
        if (req.query.tag) filter.tags = req.query.tag;
        const materials = await Material.find(filter).sort({ orderIndex: 1 });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createMaterial = async (req, res) => {
    try {
        const data = { ...req.body, userId: req.user._id };
        const material = new Material(data);
        await material.save();
        res.status(201).json(material);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateMaterial = async (req, res) => {
    try {
        const data = { ...req.body };
        const material = await Material.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id }, 
            data, 
            { returnDocument: 'after' }
        );
        res.json(material);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        await Material.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Material deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.fetchUrlMetadata = async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ message: 'URL is required' });

    try {
        // Simple fetch and regex to avoid large dependencies
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StudyAppBot/1.0' }
        });
        if (!response.ok) throw new Error('Failed to fetch URL');
        const html = await response.text();
        
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        
        res.json({ title });
    } catch (error) {
        // Silently fails on frontend mostly, return 200 with empty title so it doesn't break app
        res.json({ title: '' });
    }
};
