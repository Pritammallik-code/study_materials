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
